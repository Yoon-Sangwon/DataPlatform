from sqlalchemy.orm import Session
from app.models import DataAsset
from typing import List, Optional

class CRUDAsset:
    def get_multi(self, db: Session, *, service_id: Optional[str] = None) -> List[DataAsset]:
        query = db.query(DataAsset)
        if service_id:
            query = query.filter(DataAsset.service_id == service_id)
        return query.all()

    def get(self, db: Session, id: str) -> Optional[DataAsset]:
        return db.query(DataAsset).filter(DataAsset.id == id).first()

asset = CRUDAsset()
