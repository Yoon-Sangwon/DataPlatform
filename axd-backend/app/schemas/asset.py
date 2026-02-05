from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime

class AssetBase(BaseModel):
    name: str
    description: Optional[str] = None
    schema_name: str
    database_name: str
    service_id: Optional[str] = None
    owner_name: str
    owner_email: str
    tags: List[str] = []
    business_definition: Optional[str] = None
    doc_links: List[Dict[str, str]] = []
    sensitivity_level: str
    requires_permission: bool = False

class AssetCreate(AssetBase):
    id: str

class AssetResponse(AssetBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    created_at: datetime
    updated_at: datetime
    isMasked: bool = False
    hasPermission: bool = False