import React from 'react';
import styled from 'styled-components';
import DashboardCard from './DashboardCard';

export interface DashboardTheme {
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface RowVisualConfig {
  gap?: string;
  marginBottom?: string;
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
}

export interface DashboardRowColumn {
  widgetId: string;
  width?: number;
}

export interface DashboardRowProps {
  columns: DashboardRowColumn[];
  widgets: Record<string, any>;
  theme?: DashboardTheme;
  visualConfig?: RowVisualConfig | null;
}

const Row = styled.div<{
  $gap?: string;
  $mb?: string;
  $justify?: string;
  $align?: string;
  $wrap?: string;
}>`
  display: flex;
  gap: ${(p) => p.$gap || '8px'};
  margin-bottom: ${(p) => p.$mb || '8px'};
  justify-content: ${(p) => p.$justify || 'flex-start'};
  align-items: ${(p) => p.$align || 'stretch'};
  flex-wrap: ${(p) => p.$wrap || 'nowrap'};
`;

export default function DashboardRow({
  columns,
  widgets,
  theme,
  visualConfig,
}: DashboardRowProps) {
  const vc = visualConfig || {};

  return (
    <Row
      $gap={vc.gap}
      $mb={vc.marginBottom}
      $justify={vc.justifyContent}
      $align={vc.alignItems}
      $wrap={vc.flexWrap}
    >
      {columns.map((col) => {
        const widget = widgets[col.widgetId];
        if (!widget) return null;

        return (
          <DashboardCard
            key={col.widgetId}
            widget={widget}
            width={col.width}
            theme={theme}
          />
        );
      })}
    </Row>
  );
}













