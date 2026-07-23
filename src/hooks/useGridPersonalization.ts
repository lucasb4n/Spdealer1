/**
 * useGridPersonalization.ts
 * 
 * Hook React para gerenciar personalização de AG Grid
 * Automaticamente salva quando o usuário faz mudanças
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  gridPersonalizationService,
} from 'services/GridPersonalizationService';
import type {
  GridPersonalizationState,
} from 'gridPersonalization';

interface UseGridPersonalizationOptions {
  userId: string;           // ID do usuário logado
  gridId: string;          // ID único do grid (ex: "dashboard_1_receber")
  enabled?: boolean;       // Se deve habilitar persistência (padrão: true)
  debounceMs?: number;     // Tempo para debounce ao salvar (padrão: 1000ms)
  onLoaded?: (state: GridPersonalizationState | null) => void; // Callback quando carrega
}

interface UseGridPersonalizationReturn {
  personalization: GridPersonalizationState | null;
  isLoading: boolean;
  isSaving: boolean;
  saveState: (gridApi: any) => Promise<void>;
  applyPersonalization: (columnDefs: any[]) => any[];
  clearPersonalization: () => Promise<void>;
}

export function useGridPersonalization(
  options: UseGridPersonalizationOptions
): UseGridPersonalizationReturn {
  const {
    userId,
    gridId,
    enabled = true,
    debounceMs = 1000,
    onLoaded,
  } = options;

  const [personalization, setPersonalization] = useState<GridPersonalizationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar personalização ao montar
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const loadPersonalization = async () => {
      setIsLoading(true);
      const state = await gridPersonalizationService.loadPersonalization(userId, gridId);
      setPersonalization(state);
      onLoaded?.(state);
      setIsLoading(false);
    };

    loadPersonalization();

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [userId, gridId, enabled, onLoaded]);

  // Salvar estado do grid com debounce
  const saveState = useCallback(
    async (gridApi: any) => {
      if (!enabled || !userId || !gridId) return;

      // Cancelar save anterior se existir
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          const state = gridPersonalizationService.extractGridState(gridApi);
          const success = await gridPersonalizationService.savePersonalization(
            userId,
            gridId,
            state
          );

          if (success) {
            setPersonalization(prev =>
              prev ? { ...prev, ...state, savedAt: new Date().toISOString() } : null
            );
          }
        } catch (error) {
          console.error('Erro ao salvar personalização:', error);
        } finally {
          setIsSaving(false);
        }
      }, debounceMs);
    },
    [userId, gridId, enabled, debounceMs]
  );

  // Aplicar personalização às colunas
  const applyPersonalizationToColumns = useCallback(
    (columnDefs: any[]) => {
      return gridPersonalizationService.applyPersonalization(columnDefs, personalization);
    },
    [personalization]
  );

  // Limpar personalização
  const clearPersonalization = useCallback(async () => {
    if (!enabled || !userId || !gridId) return;

    const success = await gridPersonalizationService.savePersonalization(
      userId,
      gridId,
      { columns: [] }
    );

    if (success) {
      setPersonalization(null);
    }
  }, [userId, gridId, enabled]);

  return {
    personalization,
    isLoading,
    isSaving,
    saveState,
    applyPersonalization: applyPersonalizationToColumns,
    clearPersonalization,
  };
}

// Re-export para facilitar imports
export default useGridPersonalization;













