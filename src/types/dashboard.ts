// src/types/dashboard.ts

export interface DashboardQuery {
  id: number;
  name: string;
  description: string;
  sqlQuery: string;
  isPublic: boolean;
  createdBy: number;
}

export interface WidgetTemplate {
  id: number;
  name: string;
  widgetType: 'kpi' | 'chart' | 'list' | 'aggrid' | 'chat' | 'text' | 'image' | 'gauge' | 'container';
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultVisualConfig: any;
  defaultBehaviorConfig: any;
}

export interface BackendDashboardWidget {
  id: number;
  widget_id: string;
  widget_type: 'kpi' | 'chart' | 'list' | 'aggrid' | 'chat' | 'text' | 'image' | 'gauge' | 'container';
  title: string;
  is_visible: boolean;
  is_locked: boolean;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
  data_config?: string | any;
  visual_config?: string | any;
  behavior_config?: string | any;
  query_id?: number;
  sql_query?: string;
}

export interface BackendDashboardConfig {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  is_default?: boolean;
  theme_config?: string | any;
  canvas_config?: string | any;
  widgets: BackendDashboardWidget[];
}

export interface ClientSideWidget {
  id: number;
  widgetId: string;
  title: string;
  widgetType: 'kpi' | 'chart' | 'list' | 'aggrid' | 'chat' | 'text' | 'image' | 'gauge' | 'container';
  isVisible: boolean;
  isLocked: boolean;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  dataConfig?: any;
  visualConfig?: {
    group_id?: string;
    group_config?: any;
    [key: string]: any;
  };
  behaviorConfig?: any;
}

export interface ClientSideDashboardConfig {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  themeConfig?: any;
  canvasConfig?: any;
  widgets: ClientSideWidget[];
}

export interface DynamicDashboardProps {
  dashboardConfig?: ClientSideDashboardConfig | null;
  dashboardId?: number;
  userId?: number;
}

export interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  dragType: 'move' | 'resize' | null;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  activeWidget: string | null;
}

// Para usar em AuthContext - ADICIONADO email e celular
export interface AuthUser {
  userId: string;
  username: string;
  name: string;
  email?: string;     // ADICIONADO
  celular?: string;   // ADICIONADO
  role?: string;
  permissions?: string; // JSON string with granular permissions
  defaultDashboardId?: number;
  dashboardConfig?: ClientSideDashboardConfig;
}

// Exportado DashboardTheme para que ContainerWidgetRenderer possa importá-lo
export interface DashboardTheme {
  primaryColor?: string;
  secondaryColor?: string;
  successColor?: string;
  errorColor?: string;
  warningColor?: string;
  dangerColor?: string;
  backgroundColor?: string;
  cardBg?: string;
  cardBgGradient?: string;
  cardRadius?: string;
  cardBorder?: string;
  cardShadow?: string;
  cardShadowHover?: string;
  cardPadding?: string;
  cardFontFamily?: string;
  textColor?: string;
  lightTextColor?: string;
  cardTitleColor?: string;
  cardTitleSize?: string;
  cardTitleWeight?: number;
  cardValueColor?: string;
  cardValueSize?: string;
  cardValueWeight?: number;
  kpiIconBg?: string;
  kpiIconColor?: string;
  kpiIconShadow?: string;
  kpiActionBtnBg?: string;
  kpiActionBtnColor?: string;
  kpiActionBtnBgHover?: string;
  kpiActionBtnBorderRadius?: string;
  listTableHeaderBg?: string;
  listTableCellColor?: string;
  listTotalRowBg?: string;
  chartLineColor?: string;
  chartFillColor?: string;
  chartGridColor?: string;
  rowGap?: string;
  rowMarginBottom?: string;
  rowGapMobile?: string;
  rowMarginBottomMobile?: string;
  containerPadding?: string;
  buttonPrimaryBg?: string;
  buttonPrimaryColor?: string;
  buttonPrimaryBgHover?: string;
  buttonSecondaryBg?: string;
  buttonSecondaryColor?: string;
  buttonSecondaryBgHover?: string;
  buttonDangerBg?: string;
  buttonDangerColor?: string;
  buttonDangerBgHover?: string;
  inputBorder?: string;
  inputBg?: string;
  inputColor?: string;
  inputBorderRadius?: string;
  inputPadding?: string;
  inputPlaceholderColor?: string;
  tableBorder?: string;
  tableBg?: string;
  tableHeaderBg?: string;
  tableHeaderColor?: string;
  tableCellColor?: string;
  tableCellBorder?: string;
  tableRowHoverBg?: string;
  tableStripedBg?: string;
}













