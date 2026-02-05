# AXD (Advanced Data Platform) 프로젝트 가이드

이 프로젝트는 기업용 데이터 플랫폼의 프로토타입으로, **FastAPI (백엔드)**와 **React/Vite (프론트엔드)**, **MariaDB (데이터베이스)**로 구성되어 있습니다. Docker를 사용하여 로컬 환경에서 쉽게 실행할 수 있도록 설계되었습니다.

---

## 1. 🛠️ 필수 설치 도구 (Prerequisites)

프로젝트를 실행하기 전에 다음 도구들이 PC에 설치되어 있어야 합니다.

1.  **Git**: 소스 코드를 다운로드하기 위해 필요합니다. ([설치 링크](https://git-scm.com/downloads))
2.  **Docker Desktop**: 데이터베이스와 백엔드 서버를 컨테이너로 실행합니다. ([설치 링크](https://www.docker.com/products/docker-desktop/))
3.  **Node.js (LTS 버전)**: 프론트엔드 실행을 위해 필요합니다. ([설치 링크](https://nodejs.org/))
4.  **PNPM**: Node.js 패키지 매니저입니다. (설치: `npm install -g pnpm`)

---

## 2. 🚀 프로젝트 실행 방법 (Getting Started)

터미널(PowerShell, CMD, Git Bash 등)을 열고 순서대로 따라 하세요.

### 2.1 소스 코드 다운로드
```bash
git clone <레포지토리_주소>
cd axd
```

### 2.2 백엔드 & DB 실행 (Docker)
도커를 이용하여 백엔드 서버와 데이터베이스를 실행합니다.

```bash
# 1. 기존 컨테이너 정리 (충돌 방지)
docker-compose down
docker rm -f axd-mariadb axd-backend

# 2. 컨테이너 빌드 및 실행
docker-compose up --build -d
```
> **Tip**: `docker ps` 명령어로 `axd-backend`와 `axd-mariadb`가 실행 중인지 확인하세요.

### 2.3 프론트엔드 실행 (Local)
새로운 터미널 창을 열어서 프론트엔드를 실행합니다.

```bash
# 프론트엔드 폴더로 이동
cd axd-front

# 패키지 설치
pnpm install

# 개발 서버 실행
pnpm start:LOCAL
```

실행이 완료되면 브라우저에서 **`http://localhost:12083`** 주소로 접속하세요.

---

## 3. 💾 초기 데이터 세팅 (필수!)

처음 실행하면 데이터베이스가 비어 있습니다. 다음 단계를 통해 샘플 데이터를 생성하세요.

1.  웹사이트 접속 후 좌측 메뉴의 **"관리자 대시보드"** 클릭
2.  우측 상단의 **"데이터 초기화"** 버튼 클릭
3.  "성공" 메시지가 뜨면 새로고침 (`F5`)

이제 **"데이터 찾기"** 메뉴에서 **Analytics DB**, **HR System** 등의 서비스를 선택하면 32개의 테이블과 실제 샘플 데이터를 확인할 수 있습니다.

---

## 4. 👨‍💻 개발 및 수정 가이드

### 백엔드 수정 (Python/FastAPI)
- **위치**: `axd-backend/app`
- **주요 파일**:
    - `models/all_models.py`: DB 테이블 스키마 정의
    - `api/v1/endpoints/`: API 로직 (system.py: 초기화, assets.py: 조회)
- **적용 방법**: 코드를 수정한 후 터미널에서 다음 명령어로 백엔드만 재시작합니다.
  ```bash
  docker-compose restart backend
  ```

### 프론트엔드 수정 (React/TypeScript)
- **위치**: `axd-front/src`
- **주요 파일**:
    - `components/data-portal/`: 데이터 포털 UI 관련 컴포넌트
    - `hooks/`: API 통신 로직 (useDataAssets.ts 등)
- **적용 방법**: 파일을 저장하면 브라우저에 **자동으로 반영(HMR)**됩니다. 재시작할 필요가 없습니다.

---

## 5. ⚠️ 트러블슈팅 (자주 묻는 질문)

### Q1. "Port 12083 is already in use" 에러가 떠요.
이전에 실행한 프론트엔드 서버가 제대로 종료되지 않은 것입니다.
- **해결**: 터미널에서 `Ctrl + C`를 눌러 종료하거나, 작업 관리자에서 `Node.js` 프로세스를 찾아 종료하세요.

### Q2. "Conflict. The container name is already in use" 에러가 떠요.
이전에 실행한 도커 컨테이너가 남아있어서 이름이 겹치는 문제입니다.
- **해결**: 다음 명령어를 순서대로 실행하세요.
  ```bash
  docker-compose down
  docker rm -f axd-mariadb axd-backend
  docker-compose up -d
  ```

### Q3. 데이터 목록이 안 나와요.
백엔드 서버가 아직 켜지는 중일 수 있습니다. (DB 초기화에 시간이 걸림)
- **해결**: 10~20초 정도 기다린 후 관리자 대시보드에서 **"데이터 초기화"** 버튼을 다시 눌러주세요.

### Q4. DB를 직접 보고 싶어요. (DBeaver 접속 정보)
- **Host**: `localhost`
- **Port**: `13306`
- **Database**: `axd_db`
- **User**: `axd_user`
- **Password**: `axd_password`

---

## 6. 📁 프로젝트 구조

```
axd/
├── axd-backend/          # Python FastAPI 백엔드
│   ├── app/
│   │   ├── models/       # DB 모델 정의
│   │   ├── api/          # API 엔드포인트
│   │   └── main.py       # 앱 진입점
│   └── Dockerfile
├── axd-front/            # React 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   └── hooks/        # 데이터 통신 훅
│   └── vite.config.ts    # Vite 설정 (Proxy 포함)
├── docker-compose.yml    # Docker 설정 파일
└── README.md             # 프로젝트 가이드 (현재 파일)
```
