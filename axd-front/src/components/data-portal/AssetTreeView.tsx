import { useState } from 'react';
import { ChevronRight, Database, FolderOpen, Table2, Search, Lock, ShieldAlert, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TreeNode } from '../../hooks/useDataAssets';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { MyPermissionRequests } from './MyPermissionRequests';
import { useAuth } from '../../contexts/AuthContext';
import { useAssetPermissionRequests } from '../../hooks/useAssetPermissionRequests';

interface AssetTreeViewProps {
  tree: TreeNode[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  searchQuery: string;
  requestCounts: { [assetId: string]: number };
  isAdmin: boolean;
}

function TreeItem({ node, depth, selectedAssetId, onSelectAsset, searchQuery, requestCounts, isAdmin }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const filteredChildren = node.children?.filter((child) => {
    if (!searchQuery) return true;
    const matchesSelf = child.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (child.type === 'table') return matchesSelf;
    return matchesSelf || child.children?.some((grandChild) =>
      grandChild.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const shouldShow = !searchQuery ||
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (filteredChildren && filteredChildren.length > 0);

  if (!shouldShow) return null;

  const Icon = node.type === 'database' ? Database :
    node.type === 'schema' ? FolderOpen : Table2;

  const isSelected = node.assetId === selectedAssetId;
  const requestCount = isAdmin && node.assetId ? requestCounts[node.assetId] || 0 : 0;

  const sensitivityIcon = node.type === 'table' && node.isMasked ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <EyeOff className="h-3 w-3 text-slate-500 shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">권한 필요 - 권한 신청 후 조회 가능</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : node.type === 'table' && node.sensitivityLevel === 'confidential' ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Lock className="h-3 w-3 text-red-500 shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">기밀 데이터 - 권한 필요</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : node.type === 'table' && node.sensitivityLevel === 'internal' ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ShieldAlert className="h-3 w-3 text-amber-500 shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-xs">내부용 데이터</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null;

  const handleClick = () => {
    if (node.type === 'table' && node.assetId) {
      onSelectAsset(node.assetId);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const childCount = node.type === 'schema' ? node.children?.length : undefined;

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
          isSelected && 'bg-accent text-accent-foreground font-medium'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        )}
        {!hasChildren && <span className="w-4" />}
        <Icon className={cn(
          'h-4 w-4 shrink-0',
          node.type === 'database' && 'text-blue-500',
          node.type === 'schema' && 'text-amber-500',
          node.type === 'table' && !node.isMasked && 'text-emerald-500',
          node.type === 'table' && node.isMasked && 'text-slate-400'
        )} />
        <span className={cn(
          'truncate',
          node.isMasked && 'text-slate-500 italic'
        )}>{node.name}</span>
        {sensitivityIcon}
        {requestCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 min-w-[16px] rounded-full bg-white dark:bg-slate-900 font-medium flex items-center justify-center border border-[#376CF2] text-[#376CF2]">
                  {requestCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs">{requestCount}건의 권한 요청 대기 중</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {childCount !== undefined && !requestCount && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
            {childCount}
          </Badge>
        )}
      </button>
      {hasChildren && isExpanded && filteredChildren && (
        <div>
          {filteredChildren.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedAssetId={selectedAssetId}
              onSelectAsset={onSelectAsset}
              searchQuery={searchQuery}
              requestCounts={requestCounts}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AssetTreeView({ tree, selectedAssetId, onSelectAsset }: AssetTreeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useAuth();
  const { counts: requestCounts } = useAssetPermissionRequests();

  return (
    <div className="flex h-full flex-col">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="테이블 검색..."
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          {tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Database className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs">데이터 자산이 없습니다</p>
            </div>
          ) : (
            tree.map((node) => (
              <TreeItem
                key={node.id}
                node={node}
                depth={0}
                selectedAssetId={selectedAssetId}
                onSelectAsset={onSelectAsset}
                searchQuery={searchQuery}
                requestCounts={requestCounts}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      </ScrollArea>

      <MyPermissionRequests onSelectAsset={onSelectAsset} />
    </div>
  );
}
