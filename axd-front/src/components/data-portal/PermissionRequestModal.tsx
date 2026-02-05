import { useState, useEffect } from 'react';
import { Lock, Send, Eye, Code2, Shield, User, ArrowUp, CheckCircle2, Loader2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/toast';
import { PurposeCategory, RequestDuration, PermissionLevel } from '../../lib/supabase';

interface PermissionRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetName: string;
  ownerName?: string;
  ownerEmail?: string;
  currentPermissionLevel: PermissionLevel;
  onSubmit: (data: PermissionRequestFormData) => Promise<boolean>;
}

export interface PermissionRequestFormData {
  requestedLevel: 'viewer' | 'developer' | 'owner';
  purposeCategory: PurposeCategory;
  reason: string;
  duration: RequestDuration;
}

const purposeOptions: { value: PurposeCategory; label: string; description: string }[] = [
  { value: 'analysis', label: '데이터 분석', description: '데이터 탐색 및 인사이트 도출' },
  { value: 'reporting', label: '리포팅/대시보드', description: '정기 보고서 또는 대시보드 작성' },
  { value: 'development', label: '개발/테스트', description: '기능 개발 또는 테스트 목적' },
  { value: 'other', label: '기타', description: '위에 해당하지 않는 경우' },
];

const durationOptions: { value: RequestDuration; label: string }[] = [
  { value: '1month', label: '1개월' },
  { value: '3months', label: '3개월' },
  { value: '6months', label: '6개월' },
  { value: 'permanent', label: '영구' },
];

export function PermissionRequestModal({
  open,
  onOpenChange,
  assetName,
  ownerName,
  ownerEmail,
  currentPermissionLevel,
  onSubmit,
}: PermissionRequestModalProps) {
  const { addToast } = useToast();
  const isUpgrade = currentPermissionLevel !== 'none';
  const getDefaultLevel = () => {
    if (currentPermissionLevel === 'none') return 'viewer';
    if (currentPermissionLevel === 'viewer') return 'developer';
    return 'viewer';
  };
  const defaultLevel = getDefaultLevel();

  const [requestedLevel, setRequestedLevel] = useState<'viewer' | 'developer' | 'owner'>(defaultLevel);
  const [purposeCategory, setPurposeCategory] = useState<PurposeCategory>('analysis');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<RequestDuration>('3months');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRequestedLevel(getDefaultLevel());
    }
  }, [open, currentPermissionLevel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        requestedLevel,
        purposeCategory,
        reason,
        duration,
      });

      if (success) {
        addToast({
          type: 'success',
          title: isUpgrade ? '권한 업그레이드 신청 완료' : '권한 신청 완료',
          description: '담당자 승인 후 권한이 부여됩니다. 보통 1-2 영업일이 소요됩니다.',
        });
        setRequestedLevel(defaultLevel);
        setPurposeCategory('analysis');
        setReason('');
        setDuration('3months');
        onOpenChange(false);
      } else {
        addToast({
          type: 'error',
          title: '신청 실패',
          description: '권한 신청 중 문제가 발생했습니다. 다시 시도해 주세요.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: '오류 발생',
        description: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isSubmitting) return;
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade ? (
              <ArrowUp className="h-5 w-5 text-blue-500" />
            ) : (
              <Lock className="h-5 w-5 text-amber-500" />
            )}
            {isUpgrade ? '권한 업그레이드 신청' : '권한 신청'}
          </DialogTitle>
          <DialogDescription>
            <Badge variant="secondary" className="mt-2">
              {assetName}
            </Badge>
            <span className="block mt-2">
              {isUpgrade
                ? '더 높은 수준의 권한이 필요하신가요? 업그레이드를 신청해 주세요.'
                : '이 테이블에 접근하려면 권한이 필요합니다.'
              }
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isUpgrade && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600 dark:text-blue-400">
                  현재 <span className="font-semibold">조회 권한</span>을 보유하고 있습니다
                </span>
              </div>
            </div>
          )}

          <fieldset disabled={isSubmitting} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-3 block">신청 권한</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestedLevel('viewer')}
                  disabled={currentPermissionLevel === 'viewer'}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    currentPermissionLevel === 'viewer'
                      ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                      : requestedLevel === 'viewer'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <Eye className={`h-5 w-5 ${currentPermissionLevel === 'viewer' ? 'text-muted-foreground/50' : 'text-blue-500'}`} />
                  <div className="text-center">
                    <div className={`font-medium text-xs ${currentPermissionLevel === 'viewer' ? 'text-muted-foreground' : ''}`}>
                      조회
                      {currentPermissionLevel === 'viewer' && <div className="text-[10px] text-muted-foreground">(보유 중)</div>}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestedLevel('developer')}
                  disabled={currentPermissionLevel === 'developer'}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    currentPermissionLevel === 'developer'
                      ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                      : requestedLevel === 'developer'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <Code2 className={`h-5 w-5 ${currentPermissionLevel === 'developer' ? 'text-muted-foreground/50' : 'text-emerald-500'}`} />
                  <div className="text-center">
                    <div className={`font-medium text-xs ${currentPermissionLevel === 'developer' ? 'text-muted-foreground' : ''}`}>
                      개발자
                      {currentPermissionLevel === 'developer' && <div className="text-[10px] text-muted-foreground">(보유 중)</div>}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRequestedLevel('owner')}
                  disabled={currentPermissionLevel === 'owner'}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    currentPermissionLevel === 'owner'
                      ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                      : requestedLevel === 'owner'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <Shield className={`h-5 w-5 ${currentPermissionLevel === 'owner' ? 'text-muted-foreground/50' : 'text-amber-500'}`} />
                  <div className="text-center">
                    <div className={`font-medium text-xs ${currentPermissionLevel === 'owner' ? 'text-muted-foreground' : ''}`}>
                      관리자
                      {currentPermissionLevel === 'owner' && <div className="text-[10px] text-muted-foreground">(보유 중)</div>}
                    </div>
                  </div>
                </button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {requestedLevel === 'viewer' && '데이터 조회만 가능'}
                {requestedLevel === 'developer' && 'API 권한 등 개발자 권한'}
                {requestedLevel === 'owner' && '데이터에 대한 관리자 권한'}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">사용 목적</label>
              <div className="grid grid-cols-2 gap-2">
                {purposeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPurposeCategory(option.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      purposeCategory === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">접근 기간</label>
              <div className="flex gap-2">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDuration(option.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      duration === option.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                상세 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="데이터 접근이 필요한 이유를 상세히 작성해 주세요..."
                className="w-full min-h-[100px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
              {!reason.trim() && (
                <p className="text-xs text-muted-foreground mt-1">필수 입력 항목입니다</p>
              )}
            </div>
          </fieldset>

          {ownerName && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>승인 담당자:</span>
                <span className="font-medium text-foreground">{ownerName}</span>
                {ownerEmail && (
                  <span className="text-xs">({ownerEmail})</span>
                )}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-400">
            <p>모든 권한 신청은 테이블 소유자의 수동 승인이 필요합니다.</p>
            <p className="mt-1">일반적으로 1-2 영업일 내에 처리됩니다.</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={!reason.trim() || isSubmitting} className="gap-2 min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  {isUpgrade ? <ArrowUp className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  {isUpgrade ? '업그레이드 신청' : '신청하기'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PermissionOverlayProps {
  sensitivityLevel: 'confidential' | 'private';
  hasPendingRequest: boolean;
  pendingRequestLevel?: 'viewer' | 'developer' | 'owner';
  ownerName?: string;
  ownerEmail?: string;
  onRequestAccess: () => void;
}

export function PermissionOverlay({
  sensitivityLevel,
  hasPendingRequest,
  pendingRequestLevel,
  ownerName,
  ownerEmail,
  onRequestAccess
}: PermissionOverlayProps) {
  const isConfidential = sensitivityLevel === 'confidential';

  const getLevelLabel = (level?: 'viewer' | 'developer' | 'owner') => {
    switch (level) {
      case 'viewer':
        return '조회 권한';
      case 'developer':
        return '개발자 권한';
      case 'owner':
        return '관리자 권한';
      default:
        return '권한';
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center p-6 rounded-lg bg-card border shadow-lg max-w-sm">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-4 ${
          isConfidential ? 'bg-red-500/10' : 'bg-amber-500/10'
        }`}>
          <Lock className={`h-6 w-6 ${isConfidential ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {isConfidential ? '기밀 데이터' : '테이블 접근 권한 필요'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isConfidential
            ? '이 테이블은 기밀로 분류되어 있습니다. 열람하려면 권한 승인이 필요합니다.'
            : '이 테이블을 조회하려면 권한이 필요합니다.'}
        </p>

        <Button
          onClick={onRequestAccess}
          className="w-full gap-2"
          variant={hasPendingRequest ? 'secondary' : 'default'}
          disabled={hasPendingRequest}
        >
          {hasPendingRequest ? (
            <>
              <Clock className="h-4 w-4" />
              {getLevelLabel(pendingRequestLevel)} 신청 중
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              권한 신청
            </>
          )}
        </Button>

        {ownerName && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <p>테이블 소유자: {ownerName}</p>
            {ownerEmail && (
              <a href={`mailto:${ownerEmail}`} className="text-primary hover:underline">
                {ownerEmail}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
