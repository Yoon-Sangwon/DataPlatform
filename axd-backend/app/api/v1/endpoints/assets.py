from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.crud.crud_asset import asset as crud_asset
from app.schemas.asset import AssetResponse
from app.models.all_models import Service, AssetColumn, DataLineage, AssetComment, DataAsset

router = APIRouter()

@router.get("/services")
def read_services(db: Session = Depends(get_db)):
    return db.query(Service).all()

@router.get("/", response_model=List[AssetResponse])
def read_assets(
    db: Session = Depends(get_db),
    service_id: Optional[str] = None
):
    query = db.query(DataAsset)
    if service_id:
        query = query.filter(DataAsset.service_id == service_id)
    assets = query.all()
    
    result = []
    for a in assets:
        is_masked = a.requires_permission
        asset_res = AssetResponse.model_validate(a)
        asset_res.isMasked = is_masked
        # [데모용] 모든 권한을 True로 설정하여 마스킹 해제 (관리자 계정 시나리오)
        asset_res.hasPermission = True 
        
        # 권한이 없을 때만 이름을 마스킹해야 하는데, 현재는 데모이므로 마스킹 처리 안 함
        if is_masked and not asset_res.hasPermission:
            asset_res.name = "****"
        result.append(asset_res)
        
    return result

@router.get("/{asset_id}", response_model=AssetResponse)
def read_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    a = db.query(DataAsset).filter(DataAsset.id == asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset_res = AssetResponse.model_validate(a)
    asset_res.isMasked = a.requires_permission
    # [데모용] 모든 권한을 True로 설정
    asset_res.hasPermission = True
    
    if asset_res.isMasked and not asset_res.hasPermission:
        asset_res.name = "****"
        
    return asset_res

@router.get("/{asset_id}/columns")
def read_asset_columns(asset_id: str, db: Session = Depends(get_db)):
    return db.query(AssetColumn).filter(AssetColumn.asset_id == asset_id).order_by(AssetColumn.ordinal_position).all()

@router.get("/{asset_id}/lineage")
def read_asset_lineage(asset_id: str, db: Session = Depends(get_db)):
    return db.query(DataLineage).filter(
        (DataLineage.source_asset_id == asset_id) | (DataLineage.target_asset_id == asset_id)
    ).all()

@router.get("/{asset_id}/comments")
def read_asset_comments(asset_id: str, db: Session = Depends(get_db)):
    return db.query(AssetComment).filter(AssetComment.asset_id == asset_id).all()

@router.get("/{asset_id}/preview")
def get_asset_preview(asset_id: str, db: Session = Depends(get_db)):
    from app.models.all_models import SampleData
    
    # SampleData 테이블에서 해당 asset_id의 데이터를 조회
    samples = db.query(SampleData).filter(SampleData.asset_id == asset_id).limit(100).all()
    
    # JSON 데이터만 추출하여 리스트로 반환
    return [s.row_data for s in samples]
