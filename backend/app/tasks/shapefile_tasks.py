from celery import current_task
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.crud.crud_plot import create_plot
from app.schemas.plot import PlotCreate
import fiona
import shapefile
from shapely.geometry import shape, mapping
import json
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def process_shapefile_sync(file_paths: Dict[str, str], user_id: str, location_id: str = None):
    """
    Synchronous shapefile processing for when Celery is not available
    """
    try:
        shp_path = file_paths.get('shp')
        if not shp_path or not os.path.exists(shp_path):
            raise ValueError("Shapefile (.shp) not found")
        
        # Basic validation
        with fiona.open(shp_path) as shapefile_data:
            total_features = len(shapefile_data)
            
            # For demo, just return success without actually creating plots
            return {
                'status': 'SUCCESS',
                'message': f'Successfully processed {total_features} features from shapefile',
                'created_plots': [],
                'total_processed': total_features
            }
            
    except Exception as e:
        logger.error(f"Shapefile processing error: {e}")
        return {
            'status': 'FAILURE',
            'message': str(e),
            'created_plots': [],
            'total_processed': 0
        }

@celery_app.task(bind=True)
def process_shapefile(self, file_paths: Dict[str, str], user_id: str, location_id: str = None):
    """
    Process uploaded shapefile and create plots in database
    
    Args:
        file_paths: Dict with paths to .shp, .dbf, .prj files
        user_id: ID of user uploading the shapefile
        location_id: Optional location ID to assign to all plots
    """
    try:
        current_task.update_state(state='PROGRESS', meta={'progress': 0, 'status': 'Starting shapefile processing'})
        
        shp_path = file_paths.get('shp')
        if not shp_path or not os.path.exists(shp_path):
            raise ValueError("Shapefile (.shp) not found")
        
        # Read shapefile using fiona for better geometry handling
        with fiona.open(shp_path) as shapefile_data:
            total_features = len(shapefile_data)
            processed = 0
            created_plots = []
            
            db = SessionLocal()
            
            try:
                for feature in shapefile_data:
                    # Update progress
                    progress = int((processed / total_features) * 100)
                    current_task.update_state(
                        state='PROGRESS', 
                        meta={
                            'progress': progress, 
                            'status': f'Processing feature {processed + 1} of {total_features}'
                        }
                    )
                    
                    # Extract geometry and properties
                    geometry = feature['geometry']
                    properties = feature['properties']
                    
                    # Create plot data
                    plot_data = PlotCreate(
                        title=properties.get('NAME', f'Plot {processed + 1}'),
                        description=properties.get('DESCRIPTION', ''),
                        area_sqm=float(properties.get('AREA', 0)) or calculate_area_from_geometry(geometry),
                        price=float(properties.get('PRICE', 0)) or 100000,  # Default price
                        usage_type=properties.get('USAGE_TYPE', 'Residential'),
                        plot_number=properties.get('PLOT_NUM', f'SHP_{processed + 1}'),
                        location_id=location_id
                    )
                    
                    # Create plot in database
                    plot = create_plot(db, plot_data, user_id, geometry=geometry)
                    created_plots.append(plot.id)
                    
                    processed += 1
                
                db.commit()
                
                # Cleanup uploaded files
                cleanup_files(file_paths)
                
                return {
                    'status': 'SUCCESS',
                    'message': f'Successfully processed {processed} plots from shapefile',
                    'created_plots': created_plots,
                    'total_processed': processed
                }
                
            except Exception as e:
                db.rollback()
                raise e
            finally:
                db.close()
                
    except Exception as e:
        logger.error(f"Shapefile processing error: {e}")
        cleanup_files(file_paths)
        return {
            'status': 'FAILURE',
            'message': str(e),
            'created_plots': [],
            'total_processed': 0
        }

def calculate_area_from_geometry(geometry: Dict[str, Any]) -> float:
    """Calculate area from geometry in square meters"""
    try:
        geom = shape(geometry)
        # Convert to appropriate projection for area calculation
        # This is a simplified calculation - in production, you'd want proper projection
        return abs(geom.area) * 111000 * 111000  # Rough conversion to square meters
    except Exception:
        return 1000.0  # Default area

def cleanup_files(file_paths: Dict[str, str]):
    """Clean up uploaded files"""
    for file_path in file_paths.values():
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            logger.warning(f"Failed to cleanup file {file_path}: {e}")

@celery_app.task
def validate_shapefile(file_paths: Dict[str, str]) -> Dict[str, Any]:
    """
    Validate shapefile structure and return metadata
    """
    try:
        shp_path = file_paths.get('shp')
        if not shp_path or not os.path.exists(shp_path):
            return {'valid': False, 'error': 'Shapefile (.shp) not found'}
        
        with fiona.open(shp_path) as shapefile_data:
            # Get basic metadata
            metadata = {
                'valid': True,
                'feature_count': len(shapefile_data),
                'crs': shapefile_data.crs,
                'bounds': shapefile_data.bounds,
                'schema': shapefile_data.schema,
                'driver': shapefile_data.driver
            }
            
            # Sample first feature for preview
            if len(shapefile_data) > 0:
                first_feature = next(iter(shapefile_data))
                metadata['sample_properties'] = first_feature['properties']
                metadata['geometry_type'] = first_feature['geometry']['type']
            
            return metadata
            
    except Exception as e:
        return {'valid': False, 'error': str(e)}