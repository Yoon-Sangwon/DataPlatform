import { useState } from 'react';
import { MessageSquare, Check, Trash2, Database, User, Clock, CheckCircle, Search } from 'lucide-react';
import { useAllComments } from '../../hooks/useAllComments';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { format, isToday, isYesterday, differenceInHours } from 'date-fns';
import { ko } from 'date-fns/locale';

export function CommentModeration() {
  const { comments, loading, markAsAnswer, unmarkAsAnswer, deleteComment } = useAllComments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComment, setSelectedComment] = useState<any>(null);
  const [actionType, setActionType] = useState<'delete' | null>(null);
  const [processing, setProcessing] = useState(false);

  const filteredComments = comments.filter((comment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      comment.content.toLowerCase().includes(query) ||
      comment.user_name.toLowerCase().includes(query) ||
      comment.data_assets?.name.toLowerCase().includes(query)
    );
  });

  const newComments = filteredComments.filter((c) => {
    const hours = differenceInHours(new Date(), new Date(c.created_at));
    return hours < 24;
  });

  const answeredComments = filteredComments.filter((c) => c.is_answer);

  const handleMarkAsAnswer = async (comment: any) => {
    setProcessing(true);
    try {
      if (comment.is_answer) {
        const result = await unmarkAsAnswer(comment.id);
        if (result.success) {
          alert('답변 채택이 취소되었습니다.');
        } else {
          alert('작업 실패: ' + result.error);
        }
      } else {
        const result = await markAsAnswer(comment.id);
        if (result.success) {
          alert('답변으로 채택되었습니다.');
        } else {
          alert('작업 실패: ' + result.error);
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = (comment: any) => {
    setSelectedComment(comment);
    setActionType('delete');
  };

  const handleConfirmDelete = async () => {
    if (!selectedComment) return;

    setProcessing(true);
    try {
      const result = await deleteComment(selectedComment.id);
      if (result.success) {
        alert('댓글이 삭제되었습니다.');
        setSelectedComment(null);
        setActionType(null);
      } else {
        alert('삭제 실패: ' + result.error);
      }
    } finally {
      setProcessing(false);
    }
  };

  const getTimeLabel = (date: string) => {
    const commentDate = new Date(date);
    if (isToday(commentDate)) {
      return '오늘 ' + format(commentDate, 'HH:mm', { locale: ko });
    } else if (isYesterday(commentDate)) {
      return '어제 ' + format(commentDate, 'HH:mm', { locale: ko });
    } else {
      return format(commentDate, 'yyyy-MM-dd HH:mm', { locale: ko });
    }
  };

  const isNewComment = (date: string) => {
    const hours = differenceInHours(new Date(), new Date(date));
    return hours < 24;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">댓글 모니터링</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            모든 데이터 자산의 댓글을 관리하고 모더레이션할 수 있습니다
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">신규 (24h): {newComments.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600 dark:text-gray-400">채택됨: {answeredComments.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">전체: {filteredComments.length}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="댓글 내용, 작성자, 데이터 자산 검색..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? '검색 결과가 없습니다' : '아직 댓글이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Database className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {comment.data_assets?.name || '데이터 자산'}
                  </span>
                  {isNewComment(comment.created_at) && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      NEW
                    </Badge>
                  )}
                  {comment.is_answer && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      채택된 답변
                    </Badge>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{comment.user_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{getTimeLabel(comment.created_at)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={
                      comment.is_answer
                        ? 'text-green-600 border-green-300'
                        : 'text-gray-600 border-gray-300'
                    }
                    onClick={() => handleMarkAsAnswer(comment)}
                    disabled={processing}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {comment.is_answer ? '채택 취소' : '답변 채택'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                    onClick={() => handleDeleteClick(comment)}
                    disabled={processing}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedComment && actionType === 'delete'} onOpenChange={() => setSelectedComment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>댓글 삭제</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>

            {selectedComment && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  작성자: {selectedComment.user_name}
                </p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedComment.content.substring(0, 100)}
                  {selectedComment.content.length > 100 && '...'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedComment(null)} disabled={processing}>
              취소
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processing ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
