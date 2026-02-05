import { Download, Clock, DollarSign, Database } from 'lucide-react';
import { QueryResult } from './SQLWorkspace';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Watermark } from '../ui/watermark';
import { formatNumber } from '../../lib/utils';

interface ResultPanelProps {
  result: QueryResult | null;
  isRunning: boolean;
}

export function ResultPanel({ result, isRunning }: ResultPanelProps) {
  const handleExportCSV = () => {
    if (!result) return;

    const headers = result.columns.join(',');
    const rows = result.rows.map((row) =>
      result.columns.map((col) => JSON.stringify(row[col] ?? '')).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_result.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isRunning) {
    return (
      <div className="flex-1 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          쿼리 실행 중...
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-medium mb-1">결과 없음</h3>
        <p className="text-xs text-muted-foreground">
          SQL 쿼리를 실행하면 결과가 여기에 표시됩니다
        </p>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="flex-1 p-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <h3 className="text-sm font-medium text-destructive mb-2">쿼리 오류</h3>
          <pre className="text-xs text-destructive/80 whitespace-pre-wrap font-mono">
            {result.error}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">행:</span>
            <span className="font-medium">{formatNumber(result.rowCount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">실행 시간:</span>
            <span className="font-medium">{result.executionTime}ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">비용:</span>
            <span className="font-medium">${result.cost.toFixed(4)}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
          <Download className="h-3.5 w-3.5" />
          CSV 내보내기
        </Button>
      </div>

      <ScrollArea className="flex-1 relative">
        <Watermark text="QUERY RESULT" opacity={0.04} />
        <div className="min-w-max relative z-10">
          <table className="w-full">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <tr>
                {result.columns.map((column) => (
                  <th
                    key={column}
                    className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground border-b whitespace-nowrap"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {result.columns.map((column) => (
                    <td
                      key={column}
                      className="px-4 py-2 text-sm border-b whitespace-nowrap max-w-xs truncate"
                    >
                      {row[column] === null ? (
                        <span className="text-muted-foreground italic">NULL</span>
                      ) : (
                        String(row[column])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
