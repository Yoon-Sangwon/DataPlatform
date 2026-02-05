import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Database, Table2, BarChart3, TrendingUp, Workflow } from 'lucide-react';
import { DataLineage, DataAsset } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../ui/tooltip';

interface LineageTabProps {
  asset: DataAsset;
  lineage: DataLineage[];
}

type NodeType = 'table' | 'dashboard' | 'metric' | 'api';

interface CustomNodeData {
  label: string;
  nodeType: NodeType;
  transformationType?: string;
  etlSummary?: string;
  isCurrent?: boolean;
  isDownstream?: boolean;
}

const nodeColors: Record<NodeType, { bg: string; border: string; icon: string }> = {
  table: { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600', icon: 'text-slate-600 dark:text-slate-400' },
  dashboard: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-600 dark:text-blue-400' },
  metric: { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600', icon: 'text-slate-600 dark:text-slate-400' },
  api: { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600', icon: 'text-slate-600 dark:text-slate-400' },
};

const NodeIcon = ({ type }: { type: NodeType }) => {
  switch (type) {
    case 'dashboard':
      return <BarChart3 className="h-4 w-4" />;
    case 'metric':
      return <TrendingUp className="h-4 w-4" />;
    case 'api':
      return <Workflow className="h-4 w-4" />;
    default:
      return <Table2 className="h-4 w-4" />;
  }
};

function CustomNode({ data }: { data: CustomNodeData }) {
  const colors = nodeColors[data.nodeType] || nodeColors.table;

  const getUsageLabel = () => {
    if (data.nodeType === 'dashboard') return '대시보드';
    if (data.nodeType === 'metric') return '지표';
    if (data.nodeType === 'api') return 'API';
    return null;
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="relative">
            {data.isDownstream && (
              <div className="absolute -top-6 left-0 right-0 flex justify-center">
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  최종 사용처
                </span>
              </div>
            )}
            <div
              className={cn(
                'px-4 py-3 rounded-lg border-2 shadow-sm transition-all hover:shadow-md min-w-[140px]',
                colors.bg,
                colors.border,
                data.isCurrent && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
              )}
            >
              <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />

              <div className="flex items-center gap-2">
                <div className={cn('shrink-0', colors.icon)}>
                  <NodeIcon type={data.nodeType} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{data.label}</div>
                  {data.isDownstream && getUsageLabel() && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {getUsageLabel()}
                    </div>
                  )}
                  {data.transformationType && !data.isDownstream && (
                    <div className="text-[10px] text-muted-foreground uppercase">
                      {data.transformationType}
                    </div>
                  )}
                </div>
              </div>

              <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />
            </div>
          </div>
        </TooltipTrigger>
        {data.etlSummary && (
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">{data.etlSummary}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

export function LineageTab({ asset, lineage }: LineageTabProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node<CustomNodeData>[] = [];
    const edges: Edge[] = [];
    const nodeSet = new Set<string>();

    const currentNodeId = `current-${asset.id}`;
    nodes.push({
      id: currentNodeId,
      type: 'custom',
      position: { x: 400, y: 150 },
      data: {
        label: asset.name,
        nodeType: 'table',
        isCurrent: true,
      },
    });
    nodeSet.add(currentNodeId);

    let upstreamY = 50;
    let downstreamY = 50;

    lineage.forEach((link, index) => {
      const isUpstream = link.target_asset_id === asset.id;
      const isDownstream = link.source_asset_id === asset.id;

      if (isUpstream) {
        const sourceId = link.source_asset_id || `external-${index}`;
        if (!nodeSet.has(sourceId)) {
          nodes.push({
            id: sourceId,
            type: 'custom',
            position: { x: 100, y: upstreamY },
            data: {
              label: link.source_name || 'Unknown Source',
              nodeType: (link.source_type as NodeType) || 'table',
              transformationType: link.transformation_type,
              etlSummary: link.etl_logic_summary,
            },
          });
          nodeSet.add(sourceId);
          upstreamY += 100;
        }

        edges.push({
          id: `edge-${index}-upstream`,
          source: sourceId,
          target: currentNodeId,
          animated: false,
          style: { stroke: '#64748b', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
          },
          label: link.transformation_type,
          labelStyle: { fontSize: 10, fill: '#64748b' },
          labelBgStyle: { fill: 'transparent' },
        });
      }

      if (isDownstream) {
        const targetId = link.target_asset_id || `external-${index}`;
        if (!nodeSet.has(targetId)) {
          nodes.push({
            id: targetId,
            type: 'custom',
            position: { x: 700, y: downstreamY },
            data: {
              label: link.target_name || 'Unknown Target',
              nodeType: (link.target_type as NodeType) || 'table',
              transformationType: link.transformation_type,
              etlSummary: link.etl_logic_summary,
              isDownstream: true,
            },
          });
          nodeSet.add(targetId);
          downstreamY += 100;
        }

        edges.push({
          id: `edge-${index}-downstream`,
          source: currentNodeId,
          target: targetId,
          animated: false,
          style: { stroke: '#64748b', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#64748b',
          },
          label: link.transformation_type,
          labelStyle: { fontSize: 10, fill: '#64748b' },
          labelBgStyle: { fill: 'transparent' },
        });
      }
    });

    return { nodes, edges };
  }, [asset, lineage]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  if (lineage.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">리니지 정보 없음</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          이 테이블에 대한 데이터 리니지 정보가 아직 등록되지 않았습니다.
          <br />
          데이터 관리자에게 문의하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls className="!bg-card !border-border !rounded-lg !shadow-lg" />
      </ReactFlow>

      <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-slate-400" />
            <span className="text-xs text-muted-foreground">데이터 소스</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded ring-2 ring-primary" />
            <span className="text-xs text-muted-foreground">현재 테이블</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-400 dark:bg-blue-600" />
            <span className="text-xs text-muted-foreground">최종 사용처 (대시보드/리포트)</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          왼쪽에서 오른쪽으로 데이터 흐름
        </div>
      </div>
    </div>
  );
}
