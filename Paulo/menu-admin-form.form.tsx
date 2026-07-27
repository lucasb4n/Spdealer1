// Arquivo .tsx para importação direta no FormBuilder (upload aceita .tsx/.ts/.jsx)
const menuAdminForm = {
  formId: 'user_menu_admin',
  label: 'Administração de Menu por Usuário',
  description: 'Formulário para o administrador configurar visibilidade e ordem dos itens de menu por usuário (menu_groups / menu_items / user_menu_config)',
  endpoints: {
    fetchUsers: '/api/admin/users',
    fetchMenuGroups: '/api/menu/groups',
    fetchMenuItems: '/api/menu/items',
    fetchUserConfig: '/api/admin/user-menu-config?usuarioId=',
    saveConfig: '/api/admin/user-menu-config'
  },
  fields: [
    {
      name: 'usuario',
      label: 'Usuário',
      type: 'autocomplete',
      required: true,
      source: 'fetchUsers',
      placeholder: 'Selecione o usuário a configurar'
    },
    {
      name: 'menu_structure',
      label: 'Estrutura de Menu',
      type: 'repeatable_section',
      description: 'Seções (grupos) com itens; admin pode marcar visível e ajustar ordem',
      source: 'fetchMenuGroups',
      item: {
        groupIdField: 'grupo_id',
        groupLabelField: 'nome',
        itemsSource: 'fetchMenuItems',
        fields: [
          { name: 'item_id', label: 'ID', type: 'hidden' },
          { name: 'item_nome', label: 'Nome', type: 'label' },
          { name: 'visivel', label: 'Visível', type: 'checkbox' },
          { name: 'ordem', label: 'Ordem', type: 'number', min: 0 }
        ]
      }
    }
  ],
  actions: [
    { name: 'carregar', label: 'Carregar Configuração', type: 'action', fetchUserConfig: true },
    { name: 'salvar', label: 'Salvar Configuração', type: 'submit', target: 'saveConfig' }
  ],
  metadata: {
    notes: 'Importar este arquivo no FormBuilder Editor (.tsx) ou usar como referência para implementação do TSX. Os endpoints devem existir no backend para listar usuários, grupos e itens de menu e para persistir user_menu_config.'
  }
};

export default menuAdminForm;
