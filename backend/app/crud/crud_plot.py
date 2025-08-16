from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from app.db.models import Plot, Location, PlotStatus
from app.schemas.plot import PlotCreate, PlotUpdate, PlotSearch

def create_plot(db: Session, plot: PlotCreate, user_id: str, geometry: dict = None) -> Plot:
    """Create new plot with optional geometry."""
    plot_data = plot.dict()
    
    # Handle geometry if provided
    if geometry:
        from sqlalchemy import text
        # Convert GeoJSON to PostGIS geometry
        geom_query = text("SELECT ST_GeomFromGeoJSON(:geom_json)")
        result = db.execute(geom_query, {'geom_json': str(geometry)})
        plot_data['geom'] = result.scalar()
    
    db_plot = Plot(
        **plot_data,
        uploaded_by_id=user_id
    )
    db.add(db_plot)
    db.commit()
    db.refresh(db_plot)
    return db_plot

def get_plot(db: Session, plot_id: str) -> Optional[Plot]:
    """Get plot by ID with location details."""
    return db.query(Plot).options(
        joinedload(Plot.location)
    ).filter(Plot.id == plot_id).first()

def get_plots(db: Session, skip: int = 0, limit: int = 100) -> List[Plot]:
    """Get all plots with pagination."""
    return db.query(Plot).options(
        joinedload(Plot.location)
    ).offset(skip).limit(limit).all()

def search_plots(db: Session, search_params: PlotSearch, skip: int = 0, limit: int = 100) -> List[Plot]:
    """Search plots with filters."""
    query = db.query(Plot).options(
        joinedload(Plot.location)
    )
    
    # Apply filters
    if search_params.search:
        search_term = f"%{search_params.search}%"
        query = query.filter(
            or_(
                Plot.title.ilike(search_term),
                Plot.description.ilike(search_term)
            )
        )
    
    if search_params.min_price is not None:
        query = query.filter(Plot.price >= search_params.min_price)
    
    if search_params.max_price is not None:
        query = query.filter(Plot.price <= search_params.max_price)
    
    if search_params.min_area is not None:
        query = query.filter(Plot.area_sqm >= search_params.min_area)
    
    if search_params.max_area is not None:
        query = query.filter(Plot.area_sqm <= search_params.max_area)
    
    if search_params.location_id:
        query = query.filter(Plot.location_id == search_params.location_id)
    
    # Filter by region, district, or council using JSONB queries
    if search_params.region:
        query = query.join(Location).filter(Location.hierarchy['region'].astext == search_params.region)
    
    if search_params.district:
        query = query.join(Location).filter(Location.hierarchy['districts'].has_key(search_params.district))
    
    if search_params.council:
        # Search for council in districts councils arrays
        from sqlalchemy import text
        query = query.join(Location).filter(
            text("EXISTS (SELECT 1 FROM jsonb_each(hierarchy->'districts') AS d(key, value) WHERE value->'councils' ? :council)")
        ).params(council=search_params.council)
    
    if search_params.usage_type:
        query = query.filter(Plot.usage_type == search_params.usage_type)
    
    if search_params.status:
        # Convert string status to PlotStatus enum for proper comparison
        try:
            status_enum = PlotStatus(search_params.status)
            query = query.filter(Plot.status == status_enum)
        except ValueError:
            # If invalid status provided, filter will return no results
            query = query.filter(Plot.status == search_params.status)
    
    return query.offset(skip).limit(limit).all()


def update_plot(db: Session, plot_id: str, plot_update: PlotUpdate) -> Optional[Plot]:
    """Update plot."""
    db_plot = get_plot(db, plot_id)
    if not db_plot:
        return None
    
    update_data = plot_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_plot, field, value)
    
    db.commit()
    db.refresh(db_plot)
    return db_plot

def update_plot_status(db: Session, plot_id: str, status: PlotStatus) -> Optional[Plot]:
    """Update plot status."""
    db_plot = get_plot(db, plot_id)
    if not db_plot:
        return None
    
    # Use setattr to avoid type checking issues
    setattr(db_plot, 'status', status)
    db.commit()
    db.refresh(db_plot)
    return db_plot

def delete_plot(db: Session, plot_id: str) -> bool:
    """Delete plot."""
    db_plot = get_plot(db, plot_id)
    if not db_plot:
        return False
    
    db.delete(db_plot)
    db.commit()
    return True