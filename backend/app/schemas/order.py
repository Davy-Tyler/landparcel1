from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrderBase(BaseModel):
    plot_id: str

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    order_status: Optional[str] = None

class OrderInDB(OrderBase):
    id: str
    user_id: str
    order_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Order(OrderInDB):
    pass

class OrderWithDetails(Order):
    user: Optional[dict] = None
    plot: Optional[dict] = None