from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.db.models import Order, User, Plot
from app.schemas.order import OrderCreate, OrderUpdate

def get_order(db: Session, order_id: str) -> Optional[Order]:
    """Get order by ID with user and plot details."""
    return db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.plot)
    ).filter(Order.id == order_id).first()

def get_orders(db: Session, user_id: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Order]:
    """Get orders with optional user filter."""
    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.plot)
    )
    
    if user_id:
        query = query.filter(Order.user_id == user_id)
    
    return query.offset(skip).limit(limit).all()

def create_order(db: Session, order: OrderCreate, user_id: str) -> Order:
    """Create new order."""
    db_order = Order(
        user_id=user_id,
        plot_id=order.plot_id,
        order_status="pending"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def update_order(db: Session, order_id: str, order_update: OrderUpdate) -> Optional[Order]:
    """Update order."""
    db_order = get_order(db, order_id)
    if not db_order:
        return None
    
    update_data = order_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_order, field, value)
    
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: str) -> bool:
    """Delete order."""
    db_order = get_order(db, order_id)
    if not db_order:
        return False
    
    db.delete(db_order)
    db.commit()
    return True