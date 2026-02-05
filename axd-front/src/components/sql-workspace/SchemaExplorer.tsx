import { useState } from 'react';
import { ChevronRight, Database, FolderOpen, Table2, Columns, Search, Info, ChevronDown, Server, Users, Code } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TreeNode } from '../../hooks/useDataAssets';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Service } from '../../lib/supabase';
import { Skeleton } from '../ui/skeleton';

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

interface SchemaExplorerProps {
  tree: TreeNode[];
  onColumnClick?: (columnName: string, tableName: string) => void;
  onTableClick?: (tableName: string, schemaName: string, databaseName: string) => void;
  services?: Service[];
  selectedService?: Service | null;
  onServiceChange?: (service: Service) => void;
  servicesLoading?: boolean;
}

const mockColumns: Record<string, { name: string; type: string }[]> = {
  users: [
    { name: 'id', type: 'uuid' },
    { name: 'email', type: 'text' },
    { name: 'name', type: 'text' },
    { name: 'created_at', type: 'timestamptz' },
    { name: 'last_login', type: 'timestamptz' },
  ],
  orders: [
    { name: 'id', type: 'uuid' },
    { name: 'user_id', type: 'uuid' },
    { name: 'total_amount', type: 'numeric' },
    { name: 'status', type: 'text' },
    { name: 'ordered_at', type: 'timestamptz' },
  ],
  products: [
    { name: 'id', type: 'uuid' },
    { name: 'name', type: 'text' },
    { name: 'category', type: 'text' },
    { name: 'price', type: 'numeric' },
  ],
};

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  searchQuery: string;
  onColumnClick?: (columnName: string, tableName: string) => void;
  onTableClick?: (tableName: string, schemaName: string, databaseName: string) => void;
  schemaName?: string;
  databaseName?: string;
}

function TreeItem({ node, depth, searchQuery, onColumnClick, onTableClick, schemaName, databaseName }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isTable = node.type === 'table';
  const columns = isTable ? mockColumns[node.name] || [] : [];

  const currentSchemaName = node.type === 'schema' ? node.name : schemaName;
  const currentDatabaseName = node.type === 'database' ? node.name : databaseName;

  const filteredChildren = node.children?.filter((child) => {
    if (!searchQuery) return true;
    return child.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const Icon = node.type === 'database' ? Database :
    node.type === 'schema' ? FolderOpen : Table2;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTable && currentSchemaName && currentDatabaseName) {
      onTableClick?.(node.name, currentSchemaName, currentDatabaseName);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent group',
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <button onClick={handleToggle} className="flex items-center gap-1.5 flex-1 min-w-0">
          {(hasChildren || isTable) && (
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          )}
          <Icon className={cn(
            'h-3.5 w-3.5 shrink-0',
            node.type === 'database' && 'text-blue-500',
            node.type === 'schema' && 'text-amber-500',
            node.type === 'table' && 'text-emerald-500'
          )} />
          <span className="truncate text-xs">{node.name}</span>
        </button>
        {isTable && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleInfoClick}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Info className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">테이블 정보 보기</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {isExpanded && isTable && columns.length > 0 && (
        <div className="ml-4">
          {columns.map((col) => (
            <button
              key={col.name}
              onClick={() => onColumnClick?.(col.name, node.name)}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-accent transition-colors"
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            >
              <Columns className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{col.name}</span>
              <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 h-4 font-mono">
                {col.type}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {hasChildren && isExpanded && filteredChildren && (
        <div>
          {filteredChildren.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
              onColumnClick={onColumnClick}
              onTableClick={onTableClick}
              schemaName={currentSchemaName}
              databaseName={currentDatabaseName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SchemaExplorer({
  tree,
  onColumnClick,
  onTableClick,
  services = [],
  selectedService,
  onServiceChange,
  servicesLoading = false
}: SchemaExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-full flex-col">
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
                onClick={() => onServiceChange?.(service)}
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

      {servicesLoading ? (
        <div className="p-2 space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      ) : (
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
                  searchQuery={searchQuery}
                  onColumnClick={onColumnClick}
                  onTableClick={onTableClick}
                />
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
