from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import Location
from app.schemas.location import LocationCreate, LocationUpdate

def get_location(db: Session, location_id: str) -> Optional[Location]:
    """Get location by ID."""
    return db.query(Location).filter(Location.id == location_id).first()

def get_locations(db: Session, skip: int = 0, limit: int = 100) -> List[Location]:
    """Get all locations with pagination."""
    return db.query(Location).offset(skip).limit(limit).all()

def get_location_by_name(db: Session, name: str) -> Optional[Location]:
    """Get location by name."""
    return db.query(Location).filter(Location.name == name).first()

def create_location(db: Session, location: LocationCreate) -> Location:
    """Create new location."""
    db_location = Location(
        name=location.name,
        hierarchy=location.hierarchy
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

def update_location(db: Session, location_id: str, location_update: LocationUpdate) -> Optional[Location]:
    """Update location."""
    db_location = get_location(db, location_id)
    if not db_location:
        return None
    
    update_data = location_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_location, field, value)
    
    db.commit()
    db.refresh(db_location)
    return db_location

def delete_location(db: Session, location_id: str) -> bool:
    """Delete location."""
    db_location = get_location(db, location_id)
    if not db_location:
        return False
    
    db.delete(db_location)
    db.commit()
    return True

def get_regions(db: Session) -> List[str]:
    """Get all unique regions."""
    results = db.query(Location.hierarchy['region'].astext.label('region')).distinct().all()
    return [result.region for result in results if result.region]

def get_districts_by_region(db: Session, region: str) -> List[str]:
    """Get all districts in a region."""
    locations = db.query(Location).filter(Location.hierarchy['region'].astext == region).all()
    districts = set()
    for location in locations:
        # Properly access the JSONB data
        hierarchy_data = getattr(location, 'hierarchy', {})
        if isinstance(hierarchy_data, dict) and 'districts' in hierarchy_data:
            districts.update(hierarchy_data['districts'].keys())
    return list(districts)

def get_councils_by_district(db: Session, region: str, district: str) -> List[str]:
    """Get all councils in a district."""
    locations = db.query(Location).filter(Location.hierarchy['region'].astext == region).all()
    councils = set()
    for location in locations:
        # Properly access the JSONB data using getattr
        hierarchy_data = getattr(location, 'hierarchy', {})
        if (isinstance(hierarchy_data, dict) and 
            'districts' in hierarchy_data and 
            district in hierarchy_data['districts']):
            district_data = hierarchy_data['districts'][district]
            if isinstance(district_data, dict) and 'councils' in district_data:
                councils_list = district_data['councils']
                if isinstance(councils_list, list):
                    councils.update(councils_list)
    return list(councils)