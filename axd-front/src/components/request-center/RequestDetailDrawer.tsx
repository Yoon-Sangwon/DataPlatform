import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
  Eye,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { ServiceRequest, ServiceRequestStatus } from '../../lib/supabase';
import { cn } from '../../lib/utils';

interface RequestDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ServiceRequest | null;
}

const statusConfig: Record<ServiceRequestStatus, { label: string; color: string; icon: React.ElementType; description: string }> = {
  submitted: {
    label: '제출됨',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
    icon: Send,
    description: '요청이 접수되었습니다. 담당자 배정을 기다리고 있습니다.',
  },
  in_review: {
    label: '검토 중',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
    icon: Eye,
    description: '담당자가 요청을 검토하고 있습니다.',
  },
  approved: {
    label: '승인됨',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    icon: CheckCircle2,
    description: '요청이 승인되었습니다. 곧 작업이 시작됩니다.',
  },
  in_progress: {
    label: '진행 중',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400',
    icon: Loader2,
    description: '요청에 대한 작업이 진행 중입니다.',
  },
  completed: {
    label: '완료',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
    icon: CheckCircle2,
    description: '요청이 성공적으로 완료되었습니다.',
  },
  rejected: {
    label: '반려',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
    icon: XCircle,
    description: '요청이 반려되었습니다. 사유를 확인해 주세요.',
  },
  cancelled: {
    label: '취소됨',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: XCircle,
    description: '요청이 취소되었습니다.',
  },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: '낮음', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  medium: { label: '보통', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' },
  high: { label: '높음', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
  urgent: { label: '긴급', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' },
};

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RequestDetailDrawer({
  open,
  onOpenChange,
  request,
}: RequestDetailDrawerProps) {
  if (!request) return null;

  const status = statusConfig[request.status];
  const StatusIcon = status.icon;
  const priorityInfo = priorityConfig[request.priority];

  const formData = request.form_data as Record<string, string>;
  const formEntries = Object.entries(formData).filter(([, value]) => value);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-left pr-8">{request.title}</SheetTitle>
          <SheetDescription className="text-left">
            {request.request_type?.name} 요청
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 -mx-6 px-6">
          <div className="space-y-6">
            <div className={cn('rounded-lg p-4', status.color.split(' ')[0])}>
              <div className="flex items-center gap-3">
                <StatusIcon className="h-5 w-5" />
                <div>
                  <div className="font-semibold">{status.label}</div>
                  <div className="text-sm opacity-80">{status.description}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">우선순위</span>
                <div>
                  <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">카테고리</span>
                <div>
                  <Badge variant="outline">{request.category?.name}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border divide-y">
              <div className="p-3 flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">요청자</div>
                  <div className="text-sm">
                    {request.requester_name} ({request.requester_email})
                  </div>
                </div>
              </div>
              <div className="p-3 flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">요청일시</div>
                  <div className="text-sm">{formatDateTime(request.created_at)}</div>
                </div>
              </div>
              {request.due_date && (
                <div className="p-3 flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">희망 완료일</div>
                    <div className="text-sm">{request.due_date}</div>
                  </div>
                </div>
              )}
              {request.assignee_name && (
                <div className="p-3 flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">담당자</div>
                    <div className="text-sm">
                      {request.assignee_name}
                      {request.assignee_email && ` (${request.assignee_email})`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formEntries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">요청 상세</h4>
                <div className="rounded-lg border divide-y">
                  {formEntries.map(([key, value]) => (
                    <div key={key} className="p-3">
                      <div className="text-xs text-muted-foreground mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {request.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">추가 설명</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            )}

            {request.admin_notes && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h4 className="text-sm font-medium">담당자 메모</h4>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {request.admin_notes}
                </p>
              </div>
            )}

            {request.completed_at && (
              <div className="text-sm text-muted-foreground">
                완료일: {formatDateTime(request.completed_at)}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
