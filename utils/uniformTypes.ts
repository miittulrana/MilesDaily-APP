export interface UniformType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface UniformSize {
  id: string;
  name: string;
  size_type: 'clothing' | 'trouser' | 'shoe';
  numeric_value?: number;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UniformInventoryItem {
  id: string;
  uniform_type_id: string;
  uniform_size_id: string;
  current_stock: number;
  minimum_stock: number;
  maximum_limit_per_driver: number;
  created_at?: string;
  updated_at?: string;
  uniform_type?: UniformType;
  uniform_size?: UniformSize;
  driver_current_allocation?: number;
  driver_pending_requests?: number;
  can_request?: boolean;
  max_requestable?: number;
  available_stock?: number;
}

export interface DriverSizePreference {
  id: string;
  driver_id: string;
  uniform_type_id: string;
  uniform_size_id: string;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
  uniform_type?: UniformType;
  uniform_size?: UniformSize;
}

export interface UniformRequest {
  id: string;
  driver_id: string;
  uniform_type_id: string;
  uniform_size_id: string;
  quantity_requested: number;
  quantity_approved: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  request_reason?: string;
  admin_notes?: string;
  approved_by?: string;
  approved_at?: string;
  completed_by?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  uniform_type?: UniformType;
  uniform_size?: UniformSize;
}

export interface DriverUniformAllocation {
  id: string;
  driver_id: string;
  uniform_type_id: string;
  uniform_size_id: string;
  quantity_allocated: number;
  allocated_by?: string;
  allocated_at?: string;
  created_at?: string;
  updated_at?: string;
  uniform_type?: UniformType;
  uniform_size?: UniformSize;
  max_limit?: number;
  can_request_more?: boolean;
}

export interface UniformReturnRequest {
  id: string;
  driver_id: string;
  uniform_type_id: string;
  uniform_size_id: string;
  quantity_to_return: number;
  reason?: string;
  status: 'pending' | 'approved' | 'completed';
  processed_by?: string;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
  uniform_type?: UniformType;
  uniform_size?: UniformSize;
}

export interface SelfReportedUniform {
  id: string;
  driver_id: string;
  uniform_type_id: string;
  uniform_size_id: string;
  quantity_owned: number;
  condition: 'new' | 'good' | 'worn' | 'damaged';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  uniform_type?: UniformType;
  uniform_size?: UniformSize;
}

export interface CreateRequestData {
  uniform_type_id: string;
  uniform_size_id: string;
  quantity_requested: number;
  request_reason?: string;
  return_quantity?: number;
  return_reason?: string;
}

export interface CreatePreferenceData {
  uniform_type_id: string;
  uniform_size_id: string;
}

export interface CreateReturnData {
  uniform_type_id: string;
  uniform_size_id: string;
  quantity_to_return: number;
  reason?: string;
}

export interface CreateSelfReportData {
  uniform_type_id: string;
  uniform_size_id: string;
  quantity_owned: number;
  condition: 'new' | 'good' | 'worn' | 'damaged';
  notes?: string;
}