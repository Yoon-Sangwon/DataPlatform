import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Check, X, XCircle, Table2 } from 'lucide-react';
import { useMyPermissionRequests, getStatusLabel, getStatusColor, getLevelLabel } from '../../hooks/useMyPermissionRequests';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';

interface MyPermissionRequestsProps {
  onSelectAsset: (assetId: string) => void;
}

export function MyPermissionRequests({ onSelectAsset }: MyPermissionRequestsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { requests, loading, cancelRequest } = useMyPermissionRequests();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const otherRequests = requests.filter(r => r.status !== 'pending').slice(0, 5);

  const handleCancel = async (requestId: string) => {
    setCancellingId(requestId);
    await cancelRequest(requestId);
    setCancellingId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'approved':
        return <Check className="h-3 w-3" />;
      case 'rejected':
        return <X className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string): 'warning' | 'success' | 'error' | 'secondary' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="border-t p-3">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="border-t">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span>내 권한 신청</span>
        {pendingRequests.length > 0 && (
          <Badge variant="warning" className="ml-auto text-[10px] px-1.5 py-0">
            {pendingRequests.length}
          </Badge>
        )}
      </button>

      {isExpanded && (
        <div className="px-2 pb-2 space-y-1">
          {pendingRequests.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                대기 중
              </div>
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-md border bg-card p-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => onSelectAsset(request.asset_id)}
                      className="flex items-center gap-1.5 text-left hover:text-primary transition-colors flex-1 min-w-0"
                    >
                      <Table2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="font-medium truncate">{request.asset_name || '알 수 없음'}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0"
                      onClick={() => handleCancel(request.id)}
                      disabled={cancellingId === request.id}
                    >
                      {cancellingId === request.id ? '취소 중...' : '신청 취소'}
                    </Button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant={getStatusBadgeVariant(request.status)} className="text-[10px] gap-0.5 shrink-0">
                      {getStatusIcon(request.status)}
                      {getLevelLabel(request.requested_level)} {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {otherRequests.length > 0 && (
            <div className="space-y-1 mt-2">
              <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                최근 처리됨
              </div>
              {otherRequests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => onSelectAsset(request.asset_id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                >
                  <Table2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span className="truncate flex-1 text-left">{request.asset_name || '알 수 없음'}</span>
                  <span className={cn('text-[10px]', getStatusColor(request.status))}>
                    {getStatusLabel(request.status)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
