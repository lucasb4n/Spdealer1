/**
 * DashboardRenderUtils.ts
 * 
 * Funções compartilhadas entre DynamicDashboard e DashboardBuilder
 * para garantir renderização fiel e sem duplicação de código.
 * 
 * - Mappers: ClientSide ↔ Backend
 * - Normalizations: Theme, Canvas, Widget Payloads
 * - Validações: Dados, JSONs, Configs
 * - Utilitários: Coerção, Parsing, Defaults
 */

import { parseDateLocal } from 'utils/dateUtils';

// ============================================================================
// TIPOS E INTERFACES (reutilizáveis)
// ============================================================================

export interface DashboardTheme {
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface CanvasConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  gridSize?: number;
  snapToGrid?: boolean;
  showGrid?: boolean;
  padding?: string;
}

export type WidgetType =
  | 'kpi'
  | 'chart'
  | 'list'
  | 'aggrid'
  | 'text'
  | 'image'
  | 'chat'
  | 'container';

// ============================================================================
// CONSTANTES E DEFAULTS
// ============================================================================

export const DEFAULT_THEME: DashboardTheme = {
  backgroundColor: '#ffffff',
  fontFamily: 'sans-serif',
};

export const DEFAULT_CANVAS: CanvasConfig = {
  backgroundColor: 'transparent',
  gridSize: 10,
  snapToGrid: true,
  showGrid: false,
};

export const DEFAULT_WIDGET_SIZE = {
  MIN_WIDTH: 100,
  MIN_HEIGHT: 80,
  DEFAULT_WIDTH: 300,
  DEFAULT_HEIGHT: 200,
};

// ============================================================================
// COERÇÃO E PARSING SEGURO
// ============================================================================

/**
 * Converte valor para número, retorna undefined se inválido
 */
export function toNum(v?: number | string | null): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Converte valor para número com fallback
 */
export function toNumOrDefault(v?: number | string | null, fallback = 0): number {
  const num = toNum(v);
  return num !== undefined ? num : fallback;
}

/**
 * Parse JSON seguro com fallback
 */
export function parseJsonSafe<T = any>(json: string | null | undefined, fallback: T): T {
  if (!json || typeof json !== 'string') return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Stringify JSON com fallback
 */
export function stringifyJsonSafe(obj: any, fallback = '{}'): string {
  if (obj === null || obj === undefined) return fallback;
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

// ============================================================================
// NORMALIZATIONS (Theme, Canvas, Payloads)
// ============================================================================

/**
 * Normaliza theme config com fallbacks
 */
export function normalizeTheme(theme?: DashboardTheme | string | null): DashboardTheme {
  let parsed = theme;
  if (typeof theme === 'string') {
    parsed = parseJsonSafe(theme, {});
  }
  if (!parsed || typeof parsed !== 'object') {
    return DEFAULT_THEME;
  }
  return {
    primaryColor: (parsed as any)?.primaryColor || '',
    backgroundColor: (parsed as any)?.backgroundColor || DEFAULT_THEME.backgroundColor,
    borderRadius: (parsed as any)?.borderRadius || '',
    fontFamily: (parsed as any)?.fontFamily || DEFAULT_THEME.fontFamily,
  };
}

/**
 * Normaliza canvas config com fallbacks
 */
export function normalizeCanvas(canvas?: CanvasConfig | string | null): CanvasConfig {
  let parsed = canvas;
  if (typeof canvas === 'string') {
    parsed = parseJsonSafe(canvas, {});
  }
  if (!parsed || typeof parsed !== 'object') {
    return DEFAULT_CANVAS;
  }
  return {
    width: toNum((parsed as any)?.width),
    height: toNum((parsed as any)?.height),
    backgroundColor: (parsed as any)?.backgroundColor || DEFAULT_CANVAS.backgroundColor,
    gridSize: toNumOrDefault((parsed as any)?.gridSize, DEFAULT_CANVAS.gridSize),
    snapToGrid: (parsed as any)?.snapToGrid ?? DEFAULT_CANVAS.snapToGrid,
    showGrid: (parsed as any)?.showGrid ?? DEFAULT_CANVAS.showGrid,
    padding: (parsed as any)?.padding || DEFAULT_CANVAS.padding,
  };
}

/**
 * Normaliza payload de dados de widget para forma consistente
 * Retorna sempre: { rows?, columns?, value?, data? }
 */
export function normalizeWidgetPayload(payload: any): Record<string, any> {
  if (!payload) return {};

  // Se já contém os campos esperados, normaliza
  if (payload.rows || payload.columns || payload.value !== undefined || payload.data) {
    const out: Record<string, any> = {};
    if (payload.rows) out.rows = payload.rows;
    if (payload.columns) out.columns = payload.columns;
    if (payload.value !== undefined) out.value = payload.value;
    if (payload.data) out.data = payload.data;
    if (!out.value && payload.data?.value !== undefined) out.value = payload.data.value;
    return out;
  }

  // Se array, trata como rows
  if (Array.isArray(payload)) return { rows: payload };

  // Se { result: [...] }, normaliza
  if (payload.result && Array.isArray(payload.result)) return { rows: payload.result };

  // Se { payload: { rows: [...] } }, descompacta
  if (payload.payload?.rows) return { rows: payload.payload.rows, columns: payload.payload.columns };

  // Se objeto simples com uma chave numérica, trata como KPI value
  const keys = Object.keys(payload || {});
  if (keys.length === 1 && typeof payload[keys[0]] === 'number') {
    return { value: payload[keys[0]] };
  }

  return { data: payload };
}

// ============================================================================
// CONTAINER UTILITIES
// ============================================================================

/**
 * Extrai IDs de widgets filhos a partir do visual_config de um container
 */
export function extractContainerChildIds(visual?: Record<string, any>): string[] {
  if (!visual) return [];
  const group = visual.group_config || visual.group || {};

  // 1) children: ["widget_id_1", "widget_id_2"]
  if (Array.isArray(group.children)) {
    return group.children
      .map((c: any) => (typeof c === 'string' ? c : c?.widget_id || c?.widgetId))
      .filter(Boolean);
  }

  // 2) columns: [{ items: [{ widgetId: "..." }] }]
  if (Array.isArray(group.columns)) {
    const ids: string[] = [];
    for (const col of group.columns) {
      const items = col?.items || col?.widgets || [];
      if (Array.isArray(items)) {
        for (const it of items) {
          const wid = it?.widget_id || it?.widgetId || (typeof it === 'string' ? it : undefined);
          if (wid) ids.push(wid);
        }
      } else {
        const wid = items?.widget_id || items?.widgetId;
        if (wid) ids.push(wid);
      }
    }
    return ids;
  }

  return [];
}

// ============================================================================
// DECODIFICAÇÃO DE CARACTERES (Mojibake fix)
// ============================================================================

/**
 * Decodifica strings com mojibake (encoding errors em português)
 */
export function decodeMojibake(s: string): string {
  if (!s || typeof s !== 'string') return s;
  return s
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã£/g, 'ã')
    .replace(/Ã§/g, 'ç')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã´/g, 'ô')
    .replace(/Á/g, 'Á')
    .replace(/Ã‰/g, 'É');
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Valida dimensões de widget
 */
export function validateWidgetSize(
  width?: number,
  height?: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (width !== undefined && width < DEFAULT_WIDGET_SIZE.MIN_WIDTH) {
    errors.push({
      field: 'width',
      message: `Largura mínima: ${DEFAULT_WIDGET_SIZE.MIN_WIDTH}px`,
    });
  }
  
  if (height !== undefined && height < DEFAULT_WIDGET_SIZE.MIN_HEIGHT) {
    errors.push({
      field: 'height',
      message: `Altura mínima: ${DEFAULT_WIDGET_SIZE.MIN_HEIGHT}px`,
    });
  }
  
  return errors;
}

/**
 * Valida posicionamento de widget
 */
export function validateWidgetPosition(x?: number, y?: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (x !== undefined && x < 0) {
    errors.push({ field: 'positionX', message: 'X não pode ser negativo' });
  }
  
  if (y !== undefined && y < 0) {
    errors.push({ field: 'positionY', message: 'Y não pode ser negativo' });
  }
  
  return errors;
}

/**
 * Valida configuração de dados (data_config)
 */
export function validateDataConfig(
  widgetType: WidgetType,
  dataConfig?: Record<string, any>
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!dataConfig) return errors;
  
  // Para widgets que precisam de query
  if (['kpi', 'chart', 'list', 'aggrid'].includes(widgetType)) {
    const queryId = dataConfig.queryId || dataConfig.query_id;
    if (!queryId) {
      errors.push({
        field: 'dataConfig.queryId',
        message: 'Selecione uma query para este widget',
      });
    }
  }
  
  return errors;
}

/**
 * Valida JSON stringificado
 */
export function validateJsonString(jsonStr: string | null): ValidationError[] {
  if (!jsonStr) return [];
  
  try {
    JSON.parse(jsonStr);
    return [];
  } catch (err: any) {
    return [
      {
        field: 'json',
        message: `JSON inválido: ${err?.message}`,
      },
    ];
  }
}

// ============================================================================
// UTILITÁRIOS DE RENDERIZAÇÃO
// ============================================================================

/**
 * Renderiza texto estilizado conforme textConfig
 */
export function renderStyledText(textConfig: any): string {
  if (!textConfig) return '';
  if (typeof textConfig === 'string' || typeof textConfig === 'number') return String(textConfig);
  if (Array.isArray(textConfig)) return textConfig.map((t) => renderStyledText(t)).join(', ');
  if (typeof textConfig === 'object' && textConfig.text) return String(textConfig.text);
  return '';
}

/**
 * Obtém safe text de qualquer tipo
 */
export function getSafeText(v: any): string {
  if (v === undefined || v === null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(getSafeText).join(', ');
  if (typeof v === 'object') {
    if (v.text) return String(v.text);
    if (v.label) return String(v.label);
    if (v.name) return String(v.name);
    return JSON.stringify(v);
  }
  return String(v);
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number, locale = 'pt-BR', currency = 'BRL'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

/**
 * Formata data
 */
export function formatDate(date: string | Date, locale = 'pt-BR'): string {
  try {
    const d = typeof date === 'string' ? parseDateLocal(date) : date;
    if (!d) return String(date);
    return new Intl.DateTimeFormat(locale).format(d as Date);
  } catch {
    return String(date);
  }
}

// ============================================================================
// NORMALIZAÇÃO AVANÇADA - DashboardRenderEngine (Phase 3)
// ============================================================================

/**
 * Normaliza canvas config para renderização.
 * GARANTIA: Todos os valores possuem fallbacks seguros.
 */
export function normalizeCanvasConfigForRender(rawConfig: any): any {
  if (!rawConfig) {
    return {
      width: 1200,
      height: 800,
      backgroundColor: '#ffffff',
      padding: 20,
      margin: 10,
      gridSize: 20,
      showGrid: false,
      snapToGrid: true,
      container_centered: true,
      container_padding: 20,
      border_color: '#e5e7eb',
      border_width: 1,
      border_radius: 0,
      box_shadow: 'none',
    };
  }

  return {
    width: toNum(rawConfig.width) || 1200,
    height: toNum(rawConfig.height) || 800,
    backgroundColor: rawConfig.backgroundColor || '#ffffff',
    padding: toNum(rawConfig.padding) || 20,
    margin: toNum(rawConfig.margin) || 10,
    gridSize: toNum(rawConfig.gridSize) || 20,
    showGrid: rawConfig.showGrid !== false,
    snapToGrid: rawConfig.snapToGrid !== false,
    container_centered: rawConfig.container_centered !== false,
    container_padding: toNum(rawConfig.container_padding) || 20,
    border_color: rawConfig.border_color || '#e5e7eb',
    border_width: toNum(rawConfig.border_width) || 1,
    border_radius: toNum(rawConfig.border_radius) || 0,
    box_shadow: rawConfig.box_shadow || 'none',
  };
}

/**
 * Normaliza widget visual config para renderização.
 * Garante que visual_config tenha todos os valores esperados.
 */
export function normalizeWidgetVisualConfig(rawVisualConfig: any, widgetType?: string): any {
  if (!rawVisualConfig) {
    // Retorna visual config padrão baseado no tipo de widget
    return {
      group_id: null,
      card_bg: '#ffffff',
      card_border_color: '#e5e7eb',
      card_border_width: 1,
      card_border_radius: 8,
      card_shadow: 'none',
      title_color: '#374151',
      title_font_size: 14,
      title_font_weight: 500,
      text_color: '#6b7280',
      text_font_size: 12,
    };
  }

  return {
    group_id: rawVisualConfig.group_id || null,
    card_bg: rawVisualConfig.card_bg || '#ffffff',
    card_border_color: rawVisualConfig.card_border_color || '#e5e7eb',
    card_border_width: toNum(rawVisualConfig.card_border_width) || 1,
    card_border_radius: toNum(rawVisualConfig.card_border_radius) || 8,
    card_shadow: rawVisualConfig.card_shadow || 'none',
    title_color: rawVisualConfig.title_color || '#374151',
    title_font_size: toNum(rawVisualConfig.title_font_size) || 14,
    title_font_weight: toNum(rawVisualConfig.title_font_weight) || 500,
    text_color: rawVisualConfig.text_color || '#6b7280',
    text_font_size: toNum(rawVisualConfig.text_font_size) || 12,
    
    // Específico para KPI
    ...(widgetType === 'kpi' && {
      kpi_value_font_size: toNum(rawVisualConfig.kpi_value_font_size) || 32,
      kpi_value_color: rawVisualConfig.kpi_value_color || '#1f2937',
      kpi_aggregation: rawVisualConfig.kpi_aggregation || 'sum',
    }),
    
    // Específico para Chart
    ...(widgetType === 'chart' && {
      chart_type: rawVisualConfig.chart_type || 'line',
      chart_colors: rawVisualConfig.chart_colors || ['#2563eb', '#dc2626', '#16a34a'],
      chart_show_legend: rawVisualConfig.chart_show_legend !== false,
    }),
    
    // Específico para AgGrid
    ...(widgetType === 'aggrid' && {
      aggrid_theme: rawVisualConfig.aggrid_theme || 'light',
      aggrid_row_height: toNum(rawVisualConfig.aggrid_row_height) || 30,
      aggrid_header_height: toNum(rawVisualConfig.aggrid_header_height) || 35,
    }),
  };
}

/**
 * Normaliza widget data config para renderização.
 */
export function normalizeWidgetDataConfig(rawDataConfig: any, widgetType?: string): any {
  if (!rawDataConfig) {
    return {
      query_id: null,
      data_source: 'api',
      refresh_interval: 0,
      cache_enabled: true,
    };
  }

  return {
    query_id: rawDataConfig.query_id || null,
    data_source: rawDataConfig.data_source || 'api',
    refresh_interval: toNum(rawDataConfig.refresh_interval) || 0,
    cache_enabled: rawDataConfig.cache_enabled !== false,
    
    // Dados em si
    rows: rawDataConfig.rows || [],
    columns: rawDataConfig.columns || [],
    value: rawDataConfig.value || null,
    
    ...rawDataConfig,
  };
}

/**
 * Normaliza widget para renderização.
 * GARANTIA: Widget sempre terá todos os campos esperados com valores seguros.
 */
export function normalizeWidgetForRender(widget: any, mode: 'edit' | 'preview' | 'view'): any {
  if (!widget) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      widgetId: 'unknown',
      title: 'Unknown Widget',
      widgetType: 'text',
      positionX: 0,
      positionY: 0,
      width: 300,
      height: 200,
      zIndex: 1,
      isVisible: true,
      isLocked: false,
      dataConfig: null,
      visualConfig: null,
      behaviorConfig: null,
      showEditControls: mode === 'edit',
      showBorders: mode === 'edit',
      isDraggable: mode === 'edit',
      isResizable: mode === 'edit',
    };
  }

  return {
    // IDs e tipos
    id: widget.id || Math.random().toString(36).substr(2, 9),
    widgetId: widget.widgetId || widget.widget_id || 'unknown',
    title: widget.title || 'Widget',
    widgetType: widget.widgetType || widget.widget_type || 'text',
    
    // Posicionamento
    positionX: toNum(widget.positionX) || 0,
    positionY: toNum(widget.positionY) || 0,
    width: toNum(widget.width) || 300,
    height: toNum(widget.height) || 200,
    zIndex: toNum(widget.zIndex) || 1,
    
    // Visibility
    isVisible: widget.isVisible !== false,
    isLocked: widget.isLocked === true,
    
    // Configs normalizados
    dataConfig: normalizeWidgetDataConfig(widget.dataConfig, widget.widgetType),
    visualConfig: normalizeWidgetVisualConfig(widget.visualConfig, widget.widgetType),
    behaviorConfig: widget.behaviorConfig || {},
    
    // Render settings baseadas no modo
    showEditControls: mode === 'edit',
    showBorders: mode === 'edit',
    isDraggable: mode === 'edit',
    isResizable: mode === 'edit',
  };
}

/**
 * Normaliza dashboard inteiro para renderização.
 */
export function normalizeDashboardForRender(dashboard: any, mode: 'edit' | 'preview' | 'view' = 'view'): any {
  if (!dashboard) {
    return {
      id: 0,
      name: 'Untitled Dashboard',
      description: '',
      isActive: true,
      isDefault: false,
      themeConfig: DEFAULT_THEME,
      canvasConfig: { width: 1200, height: 800 },
      widgets: [],
    };
  }

  return {
    // Metadados
    id: dashboard.id || 0,
    name: dashboard.name || 'Untitled Dashboard',
    description: dashboard.description || '',
    isActive: dashboard.isActive !== false,
    isDefault: dashboard.isDefault === true,
    
    // Configs normalizados
    themeConfig: normalizeTheme(dashboard.themeConfig),
    canvasConfig: normalizeCanvasConfigForRender(dashboard.canvasConfig),
    
    // Widgets normalizados
    widgets: (dashboard.widgets || []).map((w: any) =>
      normalizeWidgetForRender(w, mode)
    ),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const DashboardRenderUtils = {
  // Coerção
  toNum,
  toNumOrDefault,
  parseJsonSafe,
  stringifyJsonSafe,
  
  // Normalizations
  normalizeTheme,
  normalizeCanvas,
  normalizeWidgetPayload,
  normalizeCanvasConfigForRender,
  normalizeWidgetVisualConfig,
  normalizeWidgetDataConfig,
  normalizeWidgetForRender,
  normalizeDashboardForRender,
  
  // Container
  extractContainerChildIds,
  
  // Mojibake
  decodeMojibake,
  
  // Validações
  validateWidgetSize,
  validateWidgetPosition,
  validateDataConfig,
  validateJsonString,
  
  // Renderização
  renderStyledText,
  getSafeText,
  formatCurrency,
  formatDate,
};

export default DashboardRenderUtils;













