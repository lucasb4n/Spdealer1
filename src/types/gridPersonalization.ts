/**
 * gridPersonalization.ts
 * 
 * Tipos para persistência de personalização de AG Grid por usuário
 * - Largura das colunas
 * - Posição/ordem das colunas
 * - Ordenação padrão (sort)
 * - Visibilidade de colunas
 */

/**
 * Estado de uma coluna personalizada
 */
export interface GridColumnPersonalization {
  field: string;                    // Identificador único da coluna
  width?: number;                   // Largura em pixels
  position?: number;                // Posição na tabela (0-based index)
  visible?: boolean;                // Se a coluna está visível
  sortIndex?: number;               // Índice de ordenação (-1 se não ordenada)
  sortDir?: 'asc' | 'desc';        // Direção da ordenação
}

/**
 * Estado completo de personalização de um AG Grid
 */
export interface GridPersonalizationState {
  gridId: string;                   // Identificador único do grid (ex: "dashboard_1_kpiReceber")
  userId: string;                   // ID do usuário
  columns: GridColumnPersonalization[]; // Array de colunas personalizadas
  defaultSortModel?: Array<{        // Modelo de ordenação padrão
    colId: string;
    sort: 'asc' | 'desc';
  }>;
  rowHeight?: number;               // Altura das linhas
  savedAt: string;                  // Timestamp de quando foi salvo (ISO 8601)
}

/**
 * Resposta da API ao salvar personalização
 */
export interface GridPersonalizationResponse {
  success: boolean;
  message?: string;
  gridId: string;
  savedAt: string;
}

/**
 * Histórico de mudanças (para auditoria)
 */
export interface GridPersonalizationChange {
  gridId: string;
  userId: string;
  changeType: 'column_width' | 'column_order' | 'column_visibility' | 'sort' | 'row_height';
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  changedAt: string;
}













