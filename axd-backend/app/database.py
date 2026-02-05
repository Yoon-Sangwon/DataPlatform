import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# docker-compose 내부에서는 'db', 로컬 직접 실행 시에는 'localhost'
# 13306 포트는 로컬에서 접근할 때용, 3306은 컨테이너끼리 통신할 때용
DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("MARIADB_USER", "axd_user")
DB_PASS = os.getenv("MARIADB_PASSWORD", "axd_password")
DB_NAME = os.getenv("MARIADB_DATABASE", "axd_db")

# 우선순위: 환경변수 DATABASE_URL > 조합된 URL
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
