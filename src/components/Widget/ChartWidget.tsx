import React, { useMemo } from 'react';
import styled from 'styled-components';
import '../Chart/Chart.css';
import { useWidgetData } from '../../contexts/WidgetDataContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js/auto';
import { Line } from 'react-chartjs-2';

// Registar plugins e escalas necessários
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Função utilitária para garantir que apenas string/número seja renderizado
function getSafeText(value: any): string | number {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map(getSafeText).join(', ');
  if (value && typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return '';
}

interface ChartWidgetProps {
  config: any;
  data: any;
  theme?: any;
  visual?: any;
  widgetId?: string | number;
}
const StyledChartCard = styled.div<{ $vc?: any }>`
  background: ${(p: any) => p.$vc?.card_bg ?? '#fff'};
  border-radius: ${(p: any) => (p.$vc?.card_radius ? `${p.$vc.card_radius}px` : '14px')};
  box-shadow: ${(p: any) => p.$vc?.card_shadow ?? '0 4px 18px rgba(34,51,106,0.08)'};
  padding: ${(p: any) => p.$vc?.card_padding ?? '28px'};
  margin-bottom: ${(p: any) => p.$vc?.card_margin_bottom ?? '32px'};
  max-width: ${(p: any) => p.$vc?.card_max_width ?? '1000px'};
  margin-left: ${(p: any) => p.$vc?.card_margin_left ?? 'auto'};
  margin-right: ${(p: any) => p.$vc?.card_margin_right ?? 'auto'};
  border: ${(p: any) => (p.$vc?.card_border_width && p.$vc?.card_border ? `${p.$vc.card_border_width}px solid ${p.$vc.card_border}` : '1.5px solid #e3e8f0')};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const ChartTitle = styled.div<{ $vc?: any }>`
  font-size: ${(p: any) => p.$vc?.title_font_size ?? '1.15rem'};
  font-weight: ${(p: any) => p.$vc?.title_font_weight ?? 600};
  color: ${(p: any) => p.$vc?.title_color ?? '#333'};
  margin-bottom: ${(p: any) => p.$vc?.title_margin_bottom ?? '16px'};
  text-align: ${(p: any) => p.$vc?.title_align ?? 'left'};
`;

const ChartWidget: React.FC<ChartWidgetProps> = ({ config, data, theme, visual, widgetId }) => {
  // Buscar dados do contexto se disponível
  const contextData = useWidgetData();
  const dataFromContext = useMemo(() => {
    if (widgetId && contextData) {
      return contextData.get(widgetId);
    }
    return undefined;
  }, [widgetId, contextData]);
  
  // ⚠️ CRÍTICO: 'data' é CONFIGURAÇÃO (config widget), não dados!
  // Os dados REAIS vêm do contextData (rows/columns)
  // Nunca usar 'data' como source de dados - usar 'data' apenas para config
  const actualRowsData = dataFromContext || (data && Array.isArray(data.rows) ? data : undefined);

  // eslint-disable-next-line no-console
  console.log('[ChartWidget] widgetId:', widgetId, 'dataFromContext:', dataFromContext ? '✅ encontrado' : '❌ vazio/undefined', 'actualRowsData:', actualRowsData ? `✅ ${actualRowsData.rows?.length ?? 0} rows` : '❌ undefined');

  // Validação: se config é undefined, retornar placeholder
  if (!config) {
    return (
      <StyledChartCard>
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          Configuração do gráfico indisponível
        </div>
      </StyledChartCard>
    );
  }

  // Fallback para visual_config
  const visualConfig = visual ?? config?.visual_config ?? {};
  const chartConfig = config?.data_config ?? {};

  // CanvasWrapper intentionally omitted (unused) to avoid lint warnings

  // Espera-se que o `actualRowsData` venha no formato { rows: Array, columns: Array } (do banco)
  let chartData: { labels: string[]; datasets: any[] } = { labels: [], datasets: [] };
  
  // Tentar converter dados do banco (rows/columns) para formato chart.js
  if (actualRowsData && Array.isArray(actualRowsData.rows) && Array.isArray(actualRowsData.columns) && actualRowsData.rows.length > 0) {
    // Extrai nome da coluna: pode ser string ou objeto com .name ou .field
    const getColumnName = (col: any) => typeof col === 'string' ? col : (col?.name || col?.field || String(col));
    
    // Pega primeira coluna como labels e segunda como data
    const labelCol = getColumnName(actualRowsData.columns[0]) || 'x';
    const dataCol = getColumnName(actualRowsData.columns[1]) || 'y';
    
    chartData.labels = actualRowsData.rows.map((row: any) => row[labelCol]);
    chartData.datasets = [{
      label: visualConfig.title || dataCol,
      data: actualRowsData.rows.map((row: any) => row[dataCol]),
      backgroundColor: visualConfig.fillColor ?? 'rgba(124,58,237,0.08)',
      borderColor: visualConfig.lineColor ?? '#7c3aed',
      fill: true,
      tension: 0.3,
    }];
  } else if (data && Array.isArray(data.series) && Array.isArray(data.categories)) {
    chartData.labels = data.categories;
    chartData.datasets = data.series.map((s: any, idx: number) => ({
      label: s.name ?? (visualConfig.title ?? `Série ${idx + 1}`),
      data: Array.isArray(s.data) ? s.data : [],
      backgroundColor: s.backgroundColor ?? (idx === 0 ? (visualConfig.fillColor ?? 'rgba(124,58,237,0.08)') : undefined),
      borderColor: s.borderColor ?? (idx === 0 ? (visualConfig.lineColor ?? '#7c3aed') : undefined),
      fill: s.fill ?? true,
      tension: s.tension ?? 0.3,
    }));
  } else if (chartConfig.data && typeof chartConfig.data === 'object') {
    chartData = {
      ...chartConfig.data,
      datasets: Array.isArray(chartConfig.data?.datasets) ? chartConfig.data.datasets : [],
      labels: Array.isArray(chartConfig.data?.labels) ? chartConfig.data.labels : [],
    };
  }

  // eslint-disable-next-line no-console
  console.log('[ChartWidget] chartData produzido:', { labelsCount: chartData.labels?.length ?? 0, datasetsCount: chartData.datasets?.length ?? 0, hasLabels: chartData.labels?.length > 0, hasData: chartData.datasets?.some(d => d.data?.length > 0) });

  // Botões de ação
  const actions = Array.isArray(visualConfig.actions) ? visualConfig.actions : [];
  const actionsIcons = Array.isArray(visualConfig.actions_icons) ? visualConfig.actions_icons : [];
  const actionsTooltips = Array.isArray(visualConfig.actions_tooltips) ? visualConfig.actions_tooltips : [];

  return (
  <StyledChartCard $vc={visualConfig}>
      {visualConfig.title && (
        <ChartTitle $vc={visualConfig} className="chart-title">{visualConfig.title}</ChartTitle>
      )}
      <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Line
          data={chartData}
          options={
            visualConfig.chartConfig?.options ?? chartConfig.options ?? {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  ticks: {
                    callback: function (value: any) {
                      try {
                        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
                      } catch (e) {
                        return value;
                      }
                    },
                  },
                },
                x: {
                  ticks: {
                    maxRotation: 0,
                    autoSkip: true,
                  },
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function (context: any) {
                      const v = context.parsed.y ?? context.parsed ?? context.raw;
                      try {
                        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));
                      } catch (e) {
                        return String(v);
                      }
                    },
                  },
                },
              },
            }
          }
          style={{ height: visualConfig.canvas_height ?? visualConfig.chart_height ?? 200 }}
        />
      </div>
      {visualConfig.label && <div style={visualConfig.labelStyle}>{getSafeText(visualConfig.label)}</div>}
      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {actions.map((action: string, idx: number) => (
            <button
              key={action}
              style={{
                background: visualConfig.actions_bg ?? '#f4f6fa',
                color: visualConfig.actions_icon_color ?? '#2563eb',
                border: 'none',
                borderRadius: visualConfig.actions_radius ? `${visualConfig.actions_radius}px` : '6px',
                marginRight: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              title={actionsTooltips[idx] ?? ''}
            >
              <i className={`fa-solid ${actionsIcons[idx] ?? ''}`}></i>
            </button>
          ))}
        </div>
      )}
  </StyledChartCard>
  );
};

export default ChartWidget;













