// src/pages/DashboardBuilder.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-loop-func */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { API_PUBLIC_URL } from 'services/apiConfig';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { WidgetDataProvider } from '../contexts/WidgetDataContext';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DashboardRenderEngine } from 'components/DashboardRenderEngine';
import {
  faTimes,
  faSave,
  faEye,
  faPlus,
  faWallet,
  faChartLine,
  faList,
  faTable,
  faComments,
  faFont,
  faImage,
  faBoxOpen, // Ícone para container
  faGaugeHigh,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// IMPORTAR TODOS OS TIPOS NECESSÁRIOS DO SEU ARQUIVO `src/types/dashboard.ts`
import {
  DashboardQuery,
  WidgetTemplate,
  BackendDashboardWidget,
  BackendDashboardConfig,
  ClientSideWidget,
  ClientSideDashboardConfig,
  DragState,
} from 'types/dashboard';

// Importar o DashboardQueryService real
import { DashboardQueryService } from 'services/DashboardQueryService';
import { useNotification } from '../contexts/NotificationContext';
import PropertyTreeView from 'components/Widget/PropertyTreeView';
import DevLogButton from 'components/Dev/DevLogButton';
import { mapClientSideWidgetToBackend } from 'shared/DashboardMappers';

// Fallback para Select caso não exista
import { Select } from 'components/Select/Select';

// --- Funções de Mapeamento (Backend <-> ClientSide) ---
// Coerção segura para números vindos do backend (podem vir como string)
const safeNum = (v: any, fallback = 0): number => {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const mapBackendWidgetToClientSide = (backendWidget: BackendDashboardWidget): ClientSideWidget => {
  // 🔍 DEBUG: Log completo do widget retornado do backend - INCLUINDO POSIÇÕES
  console.log(`[DBG] [BACKEND WIDGET COMPLETO] id=${backendWidget.id}`, {
    title: backendWidget.title,
    widgetType: backendWidget.widget_type,
    position_x: backendWidget.position_x,
    position_y: backendWidget.position_y,
    width: backendWidget.width,
    height: backendWidget.height,
    z_index: backendWidget.z_index,
    widget_id: backendWidget.widget_id,
    widgetId: (backendWidget as any).widgetId,
    // Verificar se há dados nested
    raw: backendWidget
  });
  
  // ⚠️ CRITICAL: Backend retorna 'widgetId' (camelCase), não 'widget_id' (snake_case)
  const widgetIdValue = backendWidget.widget_id || (backendWidget as any).widgetId;
  console.log(`   -> Usando widgetId: ${widgetIdValue}`);
  console.log(`   -> Posições [BACKEND]: x=${backendWidget.position_x}, y=${backendWidget.position_y}, w=${backendWidget.width}, h=${backendWidget.height}`);
  
  return {
    id: backendWidget.id,
    widgetId: widgetIdValue,
    title: backendWidget.title,
    widgetType: backendWidget.widget_type,
    isVisible: backendWidget.is_visible,
    isLocked: backendWidget.is_locked,
    positionX: safeNum(backendWidget.position_x, 0),
    positionY: safeNum(backendWidget.position_y, 0),
    width: safeNum(backendWidget.width, 300),
    height: safeNum(backendWidget.height, 200),
    zIndex: safeNum(backendWidget.z_index, 1),
  dataConfig: ((): any => {
    const raw = typeof backendWidget.data_config === 'string' && backendWidget.data_config ? JSON.parse(backendWidget.data_config) : backendWidget.data_config;
    // se estiver aninhado (ex.: { data_config: {...}, visual_config: {...} }) descompacta
    if (raw && raw.data_config) return raw.data_config;
    return raw || null;
  })(),
  visualConfig: ((): any => {
    const rawVis = typeof backendWidget.visual_config === 'string' && backendWidget.visual_config ? JSON.parse(backendWidget.visual_config) : backendWidget.visual_config;
    // se visual_config estiver dentro de data_config
    if ((!rawVis || Object.keys(rawVis).length === 0) && backendWidget.data_config) {
      const raw = typeof backendWidget.data_config === 'string' && backendWidget.data_config ? JSON.parse(backendWidget.data_config) : backendWidget.data_config;
      if (raw && raw.visual_config) return raw.visual_config;
    }
    // Normalizar possíveis variações de identificação de grupo (group_id, group, groupId)
    if (rawVis && typeof rawVis === 'object') {
      const gid = rawVis.group_id || rawVis.group || rawVis.groupId;
      if (gid && !rawVis.group_id) {
        rawVis.group_id = gid;
      }
    }
    return rawVis || null;
  })(),
    behaviorConfig: typeof backendWidget.behavior_config === 'string' && backendWidget.behavior_config ? JSON.parse(backendWidget.behavior_config) : backendWidget.behavior_config,
  };
};

const decodeMojibake = (s: string) => {
  if (!s || typeof s !== 'string') return s;
  return s.replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã£/g, 'ã').replace(/Ã§/g, 'ç').replace(/Ãª/g, 'ê');
};

const sortWidgetsByType = (widgets: ClientSideWidget[]): ClientSideWidget[] => {
  const containers = widgets.filter(w => w.widgetType === 'container');
  const others = widgets.filter(w => w.widgetType !== 'container');
  return [...containers, ...others];
};

const mapBackendDashboardToClientSide = (backendDashboard: BackendDashboardConfig): ClientSideDashboardConfig => {
  const rawWidgets = (backendDashboard.widgets || []).map(mapBackendWidgetToClientSide);
  return {
    id: backendDashboard.id,
    name: decodeMojibake(backendDashboard.name as any) as any,
    description: decodeMojibake(backendDashboard.description as any) as any,
    isActive: backendDashboard.is_active,
    isDefault: backendDashboard.is_default,
    themeConfig: ((): any => {
      const raw = typeof backendDashboard.theme_config === 'string' && backendDashboard.theme_config ? JSON.parse(backendDashboard.theme_config) : backendDashboard.theme_config;
      return raw || null;
    })(),
    canvasConfig: ((): any => {
      const raw = typeof backendDashboard.canvas_config === 'string' && backendDashboard.canvas_config ? JSON.parse(backendDashboard.canvas_config) : backendDashboard.canvas_config;
      return raw || null;
    })(),
    widgets: sortWidgetsByType(rawWidgets),
  };
};


// --- Funções Auxiliares (mantidas) ---
function renderStyledText(textConfig: any): React.ReactNode {
  if (!textConfig) return null;
  if (typeof textConfig === 'string' || typeof textConfig === 'number') return textConfig;
  if (Array.isArray(textConfig)) {
    return textConfig.map(getSafeText).join(', ');
  }
  if (typeof textConfig === 'object') {
    if (typeof textConfig.text === 'string' || typeof textConfig.text === 'number') {
      const { text, fontSize, fontWeight, color, marginBottom, icon } = textConfig;
      return (
        <span
          style={{
            fontSize: fontSize || undefined,
            fontWeight: fontWeight || undefined,
            color: color || undefined,
            marginBottom: marginBottom || undefined,
          }}
        >
          {icon && <FontAwesomeIcon icon={icon as IconDefinition} style={{ marginRight: 4 }} />}
          {getSafeText(text)}
        </span>
      );
    }
    try {
      return JSON.stringify(textConfig);
    } catch {
      return String(textConfig);
    }
  }
  return getSafeText(textConfig);
}

function getSafeText(value: any): string | number {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  return '';
}


// --- Styled Components (mantidos como fornecidos pelo usuário, com ContainerElement) ---
const BuilderContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #f5f7fa;
`;

const LeftPanel = styled.div`
  width: 238px;
  background: white;
  border-right: 1px solid #e3e8f0;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  width: 416px;
  background: white;
  border-left: 1px solid #e3e8f0;
  display: flex;
  flex-direction: column;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.$variant === 'primary' ? `
    background: #2563eb;
    color: white;
    &:hover:not(:disabled) { background: #1d4ed8; }
  ` : props => props.$variant === 'danger' ? `
    background: #dc2626;
    color: white;
    &:hover:not(:disabled) { background: #b91c1c; }
  ` : `
    background: #f3f4f6;
    color: #374151;
    &:hover:not(:disabled) { background: #e5e7eb; }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PanelHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e3e8f0;
  background: #fafbfc;
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const WidgetPalette = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const WidgetTemplateComponent = styled.div<{ isDragOver?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border: 2px dashed ${props => props.isDragOver ? '#2563eb' : '#d1d5db'};
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  background: ${props => props.isDragOver ? '#eff6ff' : 'white'};

  &:hover {
    border-color: #2563eb;
    background: #eff6ff;
  }

  &:active {
    cursor: grabbing;
  }
`;

const WidgetIcon = styled.div`
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: #6b7280;
`;

const WidgetLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  text-align: center;
`;

const Canvas = styled.div<{
  canvasWidth: number;
  canvasHeight: number;
  isDragOver?: boolean;
}>`
  flex: 1;
  position: relative;
  overflow: auto;
  background: #f8fafc;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(circle, #e5e7eb 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    opacity: ${props => props.isDragOver ? 0.5 : 0.3};
  }
`;

const CanvasContent = styled.div<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  position: relative;
  min-height: 100%;
  margin: 0 auto;
  background: white;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
`;

const WidgetElement = styled.div<{
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isSelected?: boolean;
  isDragging?: boolean;
}>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  z-index: ${props => props.zIndex};
  background: white;
  border: 2px solid ${props => props.isSelected ? '#2563eb' : 'transparent'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  transition: ${props => props.isDragging ? 'none' : 'all 0.2s ease'};
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: ${props => props.isSelected ? '#2563eb' : '#94a3b8'};
  }
`;

// Elemento visual para o container no editor
const ContainerElement = styled(WidgetElement)`
  border: 2px dashed #94a3b8;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  box-shadow: none; /* Containers não precisam de sombra */
  position: absolute;
  padding: 10px;
`;


const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafbfc;
  border-bottom: 1px solid #e3e8f0;
  border-radius: 6px 6px 0 0;
`;

const WidgetTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const WidgetActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WidgetActionButton = styled.button`
  padding: 4px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const WidgetContent = styled.div`
  flex: 1;
  height: calc(100% - 48px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ResizeHandle = styled.div<{ $position: string }>`
  position: absolute;
  ${props => {
    switch(props.$position) {
      case 'se':
        return 'bottom: -4px; right: -4px; cursor: se-resize;';
      case 'sw':
        return 'bottom: -4px; left: -4px; cursor: sw-resize;';
      case 'ne':
        return 'top: -4px; right: -4px; cursor: ne-resize;';
      case 'nw':
        return 'top: -4px; left: -4px; cursor: nw-resize;';
      case 'n':
        return 'top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize;';
      case 's':
        return 'bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize;';
      case 'e':
        return 'right: -4px; top: 50%; transform: translateY(-50%); cursor: e-resize;';
      case 'w':
        return 'left: -4px; top: 50%; transform: translateY(-50%); cursor: w-resize;';
      default:
        return '';
    }
  }}
  width: 8px;
  height: 8px;
  background: #2563eb;
  border: 1px solid white;
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${WidgetElement}:hover & {
    opacity: 1;
  }
`;

const PropertiesPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PropertyGroup = styled.div`
  border: 1px solid #e3e8f0;
  border-radius: 8px;
  overflow: hidden;
`;

const PropertyGroupHeader = styled.div`
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e3e8f0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const PropertyGroupContent = styled.div`
  padding: 16px;
`;

const PropertyRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const PropertyLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const PropertyInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const WIDGET_ICONS = {
  kpi: faWallet,
  chart: faChartLine,
  list: faList,
  aggrid: faTable,
  chat: faComments,
  text: faFont,
  image: faImage,
  container: faBoxOpen,
  gauge: faGaugeHigh,
};

// Componente de Abas para Propriedades
const PropTabsContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #e3e8f0;
  margin-bottom: 16px;
  gap: 8px;
`;

const PropTab = styled.button<{ $active: boolean }>`
  padding: 8px 12px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$active ? '#2563eb' : '#64748b'};
  border-bottom: 2px solid ${props => props.$active ? '#2563eb' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -2px;

  &:hover {
    color: #2563eb;
    background: #f1f5f9;
  }
`;

const HelpText = styled.div`
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
  line-height: 1.4;
`;

// Implementation for widget-specific properties and helpers
const renderWidgetSpecificProperties = (
  widget: ClientSideWidget,
  updateWidget: (updates: Partial<ClientSideWidget>) => void,
  queries: DashboardQuery[],
  loadingQueries: boolean,
  availableContainers: { value: string; label: string }[],
  activeTab: string,
  setActiveTab: (tab: any) => void
) => {
  const queryOptions = queries.map(q => ({ value: String(q.id), label: q.name || `Query ${q.id}` }));

  const getSelectedQuerySql = (id?: number) => {
    if (!id) return '';
    const q = queries.find(x => x.id === id);
    return (q as any)?.sqlQuery || (q as any)?.sql || '';
  };

  const tabs = [
    { id: 'base', label: 'Básico' },
    { id: 'dados', label: 'Dados' },
    { id: 'visual', label: 'Estilo' },
    { id: 'advanced', label: 'Avançado' }
  ];

  const renderTabs = () => (
    <PropTabsContainer>
      {tabs.map(tab => (
        <PropTab 
          key={tab.id} 
          $active={activeTab === tab.id}
          onClick={() => setActiveTab(tab.id as any)}
        >
          {tab.label}
        </PropTab>
      ))}
    </PropTabsContainer>
  );

  const renderBaseTab = () => (
    <>
      <PropertyRow>
        <PropertyLabel>Título do Componente</PropertyLabel>
        <PropertyInput
          type="text"
          value={widget.title}
          onChange={e => updateWidget({ title: e.target.value })}
        />
        <HelpText>Nome visível no topo do widget.</HelpText>
      </PropertyRow>

      {widget.widgetType !== 'container' && (
        <PropertyRow>
          <PropertyLabel>Agrupar em Container</PropertyLabel>
          <Select
            options={[{ value: '', label: 'Nenhum' }, ...availableContainers]}
            value={widget.visualConfig?.group_id || ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              updateWidget({ visualConfig: { ...widget.visualConfig, group_id: e.target.value || undefined } });
            }}
          />
          <HelpText>Coloca este componente dentro de uma caixa organizadora (Container).</HelpText>
        </PropertyRow>
      )}
    </>
  );

  const renderDataTab = () => (
    <>
      <PropertyRow>
        <PropertyLabel>Selecionar Consulta (Dados)</PropertyLabel>
        <Select
          options={queryOptions}
          value={widget.dataConfig?.queryId !== undefined ? String(widget.dataConfig?.queryId) : ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedId = e.target.value ? Number(e.target.value) : undefined;
            updateWidget({
              dataConfig: {
                ...widget.dataConfig,
                queryId: selectedId,
                sqlQuery: selectedId ? getSelectedQuerySql(selectedId) : ''
              }
            });
          }}
          disabled={loadingQueries}
        />
        {loadingQueries ? <HelpText>Carregando consultas...</HelpText> : <HelpText>Escolha a consulta que fornece os dados.</HelpText>}
      </PropertyRow>

      {widget.widgetType === 'gauge' && (
        <PropertyRow>
          <PropertyLabel>Campo de Valor</PropertyLabel>
          <PropertyInput
            type="text"
            value={widget.dataConfig?.value_field || 'valor'}
            onChange={e => updateWidget({ dataConfig: { ...widget.dataConfig, value_field: e.target.value } })}
          />
          <HelpText>Coluna do banco de dados com o valor principal do Gauge.</HelpText>
        </PropertyRow>
      )}
    </>
  );

  const renderVisualTab = () => (
    <>
      {widget.widgetType === 'kpi' && (
        <>
          <PropertyGroup>
            <PropertyGroupHeader>Configuração de Estilo</PropertyGroupHeader>
            <PropertyGroupContent>
              <PropertyRow>
                <PropertyLabel>Ícone (FontAwesome)</PropertyLabel>
                <PropertyInput
                  type="text"
                  placeholder="ex: wallet, chart-line, briefcase"
                  value={widget.visualConfig?.icon || ''}
                  onChange={e => updateWidget({ visualConfig: { ...widget.visualConfig, icon: e.target.value } })}
                />
                <HelpText>Nome do ícone sem prefixo (ex: user, store, box).</HelpText>
              </PropertyRow>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <PropertyRow>
                  <PropertyLabel>Cor do Ícone</PropertyLabel>
                  <PropertyInput
                    type="color"
                    value={widget.visualConfig?.icon_color || '#2563eb'}
                    onChange={e => updateWidget({ visualConfig: { ...widget.visualConfig, icon_color: e.target.value } })}
                  />
                </PropertyRow>
                <PropertyRow>
                  <PropertyLabel>Fundo do Ícone</PropertyLabel>
                  <PropertyInput
                    type="color"
                    value={widget.visualConfig?.icon_bg || '#e0e7ff'}
                    onChange={e => updateWidget({ visualConfig: { ...widget.visualConfig, icon_bg: e.target.value } })}
                  />
                </PropertyRow>
              </div>
            </PropertyGroupContent>
          </PropertyGroup>
          
          <PropertyRow style={{ marginTop: '12px' }}>
            <PropertyLabel>Texto de Rodapé</PropertyLabel>
            <PropertyInput
              type="text"
              placeholder="ex: Hoje, Acumulado"
              value={widget.visualConfig?.label_text || ''}
              onChange={e => updateWidget({ visualConfig: { ...widget.visualConfig, label_text: e.target.value } })}
            />
            <HelpText>Texto opcional exibido abaixo do valor.</HelpText>
          </PropertyRow>
        </>
      )}

      {widget.widgetType === 'gauge' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <PropertyRow>
            <PropertyLabel>Valor Mínimo</PropertyLabel>
            <PropertyInput
              type="number"
              value={widget.visualConfig?.min_value ?? 0}
              onChange={e => updateWidget({ visualConfig: { ...widget.visualConfig, min_value: Number(e.target.value) } })}
            />
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Valor Máximo</PropertyLabel>
            <PropertyInput
              type="number"
              value={widget.visualConfig?.max_value ?? 100}
              onChange={e => updateWidget({ visualConfig: { ...widget.visualConfig, max_value: Number(e.target.value) } })}
            />
          </PropertyRow>
        </div>
      )}

      {widget.widgetType === 'container' && (
        <>
          <PropertyRow>
            <PropertyLabel>Fundo do Container</PropertyLabel>
            <PropertyInput
              type="color"
              value={widget.visualConfig?.cardBg || '#f0f4f8'}
              onChange={e => updateWidget({ visualConfig: { ...widget.visualConfig, cardBg: e.target.value } })}
            />
          </PropertyRow>
          <PropertyRow>
            <PropertyLabel>Margens Internas (Padding px)</PropertyLabel>
            <PropertyInput
              type="number"
              value={Number(widget.visualConfig?.padding || 16)}
              onChange={e => updateWidget({ visualConfig: { ...widget.visualConfig, padding: Number(e.target.value) } })}
            />
          </PropertyRow>
        </>
      )}

      <PropertyGroup style={{ marginTop: '16px' }}>
        <PropertyGroupHeader>Tamanho</PropertyGroupHeader>
        <PropertyGroupContent>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <PropertyRow>
              <PropertyLabel>Largura (px)</PropertyLabel>
              <PropertyInput
                type="number"
                value={widget.width}
                onChange={e => updateWidget({ width: Number(e.target.value) })}
              />
            </PropertyRow>
            <PropertyRow>
              <PropertyLabel>Altura (px)</PropertyLabel>
              <PropertyInput
                type="number"
                value={widget.height}
                onChange={e => updateWidget({ height: Number(e.target.value) })}
              />
            </PropertyRow>
          </div>
        </PropertyGroupContent>
      </PropertyGroup>
    </>
  );

  const renderAdvancedTab = () => (
    <>
      <PropertyRow>
        <PropertyLabel>Consulta SQL Direta</PropertyLabel>
        <textarea
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            backgroundColor: '#1e293b',
            color: '#e2e8f0'
          }}
          value={widget.dataConfig?.sqlQuery || ''}
          placeholder="SELECT ..."
          onChange={e => updateWidget({ dataConfig: { ...widget.dataConfig, sqlQuery: e.target.value } })}
        />
        <HelpText>⚠️ Alterar manualmente o SQL requer conhecimento técnico avançado.</HelpText>
      </PropertyRow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
        <PropertyRow>
          <PropertyLabel>Posição X</PropertyLabel>
          <PropertyInput
            type="number"
            value={widget.positionX}
            onChange={e => updateWidget({ positionX: Number(e.target.value) })}
          />
        </PropertyRow>
        <PropertyRow>
          <PropertyLabel>Posição Y</PropertyLabel>
          <PropertyInput
            type="number"
            value={widget.positionY}
            onChange={e => updateWidget({ positionY: Number(e.target.value) })}
          />
        </PropertyRow>
      </div>
      
      <PropertyRow style={{ marginTop: '12px' }}>
        <PropertyLabel>Camada (Z-Index)</PropertyLabel>
        <PropertyInput
          type="number"
          value={widget.zIndex}
          onChange={e => updateWidget({ zIndex: Number(e.target.value) })}
        />
        <HelpText>Controla a sobreposição de elementos.</HelpText>
      </PropertyRow>

      <div style={{ marginTop: '16px' }}>
        <PropertyLabel>Configurações Brutas (JSON)</PropertyLabel>
        <div style={{ marginTop: '8px' }}>
          <PropertyTreeView
            value={widget.visualConfig || {}}
            onChange={(newVal: any) => updateWidget({ visualConfig: newVal })}
          />
        </div>
      </div>
    </>
  );

  return (
    <PropertiesPanel>
      {renderTabs()}
      
      {activeTab === 'base' && renderBaseTab()}
      {activeTab === 'dados' && renderDataTab()}
      {activeTab === 'visual' && renderVisualTab()}
      {activeTab === 'advanced' && renderAdvancedTab()}
    </PropertiesPanel>
  );
};


// --- Componente Principal DashboardBuilder ---
interface DashboardBuilderProps {
  dashboardId?: number;
  onClose: () => void;
}

const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  dashboardId: initialDashboardId,
  onClose
}) => {
  const location = useLocation();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WidgetTemplate[]>([]);
  const [widgets, setWidgets] = useState<ClientSideWidget[]>([]);
  const [dashboards, setDashboards] = useState<BackendDashboardConfig[]>([]);
  // Determine current dashboard id using: query param 'id' -> initial prop -> user.defaultDashboardId
  const getQueryId = (): number | undefined => {
    try {
      const params = new URLSearchParams(location.search);
      const id = params.get('id');
      return id ? Number(id) : undefined;
    } catch {
      return undefined;
    }
  };

  const resolvedInitialDashboardId = (() => {
    const q = getQueryId();
    if (q !== undefined && !isNaN(q)) return q;
    if (initialDashboardId !== undefined) return initialDashboardId;
    if (user && user.defaultDashboardId) return user.defaultDashboardId;
    return undefined;
  })();

  const [currentDashboardId, setCurrentDashboardId] = useState<number | undefined>(resolvedInitialDashboardId);
  const [selectedWidget, setSelectedWidget] = useState<number | null>(null);
  const [activePropTab, setActivePropTab] = useState<'base' | 'dados' | 'visual' | 'advanced'>('base');
  const [isSaving, setIsSaving] = useState(false);
  const { notify } = useNotification();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    dragType: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    initialWidth: 0,
    initialHeight: 0,
    activeWidget: null,
  });
  const [previewData, setPreviewData] = useState<ClientSideDashboardConfig | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [canvasConfig, setCanvasConfig] = useState({ width: 1200, height: 800, showGrid: true, gridSize: 20 });
  const [isDragOver, setIsDragOver] = useState(false);
  
  // NOVO: State para dados dos widgets (contexto WidgetDataContext)
  const [widgetDataState, setWidgetDataState] = useState<Record<string, any>>({});
  const widgetDataRef = useRef<Record<string, any>>({});
  const [isLoadingWidgetData, setIsLoadingWidgetData] = useState(false);
  const [widgetLoadProgress, setWidgetLoadProgress] = useState({ loaded: 0, total: 0 }); // 🆕 Progress indicator
  const lastLoadedDashboardIdRef = useRef<number | null>(null); // 🔴 FIX: Rastrear qual dashboard foi carregado

  const canvasRef = useRef<HTMLDivElement>(null);

  const fetchPreview = useCallback(async () => {
    if (!currentDashboardId) {
      setPreviewData(null);
      return;
    }
    setPreviewLoading(true);
    try {
      // Tenta o endpoint v2 (builder). Se retornar qualquer status não-ok (403,401,500 etc.)
      // faz fallback direto para o endpoint público v1. Assim a pré-visualização não fica em branco
      // quando v2 estiver protegida ou com CORS.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout (aumentado de 30s)

      const response = await fetch(`/api/v2/dashboard-builder/${currentDashboardId}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const backendData: BackendDashboardConfig = await response.json();
        try { setRawPreview(JSON.stringify(backendData, null, 2)); } catch { setRawPreview(String(backendData)); }
        const clientSideData = mapBackendDashboardToClientSide(backendData);
        setPreviewData(clientSideData);
        setPreviewLoading(false);
        return;
      }

      // qualquer falha no v2 deve tentar v1 como fallback
      try {
        const r2 = await fetch(`${process.env.REACT_APP_API_URL}/v2/dashboards/${currentDashboardId}`);
        if (r2.ok) {
          const backendData: any = await r2.json();
          try { setRawPreview(JSON.stringify(backendData, null, 2)); } catch { setRawPreview(String(backendData)); }
          const clientSideData = mapBackendDashboardToClientSide(backendData as BackendDashboardConfig);
          setPreviewData(clientSideData);
          setPreviewLoading(false);
          return;
        } else {
          const txt = await r2.text();
          setRawPreview(txt);
          setPreviewData(null);
        }
      } catch (err2) {
        setRawPreview(String(err2));
        setPreviewData(null);
      }
    } catch (e) {
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [currentDashboardId]);

  // 🔍 LOG DE INICIALIZAÇÃO - Verificar versão do build
  useEffect(() => {
    const version = `BUILD_v29_10_2025_FIX_WIDGETID_STRING`;
    console.log(`[INFO] Dashboard Builder Inicializado - Versão: ${version}`);
    console.log(`[INFO] Usando widgetId (string) nos requests PUT - Não id (number)`);
    console.log(`[INFO] Rota corrigida: /api/v2/dashboard-builder/{dashboardId}/widgets/{widgetId}/position|config`);
  }, []);

  useEffect(() => {
    // 🔵 NOVO PADRÃO: Ao mudar dashboard, carregar TUDO de uma vez (posições + dados)
    // Isto evita re-fetches durante edição (manutenção)
    if (currentDashboardId) {
      console.log(`\n[INIT] Dashboard ID mudou para ${currentDashboardId}`);
      console.log(`   Carregando widgets com posições e dados...`);
      
      // ✅ Carregar widgets com posições do backend (loadWidgets já sincroniza com previewData)
      // Nota: loadWidgets é declarada mais abaixo, então chamamos diretamente
      // A sincronização via previewData.widgets acontece naturalmente via outro useEffect
    }
  }, [currentDashboardId]);

  useEffect(() => {
    // ✅ fetchPreview para pré-visualização e metadados do dashboard
    fetchPreview();
  }, [currentDashboardId, fetchPreview]); // Adicionado fetchPreview nas deps

  // ✅ CRÍTICO: Sincronizar previewData.widgets com estado local de widgets para renderização visual
  // ⚠️ NÃO SALVA NO BACKEND - apenas sincroniza para renderização em tempo real
  // A renderização usa previewData.widgets, então precisa estar atualizado
  // 🚀 OTIMIZADO 29/10: Sincroniza apenas APÓS drag terminar, não durante (muito lento)
  useEffect(() => {
    // Só sincroniza se NÃO está arrastando (dragState.isDragging = false)
    if (previewData && widgets.length > 0 && !dragState.isDragging) {
      setPreviewData(prev => prev ? { ...prev, widgets: sortWidgetsByType(widgets) } : null);
    }
  }, [widgets, dragState.isDragging]);

  // 🆕 Desativar barra de progresso logo que DashboardBuilder for renderizado
  useEffect(() => {
    if (previewData) {
      // Dashboard foi renderizado, desativa a barra imediatamente
      setIsLoadingWidgetData(false);
      setWidgetLoadProgress({ loaded: 0, total: 0 });
    }
  }, [previewData?.id]); // apenas quando o ID mudar (novo dashboard)

  // 🔴 CRÍTICO: LOAD ONCE - Evitar reruns desnecessários que deixam a barra de progresso sempre ativa
  // Usar dependência em um id estável, não no objeto previewData inteiro
  useEffect(() => {
    if (!previewData || !previewData.widgets || previewData.widgets.length === 0) {
      widgetDataRef.current = {};
      setWidgetDataState({});
      setIsLoadingWidgetData(false);
      setWidgetLoadProgress({ loaded: 0, total: 0 });
      lastLoadedDashboardIdRef.current = null;
      return;
    }

    // 🛑 Se já carregamos este dashboard, SKIP
    if (lastLoadedDashboardIdRef.current === previewData.id) {
      setIsLoadingWidgetData(false);
      return;
    }

    // Marcar que estamos carregando este dashboard
    lastLoadedDashboardIdRef.current = previewData.id;

    // Função async para carregar todos os widgets com limite
    const loadAllWidgets = async () => {
      setIsLoadingWidgetData(true);
      setWidgetLoadProgress({ loaded: 0, total: previewData.widgets.length });
      let successCount = 0;

      // Função para carregar UM widget e atualizar state incrementalmente
      const loadSingleWidget = async (widget: ClientSideWidget) => {
        try {
          const queryId = widget.dataConfig?.query_id || widget.dataConfig?.queryId;
          if (!queryId) {
            widgetDataRef.current[String(widget.id)] = undefined;
            return;
          }
          
          // Preferir endpoint de widget v2 (executa a mesma query que o dashboard principal)
          const widgetEndpoint = `/api/v2/widget/${widget.id}/data${widget.dataConfig?.parameters && widget.dataConfig.parameters.filial ? `?filial=${widget.dataConfig.parameters.filial}` : ''}`;
          const candidates = [
            { url: widgetEndpoint, method: 'GET' },
            { url: `/api/v1/dashboard-queries/${queryId}/execute`, method: 'POST' },
            { url: `/api/v2/dashboard-builder/queries/${queryId}/execute`, method: 'POST' },
            { url: `/api/v2/dashboard-queries/${queryId}/execute`, method: 'POST' },
          ];

          for (const candidate of candidates) {
            try {
              let response;
              if (candidate.method === 'GET') {
                response = await fetch(candidate.url, { method: 'GET', credentials: 'include' });
              } else {
                response = await fetch(candidate.url, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ parameters: widget.dataConfig?.parameters || {} }),
                });
              }

              if (response && response.ok) {
                const result = await response.json();
                widgetDataRef.current[String(widget.id)] = result;
                // Atualizar incrementalmente
                setWidgetDataState(prev => ({ ...prev, [String(widget.id)]: result }));
                successCount++;
                setWidgetLoadProgress(p => ({ ...p, loaded: successCount }));
                return; // Success - exit loop
              }
            } catch (err) {
              // Silent fail, try next URL
            }
          }
        } catch (err) {
          // Error loading widget data, continue with others
        }
      };

      // 🚀 OTIMIZADO: Carregar TODOS em paralelo (máx 5 simultâneas)
      const loadAllWithConcurrency = async (limit: number) => {
        const tasks = previewData.widgets.map(w => () => loadSingleWidget(w));
        const executing: Promise<void>[] = [];
        
        for (const task of tasks) {
          const promise = task();
          executing.push(promise);
          
          if (executing.length >= limit) {
            await Promise.race(executing.map((p, i) => p.catch(() => null).then(() => i)));
            executing.splice(0, 1);
          }
        }
        
        await Promise.all(executing);
      };

      // Carregar com limite de concorrência
      await loadAllWithConcurrency(5);
      
      // 🔴 CRÍTICO: SEMPRE marcar como NÃO CARREGANDO ao terminar
      setIsLoadingWidgetData(false);
      setWidgetLoadProgress({ loaded: previewData.widgets.length, total: previewData.widgets.length });
    };

    loadAllWidgets();
  }, [previewData?.id]); // CRÍTICO: Usar apenas ID estável, não todo o objeto

  // Ref para debounce de updateWidget (não salva a cada pixel do drag)
  const updateWidgetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateWidget = useCallback((widgetIdOrUpdates: number | Partial<ClientSideWidget>, updatesOrImmediate?: Partial<ClientSideWidget> | boolean, immediate: boolean = false) => {
    // Suporta ambas assinaturas:
    // 1. updateWidget(widgetId, updates, immediate?) 
    // 2. updateWidget(updates) - usa selectedWidget
    
    let widgetId: number;
    let updates: Partial<ClientSideWidget>;
    let saveImmediate: boolean;

    if (typeof widgetIdOrUpdates === 'number') {
      // Assinatura 1: updateWidget(widgetId, updates, immediate?)
      widgetId = widgetIdOrUpdates;
      updates = updatesOrImmediate as Partial<ClientSideWidget>;
      saveImmediate = immediate || false;
    } else {
      // Assinatura 2: updateWidget(updates) - usa selectedWidget
      if (!selectedWidget) return;
      widgetId = selectedWidget;
      updates = widgetIdOrUpdates;
      saveImmediate = typeof updatesOrImmediate === 'boolean' ? updatesOrImmediate : false;
    }

    // Atualiza state localmente (sempre imediato para UI responsiva)
    setWidgets(prevWidgets =>
      prevWidgets.map(w =>
        w.id === widgetId
          ? {
              ...w,
              ...updates,
              dataConfig: updates.dataConfig ? { ...w.dataConfig, ...updates.dataConfig } : w.dataConfig,
              visualConfig: updates.visualConfig ? { ...w.visualConfig, ...updates.visualConfig } : w.visualConfig,
              behaviorConfig: updates.behaviorConfig ? { ...w.behaviorConfig, ...updates.behaviorConfig } : w.behaviorConfig,
            }
          : w
      )
    );

    // 💾 Sincronizar com cache local
    const updated = widgets.find(w => w.id === widgetId);
    if (updated) {
      widgetDataRef.current[String(widgetId)] = { ...updated };
    }

    // 🔵 MUDANÇA CRÍTICA: NÃO MAIS SALVAR AUTOMATICAMENTE NO BACKEND
    // Apenas atualizar estado local para UI responsiva
    // As mudanças serão salvas EXPLICITAMENTE quando usuário clicar em "Salvar Dashboard"
    
    console.log(`[LOCAL UPDATE] Widget ${widgetId}:`, updates, '(pendente de salvar)');
  }, [currentDashboardId, selectedWidget, widgets]);

  // 💾 NOVO: Função para SALVAR EXPLICITAMENTE todos os widgets
  // Esta função é chamada quando usuário clica em "Save Dashboard"
  const saveDashboardChanges = useCallback(async () => {
    if (!currentDashboardId) {
      console.error('[ERROR] Dashboard ID não definido');
      return;
    }

    if (widgets.length === 0) {
      console.warn('[WARN] Nenhum widget para salvar');
      return;
    }

    console.log(`💾 [SAVING] Dashboard ${currentDashboardId} com ${widgets.length} widgets...`);

    try {
      // Iterar por cada widget e salvar suas mudanças
      for (const widget of widgets) {
        // 1️⃣ Salvar posição e tamanho
        const positionPayload = {
          positionX: widget.positionX,
          positionY: widget.positionY,
          width: widget.width,
          height: widget.height,
        };

        const posUrl = `/api/v2/dashboard-builder/${currentDashboardId}/widgets/${widget.widgetId}/position`;
        console.log(`[SAVE POSITION] PUT ${posUrl}`, positionPayload);

        const posResponse = await fetch(posUrl, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(positionPayload),
        });

        if (!posResponse.ok) {
          const errTxt = await posResponse.text();
          console.error(`[ERROR] Erro ao salvar posição de ${widget.widgetId}: ${posResponse.status}`);
          console.error(`   Response: ${errTxt}`);
        } else {
          console.log(`[OK] Posição salva para widget ${widget.widgetId}`);
        }

        // 2️⃣ Salvar configuração (título, data, visual, behavior)
        //    Sanitização: NÃO persistir SQL inline no data_config
        const sanitizeDataConfig = (dc: any) => {
          if (!dc) return null;
          try {
            const copy: any = { ...dc };
            // Remover campos que possam carregar SQL inline
            delete copy.sql;
            delete copy.sqlQuery;
            delete (copy as any).sql_query;
            return JSON.stringify(copy);
          } catch {
            // Fallback seguro
            return JSON.stringify({});
          }
        };

        const configPayload = {
          title: widget.title,
          dataConfig: sanitizeDataConfig(widget.dataConfig),
          visualConfig: widget.visualConfig ? JSON.stringify(widget.visualConfig) : null,
          behaviorConfig: widget.behaviorConfig ? JSON.stringify(widget.behaviorConfig) : null,
        };

        const cfgUrl = `/api/v2/dashboard-builder/${currentDashboardId}/widgets/${widget.widgetId}/config`;
        console.log(`[SAVE CONFIG] PUT ${cfgUrl}`, configPayload);

        const cfgResponse = await fetch(cfgUrl, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configPayload),
        });

        if (!cfgResponse.ok) {
          const errTxt = await cfgResponse.text();
          console.error(`❌ Erro ao salvar config de ${widget.widgetId}: ${cfgResponse.status}`);
          console.error(`   Response: ${errTxt}`);
        } else {
          console.log(`[OK] Config salva para widget ${widget.widgetId}`);
        }
      }

      console.log(`[SAVE COMPLETE] Dashboard ${currentDashboardId} salvo com sucesso!`);
      return true;
    } catch (error) {
      console.error('[ERROR] Erro ao salvar dashboard:', error);
      return false;
    }
  }, [currentDashboardId, widgets]);

  const loadTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/v2/dashboards/templates', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const containerTemplate: WidgetTemplate = {
          id: 9999,
          name: 'Container',
          widgetType: 'container',
          description: 'Um container para agrupar outros widgets',
          defaultWidth: 400,
          defaultHeight: 200,
          defaultVisualConfig: {
            cardBg: '#f0f4f8',
            padding: 16,
            cardRadius: 8,
            border: '1px dashed #94a3b8',
            cardShadow: '0 2px 8px rgba(0,0,0,0.05)',
            group_config: {
              display: 'flex',
              flexDirection: 'row',
              gap: '16px',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              padding: '16px',
              background: '#f0f4f8',
              borderRadius: '8px',
              position: 'relative',
            }
          },
          defaultBehaviorConfig: {},
        };
        const gaugeTemplate: WidgetTemplate = {
          id: 9998,
          name: 'Gauge',
          widgetType: 'gauge',
          description: 'Indicador radial de performance',
          defaultWidth: 300,
          defaultHeight: 250,
          defaultVisualConfig: {
            gauge_color: '#3b82f6',
            min_value: 0,
            max_value: 100,
            unit: '%'
          },
          defaultBehaviorConfig: {},
        };
        setTemplates([...data, containerTemplate, gaugeTemplate]);
      } else {
        console.error('Templates response error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, []);

  const loadDashboards = useCallback(async () => {
    try {
      const response = await fetch('/api/v2/dashboards', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDashboards(data);
      } else {
        console.error('Dashboards response error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading dashboards:', error);
    }
  }, []);

  const loadWidgets = useCallback(async () => {
    if (!currentDashboardId) {
      setWidgets([]);
      setPreviewData(null);
      return;
    }
    try {
      const response = await fetch(`/api/v2/dashboard-builder/${currentDashboardId}/widgets`, { credentials: 'include' });
      if (response.ok) {
        const backendWidgets: BackendDashboardWidget[] = await response.json();
        const clientSideWidgets = backendWidgets.map(mapBackendWidgetToClientSide);
        
        // [DBG] DEBUG: Verificar posições dos widgets carregados
        console.log(`[LOAD] Carregados ${clientSideWidgets.length} widgets:`);
        clientSideWidgets.forEach(w => {
          console.log(`   - ${w.title} (${w.widgetId}): x=${w.positionX}, y=${w.positionY}, w=${w.width}, h=${w.height}`);
        });
        
        setWidgets(clientSideWidgets);
        
        // 💾 CACHE: Salvar widgets em memória - usar como source of truth
        widgetDataRef.current = clientSideWidgets.reduce((acc, w) => {
          acc[String(w.id)] = { ...w };
          return acc;
        }, {} as Record<string, any>);
        
        // ✅ IMPORTANTE: Sincronizar previewData com widgets carregados (sem re-fetch de dados)
        // 🔴 CRÍTICO: ORDENAR WIDGETS - Containers PRIMEIRO, depois outros (aplicado em mapBackendDashboardToClientSide)
        
        const dashData: ClientSideDashboardConfig = {
          id: currentDashboardId,
          name: '',
          description: '',
          isActive: true,
          isDefault: false,
          widgets: sortWidgetsByType(clientSideWidgets),
          canvasConfig,
          themeConfig: null,
        };
        setPreviewData(dashData);
        return;
      }

      // Se protegido (401) ou outro erro, tenta carregar via v1 (público)
      if (response.status === 401) {
        try {
          const r2 = await fetch(`${process.env.REACT_APP_API_URL}/v2/dashboards/${currentDashboardId}`);
          if (r2.ok) {
            const backendDash: any = await r2.json();
            const backendWidgets: BackendDashboardWidget[] = backendDash.widgets || [];
            const clientSideWidgets = backendWidgets.map(mapBackendWidgetToClientSide);
            setWidgets(clientSideWidgets);
            setPreviewData({
              id: currentDashboardId,
              name: backendDash.name || '',
              description: backendDash.description || '',
              isActive: backendDash.is_active !== false,
              isDefault: backendDash.is_default === true,
              widgets: sortWidgetsByType(clientSideWidgets),
              canvasConfig,
              themeConfig: null,
            });
            return;
          }
        } catch (err2) {
          console.error('Fallback v1 widgets error:', err2);
        }
      }

      console.error('Widgets response error:', response.status, response.statusText);
      setWidgets([]);
    } catch (error) {
      // erro de rede/timeout, tenta v1 como fallback
      try {
        const r2 = await fetch(`${process.env.REACT_APP_API_URL}/v2/dashboards/${currentDashboardId}`);
        if (r2.ok) {
          const backendDash: any = await r2.json();
          const backendWidgets: BackendDashboardWidget[] = backendDash.widgets || [];
          const clientSideWidgets = backendWidgets.map(mapBackendWidgetToClientSide);
          setWidgets(clientSideWidgets);
          setPreviewData({
            id: currentDashboardId,
            name: backendDash.name || '',
            description: backendDash.description || '',
            isActive: backendDash.is_active !== false,
            isDefault: backendDash.is_default === true,
            widgets: sortWidgetsByType(clientSideWidgets),
            canvasConfig,
            themeConfig: null,
          });
          return;
        }
      } catch (err2) {
        console.error('Error loading widgets fallback v1:', err2);
      }
      console.error('Error loading widgets:', error);
      setWidgets([]);
    }
  }, [currentDashboardId, canvasConfig]);

  const handleDashboardChange = (newDashboardId: number) => {
    setCurrentDashboardId(newDashboardId);
    setSelectedWidget(null);
  };

  useEffect(() => {
    loadTemplates();
    loadDashboards();
  }, [loadTemplates, loadDashboards]);

  // ✅ AUTO-SELECIONA PRIMEIRO DASHBOARD QUANDO CARREGA
  useEffect(() => {
    if (dashboards.length > 0 && !currentDashboardId) {
      console.log('[DashboardBuilder] Auto-selecionando primeiro dashboard:', dashboards[0].id, dashboards[0].name);
      setCurrentDashboardId(dashboards[0].id);
    }
  }, [dashboards, currentDashboardId]);

  useEffect(() => {
    loadWidgets();
  }, [currentDashboardId, loadWidgets]);

  const handleTemplateDragStart = (e: React.DragEvent, template: WidgetTemplate) => {
    // ✅ CRÍTICO: Configurar dropEffect para indicar que é "copy" (pode soltar)
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(template));
    // Feedback visual: cursor muda para "copy" durante drag
    if (e.dataTransfer.setDragImage) {
      const dragImage = document.createElement('div');
      dragImage.textContent = template.name;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.background = '#3b82f6';
      dragImage.style.color = 'white';
      dragImage.style.padding = '8px 12px';
      dragImage.style.borderRadius = '4px';
      dragImage.style.fontSize = '12px';
      dragImage.style.fontWeight = 'bold';
      dragImage.style.zIndex = '-1';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
    console.log('[DRAG START] Template:', template.name, '| Effect:', e.dataTransfer.effectAllowed);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // ✅ CRÍTICO: Deve retornar "copy" para indicar que pode soltar aqui
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
    console.log('[DRAG OVER] Cursor em canvas, dropEffect:', e.dataTransfer.dropEffect);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    // ✅ Apenas resetar isDragOver se sair COMPLETAMENTE do canvas (e.relatedTarget não é filho)
    if (e.relatedTarget === null || !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      console.log('[DRAG LEAVE] Saiu do canvas');
    }
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      console.log('[DROP] Iniciando drop no canvas');
      const templateData = e.dataTransfer.getData('application/json');
      if (!templateData) {
        console.warn('[DROP] Nenhum dado encontrado em dataTransfer');
        return;
      }

      const template: WidgetTemplate = JSON.parse(templateData);
      console.log('[DROP] Template parseado:', template.name);

      if (!canvasRef.current) {
        console.error('[DROP] Canvas ref não disponível');
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      // ✅ Posicionar widget de forma que o cursor fique no centro
      const x = Math.max(0, e.clientX - rect.left - (template.defaultWidth / 2));
      const y = Math.max(0, e.clientY - rect.top - (template.defaultHeight / 2));

      console.log(`[DROP] Posição calculada: x=${Math.round(x)}, y=${Math.round(y)}, template=${template.defaultWidth}x${template.defaultHeight}`);

      await addWidget(template, x, y);
      console.log('[DROP] Widget adicionado com sucesso');
    } catch (error) {
      console.error('❌ [DROP] Erro ao adicionar widget:', error);
    }
  };

  const addWidget = async (template: WidgetTemplate, x: number, y: number) => {
    if (!currentDashboardId) {
      console.warn('⚠️ [ADD WIDGET] Dashboard não selecionado');
      alert("Por favor, selecione um dashboard antes de adicionar widgets.");
      return;
    }
    try {
      console.log('[ADD WIDGET] Iniciando adição:', { 
        template: template.name, 
        type: template.widgetType, 
        x: Math.round(x), 
        y: Math.round(y) 
      });

      const newWidgetClientSideId = `widget_${Date.now()}`;
      const highestZIndex = widgets.reduce((max, w) => Math.max(max, w.zIndex || 0), 0);

      // Backend espera templateId (necessário), positionX, positionY, title
      const payload = {
        templateId: template.id,  // ✅ OBRIGATÓRIO - ID do template
        positionX: Math.max(0, Math.round(x)),
        positionY: Math.max(0, Math.round(y)),
        title: template.name,
        widgetType: template.widgetType,
        width: template.defaultWidth,
        height: template.defaultHeight,
        visualConfig: template.defaultVisualConfig ? JSON.stringify(template.defaultVisualConfig) : '{}',
        behaviorConfig: template.defaultBehaviorConfig ? JSON.stringify(template.defaultBehaviorConfig) : '{}',
        dataConfig: '{}',
        zIndex: highestZIndex + 1,
        isVisible: true,
        isLocked: false,
        widgetId: newWidgetClientSideId,
      };

      console.log('[ADD WIDGET] Enviando payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/v2/dashboard-builder/${currentDashboardId}/widgets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newBackendWidget: BackendDashboardWidget = await response.json();
        console.log('✅ [ADD WIDGET] Backend respondeu:', { id: newBackendWidget.id, type: newBackendWidget.widget_type });
        
        const newClientSideWidget = mapBackendWidgetToClientSide(newBackendWidget);
        setWidgets([...widgets, newClientSideWidget]);
        setSelectedWidget(newClientSideWidget.id);
        
        console.log('✨ [ADD WIDGET] Widget adicionado ao state e selecionado:', newClientSideWidget.id);
      } else {
        const errorText = await response.text();
        console.error('❌ [ADD WIDGET] Erro HTTP:', { status: response.status, statusText: response.statusText, body: errorText });
        alert(`Erro ao adicionar widget: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ [ADD WIDGET] Erro na requisição:', error);
      alert(`Erro ao adicionar widget: ${error}`);
    }
  };

  const updateWidgetPosition = useCallback((widgetId: string, x: number, y: number, width?: number, height?: number) => {
    // Localiza o widget pelo widget_id (string, não id numérico)
    const clientSideWidget = widgets.find(w => w.widgetId === widgetId);
    if (!clientSideWidget) return;

    // Chama updateWidget com delay (debounce) já que vem do final do drag
    const updates: Partial<ClientSideWidget> = {
      positionX: x,
      positionY: y,
    };
    
    if (width !== undefined) updates.width = width;
    if (height !== undefined) updates.height = height;

    // Chama com immediate=false para debounce, mas como vem do mouseUp já é OK
    updateWidget(clientSideWidget.id, updates, false);
  }, [widgets, updateWidget]);

  const removeWidget = async (widgetId: number | string) => {
    if (!currentDashboardId) {
      alert("Por favor, selecione um dashboard para remover widgets.");
      return;
    }
    
    // ✅ Suportar tanto id numérico quanto widget_id string
    const widgetToRemove = widgets.find(w => w.id === widgetId || w.widgetId === widgetId);
    if (!widgetToRemove) {
      console.warn('⚠️ Widget não encontrado:', widgetId);
      alert("Widget não encontrado.");
      return;
    }
    
    if (widgetToRemove?.isLocked) {
      alert("Este widget está bloqueado e não pode ser removido.");
      return;
    }
    if (!window.confirm("Tem certeza que deseja remover este widget?")) return;
    try {
      // ✅ Usar widget_id string no endpoint (mais confiável)
      const response = await fetch(`/api/v2/dashboard-builder/${currentDashboardId}/widgets/${widgetToRemove.widgetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setWidgets(widgets.filter(w => w.id !== widgetToRemove.id));
        if (selectedWidget === widgetToRemove.id) {
          setSelectedWidget(null);
        }
        console.log('✅ Widget removido com sucesso:', widgetToRemove.widgetId);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao remover widget:', { status: response.status, body: errorText });
        alert(`Erro ao remover widget: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Erro na requisição DELETE:', error);
      alert(`Erro ao remover widget: ${error}`);
    }
  };

  // Save dashboard (persist current state: meta + widgets)
  const saveDashboard = async () => {
    if (!currentDashboardId) return alert('Selecione um dashboard antes de salvar.');

    setIsSaving(true);
    try {
      // 🔵 PASSO 1: Salvar mudanças dos widgets individuais
      // Isto persiste posições, tamanhos e configs via endpoints específicos
      console.log(`\n📋 [SAVE WORKFLOW] Iniciando salvamento completo do dashboard ${currentDashboardId}`);
      console.log(`📋 [STEP 1/2] Salvando mudanças dos widgets individuais...`);
      
      const widgetSaveSuccess = await saveDashboardChanges();
      
      if (!widgetSaveSuccess) {
        console.error('❌ Falha ao salvar widgets individuais. Continuando com salvamento de meta...');
        // Continua mesmo se falhar, pois pode ser um widget que causou erro
      } else {
        console.log(`✅ [STEP 1/2] Widgets salvos com sucesso`);
      }

      // 🔵 PASSO 2: Salvar metadados do dashboard (nome, descrição, etc.)
      // Normaliza o payload para o formato Backend (snake_case + strings nas configs)
      const normalizeConfig = (cfg: any) => {
        if (!cfg) return null;
        if (typeof cfg === 'string') return cfg;
        try {
          return JSON.stringify(cfg);
        } catch {
          return JSON.stringify(cfg, Object.keys(cfg).sort());
        }
      };

      const dashboardMeta = {
        name: previewData?.name || (dashboards.find(d => d.id === currentDashboardId)?.name || ''),
        description: previewData?.description || '',
        theme_config: normalizeConfig(previewData?.themeConfig || null),
        canvas_config: normalizeConfig(previewData?.canvasConfig || canvasConfig),
      };

      const widgetsPayload = widgets.map(w => mapClientSideWidgetToBackend(w));
      
      // 🔍 DEBUG: Verificar se widget_id está sendo enviado
      console.log(`[saveDashboard] Payload verification:`);
      widgetsPayload.forEach((wp, i) => {
        console.log(`   Widget ${i}: widget_id=${wp.widget_id}, title=${wp.title}`);
      });
      
      const payload = { dashboard: dashboardMeta, widgets: widgetsPayload, replace: true };
      const payloadStr = JSON.stringify(payload);
      const payloadSize = new Blob([payloadStr]).size;
      
      if (payloadSize > 5 * 1024 * 1024) {
        notify('warning', `Payload grande (${(payloadSize / 1024 / 1024).toFixed(2)}MB). Salvando...`);
      }

      console.log(`📋 [STEP 2/2] Salvando metadados do dashboard...`);
      console.log(`[saveDashboard] Dashboard ID: ${currentDashboardId}`);
      console.log(`[saveDashboard] Widgets: ${widgets.length}`);
      console.log(`[saveDashboard] Payload size: ${payloadSize} bytes`);
      console.log(`[saveDashboard] URL: /api/v2/dashboard-builder/${currentDashboardId}/import`);

      // ✅ NOVO: Adicionar timeout mais longo (60s) para operações complexas do backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos (aumentado de 30s)

      try {
        const resp = await fetch(`/api/v2/dashboard-builder/${currentDashboardId}/import`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // ✅ DEBUG: Log resposta
        console.log(`[saveDashboard] Response status: ${resp.status} ${resp.statusText}`);
        console.log(`[saveDashboard] Response headers:`, {
          contentType: resp.headers.get('content-type'),
          contentLength: resp.headers.get('content-length'),
        });

        if (!resp.ok) {
          // ✅ MELHORADO: Extrair erro completo
          let errorBody = '';
          try {
            errorBody = await resp.text();
            console.error(`[saveDashboard] Error body (v2):`, errorBody);
          } catch (e) {
            console.error(`[saveDashboard] Could not read error body:`, e);
          }

          // Se v2 protegido (401), tentar atualizar via API pública v1
          if (resp.status === 401) {
            console.log(`[saveDashboard] Tentando fallback v1 (401 Unauthorized)...`);
            try {
              const bodyV1 = {
                id: currentDashboardId,
                name: dashboardMeta.name,
                description: dashboardMeta.description,
                theme_config: dashboardMeta.theme_config,
                canvas_config: dashboardMeta.canvas_config,
                widgets: widgetsPayload,
              };

              const respV1 = await fetch(`${process.env.REACT_APP_API_URL}/v2/dashboards/${currentDashboardId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyV1),
                signal: controller.signal,
              });

              console.log(`[saveDashboard] V1 Response status: ${respV1.status}`);

              if (!respV1.ok) {
                const errV1 = await respV1.text();
                console.error('Erro ao salvar via v1:', errV1);
                notify('error', `Erro ao salvar dashboard (v1): ${errV1.substring(0, 200)}`);
                return;
              }

              console.log(`✅ [STEP 2/2] Dashboard salvo com sucesso via v1`);
              console.log(`\n✅ [SAVE WORKFLOW] Salvamento completo finalizado!\n`);
              await loadWidgets();
              notify('success', 'Dashboard salvo com sucesso (v1)!');
              return;
            } catch (errSaveV1) {
              const errorMsg = errSaveV1 instanceof Error ? errSaveV1.message : String(errSaveV1);
              console.error('Erro ao salvar via v1 (exceção):', errorMsg, errSaveV1);
              notify('error', `Erro ao salvar dashboard: ${errorMsg}`);
              return;
            }
          } else {
            console.error(`[saveDashboard] Non-OK response (${resp.status}):`, errorBody);
            notify('error', `Erro ao salvar dashboard: [${resp.status}] ${errorBody.substring(0, 200)}`);
            return;
          }
        }

        console.log(`✅ [STEP 2/2] Dashboard salvo com sucesso via v2`);
        console.log(`\n✅ [SAVE WORKFLOW] Salvamento completo finalizado!\n`);
        await loadWidgets();
        notify('success', 'Dashboard salvo com sucesso!');
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // ✅ MELHORADO: Diagnosticar tipo de erro
        let errorMsg = 'Erro desconhecido';
        
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          errorMsg = 'Requisição expirou (timeout de 30s). Backend pode estar lento.';
          console.error('[saveDashboard] TIMEOUT:', errorMsg);
        } else if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          errorMsg = `Falha na conexão: Verifique se backend está rodando em ${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'}`;
          console.error('[saveDashboard] NETWORK ERROR:', errorMsg);
        } else if (fetchError instanceof Error) {
          errorMsg = fetchError.message;
          console.error('[saveDashboard] FETCH ERROR:', fetchError);
        } else {
          errorMsg = String(fetchError);
          console.error('[saveDashboard] UNKNOWN ERROR:', fetchError);
        }

        notify('error', `Erro ao salvar dashboard: ${errorMsg}`);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error('[saveDashboard] Unexpected error:', errorMsg, e);
      notify('error', `Erro ao salvar dashboard: ${errorMsg || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWidgetMouseDown = (e: React.MouseEvent, widget: ClientSideWidget) => {
    e.preventDefault();
    e.stopPropagation();

    if (widget.isLocked) {
      return;
    }

    setSelectedWidget(widget.id);

    const target = e.target as HTMLElement;
    const isResizeHandle = target.closest('.resize-handle') !== null;

    setDragState({
      isDragging: true,
      isResizing: isResizeHandle,
      dragType: isResizeHandle ? 'resize' : 'move',
      startX: e.clientX,
      startY: e.clientY,
      initialX: widget.positionX,
      initialY: widget.positionY,
      initialWidth: widget.width,
      initialHeight: widget.height,
      activeWidget: widget.widgetId,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.activeWidget) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    setWidgets(prevWidgets => prevWidgets.map(w => {
      if (w.widgetId === dragState.activeWidget && !w.isLocked) {
        if (dragState.dragType === 'move') {
          const newX = Math.max(0, dragState.initialX + deltaX);
          const newY = Math.max(0, dragState.initialY + deltaY);
          return { ...w, positionX: newX, positionY: newY };
        } else if (dragState.dragType === 'resize') {
          const newWidth = Math.max(100, dragState.initialWidth + deltaX);
          const newHeight = Math.max(80, dragState.initialHeight + deltaY);
          return { ...w, width: newWidth, height: newHeight };
        }
      }
      return w;
    }));
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.activeWidget) {
      const widget = widgets.find(w => w.widgetId === dragState.activeWidget);
      if (widget && !widget.isLocked) {
        updateWidgetPosition(
          widget.widgetId,
          widget.positionX,
          widget.positionY,
          widget.width,
          widget.height
        );
      }
    }

    setDragState({
      isDragging: false,
      isResizing: false,
      dragType: null,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
      initialWidth: 0,
      initialHeight: 0,
      activeWidget: null,
    });
  }, [dragState, widgets, updateWidgetPosition]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);


  const [queries, setQueries] = useState<DashboardQuery[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);

  useEffect(() => {
    if (selectedWidget) {
      const load = async () => {
        setLoadingQueries(true);
        try {
          const qs = await DashboardQueryService.getAvailableQueries();
          setQueries(qs);
        } catch (err: any) {
          // Tentar fallback para endpoint público /api/v1
            try {
            const { API_PUBLIC_URL } = await import('../services/apiConfig');
            const res = await fetch(`${process.env.REACT_APP_API_URL_PUBLIC || API_PUBLIC_URL}/dashboard-queries`, { credentials: 'include' });
            if (res.ok) {
              const data = await res.json();
              setQueries(data || []);
            } else {
              notify('error', `Erro ao carregar queries: ${res.status} ${res.statusText}`);
              setQueries([]);
            }
          } catch (inner) {
            notify('error', 'Falha de rede ao buscar queries. Verifique se o backend está ativo (porta 8080).');
            setQueries([]);
          }
        } finally {
          setLoadingQueries(false);
        }
      };
      load();
    } else {
      setQueries([]);
    }
  }, [selectedWidget]);

  const selectedWidgetData = widgets.find(w => w.id === selectedWidget);

  const availableContainers = useMemo(() => {
    return widgets.filter(w => w.widgetType === 'container').map(c => ({
      value: c.widgetId,
      label: c.title || `Container (${c.widgetId})`
    }));
  }, [widgets]);

  // Export / Import modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportJson, setExportJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [importReplace, setImportReplace] = useState<boolean>(false);
  const [importValidationErrors, setImportValidationErrors] = useState<string[]>([]);

  return (
    <>
      <BuilderContainer>
        <LeftPanel>
        <PanelHeader>
          <PanelTitle>Componentes</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <WidgetPalette>
            {templates.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Carregando templates...
              </div>
            ) : (
              templates.map((template) => (
                <WidgetTemplateComponent
                  key={template.id}
                  draggable
                  onDragStart={(e) => handleTemplateDragStart(e, template)}
                >
                  <WidgetIcon>
                    <FontAwesomeIcon
                      icon={WIDGET_ICONS[template.widgetType] || faFont}
                      size="lg"
                    />
                  </WidgetIcon>
                  <WidgetLabel>{template.name}</WidgetLabel>
                </WidgetTemplateComponent>
              ))
            )}
          </WidgetPalette>
        </PanelContent>
      </LeftPanel>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'white',
          borderBottom: '1px solid #e3e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              Editor Visual de Dashboard
            </h2>
            <select
              value={currentDashboardId || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDashboardChange(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="">Selecione um dashboard</option>
              {dashboards.map(dashboard => (
                <option key={dashboard.id} value={dashboard.id}>
                  {dashboard.name} {dashboard.is_default ? '(Padrão)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ActionButton $variant="secondary">
              <FontAwesomeIcon icon={faPlus} />
              Novo Dashboard
            </ActionButton>
            <ActionButton $variant="secondary" onClick={async () => { setShowPreviewModal(true); setPreviewLoading(true); await fetchPreview(); setPreviewLoading(false); }}>
              <FontAwesomeIcon icon={faEye} />
              Pré-visualizar
            </ActionButton>
            <ActionButton $variant="secondary" onClick={async () => {
              if (!currentDashboardId) return alert('Selecione um dashboard para exportar.');
              try {
                const resp = await fetch(`/api/v2/dashboard-builder/${currentDashboardId}/export`, { method: 'POST', credentials: 'include' });
                if (!resp.ok) return alert('Erro ao exportar dashboard: ' + resp.statusText);
                const data = await resp.json();
                setExportJson(JSON.stringify(data, null, 2));
                setShowExportModal(true);
              } catch (e) {
                console.error('Erro de export:', e);
                alert('Erro ao exportar dashboard. Veja console para detalhes.');
              }
            }}>
              <FontAwesomeIcon icon={faBoxOpen} />
              Exportar
            </ActionButton>
            <ActionButton $variant="secondary" onClick={() => setShowImportModal(true)}>
              <FontAwesomeIcon icon={faBoxOpen} />
              Importar
            </ActionButton>
            <ActionButton $variant="primary" onClick={saveDashboard} disabled={isSaving}>
              <FontAwesomeIcon icon={faSave} />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </ActionButton>
            <ActionButton $variant="secondary" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
              Fechar
            </ActionButton>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div style={{ width: '80%', maxHeight: '80%', background: 'white', borderRadius: 8, overflow: 'auto', padding: 16 }}>
              <h3>Exportar Dashboard</h3>
              <textarea style={{ width: '100%', height: '60vh', fontFamily: 'monospace', fontSize: 12 }} value={exportJson} onChange={(e) => setExportJson(e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <ActionButton $variant="secondary" onClick={() => { setShowExportModal(false); }}>
                  Fechar
                </ActionButton>
                <ActionButton $variant="primary" onClick={() => {
                  const blob = new Blob([exportJson], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `dashboard_${currentDashboardId || 'export'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  Baixar JSON
                </ActionButton>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
            <div style={{ width: '80%', maxHeight: '80%', background: 'white', borderRadius: 8, overflow: 'auto', padding: 16 }}>
              <h3>Importar Dashboard</h3>
                <div style={{ marginBottom: 8 }}>
                <label style={{ marginRight: 8 }}>
                  <input type="checkbox" checked={importReplace} onChange={(e) => setImportReplace(e.target.checked)} /> Substituir widgets ausentes
                </label>
                <input type="file" accept="application/json" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => { setImportJson(String(reader.result || '')); };
                  reader.readAsText(f);
                }} />
              </div>
              <textarea style={{ width: '100%', height: '60vh', fontFamily: 'monospace', fontSize: 12 }} value={importJson} onChange={(e) => setImportJson(e.target.value)} />
              {importValidationErrors.length > 0 && (
                <div style={{ marginBottom: 8, color: '#b91c1c' }}>
                  <strong>Erros de validação:</strong>
                  <ul>
                    {importValidationErrors.map((err, idx) => (<li key={idx}>{err}</li>))}
                  </ul>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <ActionButton $variant="secondary" onClick={() => { setShowImportModal(false); }}>
                  Fechar
                </ActionButton>
                <ActionButton $variant="primary" onClick={async () => {
                  if (!currentDashboardId) return alert('Selecione um dashboard para importar.');
                  try {
                    let payload: any = {};
                    try {
                      payload = JSON.parse(importJson || '{}');
                    } catch (e) {
                      return alert('JSON inválido. Corrija antes de importar.');
                    }
                    // Basic validation: widgets must be an array if present
                    const errors: string[] = [];
                    if (payload.widgets && !Array.isArray(payload.widgets)) {
                      errors.push('O campo "widgets" deve ser um array.');
                    }
                    if (payload.dashboard && typeof payload.dashboard !== 'object') {
                      errors.push('O campo "dashboard" deve ser um objeto.');
                    }
                    setImportValidationErrors(errors);
                    if (errors.length > 0) {
                      return alert('Existem erros no JSON. Use "Forçar import" se quiser prosseguir.');
                    }
                    payload.replace = importReplace;
                    const resp = await fetch(`/api/v2/dashboard-builder/${currentDashboardId}/import`, {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    if (!resp.ok) {
                      const txt = await resp.text();
                      return alert('Erro ao importar: ' + txt);
                    }
                    await loadWidgets();
                    setShowImportModal(false);
                    alert('Importação concluída.');
                  } catch (e) {
                    console.error('Erro ao importar:', e);
                    alert('Erro ao importar. Veja console para detalhes.');
                  }
                }}>
                  Importar
                </ActionButton>
                <ActionButton $variant="danger" onClick={async () => {
                  if (!currentDashboardId) return alert('Selecione um dashboard para importar.');
                  if (!window.confirm('Tem certeza que deseja forçar a importação mesmo com erros? Isto pode causar inconsistências.')) return;
                  try {
                    const payload: any = JSON.parse(importJson || '{}');
                    payload.replace = importReplace;
                    const resp = await fetch(`/api/v2/dashboard-builder/${currentDashboardId}/import`, {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });
                    if (!resp.ok) {
                      const txt = await resp.text();
                      return alert('Erro ao importar: ' + txt);
                    }
                    await loadWidgets();
                    setShowImportModal(false);
                    alert('Importação concluída (forçada).');
                  } catch (e) {
                    console.error('Erro ao forçar import:', e);
                    alert('Erro ao forçar import. Veja console.');
                  }
                }}>
                  Forçar import
                </ActionButton>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && (
          <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPreviewModal(false)}>
            <div style={{ width: '90%', height: '85%', background: 'white', borderRadius: 8, overflow: 'auto', padding: 12 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>Pré-visualização do Dashboard</h3>
                <div>
                  <ActionButton $variant="secondary" onClick={() => setShowPreviewModal(false)}>Fechar</ActionButton>
                </div>
              </div>
              <div style={{ height: 'calc(100% - 60px)', width: '100%', overflow: 'auto', position: 'relative' }}>
                {previewLoading ? (
                  <div style={{ padding: 20 }}>Carregando preview...</div>
                ) : previewData ? (
                  <WidgetDataProvider key={JSON.stringify(Object.keys(widgetDataState))} data={widgetDataState}>
                    <DashboardRenderEngine
                      config={previewData}
                      mode="preview"
                    />
                  </WidgetDataProvider>
                ) : (
                  <div style={{ padding: 12 }}>
                    <div>Nenhum preview disponível</div>
                    {rawPreview && (
                      <pre style={{ maxHeight: 240, overflow: 'auto', background: '#fff', padding: 8, borderRadius: 6 }}>{rawPreview}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Canvas com DashboardRenderEngine - Renderização Centralizada */}
        <div 
          ref={canvasRef}
          style={{ flex: 1, display: 'flex', overflow: 'auto', position: 'relative', width: '100%', height: '100%' }}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onDragLeave={handleCanvasDragLeave}
        >
          {previewData ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', flex: 1, position: 'relative', pointerEvents: 'auto' }}>
              {/* CRÍTICO: Passar widgetDataState como key force remount quando dados chegam */}
              <WidgetDataProvider key={JSON.stringify(Object.keys(widgetDataState))} data={widgetDataState}>
                <DashboardRenderEngine
                  config={previewData}
                  mode="edit"
                  selectedWidgetId={selectedWidget}
                  onWidgetSelect={(widgetId) => setSelectedWidget(widgetId)}
                  onWidgetDrag={(widgetId, x, y) => {
                    updateWidget(widgetId, { positionX: x, positionY: y });
                  }}
                  onWidgetResize={(widgetId, width, height) => {
                    updateWidget(widgetId, { width, height });
                  }}
                  onWidgetDelete={(widgetId) => removeWidget(widgetId)}
                  onWidgetLockChange={(widgetId, isLocked) => {
                    updateWidget(widgetId, { isLocked });
                  }}
                  showGrid={canvasConfig.showGrid}
                />
              </WidgetDataProvider>
              {/* Overlay de carregamento enquanto dados estão sendo buscados */}
              {isLoadingWidgetData && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  backdropFilter: 'blur(3px)',
                }}>
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#222', marginBottom: 16 }}>
                      📊 Carregando dados dos widgets
                    </div>
                    <div style={{ 
                      width: '200px', 
                      height: '8px', 
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: 12
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        width: `${widgetLoadProgress.total > 0 ? (widgetLoadProgress.loaded / widgetLoadProgress.total) * 100 : 0}%`,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      {widgetLoadProgress.loaded} de {widgetLoadProgress.total} widgets carregados
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 20, color: '#666', textAlign: 'center' }}>
              Selecione um dashboard para editar
            </div>
          )}
        </div>
      </div>

      <RightPanel>
        <PanelHeader>
          <PanelTitle>
            {selectedWidgetData ? `Propriedades: ${selectedWidgetData.title}` : 'Configuração do Dashboard'}
          </PanelTitle>
          {selectedWidgetData && (
            <HelpText style={{ marginTop: 4 }}>
              Tipo: {selectedWidgetData.widgetType.toUpperCase()} | ID: {selectedWidgetData.widgetId}
            </HelpText>
          )}
        </PanelHeader>

        <PanelContent>
          {selectedWidgetData ? (
            <>
              {renderWidgetSpecificProperties(
                selectedWidgetData,
                (updates) => updateWidget(selectedWidgetData.id, updates),
                queries,
                loadingQueries,
                availableContainers,
                activePropTab,
                setActivePropTab
              )}

              <div style={{ marginTop: '32px', borderTop: '1px solid #fee2e2', paddingTop: '16px' }}>
                <ActionButton 
                  $variant="danger" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => removeWidget(selectedWidgetData.id)}
                >
                  <FontAwesomeIcon icon={faTrash} /> Remover Widget
                </ActionButton>
                <HelpText style={{ textAlign: 'center', marginTop: 8 }}>
                  Esta ação excluirá permanentemente o componente do dashboard.
                </HelpText>
              </div>
            </>
          ) : previewData ? (
            <PropertiesPanel>
              <PropertyGroup>
                <PropertyGroupHeader>Configurações Gerais</PropertyGroupHeader>
                <PropertyGroupContent>
                  <PropertyRow>
                    <PropertyLabel>Nome do Painel</PropertyLabel>
                    <PropertyInput 
                      value={previewData.name || ''} 
                      onChange={(e) => {
                        const newName = e.target.value;
                        setPreviewData(prev => prev ? { ...prev, name: newName } : null);
                        setDashboards(prev => prev.map(d => d.id === currentDashboardId ? { ...d, name: newName } : d));
                      }} 
                    />
                  </PropertyRow>
                  
                  <PropertyRow>
                    <PropertyLabel>Dimensões do Canvas (Largura x Altura)</PropertyLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <PropertyInput 
                        type="number" 
                        value={canvasConfig.width} 
                        onChange={(e) => setCanvasConfig(prev => ({ ...prev, width: Number(e.target.value) || 1200 }))} 
                      />
                      <PropertyInput 
                        type="number" 
                        value={canvasConfig.height} 
                        onChange={(e) => setCanvasConfig(prev => ({ ...prev, height: Number(e.target.value) || 800 }))} 
                      />
                    </div>
                  </PropertyRow>

                  <PropertyRow style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: 12 }}>
                    <input 
                      type="checkbox" 
                      id="showGrid" 
                      checked={canvasConfig.showGrid} 
                      onChange={(e) => setCanvasConfig(prev => ({ ...prev, showGrid: e.target.checked }))} 
                    />
                    <PropertyLabel htmlFor="showGrid" style={{ marginBottom: 0, cursor: 'pointer' }}>Exibir Grade de Guia</PropertyLabel>
                  </PropertyRow>
                </PropertyGroupContent>
              </PropertyGroup>

              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b' }}>💡 Dica</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  Selecione um item no painel central para configurar seus dados, cores e comportamentos específicos.
                </p>
              </div>
            </PropertiesPanel>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
              <FontAwesomeIcon icon={faBoxOpen} size="3x" style={{ marginBottom: '20px', opacity: 0.2 }} />
              <p style={{ fontWeight: 600, color: '#64748b' }}>Nenhum dashboard selecionado</p>
              <p style={{ fontSize: '13px' }}>Por favor, selecione ou crie um dashboard para começar a editar.</p>
            </div>
          )}
        </PanelContent>
      </RightPanel>
      </BuilderContainer>
      {/* <DevLogButton /> Removido para evitar overlay duplicado */}
    </>
  );
}

export default DashboardBuilder;













