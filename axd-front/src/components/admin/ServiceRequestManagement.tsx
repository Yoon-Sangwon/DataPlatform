import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Clock, CheckCircle, XCircle, AlertCircle, GripVertical, User, Calendar, Flag } from 'lucide-react';
import { useAllServiceRequests } from '../../hooks/useAllServiceRequests';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const COLUMNS = [
  { id: 'submitted', title: '대기', icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  { id: 'in_progress', title: '진행 중', icon: AlertCircle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'completed', title: '완료', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'rejected', title: '반려', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
];

export function ServiceRequestManagement() {
  const { requests, loading, updateRequestStatus } = useAllServiceRequests();
  const [updating, setUpdating] = useState(false);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const requestId = draggableId;

    setUpdating(true);
    try {
      const statusResult = await updateRequestStatus(requestId, newStatus);
      if (!statusResult.success) {
        alert('상태 변경 실패: ' + statusResult.error);
      }
    } finally {
      setUpdating(false);
    }
  };

  const getRequestsByStatus = (status: string) => {
    return requests.filter((req) => req.status === status);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[priority] || colors.low;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      urgent: '긴급',
      high: '높음',
      medium: '보통',
      low: '낮음',
    };
    return labels[priority] || priority;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">서비스 요청 관리</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            드래그앤드롭으로 요청 상태를 변경할 수 있습니다
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {COLUMNS.map((column) => {
            const Icon = column.icon;
            const count = getRequestsByStatus(column.id).length;
            return (
              <div key={column.id} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${column.color}`} />
                <span className="text-gray-600 dark:text-gray-400">
                  {column.title}: {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {COLUMNS.map((column) => {
              const Icon = column.icon;
              const columnRequests = getRequestsByStatus(column.id);

              return (
                <div
                  key={column.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className={`${column.bgColor} dark:bg-opacity-20 px-4 py-3 border-b border-gray-200 dark:border-gray-700`}>
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${column.color}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {column.title}
                      </h3>
                      <Badge variant="outline" className="ml-auto">
                        {columnRequests.length}
                      </Badge>
                    </div>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 space-y-3 min-h-[500px] max-h-[700px] overflow-y-auto ${
                          snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-10' : ''
                        }`}
                      >
                        {columnRequests.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                            요청이 없습니다
                          </div>
                        ) : (
                          columnRequests.map((request, index) => (
                            <Draggable
                              key={request.id}
                              draggableId={request.id}
                              index={index}
                              isDragDisabled={updating}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start gap-2 mb-2">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                                          {request.title}
                                        </h4>
                                        <Badge
                                          variant="outline"
                                          className={getPriorityColor(request.priority)}
                                        >
                                          {getPriorityLabel(request.priority)}
                                        </Badge>
                                      </div>

                                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                        {request.description}
                                      </p>

                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                          <User className="w-3 h-3" />
                                          <span className="truncate">{request.requester_name}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            {format(new Date(request.created_at), 'yyyy-MM-dd', {
                                              locale: ko,
                                            })}
                                          </span>
                                        </div>

                                        {request.due_date && (
                                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Flag className="w-3 h-3" />
                                            <span>
                                              마감:{' '}
                                              {format(new Date(request.due_date), 'yyyy-MM-dd', {
                                                locale: ko,
                                              })}
                                            </span>
                                          </div>
                                        )}

                                        {request.assignee_name && (
                                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              담당자: {request.assignee_name}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {updating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="text-gray-900 dark:text-white">상태 업데이트 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
