// Tipos base para o FlowForm/FlowStudio (low-code por fluxograma)
// Regras: sem estilos inline; visual_config e data_config externas controlam comportamento.

export type FlowId = string;
export type StepId = string;
export type PortId = string;
export type ConnectionId = string;

export interface FlowParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'any';
  required?: boolean;
  defaultValue?: any;
  description?: string;
}

export interface FlowStep {
  id: StepId;
  type: string; // ex: 'action', 'condition', 'subflow', 'event'
  label?: string;
  x?: number; // coordenadas no diagrama (persistidas no backend)
  y?: number;
  inputs?: PortId[];
  outputs?: PortId[];
  params?: Record<string, any>; // valores paramétricos
  meta?: Record<string, any>;   // metadados diversos
}

export interface FlowConnection {
  id: ConnectionId;
  fromStepId: StepId;
  fromPort?: PortId;
  toStepId: StepId;
  toPort?: PortId;
  condition?: string; // expressão (avaliada pelo ExpressionDesigner)
}

export interface FlowDefinition {
  id: FlowId;
  name: string;
  description?: string;
  version?: number;
  params?: FlowParam[];
  steps: FlowStep[];
  connections: FlowConnection[];
  visual_config?: Record<string, any>;
  data_config?: Record<string, any>;
}

export interface WebFunctionRef {
  code: string;        // referência à tabela web_functions
  name?: string;
  description?: string;
  params?: FlowParam[];
  returns?: FlowParam | null;
}

// Entidade completa para catálogos de funções do Flow (tabela web_functions)
export interface WebFunction extends WebFunctionRef {
  id?: number;
  category?: string;
  tags?: string[];
}

// ============================================
// WEB_FUNCTIONS_V2 - Funções Modernizadas
// ============================================

export interface ParamSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'any';
  required?: boolean;
  default?: any;
  pattern?: string;  // Regex de validação
  min?: number;
  max?: number;
  description?: string;
}

export interface ReturnSchema {
  type: string;
  description?: string;
  nullable?: boolean;
}

export type ExecutionContext = 'client' | 'server' | 'hybrid' | 'database';

export interface WebFunctionV2 {
  id: number;
  legacy_id?: number;  // Referência à web_functions antiga
  
  // Identificação
  name: string;
  alias?: string;
  slug: string;  // Ex: "fetch-bytes-from-url"
  
  // Documentação
  description?: string;
  summary?: string;
  examples?: any[];  // Array de exemplos JSON
  
  // Schema de Parâmetros (JSON)
  params_schema: ParamSchema[];
  return_schema: ReturnSchema;
  
  // Código Modernizado
  typescript_code?: string;
  java_code?: string;
  sql_code?: string;
  
  // Templates Mustache (para Code Compiler)
  typescript_template?: string;
  java_template?: string;
  
  // Metadados
  category_id: number;
  execution_context: ExecutionContext;
  is_async: boolean;
  
  // Versionamento
  version?: string;
  created_at?: Date;
  updated_at?: Date;
  deprecated?: boolean;
  deprecation_reason?: string;
}

// Para uso no FlowStep quando referenciar uma web_function_v2
export interface FunctionCallStep extends FlowStep {
  type: 'functionCall';
  function_id: number;  // FK para web_functions_v2.id
  function_slug?: string;  // Slug da função (cache)
  params: Record<string, any>;  // Valores dos parâmetros
}

// Categorias de Funções (tabela function_categories)
export interface FunctionCategory {
  id: number;
  name: string;
  description?: string;
}













