import React from 'react';
import styled from 'styled-components';
// Função utilitária para garantir que apenas string/número seja renderizado
function getSafeText(value: any): string | number {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map(getSafeText).join(', ');
  if (value && typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return '';
}

interface ImageWidgetProps {
  config: any;
  data: any;
  theme?: any;
  visual?: any;
}

const Wrapper = styled.div<{ $vc?: any }>`
  display: block;
  padding: ${(p: any) => p.$vc?.padding ?? '0'};
  background: ${(p: any) => p.$vc?.background ?? 'transparent'};
`;

const Img = styled.img<{ $isRounded?: boolean }>`
  max-width: 100%;
  height: auto;
  border-radius: ${(p: any) => (p.$isRounded ? '8px' : '0')};
`;

const ImageWidget: React.FC<ImageWidgetProps> = ({ config, data, theme, visual }) => {
  const vc = visual ?? config.visual_config ?? {};
  const src = (getSafeText(data?.url) || getSafeText(config?.url) || getSafeText(config?.imageUrl) || '').toString();
  const alt = (getSafeText(config?.alt) || 'Imagem').toString();
  return (
    <Wrapper $vc={vc}>
      <Img src={src} alt={alt} style={vc?.image?.style ?? undefined} $isRounded={!!vc?.image?.rounded} />
    </Wrapper>
  );
};

export default ImageWidget;













