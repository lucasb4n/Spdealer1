/**
 * src/components/Forms/DynamicField.tsx
 * Campo Individual Dinâmico com Suporte a Múltiplos Tipos
 * SPDealer - 25 de Outubro de 2025
 */

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { FormField } from 'forms';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

// NOTE
// - Este componente é o "campo individual" usado pelo FormBuildEditor / FormRenderer.
// - Mapeamentos importantes:
//    * `field.nome`  -> corresponde a `form_fields.name` no banco (identificador técnico, SEM ACENTOS)
//    * `field.visual_config` -> opções visuais (placeholder, largura, máscara) persistidas em `form_definitions`
//    * `field.validations` -> regras aplicadas aqui (required, maxLength, patterns)
// - O componente não faz persistência: ele emite `onChange(field.nome, value)` que o form wrapper encaminha
//   para atualizar estado e, quando o usuário salvar, o serviço persiste em `forms` / `form_fields`.

// Props para DynamicField
export interface DynamicFieldProps {
  field: FormField;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
}

// ============================================================================
// Styled Components
// ============================================================================

const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
`;

const BaseInput = styled.input<{ $hasError?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${(p) => (p.$hasError ? '#dc3545' : 'var(--border-color, #e9ecef)')};
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(p) => (p.$hasError ? '#dc3545' : 'var(--primary-color, #007bff)')};
    box-shadow: 0 0 0 3px ${(p) =>
      p.$hasError ? 'rgba(220,53,69,0.1)' : 'rgba(0,123,255,0.1)'};
  }

  &:disabled {
    background: var(--background-light, #f8f9fa);
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: #999;
  }
`;

const BaseSelect = styled.select<{ $hasError?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${(p) => (p.$hasError ? '#dc3545' : 'var(--border-color, #e9ecef)')};
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(p) => (p.$hasError ? '#dc3545' : 'var(--primary-color, #007bff)')};
    box-shadow: 0 0 0 3px ${(p) =>
      p.$hasError ? 'rgba(220,53,69,0.1)' : 'rgba(0,123,255,0.1)'};
  }

  &:disabled {
    background: var(--background-light, #f8f9fa);
    cursor: not-allowed;
    opacity: 0.6;
  }

  option {
    padding: 8px;
  }
`;

const BaseTextarea = styled.textarea<{ $hasError?: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${(p) => (p.$hasError ? '#dc3545' : 'var(--border-color, #e9ecef)')};
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
  background: white;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(p) => (p.$hasError ? '#dc3545' : 'var(--primary-color, #007bff)')};
    box-shadow: 0 0 0 3px ${(p) =>
      p.$hasError ? 'rgba(220,53,69,0.1)' : 'rgba(0,123,255,0.1)'};
  }

  &:disabled {
    background: var(--background-light, #f8f9fa);
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: #999;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const ErrorIcon = styled.span`
  position: absolute;
  right: 12px;
  color: #dc3545;
  opacity: 0.8;
  pointer-events: none;
`;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Aplica máscara de entrada no campo
 */
const applyMask = (value: string, mask: string): string => {
  if (!mask) return value;

  const valueDigits = value.replace(/\D/g, '');

  if (mask === 'phone') {
    // (XX) XXXXX-XXXX
    return valueDigits
      .slice(0, 11)
      .replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (_, p1, p2, p3) => {
        let result = '';
        if (p1) result = `(${p1}`;
        if (p2) result += `) ${p2}`;
        if (p3) result += `-${p3}`;
        return result;
      });
  }

  if (mask === 'cpf') {
    // XXX.XXX.XXX-XX
    return valueDigits
      .slice(0, 11)
      .replace(/(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_, p1, p2, p3, p4) => {
        let result = p1;
        if (p2) result += `.${p2}`;
        if (p3) result += `.${p3}`;
        if (p4) result += `-${p4}`;
        return result;
      });
  }

  if (mask === 'cnpj') {
    // XX.XXX.XXX/XXXX-XX
    return valueDigits
      .slice(0, 14)
      .replace(/(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/, (_, p1, p2, p3, p4, p5) => {
        let result = p1;
        if (p2) result += `.${p2}`;
        if (p3) result += `.${p3}`;
        if (p4) result += `/${p4}`;
        if (p5) result += `-${p5}`;
        return result;
      });
  }

  if (mask === 'cep') {
    // XXXXX-XXX
    return valueDigits
      .slice(0, 8)
      .replace(/(\d{0,5})(\d{0,3})/, (_, p1, p2) => {
        let result = p1;
        if (p2) result += `-${p2}`;
        return result;
      });
  }

  if (mask === 'currency') {
    // Formato monetário: 1.234,56
    const num = parseFloat(valueDigits.replace(/\D/g, '')) / 100 || 0;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return value;
};

/**
 * Formata valor de saída (remove máscaras)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unmaskValue = (value: string, maskType?: string): any => {
  if (!value) return '';

  if (maskType === 'currency') {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
  }

  return value.replace(/\D/g, '');
};

// ============================================================================
// Component
// ============================================================================

const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  error,
  disabled = false,
  readOnly = false,
  theme,
}) => {
  const hasError = !!error;
  const displayValue = useMemo(() => {
    if (!value) return '';
    if (field.mascara_entrada) return applyMask(String(value), field.mascara_entrada);
    return String(value);
  }, [value, field.mascara_entrada]);

  // ============================================================================
  // Field Change Handler
  // ============================================================================

  const handleChange = (newValue: any) => {
    let processedValue = newValue;

    // Aplicar máscara se configurada
    if (field.mascara_entrada) {
      processedValue = applyMask(String(newValue), field.mascara_entrada);
    }

      // Dispara evento para o wrapper (ex: FormRenderer/FormBuildEditor)
      // O wrapper é responsável por manter o estado do form e por persistir
      // ao salvar (convertendo para o formato aceito por `form_fields`/DB).
      onChange(field.nome, processedValue);
  };

  // ============================================================================
  // Render por Tipo
  // ============================================================================

  const renderField = () => {
    const commonProps = {
      disabled: disabled || readOnly,
      $hasError: hasError,
    };

    // Correção específica: campo 'atualizado_cli' deve ser sempre checkbox
    if (field && field.nome === 'atualizado_cli') {
      return (
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={value === true || value === 'true' || value === 'S'}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={disabled || readOnly}
          />
          {field.visual_config?.placeholder || 'Sim'}
        </CheckboxLabel>
      );
    }

    // `commonProps` inclui flags visuais que mapeiam para estilos (ex: borda vermelha em erro)
    // e para comportamento (disabled/readOnly). `$hasError` é usado pelos styled-components
    // para aplicar cores/box-shadow de validação conforme o padrão visual do projeto.

    switch (field.tipo_campo) {
      case 'email':
        return (
          <InputWrapper>
            <BaseInput
              {...commonProps}
              type="email"
              value={displayValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.visual_config?.placeholder || field.label}
              maxLength={field.tamanho_maximo}
            />
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'telefone':
        return (
          <InputWrapper>
            <BaseInput
              {...commonProps}
              type="tel"
              value={displayValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.visual_config?.placeholder || '(XX) XXXXX-XXXX'}
              maxLength={field.tamanho_maximo}
            />
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'number':
        return (
          <InputWrapper>
            <BaseInput
              {...commonProps}
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.visual_config?.placeholder || '0'}
              step="1"
            />
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'currency':
        return (
          <InputWrapper>
            <BaseInput
              {...commonProps}
              type="text"
              value={displayValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="R$ 0,00"
            />
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'date':
        return (
          <InputWrapper>
            <BaseInput
              {...commonProps}
              type="date"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
            />
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'datetime':
        return (
          <InputWrapper>
            <BaseInput
              {...commonProps}
              type="datetime-local"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
            />
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'select':
        return (
          <InputWrapper>
            <BaseSelect
              {...commonProps}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
            >
              <option value="">-- Selecione --</option>
            </BaseSelect>
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'multiselect':
        return (
          <InputWrapper>
            <BaseSelect
              {...commonProps}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              multiple
            >
              <option value="">-- Selecione --</option>
            </BaseSelect>
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'checkbox':
        return (
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={value === true || value === 'true' || value === 'S'}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled || readOnly}
            />
            {field.visual_config?.placeholder || 'Sim'}
          </CheckboxLabel>
        );

      case 'radio':
        return (
          <RadioGroup>
            <RadioLabel>
              <input
                type="radio"
                name={field.nome}
                value="S"
                checked={value === 'S' || value === true}
                onChange={(e) => handleChange('S')}
                disabled={disabled || readOnly}
              />
              Sim
            </RadioLabel>
            <RadioLabel>
              <input
                type="radio"
                name={field.nome}
                value="N"
                checked={value === 'N' || value === false}
                onChange={(e) => handleChange('N')}
                disabled={disabled || readOnly}
              />
              Não
            </RadioLabel>
          </RadioGroup>
        );

      case 'textarea':
        return (
          <InputWrapper>
            <BaseTextarea
              {...commonProps}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.visual_config?.placeholder || field.label}
              maxLength={field.tamanho_maximo}
            />
            {hasError && <ErrorIcon style={{ right: 20, top: 10 }}><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      case 'file':
        return (
          <InputWrapper>
            <BaseInput
              {...commonProps}
              type="file"
              onChange={(e) => handleChange(e.target.files?.[0])}
              disabled={disabled || readOnly}
            />
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );

      default:
        return (
          <InputWrapper>
            <BaseInput
              {...commonProps}
              type="text"
              value={displayValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.label}
            />
            {hasError && <ErrorIcon><FontAwesomeIcon icon={faExclamationCircle} /></ErrorIcon>}
          </InputWrapper>
        );
    }
  };

  return <FieldContainer>{renderField()}</FieldContainer>;
};

export default DynamicField;

// Observações adicionais:
// - Para respeitar o padrão `Cadastro de Usuários`, os campos renderizados aqui devem
//   ter as classes/estilos equivalentes (`sp-form__label`, `sp-form__input`) quando
//   o código é gerado inline pelo FormBuildEditor. No preview/renderer, o wrapper pode
//   aplicar wrappers que adicionem essas classes para manter 1:1 com o padrão visual.













