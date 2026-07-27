import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserCog, 
  faSave, 
  faUndo, 
  faUsers,
  faShieldAlt,
  faEye,
  faPlus,
  faEdit,
  faTrash,
  faCopy,
  faCheck,
  faTimes,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton, SecondaryButton } from '../Button/Button';
import { FormCard } from '../FormCard/FormCard';
import TreeView, { TreeNode } from '../TreeView/TreeView';
import { useFormEscapeHandler } from 'hooks/useFormEscapeHandler';
import { useFormDirtyState } from 'hooks/useFormDirtyState';
import { ConfirmDiscardChangesModal } from 'components/Modal/ConfirmDiscardChangesModal';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
`;

const Header = styled.div`
  padding: 24px 32px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h1`
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Content = styled.div`
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
`;

const FormSection = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
  height: 100%;
`;

const SelectorPanel = styled(FormCard)`
  height: fit-content;
`;

const TreePanel = styled(FormCard)`
  min-height: 600px;
`;

const UserSelector = styled.div`
  margin-bottom: 24px;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled(FontAwesomeIcon)`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
`;

const UserCard = styled.div<{ isSelected: boolean; isAdmin: boolean }>`
  padding: 12px 16px;
  border: 2px solid ${props => {
    if (props.isSelected) return '#3b82f6';
    if (props.isAdmin) return '#f59e0b';
    return '#e5e7eb';
  }};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => {
    if (props.isSelected) return '#eff6ff';
    if (props.isAdmin) return '#fffbeb';
    return '#ffffff';
  }};

  &:hover {
    border-color: ${props => props.isAdmin ? '#f59e0b' : '#3b82f6'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UserInfo = styled.div`
  font-size: 12px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AdminBadge = styled.span`
  background: #f59e0b;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
`;

const PermissionLegend = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const LegendTitle = styled.h4`
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #6b7280;
`;

const LegendIcon = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;

  .icon {
    font-size: 10px;
    color: white;
  }
`;

const TreeHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
`;

const TreeTitle = styled.h3`
  margin: 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
  flex: 1;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
`;

const QuickButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f9fafb;
    border-color: #3b82f6;
    color: #3b82f6;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        `;
      case 'error':
        return `
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        `;
      case 'info':
        return `
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        `;
      default:
        return '';
    }
  }}
`;

interface Usuario {
  id: number;
  nome: string;
  login: string;
  grupo: string;
  isAdmin: boolean;
  ativo: boolean;
}

interface MenuPermission {
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  visible: boolean;
  order: number;
}

interface ConfiguracaoMenuUsuarioFormProps {
  onSave?: (userId: number, permissions: {[key: string]: MenuPermission}) => void;
  onCancel?: () => void;
}

export const ConfiguracaoMenuUsuarioForm: React.FC<ConfiguracaoMenuUsuarioFormProps> = ({
  onSave,
  onCancel
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [menuPermissions, setMenuPermissions] = useState<{[key: string]: MenuPermission}>({});
  const [originalPermissions, setOriginalPermissions] = useState<{[key: string]: MenuPermission}>({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Estrutura completa do menu do sistema (baseada no admin)
  const [adminMenuStructure, setAdminMenuStructure] = useState<TreeNode[]>([
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: faEye,
      checked: false,
      children: [
        { id: 'dashboard.view', label: 'Visualizar Dashboard', checked: false },
        { id: 'dashboard.create', label: 'Criar Dashboard', checked: false },
        { id: 'dashboard.edit', label: 'Editar Dashboard', checked: false },
        { id: 'dashboard.delete', label: 'Excluir Dashboard', checked: false }
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: faEye,
      checked: false,
      children: [
        {
          id: 'contas-receber',
          label: 'Contas a Receber',
          checked: false,
          children: [
            { id: 'contas-receber.view', label: 'Visualizar', checked: false },
            { id: 'contas-receber.create', label: 'Criar', checked: false },
            { id: 'contas-receber.edit', label: 'Editar', checked: false },
            { id: 'contas-receber.delete', label: 'Excluir', checked: false }
          ]
        },
        {
          id: 'contas-pagar',
          label: 'Contas a Pagar',
          checked: false,
          children: [
            { id: 'contas-pagar.view', label: 'Visualizar', checked: false },
            { id: 'contas-pagar.create', label: 'Criar', checked: false },
            { id: 'contas-pagar.edit', label: 'Editar', checked: false },
            { id: 'contas-pagar.delete', label: 'Excluir', checked: false }
          ]
        },
        {
          id: 'caixa',
          label: 'Caixa',
          checked: false,
          children: [
            { id: 'caixa.view', label: 'Visualizar', checked: false },
            { id: 'caixa.create', label: 'Lançamentos', checked: false }
          ]
        }
      ]
    },
    {
      id: 'cadastros',
      label: 'Cadastros',
      icon: faEdit,
      checked: false,
      children: [
        {
          id: 'clientes',
          label: 'Clientes',
          checked: false,
          children: [
            { id: 'clientes.view', label: 'Visualizar', checked: false },
            { id: 'clientes.create', label: 'Criar', checked: false },
            { id: 'clientes.edit', label: 'Editar', checked: false },
            { id: 'clientes.delete', label: 'Excluir', checked: false }
          ]
        },
        {
          id: 'fornecedores',
          label: 'Fornecedores',
          checked: false,
          children: [
            { id: 'fornecedores.view', label: 'Visualizar', checked: false },
            { id: 'fornecedores.create', label: 'Criar', checked: false },
            { id: 'fornecedores.edit', label: 'Editar', checked: false },
            { id: 'fornecedores.delete', label: 'Excluir', checked: false }
          ]
        },
        {
          id: 'produtos',
          label: 'Produtos',
          checked: false,
          children: [
            { id: 'produtos.view', label: 'Visualizar', checked: false },
            { id: 'produtos.create', label: 'Criar', checked: false },
            { id: 'produtos.edit', label: 'Editar', checked: false },
            { id: 'produtos.delete', label: 'Excluir', checked: false }
          ]
        }
      ]
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: faEye,
      checked: false,
      children: [
        { id: 'relatorios.financeiros', label: 'Relatórios Financeiros', checked: false },
        { id: 'relatorios.vendas', label: 'Relatórios de Vendas', checked: false },
        { id: 'relatorios.estoque', label: 'Relatórios de Estoque', checked: false }
      ]
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: faShieldAlt,
      checked: false,
      children: [
        {
          id: 'usuarios',
          label: 'Usuários',
          checked: false,
          children: [
            { id: 'usuarios.view', label: 'Visualizar', checked: false },
            { id: 'usuarios.create', label: 'Criar', checked: false },
            { id: 'usuarios.edit', label: 'Editar', checked: false },
            { id: 'usuarios.delete', label: 'Excluir', checked: false }
          ]
        },
        {
          id: 'grupos',
          label: 'Grupos',
          checked: false,
          children: [
            { id: 'grupos.view', label: 'Visualizar', checked: false },
            { id: 'grupos.create', label: 'Criar', checked: false },
            { id: 'grupos.edit', label: 'Editar', checked: false },
            { id: 'grupos.delete', label: 'Excluir', checked: false }
          ]
        },
        { id: 'configuracoes.sistema', label: 'Configurações do Sistema', checked: false },
        { id: 'configuracoes.menus', label: 'Configuração de Menus', checked: false }
      ]
    }
  ]);

  const selectedUser = usuarios.find(u => u.id === selectedUserId);

  // Hook para detectar mudanças
  const { isDirty, updateInitialValues, resetDirtyState } = useFormDirtyState(
    originalPermissions,
    menuPermissions
  );

  const showConfirmDialog = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isDirty) {
        resolve(true);
        return;
      }
      
      setShowConfirmModal(true);
      
      const handleConfirm = () => {
        setShowConfirmModal(false);
        resolve(true);
      };
      
      const handleCancel = () => {
        setShowConfirmModal(false);
        resolve(false);
      };
      // evitar warning de variável atribuída e não usada
      void handleConfirm;
      void handleCancel;
      
      // Simular eventos do modal
      setTimeout(() => {
        const confirmed = window.confirm('Existem alterações não salvas. Deseja descartar as alterações?');
        setShowConfirmModal(false);
        resolve(confirmed);
      }, 100);
    });
  };

  // Hook para detectar ESC
  useFormEscapeHandler({
    onEscape: onCancel || (() => {}),
    hasUnsavedChanges: isDirty,
    showConfirmDialog: showConfirmDialog,
    isEnabled: true
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsuarios = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setStatusMessage({ type: 'error', text: 'Erro ao carregar usuários' });
    }
  };

  const loadUserPermissions = async (userId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user-permissions/${userId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const permissions = await response.json();
        setMenuPermissions(permissions);
        setOriginalPermissions({ ...permissions });
        
        // Atualizar árvore com permissões do usuário
        updateTreeWithPermissions(permissions);
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      setStatusMessage({ type: 'error', text: 'Erro ao carregar permissões do usuário' });
    } finally {
      setLoading(false);
    }
  };

  const updateTreeWithPermissions = (permissions: {[key: string]: MenuPermission}) => {
    const updateNodeRecursively = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        const permission = permissions[node.id];
        const updatedNode = {
          ...node,
          checked: permission?.visible || false,
          children: node.children ? updateNodeRecursively(node.children) : undefined
        };
        return updatedNode;
      });
    };

    setAdminMenuStructure(updateNodeRecursively(adminMenuStructure));
  };



  const handleUserSelect = async (userId: number) => {
    if (isDirty) {
      const confirmed = await showConfirmDialog();
      if (!confirmed) return;
    }
    
    setSelectedUserId(userId);
    setStatusMessage(null);
  };

  const handleTreeSelectionChange = (checkedNodes: string[]) => {
    const newPermissions = { ...menuPermissions };
    
    // Atualizar permissões baseado na seleção
    checkedNodes.forEach(nodeId => {
      if (!newPermissions[nodeId]) {
        newPermissions[nodeId] = {
          menuId: nodeId,
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          visible: true,
          order: 0
        };
      } else {
        newPermissions[nodeId].visible = true;
      }
    });
    
    // Remover permissões desmarcadas
    Object.keys(newPermissions).forEach(nodeId => {
      if (!checkedNodes.includes(nodeId)) {
        newPermissions[nodeId].visible = false;
      }
    });
    
    setMenuPermissions(newPermissions);
    // Não é mais necessário setIsDirty pois o hook detecta automaticamente
  };

  const handleSelectAll = () => {
    const getAllNodeIds = (nodes: TreeNode[]): string[] => {
      let ids: string[] = [];
      nodes.forEach(node => {
        ids.push(node.id);
        if (node.children) {
          ids = ids.concat(getAllNodeIds(node.children));
        }
      });
      return ids;
    };
    
    const allIds = getAllNodeIds(adminMenuStructure);
    handleTreeSelectionChange(allIds);
  };

  const handleUnselectAll = () => {
    handleTreeSelectionChange([]);
  };

  const handleCopyFromAdmin = () => {
    if (!selectedUser || selectedUser.isAdmin) return;
    
    // Buscar permissões do admin
    const adminUser = usuarios.find(u => u.isAdmin);
    if (adminUser) {
      loadUserPermissions(adminUser.id);
      setStatusMessage({ type: 'info', text: 'Permissões copiadas do administrador' });
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/user-permissions/${selectedUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(menuPermissions)
      });
      
      if (response.ok) {
        setOriginalPermissions({ ...menuPermissions });
        updateInitialValues({ ...menuPermissions });
        setStatusMessage({ type: 'success', text: 'Permissões salvas com sucesso!' });
        
        if (onSave) {
          onSave(selectedUserId, menuPermissions);
        }
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      setStatusMessage({ type: 'error', text: 'Erro ao salvar permissões' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await showConfirmDialog();
    if (confirmed) {
      setMenuPermissions({ ...originalPermissions });
      resetDirtyState();
      if (onCancel) {
        onCancel();
      }
    }
  };

  const filteredUsers = usuarios.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.grupo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <FormContainer>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faUserCog} />
          Configuração de Menus por Usuário
        </Title>
      </Header>

      <Content>
        {statusMessage && (
          <StatusMessage type={statusMessage.type}>
            <FontAwesomeIcon 
              icon={statusMessage.type === 'success' ? faCheck : statusMessage.type === 'error' ? faTimes : faEye} 
            />
            {statusMessage.text}
          </StatusMessage>
        )}

        <FormSection>
          <SelectorPanel>
            <h3 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '16px' }}>
              Selecionar Usuário
            </h3>
            
            <SearchContainer>
              <SearchIcon icon={faSearch} />
              <SearchInput
                type="text"
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>

            <UserSelector>
              {filteredUsers.map(user => (
                <UserCard
                  key={user.id}
                  isSelected={selectedUserId === user.id}
                  isAdmin={user.isAdmin}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <UserName>
                    <FontAwesomeIcon icon={user.isAdmin ? faShieldAlt : faUsers} />
                    {user.nome}
                    {user.isAdmin && <AdminBadge>ADMIN</AdminBadge>}
                  </UserName>
                  <UserInfo>
                    <span>@{user.login}</span>
                    <span>{user.grupo}</span>
                  </UserInfo>
                </UserCard>
              ))}
            </UserSelector>

            <PermissionLegend>
              <LegendTitle>Legenda de Permissões</LegendTitle>
              <LegendItem>
                <LegendIcon color="#10b981">
                  <FontAwesomeIcon icon={faEye} className="icon" />
                </LegendIcon>
                Visualizar - Pode ver o módulo
              </LegendItem>
              <LegendItem>
                <LegendIcon color="#3b82f6">
                  <FontAwesomeIcon icon={faPlus} className="icon" />
                </LegendIcon>
                Criar - Pode criar novos registros
              </LegendItem>
              <LegendItem>
                <LegendIcon color="#f59e0b">
                  <FontAwesomeIcon icon={faEdit} className="icon" />
                </LegendIcon>
                Editar - Pode modificar registros
              </LegendItem>
              <LegendItem>
                <LegendIcon color="#ef4444">
                  <FontAwesomeIcon icon={faTrash} className="icon" />
                </LegendIcon>
                Excluir - Pode remover registros
              </LegendItem>
            </PermissionLegend>
          </SelectorPanel>

          <TreePanel>
            <TreeHeader>
              <TreeTitle>
                {selectedUser ? `Permissões de ${selectedUser.nome}` : 'Selecione um usuário'}
                {selectedUser?.isAdmin && ' (Administrador - Todas as permissões)'}
              </TreeTitle>
              
              {selectedUser && !selectedUser.isAdmin && (
                <QuickActions>
                  <QuickButton onClick={handleSelectAll}>
                    <FontAwesomeIcon icon={faCheck} /> Marcar Todos
                  </QuickButton>
                  <QuickButton onClick={handleUnselectAll}>
                    <FontAwesomeIcon icon={faTimes} /> Desmarcar Todos
                  </QuickButton>
                  <QuickButton onClick={handleCopyFromAdmin}>
                    <FontAwesomeIcon icon={faCopy} /> Copiar do Admin
                  </QuickButton>
                </QuickActions>
              )}
            </TreeHeader>

            {selectedUser ? (
              selectedUser.isAdmin ? (
                <div style={{ 
                  padding: '32px', 
                  textAlign: 'center', 
                  color: '#6b7280',
                  background: '#fffbeb',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px'
                }}>
                  <FontAwesomeIcon icon={faShieldAlt} size="2x" style={{ color: '#f59e0b', marginBottom: '16px' }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#92400e' }}>Usuário Administrador</h3>
                  <p style={{ margin: 0 }}>
                    Administradores possuem acesso total a todas as funcionalidades do sistema.
                    <br />
                    Não é possível editar permissões de administradores.
                  </p>
                </div>
              ) : (
                <TreeView
                  data={adminMenuStructure}
                  showCheckboxes={true}
                  multiSelect={true}
                  onSelectionChange={handleTreeSelectionChange}
                  defaultExpandedNodes={['financeiro', 'cadastros', 'configuracoes']}
                />
              )
            ) : (
              <div style={{ 
                padding: '32px', 
                textAlign: 'center', 
                color: '#6b7280' 
              }}>
                <FontAwesomeIcon icon={faUsers} size="2x" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0' }}>Nenhum usuário selecionado</h3>
                <p style={{ margin: 0 }}>
                  Selecione um usuário na lista ao lado para configurar suas permissões de menu.
                </p>
              </div>
            )}
          </TreePanel>
        </FormSection>

        {selectedUser && !selectedUser.isAdmin && (
          <Actions>
            <SecondaryButton onClick={handleCancel} disabled={loading}>
              <FontAwesomeIcon icon={faUndo} />
              Cancelar
            </SecondaryButton>
            <PrimaryButton 
              onClick={handleSave} 
              disabled={loading || !isDirty}
            >
              <FontAwesomeIcon icon={faSave} />
              {loading ? 'Salvando...' : 'Salvar Permissões'}
            </PrimaryButton>
          </Actions>
        )}
      </Content>

      {showConfirmModal && (
        <ConfirmDiscardChangesModal
          isOpen={showConfirmModal}
          onConfirm={() => setShowConfirmModal(false)}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </FormContainer>
  );
};

export default ConfiguracaoMenuUsuarioForm;













