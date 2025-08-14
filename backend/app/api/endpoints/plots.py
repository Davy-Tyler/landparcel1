from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from decimal import Decimal

from app.api.deps import get_current_active_user, get_admin_user
from app.crud.crud_plot import (
    get_plots, get_plot, create_plot, update_plot, delete_plot,
    search_plots
)
from app.crud.crud_location import (
    get_regions, get_districts_by_region, get_councils_by_district,
    get_locations
)
from app.db.session import get_db
from app.schemas.plot import Plot, PlotCreate, PlotUpdate, PlotSearch
from app.schemas.location import Location
from app.db.models import User as UserModel, PlotStatus

router = APIRouter()

@router.get("/", response_model=List[Plot])
async def read_plots(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    min_price: Optional[Decimal] = Query(None),
    max_price: Optional[Decimal] = Query(None),
    min_area: Optional[Decimal] = Query(None),
    max_area: Optional[Decimal] = Query(None),
    location_id: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    council: Optional[str] = Query(None),
    usage_type: Optional[str] = Query(None),
    status: Optional[str] = Query("available"),
    db: Session = Depends(get_db)
):
    """Get plots with optional filtering."""
    search_params = PlotSearch(
        search=search,
        min_price=min_price,
        max_price=max_price,
        min_area=min_area,
        max_area=max_area,
        location_id=location_id,
        region=region,
        district=district,
        council=council,
        usage_type=usage_type,
        status=status
    )
    
    return search_plots(db, search_params, skip=skip, limit=limit)

@router.get("/{plot_id}", response_model=Plot)
async def read_plot(
    plot_id: str,
    db: Session = Depends(get_db)
):
    """Get plot by ID."""
    plot = get_plot(db, plot_id)
    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plot not found"
        )
    return plot

@router.post("/", response_model=Plot)
async def create_new_plot(
    plot_data: PlotCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """Create new plot (admin only)."""
    return create_plot(db, plot_data, str(current_user.id))

@router.put("/{plot_id}", response_model=Plot)
async def update_existing_plot(
    plot_id: str,
    plot_update: PlotUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """Update plot (admin only)."""
    plot = get_plot(db, plot_id)
    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plot not found"
        )
    return update_plot(db, plot_id, plot_update)

@router.delete("/{plot_id}")
async def delete_existing_plot(
    plot_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """Delete plot (admin only)."""
    plot = get_plot(db, plot_id)
    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plot not found"
        )
    delete_plot(db, plot_id)
    return {"message": "Plot deleted successfully"}

# Location endpoints
@router.get("/locations/regions", response_model=List[str])
async def read_regions(db: Session = Depends(get_db)):
    """Get all regions."""
    return get_regions(db)

@router.get("/locations/districts", response_model=List[str])
async def read_districts(
    region: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get districts, optionally filtered by region."""
    if region:
        return get_districts_by_region(db, region)
    return []

@router.get("/locations/councils", response_model=List[str])
async def read_councils(
    region: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get councils, optionally filtered by region and district."""
    if region and district:
        return get_councils_by_district(db, region, district)
    return []

@router.get("/locations", response_model=List[Location])
async def read_locations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all locations."""
    return get_locations(db, skip=skip, limit=limit)