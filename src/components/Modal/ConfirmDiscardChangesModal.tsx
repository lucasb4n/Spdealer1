import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';

interface ConfirmDiscardChangesModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalAppear 0.2s ease-out;

  @keyframes modalAppear {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #ef4444;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 16px 24px 24px;
`;

const Message = styled.p`
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 24px 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;

  ${props => {
  switch (props.$variant) {
      case 'primary':
        return `
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          &:hover {
            background: #1d4ed8;
            border-color: #1d4ed8;
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          border-color: #ef4444;
          color: #ffffff;
          &:hover {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
      case 'secondary':
      default:
        return `
          background: #ffffff;
          border-color: #d1d5db;
          color: #374151;
          &:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }
        `;
    }
  }}
`;

const IconContainer = styled.div`
  color: #ef4444;
  font-size: 20px;
`;

export const ConfirmDiscardChangesModal: React.FC<ConfirmDiscardChangesModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Abandonar Alterações?',
  message = 'Você possui alterações não salvas. Tem certeza que deseja fechar este formulário? Todas as alterações serão perdidas.'
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContainer onKeyDown={handleEscapeKey} tabIndex={-1}>
        <ModalHeader>
          <ModalTitle>
            <IconContainer>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </IconContainer>
            {title}
          </ModalTitle>
          <CloseButton onClick={onCancel}>
            <FontAwesomeIcon icon={faTimes} size="sm" />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <Message>{message}</Message>
          
          <ButtonContainer>
            <Button $variant="secondary" onClick={onCancel}>
              Continuar Editando
            </Button>
            <Button $variant="danger" onClick={onConfirm}>
              Abandonar Alterações
            </Button>
          </ButtonContainer>
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};













