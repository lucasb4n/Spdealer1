/**
 * DashboardMappers.ts
 * 
 * Mappers para conversão entre formatos:
 * - ClientSideWidget ↔ BackendDashboardWidget
 * - ClientSideDashboardConfig ↔ BackendDashboardConfig
 * 
 * Garantem sincronização perfeita entre editor e backend.
 */

import {
  parseJsonSafe,
  stringifyJsonSafe,
  decodeMojibake,
  toNumOrDefault,
} from './DashboardRenderUtils';
import {
  BackendDashboardWidget,
  BackendDashboardConfig,
  ClientSideWidget,
  ClientSideDashboardConfig,
} from 'dashboard';

// ============================================================================
// MAPPERS: Backend → ClientSide
// ============================================================================

/**
 * Converte BackendDashboardWidget para ClientSideWidget
 * Parse JSON strings, normaliza property names (snake_case → camelCase)
 */
export function mapBackendWidgetToClientSide(
  widget: BackendDashboardWidget
): ClientSideWidget {
  return {
    id: widget.id,
    widgetId: widget.widget_id,
    title: widget.title,
    widgetType: widget.widget_type,
    
    positionX: toNumOrDefault(widget.position_x, 0),
    positionY: toNumOrDefault(widget.position_y, 0),
    width: toNumOrDefault(widget.width, 300),
    height: toNumOrDefault(widget.height, 200),
    zIndex: toNumOrDefault(widget.z_index, 1),
    
    isVisible: widget.is_visible ?? true,
    isLocked: widget.is_locked ?? false,
    
    dataConfig: parseJsonSafe(widget.data_config, undefined) || undefined,
    visualConfig: parseJsonSafe(widget.visual_config, undefined) || undefined,
    behaviorConfig: parseJsonSafe(widget.behavior_config, undefined) || undefined,
  };
}

/**
 * Converte BackendDashboardConfig para ClientSideDashboardConfig
 */
export function mapBackendDashboardToClientSide(
  dashboard: BackendDashboardConfig
): ClientSideDashboardConfig {
  return {
    id: dashboard.id,
    name: decodeMojibake(dashboard.name),
    description: dashboard.description ? decodeMojibake(dashboard.description) : undefined,
    isActive: dashboard.is_active ?? true,
    isDefault: dashboard.is_default ?? false,
    
    themeConfig: parseJsonSafe(dashboard.theme_config, null),
    canvasConfig: parseJsonSafe(dashboard.canvas_config, null),
    
    widgets: (dashboard.widgets || []).map(mapBackendWidgetToClientSide),
  };
}

// ============================================================================
// MAPPERS: ClientSide → Backend
// ============================================================================

/**
 * Converte ClientSideWidget para BackendDashboardWidget
 * Serializa objetos para JSON strings, normaliza property names (camelCase → snake_case)
 */
export function mapClientSideWidgetToBackend(
  widget: ClientSideWidget
): BackendDashboardWidget {
  return {
    id: widget.id,
    widget_id: widget.widgetId,
    title: widget.title,
    widget_type: widget.widgetType,
    
    position_x: widget.positionX,
    position_y: widget.positionY,
    width: widget.width,
    height: widget.height,
    z_index: widget.zIndex,
    
    is_visible: widget.isVisible,
    is_locked: widget.isLocked,
    
    data_config: widget.dataConfig ? stringifyJsonSafe(widget.dataConfig) : null,
    visual_config: widget.visualConfig ? stringifyJsonSafe(widget.visualConfig) : null,
    behavior_config: widget.behaviorConfig ? stringifyJsonSafe(widget.behaviorConfig) : null,
  };
}

/**
 * Converte ClientSideDashboardConfig para BackendDashboardConfig
 */
export function mapClientSideDashboardToBackend(
  dashboard: ClientSideDashboardConfig
): BackendDashboardConfig {
  return {
    id: dashboard.id,
    name: dashboard.name,
    description: dashboard.description,
    is_active: dashboard.isActive,
    is_default: dashboard.isDefault,
    
    theme_config: dashboard.themeConfig ? stringifyJsonSafe(dashboard.themeConfig) : null,
    canvas_config: dashboard.canvasConfig ? stringifyJsonSafe(dashboard.canvasConfig) : null,
    
    widgets: (dashboard.widgets || []).map(mapClientSideWidgetToBackend),
  };
}

// ============================================================================
// PARTIAL UPDATES (para sync incremental)
// ============================================================================

/**
 * Mapeia atualizações parciais de ClientSideWidget para BackendDashboardWidget
 * Apenas serializa os campos que foram atualizados
 */
export function mapClientSideWidgetPartialToBackend(
  updates: Partial<ClientSideWidget>
): Partial<BackendDashboardWidget> {
  const result: Partial<BackendDashboardWidget> = {};
  
  if (updates.widgetId) result.widget_id = updates.widgetId;
  if (updates.title) result.title = updates.title;
  if (updates.widgetType) result.widget_type = updates.widgetType;
  
  if (updates.positionX !== undefined) result.position_x = updates.positionX;
  if (updates.positionY !== undefined) result.position_y = updates.positionY;
  if (updates.width !== undefined) result.width = updates.width;
  if (updates.height !== undefined) result.height = updates.height;
  if (updates.zIndex !== undefined) result.z_index = updates.zIndex;
  
  if (updates.isVisible !== undefined) result.is_visible = updates.isVisible;
  if (updates.isLocked !== undefined) result.is_locked = updates.isLocked;
  
  if (updates.dataConfig !== undefined) {
    result.data_config = updates.dataConfig ? stringifyJsonSafe(updates.dataConfig) : null;
  }
  if (updates.visualConfig !== undefined) {
    result.visual_config = updates.visualConfig ? stringifyJsonSafe(updates.visualConfig) : null;
  }
  if (updates.behaviorConfig !== undefined) {
    result.behavior_config = updates.behaviorConfig ? stringifyJsonSafe(updates.behaviorConfig) : null;
  }
  
  return result;
}

// ============================================================================
// MERGE UTILITIES (para atualizar configs parcialmente)
// ============================================================================

/**
 * Mescla atualizações parciais em um ClientSideWidget
 * Preserva campos não alterados
 */
export function mergeWidgetUpdates(
  original: ClientSideWidget,
  updates: Partial<ClientSideWidget>
): ClientSideWidget {
  return {
    ...original,
    ...updates,
    // Merge deep para configs JSON
    dataConfig: updates.dataConfig !== undefined
      ? updates.dataConfig
      : original.dataConfig,
    visualConfig: updates.visualConfig !== undefined
      ? updates.visualConfig
      : original.visualConfig,
    behaviorConfig: updates.behaviorConfig !== undefined
      ? updates.behaviorConfig
      : original.behaviorConfig,
  };
}

/**
 * Mescla atualizações parciais em um ClientSideDashboardConfig
 */
export function mergeDashboardUpdates(
  original: ClientSideDashboardConfig,
  updates: Partial<ClientSideDashboardConfig>
): ClientSideDashboardConfig {
  return {
    ...original,
    ...updates,
    themeConfig: updates.themeConfig !== undefined
      ? updates.themeConfig
      : original.themeConfig,
    canvasConfig: updates.canvasConfig !== undefined
      ? updates.canvasConfig
      : original.canvasConfig,
    widgets: updates.widgets !== undefined
      ? updates.widgets
      : original.widgets,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const DashboardMappers = {
  // Backend → ClientSide
  mapBackendWidgetToClientSide,
  mapBackendDashboardToClientSide,
  
  // ClientSide → Backend
  mapClientSideWidgetToBackend,
  mapClientSideDashboardToBackend,
  
  // Partials
  mapClientSideWidgetPartialToBackend,
  
  // Merge
  mergeWidgetUpdates,
  mergeDashboardUpdates,
};

export default DashboardMappers;













