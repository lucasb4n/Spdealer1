import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLayerGroup, faBuilding } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

const LinksContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 48px 0;
`;

const LinkCard = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(34,58,94,0.07);
  padding: 32px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  min-width: 260px;
  &:hover {
    box-shadow: 0 4px 18px rgba(34,58,94,0.13);
    transform: translateY(-2px);
  }
`;

const LinkTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: #223a5e;
  margin-top: 12px;
`;

export const ParametrosGeraisLinks: React.FC = () => {
  const navigate = useNavigate();
  return (
    <LinksContainer>
      <LinkCard onClick={() => navigate('/usuarios')}>
        <FontAwesomeIcon icon={faUser} size="2x" color="#2563eb" />
        <LinkTitle>Cadastro de Usuário</LinkTitle>
      </LinkCard>
      <LinkCard onClick={() => navigate('/grupos')}>
        <FontAwesomeIcon icon={faLayerGroup} size="2x" color="#2563eb" />
        <LinkTitle>Cadastro de Grupos</LinkTitle>
      </LinkCard>
      <LinkCard onClick={() => navigate('/parametros/departamentos')}>
        <FontAwesomeIcon icon={faBuilding} size="2x" color="#2563eb" />
        <LinkTitle>Departamentos/Centro de Custos</LinkTitle>
      </LinkCard>
      <LinkCard onClick={() => navigate('/parametros/tipos-fornecedores')}>
        <FontAwesomeIcon icon={faBuilding} size="2x" color="#2563eb" />
        <LinkTitle>Tipos de Fornecedores</LinkTitle>
      </LinkCard>
    </LinksContainer>
  );
};













