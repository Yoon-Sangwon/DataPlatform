import { useState } from 'react';
import { Search, ArrowUpDown, Check, AlertTriangle, AlertCircle, Shield } from 'lucide-react';
import { AssetColumn } from '../../../lib/supabase';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';

interface SchemaTabProps {
  columns: AssetColumn[];
}

type SortKey = 'ordinal_position' | 'column_name' | 'dq_null_ratio';

function DqFreshnessIndicator({ status }: { status: string }) {
  if (status === 'good') {
    return (
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-muted-foreground">양호</span>
      </div>
    );
  }
  if (status === 'warning') {
    return (
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse-dot" />
        <span className="text-xs text-amber-500">주의</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse-dot" />
      <span className="text-xs text-red-500">위험</span>
    </div>
  );
}

function NullRatioBar({ ratio }: { ratio: number }) {
  const getColor = () => {
    if (ratio <= 5) return 'bg-emerald-500';
    if (ratio <= 15) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getColor())}
          style={{ width: `${Math.min(ratio, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-12">{ratio.toFixed(1)}%</span>
    </div>
  );
}

export function SchemaTab({ columns }: SchemaTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ordinal_position');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredColumns = columns.filter((col) =>
    col.column_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    col.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedColumns = [...filteredColumns].sort((a, b) => {
    let comparison = 0;
    if (sortKey === 'ordinal_position') {
      comparison = a.ordinal_position - b.ordinal_position;
    } else if (sortKey === 'column_name') {
      comparison = a.column_name.localeCompare(b.column_name);
    } else if (sortKey === 'dq_null_ratio') {
      comparison = a.dq_null_ratio - b.dq_null_ratio;
    }
    return sortAsc ? comparison : -comparison;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const avgNullRatio = columns.length > 0
    ? columns.reduce((sum, col) => sum + col.dq_null_ratio, 0) / columns.length
    : 0;

  const warningCount = columns.filter((col) => col.dq_freshness === 'warning').length;
  const criticalCount = columns.filter((col) => col.dq_freshness === 'critical').length;
  const piiCount = columns.filter((col) => col.is_pii).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="컬럼 검색..."
            className="pl-8 h-8"
          />
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">{columns.length}개 컬럼</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">평균 Null 비율:</span>
            <span className={cn(
              'font-medium',
              avgNullRatio <= 5 ? 'text-emerald-500' :
                avgNullRatio <= 15 ? 'text-amber-500' : 'text-red-500'
            )}>
              {avgNullRatio.toFixed(1)}%
            </span>
          </div>
          {warningCount > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} 주의
              </Badge>
            </>
          )}
          {criticalCount > 0 && (
            <Badge variant="error" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {criticalCount} 위험
            </Badge>
          )}
          {piiCount > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400">
                <Shield className="h-3 w-3" />
                {piiCount} 개인정보
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
            <tr className="border-b">
              <th
                className="text-left p-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('ordinal_position')}
              >
                <div className="flex items-center gap-1">
                  #
                  {sortKey === 'ordinal_position' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th
                className="text-left p-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('column_name')}
              >
                <div className="flex items-center gap-1">
                  컬럼명
                  {sortKey === 'column_name' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                타입
              </th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                설명
              </th>
              <th className="text-center p-3 text-xs font-semibold text-muted-foreground">
                Nullable
              </th>
              <th
                className="text-left p-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('dq_null_ratio')}
              >
                <div className="flex items-center gap-1">
                  Null 비율
                  {sortKey === 'dq_null_ratio' && (
                    <ArrowUpDown className="h-3 w-3" />
                  )}
                </div>
              </th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                신선도
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedColumns.map((column) => (
              <tr
                key={column.id}
                className="border-b hover:bg-muted/30 transition-colors"
              >
                <td className="p-3 text-sm text-muted-foreground">
                  {column.ordinal_position}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                      {column.column_name}
                    </code>
                    {column.is_pii && (
                      <Shield className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {column.data_type}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">
                  {column.description || '-'}
                </td>
                <td className="p-3 text-center">
                  {column.is_nullable ? (
                    <Badge variant="secondary" className="text-xs">YES</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">NO</Badge>
                  )}
                </td>
                <td className="p-3">
                  <NullRatioBar ratio={column.dq_null_ratio} />
                </td>
                <td className="p-3">
                  <DqFreshnessIndicator status={column.dq_freshness} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedColumns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `"${searchQuery}"에 대한 결과가 없습니다` : '컬럼 정보가 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
