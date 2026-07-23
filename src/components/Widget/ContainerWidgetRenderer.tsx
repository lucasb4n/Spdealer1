// src/components/Widget/ContainerWidgetRenderer.tsx
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { ClientSideWidget, DashboardTheme } from 'dashboard';

type AnyConfig = Record<string, any>;

interface ContainerWidgetRendererProps {
  config: ClientSideWidget;        // vinda do DynamicDashboard (lado do cliente)
  visual?: AnyConfig;              // override opcional do visual_config
  theme?: DashboardTheme;          // tema opcional
  children?: ReactNode;            // filhos já renderizados (conteúdo)
  // novos props para permitir renderização por colunas
  childWidgets?: ClientSideWidget[];
  renderChild?: (w: ClientSideWidget) => ReactNode;
}

// Helpers para aceitar snake_case e camelCase
function get(vc: AnyConfig | undefined, camel: string, snake: string, fallback?: string) {
  if (!vc) return fallback;
  return (vc[camel] ?? vc[snake] ?? fallback) as string | undefined;
}

// converter valores de tamanho para CSS (aceita número -> px ou string com unidade)
function toCssSize(v: any, fallback = ''): string {
  if (v === undefined || v === null || v === '') return fallback;
  if (typeof v === 'number') return `${v}px`;
  return String(v);
}

// Container sem position absolute (quem posiciona é o pai - WidgetLayer)
const StyledContainer = styled.div<{ $vc?: AnyConfig; theme?: DashboardTheme }>`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${({ $vc, theme }) =>
    get($vc, 'cardBg', 'card_bg', theme?.backgroundColor || '#ffffff')};
  border-radius: ${({ $vc }) => get($vc, 'cardRadius', 'card_radius', '14px')};
  box-shadow: ${({ $vc }) => get($vc, 'cardShadow', 'card_shadow', '0 2px 12px rgba(34,51,106,0.10)')};
  padding: ${({ $vc }) => get($vc, 'padding', 'padding', '32px')};
  overflow: visible;

  display: flex;
  flex-direction: column;
  gap: ${({ $vc }) => get($vc, 'container_gap', 'container_gap', '32px')};
`;

const ContainerTitle = styled.h4<{ $vc?: AnyConfig }>`
  font-size: ${({ $vc }) => get($vc, 'titleSize', 'title_size', '1.15rem')};
  font-weight: ${({ $vc }) => ($vc?.titleWeight ?? $vc?.title_weight ?? 600)};
  color: ${({ $vc }) => get($vc, 'titleColor', 'title_color', '#64748b')};
  text-transform: ${({ $vc }) => get($vc, 'titleTransform', 'title_transform', 'uppercase')};
  margin: ${({ $vc }) => ($vc?.titleMargin ?? $vc?.title_margin ?? 0)};
`;

// Layout dos filhos segundo visual.group_config
const ChildrenWrapper = styled.div<{ $gc?: AnyConfig }>`
  display: ${({ $gc }) => (get($gc, 'display', 'display', 'flex'))};
  flex-direction: ${({ $gc }) => (get($gc, 'flexDirection', 'flex_direction', 'column'))};
  gap: ${({ $gc }) => toCssSize(get($gc, 'gap', 'gap', '24px'), '24px')};
  /* garantir gap padrão 32px para alinhar com Objetivo.html */
  gap: ${({ $gc }) => toCssSize(get($gc, 'gap', 'gap', '32px'), '32px')};
  /* Respeitar alignItems exatamente do JSON, sem centralização automática */
  align-items: ${({ $gc }) => (get($gc, 'alignItems', 'align_items', 'flex-start'))};
  flex-wrap: ${({ $gc }) => (get($gc, 'flexWrap', 'flex_wrap', 'wrap'))};
  justify-content: ${({ $gc }) => (get($gc, 'justifyContent', 'justify_content', 'flex-start'))};
  flex: 1 1 auto;
  min-width: 1px;
  min-height: 1px;
`;

const Column = styled.div<{
  $basis?: string;
  $grow?: number;
  $direction?: string;
  $align?: string;
  $justify?: string;
  $wrap?: string;
  $gap?: string;
}>`
  display: flex;
  flex-direction: ${({ $direction }) => $direction || 'column'};
  flex-wrap: ${({ $wrap }) => $wrap || 'nowrap'};
  justify-content: ${({ $justify }) => $justify || 'flex-start'};
  align-items: ${({ $align, $direction }) => $align || ($direction === 'row' ? 'center' : 'stretch')};
  gap: ${({ $gap }) => $gap || '24px'};
  flex: ${({ $grow, $basis }) => {
    const grow = $grow ?? ($basis ? 0 : 1);
    const basis = $basis ?? 'auto';
    return `${grow} 1 ${basis}`;
  }};
  flex-basis: ${({ $basis }) => $basis ?? 'auto'};
  max-width: ${({ $basis }) => ($basis && $basis !== 'auto' ? $basis : 'none')};
  min-width: 0;
`;

// Debug visuals removed for production

const ContainerWidgetRenderer: React.FC<ContainerWidgetRendererProps> = ({
  config,
  visual,
  theme,
  children,
  childWidgets,
  renderChild,
}) => {
  // Prioriza visual recebido em prop; senão usa visual do config
  const vc = visual || config?.visualConfig || {};
  const groupConfig = vc?.group_config || vc?.group || {};

  // detecta colunas definidas: [{ items: ["widgetA", "widgetB"] }, ...]
  let columns: any[] = Array.isArray(groupConfig.columns) ? groupConfig.columns : [];

  // Compat: se houver apenas uma coluna com múltiplos itens e o container for row,
  // e os itens forem KPIs (ou genéricos), expandimos para colunas separadas para
  // permitir layout horizontal sem necessidade de alterar o DB.
  try {
    if (columns.length === 1 && Array.isArray(columns[0].items) && (groupConfig.flexDirection || groupConfig.flex_direction || 'row') === 'row') {
      const items = columns[0].items || [];
      if (items.length > 1) {
        // criar coluna por item
        const newCols = items.map((it: any) => ({ items: [it], flex: (columns[0].flex ?? 1) }));
        columns = newCols;
      }
    }
  } catch (e) {
    // silenciar - continua com columns originais
  }

  // helper para buscar widget object por widgetId
  const findWidgetById = (widgetId: string | number | undefined) => {
    if (!widgetId || !Array.isArray(childWidgets)) return undefined;
    return childWidgets.find((cw: any) =>
      String(cw.widgetId ?? cw.widget_id ?? cw.widgetId ?? cw.id) === String(widgetId)
    );
  };

  // DEBUG: Log para verificar se está renderizando
  console.log(`[ContainerWidgetRenderer] Renderizando container: id=${config.id}, title="${config.title}", childWidgets=${childWidgets?.length || 0}, columns=${columns.length}`);

  return (
    <StyledContainer $vc={vc} theme={theme}>
      {config?.title ? <ContainerTitle $vc={vc}>{config.title}</ContainerTitle> : null}
      {/* Se houver columns, renderiza uma coluna para cada item e mapeia widgets dentro */}
      {columns.length ? (
        // quando há columns, forçamos direção em linha para que colunas se comportem como grid
        <ChildrenWrapper $gc={{ ...groupConfig, flexDirection: (groupConfig.flexDirection || 'row') }} style={{ width: '100%' }}>
          {columns.map((col, idx) => {
            // interpreta col.width (1..12) como fraction (width/12) para um flex decimal mais previsível
            let flexBasis: string | undefined;
            let flexGrow: number | undefined;
            if (col?.width !== undefined && col.width !== null) {
              const w = Number(col.width);
              if (!Number.isNaN(w) && w > 0) {
                const frac = Math.max(0.05, Math.min(1, w / 12));
                flexBasis = `${(frac * 100).toFixed(3)}%`;
                flexGrow = 0;
              }
            } else if (col?.flex !== undefined && col.flex !== null) {
              const f = Number(col.flex);
              if (!Number.isNaN(f) && f > 0) {
                flexGrow = f;
              }
            }

            const gapSize = toCssSize(col.gap ?? groupConfig.gap ?? '24px');
            const direction = col.flexDirection || col.direction || 'column';
            const align = col.alignItems || col.align || undefined;
            const justify = col.justifyContent || col.justify || undefined;
            const wrap = col.flexWrap || col.wrap || (direction === 'row' ? 'wrap' : 'nowrap');

            return (
              <Column
                key={idx}
                $basis={flexBasis}
                $grow={flexGrow}
                $gap={gapSize}
                $direction={direction}
                $align={align}
                $justify={justify}
                $wrap={wrap}
              >
                {(Array.isArray(col.items) ? col.items : []).map((it: any) => {
                  const wid = typeof it === 'string' ? it : (it.widgetId || it.widget_id);
                  const widgetObj = findWidgetById(wid);
                  if (widgetObj && renderChild) {
                    return (
                      <div key={wid} data-widgetid={wid}>
                        {renderChild(widgetObj)}
                      </div>
                    );
                  }
                  // fallback: se children foram passados (pré-renderizados), encontra por key
                  if (children) {
                    // children pode ser um array de ReactFragment com keys iguais ao id
                    return null; // não tenta mapear aqui — o DynamicDashboard já passa renderChild
                  }
                  return null;
                })}
              </Column>
            );
          })}
        </ChildrenWrapper>
      ) : (
        // Sem columns: renderizar filhos diretamente em flex row
        <ChildrenWrapper $gc={groupConfig}>
          {children}
          {/* Fallback: se childWidgets e renderChild foram passados, renderizar filhos */}
          {!children && childWidgets && renderChild && childWidgets.map((child) => (
            <div key={child.id}>
              {renderChild(child)}
            </div>
          ))}
        </ChildrenWrapper>
      )}
    </StyledContainer>
  );
};

export default ContainerWidgetRenderer;













