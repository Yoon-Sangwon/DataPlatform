from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

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

class AssetColumn(Base):
    __tablename__ = "asset_columns"

    id = Column(String(50), primary_key=True, index=True)
    asset_id = Column(String(50), ForeignKey("data_assets.id"))
    column_name = Column(String(255), nullable=False)
    data_type = Column(String(100))
    description = Column(Text)
    is_nullable = Column(Boolean, default=True)
    is_pii = Column(Boolean, default=False)
    dq_null_ratio = Column(Text)
    dq_freshness = Column(String(50))
    ordinal_position = Column(String(10))