from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
import json
import os
import uuid
from datetime import datetime

from app.api.deps import get_current_active_user, get_admin_user
from app.db.session import get_db
from app.db.models import User as UserModel, Plot
from app.core.config import settings
from app.tasks.shapefile_tasks import process_shapefile, validate_shapefile
from app.tasks.geo_tasks import find_plots_in_radius, calculate_plot_statistics
from app.core.redis import redis_client
import aiofiles

router = APIRouter()

@router.post("/shapefile/upload")
async def upload_shapefile(
    background_tasks: BackgroundTasks,
    shp_file: UploadFile = File(...),
    dbf_file: UploadFile = File(...),
    prj_file: Optional[UploadFile] = File(None),
    location_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """
    Upload and process shapefile components
    """
    # Validate file types
    if not shp_file.filename.endswith('.shp'):
        raise HTTPException(status_code=400, detail="Invalid .shp file")
    if not dbf_file.filename.endswith('.dbf'):
        raise HTTPException(status_code=400, detail="Invalid .dbf file")
    if prj_file and not prj_file.filename.endswith('.prj'):
        raise HTTPException(status_code=400, detail="Invalid .prj file")
    
    # Create upload directory
    upload_id = str(uuid.uuid4())
    upload_dir = os.path.join(settings.UPLOAD_DIR, upload_id)
    os.makedirs(upload_dir, exist_ok=True)
    
    try:
        # Save uploaded files
        file_paths = {}
        
        # Save .shp file
        shp_path = os.path.join(upload_dir, shp_file.filename)
        async with aiofiles.open(shp_path, 'wb') as f:
            content = await shp_file.read()
            await f.write(content)
        file_paths['shp'] = shp_path
        
        # Save .dbf file
        dbf_path = os.path.join(upload_dir, dbf_file.filename)
        async with aiofiles.open(dbf_path, 'wb') as f:
            content = await dbf_file.read()
            await f.write(content)
        file_paths['dbf'] = dbf_path
        
        # Save .prj file if provided
        if prj_file:
            prj_path = os.path.join(upload_dir, prj_file.filename)
            async with aiofiles.open(prj_path, 'wb') as f:
                content = await prj_file.read()
                await f.write(content)
            file_paths['prj'] = prj_path
        
        # Validate shapefile first
        validation_result = validate_shapefile.delay(file_paths)
        validation_data = validation_result.get(timeout=30)
        
        if not validation_data.get('valid'):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid shapefile: {validation_data.get('error')}"
            )
        
        # Start background processing
        task = process_shapefile.delay(file_paths, str(current_user.id), location_id)
        
        # Cache task info in Redis
        await redis_client.set(
            f"shapefile_task:{task.id}",
            {
                'task_id': task.id,
                'user_id': str(current_user.id),
                'upload_id': upload_id,
                'started_at': datetime.utcnow().isoformat(),
                'validation_data': validation_data
            },
            expire=3600  # 1 hour
        )
        
        return {
            'task_id': task.id,
            'upload_id': upload_id,
            'status': 'PROCESSING',
            'message': 'Shapefile upload started',
            'validation_data': validation_data
        }
        
    except Exception as e:
        # Cleanup on error
        import shutil
        if os.path.exists(upload_dir):
            shutil.rmtree(upload_dir)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shapefile/status/{task_id}")
async def get_shapefile_status(
    task_id: str,
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Get status of shapefile processing task
    """
    from app.core.celery_app import celery_app
    
    # Get task info from Redis
    task_info = await redis_client.get(f"shapefile_task:{task_id}")
    if not task_info:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user owns this task
    if task_info['user_id'] != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get task result
    task_result = celery_app.AsyncResult(task_id)
    
    response = {
        'task_id': task_id,
        'status': task_result.status,
        'upload_id': task_info['upload_id'],
        'started_at': task_info['started_at']
    }
    
    if task_result.status == 'PENDING':
        response['message'] = 'Task is waiting to be processed'
    elif task_result.status == 'PROGRESS':
        response.update(task_result.info)
    elif task_result.status == 'SUCCESS':
        response.update(task_result.result)
    elif task_result.status == 'FAILURE':
        response['error'] = str(task_result.info)
    
    return response

@router.post("/plots-in-area")
async def get_plots_in_area(
    polygon_coords: List[List[float]],
    db: Session = Depends(get_db)
):
    """
    Get all plots within a polygon area
    """
    try:
        # Convert coordinates to WKT polygon
        coords_str = ','.join([f"{lng} {lat}" for lng, lat in polygon_coords])
        polygon_wkt = f"POLYGON(({coords_str},{polygon_coords[0][0]} {polygon_coords[0][1]}))"
        
        # Query plots within polygon
        query = text("""
            SELECT p.id, p.title, p.price, p.area_sqm, p.status,
                   ST_AsGeoJSON(p.geom) as geometry
            FROM plots p
            WHERE ST_Within(
                ST_Transform(p.geom, 4326),
                ST_GeomFromText(:polygon_wkt, 4326)
            )
            AND p.status = 'available'
        """)
        
        result = db.execute(query, {'polygon_wkt': polygon_wkt})
        
        plots = []
        for row in result:
            plot_data = {
                'id': row.id,
                'title': row.title,
                'price': float(row.price),
                'area_sqm': float(row.area_sqm),
                'status': row.status,
                'geometry': json.loads(row.geometry) if row.geometry else None
            }
            plots.append(plot_data)
        
        return {
            'plots': plots,
            'count': len(plots),
            'polygon': polygon_coords
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plots-near-point")
async def get_plots_near_point(
    lat: float,
    lng: float,
    radius_km: float = 5.0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get plots within radius of a point
    """
    try:
        # Use background task for complex queries
        if radius_km > 10:  # For large radius, use background task
            task = find_plots_in_radius.delay(lat, lng, radius_km)
            plot_ids = task.get(timeout=30)
            
            if plot_ids:
                plots = db.query(Plot).filter(Plot.id.in_(plot_ids)).limit(limit).all()
            else:
                plots = []
        else:
            # Direct query for small radius
            query = text("""
                SELECT * FROM plots
                WHERE ST_DWithin(
                    ST_Transform(geom, 4326),
                    ST_GeomFromText(:point_wkt, 4326),
                    :radius
                )
                AND status = 'available'
                ORDER BY ST_Distance(
                    ST_Transform(geom, 4326),
                    ST_GeomFromText(:point_wkt, 4326)
                )
                LIMIT :limit
            """)
            
            point_wkt = f"POINT({lng} {lat})"
            radius_deg = radius_km / 111.0
            
            result = db.execute(query, {
                'point_wkt': point_wkt,
                'radius': radius_deg,
                'limit': limit
            })
            
            plots = [dict(row) for row in result]
        
        return {
            'plots': plots,
            'center': {'lat': lat, 'lng': lng},
            'radius_km': radius_km,
            'count': len(plots)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics")
async def get_geo_statistics(
    location_id: Optional[str] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Get geospatial statistics for plots
    """
    # Check cache first
    cache_key = f"geo_stats:{location_id or 'all'}"
    cached_stats = await redis_client.get(cache_key)
    
    if cached_stats:
        return cached_stats
    
    # Calculate stats in background
    task = calculate_plot_statistics.delay(location_id)
    stats = task.get(timeout=30)
    
    # Cache results
    await redis_client.set(cache_key, stats, expire=300)  # 5 minutes
    
    return stats

@router.post("/validate-geometry")
async def validate_geometry(
    geometry: Dict[str, Any],
    current_user: UserModel = Depends(get_admin_user)
):
    """
    Validate GeoJSON geometry
    """
    try:
        from shapely.geometry import shape
        
        # Parse geometry
        geom = shape(geometry)
        
        validation_result = {
            'valid': geom.is_valid,
            'area': geom.area,
            'bounds': geom.bounds,
            'geometry_type': geom.geom_type
        }
        
        if not geom.is_valid:
            validation_result['error'] = 'Invalid geometry'
            # Try to get specific error
            try:
                from shapely.validation import explain_validity
                validation_result['error_detail'] = explain_validity(geom)
            except:
                pass
        
        return validation_result
        
    except Exception as e:
        return {
            'valid': False,
            'error': str(e)
        }