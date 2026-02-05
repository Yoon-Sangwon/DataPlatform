import { Users, FileText, MessageSquare, CheckCircle, Clock, TrendingUp, LayoutGrid } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdminStats';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { PermissionManagement } from './PermissionManagement';
import { ServiceRequestManagement } from './ServiceRequestManagement';
import { CommentModeration } from './CommentModeration';

export function AdminDashboard() {
  const { stats, loading } = useAdminStats();

  const statCards = [
    {
      title: '승인 대기 권한 요청',
      value: stats.pendingPermissions,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '검토가 필요한 권한 요청',
    },
    {
      title: '미처리 서비스 요청',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: '대기 중인 서비스 요청',
    },
    {
      title: '신규 댓글',
      value: stats.newComments,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '최근 24시간 내 작성된 댓글',
    },
    {
      title: '활성 사용자',
      value: stats.activeUsers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '오늘 활동한 사용자',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">관리자 대시보드</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          데이터 플랫폼 관리 및 모니터링
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutGrid className="w-4 h-4 mr-2" />
            개요
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <FileText className="w-4 h-4 mr-2" />
            권한 관리
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Clock className="w-4 h-4 mr-2" />
            서비스 요청
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="w-4 h-4 mr-2" />
            댓글 모니터링
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {card.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                          {card.value}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {card.description}
                        </p>
                      </div>
                      <div className={`${card.bgColor} dark:bg-opacity-20 p-3 rounded-lg`}>
                        <Icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                최근 활동
              </h2>
              <div className="space-y-4">
                <ActivityItem
                  type="permission"
                  title="김철수님의 권한 요청 승인"
                  description="고객_주문_데이터 테이블 - 조회 권한"
                  time="5분 전"
                  status="approved"
                />
                <ActivityItem
                  type="request"
                  title="신규 서비스 요청 제출"
                  description="데이터 추출 요청 - 이지은님"
                  time="12분 전"
                  status="pending"
                />
                <ActivityItem
                  type="comment"
                  title="새로운 댓글 작성"
                  description="매출_분석_테이블에 댓글 2건"
                  time="25분 전"
                  status="new"
                />
                <ActivityItem
                  type="permission"
                  title="박민지님의 권한 요청 반려"
                  description="결제_정보_테이블 - 관리자 권한"
                  time="1시간 전"
                  status="rejected"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                주간 통계
              </h2>
              <div className="space-y-4">
                <StatRow label="처리된 권한 요청" value="24건" trend="+12%" />
                <StatRow label="완료된 서비스 요청" value="18건" trend="+8%" />
                <StatRow label="평균 처리 시간" value="2.3시간" trend="-15%" isImprovement />
                <StatRow label="사용자 만족도" value="4.8/5.0" trend="+0.2" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionManagement />
        </TabsContent>

        <TabsContent value="requests">
          <ServiceRequestManagement />
        </TabsContent>

        <TabsContent value="comments">
          <CommentModeration />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ActivityItemProps {
  type: 'permission' | 'request' | 'comment';
  title: string;
  description: string;
  time: string;
  status: 'approved' | 'rejected' | 'pending' | 'new';
}

function ActivityItem({ type, title, description, time, status }: ActivityItemProps) {
  const statusColors = {
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };

  const statusLabels = {
    approved: '승인',
    rejected: '반려',
    pending: '대기',
    new: '신규',
  };

  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {description}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{time}</p>
      </div>
      <span
        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusColors[status]}`}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  trend: string;
  isImprovement?: boolean;
}

function StatRow({ label, value, trend, isImprovement = false }: StatRowProps) {
  const trendColor = trend.startsWith('+')
    ? isImprovement
      ? 'text-green-600'
      : 'text-blue-600'
    : isImprovement
    ? 'text-red-600'
    : 'text-green-600';

  return (
    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
        <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>
      </div>
    </div>
  );
}
