import React from 'react';
import styled from 'styled-components';

const Box = styled.div``;

export const DecisionNode: React.FC<{ data: { label?: string } }> = ({ data }) => {
  return <Box>{data.label || 'Decisão'}</Box>;
};















