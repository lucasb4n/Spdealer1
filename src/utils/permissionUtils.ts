// src/utils/permissionUtils.ts

export interface UserPermission {
  programId: number;
  visivel: boolean;
  editar: boolean;
  excluir: boolean;
  visualizar: boolean;
}

/**
 * Converte a string de permissões do banco para array de objetos
 * Suporta tanto o formato antigo (CSV de IDs) quanto o novo (JSON)
 */
export const parsePermissions = (permissionsStr: string | undefined | null): UserPermission[] => {
  if (!permissionsStr) return [];

  // Se começar com [, assumimos que é JSON
  if (permissionsStr.trim().startsWith('[')) {
    try {
      return JSON.parse(permissionsStr);
    } catch (e) {
      console.error('[Permissions] Erro ao parsear JSON de permissões:', e);
    }
  }

  // Fallback: Formato antigo (ID1,ID2,ID3)
  // Converte para o novo formato com todas as flags ligadas (compatibilidade)
  try {
    return permissionsStr.split(',')
      .map(id => id.trim())
      .filter(id => id !== '')
      .map(id => ({
        programId: parseInt(id),
        visivel: true,
        editar: true,
        excluir: true,
        visualizar: true
      }));
  } catch (e) {
    return [];
  }
};

/**
 * Verifica se um usuário tem determinada permissão em uma rotina
 */
export const hasPermission = (
  permissions: UserPermission[] | string | undefined | null,
  programId: number,
  field: keyof Omit<UserPermission, 'programId'>
): boolean => {
  const perms = typeof permissions === 'string' ? parsePermissions(permissions) : (permissions || []);
  
  // Se for admin (pode vir de outra flag no user), geralmente tem tudo
  // Mas aqui verificamos a lista explícita
  const perm = perms.find(p => p.programId === programId);
  if (!perm) return false;
  
  return !!perm[field];
};

/**
 * Verifica permissão por código (se disponível no mapeamento)
 */
export const hasPermissionByCode = (
  permissions: UserPermission[] | string | undefined | null,
  programCode: string,
  field: keyof Omit<UserPermission, 'programId'>,
  menuItems: any[] = [] // Opcional: lista de itens de menu para mapear código -> ID
): boolean => {
  // Por enquanto, o sistema usa majoritariamente o ID (programId) vindo do menu_items
  // Se tivermos a lista de itens, podemos mapear
  const item = menuItems.find(m => m.codigo === programCode);
  if (!item) return false;
  
  return hasPermission(permissions, item.id, field);
};













