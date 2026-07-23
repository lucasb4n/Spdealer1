/**
 * src/types/queryBuilder.ts
 * 
 * Tipos e interfaces para Query Builder Gráfico
 * Sincronizados com backend Java
 */

// ============================================================================
// TIPOS BÁSICOS
// ============================================================================

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
export type FilterOperator = '=' | 'LIKE' | '<' | '>' | '<=' | '>=' | '<>' | 'IN' | 'BETWEEN' | 'IS NULL' | 'IS NOT NULL';
export type LogicalOperator = 'AND' | 'OR';
export type AggregationType = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT';
export type SortDirection = 'ASC' | 'DESC';
export type DataType = 'INT' | 'VARCHAR' | 'DATETIME' | 'DECIMAL' | 'TEXT' | 'TINYINT' | 'BIGINT' | 'DOUBLE' | 'DATE' | 'TIMESTAMP';

// ============================================================================
// DICTIONARY TYPES (do banco)
// ============================================================================

export interface DatabaseColumn {
  id: number;
  table_name: string;
  column_name: string;
  data_type: DataType;
  character_maximum_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  default_value?: string;
  alias?: string;
  form_visible: boolean;
  search_visible: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTable {
  id: number;
  table_name: string;
  display_name?: string;
  is_project_specific: boolean;
  description?: string;
  columns: DatabaseColumn[];
  created_at: string;
  updated_at: string;
}

export interface TableRelation {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
}

// ============================================================================
// QUERY CONFIG (o que o builder cria)
// ============================================================================

export interface TableReference {
  name: string;
  alias: string;
}

export interface SelectedColumn {
  table: string;
  column: string;
  alias?: string;
  aggregation?: AggregationType;
}

export interface JoinCondition {
  leftTable: string;
  leftColumn: string;
  operator: FilterOperator;
  rightTable: string;
  rightColumn: string;
}

export interface JoinConfig {
  type: JoinType;
  table: string;
  alias: string;
  on: JoinCondition;
}

export interface FilterCondition {
  column: string;             // "table.column" ou somente "column"
  operator: FilterOperator;
  value: any;
  logical?: LogicalOperator;  // Lógica com próximo filtro (default: AND)
}

export interface OrderByConfig {
  column: string;
  direction: SortDirection;
}

export interface QueryBuilderConfig {
  // Tabela base (obrigatória)
  baseTable: TableReference;

  // Colunas selecionadas
  columns: SelectedColumn[];

  // JOINs
  joins?: JoinConfig[];

  // Filtros (WHERE)
  filters?: FilterCondition[];

  // Agregações
  groupBy?: string[];
  having?: FilterCondition[];

  // Ordenação
  orderBy?: OrderByConfig[];

  // Pagination
  limit?: number;
  offset?: number;
}

// ============================================================================
// DASHBOARD QUERY (armazenado no banco)
// ============================================================================

export interface CreateQueryRequest {
  name: string;
  description?: string;
  config: QueryBuilderConfig;
  is_public?: boolean;
}

export interface UpdateQueryRequest {
  name?: string;
  description?: string;
  config?: QueryBuilderConfig;
  is_public?: boolean;
}

export interface DashboardQuery {
  id: number;
  name: string;
  description?: string;
  sql_query: string;           // SQL gerado
  parameters?: Record<string, any>;
  query_config?: QueryBuilderConfig;  // Config do builder
  is_public: boolean;
  created_by: number;
  allowed_users?: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// RESPONSES
// ============================================================================

export interface QueryValidationResult {
  valid: boolean;
  sql?: string;
  error?: string;
  message?: string;
}

export interface QueryPreviewResult {
  sql: string;
  rows: Record<string, any>[];
  columns: string[];
  rowCount: number;
  error?: string;
  executionTime?: number;
}

export interface QueryGenerationResult {
  sql: string;
  error?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// UI STATE (para components React)
// ============================================================================

export interface QueryBuilderState {
  config: QueryBuilderConfig;
  loading: boolean;
  error?: string;
  previewLoading?: boolean;
  previewData?: QueryPreviewResult;
  sql?: string;
  validationResult?: QueryValidationResult;
}

export interface QueryBuilderStore {
  // State
  state: QueryBuilderState;
  tables: DatabaseTable[];
  relations: TableRelation[];

  // Actions
  loadTables: () => Promise<void>;
  loadRelations: () => Promise<void>;
  setBaseTable: (table: string) => void;
  addColumn: (col: SelectedColumn) => void;
  removeColumn: (col: SelectedColumn) => void;
  updateColumn: (oldCol: SelectedColumn, newCol: SelectedColumn) => void;
  addJoin: (join: JoinConfig) => void;
  removeJoin: (index: number) => void;
  addFilter: (filter: FilterCondition) => void;
  removeFilter: (index: number) => void;
  setGroupBy: (columns: string[]) => void;
  setOrderBy: (orderBy: OrderByConfig[]) => void;
  setLimit: (limit: number) => void;
  generateSQL: () => Promise<string>;
  validateConfig: () => Promise<void>;
  previewQuery: () => Promise<void>;
  reset: () => void;
}

// ============================================================================
// HELPER FUNCTIONS / UTILITIES
// ============================================================================

export interface ColumnOption {
  value: string;             // "table.column"
  label: string;             // "Display Name (Table)"
  type: DataType;
  table: string;
  column: string;
  isForeignKey?: boolean;
  isPrimaryKey?: boolean;
}

export interface TableOption {
  value: string;             // table_name
  label: string;             // display_name
  table: DatabaseTable;
}

export interface AggregationOption {
  value: AggregationType;
  label: string;
  supportedTypes: DataType[];  // Tipos de coluna que suportam
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const AGGREGATION_OPTIONS: Record<AggregationType, AggregationOption> = {
  COUNT: {
    value: 'COUNT',
    label: 'Contar',
    supportedTypes: ['INT', 'VARCHAR', 'DATETIME', 'DECIMAL', 'TEXT', 'TINYINT', 'BIGINT', 'DOUBLE', 'DATE', 'TIMESTAMP'],
  },
  COUNT_DISTINCT: {
    value: 'COUNT_DISTINCT',
    label: 'Contar Distintos',
    supportedTypes: ['INT', 'VARCHAR', 'DATETIME', 'DECIMAL', 'TINYINT', 'BIGINT', 'DOUBLE', 'DATE', 'TIMESTAMP'],
  },
  SUM: {
    value: 'SUM',
    label: 'Soma',
    supportedTypes: ['INT', 'DECIMAL', 'BIGINT', 'DOUBLE'],
  },
  AVG: {
    value: 'AVG',
    label: 'Média',
    supportedTypes: ['INT', 'DECIMAL', 'BIGINT', 'DOUBLE'],
  },
  MIN: {
    value: 'MIN',
    label: 'Mínimo',
    supportedTypes: ['INT', 'VARCHAR', 'DATETIME', 'DECIMAL', 'BIGINT', 'DOUBLE', 'DATE', 'TIMESTAMP'],
  },
  MAX: {
    value: 'MAX',
    label: 'Máximo',
    supportedTypes: ['INT', 'VARCHAR', 'DATETIME', 'DECIMAL', 'BIGINT', 'DOUBLE', 'DATE', 'TIMESTAMP'],
  },
};

export const FILTER_OPERATORS: Record<FilterOperator, string> = {
  '=': 'Igual',
  '<>': 'Diferente',
  '<': 'Menor que',
  '>': 'Maior que',
  '<=': 'Menor ou igual',
  '>=': 'Maior ou igual',
  'LIKE': 'Contém',
  'IN': 'Em lista',
  'BETWEEN': 'Entre',
  'IS NULL': 'Vazio',
  'IS NOT NULL': 'Não vazio',
};

export const LOGICAL_OPERATORS: Record<LogicalOperator, string> = {
  'AND': 'E',
  'OR': 'Ou',
};

export const SORT_DIRECTIONS: Record<SortDirection, string> = {
  'ASC': 'Crescente (A→Z)',
  'DESC': 'Decrescente (Z→A)',
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_QUERY_CONFIG: QueryBuilderConfig = {
  baseTable: { name: '', alias: '' },
  columns: [],
  joins: [],
  filters: [],
  groupBy: [],
  orderBy: [],
  limit: 100,
  offset: 0,
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDatabaseTable(obj: any): obj is DatabaseTable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.table_name === 'string' &&
    Array.isArray(obj.columns)
  );
}

export function isDashboardQuery(obj: any): obj is DashboardQuery {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.sql_query === 'string'
  );
}

export function isQueryBuilderConfig(obj: any): obj is QueryBuilderConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.baseTable === 'object' &&
    Array.isArray(obj.columns)
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const QueryBuilderTypes = {
  // Guards
  isDatabaseTable,
  isDashboardQuery,
  isQueryBuilderConfig,

  // Constants
  AGGREGATION_OPTIONS,
  FILTER_OPERATORS,
  LOGICAL_OPERATORS,
  SORT_DIRECTIONS,
  DEFAULT_QUERY_CONFIG,
};

export default QueryBuilderTypes;













