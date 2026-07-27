/**
 * Types para o Sistema de Formulários Dinâmicos
 * FormBuild + QueryBuild + FlowBuild Integration
 * Data: 24 de outubro de 2025
 */

/**
 * ============================================================================
 * TIPOS DE DEFINIÇÃO DE FORMULÁRIO
 * ============================================================================
 */

export type TipoFormulario = 'consulta' | 'entrada' | 'consulta_entrada';
export type TipoCampo = 'text' | 'number' | 'date' | 'datetime' | 'email' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'currency' | 'cpf' | 'cnpj' | 'telefone';
export type ModoFormulario = 'create' | 'edit' | 'view';
export type TipoOperacao = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
export type StatusSubmissao = 'sucesso' | 'erro' | 'pendente';

/**
 * Definição de um Formulário
 */
export interface FormDefinition {
  id: string;
  nome: string;
  descricao?: string;
  tabela_origem: string;
  tipo_formulario: TipoFormulario;
  ativo: boolean;
  visual_config?: VisualConfig;
  data_config?: DataConfig;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Configuração Visual do Formulário
 */
export interface VisualConfig {
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  tema?: 'light' | 'dark' | 'auto';
  grid_height?: string;
  padding?: string;
  border_radius?: string;
  background_color?: string;
  [key: string]: any;
}

/**
 * Configuração de Dados do Formulário
 */
export interface DataConfig {
  chave_primaria: string;
  filtros_default?: FilterRule[];
  ordenacao_padrao?: OrderRule[];
  limite_registros?: number;
  [key: string]: any;
}

/**
 * ============================================================================
 * TIPOS DE CAMPO
 * ============================================================================
 */

/**
 * Definição de um Campo do Formulário
 */
export interface FormField {
  id: string;
  form_id: string;
  nome: string;
  label: string;
  tipo_campo: TipoCampo;
  coluna_banco: string;
  tabela_banco?: string;
  requerido?: boolean;
  tamanho_maximo?: number;
  valor_padrao?: any;
  mascara_entrada?: string;
  regex_validacao?: string;
  tabela_relacionada?: string;
  coluna_chave?: string;
  coluna_exibicao?: string;
  coluna_filtro?: string;
  visivel_listagem?: boolean;
  visivel_edicao?: boolean;
  visivel_insercao?: boolean;
  somente_leitura?: boolean;
  ordem: number;
  visual_config?: FieldVisualConfig;
  regras_dependencia?: DependencyRule[];
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Configuração Visual de um Campo
 */
export interface FieldVisualConfig {
  width?: string;
  placeholder?: string;
  help_text?: string;
  icon?: string;
  css_class?: string;
  [key: string]: any;
}

/**
 * Valor de um Campo
 */
export interface FieldValue {
  fieldId: string;
  fieldName: string;
  value: any;
  error?: string;
  isDirty?: boolean;
  isTouched?: boolean;
}

/**
 * Estado do Formulário
 */
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * ============================================================================
 * TIPOS DE QUERY BUILDER
 * ============================================================================
 */

/**
 * Definição de uma Query
 */
export interface FormQuery {
  id: string;
  form_id: string;
  nome: string;
  descricao?: string;
  tipo_query: 'listagem' | 'busca' | 'filtro' | 'relatorio';
  query_config?: QueryConfig;
  sql_customizado?: string;
  ordem_padrao?: OrderRule[];
  limite_registros?: number;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Configuração de Query Dinâmica
 */
export interface QueryConfig {
  tabela: string;
  colunas: string[];
  joins?: JoinRule[];
  filtros?: FilterRule[];
  agrupamento?: string[];
  tendo?: FilterRule[];
}

/**
 * Regra de JOIN
 */
export interface JoinRule {
  tipo: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  tabela: string;
  condicao: string;
}

/**
 * Regra de Filtro
 */
export interface FilterRule {
  campo: string;
  operador: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL' | 'BETWEEN';
  valor?: any;
  valor_fim?: any;
  logico?: 'AND' | 'OR';
  tabela?: string;
}

/**
 * Regra de Ordenação
 */
export interface OrderRule {
  campo: string;
  direcao: 'ASC' | 'DESC';
  tabela?: string;
}

/**
 * Resultado de Execução de Query
 */
export interface QueryResult {
  dados: any[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  sucesso: boolean;
  mensagem?: string;
}

/**
 * ============================================================================
 * TIPOS DE VALIDAÇÃO
 * ============================================================================
 */

/**
 * Regra de Validação
 */
export interface FormValidacao {
  id: string;
  form_id: string;
  nome: string;
  descricao?: string;
  field_id?: string;
  tipo: 'unique' | 'custom' | 'conditional' | 'regex' | 'comparison';
  config?: Record<string, any>;
  mensagem_erro?: string;
  ativo: boolean;
}

/**
 * Erro de Validação
 */
export interface ValidationError {
  campo: string;
  mensagem: string;
  tipo: string;
  valor?: any;
}

/**
 * ============================================================================
 * TIPOS DE DEPENDÊNCIA E REGRAS
 * ============================================================================
 */

/**
 * Regra de Dependência entre Campos
 */
export interface DependencyRule {
  tipo: 'show' | 'hide' | 'require' | 'disable' | 'enable';
  condicao: ConditionRule[];
  aplicar_quando: 'todos' | 'algum';
}

/**
 * Condição de Dependência
 */
export interface ConditionRule {
  campo: string;
  operador: '=' | '!=' | '>' | '<' | 'contém' | 'começa_com' | 'termina_com';
  valor: any;
}

/**
 * ============================================================================
 * TIPOS DE SUBMISSÃO
 * ============================================================================
 */

/**
 * Submissão de Formulário
 */
export interface FormSubmission {
  id: string;
  form_id: string;
  usuario_id: number;
  operacao: TipoOperacao;
  dados_originais?: Record<string, any>;
  dados_novos: Record<string, any>;
  registro_id?: string;
  tabela_origem: string;
  status: StatusSubmissao;
  mensagem_erro?: string;
  criado_em: Date;
  processado_em?: Date;
}

/**
 * Resultado de Submissão
 */
export interface SubmissionResult {
  sucesso: boolean;
  mensagem: string;
  dados?: Record<string, any>;
  erros?: ValidationError[];
  registro_id?: string;
}

/**
 * ============================================================================
 * TIPOS DE AÇÕES
 * ============================================================================
 */

/**
 * Ação de Formulário
 */
export interface FormAcao {
  id: string;
  form_id: string;
  nome: string;
  descricao?: string;
  tipo_acao: 'gravar' | 'cancelar' | 'deletar' | 'custom' | 'integracao_flow';
  quando_executar: 'antes_gravar' | 'apos_gravar' | 'antes_deletar' | 'apos_deletar';
  config?: Record<string, any>;
  flow_id?: string;
  ordem: number;
  ativo: boolean;
}

/**
 * ============================================================================
 * TIPOS DE PROPS DOS COMPONENTES
 * ============================================================================
 */

/**
 * Props do ListForm
 */
export interface ListFormProps {
  formId: string;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  onNew?: () => void;
  initialFilters?: FilterRule[];
}

/**
 * Props do ModalForm
 */
export interface ModalFormProps {
  formId: string;
  mode: ModoFormulario;
  recordData?: any;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}

/**
 * Props do FormRenderer
 */
export interface FormRendererProps {
  formId: string;
  fields: FormField[];
  data: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  onFieldBlur?: (fieldName: string) => void;
  mode: ModoFormulario;
  errors?: Record<string, string>;
}

/**
 * Props do SearchBar
 */
export interface SearchBarProps {
  onSearch: (termo: string, filtros: any) => void;
  onInclude: () => void;
  placeholder?: string;
  showAdvanced?: boolean;
  onAdvancedToggle?: () => void;
}

/**
 * Props do DynamicField
 */
export interface DynamicFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  isTouched?: boolean;
  isDirty?: boolean;
  mode: ModoFormulario;
  options?: SelectOption[];
}

/**
 * Props do QueryRenderer
 */
export interface QueryRendererProps {
  formId: string;
  queryId?: string;
  filtros?: FilterRule[];
  pagina?: number;
  limite?: number;
  onResults: (results: QueryResult) => void;
}

/**
 * ============================================================================
 * TIPOS AUXILIARES
 * ============================================================================
 */

/**
 * Opção de Select/Multiselect
 */
export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Coluna de Grid
 */
export interface GridColumn {
  field: string;
  headerName: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  renderer?: (value: any, row: any) => React.ReactNode;
}

/**
 * Atalho de Teclado
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
}

/**
 * Notificação
 */
export interface Notification {
  id: string;
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  mensagem: string;
  duracao?: number;
}

/**
 * ============================================================================
 * TIPOS DE RESPOSTA DA API
 * ============================================================================
 */

/**
 * Resposta Padrão da API
 */
export interface ApiResponse<T = any> {
  sucesso: boolean;
  dados?: T;
  erros?: ValidationError[];
  mensagem?: string;
}

/**
 * Resposta de Listagem
 */
export interface PaginatedResponse<T = any> {
  sucesso: boolean;
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

/**
 * ============================================================================
 * TIPOS DE CONTEXTO (React Context)
 * ============================================================================
 */

/**
 * Contexto do Formulário
 */
export interface FormContextValue {
  formDefinition?: FormDefinition;
  fields: FormField[];
  formState: FormState;
  setFieldValue: (fieldName: string, value: any) => void;
  setFieldError: (fieldName: string, error: string) => void;
  setFieldTouched: (fieldName: string, touched: boolean) => void;
  resetForm: () => void;
  submitForm: () => Promise<SubmissionResult>;
  isLoading: boolean;
  error?: string;
}

/**
 * ============================================================================
 * TIPOS DE HOOKS
 * ============================================================================
 */

/**
 * Hook: useFormDefinition
 */
export interface UseFormDefinitionReturn {
  form?: FormDefinition;
  fields: FormField[];
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
}

/**
 * Hook: useFormSubmission
 */
export interface UseFormSubmissionReturn {
  submit: (data: Record<string, any>, mode: TipoOperacao) => Promise<SubmissionResult>;
  isSubmitting: boolean;
  error?: string;
}

/**
 * Hook: useQueryExecutor
 */
export interface UseQueryExecutorReturn {
  execute: (queryId: string, filtros?: FilterRule[], page?: number) => Promise<QueryResult>;
  results?: QueryResult;
  loading: boolean;
  error?: string;
}

/**
 * ============================================================================
 * TIPOS DE CONFIGURAÇÃO
 * ============================================================================
 */

/**
 * Configuração Global do FormBuilder
 */
export interface FormBuilderConfig {
  apiBaseUrl: string;
  toastDuration?: number;
  dateFormat?: string;
  currencyFormat?: string;
  defaultPageSize?: number;
  maxPageSize?: number;
  enableKeyboardShortcuts?: boolean;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
}













