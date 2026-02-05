import { useState } from 'react';
import { Send, Plus } from 'lucide-react';
import { useRequestCategories, useAllRequestTypes, useMyServiceRequests, useRequestStats } from '../../hooks/useRequestCenter';
import { NewRequestModal } from './NewRequestModal';
import { MyRequestsList } from './MyRequestsList';
import { RequestDetailDrawer } from './RequestDetailDrawer';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { ServiceRequest } from '../../lib/supabase';

export function RequestCenter() {
  const { categories, loading: categoriesLoading } = useRequestCategories();
  const { types: allTypes, loading: typesLoading } = useAllRequestTypes();
  const { requests, loading: requestsLoading, refetch } = useMyServiceRequests();
  const { stats, loading: statsLoading } = useRequestStats();

  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleRequestSuccess = () => {
    setIsNewRequestOpen(false);
    refetch();
  };

  const handleRequestClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  if (categoriesLoading || typesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-[88px] border-b bg-card px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            신청 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            모든 신청 현황을 한눈에 확인하세요
          </p>
        </div>
        <Button onClick={() => setIsNewRequestOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          새 요청
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <MyRequestsList
          requests={requests}
          loading={requestsLoading}
          stats={stats}
          statsLoading={statsLoading}
          onRequestClick={handleRequestClick}
        />
      </div>

      <NewRequestModal
        open={isNewRequestOpen}
        onOpenChange={setIsNewRequestOpen}
        categories={categories}
        allTypes={allTypes}
        onSuccess={handleRequestSuccess}
      />

      <RequestDetailDrawer
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        request={selectedRequest}
      />
    </div>
  );
}
