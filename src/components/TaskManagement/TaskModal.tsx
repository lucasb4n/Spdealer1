// src/components/TaskManagement/TaskModal.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { TaskManagement } from 'TaskManagement';

const Modal = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 15px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  
  &:hover {
    color: #333;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
  font-size: 13px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #0d6efd;
    box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dee2e6;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  background: ${props => props.$variant === 'danger' ? '#dc3545' : '#0d6efd'};
  color: white;
  
  &:hover {
    background: ${props => props.$variant === 'danger' ? '#c82333' : '#0b5ed7'};
  }
`;

interface TaskModalProps {
  task?: TaskManagement;
  is_open: boolean;
  on_close: () => void;
  on_save?: (task: TaskManagement) => void;
  on_delete?: (task_id: number) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, is_open, on_close, on_save, on_delete }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState(task?.priority_key || 'normal');

  const handleSave = async () => {
    // Implementar salva
    on_save?.(task as TaskManagement);
  };

  return (
    <Modal $isOpen={is_open} onClick={on_close}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{task ? `Editar ${task.task_id}` : 'Nova Tarefa'}</ModalTitle>
          <CloseButton onClick={on_close}>×</CloseButton>
        </ModalHeader>

        <FormGroup>
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormGroup>

        <FormGroup>
          <Label>Descrição</Label>
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormGroup>

        <FormGroup>
          <Label>Prioridade</Label>
          <Input as="select" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'critical')} >
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </Input>
        </FormGroup>

        <ButtonGroup>
          <Button onClick={on_close}>Cancelar</Button>
          {task && on_delete && (
            <Button $variant="danger" onClick={() => on_delete(task.id)}>
              Deletar
            </Button>
          )}
          <Button $variant="primary" onClick={handleSave}>
            Salvar
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
};

export default TaskModal;













