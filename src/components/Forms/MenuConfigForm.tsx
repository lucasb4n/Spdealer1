import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { 
  faUserCog, 
  faSave, 
  faUndo, 
  faTree,
  faUser,
  faShieldAlt,
  faEye,
  faPlus,
  faEdit,
  faTrash,
  faChevronDown,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton, SecondaryButton } from '../Button/Button';
import { useFormEscapeHandler } from 'hooks/useFormEscapeHandler';
import { useFormDirtyState } from 'hooks/useFormDirtyState';
import { ConfirmDiscardChangesModal } from 'components/Modal/ConfirmDiscardChangesModal';

interface Usuario {
  id: number;
  nome: string;
  login: string;
  grupo: string;
  email: string;
  isAdmin: boolean;
}

interface MenuPermission {
  id: string;
  name: string;
  icon?: string;
  parentId?: string;
  order: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  visible: boolean;
  children?: MenuPermission[];
}

interface MenuConfigFormProps {
  usuario?: Usuario | null;
  onSave: (config: any) => void;
  onCancel: () => void;
  isEditing: boolean;
}

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
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
`;

const SelectorPanel = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  height: fit-content;
`;

const TreePanel = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  min-height: 600px;
`;

const UserSelector = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #ffffff;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const UserInfo = styled.div`
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const UserInfoTitle = styled.h4`
  margin: 0 0 8px 0;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
`;

const UserInfoText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
`;

const TreeContainer = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  max-height: 500px;
  overflow-y: auto;
`;

const TreeNode = styled.div<{ level: number; isExpanded?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  padding-left: ${props => 12 + (props.level * 20)}px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ExpandIcon = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: #6b7280;
`;

const MenuIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #6b7280;
`;

const MenuName = styled.span`
  flex: 1;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
`;

const PermissionCheckboxes = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const CheckboxLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding: 24px 32px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
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

export const MenuConfigForm: React.FC<MenuConfigFormProps> = ({ 
  usuario, 
  onSave, 
  onCancel, 
  isEditing 
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(usuario?.id.toString() || '');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [menuStructure, setMenuStructure] = useState<MenuPermission[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<{[key: string]: MenuPermission}>({});
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { isDirty, resetDirtyState } = useFormDirtyState({}, {});

  const showConfirmDialog = (): Promise<boolean> => {
    if (!isDirty) return Promise.resolve(true);
    
    return new Promise((resolve) => {
      setShowConfirmModal(true);
      
      const handleConfirm = () => {
        setShowConfirmModal(false);
        resolve(true);
      };
      
      const handleCancel = () => {
        setShowConfirmModal(false);
        resolve(false);
      };
      
      // Adicionar handlers temporários
      window.addEventListener('menu-config-confirm', handleConfirm);
      window.addEventListener('menu-config-cancel', handleCancel);
      
      setTimeout(() => {
        window.removeEventListener('menu-config-confirm', handleConfirm);
        window.removeEventListener('menu-config-cancel', handleCancel);
      }, 10000);
    });
  };

  useFormEscapeHandler({
    onEscape: () => {
      if (onCancel) onCancel();
    },
    hasUnsavedChanges: isDirty,
    showConfirmDialog: showConfirmDialog,
    isEnabled: true
  });

  

  const loadUsuarios = useCallback(async () => {
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);

  const loadMenuStructure = useCallback(async () => {
    try {
      const response = await fetch('/api/menu-structure', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMenuStructure(buildMenuTree(data));
      } else {
        // Menu structure padrão como fallback
        setMenuStructure(getDefaultMenuStructure());
      }
    } catch (error) {
      console.error('Erro ao carregar estrutura de menus:', error);
      setMenuStructure(getDefaultMenuStructure());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserPermissions = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/user-permissions/${userId}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
        resetDirtyState();
      }
    } catch (error) {
      console.error('Erro ao carregar permissões do usuário:', error);
    }
  }, [resetDirtyState]);

  useEffect(() => {
    loadUsuarios();
    loadMenuStructure();
  }, [loadUsuarios, loadMenuStructure]);

  useEffect(() => {
    if (selectedUserId) {
      loadUserPermissions(selectedUserId);
    }
  }, [selectedUserId, loadUserPermissions]);

  const getDefaultMenuStructure = (): MenuPermission[] => {
    return [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: 'fa-chart-line',
        order: 1,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        visible: true,
        children: [
          {
            id: 'dashboard-financeiro',
            name: 'Dashboard Financeiro',
            icon: 'fa-dollar-sign',
            parentId: 'dashboard',
            order: 1,
            canView: true,
            canCreate: false,
            canEdit: true,
            canDelete: false,
            visible: true
          },
          {
            id: 'dashboard-builder',
            name: 'Dashboard Builder',
            icon: 'fa-tools',
            parentId: 'dashboard',
            order: 2,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            visible: true
          }
        ]
      },
      {
        id: 'cadastros',
        name: 'Cadastros',
        icon: 'fa-database',
        order: 2,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        visible: true,
        children: [
          {
            id: 'clientes',
            name: 'Clientes',
            icon: 'fa-users',
            parentId: 'cadastros',
            order: 1,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            visible: true
          },
          {
            id: 'fornecedores',
            name: 'Fornecedores',
            icon: 'fa-truck',
            parentId: 'cadastros',
            order: 2,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            visible: true
          }
        ]
      },
      {
        id: 'financeiro',
        name: 'Financeiro',
        icon: 'fa-dollar-sign',
        order: 3,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        visible: true,
        children: [
          {
            id: 'contas-receber',
            name: 'Contas a Receber',
            icon: 'fa-arrow-down',
            parentId: 'financeiro',
            order: 1,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            visible: true
          },
          {
            id: 'contas-pagar',
            name: 'Contas a Pagar',
            icon: 'fa-arrow-up',
            parentId: 'financeiro',
            order: 2,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            visible: true
          },
          {
            id: 'caixa',
            name: 'Caixa',
            icon: 'fa-cash-register',
            parentId: 'financeiro',
            order: 3,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: false,
            visible: true
          }
        ]
      },
      {
        id: 'relatorios',
        name: 'Relatórios',
        icon: 'fa-chart-bar',
        order: 4,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        visible: true,
        children: [
          {
            id: 'relatorios-financeiros',
            name: 'Relatórios Financeiros',
            icon: 'fa-file-invoice-dollar',
            parentId: 'relatorios',
            order: 1,
            canView: true,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            visible: true
          }
        ]
      },
      {
        id: 'configuracoes',
        name: 'Configurações',
        icon: 'fa-cog',
        order: 5,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        visible: true,
        children: [
          {
            id: 'usuarios',
            name: 'Usuários',
            icon: 'fa-users-cog',
            parentId: 'configuracoes',
            order: 1,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            visible: true
          },
          {
            id: 'grupos',
            name: 'Grupos',
            icon: 'fa-layer-group',
            parentId: 'configuracoes',
            order: 2,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            visible: true
          },
          {
            id: 'menu-config',
            name: 'Configuração de Menus',
            icon: 'fa-sitemap',
            parentId: 'configuracoes',
            order: 3,
            canView: true,
            canCreate: false,
            canEdit: true,
            canDelete: false,
            visible: true
          }
        ]
      }
    ];
  };

  const buildMenuTree = (flatMenu: any[]): MenuPermission[] => {
    const menuMap = new Map();
    const tree: MenuPermission[] = [];

    // Criar mapa de todos os itens
    flatMenu.forEach(item => {
      menuMap.set(item.id, { ...item, children: [] });
    });

    // Construir árvore
    flatMenu.forEach(item => {
      if (item.parentId) {
        const parent = menuMap.get(item.parentId);
        if (parent) {
          parent.children.push(menuMap.get(item.id));
        }
      } else {
        tree.push(menuMap.get(item.id));
      }
    });

    return tree.sort((a, b) => a.order - b.order);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const updatePermission = (nodeId: string, field: keyof MenuPermission, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [field]: value
      }
    }));
    // updateDirtyState removido - o hook detecta mudanças automaticamente
  };

  const renderTreeNode = (node: MenuPermission, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const permission = permissions[node.id] || node;

    return (
      <React.Fragment key={node.id}>
        <TreeNode level={level}>
          <ExpandIcon onClick={() => hasChildren && toggleNode(node.id)}>
            {hasChildren && (
              <FontAwesomeIcon 
                icon={isExpanded ? faChevronDown : faChevronRight} 
                size="sm"
              />
            )}
          </ExpandIcon>
          
          <MenuIcon>
            {node.icon && <FontAwesomeIcon icon={node.icon as any} />}
          </MenuIcon>
          
          <MenuName>{node.name}</MenuName>
          
          <PermissionCheckboxes>
            <CheckboxGroup>
              <CheckboxLabel>Ver</CheckboxLabel>
              <Checkbox 
                type="checkbox"
                checked={permission.canView}
                onChange={(e) => updatePermission(node.id, 'canView', e.target.checked)}
              />
            </CheckboxGroup>
            
            <CheckboxGroup>
              <CheckboxLabel>Criar</CheckboxLabel>
              <Checkbox 
                type="checkbox"
                checked={permission.canCreate}
                onChange={(e) => updatePermission(node.id, 'canCreate', e.target.checked)}
              />
            </CheckboxGroup>
            
            <CheckboxGroup>
              <CheckboxLabel>Editar</CheckboxLabel>
              <Checkbox 
                type="checkbox"
                checked={permission.canEdit}
                onChange={(e) => updatePermission(node.id, 'canEdit', e.target.checked)}
              />
            </CheckboxGroup>
            
            <CheckboxGroup>
              <CheckboxLabel>Excluir</CheckboxLabel>
              <Checkbox 
                type="checkbox"
                checked={permission.canDelete}
                onChange={(e) => updatePermission(node.id, 'canDelete', e.target.checked)}
              />
            </CheckboxGroup>
            
            <CheckboxGroup>
              <CheckboxLabel>Visível</CheckboxLabel>
              <Checkbox 
                type="checkbox"
                checked={permission.visible}
                onChange={(e) => updatePermission(node.id, 'visible', e.target.checked)}
              />
            </CheckboxGroup>
          </PermissionCheckboxes>
        </TreeNode>
        
        {hasChildren && isExpanded && node.children?.map(child => 
          renderTreeNode(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/user-permissions/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(permissions)
      });

      if (response.ok) {
        resetDirtyState();
        onSave(permissions);
      } else {
        alert('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações');
    }
  };

  const handleCancel = async () => {
    const canLeave = await showConfirmDialog();
    if (canLeave) {
      onCancel();
    }
  };

  const selectedUser = usuarios.find(u => u.id.toString() === selectedUserId);

  return (
    <FormContainer>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faUserCog} />
          Configuração de Menus por Usuário
        </Title>
      </Header>
      
      <Content>
        <SelectorPanel>
          <UserSelector>
            <Label>Selecionar Usuário</Label>
            <Select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Selecione um usuário...</option>
              {usuarios.map(user => (
                <option key={user.id} value={user.id}>
                  {user.nome} ({user.login})
                </option>
              ))}
            </Select>
          </UserSelector>

          {selectedUser && (
            <UserInfo>
              <UserInfoTitle>
                <FontAwesomeIcon icon={faUser} /> {selectedUser.nome}
              </UserInfoTitle>
              <UserInfoText>
                <strong>Login:</strong> {selectedUser.login}<br/>
                <strong>Grupo:</strong> {selectedUser.grupo}<br/>
                <strong>E-mail:</strong> {selectedUser.email}<br/>
                <strong>Admin:</strong> {selectedUser.isAdmin ? 'Sim' : 'Não'}
              </UserInfoText>
            </UserInfo>
          )}

          <PermissionLegend>
            <LegendTitle>Legenda de Permissões</LegendTitle>
            <LegendItem>
              <FontAwesomeIcon icon={faEye} /> <strong>Ver:</strong> Visualizar o menu/módulo
            </LegendItem>
            <LegendItem>
              <FontAwesomeIcon icon={faPlus} /> <strong>Criar:</strong> Adicionar novos registros
            </LegendItem>
            <LegendItem>
              <FontAwesomeIcon icon={faEdit} /> <strong>Editar:</strong> Modificar registros existentes
            </LegendItem>
            <LegendItem>
              <FontAwesomeIcon icon={faTrash} /> <strong>Excluir:</strong> Remover registros
            </LegendItem>
            <LegendItem>
              <FontAwesomeIcon icon={faShieldAlt} /> <strong>Visível:</strong> Exibir no menu
            </LegendItem>
          </PermissionLegend>
        </SelectorPanel>

        <TreePanel>
          <h3>
            <FontAwesomeIcon icon={faTree} /> Estrutura de Menus e Permissões
          </h3>
          
          {loading ? (
            <div>Carregando...</div>
          ) : selectedUserId ? (
            <TreeContainer>
              {menuStructure.map(node => renderTreeNode(node))}
            </TreeContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              Selecione um usuário para configurar as permissões
            </div>
          )}
        </TreePanel>
      </Content>

      <Actions>
        <SecondaryButton onClick={handleCancel}>
          <FontAwesomeIcon icon={faUndo} />
          Cancelar
        </SecondaryButton>
        <PrimaryButton 
          onClick={handleSave}
          disabled={!selectedUserId || !isDirty}
        >
          <FontAwesomeIcon icon={faSave} />
          Salvar Configurações
        </PrimaryButton>
      </Actions>

      {showConfirmModal && (
        <ConfirmDiscardChangesModal
          isOpen={showConfirmModal}
          onConfirm={() => {
            setShowConfirmModal(false);
            window.dispatchEvent(new CustomEvent('menu-config-confirm'));
          }}
          onCancel={() => {
            setShowConfirmModal(false);
            window.dispatchEvent(new CustomEvent('menu-config-cancel'));
          }}
        />
      )}
    </FormContainer>
  );
};













