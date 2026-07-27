import React, { useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 

import { 
  faCashRegister, 
  faReceipt,
  faPlus,
  faMinus,
  faCalculator,
  faHistory
} from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
  padding: 24px;
  height: 100%;
  background: #f8fafc;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: #1f2937;
  font-size: 28px;
  font-weight: 700;
`;

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  margin-bottom: 24px;
`;

const SaldoCard = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 16px;
  padding: 24px;
  color: #fff;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
`;

const SaldoLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
`;

const SaldoValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 16px;
`;

const SaldoActions = styled.div`
  display: flex;
  gap: 12px;
`;

const SaldoButton = styled.button<{ $variant: 'entrada' | 'saida' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: ${props => props.$variant === 'entrada' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
  background: ${props => props.$variant === 'entrada' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
  }
`;

const MovimentacoesPanel = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const PanelTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MovimentacaoForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: ${props => (props.$variant === 'primary' || props.$variant === 'success') ? '#10b981' : '#6b7280'};
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => (props.$variant === 'primary' || props.$variant === 'success') ? '#059669' : '#4b5563'};
    transform: translateY(-1px);
  }
`;

const HistoricoSection = styled.div`
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const HistoricoHeader = styled.div`
  padding: 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const MovimentacaoItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const MovimentacaoInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MovimentacaoDescricao = styled.div`
  font-weight: 600;
  color: #1f2937;
`;

const MovimentacaoDetalhes = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const MovimentacaoValor = styled.div<{ tipo: 'entrada' | 'saida' }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.tipo === 'entrada' ? '#10b981' : '#ef4444'};
`;

const EmptyState = styled.div`
  padding: 48px 20px;
  text-align: center;
  color: #6b7280;
`;

// Mock data
const mockMovimentacoes = [
  {
    id: 1,
    descricao: 'Venda à vista',
    tipo: 'entrada' as const,
    valor: 150.00,
    data: '2024-01-15 14:30',
    formaPagamento: 'Dinheiro'
  },
  {
    id: 2,
    descricao: 'Compra de suprimentos',
    tipo: 'saida' as const,
    valor: 75.50,
    data: '2024-01-15 10:15',
    formaPagamento: 'Cartão de débito'
  },
  {
    id: 3,
    descricao: 'Venda parcelada',
    tipo: 'entrada' as const,
    valor: 320.00,
    data: '2024-01-14 16:45',
    formaPagamento: 'Cartão de crédito'
  }
];

const CaixaModule: React.FC = () => {
  const [saldo] = useState(1245.67);

  const totalEntradas = mockMovimentacoes
    .filter(mov => mov.tipo === 'entrada')
    .reduce((total, mov) => total + mov.valor, 0);

  const totalSaidas = mockMovimentacoes
    .filter(mov => mov.tipo === 'saida')
    .reduce((total, mov) => total + mov.valor, 0);

  // Evitar warning "assigned but never used" em builds sem referência visual
  void totalEntradas;
  void totalSaidas;

  return (
    <Container>
      <Header>
        <Title>
          <FontAwesomeIcon icon={faCashRegister} />
          Caixa
        </Title>
      </Header>

      <TopSection>
        <SaldoCard>
          <SaldoLabel>Saldo Atual</SaldoLabel>
          <SaldoValue>
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </SaldoValue>
          <SaldoActions>
            <SaldoButton $variant="entrada">
              <FontAwesomeIcon icon={faPlus} />
              Entrada
            </SaldoButton>
            <SaldoButton $variant="saida">
              <FontAwesomeIcon icon={faMinus} />
              Saída
            </SaldoButton>
          </SaldoActions>
        </SaldoCard>

        <MovimentacoesPanel>
          <PanelTitle>
            <FontAwesomeIcon icon={faCalculator} />
            Nova Movimentação
          </PanelTitle>
          <MovimentacaoForm>
            <FormGroup>
              <Label>Tipo</Label>
              <Select>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Valor</Label>
              <Input type="number" step="0.01" placeholder="0,00" />
            </FormGroup>
            <FormGroup>
              <Label>Descrição</Label>
              <Input type="text" placeholder="Descrição da movimentação" />
            </FormGroup>
            <FormGroup>
              <Label>Forma de Pagamento</Label>
              <Select>
                <option value="dinheiro">Dinheiro</option>
                <option value="debito">Cartão de Débito</option>
                <option value="credito">Cartão de Crédito</option>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
              </Select>
            </FormGroup>
            <Button $variant="primary">
              <FontAwesomeIcon icon={faReceipt} />
              Registrar
            </Button>
          </MovimentacaoForm>
        </MovimentacoesPanel>
      </TopSection>

      <HistoricoSection>
        <HistoricoHeader>
          <FontAwesomeIcon icon={faHistory} />
          Histórico de Movimentações
        </HistoricoHeader>

        {mockMovimentacoes.length > 0 ? (
          mockMovimentacoes.map(movimentacao => (
            <MovimentacaoItem key={movimentacao.id}>
              <MovimentacaoInfo>
                <MovimentacaoDescricao>
                  {movimentacao.descricao}
                </MovimentacaoDescricao>
                <MovimentacaoDetalhes>
                  {new Date(movimentacao.data).toLocaleString('pt-BR')} • {movimentacao.formaPagamento}
                </MovimentacaoDetalhes>
              </MovimentacaoInfo>
              <MovimentacaoValor tipo={movimentacao.tipo}>
                {movimentacao.tipo === 'entrada' ? '+' : '-'}R$ {movimentacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </MovimentacaoValor>
            </MovimentacaoItem>
          ))
        ) : (
          <EmptyState>
            <FontAwesomeIcon icon={faCashRegister} size="3x" style={{ marginBottom: 16, color: '#d1d5db' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Nenhuma movimentação registrada</h3>
            <p style={{ margin: 0 }}>Registre sua primeira movimentação de caixa</p>
          </EmptyState>
        )}
      </HistoricoSection>
    </Container>
  );
};

export { CaixaModule };













