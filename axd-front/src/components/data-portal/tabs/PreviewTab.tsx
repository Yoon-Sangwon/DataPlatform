import { useState, useEffect } from 'react';
import { Eye, Lock, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { AssetColumn, DataAsset } from '../../../lib/supabase';
import { Badge } from '../../ui/badge';
import { Watermark } from '../../ui/watermark';
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPreview() {
      if (!canViewPreview || !asset.id) return;
      
      try {
        setLoading(true);
        const response = await axios.get<SampleRow[]>(`/api/v1/assets/${asset.id}/preview`);
        setSampleData(response.data);
      } catch (error) {
        console.error('Failed to fetch preview:', error);
        setSampleData([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPreview();
  }, [asset.id, canViewPreview]);

  const piiColumns = new Set(columns.filter((col) => col.is_pii).map((col) => col.column_name));

  if (!canViewPreview) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-muted/50 rounded-full p-4 mb-4">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">데이터 미리보기 권한이 필요합니다</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          이 테이블은 {asset.sensitivity_level.toUpperCase()} 등급으로, 데이터 미리보기를 위해서는 권한 신청이 필요합니다.
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

  const displayColumns = columns.length > 0 ? columns.slice(0, 10) : [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-medium text-sm">데이터 미리보기</h3>
            <p className="text-xs text-muted-foreground">
              DB에서 직접 조회한 실제 데이터 (최대 10개 행)
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

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : sampleData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          표시할 데이터가 없습니다. (테이블이 비어있거나 생성되지 않음)
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 relative">
          <Watermark text="ACTUAL DATA" />

          <div className="rounded-lg border overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  {Object.keys(sampleData[0] || {}).map((colName) => (
                    <th
                      key={colName}
                      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {colName}
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
                    {Object.values(row).map((val, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-2.5 text-sm whitespace-nowrap"
                      >
                        {val === null || val === undefined ? (
                          <span className="text-muted-foreground italic text-xs">NULL</span>
                        ) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
