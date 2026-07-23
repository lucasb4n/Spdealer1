export interface MenuGroup {
  id: number;
  name: string;
  icon: string;
  order: number;
  active: boolean;
  items: MenuItem[];
}
export interface MenuItem {
  id: number;
  parentId: number | null;
  codigo: string;
  name: string; // Adicionado para refletir o backend
  descricao: string;
  icon: string;
  route?: string; // garantir compatibilidade com backend
  path?: string;
  ordem?: number;
  order?: number;
  nivel?: number;
  active?: boolean;
  ativo?: boolean;
  filhos?: MenuItem[];
}

export interface MenuPermissao {
  userId: number;
  menuId: number;
  permissao: {
    visualizar: boolean;
    incluir: boolean;
    alterar: boolean;
    excluir: boolean;
  };
}

export interface MenuState {
  menus: MenuItem[];
  loading: boolean;
  error: string | null;
}













