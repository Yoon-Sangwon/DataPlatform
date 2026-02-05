import sys
import os

# 현재 디렉토리를 파이썬 경로에 추가
sys.path.append(os.getcwd())

from app.database import Base, engine, SessionLocal
from app.models.all_models import *  # 모든 모델 임포트 (이게 핵심!)
from datetime import datetime, timedelta
import uuid

def get_uuid():
    return str(uuid.uuid4())

def init_db():
    print("🗑️  기존 테이블 삭제 중...")
    try:
        # 외래 키 제약 조건 때문에 순서대로 삭제하거나 체크 비활성화 필요하지만
        # drop_all이 알아서 처리해주길 기대하며 실행. 실패 시 개별 drop 필요.
        Base.metadata.drop_all(bind=engine)
    except Exception as e:
        print(f"⚠️ 테이블 삭제 중 오류 (무시 가능): {e}")

    print("🔨 새 테이블 생성 중...")
    Base.metadata.create_all(bind=engine)

    print("🌱 데이터 생성 시작...")
    db = SessionLocal()
    
    try:
        # 1. Services
        svc_analytics = Service(id=get_uuid(), name="Analytics DB", description="Core data warehouse", icon="database", color="blue")
        svc_devops = Service(id=get_uuid(), name="DevOps DB", description="CI/CD logs", icon="server", color="orange")
        svc_hr = Service(id=get_uuid(), name="HR System", description="Human Resources", icon="users", color="emerald")
        
        db.add_all([svc_analytics, svc_devops, svc_hr])
        db.flush()

        # 2. Assets & Columns
        assets_data = [
            # HR
            {"name": "employees", "schema": "hr", "svc": svc_hr, "sens": "confidential", "owner": "HR Team", "email": "hr@example.com"},
            {"name": "salaries", "schema": "hr", "svc": svc_hr, "sens": "confidential", "owner": "HR Team", "email": "hr@example.com"},
            # Logs
            {"name": "api_logs", "schema": "logs", "svc": svc_analytics, "sens": "internal", "owner": "DevOps", "email": "devops@example.com"},
            {"name": "payment_logs", "schema": "logs", "svc": svc_analytics, "sens": "confidential", "owner": "Finance", "email": "finance@example.com"},
            # Public
            {"name": "users", "schema": "public", "svc": svc_analytics, "sens": "internal", "owner": "Analytics", "email": "data@example.com"},
            {"name": "orders", "schema": "public", "svc": svc_analytics, "sens": "internal", "owner": "Sales", "email": "sales@example.com"},
            {"name": "products", "schema": "public", "svc": svc_analytics, "sens": "public", "owner": "Product", "email": "product@example.com"},
        ]

        assets_map = {}

        for item in assets_data:
            asset = DataAsset(
                id=get_uuid(),
                name=item["name"],
                description=f"Sample data for {item['name']}",
                schema_name=item["schema"],
                database_name="axd_db",
                service_id=item["svc"].id,
                owner_name=item["owner"],
                owner_email=item["email"],
                sensitivity_level=item["sens"],
                requires_permission=item["sens"] != "public",
                business_definition="Auto-generated sample asset"
            )
            db.add(asset)
            assets_map[item["name"]] = asset
            
            # Add sample columns
            db.add(AssetColumn(id=get_uuid(), asset_id=asset.id, column_name="id", data_type="uuid", ordinal_position=1))
            db.add(AssetColumn(id=get_uuid(), asset_id=asset.id, column_name="created_at", data_type="timestamp", ordinal_position=2))
            db.add(AssetColumn(id=get_uuid(), asset_id=asset.id, column_name="updated_at", data_type="timestamp", ordinal_position=3))

        # 3. Requests
        req = PermissionRequest(
            id=get_uuid(),
            asset_id=assets_map["employees"].id,
            requester_id="user-1",
            requester_name="General User",
            requester_email="user@example.com",
            requested_level="viewer",
            purpose_category="analysis",
            reason="Need access for report",
            status="pending"
        )
        db.add(req)

        db.commit()
        print("✅ 데이터 생성 완료!")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
