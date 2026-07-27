import React from 'react';
import styled from 'styled-components';

export interface GroupConfig {
  display?: string;           // "flex"
  flexDirection?: string;     // "row" | "column"
  gap?: number | string;      // 32 → "32px"
  justifyContent?: string;    // "center", "space-between" etc.
  alignItems?: string;        // "flex-start" etc.
  marginBottom?: number | string; // 32 → "32px"
  flexWrap?: string;          // "nowrap" | "wrap"
}

export interface KpiGroupContainerProps {
  group_config?: GroupConfig | null;
  children?: React.ReactNode;
}

const toPx = (v: number | string | undefined, fallback: string) => {
  if (v == null) return fallback;
  if (typeof v === 'number') return `${v}px`;
  return v;
};

// Sem hardcode: apenas fallbacks mínimos
const Container = styled.div<{ $gc: GroupConfig }>`
  display: ${({ $gc }) => $gc.display || 'flex'};
  flex-direction: ${({ $gc }) => $gc.flexDirection || 'row'};
  gap: ${({ $gc }) => toPx($gc.gap, '32px')};
  justify-content: ${({ $gc }) => $gc.justifyContent || 'center'};
  align-items: ${({ $gc }) => $gc.alignItems || 'center'};
  margin-bottom: ${({ $gc }) => toPx($gc.marginBottom, '16px')};
  flex-wrap: ${({ $gc }) => $gc.flexWrap || 'nowrap'};
`;

export const KpiGroupContainer: React.FC<KpiGroupContainerProps> = ({ group_config, children }) => {
  const gc = group_config || {};
  return <Container $gc={gc}>{children}</Container>;
};













