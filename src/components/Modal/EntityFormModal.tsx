import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FormData } from '../Form/DynamicFormBuilder';
import { DictionaryFormService } from 'services/DictionaryFormService';
import { FormFieldDef } from 'services/DictionaryFormService';

// =====================
// STYLED COMPONENTS
// =====================

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }

  button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #333;
    }
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;

    &:hover {
      background: #999;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #333;
    font-size: 14px;

    .required {
      color: #e74c3c;
      margin-left: 4px;
    }
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }

    &.error {
      border-color: #e74c3c;
      background-color: #fee;
    }
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }
`;

const ErrorMessage = styled.span`
  display: block;
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
`;

const SuccessMessage = styled.div`
  padding: 12px;
  margin-bottom: 16px;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
  font-size: 14px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  ${FormGroup} {
    margin-bottom: 0;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #f9f9f9;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  background-color: ${props => (props.variant === 'secondary' ? '#e0e0e0' : '#2563eb')};
  color: ${props => (props.variant === 'secondary' ? '#333' : 'white')};

  &:hover {
    background-color: ${props => (props.variant === 'secondary' ? '#d0d0d0' : '#1d4ed8')};
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;

    &:hover {
      background-color: ${props => (props.variant === 'secondary' ? '#e0e0e0' : '#2563eb')};
    }
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// =====================
// TYPES
// =====================

export interface EntityFormModalProps {
  tableName: string;
  mode: 'create' | 'edit';
  entity?: FormData | null;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
}

// =====================
// MAIN COMPONENT
// =====================

const EntityFormModal: React.FC<EntityFormModalProps> = ({
  tableName,
  mode,
  entity,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<FormData>({});
  const [formFields, setFormFields] = useState<FormFieldDef[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // =====================
  // LIFECYCLE HOOKS
  // =====================

  // Mantém `loadFormFields` estável via useCallback e usa apenas essa referência no effect
  const loadFormFields = useCallback(async () => {
    try {
      setLoading(true);
      const formConfig = await DictionaryFormService.getFormConfig(tableName);
      setFormFields(formConfig.formFields || []);
    } catch (error) {
      console.error('Erro ao carregar campos do formulário:', error);
      setErrorMessage('Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    loadFormFields();
  }, [loadFormFields]);

  useEffect(() => {
    if (mode === 'edit' && entity) {
      setFormData(entity);
    } else {
      setFormData({});
    }
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');
  }, [mode, entity]);

  // =====================
  // HANDLERS
  // =====================


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Handle checkbox
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    formFields.forEach(field => {
      const value = formData[field.field];

      // Check required
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.field] = `${field.label} é obrigatório`;
        return;
      }

      // Check pattern if defined
      if (field.validation_pattern && value && typeof value === 'string') {
        const regex = new RegExp(field.validation_pattern);
        if (!regex.test(value)) {
          newErrors[field.field] = `${field.label} inválido`;
        }
      }

      // Check email format
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value as string)) {
          newErrors[field.field] = 'Email inválido';
        }
      }

      // Check number range
      if (field.type === 'number' && value) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          newErrors[field.field] = `${field.label} deve ser um número`;
        } else if (field.min_value !== undefined && numValue < field.min_value) {
          newErrors[field.field] = `${field.label} não pode ser menor que ${field.min_value}`;
        } else if (field.max_value !== undefined && numValue > field.max_value) {
          newErrors[field.field] = `${field.label} não pode ser maior que ${field.max_value}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrorMessage('Por favor, corrija os erros no formulário');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await onSave(formData);
      setSuccessMessage(
        mode === 'create'
          ? 'Registro criado com sucesso!'
          : 'Registro atualizado com sucesso!'
      );

      // Close modal after 1 second
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar registro'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // ESC to close
    if (e.key === 'Escape') {
      if (Object.keys(formData).some(key => formData[key])) {
        // Confirm close if form has changes
        if (window.confirm('Descartar alterações?')) {
          onClose();
        }
      } else {
        onClose();
      }
    }

    // Ctrl+S or Ctrl+Enter to submit
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // =====================
  // RENDER
  // =====================

  if (loading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalBody style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '12px', color: '#666' }}>Carregando formulário...</p>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={onClose} onKeyDown={handleKeyDown} tabIndex={0}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>
            {mode === 'create' ? `➕ Novo Registro` : `✏️ Editar Registro`}
          </h2>
          <button onClick={onClose} title="Fechar (ESC)">
            ✕
          </button>
        </ModalHeader>

        <ModalBody>
          {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
          {errorMessage && (
            <ErrorMessage style={{ display: 'block', background: '#fee', padding: '12px', borderRadius: '4px' }}>
              {errorMessage}
            </ErrorMessage>
          )}

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            {formFields.length > 0 ? (
              formFields.map((field, index) => {
                // Group fields in pairs for layout
                const isFirstInRow = index % 2 === 0;
                const nextField = index + 1 < formFields.length ? formFields[index + 1] : null;

                if (!isFirstInRow) return null; // Skip even indices, handled by row below

                return (
                  <FormRow key={`row-${index}`}>
                    <FormGroup>
                      <label>
                        {field.label}
                        {field.required && <span className="required">*</span>}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.field}
                          placeholder={field.placeholder || ''}
                          value={(formData[field.field] as string) || ''}
                          onChange={handleInputChange}
                          className={errors[field.field] ? 'error' : ''}
                        />
                      ) : field.type === 'select' && field.options ? (
                        <select
                          name={field.field}
                          value={(formData[field.field] as string) || ''}
                          onChange={handleInputChange}
                          className={errors[field.field] ? 'error' : ''}
                        >
                          <option value="">Selecione uma opção</option>
                          {(field.options as Array<{ value: string | number; label: string }>).map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          name={field.field}
                          placeholder={field.placeholder || ''}
                          value={(formData[field.field] as string) || ''}
                          onChange={handleInputChange}
                          min={field.min_value}
                          max={field.max_value}
                          maxLength={field.max_length}
                          className={errors[field.field] ? 'error' : ''}
                        />
                      )}

                      {errors[field.field] && (
                        <ErrorMessage>{errors[field.field]}</ErrorMessage>
                      )}
                    </FormGroup>

                    {nextField && (
                      <FormGroup>
                        <label>
                          {nextField.label}
                          {nextField.required && <span className="required">*</span>}
                        </label>

                        {nextField.type === 'textarea' ? (
                          <textarea
                            name={nextField.field}
                            placeholder={nextField.placeholder || ''}
                            value={(formData[nextField.field] as string) || ''}
                            onChange={handleInputChange}
                            className={errors[nextField.field] ? 'error' : ''}
                          />
                        ) : nextField.type === 'select' && nextField.options ? (
                          <select
                            name={nextField.field}
                            value={(formData[nextField.field] as string) || ''}
                            onChange={handleInputChange}
                            className={errors[nextField.field] ? 'error' : ''}
                          >
                            <option value="">Selecione uma opção</option>
                            {(nextField.options as Array<{ value: string | number; label: string }>).map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={nextField.type || 'text'}
                            name={nextField.field}
                            placeholder={nextField.placeholder || ''}
                            value={(formData[nextField.field] as string) || ''}
                            onChange={handleInputChange}
                            min={nextField.min_value}
                            max={nextField.max_value}
                            maxLength={nextField.max_length}
                            className={errors[nextField.field] ? 'error' : ''}
                          />
                        )}

                        {errors[nextField.field] && (
                          <ErrorMessage>{errors[nextField.field]}</ErrorMessage>
                        )}
                      </FormGroup>
                    )}
                  </FormRow>
                );
              })
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                Nenhum campo disponível
              </p>
            )}
          </form>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
            title="Fechar (ESC)"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || loading}
            title="Salvar (Ctrl+S)"
          >
            {submitting ? (
              <>
                <LoadingSpinner /> Salvando...
              </>
            ) : mode === 'create' ? (
              '➕ Criar'
            ) : (
              '💾 Salvar'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EntityFormModal;













