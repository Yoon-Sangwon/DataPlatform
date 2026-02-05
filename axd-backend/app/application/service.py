from sqlalchemy.orm import Session
from app.domain.models import DataAsset
from app.schemas.asset import AssetResponse
from typing import List, Optional

class AssetService:
    @staticmethod
    def get_assets(db: Session, service_id: Optional[str] = None) -> List[AssetResponse]:
        query = db.query(DataAsset)
        if service_id:
            query = query.filter(DataAsset.service_id == service_id)
        
        assets = query.all()
        
        # Spring의 Service 레이어처럼 비즈니스 로직(마스킹 등)을 여기서 처리합니다.
        result = []
        for asset in assets:
            is_masked = asset.requires_permission # 실제론 여기서 복잡한 권한 체크 로직 수행
            
            asset_data = AssetResponse.from_orm(asset)
            asset_data.isMasked = is_masked
            asset_data.hasPermission = False # Default
            
            if is_masked:
                asset_data.name = "****"
            
            result.append(asset_data)
            
        return result

    @staticmethod
    def get_asset_by_id(db: Session, asset_id: str) -> Optional[DataAsset]:
        return db.query(DataAsset).filter(DataAsset.id == asset_id).first()
