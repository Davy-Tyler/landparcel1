from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models import Plot
from sqlalchemy import text
from shapely.geometry import Point, Polygon, shape
from shapely.ops import transform
import pyproj
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def calculate_plot_statistics(location_id: str = None) -> Dict[str, Any]:
    """
    Calculate statistics for plots in a given location
    """
    try:
        db = SessionLocal()
        
        query = db.query(Plot)
        if location_id:
            query = query.filter(Plot.location_id == location_id)
        
        plots = query.all()
        
        stats = {
            'total_plots': len(plots),
            'available_plots': len([p for p in plots if p.status == 'available']),
            'sold_plots': len([p for p in plots if p.status == 'sold']),
            'total_area': sum(float(p.area_sqm) for p in plots),
            'average_price': sum(float(p.price) for p in plots) / len(plots) if plots else 0,
            'price_range': {
                'min': min(float(p.price) for p in plots) if plots else 0,
                'max': max(float(p.price) for p in plots) if plots else 0
            }
        }
        
        db.close()
        return stats
        
    except Exception as e:
        logger.error(f"Error calculating plot statistics: {e}")
        return {'error': str(e)}

@celery_app.task
def find_plots_in_radius(lat: float, lng: float, radius_km: float) -> List[str]:
    """
    Find all plots within a given radius of a point
    """
    try:
        db = SessionLocal()
        
        # Create point geometry
        point = Point(lng, lat)
        
        # Convert radius to degrees (approximate)
        radius_deg = radius_km / 111.0
        
        # Use PostGIS to find plots within radius
        query = text("""
            SELECT id FROM plots 
            WHERE ST_DWithin(
                ST_Transform(geom, 4326),
                ST_GeomFromText(:point_wkt, 4326),
                :radius
            )
        """)
        
        result = db.execute(query, {
            'point_wkt': point.wkt,
            'radius': radius_deg
        })
        
        plot_ids = [row[0] for row in result]
        
        db.close()
        return plot_ids
        
    except Exception as e:
        logger.error(f"Error finding plots in radius: {e}")
        return []

@celery_app.task
def optimize_plot_geometries():
    """
    Background task to optimize and validate plot geometries
    """
    try:
        db = SessionLocal()
        
        # Find plots with invalid or unoptimized geometries
        query = text("""
            SELECT id, ST_AsGeoJSON(geom) as geometry 
            FROM plots 
            WHERE geom IS NOT NULL 
            AND (NOT ST_IsValid(geom) OR ST_Area(geom) = 0)
        """)
        
        result = db.execute(query)
        optimized_count = 0
        
        for row in result:
            plot_id, geometry_json = row
            
            try:
                # Parse and fix geometry
                geometry = shape(eval(geometry_json))
                
                if not geometry.is_valid:
                    # Try to fix invalid geometry
                    geometry = geometry.buffer(0)
                
                if geometry.is_valid and geometry.area > 0:
                    # Update the geometry in database
                    update_query = text("""
                        UPDATE plots 
                        SET geom = ST_GeomFromGeoJSON(:geom_json)
                        WHERE id = :plot_id
                    """)
                    
                    db.execute(update_query, {
                        'geom_json': str(geometry.__geo_interface__),
                        'plot_id': plot_id
                    })
                    
                    optimized_count += 1
                    
            except Exception as e:
                logger.warning(f"Failed to optimize geometry for plot {plot_id}: {e}")
                continue
        
        db.commit()
        db.close()
        
        return {
            'status': 'SUCCESS',
            'optimized_count': optimized_count,
            'message': f'Optimized {optimized_count} plot geometries'
        }
        
    except Exception as e:
        logger.error(f"Error optimizing plot geometries: {e}")
        return {'status': 'FAILURE', 'error': str(e)}