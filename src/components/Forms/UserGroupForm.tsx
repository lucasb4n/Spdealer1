import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { useFormEscapeHandler } from 'hooks/useFormEscapeHandler';
import { useFormDirtyState } from 'hooks/useFormDirtyState';
import { ConfirmDiscardChangesModal } from 'components/Modal/ConfirmDiscardChangesModal';
import { PermissionSelector } from '../Permissions/PermissionSelector';

import { UserPermission } from 'utils/permissionUtils';

interface UserGroupFormDto {
  id?: number;
  nome: string;
  descricao?: string;
  status: 'ativo' | 'inativo';
  observacoes?: string;
  permissionProgramIds: UserPermission[];
}

interface UserGroupFormProps {
  group?: UserGroupFormDto & { programas?: Array<{ id: number; codigo: string; descricao: string; tipo?: string }> };
  onSave: (group: UserGroupFormDto) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

const FormContainer = styled.div`
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 900px;
  margin: 0 auto;
`;

const FormHeader = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
`;

const FormTitle = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const FormGroup = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  ${props => props.fullWidth && 'grid-column: 1 / -1;'}
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 10px 12px;
  border: 2px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  }

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea<{ hasError?: boolean }>`
  padding: 10px 12px;
  border: 2px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  }
`;

const Select = styled.select<{ hasError?: boolean }>`
  padding: 10px 12px;
  border: 2px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  }
`;

const ErrorMessage = styled.span`
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
`;

const PermissionsSection = styled.div`
  margin-top: 24px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary'; loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  ${props => props.$variant === 'primary' ? `
    background: #3b82f6;
    color: #fff;
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  ` : `
    background: #6b7280;
    color: #fff;
    &:hover:not(:disabled) {
      background: #4b5563;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const UserGroupForm: React.FC<UserGroupFormProps> = ({ group, onSave, onCancel, isEditing }) => {
  const [formData, setFormData] = useState<UserGroupFormDto>({
    nome: '',
    descricao: '',
    status: 'ativo',
    observacoes: '',
    permissionProgramIds: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const initialFormData = useMemo(() => ({
    nome: '',
    descricao: '',
    status: 'ativo' as 'ativo' | 'inativo',
    observacoes: '',
    permissionProgramIds: [] as UserPermission[]
  }), []);

  const { isDirty } = useFormDirtyState(initialFormData, formData as any, ['id']);

  useEffect(() => {
    if (group) {
      setFormData({
        id: group.id,
        nome: group.nome || '',
        descricao: group.descricao || '',
        status: (group.status as 'ativo' | 'inativo') || 'ativo',
        observacoes: group.observacoes || '',
        permissionProgramIds: group.programas ? group.programas.map(p => ({
          programId: p.id,
          visivel: true,
          visualizar: true,
          editar: true,
          excluir: true
        })) : []
      });
    }
  }, [group]);

  const handleInputChange = <K extends keyof UserGroupFormDto>(field: K, value: UserGroupFormDto[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    if (formData.permissionProgramIds.length === 0) {
      newErrors.permissionProgramIds = 'Selecione pelo menos uma rotina';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showConfirmDialog = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setShowConfirmModal(true);
      setTimeout(() => {
        const modal = document.querySelector('[data-confirm-modal-user-group]') as any;
        if (modal) {
          modal._handleConfirm = () => {
            setShowConfirmModal(false);
            resolve(true);
          };
          modal._handleCancel = () => {
            setShowConfirmModal(false);
            resolve(false);
          };
        }
      }, 0);
    });
  };

  useFormEscapeHandler({
    onEscape: onCancel,
    hasUnsavedChanges: isDirty,
    showConfirmDialog,
    isEnabled: true
  });

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar grupo de usuários:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' }
  ];

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>
          <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: '12px' }} />
          {isEditing ? 'Editar Grupo de Usuários' : 'Novo Grupo de Usuários'}
        </FormTitle>
      </FormHeader>

      <FormGrid>
        <FormGroup>
          <Label>Nome *</Label>
          <Input
            type="text"
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            placeholder="Nome do grupo"
            hasError={!!errors.nome}
          />
          {errors.nome && <ErrorMessage>{errors.nome}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Status</Label>
          <Select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value as 'ativo' | 'inativo')}
          >
            {statusOptions.map(item => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup fullWidth>
          <Label>Descrição</Label>
          <Input
            type="text"
            value={formData.descricao || ''}
            onChange={(e) => handleInputChange('descricao', e.target.value)}
            placeholder="Descrição simplificada"
          />
        </FormGroup>

        <FormGroup fullWidth>
          <Label>Observações</Label>
          <TextArea
            value={formData.observacoes || ''}
            onChange={(e) => handleInputChange('observacoes', e.target.value)}
            placeholder="Observações adicionais"
          />
        </FormGroup>
      </FormGrid>

      <PermissionsSection>
        <PermissionSelector
          value={formData.permissionProgramIds}
          onChange={(selected) => handleInputChange('permissionProgramIds', selected)}
          helperText="Selecione as rotinas que o grupo poderá acessar"
        />
        {errors.permissionProgramIds && <ErrorMessage>{errors.permissionProgramIds}</ErrorMessage>}
      </PermissionsSection>

      <ButtonGroup>
        <Button type="button" $variant="secondary" onClick={onCancel}>
          <FontAwesomeIcon icon={faTimes} />
          Cancelar
        </Button>
        <Button type="button" $variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </ButtonGroup>

      <div data-confirm-modal-user-group>
        <ConfirmDiscardChangesModal
          isOpen={showConfirmModal}
          onConfirm={() => {
            const modal = document.querySelector('[data-confirm-modal-user-group]') as any;
            if (modal?._handleConfirm) modal._handleConfirm();
          }}
          onCancel={() => {
            const modal = document.querySelector('[data-confirm-modal-user-group]') as any;
            if (modal?._handleCancel) modal._handleCancel();
          }}
          title="Abandonar alterações?"
          message="Você possui alterações não salvas no grupo de usuários. Deseja fechar mesmo assim?"
        />
      </div>
    </FormContainer>
  );
};

export { UserGroupForm };
export type { UserGroupFormDto };
export default UserGroupForm;













