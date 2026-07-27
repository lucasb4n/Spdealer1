import React from 'react';
import styled from 'styled-components';

const Box = styled.div``;

export const LoopNode: React.FC<{ data: { label?: string } }> = ({ data }) => {
  return <Box>{data.label || 'Loop'}</Box>;
};















