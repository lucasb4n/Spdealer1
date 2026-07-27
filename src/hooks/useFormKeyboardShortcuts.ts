/**
 * Hook: useFormKeyboardShortcuts
 * Gerencia atalhos de teclado para formulários
 * 
 * Atalhos Padrão:
 * - ENTER: Próximo campo
 * - CTRL+G: Gravar/Salvar
 * - CTRL+X: Cancelar
 * - ESC: Fechar modal
 * - TAB/SHIFT+TAB: Navegação entre campos
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcutHandlers {
  onEnter?: () => void;
  onCtrlG?: () => void; // Gravar
  onCtrlX?: () => void; // Cancelar
  onEsc?: () => void;   // Fechar
  onTab?: () => void;
  onShiftTab?: () => void;
  focusNextField?: () => void;
  focusPrevField?: () => void;
}

export interface UseFormKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook para gerenciar atalhos de teclado em formulários
 */
export const useFormKeyboardShortcuts = (
  handlers: KeyboardShortcutHandlers,
  options: UseFormKeyboardShortcutsOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options;
  const shortcutHandlersRef = useRef(handlers);

  // Atualizar referência dos handlers quando mudarem
  useEffect(() => {
    shortcutHandlersRef.current = handlers;
  }, [handlers]);

  // Handler principal de teclado
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // CTRL+G: Gravar/Salvar
      if (event.ctrlKey && event.key === 'g') {
        if (preventDefault) event.preventDefault();
        shortcutHandlersRef.current.onCtrlG?.();
        return;
      }

      // CTRL+X: Cancelar
      if (event.ctrlKey && event.key === 'x') {
        if (preventDefault) event.preventDefault();
        shortcutHandlersRef.current.onCtrlX?.();
        return;
      }

      // ESC: Fechar modal
      if (event.key === 'Escape') {
        if (preventDefault) event.preventDefault();
        shortcutHandlersRef.current.onEsc?.();
        return;
      }

      // ENTER em campo de input
      if (event.key === 'Enter') {
        const target = event.target as HTMLElement;
        
        // Se estiver em textarea, permitir quebra de linha com SHIFT+ENTER
        if (
          target.tagName === 'TEXTAREA' &&
          !event.shiftKey
        ) {
          // ENTER sem SHIFT em textarea ainda pode ser customizado
          if (preventDefault) event.preventDefault();
          shortcutHandlersRef.current.focusNextField?.();
          return;
        }

        // Em inputs, ENTER vai para próximo campo
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT'
        ) {
          if (preventDefault) event.preventDefault();
          shortcutHandlersRef.current.focusNextField?.();
          return;
        }
      }

      // TAB: Próximo campo
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // SHIFT+TAB: Campo anterior
          if (preventDefault) event.preventDefault();
          shortcutHandlersRef.current.focusPrevField?.();
        } else {
          // TAB: Próximo campo (comportamento padrão, mas podemos customizar)
          shortcutHandlersRef.current.onTab?.();
        }
        return;
      }
    },
    [enabled, preventDefault]
  );

  // Configurar listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: {
      'ENTER': 'Próximo campo',
      'CTRL+G': 'Gravar/Salvar',
      'CTRL+X': 'Cancelar',
      'ESC': 'Fechar modal',
      'TAB': 'Próximo campo',
      'SHIFT+TAB': 'Campo anterior',
    },
  };
};

/**
 * Hook para gerenciar navegação entre campos com ENTER
 */
export const useFieldNavigation = () => {
  const fieldRefsMap = useRef<Map<string, HTMLInputElement>>(new Map());
  const fieldOrderRef = useRef<string[]>([]);

  const registerField = useCallback(
    (fieldId: string, element: HTMLInputElement | null) => {
      if (element) {
        fieldRefsMap.current.set(fieldId, element);
        // Manter ordem dos campos
        if (!fieldOrderRef.current.includes(fieldId)) {
          fieldOrderRef.current.push(fieldId);
        }
      } else {
        fieldRefsMap.current.delete(fieldId);
      }
    },
    []
  );

  const focusField = useCallback((fieldId: string) => {
    const element = fieldRefsMap.current.get(fieldId);
    if (element) {
      element.focus();
      element.select?.();
    }
  }, []);

  const focusNextField = useCallback((currentFieldId: string) => {
    const currentIndex = fieldOrderRef.current.indexOf(currentFieldId);
    if (currentIndex < fieldOrderRef.current.length - 1) {
      const nextFieldId = fieldOrderRef.current[currentIndex + 1];
      focusField(nextFieldId);
    }
  }, [focusField]);

  const focusPrevField = useCallback((currentFieldId: string) => {
    const currentIndex = fieldOrderRef.current.indexOf(currentFieldId);
    if (currentIndex > 0) {
      const prevFieldId = fieldOrderRef.current[currentIndex - 1];
      focusField(prevFieldId);
    }
  }, [focusField]);

  return {
    registerField,
    focusField,
    focusNextField,
    focusPrevField,
    getFieldOrder: () => fieldOrderRef.current,
    getTotalFields: () => fieldRefsMap.current.size,
  };
};

/**
 * Hook para exibir dicas de atalhos
 */
export const useKeyboardShortcutHints = (enabled: boolean = true) => {
  const shortcuts = [
    { key: 'ENTER', descricao: 'Próximo campo', contexto: 'Formulário' },
    { key: 'CTRL+G', descricao: 'Gravar/Salvar', contexto: 'Modal' },
    { key: 'CTRL+X', descricao: 'Cancelar', contexto: 'Modal' },
    { key: 'ESC', descricao: 'Fechar modal', contexto: 'Modal' },
    { key: 'TAB', descricao: 'Próximo campo', contexto: 'Formulário' },
    { key: 'SHIFT+TAB', descricao: 'Campo anterior', contexto: 'Formulário' },
  ];

  return {
    shortcuts,
    getShortcut: (key: string) => shortcuts.find(s => s.key === key),
    getAllShortcuts: () => shortcuts,
  };
};

/**
 * Hook para capturar atalhos globais de formulário
 */
export interface GlobalFormShortcutsConfig {
  onSave?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  onClose?: () => void;
  onDelete?: () => void;
}

export const useGlobalFormShortcuts = (config: GlobalFormShortcutsConfig) => {
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // CTRL+S: Salvar (alternativa ao CTRL+G)
      if (event.ctrlKey && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        await config.onSave?.();
        return;
      }

      // CTRL+G: Salvar
      if (event.ctrlKey && (event.key === 'g' || event.key === 'G')) {
        event.preventDefault();
        await config.onSave?.();
        return;
      }

      // CTRL+X: Cancelar
      if (event.ctrlKey && (event.key === 'x' || event.key === 'X')) {
        event.preventDefault();
        await config.onCancel?.();
        return;
      }

      // ESC: Fechar
      if (event.key === 'Escape') {
        config.onClose?.();
        return;
      }

      // CTRL+D: Deletar
      if (event.ctrlKey && (event.key === 'd' || event.key === 'D')) {
        event.preventDefault();
        config.onDelete?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [config]);

  return {
    registeredShortcuts: ['CTRL+S/G', 'CTRL+X', 'ESC', 'CTRL+D'],
  };
};

/**
 * Hook para debug de atalhos
 */
export const useKeyboardShortcutDebug = (enabled: boolean = false) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('[Keyboard Shortcut Debug]', {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        target: (event.target as HTMLElement).tagName,
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
};













