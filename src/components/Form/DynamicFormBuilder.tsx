/**
 * DynamicFormBuilder.tsx
 * 
 * Componente genérico que renderiza formulários dinamicamente
 * baseado em FormFieldDef do DictionaryFormService
 * 
 * Usa componentes SoftForm: Input, Select, LookupInput, Switch, Textarea, Button
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { FormFieldDef } from 'services/DictionaryFormService';

// Importar componentes SoftForm
import { Input, Textarea } from '../Input/Input';
import { Select } from '../Select/Select';
import { LookupInput } from '../LookupInput/LookupInput';
import { Switch } from '../Switch/Switch';
// FormCard import removed — not used in this component

// ============================================================
// Styled Components
// ============================================================

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`;

const FormFieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-dark, #2c3e50);
  
  .required {
    color: var(--color-danger, #dc3545);
    margin-left: 4px;
  }
`;

const FieldDescription = styled.small`
  font-size: 0.75rem;
  color: var(--text-color-muted, #6c757d);
  font-style: italic;
`;

const ErrorMessage = styled.div`
  color: var(--color-danger, #dc3545);
  font-size: 0.875rem;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 3px solid var(--color-danger, #dc3545);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #e9ecef);
`;

// ============================================================
// Tipos
// ============================================================

export interface FormData {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string;
}

export interface DynamicFormBuilderProps {
  /**
   * Campos do formulário (do DictionaryFormService)
   */
  fields: FormFieldDef[];
  
  /**
   * Dados iniciais do formulário
   */
  initialData?: FormData;
  
  /**
   * Callback quando usuário clica em Gravar
   */
  onSubmit: (data: FormData) => Promise<void>;
  
  /**
   * Callback quando usuário clica em Cancelar
   */
  onCancel?: () => void;
  
  /**
   * Mostrar botões de ação
   */
  showButtons?: boolean;
  
  /**
   * Rótulo do botão de gravar
   */
  submitLabel?: string;
  
  /**
   * Rótulo do botão de cancelar
   */
  cancelLabel?: string;
  
  /**
   * Função para validar campo individual
   */
  validateField?: (field: FormFieldDef, value: any) => string | null;
}

// Helper: garante que um valor seja convertido para string segura para renderização
function safeRenderText(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  // HTMLElement (ex: algum código acidental criou um node)
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
    return value.textContent || value.innerText || value.outerHTML || String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Valida um valor contra o padrão de validação do campo
 */
function validateFieldValue(field: FormFieldDef, value: any): string | null {
  // Validação: obrigatório
  if (field.required && (!value || value === '')) {
    return `${field.label} é obrigatório`;
  }

  // Validação: padrão (regex)
  if (value && field.validation_pattern) {
    try {
      const regex = new RegExp(field.validation_pattern);
      if (!regex.test(value.toString())) {
        return `${field.label} possui formato inválido`;
      }
    } catch (e) {
      console.error(`Erro ao validar padrão de ${field.field_key}:`, e);
    }
  }

  return null;
}

/**
 * Renderiza um campo do formulário baseado em seu tipo
 */
function renderFormField(
  field: FormFieldDef,
  value: any,
  error: string | null,
  onChange: (value: any) => void,
  onBlur?: () => void
): React.ReactElement {
  const baseProps = {
    label: field.label,
    value,
    onBlur,
    required: field.required,
  };

  switch (field.field_type) {
    case 'text':
    case 'email':
      return (
        <Input
          label={field.label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={onBlur}
          required={field.required}
          type={field.field_type}
          placeholder={field.label}
        />
      );

    case 'number':
      return (
        <Input
          label={field.label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={onBlur}
          required={field.required}
          type="number"
          placeholder={field.label}
        />
      );

    case 'date':
      return (
        <Input
          label={field.label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onBlur={onBlur}
          required={field.required}
          type="date"
        />
      );

    case 'select':
      return (
        <Select
          label={field.label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          required={field.required}
          options={(field.options || []).map(opt => {
            if (typeof opt === 'object' && opt !== null && 'value' in opt) {
              return { value: (opt as any).value, label: (opt as any).label || String((opt as any).value) };
            }
            return { value: opt as string | number, label: String(opt) };
          })}
        />
      );

    case 'lookup':
      return (
        <LookupInput
          label={field.label}
          value={value}
          onValueChange={(v: string) => onChange(v)}
          onSelect={() => {}}
          onClear={() => onChange('')}
          modalTitle={`Selecionar ${field.label}`}
          lookupData={[]}
          lookupColumns={[]}
        />
      );

    case 'textarea':
      return (
        <Textarea
          label={field.label}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          onBlur={onBlur}
          required={field.required}
          placeholder={field.label}
        />
      );

    case 'boolean':
      return (
        <Switch
          label={field.label}
          checked={Boolean(value)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        />
      );

    default:
      return (
        <Input
          {...baseProps}
          type="text"
          placeholder={field.label}
        />
      );
  }
}

/**
 * Componente DynamicFormBuilder
 * 
 * Renderiza formulário completo com campos dinâmicos
 * Todos os campos vêm do dictionary (100% genérico)
 */
export const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  fields,
  initialData = {},
  onSubmit,
  onCancel,
  showButtons = true,
  submitLabel = 'Gravar',
  cancelLabel = 'Cancelar',
  validateField = validateFieldValue,
}) => {
  // Estados
  const [formData, setFormData] = useState<FormData>(initialData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Handlers
  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value,
    }));

    // Validar quando o usuário digita (se campo foi tocado)
    if (touched.has(fieldKey)) {
      const field = fields.find(f => f.field_key === fieldKey);
      if (field) {
        const error = validateField(field, value);
        setFormErrors(prev => {
          if (error) {
            return { ...prev, [fieldKey]: error };
          } else {
            const { [fieldKey]: _, ...rest } = prev;
            return rest;
          }
        });
      }
    }
  }, [fields, validateField, touched]);

  const handleFieldBlur = useCallback((fieldKey: string) => {
    // Marcar campo como tocado
    setTouched(prev => new Set([...prev, fieldKey]));

    // Validar
    const field = fields.find(f => f.field_key === fieldKey);
    if (field) {
      const error = validateField(field, formData[fieldKey]);
      setFormErrors(prev => {
        if (error) {
          return { ...prev, [fieldKey]: error };
        } else {
          const { [fieldKey]: _, ...rest } = prev;
          return rest;
        }
      });
    }
  }, [fields, formData, validateField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos os campos
    const newErrors: FormErrors = {};
    fields.forEach(field => {
      if (!field.field_key) return;
      const error = validateField(field, formData[field.field_key]);
      if (error) {
        newErrors[field.field_key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setTouched(new Set(fields.map(f => f.field_key).filter(key => !!key) as string[]));
      return;
    }

    // Submit
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao gravar formulário:', error);
      // Mostrar erro ao usuário
      alert('Erro ao gravar: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Render
  return (
    <form onSubmit={handleSubmit}>
      <FormContainer>
        {fields.map(field => {
          if (!field.field_key) return null;
          return (
            <FormFieldWrapper key={field.field_key}>
            {field.field_type !== 'boolean' && (
              <FieldLabel>
                {safeRenderText(field.label)}
                {field.required && <span className="required">*</span>}
              </FieldLabel>
            )}

            {renderFormField(
              field,
              formData[field.field_key] ?? '',
              formErrors[field.field_key] ?? null,
              (value) => handleFieldChange(field.field_key as string, value),
              () => handleFieldBlur(field.field_key as string)
            )}

            {field.description && (
              <FieldDescription>{safeRenderText(field.description)}</FieldDescription>
            )}

            {formErrors[field.field_key] && (
              <ErrorMessage>{formErrors[field.field_key]}</ErrorMessage>
            )}
            </FormFieldWrapper>
          );
        })}
      </FormContainer>

      {showButtons && (
        <ButtonGroup>
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="btn btn-secondary"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Gravando...' : submitLabel}
          </button>
        </ButtonGroup>
      )}
    </form>
  );
};

export default DynamicFormBuilder;













