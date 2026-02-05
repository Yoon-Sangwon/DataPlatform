from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.infrastructure.database import get_db
from app.application.service import AssetService
from app.schemas.asset import AssetResponse

router = APIRouter(prefix="/assets", tags=["assets"])

@router.get("", response_model=List[AssetResponse])
def read_assets(service_id: Optional[str] = None, db: Session = Depends(get_db)):
    return AssetService.get_assets(db, service_id=service_id)

@router.get("/{asset_id}", response_model=AssetResponse)
def read_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = AssetService.get_asset_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # 상세 조회 시에도 마스킹 로직 적용 가능
    is_masked = asset.requires_permission
    asset_data = AssetResponse.from_orm(asset)
    asset_data.isMasked = is_masked
    if is_masked:
        asset_data.name = "****"
        
    return asset_data
