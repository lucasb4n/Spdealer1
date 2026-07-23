import React from 'react';
import styled from 'styled-components';
import { ItemForm } from '../ItemForm/ItemForm';

const StyledFormPage = styled.div`
  background: #f4f7f6;
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
`;

const PageHeader = styled.div`
  margin-bottom: 25px;
`;

const PageTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #333333;
`;

const FormPageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: calc(100vh - 60px);
`;

const FormCard = styled.div`
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
`;

interface FormPageProps {
  title: string;
  children?: React.ReactNode;
}

export const FormPage: React.FC<FormPageProps> = ({ title, children }) => {
  return (
    <StyledFormPage>
      <PageHeader>
        <PageTitle>{title}</PageTitle>
      </PageHeader>
      <FormPageWrapper>
        <FormCard>
          <ItemForm />
        </FormCard>
      </FormPageWrapper>
    </StyledFormPage>
  );
};













