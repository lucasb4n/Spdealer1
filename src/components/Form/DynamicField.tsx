/**
 * DynamicField.tsx
 * 
 * Componente de campo dinâmico com suporte a ENTER para navegação
 * - Lê configuração do dicionário
 * - Implementa ENTER para saltar campos
 * - Valida entrada conforme tipo
 * - Suporta input, select, textarea
 * - Aplica máscaras automáticas (CEP, CNPJ, CPF, Telefone)
 */

import React, { useRef } from 'react';
import {
  focusPreviousField,
  handleEnterKey,
} from 'utils/formFieldNavigation';
import { applyMask } from 'utils/maskUtils';

interface DynamicFieldProps {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  onSubmit?: () => void;
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  validationMessage?: string;
  className?: string;
  formRef?: React.RefObject<HTMLFormElement>;
  helpText?: string;
}

/**
 * Componente de campo com suporte a ENTER
 * 
 * @example
 * <DynamicField
 *   fieldName="cliente_rec"
 *   fieldLabel="Cliente"
 *   fieldType="text"
 *   value={cliente}
 *   onChange={setCliente}
 *   onSubmit={handleGravar}
 *   formRef={formRef}
 *   required
 * />
 */
const DynamicField: React.FC<DynamicFieldProps> = ({
  fieldName,
  fieldLabel,
  fieldType,
  value,
  onChange,
  onSubmit,
  options = [],
  required = false,
  disabled = false,
  readonly = false,
  placeholder = '',
  maxLength,
  pattern,
  validationMessage,
  className = '',
  formRef,
  helpText,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handler para ENTER
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const form = formRef?.current;
    if (!form) return;

    // ENTER: navegar ou submeter
    handleEnterKey(e, form, fieldName, onSubmit || (() => {}), fieldType === 'textarea' ? 'textarea' : 'input');

    // SHIFT+TAB: campo anterior (override do TAB padrão)
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      focusPreviousField(form, fieldName);
    }
  };

  // Handler para mudanças de valor
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let newValue: string | number | boolean = e.target.value;

    // Converter para número se fieldType é number
    if (fieldType === 'number') {
      newValue = e.target.value ? parseFloat(e.target.value) : '';
    } else if (fieldType === 'text' || fieldType === 'tel') {
      // Aplicar máscara automática baseado no nome do campo
      newValue = applyMask(fieldName, String(newValue));
    }

    onChange(newValue);
  };

  // Validar padrão (regex)
  const isInvalid = (): boolean => {
    if (!pattern || !value) return false;
    const regex = new RegExp(pattern);
    return !regex.test(String(value));
  };

  // Render condicional por tipo
  if (fieldType === 'checkbox') {
    return (
      <div className={`form-group form-group-checkbox ${className}`}>
        <label className="form-check-label">
          <input
            ref={inputRef}
            type="checkbox"
            name={fieldName}
            checked={Boolean(value)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="form-check-input"
          />
          {fieldLabel}
        </label>
      </div>
    );
  }

  if (fieldType === 'select') {
    return (
      <div className={`form-group ${className}`}>
        <label htmlFor={fieldName} className="form-label">
          {fieldLabel}
          {required && <span className="required">*</span>}
          {helpText && (
            <span className="description-hint" title={helpText}>
              ℹ️
            </span>
          )}
        </label>
        <select
          ref={selectRef}
          id={fieldName}
          name={fieldName}
          value={String(value) || ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`form-control ${isInvalid() ? 'is-invalid' : ''}`}
        >
          <option value="">-- Selecionar --</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {validationMessage && isInvalid() && (
          <div className="invalid-feedback d-block">{validationMessage}</div>
        )}
      </div>
    );
  }

  if (fieldType === 'textarea') {
    return (
      <div className={`form-group ${className}`}>
        <label htmlFor={fieldName} className="form-label">
          {fieldLabel}
          {required && <span className="required">*</span>}
          {helpText && (
            <span className="description-hint" title={helpText}>
              ℹ️
            </span>
          )}
        </label>
        <textarea
          ref={textareaRef}
          id={fieldName}
          name={fieldName}
          value={String(value) || ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          readOnly={readonly}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`form-control ${isInvalid() ? 'is-invalid' : ''}`}
          rows={3}
        />
        <small className="form-text text-muted">
          CTRL+ENTER para próximo campo | ENTER para nova linha
        </small>
        {validationMessage && isInvalid() && (
          <div className="invalid-feedback d-block">{validationMessage}</div>
        )}
      </div>
    );
  }

  // Input padrão (text, email, tel, number, date)
  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={fieldName} className="form-label">
        {fieldLabel}
        {required && <span className="required">*</span>}
        {helpText && (
          <span className="description-hint" title={helpText}>
            ℹ️
          </span>
        )}
      </label>
      <input
        ref={inputRef}
        type={fieldType}
        id={fieldName}
        name={fieldName}
        value={String(value) || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        readOnly={readonly}
        placeholder={placeholder}
        maxLength={maxLength}
        pattern={pattern}
        required={required}
        className={`form-control ${isInvalid() ? 'is-invalid' : ''}`}
      />
      {validationMessage && isInvalid() && (
        <div className="invalid-feedback d-block">{validationMessage}</div>
      )}
    </div>
  );
};

export default DynamicField;













