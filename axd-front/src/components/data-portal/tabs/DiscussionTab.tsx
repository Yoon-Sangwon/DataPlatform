import { useState } from 'react';
import { User, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { AssetComment } from '../../../lib/supabase';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils';
import { formatRelativeTime } from '../../../lib/utils';

interface DiscussionTabProps {
  comments: AssetComment[];
  onAddComment?: (content: string) => void;
}

function CommentItem({ comment }: { comment: AssetComment }) {
  return (
    <div className={cn(
      'p-4 rounded-lg border transition-colors',
      comment.is_answer && 'border-emerald-500/50 bg-emerald-500/5'
    )}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.user_name || '익명'}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.created_at)}
            </span>
            {comment.is_answer && (
              <Badge variant="success" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                채택된 답변
              </Badge>
            )}
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              답글
            </Button>
            {!comment.is_answer && (
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                답변 채택
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DiscussionTab({ comments, onAddComment }: DiscussionTabProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (a.is_answer && !b.is_answer) return -1;
    if (!a.is_answer && b.is_answer) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="질문이나 의견을 남겨주세요..."
            className="w-full min-h-[100px] p-3 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!newComment.trim()} className="gap-2">
              <Send className="h-4 w-4" />
              작성하기
            </Button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">토론 ({comments.length})</span>
        </div>

        {sortedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <h3 className="text-sm font-medium mb-1">아직 토론이 없습니다</h3>
            <p className="text-xs text-muted-foreground">
              이 데이터 자산에 대한 첫 번째 질문을 남겨보세요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
