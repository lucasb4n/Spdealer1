import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useWidgetData } from '../../contexts/WidgetDataContext';

// ============================
// Tipagens (fiéis ao snake_case do banco)
// ============================
export type KpiIndicatorType = 'up' | 'down' | 'neutral';

export interface VisualConfigKpi {
  icon?: string;
  icon_color?: string;
  icon_bg?: string;
  icon_size?: string;               // ex: "2.1rem"
  icon_radius?: number | string;    // ex: 8 → "8px"
  icon_shadow?: string;

  card_bg?: string;
  card_border?: string;
  card_border_width?: number | string; // 1.5 → "1.5px" apenas para border-width
  card_border_hover_color?: string;
  card_radius?: number | string;
  card_shadow?: string;
  card_padding?: string;           // ex: "24px 32px"

  title_font_size?: string;
  title_font_weight?: number | string; // 600, "bold"
  title_color?: string;

  value_font_size?: string;
  value_color?: string;
  value_font_weight?: number | string;

  label_font_size?: string;
  label_color?: string;
  label_text?: string;              // ex: "Hoje", "Esta semana"

  indicator_icon?: string;         // fa-arrow-up/down/right
  indicator_type?: KpiIndicatorType;
  indicator_text?: string;
  indicator_up_color?: string;
  indicator_down_color?: string;
  indicator_neutral_color?: string;

  actions?: string[];              // ["refresh","add"]
  actions_icons?: string[];        // ["fa-rotate","fa-plus"]
  actions_tooltips?: string[];     // ["Atualizar","Adicionar novo"]
  actions_icon_color?: string;
  actions_bg?: string;
  actions_hover_bg?: string;

  group_id?: string;
}

// ============================
// Utilitários de normalização
// ============================
const toPx = (v: number | string | undefined, fallback: string): string => {
  if (v == null) return fallback;
  if (typeof v === 'number') return `${v}px`;
  return v; // já vem com unidade (ex.: "2.1rem" ou "12px")
};

// aceita number ou string; se number -> px, se string -> devolve
const toCssSize = (v: number | string | undefined, fallback = ''): string => {
  if (v == null || v === '') return fallback;
  if (typeof v === 'number') return `${v}px`;
  return String(v);
};

const toBorderWidth = (v: number | string | undefined, fallback: string): string => {
  if (v == null) return fallback;
  if (typeof v === 'number') return `${v}px`;
  return v; // "1.5" (string) é aceito, mas prefira "1.5px"
};

const safeWeight = (v: number | string | undefined, fallback: number | string) =>
  v ?? fallback;

// safeString removed (unused) to silence eslint warning

// ============================
// Styled-components (sem hardcode — só fallbacks mínimos)
// ============================
const Card = styled.div<{ $vc: VisualConfigKpi }>`
  background-color: ${({ $vc }) => $vc.card_bg || '#ffffff'};
  border: ${props => toBorderWidth(props.$vc.card_border_width, '1px')} solid
    ${({ $vc }) => $vc.card_border || 'transparent'};
  border-radius: ${({ $vc }) => toPx($vc.card_radius, '14px')};
  box-shadow: ${({ $vc }) => $vc.card_shadow || '0 4px 18px rgba(34,51,106,0.10)'};
  padding: ${({ $vc }) => $vc.card_padding || '20px 24px'}; /* ligeiro ajuste para caber mais cards */
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 300px;   /* alinhado ao objetivo: permitir cards maiores */
  max-width: 360px;   /* limite para manter consistência com Objetivo.html */

  &:hover {
    border-color: ${({ $vc }) =>
      $vc.card_border_hover_color || $vc.card_border || '#999999'};
  }

  &:focus-within {
    outline: 2px solid ${({ $vc }) => $vc.card_border_hover_color || '#5b9dd9'};
    outline-offset: 2px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const IconWrap = styled.div<{ $vc: VisualConfigKpi }>`
  background-color: ${({ $vc }) => $vc.icon_bg || 'transparent'};
  color: ${({ $vc }) => $vc.icon_color || 'inherit'};
  font-size: ${({ $vc }) => $vc.icon_size || '1.5rem'};
  border-radius: ${({ $vc }) => toPx($vc.icon_radius, '8px')};
  box-shadow: ${({ $vc }) => $vc.icon_shadow || 'none'};

  width: ${props => toCssSize((props.$vc?.icon_size && typeof props.$vc.icon_size === 'number') ? (props.$vc.icon_size * 1.5) : props.$vc?.icon_size || '2.25rem')};
  height: ${props => toCssSize((props.$vc?.icon_size && typeof props.$vc.icon_size === 'number') ? (props.$vc.icon_size * 1.5) : props.$vc?.icon_size || '2.25rem')};

  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Actions = styled.div<{ $vc: VisualConfigKpi }>`
  display: inline-flex;
  gap: 8px;

  button {
    background-color: ${({ $vc }) => $vc.actions_bg || 'transparent'};
    color: ${({ $vc }) => $vc.actions_icon_color || 'inherit'};
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: background-color 0.2s ease-in-out;

    &:hover {
      background-color: ${({ $vc }) => $vc.actions_hover_bg || 'transparent'};
    }

    &:focus {
      outline: 2px solid ${({ $vc }) => $vc.card_border_hover_color || '#5b9dd9'};
      outline-offset: 1px;
    }
  }
`;

const Title = styled.h3<{ $vc: VisualConfigKpi }>`
  margin: 0;
  font-size: ${({ $vc }) => $vc.title_font_size || '0.95rem'};
  font-weight: ${({ $vc }) => safeWeight($vc.title_font_weight, 600)};
  color: ${({ $vc }) => $vc.title_color || '#222'};
`;

const Value = styled.div<{ $vc: VisualConfigKpi }>`
  font-size: ${({ $vc }) => $vc.value_font_size || '2.6rem'};
  font-weight: ${({ $vc }) => safeWeight($vc.value_font_weight, 700)};
  color: ${({ $vc }) => $vc.value_color || '#000'};
`;

const Label = styled.div<{ $vc: VisualConfigKpi }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ $vc }) => $vc.label_color || '#666'};
  font-size: ${({ $vc }) => $vc.label_font_size || '0.95rem'};
`;

const IndicatorIcon = styled.i<{ color?: string }>`
  color: ${({ color }) => color || 'inherit'};
`;

// ============================
// Props do componente
// ============================
export interface KpiWidgetProps {
  title: string;
  value?: string | number;
  label?: string;
  visual_config?: VisualConfigKpi | null;

  // Dados do indicador (podem vir do data_config ou do visual_config)
  indicator_type?: KpiIndicatorType;
  indicator_text?: string;
  indicator_icon?: string;

  onAction?: (action: string) => void;

  // ID do widget para buscar dados do contexto
  widgetId?: string | number;

  // Dados vindos do DashboardRenderEngine (nova prop para extrair valor dinâmico)
  data?: Record<string, any> & { rows?: any[]; columns?: any[] };
  data_config?: { display_field?: string };
}

// ============================
// Componente
// ============================
export const KpiWidget: React.FC<KpiWidgetProps> = ({
  title,
  value: valueProp,
  label,
  visual_config,
  indicator_type,
  indicator_text,
  indicator_icon,
  onAction,
  widgetId,
  data,
  data_config,
}) => {
  const vc = visual_config || {};
  
  // Buscar dados do contexto se disponível
  const contextData = useWidgetData();
  const dataFromContext = useMemo(() => {
    if (widgetId && contextData) {
      return contextData.get(widgetId);
    }
    return undefined;
  }, [widgetId, contextData]);
  
  // Usar dados do contexto como fallback se prop não foi passada
  const finalData = data || dataFromContext;

  // DEBUG: Log para rastrear fluxo de dados
  if (process.env.NODE_ENV !== 'production') {
    if (title?.includes('Total') || title?.includes('Saldo')) {
      // eslint-disable-next-line no-console
      console.log('[KpiWidget]', { title, widgetId, hasContextData: !!dataFromContext, dataFromContext, finalData, valueProp });
    }
  }

  // Extrair valor dos dados se disponíveis
  let displayValue = valueProp;
  let trendValue: number | undefined;
  let trendIcon: 'fa-arrow-up' | 'fa-arrow-down' | 'fa-arrow-right' | undefined;
  let trendType: 'up' | 'down' | 'neutral' | undefined;
  let trendText: string | undefined;

  if (finalData && finalData.rows && finalData.rows.length > 0) {
    const firstRow = finalData.rows[0];
    let displayField = data_config?.display_field;
    
    // Se display_field não foi configurado, tentar extrair do columns
    if (!displayField && finalData.columns && finalData.columns.length > 0) {
      displayField = finalData.columns[0]?.name;
    }
    
    // Se ainda não temos displayField, usar 'value' como fallback padrão dos KPIs
    if (!displayField) {
      displayField = 'value';
    }
    
    if (displayField && displayField in firstRow) {
      displayValue = firstRow[displayField];
    } else {
      // Se mesmo assim não encontrar, tentar com 'value'
      if ('value' in firstRow) {
        displayValue = firstRow['value'];
      }
    }

    // ========== NOVO: Extrair indicador de TREND ==========
    if ('trend' in firstRow) {
      trendValue = parseFloat(firstRow['trend']);
      
      if (trendValue > 0) {
        trendIcon = 'fa-arrow-up';
        trendType = 'up';
        trendText = `↑ +${trendValue.toFixed(2)}% Esta semana`;
      } else if (trendValue < 0) {
        trendIcon = 'fa-arrow-down';
        trendType = 'down';
        trendText = `↓ ${trendValue.toFixed(2)}% Esta semana`;
      } else {
        trendIcon = 'fa-arrow-right';
        trendType = 'neutral';
        trendText = `→ ${trendValue.toFixed(2)}% Esta semana`;
      }
    }
  }

  // Formatar valor como moeda BRL quando for number
  const formattedValue = typeof displayValue === 'number'
    ? displayValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : displayValue;
  // if value is numeric string, parse and format
  const numericValue = (typeof displayValue === 'string' && !Number.isNaN(Number(String(displayValue).replace(',', '.')))) ? Number(String(displayValue).replace(',', '.')) : (typeof displayValue === 'number' ? displayValue : undefined);
  const finalValue = numericValue !== undefined ? numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : formattedValue;

  // Escolher cor do indicador com base no tipo
  const indicatorColor =
    indicator_type === 'up'
      ? (vc.indicator_up_color || '#22c55e')
      : indicator_type === 'down'
      ? (vc.indicator_down_color || '#ef4444')
      : (vc.indicator_neutral_color || vc.label_color || '#888');

  // Usar trend extraído do banco como indicador primário, depois fallback para props
  const finalIndicatorType = trendType || indicator_type;
  const finalIndicatorIcon = trendIcon || indicator_icon || vc.indicator_icon || (vc as any).indicatorIcon || '';
  const finalIndicatorText = trendText || indicator_text;

  const resolvedIndicatorIcon = finalIndicatorIcon;

  // DEBUG: Log ícones e trends (EXPANDIDO COM JSON.stringify)
  if (title?.includes('Total') || title?.includes('Saldo')) {
    const debugData = {
      title,
      vc_icon: vc.icon,
      vc_icon_color: vc.icon_color,
      vc_icon_bg: vc.icon_bg,
      vc_indicator_icon: vc.indicator_icon,
      trendIcon,
      trendType,
      trendValue,
      finalIndicatorIcon,
      finalIndicatorText,
      resolvedIndicatorIcon,
      data_rows_count: finalData?.rows?.length,
      data_first_row: finalData?.rows?.[0] ? { ...finalData.rows[0] } : null,
    };
    console.debug('[KpiWidget] Icon rendering:', debugData);
    console.log('[KpiWidget] DEBUG JSON:', JSON.stringify(debugData, null, 2));
  }

  // Ações
  const actions = Array.isArray(vc.actions) ? vc.actions : [];
  const actionsIcons = Array.isArray(vc.actions_icons) ? vc.actions_icons : [];
  const actionsTooltips = Array.isArray(vc.actions_tooltips) ? vc.actions_tooltips : [];

  // Helper: Resolve icon class name
  const getIconClass = () => {
    if (!vc.icon) return '';
    const iconStr = typeof vc.icon === 'string' ? vc.icon : (vc.icon as any)?.type || '';
    return iconStr.startsWith('fa-') ? iconStr : `fa-${iconStr}`;
  };

  return (
    <Card $vc={vc} role="region" aria-label={title}>
      <Header>
        <IconWrap $vc={vc}>
          {vc.icon && (
            <i 
              className={`fa-solid ${getIconClass()}`} 
              aria-hidden="true" 
            />
          )}
        </IconWrap>

        {actions.length > 0 && (
          <Actions $vc={vc}>
            {actions.map((act, idx) => (
              <button
                key={`${act}-${idx}`}
                type="button"
                title={actionsTooltips[idx] || act}
                aria-label={actionsTooltips[idx] || act}
                onClick={() => onAction?.(act)}
              >
                {actionsIcons[idx] ? (
                  <i 
                    className={`fa-solid ${actionsIcons[idx].startsWith('fa-') ? actionsIcons[idx] : `fa-${actionsIcons[idx]}`}`} 
                  />
                ) : null}
              </button>
            ))}
          </Actions>
        )}
      </Header>

          <Title $vc={vc}>{title}</Title>
      <Value $vc={vc}>{finalValue || 'N/A'}</Value>

      {/* indicator area: sempre renderizar se houver dados de trend ou indicador definido */}
      {(() => {
        // Determinar cor do indicador baseado no tipo final
        const indicColorTrend =
          finalIndicatorType === 'up'
            ? (vc.indicator_up_color || '#22c55e')
            : finalIndicatorType === 'down'
            ? (vc.indicator_down_color || '#ef4444')
            : (vc.indicator_neutral_color || vc.label_color || '#888');

        // Se houver trend extraído do banco, sempre renderizar
        if (finalIndicatorText || resolvedIndicatorIcon) {
          return (
            <Label $vc={vc}>
              {resolvedIndicatorIcon ? (
                <IndicatorIcon
                  className={`fa-solid ${resolvedIndicatorIcon}`}
                  color={indicColorTrend}
                  aria-hidden="true"
                />
              ) : null}
              <span>{finalIndicatorText || ''}</span>
            </Label>
          );
        }

        // Auto-detect negative values: se não houver indicador definido e o valor for numérico negativo
        const hasIndicator = indicator_text || resolvedIndicatorIcon;
        const numericVal = numericValue !== undefined ? numericValue : (typeof displayValue === 'number' ? displayValue : undefined);
        const autoIndicatorIcon = (!hasIndicator && typeof numericVal === 'number' && numericVal < 0) ? 'fa-arrow-down' : undefined;
        const finalIcon = resolvedIndicatorIcon || autoIndicatorIcon;
        return (indicator_text || finalIcon) ? (
          <Label $vc={vc}>
            {finalIcon ? (
              <IndicatorIcon
                className={`fa-solid ${finalIcon}`}
                color={indicatorColor}
                aria-hidden="true"
              />
            ) : null}
            <span>{indicator_text || ''}</span>
          </Label>
        ) : null;
      })()}

      {/* Label footer (e.g., "Hoje", "Esta semana", etc.) */}
      {label && (
        <Label $vc={vc} style={{ fontSize: '0.85rem', color: vc.label_color || '#999', marginTop: '4px' }}>
          {label}
        </Label>
      )}
    </Card>
  );
};













