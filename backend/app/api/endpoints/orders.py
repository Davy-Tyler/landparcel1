from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_admin_user
from app.crud.crud_order import get_orders, get_order, create_order, update_order
from app.crud.crud_plot import get_plot, update_plot_status
from app.db.session import get_db
from app.schemas.order import Order, OrderCreate, OrderUpdate, OrderWithDetails
from app.db.models import User as UserModel, PlotStatus

router = APIRouter()

@router.get("/", response_model=List[OrderWithDetails])
async def read_orders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get orders. Users see their own orders, admins see all."""
    if current_user.role in ["admin", "master_admin"]:
        return get_orders(db, skip=skip, limit=limit)
    else:
        return get_orders(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/{order_id}", response_model=OrderWithDetails)
async def read_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get order by ID."""
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if user owns the order or is admin
    if order.user_id != current_user.id and current_user.role not in ["admin", "master_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return order

@router.post("/", response_model=Order)
async def create_new_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Create new order."""
    # Check if plot exists and is available
    plot = get_plot(db, order_data.plot_id)
    if not plot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plot not found"
        )
    
    if plot.status != PlotStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plot is not available for purchase"
        )
    
    # Create order and update plot status
    order = create_order(db, order_data, current_user.id)
    update_plot_status(db, order_data.plot_id, PlotStatus.PENDING_PAYMENT)
    
    return order

@router.put("/{order_id}", response_model=Order)
async def update_existing_order(
    order_id: str,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """Update order status (admin only)."""
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update plot status based on order status
    if order_update.order_status == "completed":
        update_plot_status(db, order.plot_id, PlotStatus.SOLD)
    elif order_update.order_status == "cancelled":
        update_plot_status(db, order.plot_id, PlotStatus.AVAILABLE)
    
    return update_order(db, order_id, order_update)