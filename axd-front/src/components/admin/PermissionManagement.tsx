import { useState } from 'react';
import { Check, X, Clock, User, Database, Calendar, MessageSquare, Filter } from 'lucide-react';
import { useAllPermissionRequests } from '../../hooks/useAllPermissionRequests';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function PermissionManagement() {
  const [activeTab, setActiveTab] = useState<'pending' | 'processed' | 'all'>('pending');
  const { requests, loading, approveRequest, rejectRequest } = useAllPermissionRequests(
    activeTab === 'pending' ? 'pending' : activeTab === 'processed' ? undefined : undefined
  );
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const filteredRequests =
    activeTab === 'processed'
      ? requests.filter((r) => r.status === 'approved' || r.status === 'rejected')
      : requests.filter((r) => (activeTab === 'pending' ? r.status === 'pending' : true));

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  const handleAction = (request: any, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setComment('');
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);

    try {
      if (actionType === 'approve') {
        const result = await approveRequest(selectedRequest.id, comment);
        if (result.success) {
          alert('권한 요청이 승인되었습니다.');
        } else {
          alert('승인 실패: ' + result.error);
        }
      } else {
        if (!comment.trim()) {
          alert('반려 사유를 입력해주세요.');
          setProcessing(false);
          return;
        }
        const result = await rejectRequest(selectedRequest.id, comment);
        if (result.success) {
          alert('권한 요청이 반려되었습니다.');
        } else {
          alert('반려 실패: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('작업 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
      setSelectedRequest(null);
      setActionType(null);
      setComment('');
    }
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      viewer: '조회',
      developer: '개발자',
      owner: '관리자',
    };
    return labels[level] || level;
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      analysis: '데이터 분석',
      reporting: '리포트 작성',
      development: '개발/테스트',
      other: '기타',
    };
    return labels[purpose] || purpose;
  };

  const getDurationLabel = (duration: string) => {
    const labels: Record<string, string> = {
      '1month': '1개월',
      '3months': '3개월',
      '6months': '6개월',
      permanent: '영구',
    };
    return labels[duration] || duration;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">권한 요청 관리</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            데이터 자산에 대한 권한 요청을 검토하고 승인/반려할 수 있습니다
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-gray-600 dark:text-gray-400">대기: {pendingCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">승인: {approvedCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-red-500" />
            <span className="text-gray-600 dark:text-gray-400">반려: {rejectedCount}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">대기 중 ({pendingCount})</TabsTrigger>
          <TabsTrigger value="processed">처리 완료 ({approvedCount + rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">전체 ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">표시할 요청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {request.data_assets?.name || '데이터 자산'}
                        </h3>
                        <Badge
                          variant={
                            request.status === 'pending'
                              ? 'default'
                              : request.status === 'approved'
                              ? 'default'
                              : 'destructive'
                          }
                          className={
                            request.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                              : request.status === 'approved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : ''
                          }
                        >
                          {request.status === 'pending'
                            ? '대기'
                            : request.status === 'approved'
                            ? '승인'
                            : '반려'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {request.data_assets?.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">요청자</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.requester_name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {request.requester_email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">요청 권한</p>
                      <Badge variant="outline" className="font-medium">
                        {getLevelLabel(request.requested_level)}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">사용 목적</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {getPurposeLabel(request.purpose_category)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">사용 기간</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getDurationLabel(request.duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">신청 사유</p>
                    <p className="text-sm text-gray-900 dark:text-white">{request.reason}</p>
                  </div>

                  {request.reviewer_comment && (
                    <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          검토자 코멘트
                        </p>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {request.reviewer_comment}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        검토자: {request.reviewer_name} |{' '}
                        {request.reviewed_at &&
                          format(new Date(request.reviewed_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      신청일: {format(new Date(request.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </p>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                          onClick={() => handleAction(request, 'reject')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          반려
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAction(request, 'approve')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          승인
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? '권한 요청 승인' : '권한 요청 반려'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {selectedRequest?.data_assets?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                요청자: {selectedRequest?.requester_name} ({selectedRequest?.requester_email})
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                요청 권한: {selectedRequest && getLevelLabel(selectedRequest.requested_level)}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                {actionType === 'approve' ? '코멘트 (선택사항)' : '반려 사유 (필수)'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full h-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={
                  actionType === 'approve'
                    ? '승인 관련 추가 안내사항을 입력하세요...'
                    : '반려 사유를 입력하세요...'
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)} disabled={processing}>
              취소
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={processing}
              className={
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }
            >
              {processing
                ? '처리 중...'
                : actionType === 'approve'
                ? '승인 확정'
                : '반려 확정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
