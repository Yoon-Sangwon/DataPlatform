import { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  FileText,
  Calendar,
  LayoutGrid,
  List,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { ServiceRequest, ServiceRequestStatus } from '../../lib/supabase';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

interface MyRequestsListProps {
  requests: ServiceRequest[];
  loading: boolean;
  stats: {
    total: number;
    submitted: number;
    inProgress: number;
    completed: number;
  };
  statsLoading: boolean;
  onRequestClick: (request: ServiceRequest) => void;
}

type ViewMode = 'kanban' | 'list';

type KanbanColumn = {
  id: string;
  title: string;
  statuses: ServiceRequestStatus[];
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
};

const kanbanColumns: KanbanColumn[] = [
  {
    id: 'waiting',
    title: '대기',
    statuses: ['submitted', 'in_review'],
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: Clock,
  },
  {
    id: 'in_progress',
    title: '진행 중',
    statuses: ['approved', 'in_progress'],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: Loader2,
  },
  {
    id: 'completed',
    title: '완료',
    statuses: ['completed'],
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  {
    id: 'rejected',
    title: '반려',
    statuses: ['rejected', 'cancelled'],
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: XCircle,
  },
];

const statusConfig: Record<ServiceRequestStatus, { label: string; color: string; bgColor: string }> = {
  submitted: {
    label: '제출됨',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
  },
  in_review: {
    label: '검토 중',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
  },
  approved: {
    label: '승인됨',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  in_progress: {
    label: '처리 중',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
  },
  completed: {
    label: '완료',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/50',
  },
  rejected: {
    label: '반려',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/50',
  },
  cancelled: {
    label: '취소됨',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
  },
};

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  low: { label: '낮음', color: 'text-muted-foreground', dot: 'bg-gray-400' },
  medium: { label: '보통', color: 'text-foreground', dot: 'bg-blue-400' },
  high: { label: '높음', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-400' },
  urgent: { label: '긴급', color: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}분 전`;
    }
    return `${diffHours}시간 전`;
  }
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function formatFullDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MyRequestsList({
  requests,
  loading,
  stats,
  statsLoading,
  onRequestClick,
}: MyRequestsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const filteredRequests = requests.filter((req) => {
    if (searchQuery === '') return true;
    return (
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.request_type?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getColumnRequests = (column: KanbanColumn) => {
    return filteredRequests.filter((req) => column.statuses.includes(req.status));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="신청 검색..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">전체</span>
            <span className="font-semibold">{statsLoading ? '-' : stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">대기</span>
            <span className="font-semibold">{statsLoading ? '-' : stats.submitted}</span>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">진행</span>
            <span className="font-semibold">{statsLoading ? '-' : stats.inProgress}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">완료</span>
            <span className="font-semibold">{statsLoading ? '-' : stats.completed}</span>
          </div>
        </div>
        <div className="flex items-center border rounded-lg p-0.5 ml-auto">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3 gap-1.5"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
            보드
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3 gap-1.5"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
            목록
          </Button>
        </div>
      </div>

      {loading ? (
        viewMode === 'kanban' ? (
          <div className="flex-1 grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col">
                <Skeleton className="h-10 mb-3 rounded-lg" />
                <div className="space-y-3">
                  <Skeleton className="h-32 rounded-lg" />
                  <Skeleton className="h-32 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        )
      ) : viewMode === 'kanban' ? (
        <KanbanView
          columns={kanbanColumns}
          getColumnRequests={getColumnRequests}
          onRequestClick={onRequestClick}
        />
      ) : (
        <ListView
          requests={filteredRequests}
          onRequestClick={onRequestClick}
        />
      )}
    </div>
  );
}

function KanbanView({
  columns,
  getColumnRequests,
  onRequestClick,
}: {
  columns: KanbanColumn[];
  getColumnRequests: (column: KanbanColumn) => ServiceRequest[];
  onRequestClick: (request: ServiceRequest) => void;
}) {
  return (
    <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
      {columns.map((column) => {
        const columnRequests = getColumnRequests(column);
        const Icon = column.icon;

        return (
          <div key={column.id} className="flex flex-col min-h-0">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg mb-3 border',
                column.bgColor,
                column.borderColor
              )}
            >
              <Icon className={cn('h-4 w-4', column.color)} />
              <span className={cn('font-medium text-sm', column.color)}>
                {column.title}
              </span>
              <span
                className={cn(
                  'ml-auto text-xs font-semibold px-2 py-0.5 rounded-full',
                  column.bgColor,
                  column.color
                )}
              >
                {columnRequests.length}
              </span>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {columnRequests.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    신청 없음
                  </div>
                ) : (
                  columnRequests.map((request) => (
                    <KanbanCard
                      key={request.id}
                      request={request}
                      onClick={() => onRequestClick(request)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}

function ListView({
  requests,
  onRequestClick,
}: {
  requests: ServiceRequest[];
  onRequestClick: (request: ServiceRequest) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">신청 내역이 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b">
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">제목</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-32">유형</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-24">상태</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-20">우선순위</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-28">신청일</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <ListRow
              key={request.id}
              request={request}
              onClick={() => onRequestClick(request)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListRow({
  request,
  onClick,
}: {
  request: ServiceRequest;
  onClick: () => void;
}) {
  const status = statusConfig[request.status];
  const priorityInfo = priorityConfig[request.priority];

  return (
    <tr
      onClick={onClick}
      className="border-b hover:bg-muted/50 cursor-pointer transition-colors group"
    >
      <td className="py-3 px-4">
        <div className="font-medium text-sm line-clamp-1">{request.title}</div>
        {request.description && (
          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {request.description}
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <Badge variant="outline" className="text-xs font-normal">
          {request.request_type?.name || '기타'}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <span className={cn('text-xs font-medium px-2 py-1 rounded-md', status.bgColor, status.color)}>
          {status.label}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2 h-2 rounded-full', priorityInfo.dot)} />
          <span className={cn('text-xs', priorityInfo.color)}>{priorityInfo.label}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {formatFullDate(request.created_at)}
      </td>
      <td className="py-3 px-4">
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </td>
    </tr>
  );
}

function KanbanCard({
  request,
  onClick,
}: {
  request: ServiceRequest;
  onClick: () => void;
}) {
  const priorityInfo = priorityConfig[request.priority];
  const status = statusConfig[request.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border bg-card transition-all',
        'hover:shadow-md hover:shadow-black/5 hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-primary/20'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant="outline" className="text-xs font-normal">
          {request.request_type?.name || '기타'}
        </Badge>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={cn('w-2 h-2 rounded-full', priorityInfo.dot)} />
          <span className={cn('text-xs', priorityInfo.color)}>{priorityInfo.label}</span>
        </div>
      </div>

      <h4 className="font-medium text-sm line-clamp-2 mb-2">{request.title}</h4>

      {request.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {request.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(request.created_at)}
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 h-5 font-normal"
        >
          {status.label}
        </Badge>
      </div>
    </button>
  );
}
