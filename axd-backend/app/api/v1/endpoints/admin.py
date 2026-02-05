from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.all_models import PermissionRequest, ServiceRequest, AssetComment, AssetPermission
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    pending_permissions = db.query(PermissionRequest).filter(PermissionRequest.status == "pending").count()
    pending_requests = db.query(ServiceRequest).filter(ServiceRequest.status == "submitted").count()
    
    yesterday = datetime.now() - timedelta(days=1)
    new_comments = db.query(AssetComment).filter(AssetComment.created_at >= yesterday).count()
    
    # Active users is mocked for now as we don't have login history table fully defined
    active_users = 12

    return {
        "pendingPermissions": pending_permissions,
        "pendingRequests": pending_requests,
        "newComments": new_comments,
        "activeUsers": active_users
    }
