import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useWidgetData } from '../../contexts/WidgetDataContext';
// Função utilitária para garantir que apenas string/número seja renderizado
function getSafeText(value: any): string | number {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map(getSafeText).join(', ');
  if (value && typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return '';
}

interface TextWidgetProps {
  config: any;
  data: any;
  theme?: any;
  visual?: any;
  widgetId?: string | number;
}

const StyledText = styled.div<{ $vc?: any }>`
  color: ${(p: any) => p.$vc?.color ?? 'inherit'};
  font-size: ${(p: any) => p.$vc?.font_size ?? '1rem'};
  padding: ${(p: any) => p.$vc?.padding ?? '0'};
`;

const TextWidget: React.FC<TextWidgetProps> = ({ config, data, theme, visual, widgetId }) => {
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

  const vc = visual ?? config.visual_config ?? {};
  return (
    <StyledText $vc={vc}>{getSafeText(finalData?.text) || getSafeText(config?.text) || getSafeText(config?.title) || '-'}</StyledText>
  );
};

export default TextWidget;













