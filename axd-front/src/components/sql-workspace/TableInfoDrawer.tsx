import { Table2, User, Mail, ExternalLink, Calendar, Tag, X } from 'lucide-react';
import { DataAsset } from '../../lib/supabase';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface TableInfoDrawerProps {
  asset: DataAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInPortal?: () => void;
}

export function TableInfoDrawer({ asset, isOpen, onClose, onViewInPortal }: TableInfoDrawerProps) {
  if (!isOpen || !asset) return null;

  return (
    <div className="absolute inset-y-0 left-64 z-40 w-96 border-r bg-card shadow-lg animate-in slide-in-from-left duration-300">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-sm">테이블 정보</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                <Table2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base truncate">{asset.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {asset.schema_name}.{asset.database_name}
                </p>
              </div>
            </div>

            {asset.description && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">설명</h5>
                <p className="text-sm">{asset.description}</p>
              </div>
            )}

            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">태그</h5>
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">소유자</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{asset.owner_name || '미지정'}</span>
                </div>
                {asset.owner_email && (
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground" asChild>
                    <a href={`mailto:${asset.owner_email}`} className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {asset.owner_email}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">생성 일시</h5>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(asset.created_at).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            {asset.last_updated && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-2">최종 수정</h5>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(asset.last_updated).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <Button onClick={onViewInPortal} variant="outline" className="w-full gap-2" size="sm">
            <ExternalLink className="h-4 w-4" />
            데이터 포털에서 전체 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
