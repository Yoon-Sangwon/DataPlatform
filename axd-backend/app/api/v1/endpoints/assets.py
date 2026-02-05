from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.crud.crud_asset import asset as crud_asset
from app.schemas.asset import AssetResponse

router = APIRouter()

@router.get("/", response_model=List[AssetResponse])
def read_assets(
    db: Session = Depends(get_db),
    service_id: Optional[str] = None
):
    assets = crud_asset.get_multi(db, service_id=service_id)
    
    # 마스킹 비즈니스 로직 (HRP 톤앤매너: 명확한 책임 분리)
    result = []
    for a in assets:
        is_masked = a.requires_permission
        # Schema 모델로 변환 (isMasked 등 추가 필드 처리)
        asset_res = AssetResponse.model_validate(a)
        asset_res.isMasked = is_masked
        if is_masked:
            asset_res.name = "****"
        result.append(asset_res)
        
    return result

@router.get("/{asset_id}", response_model=AssetResponse)
def read_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    a = crud_asset.get(db, id=asset_id)
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset_res = AssetResponse.model_validate(a)
    asset_res.isMasked = a.requires_permission
    if asset_res.isMasked:
        asset_res.name = "****"
        
    return asset_res

@router.post("/seed")
def seed_assets(db: Session = Depends(get_db)):
    from app.models.asset import DataAsset
    import uuid
    
    if db.query(DataAsset).count() > 0:
        return {"message": "Data already exists"}
        
    sample_data = [
        DataAsset(
            id="1", name="users", description="User profile data", 
            schema_name="public", database_name="prod_db", service_id="svc-1",
            owner_name="Admin", owner_email="admin@company.com", 
            tags=["pii", "core"], sensitivity_level="confidential", requires_permission=True
        ),
        DataAsset(
            id="2", name="orders", description="Order transactions", 
            schema_name="sales", database_name="warehouse_db", service_id="svc-1",
            owner_name="Sales Team", owner_email="sales@company.com", 
            tags=["revenue"], sensitivity_level="private", requires_permission=False
        )
    ]
    db.add_all(sample_data)
    db.commit()
    return {"message": "Seed data created successfully"}
