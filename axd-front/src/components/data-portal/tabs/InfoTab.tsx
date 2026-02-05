import { FileText, ExternalLink, BookOpen } from 'lucide-react';
import { DataAsset } from '../../../lib/supabase';
import { Button } from '../../ui/button';

interface InfoTabProps {
  asset: DataAsset;
}

export function InfoTab({ asset }: InfoTabProps) {
  const docLinks = asset.doc_links || [];

  return (
    <div className="space-y-6 p-6">
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          비즈니스 정의
        </h3>
        <div className="rounded-lg border bg-card p-4">
          {asset.business_definition ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {asset.business_definition}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              비즈니스 정의가 작성되지 않았습니다.
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          관련 문서
        </h3>
        {docLinks.length > 0 ? (
          <div className="space-y-2">
            {docLinks.map((doc, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-3"
                asChild
              >
                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="flex-1 text-left">{doc.title}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </Button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              연결된 문서가 없습니다
            </p>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          메타데이터
        </h3>
        <div className="rounded-lg border bg-card divide-y">
          <div className="flex justify-between p-3 text-sm">
            <span className="text-muted-foreground">데이터베이스</span>
            <span className="font-medium">{asset.database_name}</span>
          </div>
          <div className="flex justify-between p-3 text-sm">
            <span className="text-muted-foreground">스키마</span>
            <span className="font-medium">{asset.schema_name}</span>
          </div>
          <div className="flex justify-between p-3 text-sm">
            <span className="text-muted-foreground">생성일</span>
            <span className="font-medium">
              {new Date(asset.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
          <div className="flex justify-between p-3 text-sm">
            <span className="text-muted-foreground">최종 수정</span>
            <span className="font-medium">
              {new Date(asset.updated_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
