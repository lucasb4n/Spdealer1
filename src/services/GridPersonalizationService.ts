/**
 * GridPersonalizationService.ts
 * 
 * Service para salvar/carregar personalização de AG Grid por usuário
 * Comunica com backend via API REST
 */

import {
  GridColumnPersonalization,
  GridPersonalizationState,
  GridPersonalizationResponse,
  GridPersonalizationChange,
} from 'gridPersonalization';

class GridPersonalizationService {
  private static readonly API_BASE = '/api/v1/user-grid-preferences';
  private cache: Map<string, GridPersonalizationState> = new Map();
  private pendingChanges: GridPersonalizationChange[] = [];

  /**
   * Carregar personalização do grid para um usuário
   * @param userId ID do usuário logado
   * @param gridId ID único do grid (ex: "dashboard_1_kpiReceber")
   * @returns Estado salvo ou null se não existir
   */
  async loadPersonalization(
    userId: string,
    gridId: string
  ): Promise<GridPersonalizationState | null> {
    try {
      const cacheKey = `${userId}:${gridId}`;
      
      // Verificar cache primeiro
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey) || null;
      }

      const response = await fetch(
        `${GridPersonalizationService.API_BASE}/${userId}/${gridId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status === 404) {
        return null; // Primeira vez que o usuário usa este grid
      }

      if (!response.ok) {
        console.warn(`Falha ao carregar personalização do grid ${gridId}:`, response.statusText);
        return null;
      }

      const data: GridPersonalizationState = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Erro ao carregar personalização do grid ${gridId}:`, error);
      return null;
    }
  }

  /**
   * Salvar personalização do grid
   * @param userId ID do usuário
   * @param gridId ID único do grid
   * @param state Estado da personalização
   */
  async savePersonalization(
    userId: string,
    gridId: string,
    state: Omit<GridPersonalizationState, 'userId' | 'gridId' | 'savedAt'>
  ): Promise<boolean> {
    try {
      const cacheKey = `${userId}:${gridId}`;
      const payload: GridPersonalizationState = {
        userId,
        gridId,
        ...state,
        savedAt: new Date().toISOString(),
      };

      const response = await fetch(
        `${GridPersonalizationService.API_BASE}/${userId}/${gridId}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        console.error(`Falha ao salvar personalização do grid ${gridId}:`, response.statusText);
        return false;
      }

      const result: GridPersonalizationResponse = await response.json();
      
      if (result.success) {
        this.cache.set(cacheKey, payload);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Erro ao salvar personalização do grid ${gridId}:`, error);
      return false;
    }
  }

  /**
   * Aplicar personalização às column definitions
   * @param columnDefs Definições originais das colunas
   * @param personalization Estado de personalização
   */
  applyPersonalization(
    columnDefs: any[],
    personalization: GridPersonalizationState | null
  ): any[] {
    if (!personalization || !personalization.columns) {
      return columnDefs;
    }

    const personalizationMap = new Map(
      personalization.columns.map(col => [col.field, col])
    );

    // Aplicar largura, visibilidade, etc.
    let updated = columnDefs.map(col => {
      const pCustom = personalizationMap.get(col.field);
      if (!pCustom) return col;

      return {
        ...col,
        width: pCustom.width ?? col.width,
        hide: pCustom.visible === false,
      };
    });

    // Reordenar colunas conforme personalização (se especificado)
    if (personalization.columns.some(c => c.position !== undefined)) {
      updated = updated.sort((a, b) => {
        const posA = personalizationMap.get(a.field)?.position ?? 999;
        const posB = personalizationMap.get(b.field)?.position ?? 999;
        return posA - posB;
      });
    }

    return updated;
  }

  /**
   * Extrair estado atual do AG Grid (após mudanças do usuário)
   * @param gridApi AG Grid API instance
   * @returns Estado para salvar
   */
  extractGridState(gridApi: any): Omit<GridPersonalizationState, 'userId' | 'gridId' | 'savedAt'> {
    if (!gridApi) {
      return { columns: [] };
    }

    try {
      const columnDefs = gridApi.getColumnDefs?.() || [];
      const sortModel = gridApi.getSortModel?.() || [];

      const columns: GridColumnPersonalization[] = columnDefs.map((col: any, index: number) => ({
        field: col.field || col.colId,
        width: col.width,
        position: index,
        visible: !col.hide,
        sortIndex: sortModel.findIndex((s: any) => s.colId === col.field),
        sortDir: sortModel.find((s: any) => s.colId === col.field)?.sort as 'asc' | 'desc' | undefined,
      }));

      return {
        columns,
        defaultSortModel: sortModel,
        rowHeight: gridApi.getRowHeight?.(),
      };
    } catch (error) {
      console.error('Erro ao extrair estado do grid:', error);
      return { columns: [] };
    }
  }

  /**
   * Registrar mudança para auditoria
   * @param change Mudança que ocorreu
   */
  recordChange(change: Omit<GridPersonalizationChange, 'changedAt'>): void {
    this.pendingChanges.push({
      ...change,
      changedAt: new Date().toISOString(),
    });

    // Limitar histórico em memória
    if (this.pendingChanges.length > 100) {
      this.pendingChanges.shift();
    }
  }

  /**
   * Obter histórico de mudanças
   */
  getChangeHistory(): GridPersonalizationChange[] {
    return [...this.pendingChanges];
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const gridPersonalizationService = new GridPersonalizationService();

export default GridPersonalizationService;













