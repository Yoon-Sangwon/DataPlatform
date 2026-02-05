# 기업 데이터 플랫폼 DB 구조 및 샘플 데이터 전체 명세

## 개요
기업 데이터 플랫폼을 위한 완전한 데이터베이스 구조와 샘플 데이터입니다.
- **32개의 데이터 자산** (실제 업무 데이터 테이블)
- **10개의 메타데이터 테이블** (권한 관리, 리니지, 댓글 등)
- **26개의 데이터 리니지 관계**
- **풍부한 샘플 데이터** (서비스 3개, 댓글 40개 이상, 권한 요청 6건 등)

---

# PART A: 테이블 스키마 (CREATE 구문)

이 섹션은 모든 테이블의 CREATE TABLE 구문만 포함합니다.

---

## A.1 핵심 메타데이터 테이블 (10개)

### services (서비스 정보)
```sql
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT 'server',
  color text DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);
```

### data_assets (데이터 자산)
```sql
CREATE TABLE IF NOT EXISTS data_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text DEFAULT '',
  schema_name text NOT NULL,
  database_name text NOT NULL,
  owner_id uuid,
  owner_name text DEFAULT '',
  owner_email text DEFAULT '',
  tags text[] DEFAULT '{}',
  business_definition text DEFAULT '',
  doc_links jsonb DEFAULT '[]',
  sensitivity_level text DEFAULT 'internal',
  requires_permission boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### asset_columns (컬럼 메타데이터)
```sql
CREATE TABLE IF NOT EXISTS asset_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  column_name text NOT NULL,
  data_type text NOT NULL,
  description text DEFAULT '',
  is_nullable boolean DEFAULT true,
  dq_null_ratio numeric DEFAULT 0,
  dq_freshness text DEFAULT 'good',
  is_masked boolean DEFAULT false,
  masking_type text DEFAULT NULL,
  ordinal_position integer DEFAULT 0
);
```

### data_lineage (데이터 계보)
```sql
CREATE TABLE IF NOT EXISTS data_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_asset_id uuid REFERENCES data_assets(id) ON DELETE SET NULL,
  target_asset_id uuid REFERENCES data_assets(id) ON DELETE SET NULL,
  transformation_type text DEFAULT 'ETL',
  etl_logic_summary text DEFAULT '',
  source_name text DEFAULT '',
  target_name text DEFAULT '',
  source_type text DEFAULT 'table',
  target_type text DEFAULT 'table'
);
```

### asset_comments (커뮤니티 댓글)
```sql
CREATE TABLE IF NOT EXISTS asset_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  user_id uuid,
  user_name text DEFAULT '',
  content text NOT NULL,
  parent_id uuid REFERENCES asset_comments(id) ON DELETE CASCADE,
  is_answer boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### permission_requests (권한 요청)
```sql
CREATE TABLE IF NOT EXISTS permission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL,
  requester_name text DEFAULT '',
  requester_email text DEFAULT '',
  requested_level text DEFAULT 'viewer',
  purpose_category text DEFAULT 'analysis',
  reason text DEFAULT '',
  duration text DEFAULT '3months',
  status text DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewer_name text DEFAULT '',
  reviewer_comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_requested_level CHECK (requested_level IN ('viewer', 'developer', 'owner')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

### asset_permissions (실제 권한)
```sql
CREATE TABLE IF NOT EXISTS asset_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES data_assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_email text DEFAULT '',
  permission_level text DEFAULT 'viewer',
  granted_by_name text DEFAULT '',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_permission_level CHECK (permission_level IN ('viewer', 'developer', 'owner'))
);
```

### service_requests (서비스 요청)
```sql
CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  requester_name text DEFAULT '',
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'data_access',
  priority text DEFAULT 'medium',
  status text DEFAULT 'open',
  assignee_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### pipelines (파이프라인)
```sql
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  owner_id uuid,
  owner_name text DEFAULT '',
  schedule text DEFAULT '',
  schedule_readable text DEFAULT '',
  status text DEFAULT 'success',
  last_run timestamptz,
  airflow_dag_id text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
```

### notifications (알림)
```sql
CREATE TABLE IF NOT EXISTS notifications (
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

## A.2 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_data_assets_schema ON data_assets(schema_name, database_name);
CREATE INDEX IF NOT EXISTS idx_data_assets_name ON data_assets(name);
CREATE INDEX IF NOT EXISTS idx_data_assets_service ON data_assets(service_id);
CREATE INDEX IF NOT EXISTS idx_data_assets_requires_permission ON data_assets(requires_permission) WHERE requires_permission = true;
CREATE INDEX IF NOT EXISTS idx_asset_columns_asset_id ON asset_columns(asset_id);
CREATE INDEX IF NOT EXISTS idx_data_lineage_source ON data_lineage(source_asset_id);
CREATE INDEX IF NOT EXISTS idx_data_lineage_target ON data_lineage(target_asset_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_status ON pipelines(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
```

---

## A.3 RLS (Row Level Security) 정책

모든 테이블에 RLS를 활성화하고 기본 정책을 적용합니다:

```sql
-- 모든 테이블 RLS 활성화
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 기본 읽기 정책 (모든 인증된 사용자)
CREATE POLICY "Authenticated users can read services" ON services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read data_assets" ON data_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read asset_columns" ON asset_columns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read data_lineage" ON data_lineage FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read asset_comments" ON asset_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read permission_requests" ON permission_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read asset_permissions" ON asset_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read service_requests" ON service_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read pipelines" ON pipelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can read their notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 익명 사용자도 읽기 가능 (데모 목적)
CREATE POLICY "Anyone can read services" ON services FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can read data_assets" ON data_assets FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can read asset_columns" ON asset_columns FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can read data_lineage" ON data_lineage FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can read asset_comments" ON asset_comments FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can read permission_requests" ON permission_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can read asset_permissions" ON asset_permissions FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can read service_requests" ON service_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can read pipelines" ON pipelines FOR SELECT TO anon USING (true);
```

---

# PART B: 샘플 데이터 (INSERT 구문)

이 섹션은 모든 샘플 데이터의 INSERT 구문만 포함합니다.

---

## B.1 서비스 (3개)

```sql
-- 서비스 1: 데이터플랫폼
INSERT INTO services (name, description, icon, color)
VALUES (
  '데이터플랫폼',
  '전사 데이터 인프라 및 분석 플랫폼',
  'database',
  'blue'
);

-- 서비스 2: 채용솔루션
INSERT INTO services (name, description, icon, color)
VALUES (
  '채용솔루션',
  '채용 프로세스 관리 솔루션',
  'users',
  'emerald'
);

-- 서비스 3: 엔지니어링솔루션
INSERT INTO services (name, description, icon, color)
VALUES (
  '엔지니어링솔루션',
  '개발 및 DevOps 도구 플랫폼',
  'code',
  'orange'
);
```

---

## B.2 데이터 자산 (32개 테이블 메타데이터)

### B.2.1 analytics_db.hr (HR 분석 데이터 - 4개)

```sql
-- 1. employees (직원 정보)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, tags, business_definition, doc_links, sensitivity_level, requires_permission)
SELECT
  id,
  'employees',
  '조직 내 모든 직원의 기본 정보를 저장하는 핵심 마스터 테이블',
  'hr',
  'analytics_db',
  'HR System',
  ARRAY['HR', 'PII', '개인정보', '인사'],
  '조직 내 모든 직원의 기본 정보를 저장하는 핵심 마스터 테이블입니다. 인사관리, 조직도 구성, 권한 관리 등 다양한 시스템에서 참조됩니다. 민감한 개인정보가 포함되어 있으므로 접근 권한 관리가 필요합니다.',
  '[
    {"title": "직원 마스터 데이터 가이드", "url": "https://wiki.company.com/hr/employee-master"},
    {"title": "조직 API 문서", "url": "https://docs.company.com/api/hr/employees"},
    {"title": "개인정보 처리 방침", "url": "https://confluence.company.com/pages/privacy-policy"}
  ]'::jsonb,
  'confidential',
  true
FROM services WHERE name = '데이터플랫폼';

-- 2. salaries (급여 정보)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, tags, business_definition, sensitivity_level, requires_permission)
SELECT
  id,
  'salaries',
  '직원 급여 이력을 관리하는 테이블',
  'hr',
  'analytics_db',
  'HR System',
  ARRAY['HR', '급여', '기밀', '인사'],
  '직원 급여 이력을 관리하는 테이블입니다. 기본급, 성과급, 급여 적용일 등을 추적합니다. 인건비 분석, 급여 인상률 산정, 예산 계획에 활용됩니다. 최고 수준의 접근 제한이 적용됩니다.',
  'confidential',
  true
FROM services WHERE name = '데이터플랫폼';

-- 3. performance_reviews (성과 평가)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, tags, sensitivity_level, requires_permission)
SELECT
  id,
  'performance_reviews',
  '분기별/연간 성과 평가 데이터',
  'hr',
  'analytics_db',
  'HR System',
  ARRAY['HR', '평가', '기밀', '인사'],
  'confidential',
  true
FROM services WHERE name = '데이터플랫폼';

-- 4. benefits (복리후생)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, tags, sensitivity_level, requires_permission)
SELECT
  id,
  'benefits',
  '직원 복리후생 정보',
  'hr',
  'analytics_db',
  'HR System',
  ARRAY['HR', '복리후생', '기밀', '인사'],
  'confidential',
  true
FROM services WHERE name = '데이터플랫폼';
```

### B.2.2 analytics_db.logs (로그 데이터 - 4개)

```sql
-- 5. api_logs (API 호출 로그)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'api_logs',
  'API 호출 로그를 기록하는 테이블',
  'logs',
  'analytics_db',
  '강동현',
  'kang.donghyun@company.com',
  ARRAY['log', 'api', 'system'],
  'internal'
FROM services WHERE name = '엔지니어링솔루션';

-- 6. application_logs (애플리케이션 로그)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'application_logs',
  '애플리케이션 런타임 로그',
  'logs',
  'analytics_db',
  '강동현',
  'kang.donghyun@company.com',
  ARRAY['log', 'application', 'system'],
  'internal'
FROM services WHERE name = '엔지니어링솔루션';

-- 7. security_logs (보안 이벤트 로그)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'security_logs',
  '보안 이벤트 로그를 저장',
  'logs',
  'analytics_db',
  '윤서준',
  'yoon.seojun@company.com',
  ARRAY['log', 'security', 'audit'],
  'confidential'
FROM services WHERE name = '엔지니어링솔루션';

-- 8. payment_logs (결제 트랜잭션 로그)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'payment_logs',
  '모든 결제 트랜잭션의 상세 로그',
  'logs',
  'analytics_db',
  '한지민',
  'han.jimin@company.com',
  ARRAY['log', 'payment', 'transaction', '결제'],
  'confidential'
FROM services WHERE name = '데이터플랫폼';
```

### B.2.3 analytics_db.public (공개 분석 데이터 - 5개)

```sql
-- 9. users (사용자 정보)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'users',
  '서비스 사용자(고객) 정보를 저장하는 마스터 테이블',
  'public',
  'analytics_db',
  '이지은',
  'lee.jieun@company.com',
  ARRAY['user', 'analytics', '사용자'],
  'internal'
FROM services WHERE name = '데이터플랫폼';

-- 10. user_events (사용자 행동 이벤트 로그)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'user_events',
  '사용자의 모든 행동을 추적하는 이벤트 로그',
  'public',
  'analytics_db',
  '이지은',
  'lee.jieun@company.com',
  ARRAY['event', 'analytics', '행동로그'],
  'public'
FROM services WHERE name = '데이터플랫폼';

-- 11. orders (주문 정보)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'orders',
  '고객 주문 정보를 저장하는 핵심 트랜잭션 테이블',
  'public',
  'analytics_db',
  '박준호',
  'park.junho@company.com',
  ARRAY['order', 'transaction', '주문'],
  'internal'
FROM services WHERE name = '데이터플랫폼';

-- 12. products (제품 카탈로그)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'products',
  '판매 상품 마스터 테이블',
  'public',
  'analytics_db',
  '최서연',
  'choi.seoyeon@company.com',
  ARRAY['product', 'catalog', '제품'],
  'public'
FROM services WHERE name = '데이터플랫폼';

-- 13. reviews (상품 리뷰)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'reviews',
  '고객이 작성한 상품 리뷰 및 평점 정보',
  'public',
  'analytics_db',
  '최서연',
  'choi.seoyeon@company.com',
  ARRAY['review', 'feedback', '리뷰'],
  'public'
FROM services WHERE name = '데이터플랫폼';
```

### B.2.4 devops_db.ci_cd (CI/CD 데이터 - 2개)

```sql
-- 14. build_logs (빌드 로그)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'build_logs',
  'CI/CD 파이프라인 빌드 로그',
  'ci_cd',
  'devops_db',
  '강동현',
  'kang.donghyun@company.com',
  ARRAY['devops', 'ci_cd', 'build'],
  'internal'
FROM services WHERE name = '엔지니어링솔루션';

-- 15. deployments (배포 이력)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'deployments',
  '애플리케이션 배포 이력',
  'ci_cd',
  'devops_db',
  '강동현',
  'kang.donghyun@company.com',
  ARRAY['devops', 'deployment', 'release'],
  'internal'
FROM services WHERE name = '엔지니어링솔루션';
```

### B.2.5 devops_db.monitoring (모니터링 데이터 - 3개)

```sql
-- 16. alerts (알림)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'alerts',
  '시스템 모니터링 알림',
  'monitoring',
  'devops_db',
  '강동현',
  'kang.donghyun@company.com',
  ARRAY['monitoring', 'alert', 'system'],
  'internal'
FROM services WHERE name = '엔지니어링솔루션';

-- 17. incident_reports (장애 보고서)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'incident_reports',
  '장애 보고서(포스트모템)',
  'monitoring',
  'devops_db',
  '강동현',
  'kang.donghyun@company.com',
  ARRAY['monitoring', 'incident', 'postmortem'],
  'internal'
FROM services WHERE name = '엔지니어링솔루션';

-- 18. service_metrics (서비스 성능 메트릭)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'service_metrics',
  '서비스 성능 메트릭을 수집',
  'monitoring',
  'devops_db',
  '강동현',
  'kang.donghyun@company.com',
  ARRAY['monitoring', 'metrics', 'performance'],
  'internal'
FROM services WHERE name = '엔지니어링솔루션';
```

### B.2.6 hr_db.analytics (HR 분석 - 2개)

```sql
-- 19. hiring_metrics (채용 지표)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'hiring_metrics',
  '채용 활동 지표를 집계한 분석 테이블',
  'analytics',
  'hr_db',
  '이민지',
  'lee.minji@company.com',
  ARRAY['hr', 'recruitment', 'analytics'],
  'internal'
FROM services WHERE name = '채용솔루션';

-- 20. recruitment_funnel (채용 퍼널)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'recruitment_funnel',
  '채용 퍼널 단계별 현황 추적',
  'analytics',
  'hr_db',
  '이민지',
  'lee.minji@company.com',
  ARRAY['hr', 'recruitment', 'funnel'],
  'internal'
FROM services WHERE name = '채용솔루션';
```

### B.2.7 hr_db.recruitment (채용 프로세스 - 3개)

```sql
-- 21. applicants (지원자)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'applicants',
  '채용 지원자 정보',
  'recruitment',
  'hr_db',
  '이민지',
  'lee.minji@company.com',
  ARRAY['hr', 'recruitment', 'pii'],
  'confidential'
FROM services WHERE name = '채용솔루션';

-- 22. interviews (면접)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'interviews',
  '면접 일정 및 결과',
  'recruitment',
  'hr_db',
  '이민지',
  'lee.minji@company.com',
  ARRAY['hr', 'recruitment', 'interview'],
  'confidential'
FROM services WHERE name = '채용솔루션';

-- 23. job_postings (채용 공고)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'job_postings',
  '채용 공고 정보',
  'recruitment',
  'hr_db',
  '이민지',
  'lee.minji@company.com',
  ARRAY['hr', 'recruitment', 'job'],
  'public'
FROM services WHERE name = '채용솔루션';
```

### B.2.8 hr_prod.hr_schema (운영 HR 데이터 - 3개)

```sql
-- 24. departments (부서)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, tags, sensitivity_level)
SELECT
  id,
  'departments',
  '조직 부서 정보를 관리하는 마스터 테이블',
  'hr_schema',
  'hr_prod',
  'HR System',
  ARRAY['hr', 'organization', 'department'],
  'internal'
FROM services WHERE name = '데이터플랫폼';

-- 25. employee_salaries (급여 지급 실적)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, tags, sensitivity_level)
SELECT
  id,
  'employee_salaries',
  '운영 DB의 급여 지급 실적 테이블',
  'hr_schema',
  'hr_prod',
  'HR System',
  ARRAY['hr', 'payroll', 'salary'],
  'confidential'
FROM services WHERE name = '데이터플랫폼';

-- 26. employees (직원 - 운영)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, tags, sensitivity_level)
SELECT
  id,
  'employees',
  '운영 환경의 직원 마스터 테이블',
  'hr_schema',
  'hr_prod',
  'HR System',
  ARRAY['hr', 'employee', 'master'],
  'confidential'
FROM services WHERE name = '데이터플랫폼';
```

### B.2.9 product_db.public (상품 데이터 - 3개)

```sql
-- 27. categories (제품 카테고리)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'categories',
  '상품 카테고리 계층 구조',
  'public',
  'product_db',
  '최서연',
  'choi.seoyeon@company.com',
  ARRAY['category', 'taxonomy', '분류'],
  'public'
FROM services WHERE name = '데이터플랫폼';

-- 28. inventory (실시간 재고 현황)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'inventory',
  '상품 재고 현황을 실시간으로 관리',
  'public',
  'product_db',
  '김태희',
  'kim.taehee@company.com',
  ARRAY['inventory', 'stock', '재고'],
  'internal'
FROM services WHERE name = '데이터플랫폼';

-- 29. suppliers (공급업체)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'suppliers',
  '공급업체(벤더) 정보',
  'public',
  'product_db',
  '김태희',
  'kim.taehee@company.com',
  ARRAY['supplier', 'vendor', '공급업체'],
  'internal'
FROM services WHERE name = '데이터플랫폼';
```

### B.2.10 sales_db.public (영업 데이터 - 3개)

```sql
-- 30. customers (고객 마스터)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'customers',
  'B2B 고객사 정보',
  'public',
  'sales_db',
  '박준호',
  'park.junho@company.com',
  ARRAY['customer', 'master', '고객'],
  'internal'
FROM services WHERE name = '데이터플랫폼';

-- 31. sales_transactions (영업 거래 내역)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'sales_transactions',
  '매출 거래 내역',
  'public',
  'sales_db',
  '박준호',
  'park.junho@company.com',
  ARRAY['sales', 'transaction', '영업'],
  'internal'
FROM services WHERE name = '데이터플랫폼';

-- 32. commissions (영업 커미션)
INSERT INTO data_assets (service_id, name, description, schema_name, database_name, owner_name, owner_email, tags, sensitivity_level)
SELECT
  id,
  'commissions',
  '영업사원 수수료 정산 데이터',
  'public',
  'sales_db',
  '한지민',
  'han.jimin@company.com',
  ARRAY['commission', 'incentive', 'sensitive', '커미션'],
  'confidential'
FROM services WHERE name = '데이터플랫폼';
```

---

## B.3 컬럼 메타데이터 (주요 테이블만 샘플)

### employees 테이블 컬럼 (7개)

```sql
INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT
  id,
  'employee_id',
  'INTEGER',
  '직원 고유 식별자',
  false,
  0,
  false,
  NULL,
  1
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT
  id,
  'full_name',
  'VARCHAR(100)',
  '직원 성명',
  false,
  0,
  true,
  'partial',
  2
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT
  id,
  'email',
  'VARCHAR(255)',
  '회사 이메일 주소',
  false,
  0,
  true,
  'partial',
  3
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT
  id,
  'department_id',
  'INTEGER',
  '소속 부서 외래키',
  false,
  0,
  false,
  NULL,
  4
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT
  id,
  'hire_date',
  'DATE',
  '입사일',
  false,
  0,
  false,
  NULL,
  5
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT
  id,
  'job_title',
  'VARCHAR(100)',
  '직책',
  false,
  0,
  false,
  NULL,
  6
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT
  id,
  'manager_id',
  'INTEGER',
  '직속 상사 ID (자기참조)',
  true,
  15,
  false,
  NULL,
  7
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';
```

### salaries 테이블 컬럼 (5개)

```sql
INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, is_masked, masking_type, ordinal_position)
SELECT id, 'salary_id', 'INTEGER', '급여 기록 고유 식별자', false, false, NULL, 1
FROM data_assets WHERE name = 'salaries' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, is_masked, masking_type, ordinal_position)
SELECT id, 'employee_id', 'INTEGER', '직원 외래키', false, false, NULL, 2
FROM data_assets WHERE name = 'salaries' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT id, 'base_salary', 'DECIMAL(12,2)', '기본 연봉', false, 0, true, 'hash', 3
FROM data_assets WHERE name = 'salaries' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, dq_null_ratio, is_masked, masking_type, ordinal_position)
SELECT id, 'bonus', 'DECIMAL(12,2)', '성과급', true, 20, true, 'hash', 4
FROM data_assets WHERE name = 'salaries' AND schema_name = 'hr';

INSERT INTO asset_columns (asset_id, column_name, data_type, description, is_nullable, is_masked, masking_type, ordinal_position)
SELECT id, 'effective_date', 'DATE', '급여 적용 시작일', false, false, NULL, 5
FROM data_assets WHERE name = 'salaries' AND schema_name = 'hr';
```

---

## B.4 데이터 리니지 (26개 관계)

```sql
-- HR 계열 (7개)
-- 1. employees → salaries
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name, source_type, target_type)
SELECT
  s.id, t.id, 'transform',
  '직원 정보를 기반으로 급여 테이블 생성. employee_id를 외래키로 연결하여 급여 이력 관리.',
  'employees', 'salaries', 'table', 'table'
FROM data_assets s, data_assets t
WHERE s.name = 'employees' AND s.schema_name = 'hr'
  AND t.name = 'salaries' AND t.schema_name = 'hr';

-- 2. employees → performance_reviews
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '직원별 성과 평가 데이터 생성. employee_id와 reviewer_id 모두 employees 테이블 참조.',
  'employees', 'performance_reviews'
FROM data_assets s, data_assets t
WHERE s.name = 'employees' AND s.schema_name = 'hr'
  AND t.name = 'performance_reviews' AND t.schema_name = 'hr';

-- 3. employees → benefits
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '직원별 복리후생 정보 관리. employee_id로 연결하여 건강보험, 연금 등 복리후생 항목 추적.',
  'employees', 'benefits'
FROM data_assets s, data_assets t
WHERE s.name = 'employees' AND s.schema_name = 'hr'
  AND t.name = 'benefits' AND t.schema_name = 'hr';

-- 4. applicants → interviews
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '지원자 정보를 기반으로 면접 일정 생성. applicant_id로 연결하여 면접 진행 상황 추적.',
  'applicants', 'interviews'
FROM data_assets s, data_assets t
WHERE s.name = 'applicants' AND s.schema_name = 'recruitment'
  AND t.name = 'interviews' AND t.schema_name = 'recruitment';

-- 5. interviews → hiring_metrics
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'aggregate',
  '면접 결과를 집계하여 채용 지표 생성. 월별/부서별 채용 완료 수, 채용 소요 일수 등 계산.',
  'interviews', 'hiring_metrics'
FROM data_assets s, data_assets t
WHERE s.name = 'interviews' AND s.schema_name = 'recruitment'
  AND t.name = 'hiring_metrics' AND t.schema_name = 'analytics' AND t.database_name = 'hr_db';

-- 6. job_postings → recruitment_funnel
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'aggregate',
  '채용 공고별 퍼널 단계 현황 집계. 각 단계(서류심사, 1차면접 등)의 지원자 수와 전환율 계산.',
  'job_postings', 'recruitment_funnel'
FROM data_assets s, data_assets t
WHERE s.name = 'job_postings' AND s.schema_name = 'recruitment'
  AND t.name = 'recruitment_funnel' AND t.schema_name = 'analytics' AND t.database_name = 'hr_db';

-- 7. applicants → recruitment_funnel
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'aggregate',
  '지원자 현황을 채용 단계별로 집계. 각 단계의 지원자 수 카운트하여 퍼널 분석 데이터 생성.',
  'applicants', 'recruitment_funnel'
FROM data_assets s, data_assets t
WHERE s.name = 'applicants' AND s.schema_name = 'recruitment'
  AND t.name = 'recruitment_funnel' AND t.schema_name = 'analytics' AND t.database_name = 'hr_db';

-- DevOps 계열 (3개)
-- 8. build_logs → deployments
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '성공한 빌드를 기반으로 배포 레코드 생성. 빌드 ID를 참조하여 배포 버전 및 이력 관리.',
  'build_logs', 'deployments'
FROM data_assets s, data_assets t
WHERE s.name = 'build_logs' AND s.schema_name = 'ci_cd'
  AND t.name = 'deployments' AND t.schema_name = 'ci_cd';

-- 9. service_metrics → alerts
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '메트릭 임계치 초과 시 알림 생성. CPU, 메모리, 응답시간 등 지표가 설정값 초과 시 알림 발생.',
  'service_metrics', 'alerts'
FROM data_assets s, data_assets t
WHERE s.name = 'service_metrics' AND s.schema_name = 'monitoring'
  AND t.name = 'alerts' AND t.schema_name = 'monitoring';

-- 10. alerts → incident_reports
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  'Critical 알림 발생 시 장애 보고서 자동 생성. 알림 정보를 기반으로 초기 보고서 템플릿 작성.',
  'alerts', 'incident_reports'
FROM data_assets s, data_assets t
WHERE s.name = 'alerts' AND s.schema_name = 'monitoring'
  AND t.name = 'incident_reports' AND t.schema_name = 'monitoring';

-- Sales/Product 계열 (8개)
-- 11. customers → sales_transactions
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '고객 정보를 참조하여 매출 거래 생성. customer_id로 연결하여 고객별 거래 이력 추적.',
  'customers', 'sales_transactions'
FROM data_assets s, data_assets t
WHERE s.name = 'customers' AND s.database_name = 'sales_db'
  AND t.name = 'sales_transactions' AND t.database_name = 'sales_db';

-- 12. sales_transactions → commissions
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '매출 거래를 기반으로 영업 수수료 산정. 거래 금액 * 수수료율로 수수료 금액 계산.',
  'sales_transactions', 'commissions'
FROM data_assets s, data_assets t
WHERE s.name = 'sales_transactions' AND s.database_name = 'sales_db'
  AND t.name = 'commissions' AND t.database_name = 'sales_db';

-- 13. suppliers → inventory
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '공급업체로부터 입고 시 재고 업데이트. supplier_id로 입고 출처 추적 및 재고 수량 증가.',
  'suppliers', 'inventory'
FROM data_assets s, data_assets t
WHERE s.name = 'suppliers' AND s.database_name = 'product_db'
  AND t.name = 'inventory' AND t.database_name = 'product_db';

-- 14. categories → products
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '카테고리 정보를 상품에 매핑. category_id로 연결하여 상품 분류 체계 관리.',
  'categories', 'products'
FROM data_assets s, data_assets t
WHERE s.name = 'categories' AND s.database_name = 'product_db'
  AND t.name = 'products' AND t.database_name = 'analytics_db';

-- 15. products → inventory
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '상품 마스터를 기반으로 재고 항목 생성. product_id로 연결하여 상품별 재고 현황 관리.',
  'products', 'inventory'
FROM data_assets s, data_assets t
WHERE s.name = 'products' AND s.database_name = 'analytics_db'
  AND t.name = 'inventory' AND t.database_name = 'product_db';

-- 16. inventory → orders
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '재고 확인 후 주문 처리. 주문 시 가용 재고 검증 및 예약 재고 처리.',
  'inventory', 'orders'
FROM data_assets s, data_assets t
WHERE s.name = 'inventory' AND s.database_name = 'product_db'
  AND t.name = 'orders' AND t.database_name = 'analytics_db';

-- 17. products → orders
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '상품 정보를 주문에 포함. product_id로 연결하여 주문 상품 상세 정보 참조.',
  'products', 'orders'
FROM data_assets s, data_assets t
WHERE s.name = 'products' AND s.database_name = 'analytics_db'
  AND t.name = 'orders' AND t.database_name = 'analytics_db';

-- 18. products → reviews
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '상품별 리뷰 데이터 연결. product_id로 연결하여 상품별 평점 및 리뷰 집계.',
  'products', 'reviews'
FROM data_assets s, data_assets t
WHERE s.name = 'products' AND s.database_name = 'analytics_db'
  AND t.name = 'reviews' AND t.database_name = 'analytics_db';

-- Users 계열 (3개)
-- 19. users → orders
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '사용자 정보를 주문에 연결. user_id로 연결하여 주문자 정보 및 배송지 참조.',
  'users', 'orders'
FROM data_assets s, data_assets t
WHERE s.name = 'users' AND s.database_name = 'analytics_db'
  AND t.name = 'orders' AND t.database_name = 'analytics_db';

-- 20. users → reviews
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '사용자가 작성한 리뷰 연결. user_id로 연결하여 리뷰 작성자 정보 참조.',
  'users', 'reviews'
FROM data_assets s, data_assets t
WHERE s.name = 'users' AND s.database_name = 'analytics_db'
  AND t.name = 'reviews' AND t.database_name = 'analytics_db';

-- 21. users → user_events
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '사용자 행동 이벤트 수집. user_id로 연결하여 개별 사용자의 클릭, 조회 등 행동 추적.',
  'users', 'user_events'
FROM data_assets s, data_assets t
WHERE s.name = 'users' AND s.database_name = 'analytics_db'
  AND t.name = 'user_events' AND t.database_name = 'analytics_db';

-- 크로스 DB 동기화 (3개)
-- 22. hr_prod.employee_salaries → analytics_db.salaries
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'sync',
  '운영 DB 급여 데이터를 분석 DB로 동기화. 일일 배치로 전일 급여 지급 데이터 복제 및 민감정보 마스킹 적용.',
  'employee_salaries', 'salaries'
FROM data_assets s, data_assets t
WHERE s.name = 'employee_salaries' AND s.database_name = 'hr_prod'
  AND t.name = 'salaries' AND t.database_name = 'analytics_db';

-- 23. hr_prod.employees → analytics_db.employees
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'sync',
  '운영 DB 직원 정보를 분석 DB로 동기화. 실시간 CDC로 변경사항 반영, 개인정보 일부 마스킹.',
  'employees', 'employees'
FROM data_assets s, data_assets t
WHERE s.name = 'employees' AND s.database_name = 'hr_prod'
  AND t.name = 'employees' AND t.database_name = 'analytics_db';

-- 24. sales_db.customers → analytics_db.users
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'sync',
  'B2B 고객사 정보를 사용자 테이블과 통합. 고객 유형 구분 컬럼 추가하여 B2B/B2C 통합 분석 지원.',
  'customers', 'users'
FROM data_assets s, data_assets t
WHERE s.name = 'customers' AND s.database_name = 'sales_db'
  AND t.name = 'users' AND t.database_name = 'analytics_db';

-- Logs 계열 (2개)
-- 25. api_logs → application_logs
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'aggregate',
  'API 로그의 에러 패턴을 애플리케이션 로그로 집계. 5xx 에러 발생 시 자동으로 에러 로그 생성.',
  'api_logs', 'application_logs'
FROM data_assets s, data_assets t
WHERE s.name = 'api_logs' AND s.database_name = 'analytics_db'
  AND t.name = 'application_logs' AND t.database_name = 'analytics_db';

-- 26. payment_logs → security_logs
INSERT INTO data_lineage (source_asset_id, target_asset_id, transformation_type, etl_logic_summary, source_name, target_name)
SELECT
  s.id, t.id, 'transform',
  '결제 실패 및 의심 거래를 보안 로그로 전송. 이상 패턴 탐지 시 보안 이벤트 생성.',
  'payment_logs', 'security_logs'
FROM data_assets s, data_assets t
WHERE s.name = 'payment_logs' AND s.database_name = 'analytics_db'
  AND t.name = 'security_logs' AND t.database_name = 'analytics_db';
```

---

## B.5 커뮤니티 댓글 (40개 이상)

```sql
-- employees 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '김민수', '이 테이블을 사용할 때 manager_id가 NULL인 경우는 최고경영진입니다. 조직도 구성 시 참고하세요.'
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '이서연', '직원 정보 조회 시 개인정보 마스킹이 적용되어 있습니다. 전체 정보가 필요하면 HR팀에 별도 요청하세요.'
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

-- users 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '김민수', '탈퇴 회원도 soft delete로 남아있습니다. is_active 컬럼으로 활성 회원만 필터링하세요.'
FROM data_assets WHERE name = 'users' AND database_name = 'analytics_db';

-- user_events 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '박준혁', '이벤트 데이터는 30일 후 콜드 스토리지로 이동됩니다. 장기 분석은 집계 테이블 사용하세요.'
FROM data_assets WHERE name = 'user_events' AND database_name = 'analytics_db';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '최유진', '봇 트래픽 필터링 필요 시 is_bot=false 조건을 추가하세요. 약 15%가 봇 트래픽입니다.'
FROM data_assets WHERE name = 'user_events' AND database_name = 'analytics_db';

-- orders 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '임태호', '주문 상태 코드 정리: pending(대기), confirmed(확정), shipped(배송중), delivered(배송완료), cancelled(취소)'
FROM data_assets WHERE name = 'orders' AND database_name = 'analytics_db';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '한소희', '취소된 주문도 포함되어 있으니 매출 분석 시 cancelled 상태는 반드시 제외해야 합니다!'
FROM data_assets WHERE name = 'orders' AND database_name = 'analytics_db';

-- products 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '박준혁', '품절 상품은 is_available=false입니다. 판매 가능 상품만 조회하려면 이 조건을 추가하세요.'
FROM data_assets WHERE name = 'products' AND database_name = 'analytics_db';

-- build_logs 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '윤지영', '빌드 시간이 10분 이상 걸리는 경우 최적화가 필요합니다. DevOps팀에 문의하세요.'
FROM data_assets WHERE name = 'build_logs' AND schema_name = 'ci_cd';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '임태호', '빌드 실패 원인 분석 시 error_message 컬럼에 상세 로그가 있습니다. 대부분 의존성 문제입니다.'
FROM data_assets WHERE name = 'build_logs' AND schema_name = 'ci_cd';

-- deployments 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '정다은', '롤백 이력을 확인하려면 is_rollback 컬럼을 확인하세요. 롤백 원인은 rollback_reason에 있습니다.'
FROM data_assets WHERE name = 'deployments' AND schema_name = 'ci_cd';

-- alerts 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '한소희', 'severity가 critical인 알림은 즉시 대응이 필요합니다. Slack 온콜 채널에 자동 전송됩니다.'
FROM data_assets WHERE name = 'alerts' AND schema_name = 'monitoring';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '송민재', 'resolved_at이 NULL이면 아직 해결되지 않은 알림입니다. 미해결 알림 모니터링에 활용하세요.'
FROM data_assets WHERE name = 'alerts' AND schema_name = 'monitoring';

-- incident_reports 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '김민수', '포스트모템 작성 시 root_cause 분석이 핵심입니다. 5 Why 기법을 활용하면 좋습니다.'
FROM data_assets WHERE name = 'incident_reports' AND schema_name = 'monitoring';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '이서연', '장애 등급 기준 - P1: 서비스 전체 중단, P2: 핵심 기능 장애, P3: 일부 기능 영향, P4: 경미한 이슈'
FROM data_assets WHERE name = 'incident_reports' AND schema_name = 'monitoring';

-- applicants 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '박준혁', '지원자 소싱 채널은 source_channel 컬럼에서 확인 가능합니다. 채용 마케팅 효과 분석에 활용하세요.'
FROM data_assets WHERE name = 'applicants' AND schema_name = 'recruitment';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '최유진', '중복 지원자 처리 로직이 있어서 같은 이메일로 재지원 시 기존 레코드가 업데이트됩니다.'
FROM data_assets WHERE name = 'applicants' AND schema_name = 'recruitment';

-- interviews 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '정다은', '면접 유형별 평균 소요 시간 - 전화면접: 30분, 화상면접: 1시간, 대면면접: 1.5시간, 기술면접: 2시간'
FROM data_assets WHERE name = 'interviews' AND schema_name = 'recruitment';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '강현우', 'feedback 컬럼은 민감 정보로 마스킹 처리됩니다. 원본이 필요하면 채용팀장 승인이 필요합니다.'
FROM data_assets WHERE name = 'interviews' AND schema_name = 'recruitment';

-- job_postings 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '윤지영', '채용 공고 상태: draft(작성중), open(진행중), closed(마감), filled(채용완료), cancelled(취소)'
FROM data_assets WHERE name = 'job_postings' AND schema_name = 'recruitment';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '임태호', '급여 범위는 salary_min, salary_max 컬럼에 있습니다. NULL이면 협의라는 의미입니다.'
FROM data_assets WHERE name = 'job_postings' AND schema_name = 'recruitment';

-- employee_salaries 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '한소희', '이 테이블은 운영 DB 직접 데이터입니다. 분석용으로는 analytics_db.hr.salaries 사용을 권장합니다.'
FROM data_assets WHERE name = 'employee_salaries' AND database_name = 'hr_prod';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '송민재', '계좌번호는 보안상 해시 마스킹이 적용되어 있습니다. 원본 데이터는 조회 불가합니다.'
FROM data_assets WHERE name = 'employee_salaries' AND database_name = 'hr_prod';

-- categories 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '박준혁', '카테고리 계층은 parent_category_id로 연결됩니다. NULL이면 최상위 카테고리입니다.'
FROM data_assets WHERE name = 'categories' AND database_name = 'product_db';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '최유진', 'display_order로 정렬하면 프론트엔드 네비게이션 순서와 일치합니다.'
FROM data_assets WHERE name = 'categories' AND database_name = 'product_db';

-- inventory 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '김민수', '재고 수량 음수는 오발주 또는 시스템 오류입니다. 발견 시 SCM팀에 보고해주세요.'
FROM data_assets WHERE name = 'inventory' AND database_name = 'product_db';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '이서연', 'reserved_quantity는 결제 완료 전 예약된 수량입니다. available = quantity - reserved_quantity'
FROM data_assets WHERE name = 'inventory' AND database_name = 'product_db';

-- suppliers 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '정다은', '공급업체 평가 등급은 rating 컬럼에 있습니다. A/B/C/D 등급으로 관리됩니다.'
FROM data_assets WHERE name = 'suppliers' AND database_name = 'product_db';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '강현우', '담당자 연락처는 개인정보 보호를 위해 부분 마스킹됩니다. 전체 정보는 구매팀 문의하세요.'
FROM data_assets WHERE name = 'suppliers' AND database_name = 'product_db';

-- customers 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '윤지영', '신용등급은 credit_rating 컬럼입니다. AAA부터 D까지 있으며, 여신 한도 산정에 사용됩니다.'
FROM data_assets WHERE name = 'customers' AND database_name = 'sales_db';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '임태호', '거래처 상태가 inactive인 경우 거래 중단된 업체입니다. 재활성화는 영업팀 승인 필요합니다.'
FROM data_assets WHERE name = 'customers' AND database_name = 'sales_db';

-- sales_transactions 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '한소희', '매출 집계 시 반품(return) 거래는 음수 금액으로 기록됩니다. 순매출 계산 시 주의하세요.'
FROM data_assets WHERE name = 'sales_transactions' AND database_name = 'sales_db';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '송민재', '월말 마감 후에는 거래 수정이 불가합니다. is_finalized=true인 거래는 수정 제한됩니다.'
FROM data_assets WHERE name = 'sales_transactions' AND database_name = 'sales_db';

-- commissions 테이블 댓글
INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '김민수', '수수료율은 직급과 상품 카테고리에 따라 다릅니다. commission_policy 테이블에서 정책 확인 가능합니다.'
FROM data_assets WHERE name = 'commissions' AND database_name = 'sales_db';

INSERT INTO asset_comments (asset_id, user_name, content)
SELECT id, '이서연', 'paid_at이 NULL이면 아직 지급되지 않은 수수료입니다. 매월 10일에 일괄 지급됩니다.'
FROM data_assets WHERE name = 'commissions' AND database_name = 'sales_db';
```

---

## B.6 권한 요청 (6건)

```sql
-- 일반 사용자 (user@example.com) 권한 요청 3건

-- 1. employees 테이블 조회 권한 (대기 중)
INSERT INTO permission_requests (asset_id, requester_id, requester_name, requester_email, requested_level, purpose_category, reason, duration, status, created_at)
SELECT
  id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '일반사용자',
  'user@example.com',
  'viewer',
  'analysis',
  '부서별 인원 분석을 위해 직원 정보가 필요합니다. 이름, 부서, 입사일 등의 기본 정보만 확인하고자 합니다.',
  '3months',
  'pending',
  now() - interval '2 days'
FROM data_assets WHERE name = 'employees' AND schema_name = 'hr';

-- 2. orders 테이블 조회 권한 (대기 중)
INSERT INTO permission_requests (asset_id, requester_id, requester_name, requester_email, requested_level, purpose_category, reason, duration, status, created_at)
SELECT
  id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '일반사용자',
  'user@example.com',
  'viewer',
  'reporting',
  '월별 주문 트렌드 리포트 작성을 위해 주문 데이터 조회가 필요합니다.',
  '1month',
  'pending',
  now() - interval '1 day'
FROM data_assets WHERE name = 'orders' AND database_name = 'analytics_db';

-- 3. products 테이블 개발자 권한 (반려됨)
INSERT INTO permission_requests (asset_id, requester_id, requester_name, requester_email, requested_level, purpose_category, reason, duration, status, reviewed_at, reviewer_name, reviewer_comment, created_at, updated_at)
SELECT
  id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  '일반사용자',
  'user@example.com',
  'developer',
  'development',
  '개발 테스트를 위해 상품 데이터 수정 권한이 필요합니다.',
  'permanent',
  'rejected',
  now() - interval '4 days',
  '관리자',
  '개발자 권한은 개발팀 소속 직원에게만 부여 가능합니다. 조회 권한으로 재신청해주세요.',
  now() - interval '5 days',
  now() - interval '4 days'
FROM data_assets WHERE name = 'products' AND database_name = 'analytics_db';

-- 데이터 분석가 (adv@example.com) 권한 요청 3건

-- 4. salaries 테이블 개발자 권한 (대기 중)
INSERT INTO permission_requests (asset_id, requester_id, requester_name, requester_email, requested_level, purpose_category, reason, duration, status, created_at)
SELECT
  id,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '데이터분석가',
  'adv@example.com',
  'developer',
  'analysis',
  '급여 데이터 분석을 위한 집계 쿼리 작성이 필요합니다. 연봉 통계, 부서별 평균 급여 등을 분석하려고 합니다.',
  '6months',
  'pending',
  now() - interval '3 days'
FROM data_assets WHERE name = 'salaries' AND schema_name = 'hr';

-- 5. payment_logs 테이블 개발자 권한 (대기 중)
INSERT INTO permission_requests (asset_id, requester_id, requester_name, requester_email, requested_level, purpose_category, reason, duration, status, created_at)
SELECT
  id,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '데이터분석가',
  'adv@example.com',
  'developer',
  'reporting',
  '결제 실패율 분석 대시보드를 만들기 위해 결제 로그 데이터가 필요합니다.',
  '6months',
  'pending',
  now() - interval '12 hours'
FROM data_assets WHERE name = 'payment_logs' AND database_name = 'analytics_db';

-- 6. user_events 테이블 조회 권한 (승인됨)
INSERT INTO permission_requests (asset_id, requester_id, requester_name, requester_email, requested_level, purpose_category, reason, duration, status, reviewed_at, reviewer_name, reviewer_comment, created_at, updated_at)
SELECT
  id,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '데이터분석가',
  'adv@example.com',
  'viewer',
  'analysis',
  '사용자 행동 패턴 분석을 위해 이벤트 데이터 조회가 필요합니다.',
  '3months',
  'approved',
  now() - interval '6 days',
  '관리자',
  '분석 목적으로 승인합니다. 3개월 후 재신청 필요합니다.',
  now() - interval '7 days',
  now() - interval '6 days'
FROM data_assets WHERE name = 'user_events' AND database_name = 'analytics_db';
```

---

## B.7 실제 권한 (승인된 권한에 대한 실제 권한 부여)

```sql
-- user_events 테이블에 대한 데이터분석가 권한 (승인된 요청에서 생성)
INSERT INTO asset_permissions (asset_id, user_id, user_email, permission_level, granted_by_name, expires_at)
SELECT
  id,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'adv@example.com',
  'viewer',
  '관리자',
  now() + interval '3 months'
FROM data_assets WHERE name = 'user_events' AND database_name = 'analytics_db';
```

---

# 사용 예시

## 전체 데이터 플랫폼 구축

위 명세를 AI에게 제공하면서:

```
위 DB 구조와 샘플 데이터를 전부 사용하여 Supabase 기반 데이터 플랫폼을 구축해줘.

PART A의 모든 CREATE TABLE 구문을 실행하고,
PART B의 모든 INSERT 구문을 실행해서 샘플 데이터를 채워줘.
```

## 특정 부분만 구현

```
위 명세 중에서:
- PART A: 모든 테이블 스키마
- PART B.1: 서비스 데이터
- PART B.2.1: HR 분석 데이터 (4개 테이블)
- PART B.4: 데이터 리니지 중 HR 계열만
- PART B.5: 커뮤니티 댓글 중 employees, salaries 테이블 관련만

이것만 추출해서 마이그레이션 파일 만들어줘.
```

---

# 주요 특징 요약

## 테이블 구조 (PART A)
- **10개 메타데이터 테이블**: services, data_assets, asset_columns, data_lineage, asset_comments, permission_requests, asset_permissions, service_requests, pipelines, notifications
- **인덱스**: 성능 최적화를 위한 7개 인덱스
- **RLS 정책**: 모든 테이블에 Row Level Security 적용

## 샘플 데이터 (PART B)
- **3개 서비스**: 데이터플랫폼, 채용솔루션, 엔지니어링솔루션
- **32개 데이터 자산**: 다양한 업무 도메인 (HR, Sales, Product, DevOps) 테이블 메타데이터
- **컬럼 메타데이터**: employees, salaries 등 주요 테이블의 상세 컬럼 정보 (마스킹 정보 포함)
- **26개 데이터 리니지**: 테이블 간 데이터 흐름 관계
- **40개 이상 커뮤니티 댓글**: 한국어로 작성된 실무 팁과 주의사항
- **6개 권한 요청**: pending, approved, rejected 상태의 다양한 시나리오
- **실제 권한 데이터**: 승인된 요청에 대한 권한 부여

## 권한 시스템
- **3단계 권한**: viewer (조회), developer (개발), owner (관리)
- **민감도 레벨**: public, internal, confidential
- **PII 마스킹**: partial, full, hash 3가지 마스킹 타입
