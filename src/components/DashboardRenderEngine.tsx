/**
 * DashboardRenderEngine.tsx
 * 
 * Componente centralizado para renderização FIEL de dashboards em diferentes modos.
 * 
 * GARANTIA: Renderização IDÊNTICA em:
 * - Edit Mode: DashboardBuilder com controles de edição
 * - Preview Mode: DashboardBuilder preview (sem controles)
 * - View Mode: DynamicDashboard workspace principal
 * 
 * Mudanças no rendering afetam TODOS os modos automaticamente (single source of truth).
 */

import React, { useMemo, useCallback } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { ClientSideWidget, ClientSideDashboardConfig } from 'dashboard';
import { KpiWidget } from './Widget/KpiWidget';
import ChartWidget from './Widget/ChartWidget';
import AgGridWidget from './Widget/AgGridWidget';
import TextWidget from './Widget/TextWidget';
import ContainerWidgetRenderer from './Widget/ContainerWidgetRenderer';
import { GaugeWidget } from './Widget/GaugeWidget';
import ImageWidget from './Widget/ImageWidget';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faLock, faUnlock } from '@fortawesome/free-solid-svg-icons';

// ============================================
// TIPOS PÚBLICOS
// ============================================

export type RenderMode = 'edit' | 'preview' | 'view';

export interface DashboardRenderEngineProps {
  /** Configuração do dashboard (canvas, theme, widgets) */
  config: ClientSideDashboardConfig | null;
  
  /** Modo de renderização */
  mode: RenderMode;
  
  /** ID do widget selecionado (apenas em modo edit) */
  selectedWidgetId?: number | null;
  
  /** Dados pré-carregados dos widgets (para modo view) */
  widgetData?: Record<string, any>;
  
  // ===== Handlers para modo EDIT =====
  /** Callback quando um widget é selecionado */
  onWidgetSelect?: (widgetId: number) => void;
  
  /** Callback quando widget é arrastado */
  onWidgetDrag?: (widgetId: number, x: number, y: number) => void;
  
  /** Callback quando widget é redimensionado */
  onWidgetResize?: (widgetId: number, width: number, height: number) => void;
  
  /** Callback quando widget é deletado */
  onWidgetDelete?: (widgetId: number) => void;
  
  /** Callback para travar/destravar widget */
  onWidgetLockChange?: (widgetId: number, isLocked: boolean) => void;
  
  // ===== Props visuais =====
  /** Mostrar grid de alinhamento (apenas em edit) */
  showGrid?: boolean;
  
  /** Tamanho da grid (em pixels) */
  gridSize?: number;
}

// ============================================
// NORMALIZAÇÃO (Single Source of Truth)
// ============================================

/**
 * Normaliza canvas config garantindo valores padrão seguros
 */
function normalizeCanvasConfig(rawConfig: any): any {
  if (!rawConfig) {
    return {
      width: 100,  // 100% (responde à viewport)
      height: 100,  // 100% (responde à viewport)
      backgroundColor: '#ffffff',
      padding: 0,
      margin: 0,
      gridSize: 20,
      showGrid: false,
      container_centered: false,
    };
  }

  return {
    width: rawConfig.width || 100,  // Padrão: 100% da área disponível
    height: rawConfig.height || 100,  // Padrão: 100% da área disponível
    backgroundColor: rawConfig.backgroundColor || '#ffffff',
    padding: parseFloat(rawConfig.padding) || 0,
    margin: parseFloat(rawConfig.margin) || 0,
    gridSize: parseFloat(rawConfig.gridSize) || 20,
    showGrid: rawConfig.showGrid !== false,
    container_centered: rawConfig.container_centered === true,
  };
}

/**
 * Normaliza widget para renderização
 */
function normalizeWidget(widget: ClientSideWidget, mode: RenderMode): ClientSideWidget {
  return {
    ...widget,
    positionX: parseFloat(String(widget.positionX)) || 0,
    positionY: parseFloat(String(widget.positionY)) || 0,
    width: parseFloat(String(widget.width)) || 300,
    height: parseFloat(String(widget.height)) || 200,
    zIndex: parseInt(String(widget.zIndex), 10) || 1,
    isVisible: widget.isVisible !== false,
    isLocked: widget.isLocked === true,
    dataConfig: widget.dataConfig,
    visualConfig: widget.visualConfig,
    behaviorConfig: widget.behaviorConfig,
  };
}

// ============================================
// STYLED COMPONENTS - Renderização Base
// ============================================

const DashboardContainer = styled.div<{
  $canvasWidth?: number;
  $canvasHeight?: number;
  $backgroundColor?: string;
  $padding?: number;
  $isCentered?: boolean;
}>`
  width: 100%;
  height: 100%;
  min-height: 100%;
  background-color: ${(p) => p.$backgroundColor || '#ffffff'};
  padding: ${(p) => p.$padding || 20}px;
  display: flex;
  flex-direction: column;
  align-items: ${(p) => p.$isCentered ? 'center' : 'flex-start'};
  justify-content: flex-start;
  overflow: auto;
`;

const Canvas = styled.div<{
  $width: number;
  $height: number;
  $backgroundColor?: string;
  $showGrid?: boolean;
  $gridSize?: number;
  $hasGrid?: boolean;
  $isViewMode?: boolean;
  $padding?: number;
}>`
  /* 🔧 CRÍTICO: Renderização IDÊNTICA a DynamicDashboard.tsx (single source of truth) */
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  flex: 1;
  background-color: ${(p) => p.$backgroundColor || '#ffffff'};
  box-sizing: border-box;
  overflow: auto;
  /* Grid visual (apenas se mostrador) */
  ${(p) =>
    p.$hasGrid
      ? `
    background-image:
      radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px);
    background-size: ${p.$gridSize}px ${p.$gridSize}px;
  `
      : ''}
  /* EM MODO EDIT: Adicionar borda visual */
  ${(p) =>
    !p.$isViewMode
      ? `
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  `
      : ''}
`;

const WidgetWrapper = styled.div<{
  $x: number;
  $y: number;
  $width: number;
  $height: number;
  $zIndex: number;
  $isSelected?: boolean;
  $isLocked?: boolean;
  $isDragging?: boolean;
  $isEditMode?: boolean;
}>`
  position: absolute;
  width: ${(p) => `${p.$width}px`};
  height: ${(p) => `${p.$height}px`};
  z-index: ${(p) => p.$zIndex};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  pointer-events: auto;
  user-select: none;
  
  /* 🚀 OTIMIZADO: Use transform para melhor performance (GPU accelerated) */
  transform: translate3d(${(p) => `${p.$x}px`}, ${(p) => `${p.$y}px`}, 0);
  will-change: ${(p) => (p.$isDragging ? 'transform' : 'auto')};
  
  /* Desabilita transição durante drag para máxima responsividade */
  transition: ${(p) => p.$isDragging || p.$isEditMode ? 'none' : 'all 0.3s ease'};

  /* Estilos de seleção (apenas edit mode) */
  ${(p) =>
    p.$isEditMode
      ? `
    border: 2px solid ${p.$isSelected ? '#2563eb' : 'transparent'};
    border-radius: 8px;
    transition: ${p.$isDragging ? 'none' : 'all 0.2s ease'};
    cursor: ${p.$isLocked ? 'not-allowed' : p.$isDragging ? 'grabbing' : 'grab'};
    resize: both;
    overflow: auto;

    &:hover {
      border-color: ${p.$isSelected ? '#2563eb' : '#94a3b8'};
    }
  `
      : ''}
`;

const WidgetContent = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  pointer-events: auto;
`;

const WidgetEditHeader = styled.div<{ $isSelected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafbfc;
  border-bottom: 1px solid #e3e8f0;
  border-radius: 6px 6px 0 0;

  border-top: ${(p) => (p.$isSelected ? '2px solid #2563eb' : 'none')};
`;

const WidgetEditTitle = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
`;

const WidgetEditActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const WidgetEditButton = styled.button<{ $variant?: 'lock' | 'delete' }>`
  padding: 4px 8px;
  border: none;
  background: none;
  color: ${(p) => (p.$variant === 'delete' ? '#991b1b' : '#0c4a6e')};
  border-radius: 4px;
  cursor: pointer;
`;

const ResizeHandle = styled.div<{ $position: string }>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: #2563eb;
  border: 2px solid white;
  border-radius: 50%;
  opacity: 0.6;
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: auto;
  z-index: 10;
  box-shadow: 0 0 4px rgba(37, 99, 235, 0.4);

  /* Posicionar handles conforme tipo */
  ${(p) => {
    const positions: Record<string, string> = {
      'tl': 'top: -5px; left: -5px; cursor: nwse-resize;',
      'tm': 'top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize;',
      'tr': 'top: -5px; right: -5px; cursor: nesw-resize;',
      'ml': 'top: 50%; left: -5px; transform: translateY(-50%); cursor: ew-resize;',
      'mr': 'top: 50%; right: -5px; transform: translateY(-50%); cursor: ew-resize;',
      'bl': 'bottom: -5px; left: -5px; cursor: nesw-resize;',
      'bm': 'bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize;',
      'br': 'bottom: -5px; right: -5px; cursor: nwse-resize;',
    };
    return positions[p.$position] || positions['br'];
  }}

  &:hover {
    opacity: 1;
    transform: ${(p) => {
      if (p.$position === 'tm') return 'translateX(-50%) scale(1.3)';
      if (p.$position === 'bm') return 'translateX(-50%) scale(1.3)';
      if (p.$position === 'ml') return 'translateY(-50%) scale(1.3)';
      if (p.$position === 'mr') return 'translateY(-50%) scale(1.3)';
      return 'scale(1.3)';
    }};
  }
`;

const ErrorMessageBox = styled.div<{ $type?: 'warning' | 'error' | 'info' }>`
  padding: ${(p) => {
    if (p.$type === 'error') return '16px';
    if (p.$type === 'warning') return '16px';
    return '32px';
  }};
  color: ${(p) => {
    if (p.$type === 'error') return '#dc2626';
    if (p.$type === 'warning') return '#9ca3af';
    return '#6b7280';
  }};
  text-align: center;
  background-color: transparent;
`;

// ============================================
// COMPONENTE MEMOIZADO PARA OTIMIZAÇÃO
// ============================================

/**
 * 🚀 OTIMIZADO: Componente memoizado para cada widget
 * Evita re-renders de widgets que não estão sendo movimentados
 */
interface MemoizedWidgetItemProps {
  widget: ClientSideWidget;
  isEditMode: boolean;
  isViewMode: boolean;
  selectedWidgetId?: number | null;
  dragState?: any;
  scaleX: number;
  scaleY: number;
  onWidgetMouseDown: (e: React.MouseEvent, widgetId: number) => void;
  onWidgetDelete?: (widgetId: number) => void;
  onWidgetLockChange?: (widgetId: number, isLocked: boolean) => void;
  children?: React.ReactNode;
}

const MemoizedWidgetItem = React.memo<MemoizedWidgetItemProps>(
  ({
    widget,
    isEditMode,
    isViewMode,
    selectedWidgetId,
    dragState,
    scaleX,
    scaleY,
    onWidgetMouseDown,
    onWidgetDelete,
    onWidgetLockChange,
    children,
  }) => (
    <WidgetWrapper
      $x={isViewMode ? widget.positionX * scaleX : widget.positionX}
      $y={isViewMode ? widget.positionY * scaleY : widget.positionY}
      $width={isViewMode ? widget.width * scaleX : widget.width}
      $height={isViewMode ? widget.height * scaleY : widget.height}
      $zIndex={widget.zIndex}
      $isSelected={isEditMode && selectedWidgetId === widget.id}
      $isLocked={widget.isLocked}
      $isDragging={isEditMode && dragState?.widgetId === widget.id && dragState?.isDragging}
      $isEditMode={isEditMode}
      onMouseDown={(e) => onWidgetMouseDown(e, widget.id)}
    >
      {isEditMode && (
        <WidgetEditHeader $isSelected={selectedWidgetId === widget.id}>
          <WidgetEditTitle>{widget.title}</WidgetEditTitle>
          <WidgetEditActions>
            <WidgetEditButton
              $variant="lock"
              onClick={() => onWidgetLockChange?.(widget.id, !widget.isLocked)}
              title={widget.isLocked ? 'Desbloquear' : 'Bloquear'}
            >
              <FontAwesomeIcon icon={widget.isLocked ? faLock : faUnlock} />
            </WidgetEditButton>
            <WidgetEditButton
              $variant="delete"
              onClick={() => onWidgetDelete?.(widget.id)}
              title="Deletar widget"
            >
              <FontAwesomeIcon icon={faTrash} />
            </WidgetEditButton>
          </WidgetEditActions>
        </WidgetEditHeader>
      )}
      {children}
    </WidgetWrapper>
  ),
  (prevProps, nextProps) => {
    // ✅ OTIMIZADO: Custom comparison - re-render APENAS se:
    // 1. O próprio widget mudou (posição, tamanho, propriedades)
    // 2. Seleção mudou
    // 3. Estado de drag mudou para ESTE widget
    
    // 🔍 Verificar mudanças de estrutura do widget
    const widgetChanged = 
      prevProps.widget.positionX !== nextProps.widget.positionX ||
      prevProps.widget.positionY !== nextProps.widget.positionY ||
      prevProps.widget.width !== nextProps.widget.width ||
      prevProps.widget.height !== nextProps.widget.height ||
      prevProps.widget.zIndex !== nextProps.widget.zIndex ||
      prevProps.widget.isLocked !== nextProps.widget.isLocked ||
      prevProps.widget.title !== nextProps.widget.title;

    // 🔍 Verificar mudanças de dados APENAS se dragging NÃO está ativo
    // Durante drag, ignorar mudanças nos dados do widget para máxima performance
    const dataConfigChanged = 
      !prevProps.dragState?.isDragging && 
      !nextProps.dragState?.isDragging &&
      JSON.stringify(prevProps.widget.dataConfig) !== JSON.stringify(nextProps.widget.dataConfig);

    const visualConfigChanged = 
      !prevProps.dragState?.isDragging && 
      !nextProps.dragState?.isDragging &&
      JSON.stringify(prevProps.widget.visualConfig) !== JSON.stringify(nextProps.widget.visualConfig);

    const selectionChanged = prevProps.selectedWidgetId !== nextProps.selectedWidgetId;
    
    const dragStateChanged = 
      prevProps.dragState?.widgetId !== nextProps.dragState?.widgetId ||
      prevProps.dragState?.isDragging !== nextProps.dragState?.isDragging;

    // 🎯 LÓGICA DE MEMO: Se nada mudou para ESTE widget específico, não re-renderiza
    // Durante DRAG: Ignorar mudanças em dados/visualConfig para máxima performance
    if (!widgetChanged && !selectionChanged && !dragStateChanged && !dataConfigChanged && !visualConfigChanged) {
      return true; // memo = não renderiza
    }
    return false; // renderiza
  }
);

MemoizedWidgetItem.displayName = 'MemoizedWidgetItem';

// ============================================
// RENDERIZAÇÃO DE CONTEÚDO
// ============================================

/**
 * Renderiza o conteúdo visual do widget (idêntico em todos os modos)
 * Props individuais são extraídas do widget object
 */
function renderWidgetContent(widget: ClientSideWidget): React.ReactNode {
  // eslint-disable-next-line no-console
  console.log(`[renderWidgetContent] → widget id=${widget.id} type="${widget.widgetType}" title="${widget.title}" pos=[${widget.positionX},${widget.positionY}] size=[${widget.width}x${widget.height}]`);
  try {
    switch (widget.widgetType) {
      case 'kpi':
        return (
          <KpiWidget
            title={widget.title}
            widgetId={widget.id}
            visual_config={widget.visualConfig}
            data_config={widget.dataConfig}
          />
        );
      case 'chart':
        return (
          <ChartWidget
            config={widget}
            widgetId={widget.id}
            data={widget.dataConfig}
            visual={widget.visualConfig}
          />
        );
      case 'aggrid':
        return (
          <AgGridWidget
            config={widget}
            widgetId={widget.id}
            data={widget.dataConfig}
            visual={widget.visualConfig}
          />
        );
      case 'text':
        return (
          <TextWidget
            config={widget}
            widgetId={widget.id}
            data={widget.dataConfig}
            visual={widget.visualConfig}
          />
        );
      case 'list':
        // TODO: Implementar ListWidget
        return (
          <ErrorMessageBox>
            List Widget (not implemented)
          </ErrorMessageBox>
        );
      case 'image':
        return (
          <ImageWidget
            config={widget}
            data={widget.dataConfig}
            visual={widget.visualConfig}
          />
        );
      case 'chat':
        // TODO: Implementar ChatWidget
        return (
          <ErrorMessageBox>
            Chat Widget (not implemented)
          </ErrorMessageBox>
        );
      case 'gauge':
        return (
          <GaugeWidget
            title={widget.title}
            widgetId={widget.id}
            visual_config={widget.visualConfig as any}
            data_config={widget.dataConfig as any}
          />
        );
      case 'container':
        return <ContainerWidgetRenderer config={widget} visual={widget.visualConfig} />;
      default:
        return (
          <ErrorMessageBox $type="warning">
            Unknown widget type: {widget.widgetType}
          </ErrorMessageBox>
        );
    }
  } catch (error) {
    console.error(`Error rendering widget ${widget.id}:`, error);
    return (
      <ErrorMessageBox $type="error">
        Error rendering widget
      </ErrorMessageBox>
    );
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const DashboardRenderEngine = React.memo((props: DashboardRenderEngineProps) => {
  const {
    config,
    mode,
    selectedWidgetId,
    onWidgetSelect,
    onWidgetDrag,
    onWidgetResize,
    onWidgetDelete,
    onWidgetLockChange,
    showGrid = false,
  } = props;

  // Normalizar config
  const normalizedConfig = useMemo(() => {
    if (!config) return null;
    return {
      ...config,
      canvasConfig: normalizeCanvasConfig(config.canvasConfig),
      widgets: (config.widgets || []).map((w) => normalizeWidget(w, mode)),
    };
  }, [config, mode]);

  // Estado para drag
  const [dragState, setDragState] = React.useState<{
    widgetId: number | null;
    isDragging: boolean;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  }>({
    widgetId: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  // Estado para rastrear resize
  const [resizeState, setResizeState] = React.useState<{
    widgetId: number | null;
    isResizing: boolean;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
    position: string; // 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br'
  }>({
    widgetId: null,
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startPosX: 0,
    startPosY: 0,
    position: 'br',
  });

  // Estado para rastrear dimensões do container (responsividade)
  const [containerSize, setContainerSize] = React.useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const canvasRef = React.useRef<HTMLDivElement>(null);

  // ResizeObserver para rastrear mudanças de tamanho do Canvas
  React.useEffect(() => {
    if (!canvasRef.current || mode !== 'view') return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(canvasRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mode]);

  // Calcular escala para responsividade em view mode
  const scaleX = useMemo(() => {
    if (mode !== 'view' || !normalizedConfig) return 1;
    const canvasWidth = normalizedConfig.canvasConfig.width || 1200;
    return containerSize.width > 0 ? containerSize.width / canvasWidth : 1;
  }, [containerSize.width, normalizedConfig, mode]);

  const scaleY = useMemo(() => {
    if (mode !== 'view' || !normalizedConfig) return 1;
    const canvasHeight = normalizedConfig.canvasConfig.height || 800;
    return containerSize.height > 0 ? containerSize.height / canvasHeight : 1;
  }, [containerSize.height, normalizedConfig, mode]);

  // Handler de mouse down (iniciar drag)
  const handleWidgetMouseDown = useCallback(
    (e: React.MouseEvent, widgetId: number) => {
      if (mode !== 'edit') return;

      const widget = normalizedConfig?.widgets.find((w) => w.id === widgetId);
      if (widget?.isLocked) {
        return;
      }

      onWidgetSelect?.(widgetId);

      setDragState({
        widgetId,
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: widget?.positionX || 0,
        offsetY: widget?.positionY || 0,
      });

      e.preventDefault();
    },
    [mode, normalizedConfig?.widgets, onWidgetSelect]
  );

  // Handler de mouse down no resize handle
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, widgetId: number, position: string = 'br') => {
      if (mode !== 'edit') return;

      const widget = normalizedConfig?.widgets.find((w) => w.id === widgetId);
      if (widget?.isLocked) {
        return;
      }

      setResizeState({
        widgetId,
        isResizing: true,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: widget?.width || 300,
        startHeight: widget?.height || 200,
        startPosX: widget?.positionX || 0,
        startPosY: widget?.positionY || 0,
        position,
      });

      e.preventDefault();
      e.stopPropagation();
    },
    [mode, normalizedConfig?.widgets]
  );

  // Handler de mouse move (durante drag e resize)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== 'edit') return;

      // Se está fazendo drag
      if (dragState.isDragging && dragState.widgetId) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        const newX = dragState.offsetX + deltaX;
        const newY = dragState.offsetY + deltaY;

        onWidgetDrag?.(dragState.widgetId, newX, newY);
      }

      // Se está fazendo resize
      if (resizeState.isResizing && resizeState.widgetId) {
        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;

        const position = resizeState.position;
        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        let newPosX = resizeState.startPosX;
        let newPosY = resizeState.startPosY;

        // Aplicar delta conforme handle (8 posições)
        if (position.includes('r')) {
          // Right: aumenta width positivamente
          newWidth = Math.max(150, resizeState.startWidth + deltaX);
        } else if (position.includes('l')) {
          // Left: aumenta width negativamente (puxa para esquerda) e move widget
          newWidth = Math.max(150, resizeState.startWidth - deltaX);
          newPosX = resizeState.startPosX + deltaX;
        }

        if (position.includes('b')) {
          // Bottom: aumenta height positivamente
          newHeight = Math.max(100, resizeState.startHeight + deltaY);
        } else if (position.includes('t')) {
          // Top: aumenta height negativamente (puxa para cima) e move widget
          newHeight = Math.max(100, resizeState.startHeight - deltaY);
          newPosY = resizeState.startPosY + deltaY;
        }

        // Atualizar widget com nova dimensão
        onWidgetResize?.(resizeState.widgetId, newWidth, newHeight);

        // Se mudou posição (casos onde puxamos de cantos/bordas esquerdas/topo)
        if (position.includes('l') || position.includes('t')) {
          onWidgetDrag?.(resizeState.widgetId, newPosX, newPosY);
        }
      }
    },
    [mode, dragState, resizeState, onWidgetDrag, onWidgetResize]
  );

  // Handler de mouse up (finalizar drag/resize)
  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
    setResizeState((prev) => ({ ...prev, isResizing: false }));
  }, []);

  // Componente para renderizar todos os 8 handles de resize
  const ResizeHandles = ({ widgetId }: { widgetId: number }) => {
    const positions = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'] as const;
    return (
      <>
        {positions.map((pos) => (
          <ResizeHandle
            key={pos}
            $position={pos}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleResizeMouseDown(e, widgetId, pos);
            }}
            title={`Arrastar para redimensionar (${pos})`}
          />
        ))}
      </>
    );
  };

  // 🔧 HOOKS FIRST: Todos os Hooks devem ser chamados ANTES de qualquer return/condicional
  const canvasConfig = normalizedConfig?.canvasConfig;
  const widgets = normalizedConfig?.widgets || [];
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';

  // 🔧 CRÍTICO: Usar useMemo para garantir que childByParentId seja recalculado apenas quando widgets mudam
  const { childByParentId, childWidgetIds, containerIds } = useMemo(() => {
    const parentMap = new Map<number, ClientSideWidget[]>();
    const containerIdSet = new Set<number>();
    
    for (const w of widgets) {
      if (w.widgetType === 'container') {
        containerIdSet.add(w.id);
        parentMap.set(w.id, []);
      }
    }

    // Agrupar filhos: widgets que referenciam um container via visual_config.group_id
    for (const w of widgets) {
      if (w.widgetType !== 'container') {
        const visual = (w.visualConfig || {}) as any;
        const groupId = visual?.group_id || visual?.group || visual?.groupId;
        
        if (groupId) {
          // 🔍 DEBUG: Log grupo encontrado
          console.log(`🔍 [CONTAINER MATCHING] Widget "${w.title}" (id=${w.id}, widgetId=${w.widgetId}) procurando container group_id="${groupId}"`);
          
          // Procurar container por widget_id (string) ou id (número)
          const parentContainer = widgets.find(
            (c) => {
              const matches = c.widgetType === 'container' && (
                String(c.widgetId) === String(groupId) || 
                String(c.id) === String(groupId)
              );
              if (matches) {
                console.log(`   ✅ Encontrou container: id=${c.id}, widgetId="${c.widgetId}"`);
              }
              return matches;
            }
          );
          
          if (parentContainer) {
            console.log(`   ✅ Associando ${w.title} ao container ${parentContainer.id}`);
            const children = parentMap.get(parentContainer.id) || [];
            children.push(w);
            parentMap.set(parentContainer.id, children);
          } else {
            console.log(`   ❌ Nenhum container encontrado com group_id="${groupId}"`);
            console.log(`      Containers disponíveis:`, widgets.filter(c => c.widgetType === 'container').map(c => ({ id: c.id, widgetId: c.widgetId })));
          }
        }
      }
    }

    // Conjunto de widget IDs que são filhos (para evitar renderização duplicada)
    const childIds = new Set<number>();
    for (const children of parentMap.values()) {
      for (const child of children) {
        childIds.add(child.id);
      }
    }
    
    return { childByParentId: parentMap, childWidgetIds: childIds, containerIds: containerIdSet };
  }, [widgets]);

  // AGORA sim: Early return DEPOIS dos Hooks
  if (!normalizedConfig) {
    return (
      <DashboardContainer>
        <ErrorMessageBox>
          Nenhum dashboard carregado
        </ErrorMessageBox>
      </DashboardContainer>
    );
  }

  // 🔧 DEBUG: Log do estado de agrupamento
  console.log(`📊 [DASHBOARD RENDER] widgets=${widgets.length}, containers=${containerIds.size}, childWidgetIds=${childWidgetIds.size}`);
  console.log(`   childByParentId keys:`, Array.from(childByParentId.keys()));
  for (const [containerId, children] of childByParentId.entries()) {
    console.log(`   Container ${containerId}: ${children.length} filhos`);
  }

  return (
    <DashboardContainer
      $canvasWidth={canvasConfig.width}
      $canvasHeight={canvasConfig.height}
      $backgroundColor={canvasConfig.backgroundColor}
      $padding={canvasConfig.padding}
      $isCentered={canvasConfig.container_centered && isEditMode}
    >
      <Canvas
        ref={canvasRef}
        $width={canvasConfig.width}
        $height={canvasConfig.height}
        $backgroundColor={canvasConfig.backgroundColor}
        $showGrid={showGrid && isEditMode}
        $gridSize={canvasConfig.gridSize}
        $hasGrid={showGrid && isEditMode}
        $isViewMode={isViewMode}
        $padding={canvasConfig.padding}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Renderizar todos os widgets TOP-LEVEL (não filhos de containers) */}
        {widgets.map((widget) => {
          // Pular renderização se este widget é filho de um container
          if (childWidgetIds.has(widget.id)) {
            return null;
          }

          // Se é um container, passar os filhos
          if (widget.widgetType === 'container') {
            const children = childByParentId.get(widget.id) || [];
            return (
              <MemoizedWidgetItem
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                isViewMode={isViewMode}
                selectedWidgetId={selectedWidgetId}
                dragState={dragState}
                scaleX={scaleX}
                scaleY={scaleY}
                onWidgetMouseDown={handleWidgetMouseDown}
                onWidgetDelete={onWidgetDelete}
                onWidgetLockChange={onWidgetLockChange}
              >
                <WidgetContent>
                  <ContainerWidgetRenderer 
                    config={widget}
                    visual={widget.visualConfig}
                    childWidgets={children}
                    renderChild={(child) => (
                      // 🔧 CRÍTICO: Filhos de container NÃO usam position: absolute
                      // Devem ter position: relative/static para participar do layout flex
                      <div
                        key={child.id}
                        style={{
                          position: 'relative',
                          width: '100%',
                          minWidth: '0',
                          flex: child.dataConfig?.flexGrow ? `${child.dataConfig.flexGrow} 1 auto` : '1 1 auto',
                          maxWidth: child.dataConfig?.maxWidth || 'none',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {renderWidgetContent(child)}
                      </div>
                    )}
                  />
                </WidgetContent>
                
                {isEditMode && !widget.isLocked && (
                  <ResizeHandles widgetId={widget.id} />
                )}
              </MemoizedWidgetItem>
            );
          }

          // Demais widgets top-level - também memoizados
          return (
            <MemoizedWidgetItem
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
              isViewMode={isViewMode}
              selectedWidgetId={selectedWidgetId}
              dragState={dragState}
              scaleX={scaleX}
              scaleY={scaleY}
              onWidgetMouseDown={handleWidgetMouseDown}
              onWidgetDelete={onWidgetDelete}
              onWidgetLockChange={onWidgetLockChange}
            >
              <WidgetContent>{renderWidgetContent(widget)}</WidgetContent>
              
              {isEditMode && !widget.isLocked && (
                <ResizeHandles widgetId={widget.id} />
              )}
            </MemoizedWidgetItem>
          );
        })}
      </Canvas>
    </DashboardContainer>
  );
});

DashboardRenderEngine.displayName = 'DashboardRenderEngine';













