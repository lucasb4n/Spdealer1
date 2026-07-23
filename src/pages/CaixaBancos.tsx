import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { DynamicPageContainer, PageHeader, PageTitle, PageSubtitle } from 'styles/PageContainers';
import CaixaBancosForm from 'components/Forms/CaixaBancosForm';
import { Modal } from 'components/Modal/Modal';

const Container = styled(DynamicPageContainer)`
  background-color: #f8f9fa;
`;

const Header = styled(PageHeader)``;

const Title = styled(PageTitle)``;

const Subtitle = styled(PageSubtitle)``;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IncluirButton = styled.button`
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;

  &:hover { opacity: 0.95; }
`;

const CaixaBancos: React.FC = () => {
  const [showCaixaPopup, setShowCaixaPopup] = useState(false);
  const [caixaPopupPayload, setCaixaPopupPayload] = useState<any>(null);

  const abrirIncluir = useCallback(() => {
    // Abrir modal em modo INCLUIR (payload vazio)
    setCaixaPopupPayload(null);
    setShowCaixaPopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowCaixaPopup(false);
    setCaixaPopupPayload(null);
  }, []);

  return (
    <Container>
      <Header>
        <Title>Controle de Caixa e Bancos</Title>
        <Subtitle>
          Processamento de movimentos financeiros com seleção de documentos
        </Subtitle>
        <ActionBar>
          <IncluirButton onClick={abrirIncluir}>+ Incluir</IncluirButton>
        </ActionBar>
      </Header>

      {/* Renderizar formulário completo (inline) para compatibilidade atual */}
      <CaixaBancosForm />

      {/* Modal flutuante para inclusão/edição/consulta */}
      <Modal isOpen={showCaixaPopup} onClose={handleClosePopup} title={caixaPopupPayload ? 'Editar Lançamento' : 'Incluir Lançamento'}>
        <CaixaBancosForm initialPayload={caixaPopupPayload} readOnlyPrimary={false} />
      </Modal>
    </Container>
  );
};

export default CaixaBancos;













