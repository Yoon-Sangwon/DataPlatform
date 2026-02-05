import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PermissionLevel = 'none' | 'viewer' | 'developer' | 'owner';

export type SensitivityLevel = 'public' | 'private' | 'confidential';

export type PurposeCategory = 'analysis' | 'reporting' | 'development' | 'other';

export type RequestDuration = '1month' | '3months' | '6months' | 'permanent';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type Service = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
};

export type DataAsset = {
  id: string;
  name: string;
  description: string;
  schema_name: string;
  database_name: string;
  service_id: string | null;
  owner_id: string | null;
  owner_name: string;
  owner_email: string;
  tags: string[];
  business_definition: string;
  doc_links: { title: string; url: string }[];
  sensitivity_level: SensitivityLevel;
  requires_permission: boolean;
  created_at: string;
  updated_at: string;
};

export type AssetColumn = {
  id: string;
  asset_id: string;
  column_name: string;
  data_type: string;
  description: string;
  is_nullable: boolean;
  is_pii: boolean;
  dq_null_ratio: number;
  dq_freshness: 'good' | 'warning' | 'critical';
  ordinal_position: number;
};

export type DataLineage = {
  id: string;
  source_asset_id: string | null;
  target_asset_id: string | null;
  transformation_type: string;
  etl_logic_summary: string;
  source_name: string;
  target_name: string;
  source_type: 'table' | 'dashboard' | 'metric' | 'api';
  target_type: 'table' | 'dashboard' | 'metric' | 'api';
};

export type AssetComment = {
  id: string;
  asset_id: string;
  user_id: string | null;
  user_name: string;
  content: string;
  parent_id: string | null;
  is_answer: boolean;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

export type AssetPermission = {
  id: string;
  asset_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  permission_level: Exclude<PermissionLevel, 'none'>;
  granted_by: string | null;
  granted_by_name: string;
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
};

export type PermissionRequest = {
  id: string;
  asset_id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  requested_level: 'viewer' | 'developer' | 'owner';
  purpose_category: PurposeCategory;
  reason: string;
  duration: RequestDuration;
  status: RequestStatus;
  reviewer_id: string | null;
  reviewer_name: string;
  reviewer_comment: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RequestCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_simple: boolean;
  sort_order: number;
  created_at: string;
};

export type FormField = {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export type RequestType = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  estimated_days: number;
  requires_approval: boolean;
  form_schema: FormField[];
  sort_order: number;
  created_at: string;
};

export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ServiceRequestStatus = 'submitted' | 'in_review' | 'approved' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';

export type ServiceRequest = {
  id: string;
  request_type_id: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  title: string;
  description: string;
  form_data: Record<string, unknown>;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  assignee_name: string | null;
  assignee_email: string | null;
  due_date: string | null;
  completed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  request_type?: RequestType;
  category?: RequestCategory;
};
