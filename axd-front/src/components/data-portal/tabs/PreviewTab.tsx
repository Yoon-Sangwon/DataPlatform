import { useState, useEffect } from 'react';
import { Eye, Lock, Shield, AlertTriangle } from 'lucide-react';
import { AssetColumn, DataAsset } from '../../../lib/supabase';
import { Badge } from '../../ui/badge';
import { Watermark } from '../../ui/watermark';

interface PreviewTabProps {
  asset: DataAsset;
  columns: AssetColumn[];
  canViewPreview: boolean;
  hasPiiAccess: boolean;
  onRequestAccess: () => void;
}

interface SampleRow {
  [key: string]: unknown;
}

const SAMPLE_DATA: Record<string, SampleRow[]> = {
  users: [
    { id: 1, email: 'kim@example.com', name: '김철수', created_at: '2024-01-15', phone: '010-1234-5678' },
    { id: 2, email: 'lee@example.com', name: '이영희', created_at: '2024-02-20', phone: '010-2345-6789' },
    { id: 3, email: 'park@example.com', name: '박민수', created_at: '2024-03-10', phone: '010-3456-7890' },
    { id: 4, email: 'choi@example.com', name: '최지현', created_at: '2024-04-05', phone: '010-4567-8901' },
    { id: 5, email: 'jung@example.com', name: '정우진', created_at: '2024-05-12', phone: '010-5678-9012' },
    { id: 6, email: 'kang@example.com', name: '강서연', created_at: '2024-06-01', phone: '010-6789-0123' },
    { id: 7, email: 'yoon@example.com', name: '윤하늘', created_at: '2024-06-15', phone: '010-7890-1234' },
    { id: 8, email: 'han@example.com', name: '한지민', created_at: '2024-07-01', phone: '010-8901-2345' },
    { id: 9, email: 'oh@example.com', name: '오준혁', created_at: '2024-07-20', phone: '010-9012-3456' },
    { id: 10, email: 'seo@example.com', name: '서민아', created_at: '2024-08-05', phone: '010-0123-4567' },
  ],
  orders: [
    { order_id: 'ORD-001', user_id: 1, amount: 59000, status: 'completed', created_at: '2024-12-01' },
    { order_id: 'ORD-002', user_id: 2, amount: 128000, status: 'completed', created_at: '2024-12-02' },
    { order_id: 'ORD-003', user_id: 1, amount: 35000, status: 'pending', created_at: '2024-12-03' },
    { order_id: 'ORD-004', user_id: 3, amount: 89000, status: 'completed', created_at: '2024-12-04' },
    { order_id: 'ORD-005', user_id: 4, amount: 245000, status: 'shipped', created_at: '2024-12-05' },
    { order_id: 'ORD-006', user_id: 2, amount: 67000, status: 'completed', created_at: '2024-12-06' },
    { order_id: 'ORD-007', user_id: 5, amount: 99000, status: 'pending', created_at: '2024-12-07' },
    { order_id: 'ORD-008', user_id: 1, amount: 156000, status: 'completed', created_at: '2024-12-08' },
    { order_id: 'ORD-009', user_id: 6, amount: 42000, status: 'shipped', created_at: '2024-12-09' },
    { order_id: 'ORD-010', user_id: 3, amount: 78000, status: 'completed', created_at: '2024-12-10' },
  ],
  employees: [
    { employee_id: 'EMP001', first_name: 'John', last_name: 'Doe', email: 'john.doe@company.com', department: 'Engineering', salary: 85000000 },
    { employee_id: 'EMP002', first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@company.com', department: 'Engineering', salary: 92000000 },
    { employee_id: 'EMP003', first_name: 'Mike', last_name: 'Johnson', email: 'mike.johnson@company.com', department: 'Product', salary: 78000000 },
    { employee_id: 'EMP004', first_name: 'Sarah', last_name: 'Williams', email: 'sarah.williams@company.com', department: 'HR', salary: 72000000 },
    { employee_id: 'EMP005', first_name: 'David', last_name: 'Brown', email: 'david.brown@company.com', department: 'Finance', salary: 88000000 },
    { employee_id: 'EMP006', first_name: 'Emily', last_name: 'Davis', email: 'emily.davis@company.com', department: 'Marketing', salary: 75000000 },
    { employee_id: 'EMP007', first_name: 'James', last_name: 'Wilson', email: 'james.wilson@company.com', department: 'Engineering', salary: 95000000 },
    { employee_id: 'EMP008', first_name: 'Lisa', last_name: 'Taylor', email: 'lisa.taylor@company.com', department: 'Design', salary: 70000000 },
    { employee_id: 'EMP009', first_name: 'Robert', last_name: 'Anderson', email: 'robert.anderson@company.com', department: 'Sales', salary: 82000000 },
    { employee_id: 'EMP010', first_name: 'Jennifer', last_name: 'Thomas', email: 'jennifer.thomas@company.com', department: 'Engineering', salary: 90000000 },
  ],
};

function generateSampleData(columns: AssetColumn[]): SampleRow[] {
  const rows: SampleRow[] = [];
  for (let i = 0; i < 10; i++) {
    const row: SampleRow = {};
    columns.forEach((col) => {
      if (col.data_type.includes('int') || col.data_type === 'bigint') {
        row[col.column_name] = Math.floor(Math.random() * 1000) + 1;
      } else if (col.data_type.includes('decimal') || col.data_type.includes('numeric')) {
        row[col.column_name] = (Math.random() * 10000).toFixed(2);
      } else if (col.data_type.includes('bool')) {
        row[col.column_name] = Math.random() > 0.5;
      } else if (col.data_type.includes('timestamp') || col.data_type.includes('date')) {
        const date = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        row[col.column_name] = date.toISOString().split('T')[0];
      } else if (col.column_name.includes('email')) {
        row[col.column_name] = `user${i + 1}@example.com`;
      } else if (col.column_name.includes('name')) {
        row[col.column_name] = `Sample Name ${i + 1}`;
      } else {
        row[col.column_name] = `value_${i + 1}`;
      }
    });
    rows.push(row);
  }
  return rows;
}

function maskValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  const str = String(value);
  if (str.length <= 2) return '**';
  return str.charAt(0) + '*'.repeat(Math.min(str.length - 2, 6)) + str.charAt(str.length - 1);
}

export function PreviewTab({
  asset,
  columns,
  canViewPreview,
  hasPiiAccess,
  onRequestAccess,
}: PreviewTabProps) {
  const [sampleData, setSampleData] = useState<SampleRow[]>([]);

  useEffect(() => {
    const tableName = asset.name.toLowerCase();
    if (SAMPLE_DATA[tableName]) {
      setSampleData(SAMPLE_DATA[tableName]);
    } else {
      setSampleData(generateSampleData(columns));
    }
  }, [asset.name, columns]);

  const piiColumns = new Set(columns.filter((col) => col.is_pii).map((col) => col.column_name));

  if (!canViewPreview) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-muted/50 rounded-full p-4 mb-4">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">데이터 미리보기 권한이 필요합니다</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          이 테이블은 PRIVATE 등급으로, 데이터 미리보기를 위해서는 권한 신청이 필요합니다.
        </p>
        <button
          onClick={onRequestAccess}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          권한 신청하기
        </button>
      </div>
    );
  }

  const displayColumns = columns.slice(0, 8);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium text-sm">데이터 미리보기</h3>
            <p className="text-xs text-muted-foreground">
              최대 10개 행만 표시됩니다
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {piiColumns.size > 0 && !hasPiiAccess && (
            <Badge variant="warning" className="gap-1">
              <Shield className="h-3 w-3" />
              {piiColumns.size}개 개인정보 컬럼 마스킹
            </Badge>
          )}
          {piiColumns.size > 0 && hasPiiAccess && (
            <Badge variant="success" className="gap-1">
              <Shield className="h-3 w-3" />
              개인정보 열람 권한 보유
            </Badge>
          )}
        </div>
      </div>

      {piiColumns.size > 0 && !hasPiiAccess && (
        <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              개인정보 보호 안내
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              이 테이블에는 개인정보가 포함되어 있습니다. 마스킹된 컬럼: {Array.from(piiColumns).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 relative">
        <Watermark text="PREVIEW ONLY" />

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {displayColumns.map((column) => (
                  <th
                    key={column.id}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      {column.column_name}
                      {column.is_pii && (
                        <Shield className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-muted/30 transition-colors border-t"
                >
                  {displayColumns.map((column) => {
                    const value = row[column.column_name];
                    const isPiiColumn = piiColumns.has(column.column_name);
                    const shouldMask = isPiiColumn && !hasPiiAccess;

                    return (
                      <td
                        key={column.column_name}
                        className="px-4 py-2.5 text-sm whitespace-nowrap"
                      >
                        {value === null || value === undefined ? (
                          <span className="text-muted-foreground italic">NULL</span>
                        ) : shouldMask ? (
                          <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {maskValue(value)}
                          </span>
                        ) : (
                          String(value)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          미리보기 데이터는 샘플이며, 실제 데이터와 다를 수 있습니다.
        </p>
      </div>
    </div>
  );
}
