import { useState, useEffect } from 'react';
import { Check, X, User, Calendar, Clock, MessageSquare, FileText, Shield } from 'lucide-react';
import { useAssetPermissionRequests } from '../../../hooks/useAssetPermissionRequests';
import { useAllPermissionRequests } from '../../../hooks/useAllPermissionRequests';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Skeleton } from '../../ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../../../lib/supabase';

interface PermissionRequestsTabProps {
  assetId: string;
}

export function PermissionRequestsTab({ assetId }: PermissionRequestsTabProps) {
  const { requests, loading, refresh } = useAssetPermissionRequests(assetId);
  const { approveRequest, rejectRequest } = useAllPermissionRequests();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPermissions, setCurrentPermissions] = useState<any[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  useEffect(() => {
    const fetchCurrentPermissions = async () => {
      setLoadingPermissions(true);
      try {
        const { data, error } = await supabase
          .from('asset_permissions')
          .select('*')
          .eq('asset_id', assetId)
          .is('revoked_at', null);

        if (error) throw error;

        const validPermissions = (data || []).filter((perm: any) => {
          if (!perm.expires_at) return true;
          return new Date(perm.expires_at) > new Date();
        });

        setCurrentPermissions(validPermissions);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchCurrentPermissions();
  }, [assetId, requests]);

  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === pendingRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map((r) => r.id)));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return;

    if (action === 'reject' && !comment.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    setProcessing(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          action === 'approve'
            ? approveRequest(id, comment)
            : rejectRequest(id, comment)
        )
      );

      const failedCount = results.filter((r) => !r.success).length;
      if (failedCount > 0) {
        alert(`${failedCount}개 요청 처리 실패`);
      } else {
        alert(`${selectedIds.size}개 요청이 ${action === 'approve' ? '승인' : '반려'}되었습니다.`);
      }

      setSelectedIds(new Set());
      setComment('');
      await refresh();
    } catch (error) {
      console.error('Bulk action failed:', error);
      alert('일괄 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

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
          await refresh();
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
          await refresh();
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

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          이 테이블에 대한 권한 요청이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              승인 대기 중 ({pendingRequests.length})
            </h3>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{selectedIds.size}개 선택됨</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 h-7 text-xs"
                  onClick={() => setActionType('reject')}
                  disabled={processing}
                >
                  <X className="w-3 h-3 mr-1" />
                  일괄 반려
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                  onClick={() => setActionType('approve')}
                  disabled={processing}
                >
                  <Check className="w-3 h-3 mr-1" />
                  일괄 승인
                </Button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={selectedIds.size === pendingRequests.length && pendingRequests.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-xs text-gray-500">전체 선택</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex flex-col"
                >
                  <div className="flex items-start gap-2.5 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(request.id)}
                      onChange={() => handleSelectToggle(request.id)}
                      className="w-4 h-4 rounded border-gray-300 mt-0.5 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {request.requester_name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-2">
                        {request.requester_email}
                      </p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5 mb-2">
                        {getLevelLabel(request.requested_level)}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-12">목적:</span>
                      <span>{getPurposeLabel(request.purpose_category)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-12">기간:</span>
                      <Calendar className="w-3 h-3" />
                      <span>{getDurationLabel(request.duration)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300 w-12">신청:</span>
                      <span>{format(new Date(request.created_at), 'MM/dd HH:mm', { locale: ko })}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 mb-3 flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                      {request.reason}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 h-8 text-xs"
                      onClick={() => handleAction(request, 'reject')}
                    >
                      <X className="w-3 h-3 mr-1" />
                      반려
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                      onClick={() => handleAction(request, 'approve')}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      승인
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentPermissions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            현재 권한 보유 ({currentPermissions.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {currentPermissions.map((perm) => (
              <div
                key={perm.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {perm.user_name || perm.user_email || perm.user_id}
                  </span>
                </div>
                {perm.user_email && perm.user_name && (
                  <p className="text-xs text-gray-500 truncate mb-2">{perm.user_email}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0.5 h-5 ${
                      perm.permission_level === 'owner'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300'
                        : perm.permission_level === 'editor'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {getLevelLabel(perm.permission_level)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {perm.expires_at
                      ? format(new Date(perm.expires_at), 'MM/dd', { locale: ko })
                      : '영구'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            처리 완료 ({processedRequests.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {processedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {request.requester_name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mb-2">{request.requester_email}</p>

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge
                    className={`text-[10px] px-1.5 py-0.5 h-5 ${
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}
                  >
                    {request.status === 'approved' ? '승인' : '반려'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 h-5">
                    {getLevelLabel(request.requested_level)}
                  </Badge>
                </div>

                {request.reviewer_comment && (
                  <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded p-2">
                    <p className="text-xs text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {request.reviewer_comment}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {request.reviewer_name} •{' '}
                      {request.reviewed_at &&
                        format(new Date(request.reviewed_at), 'MM/dd HH:mm', { locale: ko })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={!!selectedRequest || (!!actionType && selectedIds.size > 0)}
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
          setComment('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? '권한 요청 승인' : '권한 요청 반려'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  요청자: {selectedRequest?.requester_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  이메일: {selectedRequest?.requester_email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  요청 권한: {selectedRequest && getLevelLabel(selectedRequest.requested_level)}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  선택된 요청 {selectedIds.size}개를 일괄 처리합니다
                </p>
              </div>
            )}

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
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setComment('');
              }}
              disabled={processing}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  handleConfirmAction();
                } else {
                  handleBulkAction(actionType!);
                  setActionType(null);
                }
              }}
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
