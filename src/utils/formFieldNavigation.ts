/**
 * formFieldNavigation.ts
 * 
 * Utilitários para navegação entre campos de formulário
 * - Saltar para próximo campo com ENTER
 * - Saltar para campo anterior com SHIFT+TAB
 * - Gerenciar ordem de campos
 */

export interface FieldNavigationConfig {
  fieldName: string;
  isVisible: boolean;
  isDisabled?: boolean;
  isReadonly?: boolean;
  type: 'input' | 'select' | 'textarea' | 'checkbox' | 'radio';
}

/**
 * Obtém lista ordenada de campos navegáveis
 * @param formElement - Elemento DOM do formulário
 * @returns Array de campos na ordem de navegação
 */
export const getNavigableFields = (formElement: HTMLFormElement): HTMLInputElement[] => {
  if (!formElement) return [];

  const selector = `
    input:not([type="hidden"]):not([disabled]),
    select:not([disabled]),
    textarea:not([disabled]),
    button:not([disabled])
  `;

  return Array.from(formElement.querySelectorAll(selector)) as HTMLInputElement[];
};

/**
 * Obtém índice do campo atual
 * @param formElement - Elemento DOM do formulário
 * @param currentFieldName - Nome do campo atual
 * @returns Índice na lista de campos navegáveis, ou -1 se não encontrado
 */
export const getFieldIndex = (formElement: HTMLFormElement, currentFieldName: string): number => {
  const fields = getNavigableFields(formElement);
  return fields.findIndex(f => f.name === currentFieldName || f.id === currentFieldName);
};

/**
 * Saltar para próximo campo
 * @param formElement - Elemento DOM do formulário
 * @param currentFieldName - Nome do campo atual
 * @returns true se conseguiu pular, false se era último campo
 */
export const focusNextField = (formElement: HTMLFormElement, currentFieldName: string): boolean => {
  const fields = getNavigableFields(formElement);
  const currentIndex = getFieldIndex(formElement, currentFieldName);

  if (currentIndex === -1 || currentIndex === fields.length - 1) {
    return false; // Não encontrou ou é último campo
  }

  const nextField = fields[currentIndex + 1];
  if (nextField) {
    nextField.focus();
    // Para input/select: seleciona todo o texto
    if ((nextField as any) instanceof HTMLInputElement || (nextField as any) instanceof HTMLSelectElement) {
      (nextField as any).select?.();
    }
    return true;
  }

  return false;
};

/**
 * Saltar para campo anterior
 * @param formElement - Elemento DOM do formulário
 * @param currentFieldName - Nome do campo atual
 * @returns true se conseguiu pular, false se era primeiro campo
 */
export const focusPreviousField = (formElement: HTMLFormElement, currentFieldName: string): boolean => {
  const fields = getNavigableFields(formElement);
  const currentIndex = getFieldIndex(formElement, currentFieldName);

  if (currentIndex <= 0) {
    return false; // Não encontrou ou é primeiro campo
  }

  const previousField = fields[currentIndex - 1];
  if (previousField) {
    previousField.focus();
    // Para input/select: seleciona todo o texto
    if ((previousField as any) instanceof HTMLInputElement || (previousField as any) instanceof HTMLSelectElement) {
      (previousField as any).select?.();
    }
    return true;
  }

  return false;
};

/**
 * Verifica se é o último campo navegável
 * @param formElement - Elemento DOM do formulário
 * @param currentFieldName - Nome do campo atual
 * @returns true se é o último campo navegável
 */
export const isLastNavigableField = (formElement: HTMLFormElement, currentFieldName: string): boolean => {
  const fields = getNavigableFields(formElement);
  const currentIndex = getFieldIndex(formElement, currentFieldName);
  return currentIndex === fields.length - 1;
};

/**
 * Verifica se é o primeiro campo navegável
 * @param formElement - Elemento DOM do formulário
 * @param currentFieldName - Nome do campo atual
 * @returns true se é o primeiro campo navegável
 */
export const isFirstNavigableField = (formElement: HTMLFormElement, currentFieldName: string): boolean => {
  const currentIndex = getFieldIndex(formElement, currentFieldName);
  return currentIndex === 0;
};

/**
 * Handler padrão para ENTER em campos
 * @param e - Evento de teclado
 * @param formElement - Elemento DOM do formulário
 * @param fieldName - Nome do campo atual
 * @param onSubmit - Callback para submeter formulário (último campo)
 * @param fieldType - Tipo do campo ('input', 'textarea', 'select')
 */
export const handleEnterKey = (
  e: React.KeyboardEvent,
  formElement: HTMLFormElement,
  fieldName: string,
  onSubmit: () => void,
  fieldType: 'input' | 'textarea' | 'select' = 'input'
): void => {
  // Textarea: ENTER cria nova linha, CTRL+ENTER navega
  if (fieldType === 'textarea') {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (isLastNavigableField(formElement, fieldName)) {
        onSubmit();
      } else {
        focusNextField(formElement, fieldName);
      }
    }
    // Sem Ctrl: permite nova linha naturalmente
    return;
  }

  // Input/Select: ENTER navega
  if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
    e.preventDefault();
    if (isLastNavigableField(formElement, fieldName)) {
      onSubmit();
    } else {
      focusNextField(formElement, fieldName);
    }
  }
};

/**
 * Handler para SHIFT+TAB manual
 * @param e - Evento de teclado
 * @param formElement - Elemento DOM do formulário
 * @param fieldName - Nome do campo atual
 */
export const handleShiftTab = (
  e: React.KeyboardEvent,
  formElement: HTMLFormElement,
  fieldName: string
): void => {
  if (e.key === 'Tab' && e.shiftKey) {
    e.preventDefault();
    focusPreviousField(formElement, fieldName);
  }
};

/**
 * Obtém lista de todos os nomes de campos em ordem
 * @param formElement - Elemento DOM do formulário
 * @returns Array com names dos campos
 */
export const getFieldOrder = (formElement: HTMLFormElement): string[] => {
  const fields = getNavigableFields(formElement);
  return fields.map(f => f.name || f.id).filter(Boolean);
};

/**
 * Salta para um campo específico por nome
 * @param formElement - Elemento DOM do formulário
 * @param fieldName - Nome do campo
 * @returns true se conseguiu focar, false caso não encontre
 */
export const focusField = (formElement: HTMLFormElement, fieldName: string): boolean => {
  const field = formElement.querySelector(`[name="${fieldName}"], #${fieldName}`) as HTMLInputElement;
  if (field) {
    field.focus();
    field.select?.();
    return true;
  }
  return false;
};

const formFieldNavigation = {
  getNavigableFields,
  getFieldIndex,
  focusNextField,
  focusPreviousField,
  isLastNavigableField,
  isFirstNavigableField,
  handleEnterKey,
  handleShiftTab,
  getFieldOrder,
  focusField,
};

export default formFieldNavigation;













