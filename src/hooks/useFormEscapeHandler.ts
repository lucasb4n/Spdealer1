import { useEffect, useCallback } from 'react';

interface UseFormEscapeHandlerProps {
  onEscape: () => void;
  hasUnsavedChanges: boolean;
  showConfirmDialog: () => Promise<boolean>;
  isEnabled?: boolean;
}

/**
 * Hook customizado para lidar com a tecla ESC em formulários
 * Valida se existem mudanças não salvas antes de fechar
 */
export const useFormEscapeHandler = ({
  onEscape,
  hasUnsavedChanges,
  showConfirmDialog,
  isEnabled = true
}: UseFormEscapeHandlerProps) => {
  
  const handleEscapeKey = useCallback(async (event: KeyboardEvent) => {
    // Apenas processa se estiver habilitado e for a tecla ESC
    if (!isEnabled || event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      // Se não há mudanças não salvas, fecha imediatamente
      if (!hasUnsavedChanges) {
        onEscape();
        return;
      }

      // Se há mudanças não salvas, solicita confirmação
      const shouldClose = await showConfirmDialog();
      if (shouldClose) {
        onEscape();
      }
    } catch (error) {
      console.error('Erro ao processar ESC:', error);
      // Em caso de erro, fecha sem confirmação para não travar o usuário
      onEscape();
    }
  }, [isEnabled, hasUnsavedChanges, onEscape, showConfirmDialog]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    // Adiciona o listener para a tecla ESC
    document.addEventListener('keydown', handleEscapeKey, true);

    // Cleanup: remove o listener quando o componente for desmontado
    return () => {
      document.removeEventListener('keydown', handleEscapeKey, true);
    };
  }, [handleEscapeKey, isEnabled]);

  return {
    // Permite desabilitar/habilitar o handler dinamicamente
    setEnabled: (enabled: boolean) => isEnabled && enabled
  };
};













