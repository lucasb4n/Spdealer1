import axios from 'axios';
import type { MenuItem, MenuPermissao } from 'menu';

import { API_BASE_URL } from './apiConfig';

const API_URL = API_BASE_URL;

export class MenuService {
  // =========== MÉTODOS PARA NOVA ESTRUTURA 5 TABELAS ===========
  
  /**
   * Busca dashboard completo usando nova estrutura 5 tabelas
   */
  static async getDashboardByUserId(userId: number): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/v2/dashboard/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dashboard (5 tabelas):', error);
      throw error;
    }
  }
  
  /**
   * Executa query de um widget específico
   */
  static async getWidgetData(widgetId: number): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/v2/widget/${widgetId}/data`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados do widget:', error);
      throw error;
    }
  }
  
  /**
   * Cria novo dashboard na estrutura 5 tabelas
   */
  static async createDashboard(dashboardData: {
    userId: number;
    title: string;
    description: string;
    themeConfig: any;
    canvasConfig: any;
  }): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/v2/dashboard`, dashboardData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar dashboard:', error);
      throw error;
    }
  }
  
  // =========== MÉTODOS LEGADOS (mantidos para compatibilidade) ===========
  /**
   * MÉTODO LEGADO: Busca grupos de menu já filtrados por usuário (árvore dinâmica)
   */
  static async getMenuGroupsByUser(userId: number): Promise<import('../types/menu').MenuGroup[]> {
    try {
      const response = await axios.get(`${API_URL}/menu-groups/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar menu dinâmico do usuário:', error);
      throw error;
    }
  }
  // Busca todos os grupos de menu com seus itens
  static async getAllMenuGroups(): Promise<import('../types/menu').MenuGroup[]> {
    try {
      const response = await axios.get(`${API_URL}/menu-groups`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar grupos de menu:', error);
      throw error;
    }
  }

  static async getUserPermissions(userId: number): Promise<MenuPermissao[]> {
    try {
      const response = await axios.get(`${API_URL}/menus/permissions/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      throw error;
    }
  }

  private static buildMenuTree(menus: MenuItem[]): MenuItem[] {
    // Ordena os menus por ordem e nível
    const sortedMenus = [...menus].sort((a, b) => {
      const ordemA = a.ordem ?? 0;
      const ordemB = b.ordem ?? 0;
      const nivelA = a.nivel ?? 0;
      const nivelB = b.nivel ?? 0;
      if (nivelA === nivelB) {
        return ordemA - ordemB;
      }
      return nivelA - nivelB;
    });

    // Cria um mapa para acesso rápido aos menus
    const menuMap = new Map<number, MenuItem>();
    sortedMenus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, filhos: [] });
    });

    // Constrói a árvore de menus
    const rootMenus: MenuItem[] = [];
    sortedMenus.forEach(menu => {
      const menuWithChildren = menuMap.get(menu.id)!;
      
      if (menu.parentId === null) {
        rootMenus.push(menuWithChildren);
      } else {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.filhos = parent.filhos || [];
          parent.filhos.push(menuWithChildren);
        }
      }
    });

    return rootMenus;
  }

  static async saveMenu(menu: Partial<MenuItem>): Promise<MenuItem> {
    try {
      const response = await axios.post(`${API_URL}/menus`, menu);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar menu:', error);
      throw error;
    }
  }

  static async updateMenu(id: number, menu: Partial<MenuItem>): Promise<MenuItem> {
    try {
      const response = await axios.put(`${API_URL}/menus/${id}`, menu);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar menu:', error);
      throw error;
    }
  }

  static async deleteMenu(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/menus/${id}`);
    } catch (error) {
      console.error('Erro ao excluir menu:', error);
      throw error;
    }
  }

  static async savePermissions(userId: number, menuId: number, permissions: MenuPermissao['permissao']): Promise<void> {
    try {
      await axios.post(`${API_URL}/menus/permissions`, {
        userId,
        menuId,
        permissao: permissions
      });
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      throw error;
    }
  }
}













