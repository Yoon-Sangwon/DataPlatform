from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, Base, get_db
from app.models.all_models import (
    Service, DataAsset, AssetColumn, PermissionRequest, AssetPermission, 
    Notification, DataLineage, AssetComment, SampleData
)
import uuid
import random
from datetime import datetime, timedelta

router = APIRouter()

def get_uuid():
    return str(uuid.uuid4())

@router.post("/init-sample-data")
def init_sample_data(db: Session = Depends(get_db)):
    try:
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        tables = [
            "asset_columns", "asset_comments", "asset_permissions", 
            "permission_requests", "data_lineage", "service_requests", 
            "request_types", "request_categories", "notifications",
            "data_assets", "services", "sample_data"
        ]
        for t in tables:
            db.execute(text(f"DROP TABLE IF EXISTS {t};"))
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.commit()

        Base.metadata.create_all(bind=engine)

        # 1. 서비스 생성
        svc_platform = Service(id=get_uuid(), name="데이터플랫폼", description="전사 데이터 분석 플랫폼", icon="database", color="blue")
        svc_hiring = Service(id=get_uuid(), name="채용솔루션", description="채용 관리 플랫폼", icon="users", color="emerald")
        svc_eng = Service(id=get_uuid(), name="엔지니어링솔루션", description="DevOps 도구 플랫폼", icon="code", color="orange")
        db.add_all([svc_platform, svc_hiring, svc_eng])
        db.flush()

        # 2. 모든 자산(32개) 생성 로직
        # [DB_STRUCTURE_PROMPT.md의 32개 명세를 리스트화]
        asset_definitions = [
            ("employees", "hr", "analytics_db", svc_platform.id, "confidential"),
            ("salaries", "hr", "analytics_db", svc_platform.id, "confidential"),
            ("performance_reviews", "hr", "analytics_db", svc_platform.id, "confidential"),
            ("benefits", "hr", "analytics_db", svc_platform.id, "confidential"),
            ("api_logs", "logs", "analytics_db", svc_eng.id, "internal"),
            ("application_logs", "logs", "analytics_db", svc_eng.id, "internal"),
            ("security_logs", "logs", "analytics_db", svc_eng.id, "confidential"),
            ("payment_logs", "logs", "analytics_db", svc_platform.id, "confidential"),
            ("users", "public", "analytics_db", svc_platform.id, "internal"),
            ("user_events", "public", "analytics_db", svc_platform.id, "public"),
            ("orders", "public", "analytics_db", svc_platform.id, "internal"),
            ("products", "public", "analytics_db", svc_platform.id, "public"),
            ("reviews", "public", "analytics_db", svc_platform.id, "public"),
            ("build_logs", "ci_cd", "devops_db", svc_eng.id, "internal"),
            ("deployments", "ci_cd", "devops_db", svc_eng.id, "internal"),
            ("alerts", "monitoring", "devops_db", svc_eng.id, "internal"),
            ("incident_reports", "monitoring", "devops_db", svc_eng.id, "internal"),
            ("service_metrics", "monitoring", "devops_db", svc_eng.id, "internal"),
            ("hiring_metrics", "analytics", "hr_db", svc_hiring.id, "internal"),
            ("recruitment_funnel", "analytics", "hr_db", svc_hiring.id, "internal"),
            ("applicants", "recruitment", "hr_db", svc_hiring.id, "confidential"),
            ("interviews", "recruitment", "hr_db", svc_hiring.id, "confidential"),
            ("job_postings", "recruitment", "hr_db", svc_hiring.id, "public"),
            ("departments", "hr_schema", "hr_prod", svc_platform.id, "internal"),
            ("employee_salaries", "hr_schema", "hr_prod", svc_platform.id, "confidential"),
            ("employees_prod", "hr_schema", "hr_prod", svc_platform.id, "confidential"),
            ("categories", "public", "product_db", svc_platform.id, "public"),
            ("inventory", "public", "product_db", svc_platform.id, "internal"),
            ("suppliers", "public", "product_db", svc_platform.id, "internal"),
            ("customers", "public", "sales_db", svc_platform.id, "internal"),
            ("sales_transactions", "public", "sales_db", svc_platform.id, "internal"),
            ("commissions", "public", "sales_db", svc_platform.id, "confidential"),
        ]

        for name, schema, db_name, svc_id, sens in asset_definitions:
            real_name = name.replace("_prod", "")
            asset = DataAsset(
                id=get_uuid(), name=real_name, schema_name=schema, database_name=db_name, 
                service_id=svc_id, owner_name="Admin", owner_email="admin@example.com",
                sensitivity_level=sens, requires_permission=(sens != "public"),
                description=f"{real_name} 테이블 상세 명세"
            )
            db.add(asset); db.flush()

            # [핵심] 모든 자산에 컬럼 5개씩 자동 생성
            cols = [
                ("id", "int", "고유 식별자"),
                ("name", "varchar", "명칭"),
                ("status", "varchar", "현재 상태"),
                ("created_at", "datetime", "생성 일시"),
                ("updated_at", "datetime", "수정 일시")
            ]
            for i, (c_name, c_type, c_desc) in enumerate(cols):
                db.add(AssetColumn(
                    id=get_uuid(), asset_id=asset.id, column_name=c_name, 
                    data_type=c_type, description=c_desc, ordinal_position=i+1
                ))
            
            # 샘플 데이터 1건씩 추가
            db.add(SampleData(id=get_uuid(), asset_id=asset.id, row_data={
                "id": random.randint(100, 999),
                "name": f"Sample {real_name}",
                "status": "ACTIVE",
                "created_at": "2024-01-01",
                "updated_at": "2024-02-05"
            }))

        db.commit()
        return {"message": "Success! 32 assets with full columns and sample rows created."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
