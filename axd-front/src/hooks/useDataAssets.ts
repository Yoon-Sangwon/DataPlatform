import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DataAsset, AssetColumn, DataLineage, AssetComment, SensitivityLevel } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type MaskedDataAsset = DataAsset & {
  isMasked: boolean;
  hasPermission: boolean;
};

export function useDataAssets(serviceId?: string | null) {
  const [assets, setAssets] = useState<MaskedDataAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const params = serviceId ? { service_id: serviceId } : {};
      const response = await axios.get<MaskedDataAsset[]>(`${API_URL}/api/v1/assets`, { params });
      setAssets(response.data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching assets');
      // Fallback or empty on error
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return { assets, loading, error, refetch: fetchAssets };
}

export function useAssetDetails(assetId: string | null) {
  const [asset, setAsset] = useState<DataAsset | null>(null);
  const [columns, setColumns] = useState<AssetColumn[]>([]);
  const [lineage, setLineage] = useState<DataLineage[]>([]);
  const [comments, setComments] = useState<AssetComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!assetId) {
      setAsset(null);
      setColumns([]);
      setLineage([]);
      setComments([]);
      return;
    }

    try {
      setLoading(true);

      const [assetRes, columnsRes, lineageRes, commentsRes] = await Promise.all([
        axios.get<DataAsset>(`${API_URL}/api/v1/assets/${assetId}`),
        axios.get<AssetColumn[]>(`${API_URL}/api/v1/assets/${assetId}/columns`),
        axios.get<DataLineage[]>(`${API_URL}/api/v1/assets/${assetId}/lineage`),
        axios.get<AssetComment[]>(`${API_URL}/api/v1/assets/${assetId}/comments`),
      ]);

      setAsset(assetRes.data);
      setColumns(columnsRes.data);
      setLineage(lineageRes.data);
      setComments(commentsRes.data);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching asset details');
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { asset, columns, lineage, comments, loading, error, refetch: fetchDetails };
}

export interface TreeNode {
  id: string;
  name: string;
  type: 'database' | 'schema' | 'table';
  children?: TreeNode[];
  assetId?: string;
  sensitivityLevel?: SensitivityLevel;
  isMasked?: boolean;
  hasPermission?: boolean;
}

export function buildAssetTree(assets: MaskedDataAsset[]): TreeNode[] {
  const tree: TreeNode[] = [];
  const dbMap = new Map<string, TreeNode>();

  assets.forEach((asset) => {
    // Handle potential missing database/schema names gracefully
    const dbName = asset.database_name || 'Unknown DB';
    const schemaName = asset.schema_name || 'public';

    let dbNode = dbMap.get(dbName);
    if (!dbNode) {
      dbNode = {
        id: `db-${dbName}`,
        name: dbName,
        type: 'database',
        children: [],
      };
      dbMap.set(dbName, dbNode);
      tree.push(dbNode);
    }

    let schemaNode = dbNode.children?.find(
      (s) => s.name === schemaName && s.type === 'schema'
    );
    if (!schemaNode) {
      schemaNode = {
        id: `schema-${dbName}-${schemaName}`,
        name: schemaName,
        type: 'schema',
        children: [],
      };
      dbNode.children?.push(schemaNode);
    }

    schemaNode.children?.push({
      id: `table-${asset.id}`,
      name: asset.name,
      type: 'table',
      assetId: asset.id,
      sensitivityLevel: asset.sensitivity_level,
      isMasked: asset.isMasked,
      hasPermission: asset.hasPermission,
    });
  });

  return tree;
}