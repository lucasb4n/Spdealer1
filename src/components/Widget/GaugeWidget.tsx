import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useWidgetData } from '../../contexts/WidgetDataContext';

export interface VisualConfigGauge {
  card_bg?: string;
  card_radius?: number | string;
  card_shadow?: string;
  
  gauge_color?: string;
  gauge_bg?: string;
  gauge_width?: number;
  
  min_value?: number;
  max_value?: number;
  unit?: string;
  
  title_color?: string;
  value_color?: string;
}

const GaugeContainer = styled.div<{ $vc: VisualConfigGauge }>`
  background-color: ${({ $vc }) => $vc.card_bg || '#ffffff'};
  border-radius: ${({ $vc }) => (typeof $vc.card_radius === 'number' ? `${$vc.card_radius}px` : $vc.card_radius || '12px')};
  box-shadow: ${({ $vc }) => $vc.card_shadow || '0 4px 12px rgba(0,0,0,0.05)'};
  padding: 20px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const SvgContainer = styled.div`
  width: 100%;
  height: 100%;
  max-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GaugeText = styled.div`
  position: absolute;
  bottom: 25%;
  text-align: center;
`;

const ValueLabel = styled.div<{ $color?: string }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => props.$color || '#1e293b'};
  line-height: 1;
`;

const UnitLabel = styled.div`
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
  margin-top: 4px;
`;

const TitleLabel = styled.h3<{ $color?: string }>`
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => props.$color || '#475569'};
  text-align: center;
  width: 100%;
`;

export const GaugeWidget: React.FC<{
  title: string;
  widgetId?: string | number;
  visual_config?: VisualConfigGauge;
  data_config?: { value_field?: string };
}> = ({ title, widgetId, visual_config, data_config }) => {
  const vc = visual_config || {};
  const contextData = useWidgetData();
  
  const data = useMemo(() => {
    if (widgetId && contextData) return contextData.get(widgetId);
    return null;
  }, [widgetId, contextData]);

  const value = useMemo(() => {
    if (!data?.rows?.[0]) return 0;
    const field = data_config?.value_field || 'value';
    return parseFloat(data.rows[0][field]) || 0;
  }, [data, data_config]);

  const min = vc.min_value ?? 0;
  const max = vc.max_value ?? 100;
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  // Parâmetros do SVG do Gauge (Semi-círculo)
  const radius = 70;
  const strokeWidth = vc.gauge_width || 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI; // Semi-circunferência
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <GaugeContainer $vc={vc}>
      <TitleLabel $color={vc.title_color}>{title}</TitleLabel>
      
      <SvgContainer>
        <svg height={radius * 1.2} width={radius * 2} viewBox={`0 0 ${radius * 2} ${radius}`}>
          {/* Background Path */}
          <path
            d={`M ${strokeWidth/2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth/2},${radius}`}
            fill="none"
            stroke={vc.gauge_bg || '#e2e8f0'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress Path */}
          <path
            d={`M ${strokeWidth/2},${radius} A ${normalizedRadius},${normalizedRadius} 0 0,1 ${radius * 2 - strokeWidth/2},${radius}`}
            fill="none"
            stroke={vc.gauge_color || 'var(--user-primary, #3b82f6)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s ease-in-out'
            }}
            strokeLinecap="round"
          />
        </svg>
      </SvgContainer>

      <GaugeText>
        <ValueLabel $color={vc.value_color}>{value}</ValueLabel>
        <UnitLabel>{vc.unit || '%'}</UnitLabel>
      </GaugeText>
    </GaugeContainer>
  );
};













