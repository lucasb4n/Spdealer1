import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faTimes, 
  faSpinner, 
  faLayerGroup, 
  faShieldAlt 
} from '@fortawesome/free-solid-svg-icons';
import { useFormEscapeHandler } from 'hooks/useFormEscapeHandler';
import { useFormDirtyState } from 'hooks/useFormDirtyState';
import { ConfirmDiscardChangesModal } from 'components/Modal/ConfirmDiscardChangesModal';

interface Permissao {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
}

interface Grupo {
  id?: number;
  nome: string;
  descricao?: string;  // Opcional para compatibilidade
  status: 'ativo' | 'inativo';
  permissoes: string[];
  observacoes?: string;
}

interface GrupoFormProps {
  grupo?: Grupo;
  onSave: (grupo: Grupo) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const FormContainer = styled.div`
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 800px;
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

const ErrorMessage = styled.span`
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
`;

const PermissionsSection = styled.div`
  margin-top: 24px;
`;

const PermissionsTitle = styled.h3`
  color: #374151;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PermissionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
`;

const PermissionItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
`;

const CheckboxInput = styled.input`
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
`;

const PermissionLabel = styled.label`
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  flex: 1;
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

const GrupoForm: React.FC<GrupoFormProps> = ({ 
  grupo, 
  onSave, 
  onCancel, 
  isEditing 
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formData, setFormData] = useState<Grupo>({
    nome: '',
    descricao: '',
    status: 'ativo',
    permissoes: [],
    observacoes: ''
  });

  // Estado inicial para detectar mudanças
  const initialFormData = {
    nome: '',
    descricao: '',
    status: 'ativo' as 'ativo' | 'inativo',
    permissoes: [] as string[],
    observacoes: ''
  };

  // Hook para detectar mudanças não salvas
  const { isDirty } = useFormDirtyState(initialFormData, formData as any, ['id']);

  // Permissões disponíveis no sistema
  const permissoesDisponiveis: Permissao[] = [
    // Dashboard
    { id: 'dashboard.visualizar', nome: 'Visualizar Dashboard', descricao: 'Acesso ao dashboard principal', categoria: 'Dashboard' },
    { id: 'dashboard.configurar', nome: 'Configurar Dashboard', descricao: 'Configurar widgets e layout', categoria: 'Dashboard' },
    
    // Usuários
    { id: 'usuarios.visualizar', nome: 'Visualizar Usuários', descricao: 'Listar e consultar usuários', categoria: 'Usuários' },
    { id: 'usuarios.criar', nome: 'Criar Usuários', descricao: 'Criar novos usuários', categoria: 'Usuários' },
    { id: 'usuarios.editar', nome: 'Editar Usuários', descricao: 'Modificar dados de usuários', categoria: 'Usuários' },
    { id: 'usuarios.excluir', nome: 'Excluir Usuários', descricao: 'Remover usuários do sistema', categoria: 'Usuários' },
    
    // Grupos
    { id: 'grupos.visualizar', nome: 'Visualizar Grupos', descricao: 'Listar e consultar grupos', categoria: 'Grupos' },
    { id: 'grupos.criar', nome: 'Criar Grupos', descricao: 'Criar novos grupos', categoria: 'Grupos' },
    { id: 'grupos.editar', nome: 'Editar Grupos', descricao: 'Modificar dados de grupos', categoria: 'Grupos' },
    { id: 'grupos.excluir', nome: 'Excluir Grupos', descricao: 'Remover grupos do sistema', categoria: 'Grupos' },
    
    // Clientes
    { id: 'clientes.visualizar', nome: 'Visualizar Clientes', descricao: 'Listar e consultar clientes', categoria: 'Clientes' },
    { id: 'clientes.criar', nome: 'Criar Clientes', descricao: 'Cadastrar novos clientes', categoria: 'Clientes' },
    { id: 'clientes.editar', nome: 'Editar Clientes', descricao: 'Modificar dados de clientes', categoria: 'Clientes' },
    { id: 'clientes.excluir', nome: 'Excluir Clientes', descricao: 'Remover clientes do sistema', categoria: 'Clientes' },
    
    // Financeiro
    { id: 'financeiro.visualizar', nome: 'Visualizar Financeiro', descricao: 'Acesso aos relatórios financeiros', categoria: 'Financeiro' },
    { id: 'financeiro.receber', nome: 'Contas a Receber', descricao: 'Gerenciar contas a receber', categoria: 'Financeiro' },
    { id: 'financeiro.pagar', nome: 'Contas a Pagar', descricao: 'Gerenciar contas a pagar', categoria: 'Financeiro' },
    
    // Relatórios
    { id: 'relatorios.visualizar', nome: 'Visualizar Relatórios', descricao: 'Acesso aos relatórios do sistema', categoria: 'Relatórios' },
    { id: 'relatorios.exportar', nome: 'Exportar Relatórios', descricao: 'Exportar dados em PDF/Excel', categoria: 'Relatórios' }
  ];

  useEffect(() => {
    if (grupo) {
      setFormData({
        id: grupo.id,
        nome: grupo.nome || '',
        descricao: grupo.descricao || '',
        status: grupo.status || 'ativo',
        permissoes: grupo.permissoes || [],
        observacoes: grupo.observacoes || ''
      });
    }
  }, [grupo]);

  const handleInputChange = (field: keyof Grupo, value: string | string[]) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }));
    
    // Limpar erro do campo quando usuário digita
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const handlePermissionChange = (permissaoId: string, checked: boolean) => {
    const novasPermissoes = checked 
      ? [...formData.permissoes, permissaoId]
      : formData.permissoes.filter(p => p !== permissaoId);
    
    handleInputChange('permissoes', novasPermissoes);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.descricao?.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (formData.permissoes.length === 0) {
      newErrors.permissoes = 'Selecione pelo menos uma permissão';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      // Aqui você pode adicionar tratamento de erro
    } finally {
      setLoading(false);
    }
  };

  // Função para mostrar modal de confirmação
  const showConfirmDialog = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setShowConfirmModal(true);
      
      // Usar timeout para garantir que o modal seja renderizado
      setTimeout(() => {
        const modal = document.querySelector('[data-confirm-modal-grupo]') as any;
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

  // Hook para lidar com ESC
  useFormEscapeHandler({
    onEscape: onCancel,
    hasUnsavedChanges: isDirty,
    showConfirmDialog,
    isEnabled: true
  });

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' }
  ];

  // Agrupar permissões por categoria
  const permissoesPorCategoria = permissoesDisponiveis.reduce((acc, permissao) => {
    if (!acc[permissao.categoria]) {
      acc[permissao.categoria] = [];
    }
    acc[permissao.categoria].push(permissao);
    return acc;
  }, {} as Record<string, Permissao[]>);

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>
          <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: '12px' }} />
          {isEditing ? 'Editar Grupo' : 'Novo Grupo'}
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
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup fullWidth>
          <Label>Descrição *</Label>
          <Input
            type="text"
            value={formData.descricao}
            onChange={(e) => handleInputChange('descricao', e.target.value)}
            placeholder="Descrição do grupo (ex: Administradores do sistema)"
            hasError={!!errors.descricao}
          />
          {errors.descricao && <ErrorMessage>{errors.descricao}</ErrorMessage>}
        </FormGroup>

        <FormGroup fullWidth>
          <Label>Observações</Label>
          <TextArea
            value={formData.observacoes || ''}
            onChange={(e) => handleInputChange('observacoes', e.target.value)}
            placeholder="Observações sobre o grupo..."
          />
        </FormGroup>
      </FormGrid>

      <PermissionsSection>
        <PermissionsTitle>
          <FontAwesomeIcon icon={faShieldAlt} />
          Permissões *
        </PermissionsTitle>
        {errors.permissoes && <ErrorMessage>{errors.permissoes}</ErrorMessage>}
        
        {Object.entries(permissoesPorCategoria).map(([categoria, permissoes]) => (
          <div key={categoria}>
            <h4 style={{ 
              color: '#6b7280', 
              fontSize: '14px', 
              fontWeight: '600', 
              margin: '16px 0 8px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {categoria}
            </h4>
            <PermissionsGrid>
              {permissoes.map(permissao => (
                <PermissionItem key={permissao.id}>
                  <CheckboxInput
                    type="checkbox"
                    id={permissao.id}
                    checked={formData.permissoes.includes(permissao.id)}
                    onChange={(e) => handlePermissionChange(permissao.id, e.target.checked)}
                  />
                  <PermissionLabel htmlFor={permissao.id}>
                    <div style={{ fontWeight: '500' }}>{permissao.nome}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {permissao.descricao}
                    </div>
                  </PermissionLabel>
                </PermissionItem>
              ))}
            </PermissionsGrid>
          </div>
        ))}
      </PermissionsSection>

      <ButtonGroup>
  <Button type="button" $variant="secondary" onClick={onCancel}>
          <FontAwesomeIcon icon={faTimes} />
          Cancelar
        </Button>
        <Button 
          type="button" 
          $variant="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </ButtonGroup>

      {/* Modal de confirmação para abandonar alterações */}
      <div data-confirm-modal-grupo>
        <ConfirmDiscardChangesModal
          isOpen={showConfirmModal}
          onConfirm={() => {
            const modal = document.querySelector('[data-confirm-modal-grupo]') as any;
            if (modal?._handleConfirm) modal._handleConfirm();
          }}
          onCancel={() => {
            const modal = document.querySelector('[data-confirm-modal-grupo]') as any;
            if (modal?._handleCancel) modal._handleCancel();
          }}
          title="Abandonar Alterações no Grupo?"
          message="Você possui alterações não salvas no cadastro do grupo. Tem certeza que deseja fechar este formulário? Todas as alterações serão perdidas."
        />
      </div>
    </FormContainer>
  );
};

export { GrupoForm };
export default GrupoForm;













