from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.infrastructure.database import Base

class DataAsset(Base):
    __tablename__ = "data_assets"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    schema_name = Column(String(100))
    database_name = Column(String(100))
    service_id = Column(String(50), nullable=True)
    owner_name = Column(String(100))
    owner_email = Column(String(100))
    tags = Column(JSON)
    business_definition = Column(Text)
    doc_links = Column(JSON)
    sensitivity_level = Column(String(50))
    requires_permission = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
