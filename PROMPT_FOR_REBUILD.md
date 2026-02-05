# DataHub - 기업용 데이터 플랫폼 상세 프롬프트

## 1. 프로젝트 개요

기업 내부에서 사용하는 종합 데이터 플랫폼 "DataHub"를 React + TypeScript + Vite + Tailwind CSS로 개발해주세요.
Supabase를 백엔드 데이터베이스로 사용하며, 다크모드/라이트모드를 지원해야 합니다.

### 기술 스택
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL)
- React Flow (데이터 리니지 시각화)
- Lucide React (아이콘)
- Radix UI (Dialog, Dropdown, Tabs, Tooltip, ScrollArea, Sheet)

### 디자인 원칙
- 전문적이고 깔끔한 기업용 UI
- 다크모드/라이트모드 완벽 지원 (ThemeContext로 관리)
- 보라색/인디고색 사용 금지 - 대신 slate, blue, emerald, amber 계열 사용
- 코드 블록은 라이트모드에서 `bg-slate-100 text-slate-800`, 다크모드에서 `bg-slate-900 text-slate-200` 사용

---

## 2. 전체 레이아웃 구조

### 2.1 MainLayout
전체 화면은 좌측 사이드바 + 상단바 + 메인 콘텐츠 영역으로 구성됩니다.
- 전체 높이 `h-screen`, overflow hidden
- Cmd+K (또는 Ctrl+K) 단축키로 글로벌 검색 다이얼로그 열기

### 2.2 Sidebar (좌측 네비게이션)
- 접힘/펼침 토글 가능 (접힌 상태: w-16, 펼친 상태: w-56)
- 상단에 "DataHub" 로고
- 메뉴 항목:
  1. **데이터 찾기** (Database 아이콘) - data-portal
  2. **데이터 조회** (Code 아이콘) - sql-workspace
  3. **신청 관리** (Send 아이콘) - request-center
- 접힌 상태에서는 Tooltip으로 메뉴명 표시
- 하단에 접힘 토글 버튼 (ChevronLeft/ChevronRight)

### 2.3 TopBar (상단바)
- 검색 입력창 (클릭 시 SearchDialog 열림)
  - placeholder: "데이터 자산, 문서 검색... (Cmd+K)"
- 다크모드/라이트모드 토글 버튼 (Moon/Sun 아이콘)
- 알림 드롭다운 (Bell 아이콘)
  - 읽지 않은 알림 개수 배지 표시
  - 알림 목록: 제목, 메시지, 시간, 읽음 여부 표시
  - "모든 알림 보기" 버튼
- 사용자 프로필 드롭다운
  - 사용자 아바타 (원형, primary 배경)
  - 사용자명: "김개발"
  - 이메일: "kim.dev@company.com"
  - 메뉴: 내 프로필, 설정, 로그아웃

### 2.4 SearchDialog (글로벌 검색)
- 모달 다이얼로그 형태
- 상단 검색 입력창 + ESC 키 안내
- 카테고리 필터 탭: 전체, 데이터 자산, 문서
- 검색어 없을 때: 최근 검색 기록 표시
- 검색 결과: 아이콘, 제목, 설명, Enter 키 안내
- 하단: 키보드 단축키 안내 (화살표로 탐색, Enter로 선택)

---

## 3. 데이터 찾기 (DataPortal)

### 3.1 좌측 패널 - 서비스/자산 트리
- **서비스 선택 드롭다운**
  - 서비스 목록: DB에서 `services` 테이블 조회
  - 각 서비스에 아이콘(database, users, code, server)과 색상(blue, emerald, orange) 지정
  - 서비스 선택 시 해당 서비스의 데이터 자산만 표시

- **데이터 자산 트리뷰**
  - 계층 구조: 데이터베이스 > 스키마 > 테이블
  - 각 노드에 펼침/접힘 토글
  - 테이블 선택 시 우측에 상세 정보 표시
  - 트리 데이터는 `data_assets` 테이블에서 조회 후 `buildAssetTree()` 함수로 계층 구조화

### 3.2 우측 패널 - 자산 상세 정보

#### 3.2.1 AssetHeader (자산 헤더)
- 자산 유형 배지 (Table)
- 자산명 (크게 표시)
- 태그 목록 (Badge로 표시)
- 설명 (2줄 제한)
- 메타 정보 행:
  - 소유자 (이름 + 이메일)
  - 민감도 레벨 배지 (public: 초록, internal: 노랑, confidential: 빨강 + 자물쇠)
  - 최종 수정일
- 액션 버튼:
  - 권한 없는 경우: "접근 권한 신청" 버튼
  - 권한 있는 경우: "쿼리 작성하기" 버튼 (SQL Workspace로 이동)
  - 대기중인 요청 있는 경우: "승인 대기중" 표시

#### 3.2.2 권한 시스템
- **민감도 레벨**: public, internal, confidential
- **권한 레벨**: none, viewer, editor, owner
- **접근 제어 로직**:
  - public 자산: 모든 사용자 메타데이터/스키마 조회 가능
  - internal 자산: viewer 이상 권한 필요
  - confidential 자산: none 권한인 경우 PermissionOverlay 표시

#### 3.2.3 PermissionRequestModal (권한 요청 모달)
- 요청 권한 레벨 선택 (viewer: 조회 전용, editor: 조회+수정)
- 사용 목적 선택 (analysis, reporting, development, other)
- 상세 사유 입력 (textarea)
- 요청 기간 선택 (1개월, 3개월, 6개월, 영구)
- 담당자 정보 표시 (소유자명, 이메일)

#### 3.2.4 탭 구성

**정보 & 위키 탭 (InfoTab)**
- 비즈니스 정의: 자산의 비즈니스적 설명
- 관련 문서: 링크 목록 (외부 링크 아이콘 포함)
- 메타데이터: 데이터베이스명, 스키마명, 생성일, 최종 수정일

**스키마 탭 (SchemaTab)**
- 검색 필터
- 상단 통계: 컬럼 수, 평균 Null 비율, 경고/위험 개수
- 컬럼 테이블:
  - # (순서)
  - 컬럼명 (code 스타일)
  - 타입 (Badge)
  - 설명
  - Nullable (YES/NO 배지)
  - Null 비율 (프로그레스 바 + 퍼센트)
  - 신선도 (양호: 초록, 주의: 노랑, 위험: 빨강)
- 정렬 기능: 순서, 컬럼명, Null 비율

**데이터 리니지 탭 (LineageTab)**
- React Flow 사용
- 노드 유형: table, dashboard, metric, api
- 현재 테이블은 가운데에 하이라이트 표시
- 왼쪽: 업스트림 소스 (데이터 출처)
- 오른쪽: 다운스트림 타겟 (최종 사용처)
- 엣지에 변환 유형 레이블
- 범례: 데이터 소스, 현재 테이블, 최종 사용처

**커뮤니티 탭 (DiscussionTab)**
- 댓글/토론 목록
- 새 댓글 작성 폼
- 답변 채택 기능

---

## 4. 데이터 조회 (SQLWorkspace)

### 4.1 좌측 패널 - SchemaExplorer
- 서비스 선택 드롭다운 (DataPortal과 동일)
- 스키마/테이블 트리뷰
- 테이블 클릭 시 TableInfoDrawer 열림
- 컬럼 클릭 시 쿼리 에디터에 `테이블.컬럼` 삽입

### 4.2 TableInfoDrawer (시트/드로어)
- 테이블 기본 정보
- 간략한 스키마 정보
- "데이터 포털에서 보기" 버튼 (DataPortal로 이동)

### 4.3 QueryEditor (쿼리 에디터)
- SQL 코드 입력 textarea
- 라인 넘버 표시
- 상단 툴바:
  - 실행 버튼 (Play 아이콘, Cmd+Enter 단축키)
  - 저장 버튼
  - 포맷 버튼
  - 실행 시간/비용 표시

### 4.4 ResultPanel (결과 패널)
- 탭 구성: 결과, 메시지, 쿼리 히스토리
- 결과 테이블 (컬럼 헤더 + 데이터 행)
- 하단 상태바: 행 수, 실행 시간, 비용
- 로딩 중 스피너 표시

### 4.5 우측 패널 - AICopilot
- "AI 코파일럿" 헤더 (Sparkles 아이콘)
- 빠른 액션 버튼: "이 쿼리 설명해줘", "SQL 최적화", "에러 분석"
- 채팅 메시지 목록
  - 사용자 메시지 (오른쪽 정렬, primary 배경)
  - AI 응답 (왼쪽 정렬, muted 배경)
  - SQL 코드 블록 (복사/에디터 삽입 버튼)
- 하단 입력창 (Enter로 전송)

---

## 5. 신청 관리 (RequestCenter)

### 5.1 페이지 헤더
- "신청 관리" 제목 (Send 아이콘)
- "새 요청" 버튼

### 5.2 MyRequestsList (내 신청 목록)

**통계 카드**
- 총 신청 수
- 진행 중
- 완료
- 반려

**신청 목록 테이블**
- 제목 + 유형
- 상태 배지
- 우선순위
- 담당자
- 요청일
- 예상 완료일

### 5.3 NewRequestModal (신청 모달)

**카테고리 선택** (`request_categories` 테이블)
- 데이터 요청
- 권한 요청
- 기술 지원
- 기타

**요청 유형 선택** (`request_types` 테이블)
- 카테고리별 하위 유형
- 예상 소요일 표시

**동적 폼**
- `form_schema` JSON 기반 동적 필드 렌더링
- 필드 타입: text, textarea, select, date, number

**추가 입력**
- 제목
- 상세 설명
- 우선순위 선택 (low, medium, high, urgent)

### 5.4 RequestDetailDrawer (상세 드로어)
- 기본 정보
- 입력한 폼 데이터
- 진행 상태 타임라인
- 관리자 메모

---

## 6. 데이터베이스 스키마

### 6.1 services (서비스)
```sql
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'database',
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);
```

### 6.2 data_assets (데이터 자산)
```sql
CREATE TABLE data_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  schema_name text NOT NULL,
  database_name text NOT NULL,
  service_id uuid REFERENCES services(id),
  owner_id uuid,
  owner_name text DEFAULT '',
  owner_email text DEFAULT '',
  tags text[] DEFAULT '{}',
  business_definition text DEFAULT '',
  doc_links jsonb DEFAULT '[]',
  sensitivity_level text DEFAULT 'public', -- public, internal, confidential
  requires_permission boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 6.3 asset_columns (컬럼 정보)
```sql
CREATE TABLE asset_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  column_name text NOT NULL,
  data_type text NOT NULL,
  description text DEFAULT '',
  is_nullable boolean DEFAULT true,
  dq_null_ratio numeric DEFAULT 0,
  dq_freshness text DEFAULT 'good', -- good, warning, critical
  ordinal_position integer DEFAULT 0
);
```

### 6.4 data_lineage (데이터 리니지)
```sql
CREATE TABLE data_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_asset_id uuid REFERENCES data_assets(id),
  target_asset_id uuid REFERENCES data_assets(id),
  transformation_type text DEFAULT 'ETL',
  etl_logic_summary text DEFAULT '',
  source_name text DEFAULT '',
  target_name text DEFAULT '',
  source_type text DEFAULT 'table', -- table, dashboard, metric, api
  target_type text DEFAULT 'table'
);
```

### 6.5 asset_comments (댓글)
```sql
CREATE TABLE asset_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  user_id uuid,
  user_name text DEFAULT '',
  content text NOT NULL,
  parent_id uuid REFERENCES asset_comments(id),
  is_answer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### 6.6 asset_permissions (권한)
```sql
CREATE TABLE asset_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES data_assets(id),
  user_id uuid NOT NULL,
  user_name text DEFAULT '',
  user_email text DEFAULT '',
  permission_level text NOT NULL, -- viewer, editor, owner
  granted_by uuid,
  granted_by_name text DEFAULT '',
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid
);
```

### 6.7 permission_requests (권한 요청)
```sql
CREATE TABLE permission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES data_assets(id),
  requester_id uuid NOT NULL,
  requester_name text DEFAULT '',
  requester_email text DEFAULT '',
  requested_level text NOT NULL, -- viewer, editor
  purpose_category text NOT NULL, -- analysis, reporting, development, other
  reason text DEFAULT '',
  duration text DEFAULT '1month', -- 1month, 3months, 6months, permanent
  status text DEFAULT 'pending', -- pending, approved, rejected, cancelled
  reviewer_id uuid,
  reviewer_name text DEFAULT '',
  reviewer_comment text DEFAULT '',
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 6.8 request_categories (신청 카테고리)
```sql
CREATE TABLE request_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT 'file',
  color text DEFAULT 'gray',
  is_simple boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### 6.9 request_types (신청 유형)
```sql
CREATE TABLE request_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES request_categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT '',
  estimated_days integer DEFAULT 3,
  requires_approval boolean DEFAULT true,
  form_schema jsonb DEFAULT '[]', -- [{name, label, type, required, placeholder, options}]
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### 6.10 service_requests (서비스 신청)
```sql
CREATE TABLE service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type_id uuid NOT NULL REFERENCES request_types(id),
  requester_id uuid NOT NULL,
  requester_name text DEFAULT '',
  requester_email text DEFAULT '',
  title text NOT NULL,
  description text DEFAULT '',
  form_data jsonb DEFAULT '{}',
  priority text DEFAULT 'medium', -- low, medium, high, urgent
  status text DEFAULT 'submitted', -- submitted, in_review, approved, in_progress, completed, rejected, cancelled
  assignee_name text,
  assignee_email text,
  due_date timestamptz,
  completed_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 6.11 notifications (알림)
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text DEFAULT '',
  link text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

---

## 7. Custom Hooks

### 7.1 useServices
```typescript
// services 테이블 조회
const { services, loading } = useServices();
```

### 7.2 useDataAssets
```typescript
// data_assets 조회 + buildAssetTree 함수로 트리 구조화
const { assets, loading } = useDataAssets(serviceId);
const tree = buildAssetTree(assets);
```

### 7.3 useAssetDetails
```typescript
// 자산 상세 정보, 컬럼, 리니지, 댓글 조회
const { asset, columns, lineage, comments, loading, refetch } = useAssetDetails(assetId);
```

### 7.4 useAssetPermission
```typescript
// 현재 사용자의 권한 레벨 및 대기중인 요청 확인
const { permissionLevel, pendingRequest, submitRequest } = useAssetPermission(assetId, sensitivityLevel);
```

### 7.5 useRequestCenter
```typescript
// 신청 카테고리, 유형, 내 신청 목록 조회
const { categories, loading } = useRequestCategories();
const { types, loading } = useAllRequestTypes();
const { requests, loading, refetch } = useMyServiceRequests();
const { stats, loading } = useRequestStats();
```

---

## 8. RLS 정책

모든 테이블에 Row Level Security 활성화:
- 데모 목적으로 `anon` 사용자에게 SELECT 권한 허용
- INSERT/UPDATE/DELETE는 `authenticated` 사용자에게만 허용
- 본인 데이터만 수정 가능하도록 `auth.uid()` 체크

---

## 9. 샘플 데이터

### 서비스 예시
1. 데이터 웨어하우스 (database, blue)
2. HR 시스템 (users, emerald)
3. 애플리케이션 DB (code, orange)

### 데이터 자산 예시
- main_db.public.users (사용자 정보, public)
- main_db.public.orders (주문 데이터, internal)
- main_db.sales.customers (고객 마스터, confidential)
- hr_db.hr.employees (직원 정보, confidential)
- hr_db.hr.salaries (급여 정보, confidential)

---

## 10. 주요 UI 컴포넌트 (shadcn/ui 스타일)

- Button: variant(default, secondary, outline, ghost, destructive), size(sm, default, lg, icon)
- Badge: variant(default, secondary, outline, warning, error)
- Input: 기본 스타일 + focus ring
- Dialog: 모달 다이얼로그
- DropdownMenu: 드롭다운 메뉴
- Tabs: 탭 네비게이션
- Tooltip: 툴팁
- ScrollArea: 스크롤 영역
- Sheet: 사이드 드로어
- Skeleton: 로딩 스켈레톤

---

## 11. 테마 시스템

### ThemeContext
```typescript
// 'light' | 'dark' 상태 관리
// localStorage에 저장
// toggleTheme 함수 제공
// document.documentElement에 'dark' 클래스 토글
```

### CSS 변수 (index.css)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... 기타 변수 */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... 기타 다크모드 변수 */
}
```

---

이 프롬프트를 기반으로 개발하면 현재 DataHub 애플리케이션과 거의 동일한 결과물을 얻을 수 있습니다.
