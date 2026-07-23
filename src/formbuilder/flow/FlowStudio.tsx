import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { FlowDefinition } from 'flow';
import { FlowBlockPalette } from './FlowBlockPalette';
import { FlowDiagram } from './FlowDiagram';
import { FlowDetails } from './FlowDetails';

const StudioWrapper = styled.div`
  display: flex;
  height: 100%;
`;
const LeftPane = styled.div`
  width: 260px;
  border-right: 1px solid #e5e7eb;
  padding: 16px;
`;
const CenterPane = styled.div`
  flex: 1;
  border-right: 1px solid #e5e7eb;
  padding: 16px;
`;
const RightPane = styled.div`
  width: 320px;
  padding: 16px;
`;

export interface FlowStudioProps {
  flow: FlowDefinition;
  onChange?: (next: FlowDefinition) => void;
  visual?: Record<string, any>;
}

export const FlowStudio: React.FC<FlowStudioProps> = ({ flow, onChange }) => {
  // estado local para refletir alterações do diagrama antes de persistir
  const [current, setCurrent] = useState<FlowDefinition>(flow);

  useEffect(() => {
    setCurrent(flow);
  }, [flow]);

  const handleChange = (next: FlowDefinition) => {
    setCurrent(next);
    onChange?.(next);
  };

  return (
    <StudioWrapper>
      <LeftPane>
        <FlowBlockPalette />
      </LeftPane>
      <CenterPane>
        <FlowDiagram flow={current} onChange={handleChange} />
      </CenterPane>
      <RightPane>
        <FlowDetails flow={current} onChange={handleChange} />
      </RightPane>
    </StudioWrapper>
  );
};

export default FlowStudio;















