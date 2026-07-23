/**
 * src/services/QueryBuilderService.ts
 * 
 * Service para Query Builder - chamadas à API backend
 * Responsável por buscar tabelas, validar queries, gerar SQL, etc.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  DatabaseTable,
  DatabaseColumn,
  TableRelation,
  QueryBuilderConfig,
  DashboardQuery,
  QueryValidationResult,
  QueryPreviewResult,
  QueryGenerationResult,
  CreateQueryRequest,
  UpdateQueryRequest,
  ApiResponse,
  ListResponse,
} from 'queryBuilder';

import { API_BASE_URL } from './apiConfig';

const API_BASE = (API_BASE_URL || '').replace(/\/$/, '');
const QB_ENDPOINT = `${API_BASE}/api/v2/query-builder`;
const QUERIES_ENDPOINT = `${API_BASE}/api/v1/dashboard-queries`;

// ============================================================================
// QUERY BUILDER SERVICE
// ============================================================================

export class QueryBuilderService {
  /**
   * Buscar todas as tabelas disponíveis com suas colunas
   */
  static async getTables(): Promise<DatabaseTable[]> {
    try {
      const response = await fetch(`${QB_ENDPOINT}/tables`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar tabelas: ${response.statusText}`);
      }

      const data: ApiResponse<DatabaseTable[]> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Erro desconhecido ao buscar tabelas');
      }

      return data.data;
    } catch (err: any) {
      console.error('QueryBuilderService.getTables error:', err);
      throw err;
    }
  }

  /**
   * Buscar relações entre tabelas (Foreign Keys)
   */
  static async getRelations(): Promise<TableRelation[]> {
    try {
      const response = await fetch(`${QB_ENDPOINT}/relations`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar relações: ${response.statusText}`);
      }

      const data: ApiResponse<TableRelation[]> = await response.json();
      if (!data.success || !data.data) {
        return [];  // Retorna vazio se nenhuma relação encontrada
      }

      return data.data;
    } catch (err: any) {
      console.error('QueryBuilderService.getRelations error:', err);
      throw err;
    }
  }

  /**
   * Validar configuração do query builder
   */
  static async validateConfig(config: QueryBuilderConfig): Promise<QueryValidationResult> {
    try {
      const response = await fetch(`${QB_ENDPOINT}/validate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao validar query: ${response.statusText}`);
      }

      const data: ApiResponse<QueryValidationResult> = await response.json();
      return data.data || { valid: false, error: 'Erro desconhecido' };
    } catch (err: any) {
      console.error('QueryBuilderService.validateConfig error:', err);
      return {
        valid: false,
        error: err?.message || 'Erro ao validar configuração',
      };
    }
  }

  /**
   * Gerar SQL a partir da configuração
   */
  static async generateSQL(config: QueryBuilderConfig): Promise<string> {
    try {
      const response = await fetch(`${QB_ENDPOINT}/generate-sql`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar SQL: ${response.statusText}`);
      }

      const data: ApiResponse<QueryGenerationResult> = await response.json();
      if (!data.success || !data.data?.sql) {
        throw new Error(data.error || 'Erro ao gerar SQL');
      }

      return data.data.sql;
    } catch (err: any) {
      console.error('QueryBuilderService.generateSQL error:', err);
      throw err;
    }
  }

  /**
   * Pré-visualizar query (executar com LIMIT)
   */
  static async previewQuery(config: QueryBuilderConfig): Promise<QueryPreviewResult> {
    try {
      const response = await fetch(`${QB_ENDPOINT}/preview`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar preview: ${response.statusText}`);
      }

      const data: ApiResponse<QueryPreviewResult> = await response.json();
      if (!data.success || !data.data) {
        return {
          sql: '',
          rows: [],
          columns: [],
          rowCount: 0,
          error: data.error || 'Erro ao gerar preview',
        };
      }

      return data.data;
    } catch (err: any) {
      console.error('QueryBuilderService.previewQuery error:', err);
      return {
        sql: '',
        rows: [],
        columns: [],
        rowCount: 0,
        error: err?.message || 'Erro ao executar preview',
      };
    }
  }

  /**
   * Executar query customizada (SQL puro)
   */
  static async executeCustomQuery(sql: string, limit = 10): Promise<QueryPreviewResult> {
    try {
      const response = await fetch(`${QB_ENDPOINT}/execute`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, limit }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao executar query: ${response.statusText}`);
      }

      const data: ApiResponse<QueryPreviewResult> = await response.json();
      return data.data || {
        sql,
        rows: [],
        columns: [],
        rowCount: 0,
        error: 'Erro ao executar query',
      };
    } catch (err: any) {
      console.error('QueryBuilderService.executeCustomQuery error:', err);
      return {
        sql,
        rows: [],
        columns: [],
        rowCount: 0,
        error: err?.message || 'Erro ao executar query',
      };
    }
  }
}

// ============================================================================
// DASHBOARD QUERIES SERVICE
// ============================================================================

export class DashboardQueryService {
  /**
   * Listar todas as queries de dashboard
   */
  static async listQueries(page = 1, pageSize = 50): Promise<ListResponse<DashboardQuery>> {
    try {
      const response = await fetch(
        `${QUERIES_ENDPOINT}?page=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao listar queries: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      console.error('DashboardQueryService.listQueries error:', err);
      throw err;
    }
  }

  /**
   * Buscar uma query específica
   */
  static async getQuery(id: number): Promise<DashboardQuery> {
    try {
      const response = await fetch(`${QUERIES_ENDPOINT}/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar query: ${response.statusText}`);
      }

      const data: ApiResponse<DashboardQuery> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Query não encontrada');
      }

      return data.data;
    } catch (err: any) {
      console.error('DashboardQueryService.getQuery error:', err);
      throw err;
    }
  }

  /**
   * Criar nova query
   */
  static async createQuery(request: CreateQueryRequest): Promise<DashboardQuery> {
    try {
      const response = await fetch(QUERIES_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro ao criar query: ${errText}`);
      }

      const data: ApiResponse<DashboardQuery> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Erro ao criar query');
      }

      return data.data;
    } catch (err: any) {
      console.error('DashboardQueryService.createQuery error:', err);
      throw err;
    }
  }

  /**
   * Atualizar query existente
   */
  static async updateQuery(id: number, request: UpdateQueryRequest): Promise<DashboardQuery> {
    try {
      const response = await fetch(`${QUERIES_ENDPOINT}/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro ao atualizar query: ${errText}`);
      }

      const data: ApiResponse<DashboardQuery> = await response.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Erro ao atualizar query');
      }

      return data.data;
    } catch (err: any) {
      console.error('DashboardQueryService.updateQuery error:', err);
      throw err;
    }
  }

  /**
   * Deletar query
   */
  static async deleteQuery(id: number): Promise<void> {
    try {
      const response = await fetch(`${QUERIES_ENDPOINT}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar query: ${response.statusText}`);
      }
    } catch (err: any) {
      console.error('DashboardQueryService.deleteQuery error:', err);
      throw err;
    }
  }

  /**
   * Buscar queries por nome (search)
   */
  static async searchQueries(searchTerm: string): Promise<DashboardQuery[]> {
    try {
      const response = await fetch(`${QUERIES_ENDPOINT}/search?q=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return [];
      }

      const data: ApiResponse<DashboardQuery[]> = await response.json();
      return data.data || [];
    } catch (err: any) {
      console.error('DashboardQueryService.searchQueries error:', err);
      return [];
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const QueryBuilderServices = {
  QueryBuilder: QueryBuilderService,
  DashboardQuery: DashboardQueryService,
};

export default QueryBuilderServices;













