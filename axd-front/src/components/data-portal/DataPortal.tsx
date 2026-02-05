import { useState, useEffect } from 'react';
import { Info, Columns, GitBranch, MessageSquare, Database, Lock, ChevronDown, Server, Users, Code, Eye, FileText } from 'lucide-react';
import { useDataAssets, useAssetDetails, buildAssetTree } from '../../hooks/useDataAssets';
import { useServices } from '../../hooks/useServices';
import { useAssetPermission, canViewMetadata, canViewSchema, canViewPreview } from '../../hooks/useAssetPermission';
import { useAuth } from '../../contexts/AuthContext';
import { useAssetPermissionRequests } from '../../hooks/useAssetPermissionRequests';
import { AssetTreeView } from './AssetTreeView';
import { AssetHeader } from './AssetHeader';
import { InfoTab } from './tabs/InfoTab';
import { SchemaTab } from './tabs/SchemaTab';
import { LineageTab } from './tabs/LineageTab';
import { DiscussionTab } from './tabs/DiscussionTab';
import { PreviewTab } from './tabs/PreviewTab';
import { PermissionRequestsTab } from './tabs/PermissionRequestsTab';
import { PermissionRequestModal, PermissionOverlay, PermissionRequestFormData } from './PermissionRequestModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { TableContext } from '../../App';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Service } from '../../lib/supabase';

interface DataPortalProps {
  tableContext: TableContext | null;
  onNavigateToSQL: (context: TableContext) => void;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  database: <Database className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  server: <Server className="h-4 w-4" />,
};

const SERVICE_COLORS: Record<string, string> = {
  blue: 'text-blue-500',
  emerald: 'text-emerald-500',
  orange: 'text-orange-500',
};

export function DataPortal({ tableContext, onNavigateToSQL }: DataPortalProps) {
  const { isAdmin } = useAuth();
  const { services, loading: servicesLoading } = useServices();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { assets, loading: assetsLoading } = useDataAssets(selectedService?.id);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const { asset, columns, lineage, comments, loading: detailsLoading, refetch } = useAssetDetails(selectedAssetId);
  const { pendingCount } = useAssetPermissionRequests(selectedAssetId || undefined);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0]);
    }
  }, [services, selectedService]);

  const {
    permissionLevel,
    pendingRequest,
    submitRequest,
  } = useAssetPermission(selectedAssetId, asset?.sensitivity_level);

  useEffect(() => {
    if (tableContext?.assetId && assets.length > 0) {
      setSelectedAssetId(tableContext.assetId);
    } else if (tableContext?.tableName && assets.length > 0) {
      const matchingAsset = assets.find(
        a => a.name === tableContext.tableName &&
             a.schema_name === tableContext.schemaName &&
             a.database_name === tableContext.databaseName
      );
      if (matchingAsset) {
        setSelectedAssetId(matchingAsset.id);
      }
    }
  }, [tableContext, assets]);

  const tree = buildAssetTree(assets);

  const handleAddComment = (content: string) => {
    console.log('New comment:', content);
  };

  const handlePermissionRequest = async (data: PermissionRequestFormData): Promise<boolean> => {
    const success = await submitRequest({
      requestedLevel: data.requestedLevel,
      purposeCategory: data.purposeCategory,
      reason: data.reason,
      duration: data.duration,
    });
    if (success) {
      refetch();
    }
    return success;
  };

  const sensitivityLevel = asset?.sensitivity_level || 'public';
  const showMetadata = canViewMetadata(sensitivityLevel, permissionLevel);
  const showSchema = canViewSchema(sensitivityLevel, permissionLevel);
  const showPreview = canViewPreview(sensitivityLevel, permissionLevel);
  const hasPiiAccess = permissionLevel === 'owner' || permissionLevel === 'editor';
  const isConfidentialNoAccess = sensitivityLevel === 'confidential' && permissionLevel === 'none';

  const handleServiceChange = (service: Service) => {
    setSelectedService(service);
    setSelectedAssetId(null);
  };

  return (
    <div className="flex h-full">
      <aside className="w-64 border-r bg-card flex flex-col shrink-0">
        <div className="h-12 border-b px-3 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-9 px-2 font-semibold text-sm">
                {servicesLoading ? (
                  <span className="text-muted-foreground">로딩 중...</span>
                ) : selectedService ? (
                  <span className="flex items-center gap-2">
                    <span className={SERVICE_COLORS[selectedService.color] || 'text-blue-500'}>
                      {SERVICE_ICONS[selectedService.icon] || <Server className="h-4 w-4" />}
                    </span>
                    {selectedService.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">서비스 선택</span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {services.map((service) => (
                <DropdownMenuItem
                  key={service.id}
                  onClick={() => handleServiceChange(service)}
                  className="flex items-center gap-3 py-2"
                >
                  <span className={SERVICE_COLORS[service.color] || 'text-blue-500'}>
                    {SERVICE_ICONS[service.icon] || <Server className="h-4 w-4" />}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{service.name}</span>
                    <span className="text-xs text-muted-foreground">{service.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {assetsLoading || servicesLoading ? (
          <div className="p-2 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-5/6" />
          </div>
        ) : (
          <AssetTreeView
            tree={tree}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
          />
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {!selectedAssetId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Database className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">데이터 자산을 선택하세요</h2>
            <p className="text-muted-foreground max-w-md">
              왼쪽 패널에서 데이터베이스, 스키마, 테이블을 탐색하고
              원하는 데이터 자산을 선택하면 상세 정보를 확인할 수 있습니다.
            </p>
          </div>
        ) : detailsLoading ? (
          <div className="flex-1 p-6 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : asset ? (
          <>
            <AssetHeader
              asset={asset}
              permissionLevel={permissionLevel}
              pendingRequest={pendingRequest}
              onNavigateToSQL={onNavigateToSQL}
              onRequestPermission={() => setPermissionModalOpen(true)}
            />

            {isConfidentialNoAccess ? (
              <div className="flex-1 relative">
                <PermissionOverlay
                  sensitivityLevel="confidential"
                  hasPendingRequest={!!pendingRequest}
                  pendingRequestLevel={pendingRequest?.requested_level}
                  ownerName={asset.owner_name}
                  ownerEmail={asset.owner_email}
                  onRequestAccess={() => setPermissionModalOpen(true)}
                />
              </div>
            ) : (
              <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b px-6">
                  <TabsList className="h-11 bg-transparent p-0 gap-6">
                    <TabsTrigger
                      value="info"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 h-full flex items-center"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      정보 & 위키
                    </TabsTrigger>
                    <TabsTrigger
                      value="schema"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 h-full flex items-center"
                      disabled={!showSchema}
                    >
                      <Columns className="h-4 w-4 mr-2" />
                      스키마
                      {!showSchema && <Lock className="h-3 w-3 ml-1 text-muted-foreground" />}
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 h-full flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      미리보기
                      {!showPreview && <Lock className="h-3 w-3 ml-1 text-muted-foreground" />}
                    </TabsTrigger>
                    <TabsTrigger
                      value="lineage"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 h-full flex items-center"
                    >
                      <GitBranch className="h-4 w-4 mr-2" />
                      데이터 리니지
                    </TabsTrigger>
                    <TabsTrigger
                      value="discussion"
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 h-full flex items-center"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      커뮤니티
                    </TabsTrigger>
                    {isAdmin && (
                      <TabsTrigger
                        value="permissions"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-2 h-full flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        권한 요청
                        {pendingCount > 0 && (
                          <Badge className="ml-2 bg-white dark:bg-slate-900 border border-[#376CF2] text-[#376CF2] text-[10px] px-1.5 h-5 flex items-center">
                            {pendingCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto">
                  <TabsContent value="info" className="m-0 h-full">
                    {showMetadata ? (
                      <InfoTab asset={asset} />
                    ) : (
                      <div className="relative h-full">
                        <PermissionOverlay
                          sensitivityLevel={sensitivityLevel as 'confidential' | 'private'}
                          hasPendingRequest={!!pendingRequest}
                          pendingRequestLevel={pendingRequest?.requested_level}
                          ownerName={asset.owner_name}
                          ownerEmail={asset.owner_email}
                          onRequestAccess={() => setPermissionModalOpen(true)}
                        />
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="schema" className="m-0 h-full">
                    {showSchema ? (
                      <SchemaTab columns={columns} />
                    ) : (
                      <div className="relative h-full">
                        <PermissionOverlay
                          sensitivityLevel={sensitivityLevel as 'confidential' | 'private'}
                          hasPendingRequest={!!pendingRequest}
                          pendingRequestLevel={pendingRequest?.requested_level}
                          ownerName={asset.owner_name}
                          ownerEmail={asset.owner_email}
                          onRequestAccess={() => setPermissionModalOpen(true)}
                        />
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="preview" className="m-0 h-full">
                    <PreviewTab
                      asset={asset}
                      columns={columns}
                      canViewPreview={showPreview}
                      hasPiiAccess={hasPiiAccess}
                      onRequestAccess={() => setPermissionModalOpen(true)}
                    />
                  </TabsContent>
                  <TabsContent value="lineage" className="m-0 h-full">
                    <LineageTab asset={asset} lineage={lineage} />
                  </TabsContent>
                  <TabsContent value="discussion" className="m-0 h-full">
                    <DiscussionTab comments={comments} onAddComment={handleAddComment} />
                  </TabsContent>
                  {isAdmin && (
                    <TabsContent value="permissions" className="m-0 h-full p-6">
                      <PermissionRequestsTab assetId={selectedAssetId} />
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            )}

            <PermissionRequestModal
              open={permissionModalOpen}
              onOpenChange={setPermissionModalOpen}
              assetName={asset.name}
              ownerName={asset.owner_name}
              ownerEmail={asset.owner_email}
              currentPermissionLevel={permissionLevel}
              onSubmit={handlePermissionRequest}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">데이터를 찾을 수 없습니다</p>
          </div>
        )}
      </main>
    </div>
  );
}
