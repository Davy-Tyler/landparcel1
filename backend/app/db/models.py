from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, Text, ForeignKey, Enum, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import uuid
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    MASTER_ADMIN = "master_admin"
    ADMIN = "admin"
    PARTNER = "partner"
    USER = "user"

class PlotStatus(str, enum.Enum):
    AVAILABLE = "available"
    LOCKED = "locked"
    PENDING_PAYMENT = "pending_payment"
    SOLD = "sold"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(Text)
    last_name = Column(Text)
    email = Column(Text, unique=True, nullable=False, index=True)
    phone_number = Column(Text, unique=True)
    hashed_password = Column(Text, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    uploaded_plots = relationship("Plot", back_populates="uploaded_by")
    orders = relationship("Order", back_populates="user")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, unique=True, nullable=False)  # Top-level region name
    hierarchy = Column(JSONB, nullable=False)  # Full nested structure
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    plots = relationship("Plot", back_populates="location")

class Plot(Base):
    __tablename__ = "plots"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plot_number = Column(Text, unique=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    area_sqm = Column(Numeric(10, 2), nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    image_urls = Column(ARRAY(Text))
    usage_type = Column(Text, default="Residential")
    status = Column(Enum(PlotStatus), default=PlotStatus.AVAILABLE, nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"))  # Changed from council_id
    geom = Column(Geometry("POLYGON", srid=4326))
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    location = relationship("Location", back_populates="plots")  # Changed from council
    uploaded_by = relationship("User", back_populates="uploaded_plots")
    orders = relationship("Order", back_populates="plot")

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    plot_id = Column(UUID(as_uuid=True), ForeignKey("plots.id"), nullable=False)
    order_status = Column(Text, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="orders")
    plot = relationship("Plot", back_populates="orders")