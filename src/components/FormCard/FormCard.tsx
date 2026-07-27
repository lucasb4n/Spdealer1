import React from 'react';
import styled from 'styled-components';

const StyledFormCard = styled.div`
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  border: 1px solid #e0e0e0;
  padding: 25px;
  margin-bottom: 20px;

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333333;
    margin-bottom: 20px;
  }
`;

interface FormCardProps {
  title?: string;
  children: React.ReactNode;
}

export const FormCard: React.FC<FormCardProps> = ({ title, children }) => {
  return (
    <StyledFormCard>
      {title && <h3>{title}</h3>}
      {children}
    </StyledFormCard>
  );
};













