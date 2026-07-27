/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faChartLine, faCalendarAlt, faCreditCard, faBan, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { API_BASE_URL } from 'services/apiConfig';

// ============= TIPOS =============
interface MovimentoPorCondicao {
  condicao: string;
  total_valor: number;
  quantidade: number;
}

interface ClienteAnaliseData {
  codigo_cli: string;
  fantasia_cli: string;
  nivel: string;
  tendencia: string;
  limcre_cli: number;
  datbloq_cli: string | null;
  motbloq_cli: string | null;
  datlib_cli: string | null;
  motlib_cli: string | null;
  ultima_compra: string | null;
  valor_ultima_compra: number;
  total_em_aberto: number;
  limite_disponivel: number;
  pagamentos_em_dia_ultimos_6: number;
  movimentos?: MovimentoPorCondicao[];
}

interface ClienteAnaliseFinanceiraModalProps {
  isOpen: boolean;
  onClose: () => void;
  codigoCliente: string;
}

// ============= STYLED COMPONENTS =============
// Use transient prop `$isOpen` to avoid forwarding a non-standard prop to the DOM
const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.2s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const InfoCard = styled.div`
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div<{ color?: string; size?: string }>`
  font-size: ${props => props.size || '18px'};
  font-weight: 600;
  color: ${props => props.color || '#111827'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const NivelBadge = styled.div<{ nivel: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 16px;
  background: ${props => {
    switch (props.nivel) {
      case 'Diamante': return 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)';
      case 'Ouro': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'Prata': return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
      default: return 'linear-gradient(135deg, #a16207 0%, #78350f 100%)';
    }
  }};
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const TendenciaIcon = styled.span`
  font-size: 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  border-radius: 0 0 12px 12px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  ` : `
    background: white;
    color: #374151;
    border: 1px solid #d1d5db;
    
    &:hover {
      background-color: #f9fafb;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const GridContainer = styled.div`
  height: 300px;
  width: 100%;
  margin-top: 12px;

  .ag-theme-alpine {
    --ag-header-background-color: #f3f4f6;
    --ag-header-foreground-color: #374151;
    --ag-row-hover-color: #f9fafb;
    --ag-odd-row-background-color: #ffffff;
    --ag-even-row-background-color: #f9fafb;
  }
`;

// ============= COMPONENTE PRINCIPAL =============
const ClienteAnaliseFinanceiraModal: React.FC<ClienteAnaliseFinanceiraModalProps> = ({
  isOpen,
  onClose,
  codigoCliente,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClienteAnaliseData | null>(null);

  // Campos editáveis
  const [limcre, setLimcre] = useState('0.00');
  const [datbloq, setDatbloq] = useState('');
  const [motbloq, setMotbloq] = useState('');
  const [datlib, setDatlib] = useState('');
  const [motlib, setMotlib] = useState('');

  // ============= FUNÇÕES AUXILIARES DE DATA =============
  
  // Converte YYYY-MM-DD para DD/MM/YYYY
  const formatarDataParaBR = (dataISO: string | null): string => {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Converte DD/MM/YYYY para YYYY-MM-DD
  const formatarDataParaISO = (dataBR: string): string => {
    if (!dataBR || dataBR.length !== 10) return '';
    const [dia, mes, ano] = dataBR.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  // Converte Date para DD/MM/YYYY
  const formatarDateParaBR = (data: string | null): string => {
    if (!data) return 'N/A';
    const date = new Date(data);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Máscara de data DD/MM/YYYY
  const aplicarMascaraData = (valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Aplica a máscara progressivamente
    if (apenasNumeros.length <= 2) {
      return apenasNumeros;
    } else if (apenasNumeros.length <= 4) {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
    } else {
      return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4, 8)}`;
    }
  };

  const handleDataChange = (valor: string, setter: (val: string) => void) => {
    const valorMascarado = aplicarMascaraData(valor);
    setter(valorMascarado);
  };

  // ============= FUNÇÕES DE FORMATAÇÃO DE MOEDA =============
  
  // Aplica máscara de moeda: 1.254,00
  const aplicarMascaraMoeda = (valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    if (!apenasNumeros) return '0,00';
    
    // Converte para número com centavos
    const valorNumerico = parseInt(apenasNumeros, 10) / 100;
    
    // Formata com separadores brasileiros
    return valorNumerico.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Remove máscara de moeda para salvar no backend
  const removerMascaraMoeda = (valorFormatado: string): number => {
    const apenasNumeros = valorFormatado.replace(/\D/g, '');
    return parseInt(apenasNumeros, 10) / 100;
  };

  const handleMoedaChange = (valor: string, setter: (val: string) => void) => {
    const valorMascarado = aplicarMascaraMoeda(valor);
    setter(valorMascarado);
  };

  // Carregar dados ao abrir modal
  useEffect(() => {
    if (isOpen && codigoCliente) {
      loadClienteAnalise();
    }
  }, [isOpen, codigoCliente]);

  const loadClienteAnalise = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/clientes/${codigoCliente}/analise-financeira`;
      console.log('[ClienteAnaliseFinanceiraModal] Carregando análise:', url);
      
      const response = await fetch(url);
      
      console.log('[ClienteAnaliseFinanceiraModal] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ClienteAnaliseFinanceiraModal] Erro HTTP:', response.status, errorText);
        throw new Error(`Erro ao carregar análise financeira: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[ClienteAnaliseFinanceiraModal] Dados recebidos:', result);
      setData(result);

      // Preencher campos editáveis com formatação
      // Limite de crédito em formato monetário: 50.000,00
      const limcreFormatado = (result.limcre_cli || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setLimcre(limcreFormatado);
      
      // Datas em formato DD/MM/YYYY
      setDatbloq(formatarDataParaBR(result.datbloq_cli));
      setMotbloq(result.motbloq_cli || '');
      setDatlib(formatarDataParaBR(result.datlib_cli));
      setMotlib(result.motlib_cli || '');

    } catch (err) {
      console.error('[ClienteAnaliseFinanceiraModal] Erro ao carregar análise:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar análise');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    setError(null);

    try {
      const updateData = {
        limcre_cli: removerMascaraMoeda(limcre), // Remove máscara antes de enviar
        datbloq_cli: datbloq ? formatarDataParaISO(datbloq) : null,
        motbloq_cli: motbloq || null,
        datlib_cli: datlib ? formatarDataParaISO(datlib) : null,
        motlib_cli: motlib || null,
      };

      const response = await fetch(`${API_BASE_URL}/clientes/${codigoCliente}/credito`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar dados do cliente');
      }

      alert('✅ Dados atualizados com sucesso!');
      onClose();

    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados');
    } finally {
      setSaving(false);
    }
  };

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'Diamante': return '💎';
      case 'Ouro': return '🥇';
      case 'Prata': return '🥈';
      default: return '🥉';
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'melhorando': return '↗️';
      case 'piorando': return '↘️';
      default: return '➡️';
    }
  };

  const getTendenciaTexto = (tendencia: string) => {
    switch (tendencia) {
      case 'melhorando': return 'Em Melhora';
      case 'piorando': return 'Em Declínio';
      default: return 'Estável';
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FontAwesomeIcon icon={faChartLine} />
            Análise Financeira do Cliente
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {loading && (
            <LoadingOverlay>
              Carregando análise financeira...
            </LoadingOverlay>
          )}

          {error && !loading && (
            <ErrorMessage>{error}</ErrorMessage>
          )}

          {!loading && !error && data && (
            <>
              {/* Seção: Movimentos por Condição (PRIMEIRA SEÇÃO) */}
              <Section>
                <SectionTitle>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  Movimento
                </SectionTitle>
                {Array.isArray(data.movimentos) && data.movimentos.length > 0 ? (
                  <GridContainer className="ag-theme-alpine">
                    <AgGridReact
                      rowData={data.movimentos}
                      columnDefs={[
                        {
                          field: 'condicao',
                          headerName: 'Condição de Pagamento',
                          flex: 2,
                          cellStyle: { fontWeight: '600', color: '#374151' },
                        },
                        {
                          field: 'quantidade',
                          headerName: 'Qtd',
                          flex: 1,
                          cellStyle: { textAlign: 'center', color: '#6b7280' },
                        },
                        {
                          field: 'total_valor',
                          headerName: 'Valor Total (R$)',
                          flex: 2,
                          valueFormatter: (params: any) => {
                            return (params.value ?? 0).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            });
                          },
                          cellStyle: {
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#667eea'
                          },
                        },
                      ]}
                      defaultColDef={{
                        sortable: true,
                        filter: false,
                        resizable: true,
                      }}
                    />
                  </GridContainer>
                ) : (
                  <InfoCard>
                    <InfoLabel>Movimentos</InfoLabel>
                    <div style={{ color: '#6b7280', padding: '12px 0' }}>Sem movimentos para o período.</div>
                  </InfoCard>
                )}
              </Section>

              {/* Seção: Identificação do Cliente */}
              <Section>
                <SectionTitle>
                  <FontAwesomeIcon icon={faChartLine} />
                  Identificação
                </SectionTitle>
                <InfoGrid>
                  <InfoCard>
                    <InfoLabel>Cliente</InfoLabel>
                    <InfoValue>{data.fantasia_cli || 'N/A'}</InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Código</InfoLabel>
                    <InfoValue>{data.codigo_cli ?? 'N/A'}</InfoValue>
                  </InfoCard>
                </InfoGrid>
              </Section>

              {/* Seção: Classificação de Crédito */}
              <Section>
                <SectionTitle>
                  <FontAwesomeIcon icon={faChartLine} />
                  Classificação de Crédito
                </SectionTitle>
                <InfoGrid>
                  <InfoCard style={{ gridColumn: '1 / -1' }}>
                    <InfoLabel>Nível Atual</InfoLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                      <NivelBadge nivel={data.nivel}>
                          {getNivelIcon(data.nivel || '')} {data.nivel || 'N/A'}
                      </NivelBadge>
                      <TendenciaIcon title={getTendenciaTexto(data.tendencia)}>
                        {getTendenciaIcon(data.tendencia)}
                      </TendenciaIcon>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>
                        {getTendenciaTexto(data.tendencia)}
                      </span>
                    </div>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Pagamentos em Dia (últimos 6)</InfoLabel>
                    <InfoValue color="#10b981" size="24px">
                      {(data.pagamentos_em_dia_ultimos_6 ?? 0)}/6
                    </InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Última Compra</InfoLabel>
                    <InfoValue>
                      {formatarDateParaBR(data.ultima_compra)}
                    </InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Valor Última Compra</InfoLabel>
                    <InfoValue color="#667eea">
                      R$ {(data.valor_ultima_compra ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </InfoValue>
                  </InfoCard>
                  <InfoCard>
                    <InfoLabel>Total em Aberto</InfoLabel>
                    <InfoValue color="#ef4444">
                      R$ {(data.total_em_aberto ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </InfoValue>
                  </InfoCard>
                </InfoGrid>
              </Section>

              {/* Seção: Limite de Crédito - EDITÁVEL */}
              <Section>
                <SectionTitle>
                  <FontAwesomeIcon icon={faCreditCard} />
                  Limite de Crédito
                </SectionTitle>
                <Row>
                  <FormGroup>
                    <Label>Limite de Crédito (R$) *</Label>
                    <Input
                      type="text"
                      value={limcre}
                      onChange={(e) => handleMoedaChange(e.target.value, setLimcre)}
                      placeholder="0,00"
                    />
                  </FormGroup>
                  <InfoCard>
                    <InfoLabel>Limite Disponível</InfoLabel>
                    <InfoValue color={(data.limite_disponivel ?? 0) > 0 ? '#10b981' : '#ef4444'} size="20px">
                      R$ {(data.limite_disponivel ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </InfoValue>
                  </InfoCard>
                </Row>
              </Section>

              {/* Seção: Bloqueio - EDITÁVEL */}
              <Section>
                <SectionTitle>
                  <FontAwesomeIcon icon={faBan} />
                  Informações de Bloqueio
                </SectionTitle>
                <Row>
                  <FormGroup>
                    <Label>Data de Bloqueio</Label>
                    <Input
                      type="text"
                      value={datbloq}
                      onChange={(e) => handleDataChange(e.target.value, setDatbloq)}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Motivo do Bloqueio</Label>
                    <TextArea
                      value={motbloq}
                      onChange={(e) => setMotbloq(e.target.value)}
                      placeholder="Descreva o motivo do bloqueio..."
                      style={{ minHeight: '60px' }}
                    />
                  </FormGroup>
                </Row>
              </Section>

              {/* Seção: Liberação - EDITÁVEL */}
              <Section>
                <SectionTitle>
                  <FontAwesomeIcon icon={faCheckCircle} />
                  Informações de Liberação
                </SectionTitle>
                <Row>
                  <FormGroup>
                    <Label>Data de Liberação</Label>
                    <Input
                      type="text"
                      value={datlib}
                      onChange={(e) => handleDataChange(e.target.value, setDatlib)}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Motivo da Liberação</Label>
                    <TextArea
                      value={motlib}
                      onChange={(e) => setMotlib(e.target.value)}
                      placeholder="Descreva o motivo da liberação..."
                      style={{ minHeight: '60px' }}
                    />
                  </FormGroup>
                </Row>
              </Section>

              {/* Resumo da Classificação */}
              <Section>
                <InfoCard style={{ background: '#eff6ff', borderLeftColor: '#3b82f6' }}>
                  <InfoLabel>Resumo da Classificação</InfoLabel>
                  <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', marginTop: '8px' }}>
                    {data.nivel === 'Diamante' && (
                      <p>
                        <strong>💎 Diamante:</strong> Cliente exemplar! Pagou todos os últimos 6 vencimentos em dia. 
                        Tendência atual: <strong>{getTendenciaTexto(data.tendencia)}</strong>.
                      </p>
                    )}
                    {data.nivel === 'Ouro' && (
                      <p>
                        <strong>🥇 Ouro:</strong> Cliente confiável! Pagou 4 ou 5 dos últimos 6 vencimentos em dia. 
                        Tendência atual: <strong>{getTendenciaTexto(data.tendencia)}</strong>.
                      </p>
                    )}
                    {data.nivel === 'Prata' && (
                      <p>
                        <strong>🥈 Prata:</strong> Cliente com histórico moderado. Pagou 2 ou 3 dos últimos 6 vencimentos em dia. 
                        Tendência atual: <strong>{getTendenciaTexto(data.tendencia)}</strong>. Recomenda-se acompanhamento.
                      </p>
                    )}
                    {data.nivel === 'Bronze' && (
                      <p>
                        <strong>🥉 Bronze:</strong> Cliente com histórico irregular. Menos de 2 pagamentos em dia nos últimos 6 vencimentos. 
                        Tendência atual: <strong>{getTendenciaTexto(data.tendencia)}</strong>. <strong>ATENÇÃO REDOBRADA!</strong>
                      </p>
                    )}
                  </div>
                </InfoCard>
              </Section>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
            <FontAwesomeIcon icon={faSave} />
            {saving ? 'Salvando...' : 'Atualizar Dados'}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ClienteAnaliseFinanceiraModal;













