from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class LocationBase(BaseModel):
    name: str
    hierarchy: Dict[str, Any]

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    hierarchy: Optional[Dict[str, Any]] = None

class LocationInDB(LocationBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Location(LocationInDB):
    pass

# Legacy schemas for backward compatibility
class RegionBase(BaseModel):
    name: str

class Region(RegionBase):
    id: int
    
    class Config:
        from_attributes = True

class DistrictBase(BaseModel):
    name: str
    region_id: int

class District(DistrictBase):
    id: int
    region: Optional[Region] = None
    
    class Config:
        from_attributes = True

class CouncilBase(BaseModel):
    name: str
    district_id: int

class Council(CouncilBase):
    id: int
    district: Optional[District] = None
    
    class Config:
        from_attributes = True