import { Table2, User, Mail, ExternalLink, Code, Code2, Lock, Shield, Eye, Crown, Clock, EyeOff, ArrowUp } from 'lucide-react';
import { DataAsset, PermissionLevel, PermissionRequest } from '../../lib/supabase';
import { MaskedDataAsset } from '../../hooks/useDataAssets';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TableContext } from '../../App';
import { getSensitivityBadgeInfo } from '../../hooks/useAssetPermission';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface AssetHeaderProps {
  asset: DataAsset | MaskedDataAsset;
  permissionLevel: PermissionLevel;
  pendingRequest: PermissionRequest | null;
  onNavigateToSQL?: (context: TableContext) => void;
  onRequestPermission?: () => void;
}

function PermissionBadge({ level, hasPending }: { level: PermissionLevel; hasPending: boolean }) {
  if (level === 'owner') {
    return (
      <Badge variant="success" className="gap-1">
        <Crown className="h-3 w-3" />
        관리자 권한
      </Badge>
    );
  }
  if (level === 'developer') {
    return (
      <Badge variant="default" className="gap-1">
        <Code2 className="h-3 w-3" />
        개발자 권한
      </Badge>
    );
  }
  if (level === 'viewer') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Eye className="h-3 w-3" />
        조회 권한
      </Badge>
    );
  }
  if (hasPending) {
    return (
      <Badge variant="warning" className="gap-1">
        <Clock className="h-3 w-3" />
        승인 대기 중
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Lock className="h-3 w-3" />
      권한 없음
    </Badge>
  );
}

function SensitivityBadge({ level }: { level: string }) {
  const info = getSensitivityBadgeInfo(level as 'public' | 'internal' | 'confidential');
  const Icon = level === 'confidential' ? Lock : Shield;

  if (level === 'public') return null;

  return (
    <Badge variant={info.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {info.label}
    </Badge>
  );
}

export function AssetHeader({
  asset,
  permissionLevel,
  pendingRequest,
  onNavigateToSQL,
  onRequestPermission
}: AssetHeaderProps) {
  const handleOpenInSQL = () => {
    onNavigateToSQL?.({
      tableName: asset.name,
      schemaName: asset.schema_name,
      databaseName: asset.database_name,
      assetId: asset.id,
    });
  };

  const canOpenSQL = permissionLevel !== 'none';
  const canRequestPermission = permissionLevel === 'none' || permissionLevel === 'viewer';
  const hasPendingRequest = !!pendingRequest;
  const isUpgradeRequest = permissionLevel === 'viewer' && !hasPendingRequest;
  const isMasked = 'isMasked' in asset && asset.isMasked;

  return (
    <div className="border-b bg-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isMasked ? 'bg-slate-500/10' : 'bg-emerald-500/10'}`}>
            {isMasked ? (
              <EyeOff className="h-6 w-6 text-slate-500" />
            ) : (
              <Table2 className="h-6 w-6 text-emerald-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-xl font-bold ${isMasked ? 'text-slate-500' : ''}`}>
                {asset.name}
              </h1>
              {!isMasked && (
                <span className="text-sm text-muted-foreground">
                  {asset.schema_name}.{asset.database_name}
                </span>
              )}
              <SensitivityBadge level={asset.sensitivity_level} />
              <PermissionBadge level={permissionLevel} hasPending={!!pendingRequest} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isMasked
                ? '이 데이터는 접근 권한이 필요합니다. 상세 정보는 권한 승인 후 확인할 수 있습니다.'
                : (asset.description || '설명이 없습니다')
              }
            </p>
            {!isMasked && (
              <div className="mt-3 flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            {canRequestPermission && (
              <Button
                onClick={onRequestPermission}
                variant={hasPendingRequest ? 'secondary' : isUpgradeRequest ? 'outline' : 'default'}
                size="sm"
                className="gap-2"
                disabled={hasPendingRequest}
              >
                {hasPendingRequest ? (
                  <>
                    <Clock className="h-4 w-4" />
                    신청 중
                  </>
                ) : isUpgradeRequest ? (
                  <>
                    <ArrowUp className="h-4 w-4" />
                    권한 업그레이드
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    권한 신청
                  </>
                )}
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={handleOpenInSQL}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={!canOpenSQL}
                    >
                      <Code className="h-4 w-4" />
                      SQL에서 열기
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canOpenSQL && (
                  <TooltipContent>
                    <p className="text-xs">데이터 조회 권한이 필요합니다</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{asset.owner_name || '미지정'}</span>
            </div>
            {asset.owner_email && (
              <Button variant="ghost" size="sm" className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground" asChild>
                <a href={`mailto:${asset.owner_email}`}>
                  <Mail className="mr-1 h-3 w-3" />
                  {asset.owner_email}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
