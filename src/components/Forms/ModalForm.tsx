/**
 * src/components/Forms/ModalForm.tsx
 * Modal para Criar/Editar Registros com Atalhos de Teclado
 * SPDealer - 25 de Outubro de 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FormField, ModalFormProps, FormState } from 'forms';
import FormRenderer from './FormRenderer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faBan } from '@fortawesome/free-solid-svg-icons';

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
  max-width: 900px;
  width: 90%;
  /* Reserve vertical space for app header and footer to avoid content hiding behind fixed bars */
  max-height: calc(100vh - var(--app-header-height, 64px) - var(--app-footer-height, 56px) - 40px);
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
  border-bottom: 1px solid var(--border-color, #e9ecef);
  background: linear-gradient(135deg, var(--primary-color, #007bff) 0%, #0056b3 100%);
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
  border-top: 1px solid var(--border-color, #e9ecef);
  background: var(--background-light, #f8f9fa);
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
          background: var(--primary-color, #007bff);
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
          color: var(--text-color-dark, #2c3e50);
          border: 1px solid var(--border-color, #e9ecef);
          &:hover { background: var(--background-light, #f8f9fa); }
        `;
    }
  }};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #666;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 4px;
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
  }}

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const KeyboardHintBar = styled.div`
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
  color: #666;
  margin-top: 12px;
  flex-wrap: wrap;

  span {
    display: flex;
    align-items: center;
    gap: 4px;

    kbd {
      background: #f0f0f0;
      border: 1px solid #ccc;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-weight: 500;
    }
  }
`;

// ============================================================================
// Component
// ============================================================================

export const ModalForm: React.FC<ModalFormProps> = ({
  isOpen,
  formId,
  mode,
  recordData,
  onClose,
  onSave,
}) => {
  const [formState, setFormState] = useState<FormState>({
    values: recordData || {},
    errors: {},
    touched: {},
    isDirty: false,
    isSubmitting: false,
    isValid: true,
  });

    /* eslint-disable react-hooks/exhaustive-deps */
  const [fields, setFields] = useState<FormField[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // ============================================================================
  // Effects
  // ============================================================================

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen) {
      loadFormFields();
    }
  }, [isOpen, formId]);

  useEffect(() => {
    if (recordData) {
      setFormState((prev) => ({
        ...prev,
        values: recordData,
        isDirty: false,
      }));
    }
  }, [recordData, isOpen]);

  // ============================================================================
  // API Calls
  // ============================================================================

  const loadFormFields = async () => {
    try {
      // TODO: Implementar chamada real à API
      // const response = await fetch(`/api/forms/${formId}/fields`);
      // const data = await response.json();
      // setFields(data);
      console.log(`[DEBUG] Loading fields for form: ${formId}`);
      setFields([]);
    } catch (error) {
      console.error('Erro ao carregar campos:', error);
      setStatus('error');
      setStatusMessage('Erro ao carregar formulário');
    }
  };

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      values: { ...prev.values, [fieldName]: value },
      isDirty: true,
      touched: { ...prev.touched, [fieldName]: true },
    }));
    // Limpar erro do campo quando o usuário começa a editar
    setFormState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [fieldName]: '' },
    }));
  };

  const handleSave = async () => {
    setStatus('loading');
    setStatusMessage('Gravando...');

    try {
      await onSave(formState.values);
      setStatus('success');
      setStatusMessage('Gravado com sucesso!');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setStatusMessage('');
      }, 1000);
    } catch (error) {
      setStatus('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Erro ao salvar formulário'
      );
      console.error('Erro ao salvar:', error);
    }
  };

  const handleCancel = () => {
    if (formState.isDirty) {
      const confirmed = window.confirm(
        'Existem alterações não salvas. Deseja descartar?'
      );
      if (!confirmed) return;
    }
    onClose();
    setStatus('idle');
    setStatusMessage('');
  };

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleKeyboardShortcuts = useCallback(
    (event: KeyboardEvent) => {
      // CTRL+G / CMD+G → Salvar
      if ((event.ctrlKey || event.metaKey) && event.key === 'g') {
        event.preventDefault();
        handleSave();
      }

      // CTRL+X / CMD+X → Cancelar
      if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
        event.preventDefault();
        handleCancel();
      }

      // ESC → Fechar
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }

      // TAB → Próximo campo (opcional, comportamento nativo)
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        const inputs = document.querySelectorAll(
          'input, select, textarea'
        ) as NodeListOf<HTMLElement>;
        const focusedIndex = Array.from(inputs).indexOf(
          document.activeElement as HTMLElement
        );
        if (focusedIndex > -1 && focusedIndex < inputs.length - 1) {
          inputs[focusedIndex + 1].focus();
        }
      }
    },
    []
  );

  const setupKeyboardShortcuts = () => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
  };

  // Referência intencional para evitar warning de variável atribuída e não usada
  void setupKeyboardShortcuts;

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [isOpen, handleKeyboardShortcuts]);

  // ============================================================================
  // Render
  // ============================================================================

  if (!isOpen) return null;

  const title =
    mode === 'create' ? 'Novo Registro' : `Editar - ${recordData?.nome || recordData?.titulo || ''}`;

  return (
    <Backdrop onClick={(e) => {
      if (e.target === e.currentTarget) handleCancel();
    }}>
      <ModalContent>
        {/* Header */}
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={handleCancel} title="ESC">
            <FontAwesomeIcon icon={faTimes} />
          </CloseButton>
        </ModalHeader>

        {/* Body */}
        <ModalBody>
          <FormRenderer
            formId={formId}
            fields={fields}
            data={formState.values}
            onChange={handleFieldChange}
            mode={mode}
            errors={formState.errors}
          />

          <KeyboardHintBar>
            <span>
              <kbd>CTRL+G</kbd> Salvar
            </span>
            <span>
              <kbd>CTRL+X</kbd> Cancelar
            </span>
            <span>
              <kbd>ESC</kbd> Fechar
            </span>
          </KeyboardHintBar>
        </ModalBody>

        {/* Footer */}
        <ModalFooter>
          <StatusBar>
            <StatusIndicator $status={status} />
            {statusMessage || 'Pronto'}
          </StatusBar>

          <FooterButton $variant="secondary" onClick={handleCancel} disabled={status === 'loading'}>
            <FontAwesomeIcon icon={faBan} />
            Cancelar
          </FooterButton>

          <FooterButton $variant="primary" onClick={handleSave} disabled={status === 'loading'}>
            <FontAwesomeIcon icon={faSave} />
            {status === 'loading' ? 'Gravando...' : 'Salvar'}
          </FooterButton>
        </ModalFooter>
      </ModalContent>
    </Backdrop>
  );
};

export default ModalForm;













