/**
 * SaveQueryDialog.tsx
 * 
 * Dialog para salvar uma query com nome e descrição
 */

import { FC, useState } from 'react';
import styled from 'styled-components';
import { Modal, Button } from 'react-bootstrap';

const DialogOverlay = styled(Modal)`
  .modal-content {
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px;
  display: block;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

// Botões estilizados removidos (não usados) — usar `Button` do react-bootstrap diretamente quando necessário

const ErrorBox = styled.div`
  background: #fecaca;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 16px;
`;

interface SaveQueryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (queryName: string, description?: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
}

const SaveQueryDialog: FC<SaveQueryDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialDescription = '',
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Nome da query é obrigatório');
      return;
    }

    if (name.length > 100) {
      setError('Nome não pode ter mais de 100 caracteres');
      return;
    }

    try {
      setLoading(true);
      await onSave(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar query');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName(initialName);
      setDescription(initialDescription);
      setError(null);
      onClose();
    }
  };

  return (
    <DialogOverlay show={isOpen} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Salvar Query</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <ErrorBox>{error}</ErrorBox>}

        <FormGroup>
          <Label htmlFor="query-name">Nome da Query *</Label>
          <Input
            id="query-name"
            type="text"
            placeholder="Ex: Contas em Atraso"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            maxLength={100}
          />
          <small style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            {name.length}/100 caracteres
          </small>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="query-desc">Descrição (opcional)</Label>
          <Textarea
            id="query-desc"
            placeholder="Descreva o propósito desta query..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
            maxLength={500}
          />
          <small style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            {description.length}/500 caracteres
          </small>
        </FormGroup>
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={handleClose}
          disabled={loading === true}
          style={{ background: '#6b7280', border: 'none', color: 'white' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading === true || name.trim() === ''}
          style={{ background: '#10b981', border: 'none', color: 'white' }}
        >
          {loading ? 'Salvando...' : 'Salvar Query'}
        </Button>
      </Modal.Footer>
    </DialogOverlay>
  );
};

export default SaveQueryDialog;













