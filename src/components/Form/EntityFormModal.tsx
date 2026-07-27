/**
 * src/components/form/EntityFormModal.tsx
 * Modal especializado para CRUD com POST/PUT/DELETE
 * 
 * Funcionalidades:
 * - Modo CREATE (POST /api/{tableName})
 * - Modo EDIT (PUT /api/{tableName}/{id})
 * - Modo DELETE (DELETE /api/{tableName}/{id}) - com confirmação
 * - Tratamento de erros (400, 404, 409, 500)
 * - Validação de campos
 * - Type conversion (String → Integer, Decimal, Date, Boolean)
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faBan, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

// ============================================================================
// Types
// ============================================================================

export interface EntityFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete';
  tableName: string;
  recordData?: Record<string, any>;
  fields?: FormFieldDef[];
  onClose: () => void;
  onSuccess?: (data?: any) => void;
  onError?: (error: string) => void;
}

interface FormFieldDef {
  field_name: string;
  field_type: string;
  form_visible_edit?: boolean;
  form_visible_create?: boolean;
  form_order_edit?: number;
  form_order_create?: number;
  validation_pattern?: string;
  required: boolean;
  max_length?: number;
}

interface ErrorResponse {
  status: number;
  message: string;
  errorCode: string;
  fieldErrors?: Record<string, string>;
}

interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  statusMessage: string;
}

// ============================================================================
// Styled Components
// ============================================================================

const Backdrop = styled.div`
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
  animation: fadeIn 0.2s ease-out;

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
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border-radius: 8px 8px 0 0;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
`;

const FooterButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  ${(p) => {
    switch (p.$variant) {
      case 'primary':
        return `
          background: #007bff;
          color: white;
          &:hover { background: #0056b3; }
          &:active { transform: scale(0.98); }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: white;
          color: #2c3e50;
          border: 1px solid #e9ecef;
          &:hover { background: #f8f9fa; }
        `;
    }
  }};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;

  span {
    color: #dc3545;
    margin-left: 4px;
  }
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${(p) => (p.$hasError ? '#dc3545' : '#e9ecef')};
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${(p) => (p.$hasError ? '#dc3545' : '#007bff')};
    box-shadow: 0 0 0 3px ${(p) =>
      p.$hasError ? 'rgba(220, 53, 69, 0.1)' : 'rgba(0, 123, 255, 0.1)'};
  }

  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  display: block;
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 4px;
`;

const StatusBar = styled.div<{ $status?: 'idle' | 'loading' | 'success' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  padding: 8px 12px;
  border-radius: 4px;
  
  ${(p) => {
    switch (p.$status) {
      case 'loading':
        return `
          background: #fff3cd;
          color: #856404;
        `;
      case 'success':
        return `
          background: #d4edda;
          color: #155724;
        `;
      case 'error':
        return `
          background: #f8d7da;
          color: #721c24;
        `;
      default:
        return `
          background: #e2e3e5;
          color: #383d41;
        `;
    }
  }};
`;

const StatusIndicator = styled.span<{ $status?: 'idle' | 'loading' | 'success' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;

  ${(p) => {
    switch (p.$status) {
      case 'loading':
        return `background: #ffc107; animation: pulse 1.5s infinite;`;
      case 'success':
        return `background: #28a745;`;
      case 'error':
        return `background: #dc3545;`;
      default:
        return `background: #ccc;`;
    }
  }};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const DeleteWarning = styled.div`
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  color: #721c24;
  font-size: 0.95rem;
`;

// ============================================================================
// Component
// ============================================================================

export const EntityFormModal: React.FC<EntityFormModalProps> = ({
  isOpen,
  mode,
  tableName,
  recordData,
  fields = [],
  onClose,
  onSuccess,
  onError,
}) => {
  const [formState, setFormState] = useState<FormState>({
    values: recordData || {},
    errors: {},
    isSubmitting: false,
    status: 'idle',
    statusMessage: '',
  });

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (recordData && isOpen) {
      setFormState((prev) => ({
        ...prev,
        values: recordData,
        errors: {},
      }));
    }
  }, [recordData, isOpen]);

  // Keep refs for values read by keyboard handler to avoid recreating the handler
  const formStateRef = useRef<FormState>(formState);
  const modeRef = useRef<typeof mode>(mode);

  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, [fieldName]: value },
      errors: { ...prev.errors, [fieldName]: '' },
    }));
  };

  const handleSave = async () => {
    if (formState.isSubmitting) return;

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      status: 'loading',
      statusMessage: 'Gravando...',
    }));

    try {
      const url = `/api/${tableName}${mode === 'edit' ? `/${recordData?.id}` : ''}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState.values),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        
        // Handle validation errors (400)
        if (response.status === 400 && errorData.fieldErrors) {
          setFormState((prev) => ({
            ...prev,
            errors: errorData.fieldErrors || {},
            status: 'error',
            statusMessage: errorData.message || 'Erros de validação',
            isSubmitting: false,
          }));
          onError?.(errorData.message);
          return;
        }

        // Handle other errors
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      const data = await response.json();
      
      setFormState((prev) => ({
        ...prev,
        status: 'success',
        statusMessage: mode === 'create' ? 'Registro criado com sucesso!' : 'Registro atualizado com sucesso!',
        isSubmitting: false,
      }));

      setTimeout(() => {
        onSuccess?.(data);
        onClose();
      }, 1000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar';
      
      setFormState((prev) => ({
        ...prev,
        status: 'error',
        statusMessage: message,
        isSubmitting: false,
      }));
      
      onError?.(message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja deletar este registro? Esta ação não pode ser desfeita.')) {
      return;
    }

    if (formState.isSubmitting) return;

    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      status: 'loading',
      statusMessage: 'Deletando...',
    }));

    try {
      const url = `/api/${tableName}/${recordData?.id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || `Erro ${response.status}`);
      }

      setFormState((prev) => ({
        ...prev,
        status: 'success',
        statusMessage: 'Registro deletado com sucesso!',
        isSubmitting: false,
      }));

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar';
      
      setFormState((prev) => ({
        ...prev,
        status: 'error',
        statusMessage: message,
        isSubmitting: false,
      }));
      
      onError?.(message);
    }
  };

  const handleCancel = () => {
    onClose();
    setFormState({
      values: {},
      errors: {},
      isSubmitting: false,
      status: 'idle',
      statusMessage: '',
    });
  };

  // Refs to latest handlers so keyboard shortcut can call them without deps
  const handleSaveRef = useRef<typeof handleSave | null>(null);
  const handleCancelRef = useRef<typeof handleCancel | null>(null);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    handleCancelRef.current = handleCancel;
  }, [handleCancel]);

  const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      if (modeRef.current !== 'delete' && !formStateRef.current.isSubmitting) {
        handleSaveRef.current && handleSaveRef.current();
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      handleCancelRef.current && handleCancelRef.current();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [isOpen, handleKeyboardShortcuts]);

  // ============================================================================
  // Computed
  // ============================================================================

  const visibleFields = useMemo(() => {
    return fields
      .filter((field) => {
        if (mode === 'create') {
          return field.form_visible_create !== false;
        } else if (mode === 'edit') {
          return field.form_visible_edit !== false;
        }
        return true;
      })
      .sort((a, b) => {
        if (mode === 'create') {
          return (a.form_order_create || 0) - (b.form_order_create || 0);
        } else if (mode === 'edit') {
          return (a.form_order_edit || 0) - (b.form_order_edit || 0);
        }
        return 0;
      });
  }, [fields, mode]);

  const title = {
    create: 'Novo Registro',
    edit: `Editar - ${recordData?.nome || recordData?.titulo || 'Registro'}`,
    delete: 'Confirmar Deleção',
  }[mode];

  // ============================================================================
  // Render
  // ============================================================================

  if (!isOpen) return null;

  return (
    <Backdrop
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <ModalContent>
        {/* Header */}
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={handleCancel} title="ESC" disabled={formState.isSubmitting}>
            <FontAwesomeIcon icon={faTimes} />
          </CloseButton>
        </ModalHeader>

        {/* Body */}
        <ModalBody>
          {mode === 'delete' ? (
            <DeleteWarning>
              ⚠️ Você está prestes a deletar este registro. Esta ação é irreversível.
            </DeleteWarning>
          ) : (
            <>
              {visibleFields.map((field) => (
                <FormGroup key={field.field_name}>
                  <Label>
                    {field.field_name}
                    {field.required && <span>*</span>}
                  </Label>
                  <Input
                    type={field.field_type === 'date' ? 'date' : 'text'}
                    value={formState.values[field.field_name] ?? ''}
                    onChange={(e) =>
                      handleFieldChange(field.field_name, e.target.value)
                    }
                    placeholder={`Digite ${field.field_name.toLowerCase()}`}
                    maxLength={field.max_length}
                    disabled={formState.isSubmitting}
                    $hasError={!!formState.errors[field.field_name]}
                  />
                  {formState.errors[field.field_name] && (
                    <ErrorText>{formState.errors[field.field_name]}</ErrorText>
                  )}
                </FormGroup>
              ))}
            </>
          )}
        </ModalBody>

        {/* Footer */}
        <ModalFooter>
          <StatusBar $status={formState.status}>
            <StatusIndicator $status={formState.status} />
            {formState.statusMessage || 'Pronto'}
          </StatusBar>

          <FooterButton
            $variant="secondary"
            onClick={handleCancel}
            disabled={formState.isSubmitting}
          >
            <FontAwesomeIcon icon={faBan} />
            Cancelar
          </FooterButton>

          {mode === 'delete' ? (
            <FooterButton
              $variant="danger"
              onClick={handleDelete}
              disabled={formState.isSubmitting}
            >
              <FontAwesomeIcon icon={formState.isSubmitting ? faSpinner : faTrash} />
              {formState.isSubmitting ? 'Deletando...' : 'Deletar'}
            </FooterButton>
          ) : (
            <FooterButton
              $variant="primary"
              onClick={handleSave}
              disabled={formState.isSubmitting}
            >
              <FontAwesomeIcon icon={formState.isSubmitting ? faSpinner : faSave} />
              {formState.isSubmitting ? 'Gravando...' : 'Salvar'}
            </FooterButton>
          )}
        </ModalFooter>
      </ModalContent>
    </Backdrop>
  );
};

export default EntityFormModal;













