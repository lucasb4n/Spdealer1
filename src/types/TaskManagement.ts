// src/types/TaskManagement.ts
// ============================================================================
// TIPOS PARA SISTEMA DE KANBAN (TASK MANAGEMENT)
// ============================================================================

/**
 * Status/Etapas do workflow
 */
export type TaskStageKey = 
  | 'backlog' 
  | 'executing' 
  | 'completed' 
  | 'visualized' 
  | 'documented' 
  | 'backup_committed';

export interface TaskStage {
  id: number;
  stage_key: TaskStageKey;
  stage_name: string;
  description?: string;
  display_order: number;
  color_bg: string;
  color_border: string;
  color_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Prioridades
 */
export type PriorityKey = 'low' | 'normal' | 'high' | 'critical';

export const PRIORITY_COLORS: Record<PriorityKey, string> = {
  low: '#6c757d',
  normal: '#0d6efd',
  high: '#fd7e14',
  critical: '#dc3545',
};

export const PRIORITY_LABELS: Record<PriorityKey, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  critical: 'Crítica',
};

/**
 * Categorias de tarefas
 */
export type TaskCategoryKey = 
  | 'bug' 
  | 'feature' 
  | 'enhancement' 
  | 'refactor' 
  | 'documentation' 
  | 'chore';

export const TASK_CATEGORIES: Record<TaskCategoryKey, string> = {
  bug: '🐛 Bug',
  feature: '✨ Feature',
  enhancement: '⬆️ Melhoria',
  refactor: '🔧 Refatoração',
  documentation: '📝 Documentação',
  chore: '🧹 Tarefa',
};

/**
 * Tarefa/Card do Kanban
 */
export interface TaskManagement {
  id: number;
  task_id: string;                    // TASK-001
  title: string;
  description?: string;
  
  // Atribuição
  assigned_to_user_id?: number;
  assigned_to_name?: string;
  created_by_user_id: number;
  created_by_name?: string;
  
  // Categorização
  category_key?: TaskCategoryKey;
  priority_key: PriorityKey;
  
  // Status
  current_stage_id: number;
  stage_key?: TaskStageKey;
  stage_name?: string;
  color_bg?: string;
  
  // Datas
  created_at: string;
  updated_at: string;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  
  // Horas
  estimated_hours?: number;
  actual_hours?: number;
  
  // Tags
  tags?: string[];
  module_key?: string;
  
  // Bloqueios
  is_blocked: boolean;
  blocked_reason?: string;
  is_archived: boolean;
  
  // Anexos e imagens
  attachment_count?: number;
  image_count?: number;
  primary_image_path?: string;
}

/**
 * Anexo/Imagem da tarefa
 */
export interface TaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  is_image: boolean;
  image_width?: number;
  image_height?: number;
  thumbnail_path?: string;
  uploaded_by_user_id: number;
  uploaded_at: string;
  is_primary: boolean;
  display_order: number;
}

/**
 * Histórico de movimentação da tarefa
 */
export type HistoryActionType = 
  | 'created' 
  | 'moved' 
  | 'status_changed' 
  | 'assigned' 
  | 'commented' 
  | 'approved'
  | 'image_added'
  | 'image_removed';

export interface TaskHistory {
  id: number;
  task_id: number;
  action_type: HistoryActionType;
  from_value?: string;
  to_value?: string;
  action_description: string;
  performed_by_user_id: number;
  performed_by_name?: string;
  performed_at: string;
  
  // Aprovação
  approval_status?: 'pending' | 'approved' | 'rejected';
  approval_comment?: string;
  approval_by_user_id?: number;
  approved_at?: string;
}

/**
 * Workflow de aprovações
 */
export type ApprovalRole = 'tech_lead' | 'qa' | 'product_owner';

export interface TaskApproval {
  id: number;
  task_id: number;
  approver_user_id: number;
  approver_name?: string;
  approval_role: ApprovalRole;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_comment?: string;
  created_at: string;
  approved_at?: string;
  approval_order: number;
}

/**
 * Resumo do Kanban (para dashboard)
 */
export interface KanbanSummary {
  stage_id: number;
  stage_key: TaskStageKey;
  stage_name: string;
  display_order: number;
  color_bg: string;
  task_count: number;
  blocked_count: number;
  critical_count: number;
}

/**
 * Requisição de criar tarefa
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  category_key?: TaskCategoryKey;
  priority_key: PriorityKey;
  assigned_to_user_id?: number;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
  module_key?: string;
}

/**
 * Requisição de atualizar tarefa
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority_key?: PriorityKey;
  assigned_to_user_id?: number;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  is_blocked?: boolean;
  blocked_reason?: string;
}

/**
 * Requisição de mover tarefa
 */
export interface MoveTaskRequest {
  from_stage_id: number;
  to_stage_id: number;
  task_id: number;
}

/**
 * Requisição de aprovação
 */
export interface ApproveTaskRequest {
  approval_status: 'approved' | 'rejected';
  approval_comment?: string;
}

/**
 * Filtros de busca
 */
export interface TaskSearchFilters {
  search_text?: string;
  stage_id?: number;
  priority_key?: PriorityKey;
  assigned_user_id?: number;
  category_key?: TaskCategoryKey;
  module_key?: string;
  is_blocked?: boolean;
  due_date_from?: string;
  due_date_to?: string;
  created_date_from?: string;
  created_date_to?: string;
}

/**
 * Resposta paginada de tarefas
 */
export interface TasksPageResponse {
  total: number;
  page: number;
  page_size: number;
  tasks: TaskManagement[];
}

/**
 * Status de upload
 */
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

/**
 * Props para componente de upload
 */
export interface UploadProps {
  task_id: number;
  on_upload_complete?: (attachment: TaskAttachment) => void;
  on_error?: (error: string) => void;
  max_file_size?: number;  // bytes
  accepted_types?: string[]; // 'image/png', 'application/pdf', etc
}

/**
 * Estado do Kanban Board
 */
export interface KanbanBoardState {
  stages: TaskStage[];
  tasks: Map<number, TaskManagement[]>;  // stage_id -> tasks
  selected_task?: TaskManagement;
  filter: TaskSearchFilters;
  is_loading: boolean;
  error?: string;
  last_updated: string;
}

/**
 * Props para o componente KanbanBoard
 */
export interface KanbanBoardProps {
  user_id?: number;
  module_key?: string;
  editable?: boolean;
  show_filters?: boolean;
  show_summary?: boolean;
  allow_create?: boolean;
  on_task_moved?: (task_id: number, from_stage: number, to_stage: number) => void;
  on_task_selected?: (task: TaskManagement) => void;
}

/**
 * Props para o componente TaskCard
 */
export interface TaskCardProps {
  task: TaskManagement;
  draggable?: boolean;
  on_click?: (task: TaskManagement) => void;
  on_remove_image?: (attachment_id: number) => void;
  show_stage_label?: boolean;
}

/**
 * Props para o componente TaskModal
 */
export interface TaskModalProps {
  task?: TaskManagement;
  is_open: boolean;
  on_close: () => void;
  on_save?: (task: TaskManagement) => void;
  on_delete?: (task_id: number) => void;
  read_only?: boolean;
}













