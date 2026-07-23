import React from 'react';
import styled from 'styled-components';
import { SimplePageContainer } from 'styles/PageContainers';

const Container = styled(SimplePageContainer)`
  padding: 20px;
  width: 100%;
`;
const Title = styled.h1`
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;
const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
`;
const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 32px 0 18px 0;
`;
const CardGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
`;
const Card = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 28px 24px 20px 24px;
  min-width: 320px;
  flex: 1 1 320px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: box-shadow 0.2s;
  border: 2px solid transparent;
  &:hover {
    box-shadow: 0 4px 16px rgba(37,99,235,0.10);
    border-color: #2563eb22;
  }
`;
const CardIcon = styled.div`
  font-size: 2.2rem;
  margin-bottom: 12px;
  color: #2563eb;
`;
const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 6px 0;
`;
const CardDesc = styled.p`
  color: #6b7280;
  font-size: 0.98rem;
  margin-bottom: 18px;
`;
const CardLink = styled.a`
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { text-decoration: underline; }
`;

const FinanceiroConfig: React.FC = () => (
  <Container>
    <Title>
      <span role="img" aria-label="financeiro">💰</span>
      Financeiro
    </Title>
    <Subtitle>Gerencie contas, bancos e operações financeiras do sistema</Subtitle>
    <SectionTitle>Funcionalidades Financeiras</SectionTitle>
    <CardGrid>
      <Card>
        <CardIcon>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="6" width="20" height="12" rx="2" fill="#4ade80"/>
            <path d="M12 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="2" fill="#fff"/>
          </svg>
        </CardIcon>
        <CardTitle>Contas a Receber</CardTitle>
        <CardDesc>Controle e acompanhe todos os recebimentos, clientes devedores e previsões de entrada.</CardDesc>
        <CardLink href="/financeiro/contas-receber">Acessar funcionalidade →</CardLink>
      </Card>
      <Card>
        <CardIcon>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="7" width="18" height="10" rx="2" fill="#60a5fa"/>
            <rect x="6" y="12" width="6" height="2" rx="1" fill="#fff"/>
            <circle cx="17" cy="13" r="1" fill="#fff"/>
          </svg>
        </CardIcon>
        <CardTitle>Contas a Pagar</CardTitle>
        <CardDesc>Gerencie pagamentos, fornecedores, vencimentos e fluxo de saída de recursos.</CardDesc>
        <CardLink href="/financeiro/contas-pagar">Acessar funcionalidade →</CardLink>
      </Card>
      <Card>
        <CardIcon>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="10" width="16" height="8" rx="2" fill="#fbbf24"/>
            <rect x="7" y="14" width="2" height="2" rx="1" fill="#fff"/>
            <rect x="11" y="14" width="2" height="2" rx="1" fill="#fff"/>
            <rect x="15" y="14" width="2" height="2" rx="1" fill="#fff"/>
          </svg>
        </CardIcon>
        <CardTitle>Gestão de Bancos e Operações</CardTitle>
        <CardDesc>Cadastre contas bancárias, acompanhe saldos, extratos e operações financeiras.</CardDesc>
        <CardLink href="/financeiro/bancos">Acessar funcionalidade →</CardLink>
      </Card>
    </CardGrid>
  </Container>
);

export default FinanceiroConfig;













