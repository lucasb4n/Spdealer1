import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook customizado para carregar colunas dinâmicas de um formulário
 * baseado no dictionary do banco de dados
 * 
 * Uso:
 * const { columns, loading, error } = useTableColumns('clientes', 'form');
 */

export interface DictionaryColumn {
  id: number;
  table_name: string;
  column_name: string;
  display_label: string;
  data_type: string;
  input_type: string;
  max_length: number;
  required: boolean;
  form_visible_new: boolean;
  form_visible_edit: boolean;
  form_visible_search: boolean;
  form_order_new: number;
  form_order_edit: number;
  form_order_search: number;
  search_order: number;
  search_visible: boolean;
  validation_pattern: string | null;
  help_text: string | null;
  default_value: string | null;
  lookup_table: string | null;
  lookup_display: string | null;
  lookup_value: string | null;
  /** Aba/secao do formulario onde o campo aparece (ex: 'Juridica', 'Endereco', 'Fisica') */
  aba?: string | null;
  /** Ordem de tabulacao/navegacao dentro da aba */
  tabulation?: number;
  [key: string]: any;
}

export interface UseTableColumnsResult {
  columns: DictionaryColumn[];
  loading: boolean;
  error: string | null;
}

/**
 * Carrega colunas do dictionary para um contexto específico
 * @param tableName Nome da tabela (ex: 'clientes')
 * @param context Contexto ('form_new', 'form_edit', 'search', etc)
 * @returns Objeto com columns, loading, error
 */
// Simple in-memory cache to avoid refetching dictionary columns repeatedly
const columnsCache: Map<string, DictionaryColumn[]> = new Map();

export function useTableColumns(
  tableName: string,
  context: 'form_new' | 'form_edit' | 'search' = 'form_edit'
): UseTableColumnsResult {
  const [columns, setColumns] = useState<DictionaryColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    const cacheKey = `${tableName}::${context}`;

    const fetchColumns = async () => {
      try {
        setLoading(true);
        setError(null);

            // Return cached columns immediately if available (memory)
            if (columnsCache.has(cacheKey)) {
              setColumns(columnsCache.get(cacheKey) as DictionaryColumn[]);
              setLoading(false);
              return;
            }

            // Try persistent sessionStorage cache (survive reloads within session)
            try {
              const sess = sessionStorage.getItem(`dict::${cacheKey}`);
              if (sess) {
                const parsed = JSON.parse(sess) as DictionaryColumn[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // populate memory cache too
                  columnsCache.set(cacheKey, parsed);
                  setColumns(parsed);
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {
              // ignore sessionStorage issues (e.g., disabled)
            }

        // Determinar qual campo usar baseado no contexto
        const visibilityField = context === 'form_new' 
          ? 'form_visible_new' 
          : context === 'search'
          ? 'search_visible'
          : 'form_visible_edit';

        const orderField = context === 'form_new' 
          ? 'form_order_new' 
          : context === 'search'
          ? 'search_order'
          : 'form_order_edit';

        // URLs candidatas (fallbacks) alinhadas aos controllers existentes
        // 1) /api/v1/dictionary/tables/{tableName}/columns  (DictionaryV1Controller)
        // 2) /api/dictionary/columns/{tableName}            (DictionaryController)
        // 3) /api/dictionary/columns/{tableName}/context/{form|search} (opcional)
        const contextForApi = context === 'search' ? 'search' : 'form';
        const candidateUrls = [
          `/api/v1/dictionary/tables/${tableName}/columns`,
          `/api/dictionary/columns/${tableName}`,
          `/api/dictionary/columns/${tableName}/context/${contextForApi}`,
        ];

        let response: any = null;
        let lastError: any = null;

        for (const url of candidateUrls) {
          try {
            response = await axios.get(url, {
              params: {
                visibility_field: visibilityField,
                order_field: orderField
              },
              timeout: 6000 // 6s timeout to avoid long waits
            });
            // Se chegou aqui, temos sucesso
            break;
          } catch (e) {
            // registrar e tentar próxima URL
            // axios error pode ter response.status
            lastError = e;
            // Se for 404, tentar próximo; senão, continuar e reportar depois
            continue;
          }
        }

        if (!response) {
          // Não encontramos um endpoint compatível
          throw lastError || new Error('Nenhum endpoint de dictionary disponível');
        }

        // Filtrar e ordenar colunas visíveis
        const visibleColumns = response.data
          .filter((col: DictionaryColumn) => {
            if (context === 'form_new') return col.form_visible_new;
            if (context === 'search') return col.search_visible;
            return col.form_visible_edit;
          })
          .sort((a: DictionaryColumn, b: DictionaryColumn) => {
            if (context === 'form_new') return a.form_order_new - b.form_order_new;
            if (context === 'search') return a.search_order - b.search_order;
            return a.form_order_edit - b.form_order_edit;
          });

        // Cache result for subsequent mounts (memory)
        columnsCache.set(cacheKey, visibleColumns);
        // Persist in sessionStorage to survive page reloads during this browser session
        try {
          sessionStorage.setItem(`dict::${cacheKey}`, JSON.stringify(visibleColumns));
        } catch (e) {
          // ignore quota/session errors
        }
        setColumns(visibleColumns);
      } catch (err) {
        console.error('Erro ao buscar colunas do dictionary:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchColumns();
  }, [tableName, context]);

  return { columns, loading, error };
}

/**
 * Hook alternativo que retorna apenas um array de colunas
 * Mais simples para uso direto
 */
export function useTableColumnsSimple(
  tableName: string,
  context: 'form_new' | 'form_edit' | 'search' = 'form_edit'
): DictionaryColumn[] {
  const { columns } = useTableColumns(tableName, context);
  return columns;
}

/**
 * Função auxiliar para obter ordem dos campos
 * Retorna array com nomes dos campos em ordem
 */
export function getFieldOrder(columns: DictionaryColumn[], context: 'form_new' | 'form_edit' = 'form_edit'): string[] {
  const orderField = context === 'form_new' ? 'form_order_new' : 'form_order_edit';
  return columns
    .sort((a, b) => a[orderField] - b[orderField])
    .map(col => col.column_name);
}

/**
 * Função auxiliar para obter rótulo amigável de um campo
 */
export function getFieldLabel(columns: DictionaryColumn[], fieldName: string): string {
  const column = columns.find(col => col.column_name === fieldName);
  return column?.display_label || fieldName;
}

/**
 * Função auxiliar para validar campo baseado em padrão
 */
export function validateField(
  columns: DictionaryColumn[],
  fieldName: string,
  value: any
): { valid: boolean; message?: string } {
  const column = columns.find(col => col.column_name === fieldName);
  
  if (!column) {
    return { valid: true }; // Campo não mapeado, permitir
  }

  // Validação obrigatória
  if (column.required && !value) {
    return { 
      valid: false, 
      message: `${column.display_label} é obrigatório` 
    };
  }

  // Validação de padrão (regex)
  if (column.validation_pattern && value) {
    const regex = new RegExp(column.validation_pattern);
    if (!regex.test(String(value))) {
      return { 
        valid: false, 
        message: `${column.display_label} tem formato inválido` 
      };
    }
  }

  // Validação de comprimento
  if (column.max_length && value) {
    if (String(value).length > column.max_length) {
      return { 
        valid: false, 
        message: `${column.display_label} não pode ter mais de ${column.max_length} caracteres` 
      };
    }
  }

  return { valid: true };
}













