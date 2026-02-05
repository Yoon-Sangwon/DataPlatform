import { useState, useEffect } from 'react';
import { SchemaExplorer } from './SchemaExplorer';
import { QueryEditor } from './QueryEditor';
import { AICopilot } from './AICopilot';
import { ResultPanel } from './ResultPanel';
import { TableInfoDrawer } from './TableInfoDrawer';
import { useDataAssets, buildAssetTree } from '../../hooks/useDataAssets';
import { useServices } from '../../hooks/useServices';
import { TableContext } from '../../App';
import { Service } from '../../lib/supabase';

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  executionTime: number;
  cost: number;
  rowCount: number;
  error?: string;
}

interface SQLWorkspaceProps {
  tableContext: TableContext | null;
  onNavigateToDataPortal: (context: TableContext) => void;
}

export function SQLWorkspace({ tableContext, onNavigateToDataPortal }: SQLWorkspaceProps) {
  const { services, loading: servicesLoading } = useServices();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const { assets } = useDataAssets(selectedService?.id);
  const tree = buildAssetTree(assets);

  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0]);
    }
  }, [services, selectedService]);
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTableInfo, setSelectedTableInfo] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (tableContext) {
      const newQuery = `-- ${tableContext.tableName} 테이블 탐색\nSELECT *\nFROM ${tableContext.schemaName}.${tableContext.tableName}\nLIMIT 100;`;
      setQuery(newQuery);
    }
  }, [tableContext]);

  const handleRunQuery = async () => {
    setIsRunning(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockResult: QueryResult = {
      columns: ['id', 'email', 'name', 'created_at', 'last_login'],
      rows: [
        { id: '1', email: 'kim@example.com', name: '김철수', created_at: '2024-01-15', last_login: '2024-12-20' },
        { id: '2', email: 'lee@example.com', name: '이영희', created_at: '2024-02-20', last_login: '2024-12-19' },
        { id: '3', email: 'park@example.com', name: '박민수', created_at: '2024-03-10', last_login: '2024-12-18' },
        { id: '4', email: 'choi@example.com', name: '최지현', created_at: '2024-04-05', last_login: null },
        { id: '5', email: 'jung@example.com', name: '정우진', created_at: '2024-05-12', last_login: '2024-12-20' },
      ],
      executionTime: 127,
      cost: 0.0023,
      rowCount: 5,
    };

    setResult(mockResult);
    setIsRunning(false);
  };

  const handleInsertSQL = (sql: string) => {
    setQuery(sql);
  };

  const handleColumnClick = (columnName: string, tableName: string) => {
    const insertText = `${tableName}.${columnName}`;
    setQuery((prev) => prev + ' ' + insertText);
  };

  const handleTableClick = (tableName: string, schemaName: string, databaseName: string) => {
    const asset = assets.find(
      a => a.name === tableName &&
           a.schema_name === schemaName &&
           a.database_name === databaseName
    );
    if (asset) {
      setSelectedTableInfo(asset.id);
      setIsDrawerOpen(true);
    }
  };

  const handleViewInPortal = () => {
    const asset = assets.find(a => a.id === selectedTableInfo);
    if (asset) {
      onNavigateToDataPortal({
        tableName: asset.name,
        schemaName: asset.schema_name,
        databaseName: asset.database_name,
        assetId: asset.id,
      });
    }
  };

  const selectedAsset = assets.find(a => a.id === selectedTableInfo) || null;

  return (
    <div className="flex h-full relative">
      <aside className="w-64 border-r bg-card flex flex-col shrink-0">
        <SchemaExplorer
          tree={tree}
          onColumnClick={handleColumnClick}
          onTableClick={handleTableClick}
          services={services}
          selectedService={selectedService}
          onServiceChange={setSelectedService}
          servicesLoading={servicesLoading}
        />
      </aside>

      <TableInfoDrawer
        asset={selectedAsset}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onViewInPortal={handleViewInPortal}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <QueryEditor
            value={query}
            onChange={setQuery}
            onRun={handleRunQuery}
            isRunning={isRunning}
          />
          <ResultPanel result={result} isRunning={isRunning} />
        </div>
      </div>

      <aside className="w-80 border-l bg-card flex flex-col shrink-0">
        <AICopilot onInsertSQL={handleInsertSQL} currentQuery={query} />
      </aside>
    </div>
  );
}
