import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faTimes, 
  faSpinner, 
  faUser, 
  faEye, 
  faEyeSlash 
} from '@fortawesome/free-solid-svg-icons';
import { useFormEscapeHandler } from 'hooks/useFormEscapeHandler';
import { useFormDirtyState } from 'hooks/useFormDirtyState';
import { parsePermissions, UserPermission as UserPermissionType } from 'utils/permissionUtils';
import { ConfirmDiscardChangesModal } from 'components/Modal/ConfirmDiscardChangesModal';
import { PermissionSelector } from '../Permissions/PermissionSelector';

interface UserPermission extends UserPermissionType {}

interface Usuario {
  id?: number;
  username: string;
  nome: string;
  name: string;
  email: string;
  celular?: string;
  senha?: string;
  grupo: string;
  groupId?: number;
  active: boolean;
  status: 'ativo' | 'inativo';
  observacoes?: string;
  permissions?: string;
  permissionProgramIds?: UserPermission[];
}

const serializePermissionIds = (permissions: UserPermission[]): string => JSON.stringify(permissions);

interface UsuarioFormProps {
  usuario?: Usuario;
  onSave: (usuario: Usuario) => Promise<void>;
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

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  ${props => props.$fullWidth && 'grid-column: 1 / -1;'}
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 10px 12px;
  border: 2px solid ${props => props.$hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  }

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  padding: 10px 12px;
  border: 2px solid ${props => props.$hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  }
`;

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  padding: 10px 12px;
  border: 2px solid ${props => props.$hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.$hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
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

const PasswordContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 30px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #374151;
  }
`;

const UsuarioForm: React.FC<UsuarioFormProps> = ({ 
  usuario, 
  onSave, 
  onCancel, 
  isEditing 
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [userGroups, setUserGroups] = useState<Array<{ id: number; nome: string }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [grupoError, setGrupoError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Usuario>({
    username: '',
    nome: '',
    name: '',
    email: '',
    celular: '',
    senha: '',
    grupo: '',
    groupId: undefined,
    active: true,
    status: 'ativo',
    observacoes: '',
    permissions: '',
    permissionProgramIds: []
  });

  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estado inicial para detectar mudanças
  const initialFormData = {
    username: '',
    nome: '',
    name: '',
    email: '',
    celular: '',
    senha: '',
    grupo: '',
    status: 'ativo' as 'ativo' | 'inativo',
    active: true,
    observacoes: '',
    permissions: '',
    permissionProgramIds: [] as UserPermission[]
  };

  // Hook para detectar mudanças não salvas
  const { isDirty } = useFormDirtyState(initialFormData, formData as any, ['id']);

  useEffect(() => {
    if (usuario) {
      setFormData({
        id: usuario.id,
        username: usuario.username || '',
        nome: usuario.nome || '',
        name: usuario.name || usuario.nome || '',
        email: usuario.email || '',
        celular: usuario.celular || '',
        senha: '',
        grupo: usuario.grupo || '',
        groupId: usuario.groupId,
        active: usuario.active ?? (usuario.status === 'ativo'),
        status: usuario.status || 'ativo',
        observacoes: usuario.observacoes || '',
        permissions: usuario.permissions || '',
        permissionProgramIds: parsePermissions(usuario.permissions)
      });
    }
  }, [usuario]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchGroups = async () => {
      setLoadingGroups(true);
      setGrupoError(null);
      try {
        const response = await fetch('/api/users-groups', {
          credentials: 'include',
          signal: controller.signal
        });
        if (response.ok) {
          const data = await response.json();
          setUserGroups(Array.isArray(data) ? data.map((group: any) => ({
            id: group.id,
            nome: group.nome
          })) : []);
        } else {
          const errorBody = await response.json().catch(() => null);
          const msg = errorBody?.message || 'Não foi possível carregar os grupos';
          setGrupoError(msg);
          console.error(msg);
        }
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          const msg = 'Erro ao buscar grupos de usuários';
          setGrupoError(msg);
          console.error(msg, error);
        }
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchGroups();
    return () => controller.abort();
  }, []);

  // Sincronizar nome do grupo se tivermos apenas o groupId ou vice-versa
  useEffect(() => {
    if (userGroups.length > 0) {
      if (formData.groupId && !formData.grupo) {
        const group = userGroups.find(g => g.id === formData.groupId);
        if (group) setFormData(prev => ({ ...prev, grupo: group.nome }));
      } else if (formData.grupo && !formData.groupId) {
        const group = userGroups.find(g => g.nome === formData.grupo);
        if (group) setFormData(prev => ({ ...prev, groupId: group.id }));
      }
    }
  }, [userGroups, formData.groupId, formData.grupo]);
  const handleConfirmInputChange = (value: string) => {
    setConfirmarSenha(value);
    if (errors.confirmarSenha) {
      setErrors(prev => ({ ...prev, confirmarSenha: '' }));
    }
  };

  const handleFormFieldChange = <K extends keyof Usuario>(field: K, value: Usuario[K]) => {
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

    if (!formData.username.trim()) {
      newErrors.username = 'Login é obrigatório';
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }


    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.celular && !/^\d{8,20}$/.test(formData.celular.replace(/\D/g, ''))) {
      newErrors.celular = 'Celular deve conter apenas números (8 a 20 dígitos)';
    }

    if (!isEditing && !formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    }

    if (formData.senha && formData.senha !== confirmarSenha) {
      newErrors.confirmarSenha = 'Senhas não coincidem';
    }

    if (!formData.grupo) {
      newErrors.grupo = 'Grupo é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const permissionPayload = serializePermissionIds(formData.permissionProgramIds || []);
      const userData = {
        ...formData,
        permissions: permissionPayload
      } as Usuario;
      delete userData.permissionProgramIds;
      userData.username = userData.username.trim();
      if (!userData.senha && isEditing) {
        delete userData.senha; // Remove senha se estiver editando e não foi alterada
      }
      await onSave(userData);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
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
        const modal = document.querySelector('[data-confirm-modal-usuario]') as any;
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

  const groupOptions = [
    { value: '', label: loadingGroups ? 'Carregando grupos...' : 'Selecione um grupo' },
    ...userGroups.map(group => ({ value: group.nome, label: group.nome }))
  ];

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' }
  ];

  return (
    <FormContainer>
      <FormHeader>
        <FormTitle>
          <FontAwesomeIcon icon={faUser} style={{ marginRight: '12px' }} />
          {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
        </FormTitle>
      </FormHeader>

      <FormGrid>
        <FormGroup>
          <Label>Nome *</Label>
          <Input
            type="text"
            value={formData.nome}
            onChange={(e) => {
              const val = e.target.value;
              setFormData(prev => ({ ...prev, nome: val, name: val }));
              if (errors.nome) setErrors(prev => ({ ...prev, nome: '' }));
            }}
            placeholder="Nome completo do usuário"
            $hasError={!!errors.nome}
          />
          {errors.nome && <ErrorMessage>{errors.nome}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Login *</Label>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => handleFormFieldChange('username', e.target.value)}
            placeholder="login.do.usuario"
            $hasError={!!errors.username}
          />
          {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleFormFieldChange('email', e.target.value)}
            placeholder="email@exemplo.com"
            $hasError={!!errors.email}
          />
          {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
        </FormGroup>
        <FormGroup>
          <Label>Celular</Label>
          <Input
            type="text"
            value={formData.celular || ''}
            onChange={(e) => handleFormFieldChange('celular', e.target.value)}
            placeholder="Somente números"
            $hasError={!!errors.celular}
          />
          {errors.celular && <ErrorMessage>{errors.celular}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <PasswordContainer>
            <Label>{isEditing ? 'Nova Senha' : 'Senha *'}</Label>
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.senha}
              onChange={(e) => handleFormFieldChange('senha', e.target.value)}
              placeholder={isEditing ? "Deixe em branco para manter a atual" : "Digite a senha"}
              $hasError={!!errors.senha}
            />
            <PasswordToggle 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </PasswordToggle>
            {errors.senha && <ErrorMessage>{errors.senha}</ErrorMessage>}
          </PasswordContainer>
        </FormGroup>

        <FormGroup>
          <PasswordContainer>
            <Label>{isEditing ? 'Confirmar Nova Senha' : 'Confirmar Senha *'}</Label>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmarSenha}
              onChange={(e) => handleConfirmInputChange(e.target.value)}
              placeholder="Confirme a senha"
              $hasError={!!errors.confirmarSenha}
            />
            <PasswordToggle 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
            </PasswordToggle>
            {errors.confirmarSenha && <ErrorMessage>{errors.confirmarSenha}</ErrorMessage>}
          </PasswordContainer>
        </FormGroup>

        <FormGroup>
          <Label>Grupo *</Label>
            <Select
              value={formData.grupo}
              onChange={(e) => {
                const groupName = e.target.value;
                const selectedGroup = userGroups.find(g => g.nome === groupName);
                setFormData(prev => ({ 
                  ...prev, 
                  grupo: groupName,
                  groupId: selectedGroup ? selectedGroup.id : undefined
                }));
                if (errors.grupo) setErrors(prev => ({ ...prev, grupo: '' }));
              }}
            $hasError={!!errors.grupo || !!grupoError}
            disabled={loadingGroups && userGroups.length === 0}
          >
            {groupOptions.map(grupo => (
              <option key={grupo.value} value={grupo.value}>
                {grupo.label}
              </option>
            ))}
          </Select>
          {errors.grupo && <ErrorMessage>{errors.grupo}</ErrorMessage>}
          {grupoError && !errors.grupo && (
            <ErrorMessage style={{ marginTop: 4 }}>
              {grupoError}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label>Status</Label>
            <Select
              value={formData.status}
              onChange={(e) => {
                const val = e.target.value as 'ativo' | 'inativo';
                setFormData(prev => ({ ...prev, status: val, active: val === 'ativo' }));
              }}
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup $fullWidth>
          <Label>Observações</Label>
          <TextArea
            value={formData.observacoes || ''}
            onChange={(e) => handleFormFieldChange('observacoes', e.target.value)}
            placeholder="Observações sobre o usuário..."
          />
        </FormGroup>
      </FormGrid>

      <PermissionsSection>
        <PermissionSelector
          value={formData.permissionProgramIds || []}
          onChange={(selected) => handleFormFieldChange('permissionProgramIds', selected)}
          helperText="Rotinas adicionais atribuídas diretamente a este usuário (substitui o grupo quando presente)"
        />
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
      <div data-confirm-modal-usuario>
        <ConfirmDiscardChangesModal
          isOpen={showConfirmModal}
          onConfirm={() => {
            const modal = document.querySelector('[data-confirm-modal-usuario]') as any;
            if (modal?._handleConfirm) modal._handleConfirm();
          }}
          onCancel={() => {
            const modal = document.querySelector('[data-confirm-modal-usuario]') as any;
            if (modal?._handleCancel) modal._handleCancel();
          }}
          title="Abandonar Alterações no Usuário?"
          message="Você possui alterações não salvas no cadastro do usuário. Tem certeza que deseja fechar este formulário? Todas as alterações serão perdidas."
        />
      </div>
    </FormContainer>
  );
};

export { UsuarioForm };
export default UsuarioForm;













