import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faCalendarDay, faSync } from '@fortawesome/free-solid-svg-icons';

// ============================================================================
// TASK-105: CAIXA - FORMULÁRIO DE CONSOLIDAÇÃO (READ-ONLY)
// Fase 2: Implementação completa
// Status: ✅ PRONTO PARA TESTES VISUAIS
// Data: 02 NOV 2025
// Nota: Consolidação diária automática de saldo por banco/caixa
// ============================================================================

interface CaixaConsolidacao {
  id: number;
  filial_cai: string;
  banco_cai: string;
  cliente_cai: string;
  nomefan_bco: string;
  dtmovi_cai: string;
  saldoant_cai: number;
  debito_cai: number;
  credito_cai: number;
  saldo_cai: number;
}

interface CaixaMovimento {
  dc_cai: 'C' | 'D';
  valor_cai: number;
  descricao: string;
  dtmovi_cai: string;
}

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
  border-bottom: 2px solid #2e7d32;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: white;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 22px;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Button = styled.button`
  padding: 8px 16px;
  border: 1px solid #fff;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const ConsolidacaoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const ConsolidacaoCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardBody = styled.div`
  padding: 16px;
`;

const ValueRow = styled.div<{ highlight?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  background: ${props => props.highlight ? '#f0f4ff' : 'transparent'};
  padding-left: ${props => props.highlight ? '12px' : '0'};
  padding-right: ${props => props.highlight ? '12px' : '0'};
  border-radius: ${props => props.highlight ? '4px' : '0'};

  &:last-child {
    border-bottom: none;
  }
`;

const ValueLabel = styled.span`
  color: #666;
  font-weight: 500;
`;

const ValueAmount = styled.span<{ type?: 'credit' | 'debit' | 'balance' }>`
  font-weight: 600;
  color: ${props => {
    if (props.type === 'credit') return '#4caf50';
    if (props.type === 'debit') return '#f44336';
    return '#2196f3';
  }};
  font-size: 15px;
`;

const BalanceDisplay = styled.div<{ positive?: boolean }>`
  padding: 12px;
  background: ${props => props.positive ? '#e8f5e9' : '#ffebee'};
  border-left: 4px solid ${props => props.positive ? '#4caf50' : '#f44336'};
  border-radius: 4px;
  margin-top: 12px;
  text-align: center;

  .label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }

  .amount {
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.positive ? '#2e7d32' : '#c62828'};
  }
`;

const MovementsList = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 20px;
`;

const MovementsHeader = styled.div`
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MovementRow = styled.div<{ type: 'C' | 'D' }>`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: grid;
  grid-template-columns: 100px 1fr 120px;
  gap: 16px;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9f9f9;
  }
`;

const MovementType = styled.span<{ type: 'C' | 'D' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.type === 'C' ? '#e8f5e9' : '#ffebee'};
  color: ${props => props.type === 'C' ? '#2e7d32' : '#c62828'};
`;

const MovementDesc = styled.span`
  color: #333;
  font-size: 13px;
`;

const MovementAmount = styled.span<{ type: 'C' | 'D' }>`
  text-align: right;
  font-weight: 600;
  color: ${props => props.type === 'C' ? '#4caf50' : '#f44336'};
  font-size: 14px;
`;

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: #999;

  svg {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

const InfoBox = styled.div<{ type?: 'info' | 'warning' }>`
  padding: 12px;
  background: ${props => props.type === 'warning' ? '#fff3cd' : '#e3f2fd'};
  border-left: 4px solid ${props => props.type === 'warning' ? '#ffc107' : '#2196f3'};
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 12px;
  line-height: 1.5;
  color: ${props => props.type === 'warning' ? '#856404' : '#01579b'};
`;

// ============================================================================
// COMPONENT PRINCIPAL
// ============================================================================

const CaixaConsolidacaoForm: React.FC<{ data?: CaixaConsolidacao[]; movements?: CaixaMovimento[] }> = ({
  data = [],
  movements = [],
}) => {
  const [selectedData, setSelectedData] = useState<CaixaConsolidacao | null>(data[0] || null);
  const [filteredMovements, setFilteredMovements] = useState<CaixaMovimento[]>([]);

  useEffect(() => {
    if (selectedData) {
      // Filtrar movimentos do banco selecionado
      const filtered = movements.filter(
        m => new Date(m.dtmovi_cai).toDateString() === new Date(selectedData.dtmovi_cai).toDateString()
      );
      setFilteredMovements(filtered);
    }
  }, [selectedData, movements]);

  const handleRefresh = async () => {
    try {
      const response = await fetch('/api/v1/caixa/consolidacao');
      const newData = await response.json();
      setSelectedData(newData[0] || null);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <FontAwesomeIcon icon={faChartBar} />
          Consolidação de Caixa (Read-Only)
        </HeaderTitle>
        <HeaderActions>
          <Button onClick={handleRefresh}>
            <FontAwesomeIcon icon={faSync} /> ATUALIZAR
          </Button>
        </HeaderActions>
      </Header>

      <Content>
        <InfoBox type="info">
          💡 <strong>Consolidação Automática:</strong> Este resumo é calculado automaticamente
          ao final de cada dia. Movimentos são consolidados por banco/caixa.
        </InfoBox>

        {data.length === 0 ? (
          <EmptyState>
            <p>Nenhuma consolidação de caixa disponível.</p>
            <p>Registre movimentos para gerar o resumo.</p>
          </EmptyState>
        ) : (
          <>
            {/* RESUMO DE CONSOLIDAÇÃO */}
            <ConsolidacaoGrid>
              {data.map((item, idx) => (
                <ConsolidacaoCard
                  key={idx}
                  onClick={() => setSelectedData(item)}
                  style={{ cursor: 'pointer', border: selectedData?.banco_cai === item.banco_cai ? '2px solid #2196f3' : '1px solid #e0e0e0' }}
                >
                  <CardHeader>
                    <CardTitle>
                      {item.nomefan_bco || `Banco ${item.banco_cai}`}
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        {new Date(item.dtmovi_cai).toLocaleDateString('pt-BR')}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <ValueRow>
                      <ValueLabel>Saldo Anterior:</ValueLabel>
                      <ValueAmount>
                        R$ {item.saldoant_cai.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </ValueAmount>
                    </ValueRow>

                    <ValueRow>
                      <ValueLabel>Créditos:</ValueLabel>
                      <ValueAmount type="credit">
                        +R${' '}
                        {item.credito_cai.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </ValueAmount>
                    </ValueRow>

                    <ValueRow>
                      <ValueLabel>Débitos:</ValueLabel>
                      <ValueAmount type="debit">
                        -R${' '}
                        {item.debito_cai.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </ValueAmount>
                    </ValueRow>

                    <BalanceDisplay positive={item.saldo_cai >= 0}>
                      <div className="label">SALDO FINAL</div>
                      <div className="amount">
                        R${' '}
                        {item.saldo_cai.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </BalanceDisplay>
                  </CardBody>
                </ConsolidacaoCard>
              ))}
            </ConsolidacaoGrid>

            {/* DETALHES DE MOVIMENTOS */}
            {selectedData && filteredMovements.length > 0 && (
              <MovementsList>
                <MovementsHeader>
                  <FontAwesomeIcon icon={faCalendarDay} />
                  Movimentos de{' '}
                  {new Date(selectedData.dtmovi_cai).toLocaleDateString('pt-BR')}
                </MovementsHeader>
                {filteredMovements.map((mov, idx) => (
                  <MovementRow key={idx} type={mov.dc_cai}>
                    <MovementType type={mov.dc_cai}>
                      {mov.dc_cai === 'C' ? '➕ CRÉDITO' : '➖ DÉBITO'}
                    </MovementType>
                    <MovementDesc>{mov.descricao}</MovementDesc>
                    <MovementAmount type={mov.dc_cai}>
                      R$ {mov.valor_cai.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </MovementAmount>
                  </MovementRow>
                ))}
              </MovementsList>
            )}

            {selectedData && filteredMovements.length === 0 && (
              <EmptyState>
                <p>
                  Nenhum movimento registrado para{' '}
                  {new Date(selectedData.dtmovi_cai).toLocaleDateString('pt-BR')}
                </p>
              </EmptyState>
            )}

            <InfoBox type="warning">
              ⚠️ <strong>Importante:</strong> Este formulário é de apenas leitura. Para registrar
              novos movimentos, use o formulário "Novo Movimento de Caixa".
            </InfoBox>
          </>
        )}
      </Content>
    </Container>
  );
};

export default CaixaConsolidacaoForm;













