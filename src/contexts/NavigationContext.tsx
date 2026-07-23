import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MenuService } from 'services/MenuService';
import { useAuth } from './AuthContext';

import { MenuGroup, MenuPermissao } from 'menu';

interface NavigationContextType {
  menuGroups: MenuGroup[];
  permissions: MenuPermissao[];
  activeMenu: string;
  activeSubmenu: string;
  isLoading: boolean;
  expandedMenus: string[];
  setActive: (menu: string, submenu?: string) => void;
  toggleSubmenu: (menuId: string) => void;
  isMenuExpanded: (menuId: string) => boolean;
  isMenuActive: (menu: string, submenu?: string) => boolean;
  hasPermission: (menuId: number, action: keyof MenuPermissao['permissao']) => boolean;

  refreshMenus: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const { user } = useAuth();
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [permissions, setPermissions] = useState<MenuPermissao[]>([]);
  const [activeMenu, setActiveMenu] = useState('');
  const [activeSubmenu, setActiveSubmenu] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const refreshMenus = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[NavigationContext] Iniciando refreshMenus...');
      
      let userId = user?.userId;
      
      if (!userId) {
        userId = localStorage.getItem('userId') || undefined;
        if (!userId) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userObj = JSON.parse(userStr);
              userId = userObj.userId || userObj.id || userObj.codigo;
            } catch (e) {}
          }
        }
      }
      
      if (!userId) {
        console.warn('[NavigationContext] userId não encontrado. Abortando refreshMenus.');
        setMenuGroups([]);
        return;
      }

      console.log('[NavigationContext] Buscando menus para userId:', userId);
      // Busca a árvore de menu já filtrada para o usuário
      const menuGroupsFromService = await MenuService.getMenuGroupsByUser(Number(userId));

      // Busca permissões detalhadas (opcional, se necessário para botões)
      const permissionData = await MenuService.getUserPermissions(Number(userId));

      // Também busca entradas dinâmicas em dictionary_tables para suportar menus gerados por metadata
      let dynamicEntries: any[] = [];
      try {
        const resp = await fetch('/api/dictionary/tables');
        if (resp.ok) {
          const allTables = await resp.json();
          // Filtra apenas entradas do grupo 'parametros' e subgrupo 'gerais'
          dynamicEntries = (allTables || []).filter((t: any) => {
            const mg = (t.menu_group || '').toLowerCase();
            const msub = (t.menu_subgroup || '').toLowerCase();
            return mg === 'parametros' && msub === 'gerais';
          });
        }
      } catch (e) {
        // ignore - leitura dinâmica não é crítica
      }

      // Mescla dynamicEntries dentro dos menuGroups (procura grupo 'Parâmetros' por name ou cria um)
      const mergedMenuGroups = [...(menuGroupsFromService || [])];
      // Tenta encontrar o grupo que representa 'parametros'
      const paramGroupIndex = mergedMenuGroups.findIndex(g => (g.name || '').toLowerCase() === 'parametros');
      let paramGroup = paramGroupIndex >= 0 ? mergedMenuGroups[paramGroupIndex] : null;
      if (!paramGroup && dynamicEntries.length > 0) {
        // Cria um grupo base simples
        paramGroup = {
          id: Date.now(),
          name: 'Parâmetros',
          icon: 'fa-cogs',
          order: 100,
          active: true,
          items: [] as any[],
        } as any;
        mergedMenuGroups.push(paramGroup as MenuGroup);
      }

      // Mapeia cada dynamicEntry para um MenuItem e adiciona se não existir
      if (paramGroup) {
        dynamicEntries.forEach((entry: any, idx: number) => {
          const existing = (paramGroup!.items || []).find((it: any) => (it.path || it.route || it.rota) === entry.frontend_route);
          if (!existing) {
            const menuItem = {
              id: -(idx + 1),
              parentId: null,
              codigo: entry.table_name,
              name: entry.menu_item || entry.display_name || entry.table_name,
              descricao: entry.description || entry.display_name || '',
              icon: entry.menu_icon || 'fa-layer-group',
              path: entry.frontend_route || entry.api_path || `/parametros/dictionary/${entry.table_name}/localizar`,
              rota: entry.frontend_route || entry.api_path,
              ordem: entry.menu_order || 0,
              filhos: [],
            } as any;
            if (!paramGroup!.items) paramGroup!.items = [];
            paramGroup!.items.push(menuItem);
          }
        });
      }

          // INJEÇÃO: adicionar dinamicamente o nó 'Manutenção' sob o item 'serviço', se existir
          try {
            const manutencaoChildrenBase = [
              { name: 'Mecânicos', path: '/servico/manutencao/mecanicos', rota: '/servico/manutencao/mecanicos' },
              // Rota de listagem para Tipo de T.M.O
              { name: 'Manutenção de Tipo de T.M.O', path: '/servico/manutencao/tipo-tmo', rota: '/servico/manutencao/tipo-tmo' },
              { name: 'Tempo de Mão-de-Obra', path: '/servico/manutencao/tempo-mdo', rota: '/servico/manutencao/tempo-mdo' },
              { name: 'Atualização preço de M.O', path: '/servico/manutencao/atualizacao-preco-mo', rota: '/servico/manutencao/atualizacao-preco-mo' },
              { name: 'Modelos de Máquinas', path: '/servico/manutencao/modelos-maquinas', rota: '/servico/manutencao/modelos-maquinas' },
              { name: 'Códigos de Grupo de Função', path: '/servico/manutencao/codigos-grupo-funcao', rota: '/servico/manutencao/codigos-grupo-funcao' },
              { name: 'Códigos de Defeito', path: '/servico/manutencao/codigos-defeito', rota: '/servico/manutencao/codigos-defeito' },
              { name: 'Código de Medidas', path: '/servico/manutencao/codigo-medidas', rota: '/servico/manutencao/codigo-medidas' },
              { name: 'Grupo de Reparo', path: '/servico/manutencao/grupo-reparo', rota: '/servico/manutencao/grupo-reparo' },
              { name: 'Venda Perdida', path: '/servico/manutencao/venda-perdida', rota: '/servico/manutencao/venda-perdida' },
              { name: 'Ficha de Segmento Ent. Técn.', path: '/servico/manutencao/ficha-segmento-ent-tec', rota: '/servico/manutencao/ficha-segmento-ent-tec' },
              { name: 'Manutenção de Peças Faltantes', path: '/servico/manutencao/manutencao-pecas-faltantes', rota: '/servico/manutencao/manutencao-pecas-faltantes' },
            ];

            mergedMenuGroups.forEach((g: any) => {
              // Se o grupo for 'Serviços' (plural) vamos adicionar o item 'Manutenção' como filho direto do grupo
              const groupTitle = ((g.name || g.label) || '').toString().toLowerCase();
              const isServicoGroup = ['serviço', 'servico', 'serviços', 'servicos'].includes(groupTitle);
              if (isServicoGroup) {
                g.items = g.items || [];
                const existsInGroup = g.items.some((it: any) => ((it.name || '').toString().toLowerCase() === 'manutenção' || (it.name || '').toString().toLowerCase() === 'manutencao'));
                if (!existsInGroup) {
                  const baseId = -Date.now();
                  const manutencaoItem: any = {
                    id: baseId,
                    parentId: null,
                    codigo: 'SERVICO.MANUTENCAO',
                    name: 'Manutenção',
                    descricao: 'Manutenção',
                    icon: 'fa-wrench',
                    // apontar para a listagem de Tipo de T.M.O por padrão
                    route: '/servico/manutencao/tipo-tmo',
                    path: '/servico/manutencao/tipo-tmo',
                    rota: '/servico/manutencao/tipo-tmo',
                    ordem: 99,
                    nivel: 1,
                    active: true,
                    filhos: manutencaoChildrenBase.map((c, i) => ({
                      id: baseId - (i + 1),
                      parentId: baseId,
                      codigo: `SERVICO.MANUTENCAO.${i+1}`,
                      name: c.name,
                      descricao: c.name,
                      path: c.path,
                      rota: c.rota,
                      route: c.path,
                      ordem: i,
                      nivel: 2,
                      active: true,
                      filhos: []
                    }))
                  };
                  g.items.push(manutencaoItem);
                }
              }

              // Também verifica itens individuais chamados 'serviço' (caso exista um item específico)
              (g.items || []).forEach((it: any) => {
                const title = ((it.name || it.descricao) || '').toString().toLowerCase();
                if (['serviço', 'servico', 'serviços', 'servicos'].includes(title)) {
                  it.filhos = it.filhos || [];
                  const existsManut = it.filhos.some((f: any) => ((f.name || '').toString().toLowerCase() === 'manutenção' || (f.name || '').toString().toLowerCase() === 'manutencao'));
                  if (!existsManut) {
                    const baseId = -Date.now();
                    const manutencaoItem: any = {
                      id: baseId,
                      parentId: it.id || null,
                      name: 'Manutenção',
                      descricao: 'Manutenção',
                      icon: 'fa-wrench',
                      path: '/servico/manutencao/tipo-tmo',
                      rota: '/servico/manutencao/tipo-tmo',
                      ordem: 0,
                      filhos: manutencaoChildrenBase.map((c, i) => ({
                        id: baseId - (i + 1),
                        parentId: baseId,
                        name: c.name,
                        descricao: c.name,
                        path: c.path,
                        rota: c.rota,
                        ordem: i,
                        filhos: []
                      }))
                    };
                    it.filhos.push(manutencaoItem);
                  }
                }
              });
            });

            // INJEÇÃO: Corrigir rota de Clientes se estiver apontando para /novo
            mergedMenuGroups.forEach((g: any) => {
              (g.items || []).forEach((it: any) => {
                const name = (it.name || '').toString().toLowerCase();
                if (name === 'clientes' || name === 'cadastro de clientes') {
                  const currentPath = it.path || it.route || it.rota;
                  if (currentPath === '/cadastros/clientes/novo') {
                    it.path = '/cadastros/clientes';
                    it.route = '/cadastros/clientes';
                    it.rota = '/cadastros/clientes';
                  }
                }
                // Também verifica filhos
                if (it.filhos && Array.isArray(it.filhos)) {
                  it.filhos.forEach((f: any) => {
                    const fname = (f.name || '').toString().toLowerCase();
                    if (fname === 'clientes' || fname === 'cadastro de clientes') {
                      const fpath = f.path || f.route || f.rota;
                      if (fpath === '/cadastros/clientes/novo' || fpath === '/clientes/novo') {
                        f.path = '/cadastros/clientes';
                        f.route = '/cadastros/clientes';
                        f.rota = '/cadastros/clientes';
                      }
                    }
                  });
                }
              });
            });
          } catch (e) {
            // noop - não bloquear carregamento de menus se algo falhar na injeção
          }

      setMenuGroups(mergedMenuGroups);
      setPermissions(permissionData);
    } catch (error) {
      console.error('[NavigationContext] Erro ao carregar menus:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    refreshMenus();
  }, [refreshMenus]);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const setActive = (menu: string, submenu: string = '') => {
    setActiveMenu(menu);
    setActiveSubmenu(submenu);
    
    // Se for um submenu, expande o menu pai automaticamente
    if (submenu) {
      setExpandedMenus(prev => 
        prev.includes(menu) ? prev : [...prev, menu]
      );
    }
  };

  const isMenuExpanded = (menuId: string): boolean => expandedMenus.includes(menuId);

  const isMenuActive = (menu: string, submenu: string = ''): boolean => {
    return activeMenu === menu && activeSubmenu === submenu;
  };

  const hasPermission = (menuId: number, action: keyof MenuPermissao['permissao']): boolean => {
    const permission = permissions.find(p => p.menuId === menuId);
    return permission ? permission.permissao[action] : false;
  };

  return (
    <NavigationContext.Provider
      value={{
        menuGroups,
        permissions,
        activeMenu,
        activeSubmenu,
        isLoading,
        expandedMenus,
        setActive,
        toggleSubmenu,
        isMenuExpanded,
        isMenuActive,
        hasPermission,
        refreshMenus
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation deve ser usado dentro de um NavigationProvider');
  }
  return context;
}













