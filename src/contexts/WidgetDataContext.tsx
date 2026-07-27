import React, { createContext, useContext, ReactNode, useMemo } from 'react';

/**
 * WidgetDataContext
 *
 * Contexto para fornecer dados pré-carregados dos widgets em toda a árvore de componentes.
 * Permite que widgets individuais (KpiWidget, ChartWidget, etc) acessem seus dados
 * sem precisar receber como props.
 *
 * Uso:
 * <WidgetDataProvider data={widgetDataRef.current}>
 *   <YourComponent />
 * </WidgetDataProvider>
 *
 * Inside component:
 * const widgetData = useWidgetData();
 * const data = widgetData.get(widgetId);
 */

export interface WidgetDataContextType {
  /**
   * Recuperar dados de um widget pelo ID
   * @param widgetId ID do widget (pode ser número ou string)
   * @returns Dados do widget ou undefined
   */
  get: (widgetId: string | number | undefined) => any;

  /**
   * Acessar todos os dados de uma vez (para debug)
   */
  getAll: () => Record<string, any>;
}

const WidgetDataContext = createContext<WidgetDataContextType | undefined>(undefined);

export interface WidgetDataProviderProps {
  data?: Record<string, any> | null;
  children: ReactNode;
}

/**
 * Provider do contexto de dados de widgets
 */
export const WidgetDataProvider: React.FC<WidgetDataProviderProps> = ({
  data = {},
  children,
}) => {
  // Forçar re-render sempre que data mudar
  // O useMemo é importante para que o contexto se atualize quando dados chegam
  const contextValue: WidgetDataContextType = useMemo(() => {
    // eslint-disable-next-line no-console
    console.log('[WidgetDataProvider] Context atualizado. Chaves disponíveis:', Object.keys(data || {}), 'Data:', data);
    return {
      get: (widgetId: string | number | undefined) => {
        if (widgetId === undefined || widgetId === null) {
          // eslint-disable-next-line no-console
          console.warn('[WidgetDataContext.get] ⚠️ widgetId é undefined/null');
          return undefined;
        }
        // Tenta buscar por ID direto (numérico ou string)
        let result = data?.[widgetId];
        if (result !== undefined) {
          // eslint-disable-next-line no-console
          console.log(`[WidgetDataContext.get] ✅ widgetId=${widgetId} encontrado por ${typeof widgetId} key direct`);
          return result;
        }

        // Se não encontrou, tenta com string
        const strKey = String(widgetId);
        result = data?.[strKey];
        if (result !== undefined) {
          // eslint-disable-next-line no-console
          console.log(`[WidgetDataContext.get] ✅ widgetId=${widgetId} encontrado por string key "${strKey}"`);
          return result;
        }

        // eslint-disable-next-line no-console
        console.warn(`[WidgetDataContext.get] ❌ widgetId=${widgetId} NÃO encontrado. Chaves disponíveis:`, Object.keys(data || {}));
      },
      getAll: () => data || {},
    };
  }, [data]); // Re-calcular SEMPRE que data muda

  return (
    <WidgetDataContext.Provider value={contextValue}>
      {children}
    </WidgetDataContext.Provider>
  );
};

/**
 * Hook para acessar dados dos widgets
 */
export const useWidgetData = (): WidgetDataContextType => {
  const context = useContext(WidgetDataContext);
  if (!context) {
    return {
      get: () => undefined,
      getAll: () => ({}),
    };
  }
  return context;
};

export default WidgetDataContext;













