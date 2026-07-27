/**
 * DictionaryFormService.ts
 * 
 * Serviço para orquestrar FormConfig a partir de dictionary_tables e dictionary_columns
 * Integra QueryBuilder com padrão CRUD genérico
 * 
 * Uso:
 * const formConfig = await DictionaryFormService.getFormConfig('masfab');
 */

import axios from 'axios';

// Tipos
export interface DictionaryColumn {
  id: number;
  table_name: string;
  column_name: string;
  data_type: string;
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
}

export interface FormFieldDef {
  // canonical (new) names expected by DynamicForm components
  field: string; // exemplo: column_name
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'lookup' | 'textarea' | 'boolean';
  label: string;
  required?: boolean;
  validation_pattern?: string;
  options?: Array<{ value: string | number; label: string }> | string[];
  lookup_table?: string;
  lookup_display_field?: string;
  lookup_value_field?: string;
  placeholder?: string;
  min_value?: number;
  max_value?: number;
  max_length?: number;
  form_visible_add?: boolean;
  form_visible_edit?: boolean;
  form_order?: number;
  description?: string;

  // backward-compatible aliases (used by older code / recently added components)
  field_key?: string;
  field_type?: 'text' | 'email' | 'number' | 'date' | 'select' | 'lookup' | 'textarea' | 'boolean';
  field_name?: string;
  form_label?: string;
}

export interface GridColumnDef {
  field: string;
  headerName: string;
  width?: number;
  sortable?: boolean;
  filter?: boolean;
  type?: string;
}

export interface FormConfig {
  tableName: string;
  tableLabel: string;
  apiEndpoint: string;
  gridColumns: GridColumnDef[];
  formFields: FormFieldDef[];
  primaryKeyField: string;
  filterFields?: string[];
  description?: string;
}

/**
 * Mapeamento de tipos de dados do banco para tipos de formulário
 */
const DATA_TYPE_TO_FIELD_TYPE: Record<string, FormFieldDef['field_type']> = {
  'char': 'text',
  'varchar': 'text',
  'text': 'textarea',
  'int': 'number',
  'decimal': 'number',
  'float': 'number',
  'date': 'date',
  'datetime': 'date',
  'timestamp': 'date',
  'boolean': 'boolean',
  'tinyint': 'boolean',
};

/**
 * Serviço Dictionary-Driven para orquestração de formulários
 */
export class DictionaryFormService {
  private static readonly API_BASE = '/api/v1/dictionary';

  /**
   * Constrói FormConfig completo a partir do dictionary
   * 
   * @param tableName Ex: "masfab", "clientes", "fornecedores"
   * @returns FormConfig orquestrado com grid + form
   */
  static async getFormConfig(tableName: string): Promise<FormConfig> {
    try {
      // 1. Buscar metadados da tabela
      const tableMetadata = await this.getTableMetadata(tableName);
      
      // 2. Buscar todas as colunas
      const allColumns = await this.getTableColumns(tableName);
      
      // 3. Separar colunas: Grid vs Form
      const gridColumns = allColumns
        .filter(col => col.search_visible === true && !col.is_primary_key)
        .map(col => this.mapToGridColumn(col));
      
      const formFields = allColumns
        .filter(col => col.form_visible === true && !col.is_primary_key)
        .map(col => this.mapToFormField(col))
        .sort((a, b) => (a.form_order || 999) - (b.form_order || 999));
      
      // 4. Identificar chave primária
      const primaryKeyField = allColumns.find(col => col.is_primary_key)?.column_name || 'id';
      
      // 5. Campos para filtro/busca
      const filterFields = allColumns
        .filter(col => col.search_visible === true)
        .map(col => col.column_name);
      
      // 6. Retorna configuração completa
      return {
        tableName,
        tableLabel: tableMetadata.display_name || tableName,
        apiEndpoint: `/api/${tableName}`,
        gridColumns,
        formFields,
        primaryKeyField,
        filterFields,
        description: tableMetadata.description,
      };
    } catch (error) {
      console.error(`[DictionaryFormService] Erro ao carregar FormConfig para ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Busca metadados da tabela no dictionary
   */
  private static async getTableMetadata(tableName: string) {
    try {
      const response = await axios.get(
        `${this.API_BASE}/tables/${tableName}`
      );
      return response.data;
    } catch (error) {
      console.error(`[DictionaryFormService] Erro ao buscar metadados de ${tableName}:`, error);
      // Retornar defaults se falhar
      return {
        table_name: tableName,
        display_name: tableName,
        description: null,
      };
    }
  }

  /**
   * Busca todas as colunas da tabela no dictionary
   */
  private static async getTableColumns(tableName: string): Promise<DictionaryColumn[]> {
    try {
      const response = await axios.get(
        `${this.API_BASE}/tables/${tableName}/columns`
      );
      return response.data || [];
    } catch (error) {
      console.error(`[DictionaryFormService] Erro ao buscar colunas de ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Mapeia DictionaryColumn para GridColumnDef
   */
  private static mapToGridColumn(col: DictionaryColumn): GridColumnDef {
    return {
      field: col.column_name,
      headerName: col.alias || col.column_name,
      width: this.estimateColumnWidth(col.data_type, col.character_maximum_length),
      sortable: true,
      filter: true,
      type: this.mapDataTypeToGridType(col.data_type),
    };
  }

  /**
   * Mapeia DictionaryColumn para FormFieldDef
   */
  private static mapToFormField(col: DictionaryColumn): FormFieldDef {
    const fieldType = this.mapDataTypeToFieldType(col.data_type);
    
    // Map DB metadata into the canonical shape expected by form components
    const mapped: FormFieldDef = {
      field: col.column_name,
      type: fieldType,
      label: col.alias || col.column_name,
      required: !col.is_nullable,
      validation_pattern: this.getValidationPattern(col.data_type),
      description: col.description,
      form_visible_add: col.form_visible,
      form_visible_edit: col.form_visible,
      // length / numeric constraints
      max_length: col.character_maximum_length || undefined,
    };

    // Add numeric precision/scale -> min/max hints if available
    if (col.numeric_precision) {
      // conservative defaults: not strict validation, just hints
      mapped.max_value = Number.MAX_SAFE_INTEGER;
    }

    // Provide backward-compatible aliases for code that still expects old names
    (mapped as any).field_key = mapped.field;
    (mapped as any).field_type = mapped.type;
    (mapped as any).field_name = mapped.field;
    (mapped as any).form_label = mapped.label;

    return mapped;
  }

  /**
   * Mapeia tipo de dado para tipo de campo de formulário
   */
  private static mapDataTypeToFieldType(dataType: string): FormFieldDef['type'] {
    const type = dataType.toLowerCase().split('(')[0]; // Remove parâmetros (ex: varchar(255) → varchar)
    return DATA_TYPE_TO_FIELD_TYPE[type] || 'text';
  }

  /**
   * Mapeia tipo de dado para tipo de coluna AG-Grid
   */
  private static mapDataTypeToGridType(dataType: string): string {
    const type = dataType.toLowerCase().split('(')[0];
    const typeMap: Record<string, string> = {
      'int': 'numericColumn',
      'decimal': 'numericColumn',
      'float': 'numericColumn',
      'date': 'dateColumn',
      'datetime': 'dateColumn',
      'timestamp': 'dateColumn',
      'boolean': 'booleanColumn',
      'tinyint': 'booleanColumn',
    };
    return typeMap[type] || 'text';
  }

  /**
   * Estima largura de coluna baseado no tipo e tamanho
   */
  private static estimateColumnWidth(dataType: string, maxLength?: number): number {
    if (dataType.toLowerCase().includes('date')) return 120;
    if (dataType.toLowerCase().includes('decimal')) return 100;
    if (dataType.toLowerCase().includes('int')) return 80;
    
    if (maxLength) {
      // Estimativa baseada em caracteres (aprox 8px por char)
      return Math.min(Math.max(maxLength * 8, 100), 400);
    }
    
    return 150;
  }

  /**
   * Gera padrão de validação baseado no tipo de dado
   */
  private static getValidationPattern(dataType: string): string | undefined {
    const type = dataType.toLowerCase().split('(')[0];
    
    const patterns: Record<string, string> = {
      'int': '^[0-9]+$',
      'decimal': '^[0-9]+(\\.[0-9]{1,2})?$',
      'date': '^\\d{4}-\\d{2}-\\d{2}$',
      'email': '^[\\w.-]+@[\\w.-]+\\.\\w{2,}$',
    };
    
    return patterns[type];
  }

  /**
   * Busca dados de uma tabela (para popular grid)
   */
  static async getTableData(tableName: string, params?: Record<string, any>) {
    try {
      const response = await axios.get(
        `/api/${tableName}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error(`[DictionaryFormService] Erro ao buscar dados de ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Cria um novo registro
   */
  static async createRecord(tableName: string, data: Record<string, any>) {
    try {
      const response = await axios.post(
        `/api/${tableName}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`[DictionaryFormService] Erro ao criar registro em ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza um registro existente
   */
  static async updateRecord(tableName: string, primaryKey: string, id: any, data: Record<string, any>) {
    try {
      const response = await axios.put(
        `/api/${tableName}/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`[DictionaryFormService] Erro ao atualizar registro em ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Deleta um registro
   */
  static async deleteRecord(tableName: string, id: any) {
    try {
      await axios.delete(`/api/${tableName}/${id}`);
    } catch (error) {
      console.error(`[DictionaryFormService] Erro ao deletar registro de ${tableName}:`, error);
      throw error;
    }
  }
}

export default DictionaryFormService;













