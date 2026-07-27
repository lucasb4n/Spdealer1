/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
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
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton, SecondaryButton } from '../Button/Button';
import { Select } from '../Select/Select';
import { FormCard } from '../FormCard/FormCard';
import TreeView, { TreeNode } from '../TreeView/TreeView';
import { useFormEscapeHandler } from 'hooks/useFormEscapeHandler';
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
  grid-template-columns: 400px 1fr;
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

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
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

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

interface Usuario {
  id: number;
  nome: string;
  login: string;
  grupo: string;
  isAdmin: boolean;
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

interface ConfiguracaoMenuFormProps {}

export const ConfiguracaoMenuForm: React.FC<ConfiguracaoMenuFormProps> = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [usuarios] = useState<Usuario[]>([
    { id: 1, nome: 'Admin Sistema', login: 'admin', grupo: 'Administradores', isAdmin: true },
    { id: 2, nome: 'João Silva', login: 'joao.silva', grupo: 'Vendedores', isAdmin: false },
    { id: 3, nome: 'Maria Santos', login: 'maria.santos', grupo: 'Financeiro', isAdmin: false },
    { id: 4, nome: 'Pedro Costa', login: 'pedro.costa', grupo: 'Estoque', isAdmin: false }
  ]);

  const [menuPermissions, setMenuPermissions] = useState<{[key: string]: MenuPermission}>({});
  const [originalPermissions, setOriginalPermissions] = useState<{[key: string]: MenuPermission}>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedUser = usuarios.find(u => u.id.toString() === selectedUserId);

  // Função para mostrar modal de confirmação
  const showConfirmDialog = (): Promise<boolean> => {
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
      
      // Adiciona handlers temporários ao modal
      setTimeout(() => {
        const modal = document.querySelector('[data-confirm-modal-menu]');
        if (modal) {
          (modal as any)._handleConfirm = handleConfirm;
          (modal as any)._handleCancel = handleCancel;
        }
      }, 0);
    });
  };

  // Função para fechar formulário
  const handleCloseForm = () => {
    // Reset form ou ação de fechar
    setSelectedUserId('');
    setMenuPermissions({});
    setOriginalPermissions({});
    setHasChanges(false);
  };

  // Hook para lidar com ESC
  useFormEscapeHandler({
    onEscape: handleCloseForm,
    hasUnsavedChanges: hasChanges,
    showConfirmDialog,
    isEnabled: true
  });

  // Estrutura de menus hierárquica baseada no banco de dados
  const menuStructure: TreeNode[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: faTree,
      children: [
        { id: 'dashboard-principal', label: 'Dashboard Principal', icon: faEye },
        { id: 'dashboard-builder', label: 'Dashboard Builder', icon: faPlus }
      ]
    },
    {
      id: 'cadastros',
      label: 'Cadastros',
      icon: faUser,
      children: [
        { id: 'clientes', label: 'Clientes', icon: faUser },
        { id: 'fornecedores', label: 'Fornecedores', icon: faUser },
        { id: 'produtos', label: 'Produtos', icon: faUser }
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: faShieldAlt,
      children: [
        { id: 'contas-receber', label: 'Contas a Receber', icon: faPlus },
        { id: 'contas-pagar', label: 'Contas a Pagar', icon: faEdit },
        { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: faEye }
      ]
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: faEdit,
      children: [
        { id: 'relatorios-vendas', label: 'Relatórios de Vendas', icon: faEye },
        { id: 'relatorios-financeiro', label: 'Relatórios Financeiros', icon: faEye },
        { id: 'relatorios-estoque', label: 'Relatórios de Estoque', icon: faEye }
      ]
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: faUserCog,
      children: [
        { id: 'usuarios', label: 'Usuários', icon: faUser },
        { id: 'grupos', label: 'Grupos', icon: faShieldAlt },
        { id: 'permissoes', label: 'Permissões', icon: faShieldAlt }
      ]
    }
  ];

  useEffect(() => {
    if (selectedUserId) {
      loadUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    const permissionsString = JSON.stringify(menuPermissions);
    const originalString = JSON.stringify(originalPermissions);
    setHasChanges(permissionsString !== originalString);
  }, [menuPermissions, originalPermissions]);

  const loadUserPermissions = async (userId: string) => {
    try {
      // Simular carregamento do backend
      // Em produção, fazer chamada para API: /api/users/{userId}/menu-permissions
      
      const user = usuarios.find(u => u.id.toString() === userId);
      if (!user) return;

      let permissions: {[key: string]: MenuPermission} = {};

      if (user.isAdmin) {
        // Admin tem todas as permissões
        const setFullPermissions = (nodes: TreeNode[]) => {
          nodes.forEach(node => {
            permissions[node.id] = {
              menuId: node.id,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
              visible: true,
              order: 0
            };
            if (node.children) {
              setFullPermissions(node.children);
            }
          });
        };
        setFullPermissions(menuStructure);
      } else {
        // Usuários não-admin com permissões limitadas baseadas no grupo
        const groupPermissions = getGroupDefaultPermissions(user.grupo);
        permissions = groupPermissions;
      }

      setMenuPermissions(permissions);
      setOriginalPermissions({ ...permissions });
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  };

  const getGroupDefaultPermissions = (grupo: string): {[key: string]: MenuPermission} => {
    const permissions: {[key: string]: MenuPermission} = {};

    switch (grupo) {
      case 'Vendedores':
        ['dashboard', 'dashboard-principal', 'clientes', 'relatorios', 'relatorios-vendas'].forEach(menuId => {
          permissions[menuId] = {
            menuId,
            canView: true,
            canCreate: menuId === 'clientes',
            canEdit: menuId === 'clientes',
            canDelete: false,
            visible: true,
            order: 0
          };
        });
        break;
      
      case 'Financeiro':
        ['dashboard', 'dashboard-principal', 'financeiro', 'contas-receber', 'contas-pagar', 'fluxo-caixa', 'relatorios', 'relatorios-financeiro'].forEach(menuId => {
          permissions[menuId] = {
            menuId,
            canView: true,
            canCreate: menuId.includes('contas-'),
            canEdit: menuId.includes('contas-'),
            canDelete: false,
            visible: true,
            order: 0
          };
        });
        break;

      default:
        // Apenas visualização do dashboard
        permissions['dashboard'] = {
          menuId: 'dashboard',
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          visible: true,
          order: 0
        };
        permissions['dashboard-principal'] = {
          menuId: 'dashboard-principal',
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          visible: true,
          order: 0
        };
    }

    return permissions;
  };

  const buildTreeWithPermissions = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.map(node => {
      const permission = menuPermissions[node.id];
      const hasPermission = permission && permission.visible;
      
      let updatedNode: TreeNode = {
        ...node,
        checked: hasPermission,
        disabled: selectedUser?.isAdmin && node.id === 'dashboard' // Admin sempre tem dashboard
      };

      if (node.children) {
        updatedNode.children = buildTreeWithPermissions(node.children);
        
        // Determinar estado baseado nos filhos
        const childrenWithPermission = updatedNode.children.filter(child => child.checked);
        if (childrenWithPermission.length === updatedNode.children.length) {
          updatedNode.checked = true;
          updatedNode.indeterminate = false;
        } else if (childrenWithPermission.length > 0) {
          updatedNode.checked = false;
          updatedNode.indeterminate = true;
        } else {
          updatedNode.checked = false;
          updatedNode.indeterminate = false;
        }
      }

      return updatedNode;
    });
  };

  const handleSelectionChange = (checkedNodes: string[]) => {
    if (!selectedUser) return;

    const newPermissions = { ...menuPermissions };

    // Limpar todas as permissões primeiro
    Object.keys(newPermissions).forEach(menuId => {
      newPermissions[menuId] = {
        ...newPermissions[menuId],
        visible: false
      };
    });

    // Definir permissões para nós selecionados
    checkedNodes.forEach(menuId => {
      if (!newPermissions[menuId]) {
        newPermissions[menuId] = {
          menuId,
          canView: true,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          visible: true,
          order: 0
        };
      } else {
        newPermissions[menuId].visible = true;
      }
    });

    setMenuPermissions(newPermissions);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      // Preparar dados para envio
      const permissionsToSave = Object.values(menuPermissions).filter(p => p.visible);

      // Simular chamada para API
      // await fetch(`/api/users/${selectedUser.id}/menu-permissions`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(permissionsToSave)
      // });

      console.log('Salvando permissões para usuário:', selectedUser.nome, permissionsToSave);

      setOriginalPermissions({ ...menuPermissions });
      alert('Permissões salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      alert('Erro ao salvar permissões');
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja desfazer todas as alterações?')) {
      setMenuPermissions({ ...originalPermissions });
    }
  };

  const handleCopyFromAdmin = () => {
    if (window.confirm('Tem certeza que deseja copiar todas as permissões do Admin?')) {
      loadUserPermissions('1'); // ID do admin
    }
  };

  const usuarioOptions = usuarios.map(u => ({
    value: u.id.toString(),
    label: `${u.nome} (${u.login})`
  }));

  const treeWithPermissions = buildTreeWithPermissions(menuStructure);

  return (
    <FormContainer>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faUserCog} />
          Configuração de Menus por Usuário
        </Title>
      </Header>

      <Content>
        <FormSection>
          <SelectorPanel title="Seleção de Usuário">
            <UserSelector>
              <Select
                label="Usuário *"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                options={usuarioOptions}
              />
            </UserSelector>

            {selectedUser && (
              <UserInfo>
                <UserInfoTitle>Informações do Usuário</UserInfoTitle>
                <UserInfoText>
                  <strong>Nome:</strong> {selectedUser.nome}<br/>
                  <strong>Login:</strong> {selectedUser.login}<br/>
                  <strong>Grupo:</strong> {selectedUser.grupo}<br/>
                  <strong>Tipo:</strong> {selectedUser.isAdmin ? 'Administrador' : 'Usuário Padrão'}
                </UserInfoText>
              </UserInfo>
            )}

            <PermissionLegend>
              <LegendTitle>Legenda</LegendTitle>
              <LegendItem>
                <LegendIcon color="#10b981">
                  <FontAwesomeIcon icon={faEye} className="icon" />
                </LegendIcon>
                <span>Menu visível e acessível</span>
              </LegendItem>
              <LegendItem>
                <LegendIcon color="#f59e0b">
                  <FontAwesomeIcon icon={faEdit} className="icon" />
                </LegendIcon>
                <span>Parcialmente selecionado</span>
              </LegendItem>
              <LegendItem>
                <LegendIcon color="#ef4444">
                  <FontAwesomeIcon icon={faTrash} className="icon" />
                </LegendIcon>
                <span>Menu oculto</span>
              </LegendItem>
            </PermissionLegend>

            {selectedUser && !selectedUser.isAdmin && (
              <QuickActions>
                <SecondaryButton
                  onClick={handleCopyFromAdmin}
                  style={{ minWidth: 'auto', padding: '8px 16px' }}
                >
                  <FontAwesomeIcon icon={faCopy} />
                  Copiar do Admin
                </SecondaryButton>
              </QuickActions>
            )}
          </SelectorPanel>

          <TreePanel title="Estrutura de Menus">
            {selectedUser ? (
              <>
                {selectedUser.isAdmin && (
                  <UserInfoText style={{ marginBottom: '16px', padding: '12px', background: '#fef3c7', borderRadius: '6px', color: '#92400e' }}>
                    <strong>Usuário Administrador:</strong> Possui acesso completo a todos os menus por padrão. 
                    Algumas opções não podem ser removidas.
                  </UserInfoText>
                )}
                
                <TreeView
                  data={treeWithPermissions}
                  onSelectionChange={handleSelectionChange}
                  showCheckboxes={true}
                  multiSelect={true}
                  defaultExpandedNodes={['dashboard', 'cadastros', 'financeiro', 'relatorios', 'configuracoes']}
                />

                <Actions>
                  <SecondaryButton 
                    onClick={handleReset}
                    disabled={!hasChanges}
                  >
                    <FontAwesomeIcon icon={faUndo} />
                    Desfazer
                  </SecondaryButton>
                  <PrimaryButton 
                    onClick={handleSave}
                    disabled={!hasChanges}
                  >
                    <FontAwesomeIcon icon={faSave} />
                    Salvar Configurações
                  </PrimaryButton>
                </Actions>
              </>
            ) : (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#6b7280',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '2px dashed #d1d5db'
              }}>
                <FontAwesomeIcon icon={faUser} size="2x" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Selecione um Usuário</h3>
                <p style={{ margin: 0 }}>Escolha um usuário na lista ao lado para configurar suas permissões de menu</p>
              </div>
            )}
          </TreePanel>
        </FormSection>
      </Content>

      {/* Modal de confirmação para abandonar alterações */}
      <div data-confirm-modal-menu>
        <ConfirmDiscardChangesModal
          isOpen={showConfirmModal}
          onConfirm={() => {
            const modal = document.querySelector('[data-confirm-modal-menu]') as any;
            if (modal?._handleConfirm) modal._handleConfirm();
          }}
          onCancel={() => {
            const modal = document.querySelector('[data-confirm-modal-menu]') as any;
            if (modal?._handleCancel) modal._handleCancel();
          }}
          title="Abandonar Alterações nas Permissões?"
          message="Você possui alterações não salvas nas permissões de menu. Tem certeza que deseja fechar este formulário? Todas as alterações serão perdidas."
        />
      </div>
    </FormContainer>
  );
};

export default ConfiguracaoMenuForm;













