from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, JSON, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Service(Base):
    __tablename__ = "services"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    icon = Column(String(50), default="database")
    color = Column(String(50), default="blue")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assets = relationship("DataAsset", back_populates="service")

class DataAsset(Base):
    __tablename__ = "data_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    schema_name = Column(String(255), nullable=False)
    database_name = Column(String(255), nullable=False)
    service_id = Column(String(36), ForeignKey("services.id"))
    owner_id = Column(String(36), nullable=True)
    owner_name = Column(String(255), default="")
    owner_email = Column(String(255), default="")
    tags = Column(JSON, default=list) # Using JSON for array
    business_definition = Column(Text, default="")
    doc_links = Column(JSON, default=list)
    sensitivity_level = Column(String(50), default="public")
    requires_permission = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    service = relationship("Service", back_populates="assets")
    columns = relationship("AssetColumn", back_populates="asset", cascade="all, delete-orphan")
    comments = relationship("AssetComment", back_populates="asset", cascade="all, delete-orphan")
    permissions = relationship("AssetPermission", back_populates="asset", cascade="all, delete-orphan")
    permission_requests = relationship("PermissionRequest", back_populates="asset", cascade="all, delete-orphan")

class AssetColumn(Base):
    __tablename__ = "asset_columns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("data_assets.id"), nullable=False)
    column_name = Column(String(255), nullable=False)
    data_type = Column(String(50), nullable=False)
    description = Column(Text, default="")
    is_nullable = Column(Boolean, default=True)
    dq_null_ratio = Column(Numeric, default=0)
    dq_freshness = Column(String(50), default="good")
    ordinal_position = Column(Integer, default=0)

    asset = relationship("DataAsset", back_populates="columns")

class DataLineage(Base):
    __tablename__ = "data_lineage"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_asset_id = Column(String(36), ForeignKey("data_assets.id"), nullable=True)
    target_asset_id = Column(String(36), ForeignKey("data_assets.id"), nullable=True)
    transformation_type = Column(String(50), default="ETL")
    etl_logic_summary = Column(Text, default="")
    source_name = Column(String(255), default="")
    target_name = Column(String(255), default="")
    source_type = Column(String(50), default="table")
    target_type = Column(String(50), default="table")

class AssetComment(Base):
    __tablename__ = "asset_comments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("data_assets.id"), nullable=False)
    user_id = Column(String(36), nullable=True)
    user_name = Column(String(255), default="")
    content = Column(Text, nullable=False)
    parent_id = Column(String(36), ForeignKey("asset_comments.id"), nullable=True)
    is_answer = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("DataAsset", back_populates="comments")
    replies = relationship("AssetComment", remote_side=[id])

class AssetPermission(Base):
    __tablename__ = "asset_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("data_assets.id"), nullable=False)
    user_id = Column(String(36), nullable=False)
    user_name = Column(String(255), default="")
    user_email = Column(String(255), default="")
    permission_level = Column(String(50), nullable=False)
    granted_by = Column(String(36), nullable=True)
    granted_by_name = Column(String(255), default="")
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by = Column(String(36), nullable=True)

    asset = relationship("DataAsset", back_populates="permissions")

class PermissionRequest(Base):
    __tablename__ = "permission_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("data_assets.id"), nullable=False)
    requester_id = Column(String(36), nullable=False)
    requester_name = Column(String(255), default="")
    requester_email = Column(String(255), default="")
    requested_level = Column(String(50), nullable=False)
    purpose_category = Column(String(50), nullable=False)
    reason = Column(Text, default="")
    duration = Column(String(50), default="1month")
    status = Column(String(50), default="pending")
    reviewer_id = Column(String(36), nullable=True)
    reviewer_name = Column(String(255), default="")
    reviewer_comment = Column(Text, default="")
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    asset = relationship("DataAsset", back_populates="permission_requests")

class RequestCategory(Base):
    __tablename__ = "request_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    description = Column(Text, default="")
    icon = Column(String(50), default="file")
    color = Column(String(50), default="gray")
    is_simple = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    request_types = relationship("RequestType", back_populates="category")

class RequestType(Base):
    __tablename__ = "request_types"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(36), ForeignKey("request_categories.id"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    description = Column(Text, default="")
    estimated_days = Column(Integer, default=3)
    requires_approval = Column(Boolean, default=True)
    form_schema = Column(JSON, default=list)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("RequestCategory", back_populates="request_types")
    service_requests = relationship("ServiceRequest", back_populates="request_type")

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_type_id = Column(String(36), ForeignKey("request_types.id"), nullable=False)
    requester_id = Column(String(36), nullable=False)
    requester_name = Column(String(255), default="")
    requester_email = Column(String(255), default="")
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    form_data = Column(JSON, default=dict)
    priority = Column(String(50), default="medium")
    status = Column(String(50), default="submitted")
    assignee_name = Column(String(255), nullable=True)
    assignee_email = Column(String(255), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    request_type = relationship("RequestType", back_populates="service_requests")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False)
    type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, default="")
    link = Column(String(255), default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SampleData(Base):
    __tablename__ = "sample_data"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("data_assets.id"), nullable=False)
    row_data = Column(JSON, nullable=False)  # 실제 데이터를 JSON으로 저장
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("DataAsset", backref="samples")
