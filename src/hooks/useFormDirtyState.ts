import { useState, useEffect, useRef } from 'react';

/**
 * Hook para detectar mudanças em formulários (dirty state)
 * Compara os valores atuais com os valores iniciais
 */
export const useFormDirtyState = <T extends Record<string, any>>(
  initialValues: T,
  currentValues: T,
  excludeFields: (keyof T)[] = []
) => {
  const [isDirty, setIsDirty] = useState(false);
  const initialValuesRef = useRef<T>(initialValues);

  // Atualiza valores iniciais quando necessário (ex: ao carregar dados do servidor)
  const updateInitialValues = (newInitialValues: T) => {
    initialValuesRef.current = newInitialValues;
    setIsDirty(false);
  };

  // Função para comparar valores (deep comparison)
  const compareValues = (initial: any, current: any): boolean => {
    // Se ambos são null/undefined, são iguais
    if (initial === current) return true;
    
    // Se apenas um é null/undefined, são diferentes
    if (initial == null || current == null) return false;
    
    // Se são tipos diferentes, são diferentes
    if (typeof initial !== typeof current) return false;
    
    // Se são objetos/arrays, compara recursivamente
    if (typeof initial === 'object') {
      const initialKeys = Object.keys(initial);
      const currentKeys = Object.keys(current);
      
      if (initialKeys.length !== currentKeys.length) return false;
      
      return initialKeys.every(key => 
        currentKeys.includes(key) && compareValues(initial[key], current[key])
      );
    }
    
    // Para tipos primitivos, compara diretamente
    return initial === current;
  };

  useEffect(() => {
    const checkForChanges = () => {
      const hasChanges = Object.keys(currentValues).some(key => {
        // Pula campos excluídos da comparação
        if (excludeFields.includes(key as keyof T)) {
          return false;
        }
        
        const initialValue = initialValuesRef.current[key as keyof T];
        const currentValue = currentValues[key as keyof T];
        
        return !compareValues(initialValue, currentValue);
      });
      
      setIsDirty(hasChanges);
    };

    checkForChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValues, excludeFields]);

  return {
    isDirty,
    updateInitialValues,
    resetDirtyState: () => setIsDirty(false)
  };
};

/**
 * Hook simplificado para detectar mudanças em strings/números
 */
export const useSimpleFormDirtyState = (
  initialValue: string | number,
  currentValue: string | number
) => {
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(initialValue !== currentValue);
  }, [initialValue, currentValue]);

  return isDirty;
};













