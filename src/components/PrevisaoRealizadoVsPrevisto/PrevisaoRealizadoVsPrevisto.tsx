/**
 * PrevisaoRealizadoVsPrevisto.tsx
 * 
 * Componente para visualizar análise de Realizado vs Previsto
 * Integrado à Consulta de Caixa e Bancos
 * 
 * Features:
 * - Comparação por operação de caixa
 * - Consolidado receitas vs despesas
 * - Desvios e percentuais
 * - Período: DIA, MES, ANO
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Table, Form, Alert, Spinner } from 'react-bootstrap';
import PrevisaoService, { 
  PrevisaoPorOperacao, 
  PrevisaoConsolidada 
} from 'services/PrevisaoService';
import './PrevisaoRealizadoVsPrevisto.css';

interface Props {
  filial: string;
  dataInicio?: string;
}

/**
 * Componente principal de análise Realizado vs Previsto
 */
const PrevisaoRealizadoVsPrevisto: React.FC<Props> = ({ filial, dataInicio }) => {
  const [periodo, setPeriodo] = useState<'DIA' | 'MES' | 'ANO'>('DIA');
  const [dataReferencia, setDataReferencia] = useState<string>(dataInicio || new Date().toISOString().split('T')[0]);
  
  // Dados
  const [operacoes, setOperacoes] = useState<PrevisaoPorOperacao[]>([]);
  const [consolidado, setConsolidado] = useState<PrevisaoConsolidada | null>(null);
  
  // Estados
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [calculandoPrevisao, setCalculandoPrevisao] = useState(false);
  
  // Carregar dados ao mudar período/data
  useEffect(() => {
    carregarDados();
  }, [filial, dataReferencia, periodo]);
  
  /**
   * Carregar previsões e consolidado
   */
  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const [oper, cons] = await Promise.all([
        PrevisaoService.getPrevisaoPorOperacoes(filial, dataReferencia, periodo),
        PrevisaoService.getPrevisaoConsolidada(filial, dataReferencia, periodo),
      ]);
      
      setOperacoes(oper || []);
      setConsolidado(cons);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao carregar previsões';
      setErro(mensagem);
      console.error('[PrevisaoComponent] Erro:', err);
    } finally {
      setCarregando(false);
    }
  };
  
  /**
   * Forçar cálculo de previsões
   */
  const forcarCalculo = async () => {
    try {
      setCalculandoPrevisao(true);
      const resultado = await PrevisaoService.calcularPrevisao(filial, dataReferencia, periodo);
      
      if (resultado.sucesso) {
        setErro(null);
        await carregarDados(); // Recarregar após cálculo
      }
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao calcular previsão';
      setErro(mensagem);
    } finally {
      setCalculandoPrevisao(false);
    }
  };
  
  /**
   * Formatar valor monetário
   */
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };
  
  /**
   * Classe CSS para desvio (positivo/negativo)
   */
  const getDesvioClass = (desvio: number) => {
    if (desvio > 0) return 'text-success fw-bold';
    if (desvio < 0) return 'text-danger fw-bold';
    return 'text-secondary';
  };
  
  return (
    <div className="previsao-container">
      {/* 📊 SEÇÃO: Filtros e Controles */}
      <Card className="mb-4 border-info">
        <Card.Header className="bg-info text-white">
          <strong>🎯 Análise: Realizado vs Previsto</strong>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-end g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label><strong>Período</strong></Form.Label>
                <Form.Select 
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as any)}
                >
                  <option value="DIA">📅 Dia</option>
                  <option value="MES">📆 Mês</option>
                  <option value="ANO">📊 Ano</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Form.Group>
                <Form.Label><strong>Data de Referência</strong></Form.Label>
                <Form.Control 
                  type="date"
                  value={dataReferencia}
                  onChange={(e) => setDataReferencia(e.target.value)}
                />
              </Form.Group>
            </Col>
            
            <Col md={4}>
              <Button 
                variant="primary" 
                onClick={forcarCalculo}
                disabled={calculandoPrevisao}
                className="w-100"
              >
                {calculandoPrevisao ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Calculando...
                  </>
                ) : (
                  '🔄 Recalcular Previsão'
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* ⚠️ SEÇÃO: Alertas */}
      {erro && (
        <Alert variant="danger" onClose={() => setErro(null)} dismissible>
          <strong>❌ Erro:</strong> {erro}
        </Alert>
      )}
      
      {carregando && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="info" className="me-2" />
          <span>Carregando previsões...</span>
        </div>
      )}
      
      {!carregando && consolidado && (
        <>
          {/* 💰 SEÇÃO: Consolidado (Receitas vs Despesas) */}
          <Row className="mb-4">
            {/* Receitas */}
            <Col md={6}>
              <Card className="h-100 border-success">
                <Card.Header className="bg-success text-white">
                  <strong>💚 RECEITAS</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="text-center mb-3">
                    <Col>
                      <div className="label-pequeno">Realizado</div>
                      <div className="valor-grande text-success">
                        {formatarMoeda(consolidado.receitas.valor_realizado)}
                      </div>
                    </Col>
                    <Col>
                      <div className="label-pequeno">Previsto (+30%)</div>
                      <div className="valor-grande text-info">
                        {formatarMoeda(consolidado.receitas.valor_previsto)}
                      </div>
                    </Col>
                  </Row>
                  
                  <hr />
                  
                  <Row className="text-center">
                    <Col>
                      <small className="text-muted">Desvio</small>
                      <div className={getDesvioClass(consolidado.receitas.desvio_valor)}>
                        {formatarMoeda(consolidado.receitas.desvio_valor)}
                      </div>
                    </Col>
                    <Col>
                      <small className="text-muted">% Desvio</small>
                      <div className={getDesvioClass(consolidado.receitas.percentual_desvio)}>
                        {consolidado.receitas.percentual_desvio}%
                      </div>
                    </Col>
                    <Col>
                      <small className="text-muted">Documentos</small>
                      <div className="text-primary fw-bold">
                        {consolidado.receitas.quantidade}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Despesas */}
            <Col md={6}>
              <Card className="h-100 border-danger">
                <Card.Header className="bg-danger text-white">
                  <strong>❤️ DESPESAS</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="text-center mb-3">
                    <Col>
                      <div className="label-pequeno">Realizado</div>
                      <div className="valor-grande text-danger">
                        {formatarMoeda(consolidado.despesas.valor_realizado)}
                      </div>
                    </Col>
                    <Col>
                      <div className="label-pequeno">Previsto (+15%)</div>
                      <div className="valor-grande text-warning">
                        {formatarMoeda(consolidado.despesas.valor_previsto)}
                      </div>
                    </Col>
                  </Row>
                  
                  <hr />
                  
                  <Row className="text-center">
                    <Col>
                      <small className="text-muted">Desvio</small>
                      <div className={getDesvioClass(consolidado.despesas.desvio_valor)}>
                        {formatarMoeda(consolidado.despesas.desvio_valor)}
                      </div>
                    </Col>
                    <Col>
                      <small className="text-muted">% Desvio</small>
                      <div className={getDesvioClass(consolidado.despesas.percentual_desvio)}>
                        {consolidado.despesas.percentual_desvio}%
                      </div>
                    </Col>
                    <Col>
                      <small className="text-muted">Documentos</small>
                      <div className="text-primary fw-bold">
                        {consolidado.despesas.quantidade}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* 📈 SEÇÃO: Saldo Final */}
          <Card className="mb-4 border-primary bg-light">
            <Card.Header className="bg-primary text-white">
              <strong>📊 SALDO CONSOLIDADO</strong>
            </Card.Header>
            <Card.Body>
              <Row className="text-center">
                <Col md={4}>
                  <div className="label-pequeno">Saldo Realizado</div>
                  <div className={`valor-grande ${consolidado.saldo_realizado >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatarMoeda(consolidado.saldo_realizado)}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="label-pequeno">Saldo Previsto</div>
                  <div className={`valor-grande ${consolidado.saldo_previsto >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatarMoeda(consolidado.saldo_previsto)}
                  </div>
                </Col>
                <Col md={4}>
                  <div className="label-pequeno">Desvio no Saldo</div>
                  <div className={`valor-grande ${getDesvioClass(consolidado.desvio_saldo)}`}>
                    {formatarMoeda(consolidado.desvio_saldo)}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* 📋 SEÇÃO: Detalhe por Operação */}
          <Card className="border-secondary">
            <Card.Header className="bg-secondary text-white">
              <strong>📌 Detalhamento por Operação de Caixa</strong>
            </Card.Header>
            <Card.Body className="p-0">
              {operacoes.length === 0 ? (
                <div className="p-3 text-muted text-center">
                  Nenhuma operação com previsão para este período
                </div>
              ) : (
                <Table striped hover responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Tipo</th>
                      <th>Operação</th>
                      <th>Descrição</th>
                      <th className="text-end">Realizado</th>
                      <th className="text-end">Previsto</th>
                      <th className="text-end">Desvio</th>
                      <th className="text-end">% Desvio</th>
                      <th className="text-center">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operacoes.map((op, idx) => (
                      <tr key={idx} className={op.tipo_movimento === 'RECEITA' ? 'table-success' : 'table-danger'}>
                        <td>
                          <span className={`badge ${op.tipo_movimento === 'RECEITA' ? 'bg-success' : 'bg-danger'}`}>
                            {op.tipo_movimento === 'RECEITA' ? '💚 REC' : '❤️ DESP'}
                          </span>
                        </td>
                        <td><strong>{op.operacao_ocai}</strong></td>
                        <td>{op.descr_ocai}</td>
                        <td className="text-end">{formatarMoeda(op.valor_realizado)}</td>
                        <td className="text-end text-muted">{formatarMoeda(op.valor_previsto)}</td>
                        <td className={`text-end ${getDesvioClass(op.desvio_valor)}`}>
                          {formatarMoeda(op.desvio_valor)}
                        </td>
                        <td className={`text-end ${getDesvioClass(op.percentual_desvio)}`}>
                          {op.percentual_desvio}%
                        </td>
                        <td className="text-center">{op.quantidade_realizado}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default PrevisaoRealizadoVsPrevisto;













