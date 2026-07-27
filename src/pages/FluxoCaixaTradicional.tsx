import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from 'services/apiConfig';
import { Container, Row, Col, Card, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-bootstrap.css';
import '../styles/FluxoCaixaTradicional.css';

interface FluxoDiario {
  data_exibicao: string;
  dia_semana_nome: string;
  total_receber: number;
  total_pagar: number;
  saldo_diario: number;
  status: string;
}

interface FluxoSemanal {
  numero_semana: number;
  data_inicio_semana: string;
  data_fim_semana: string;
  total_receber_semana: number;
  total_pagar_semana: number;
  saldo_semana: number;
  status: string;
  recomendacao: string;
}

interface ResumoPeriodo {
  periodo: string;
  total_receber: number;
  total_pagar: number;
  saldo_total: number;
  percentual_pagar_receber: number;
  observacao: string;
}

interface DiasRecomendacao {
  data_dia: string;
  dia_semana_nome: string;
  saldo_dia: number;
  ranking_melhor_dia?: number;
  ranking_pior_dia?: number;
  recomendacao_dia: string;
}

interface KPISaude {
  total_receber: number;
  total_pagar: number;
  saldo_total: number;
  saude: 'NORMAL' | 'ATENÇÃO' | 'CRÍTICO';
  cor: string;
}

export const FluxoCaixaTradicional: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodSelecionado, setPeriodSelecionado] = useState<'30' | '60' | '90'>('30');

  // Estados para dados
  const [fluxoDiario, setFluxoDiario] = useState<FluxoDiario[]>([]);
  const [fluxoSemanal, setFluxoSemanal] = useState<FluxoSemanal[]>([]);
  const [resumoPeriodos, setResumoPeriodos] = useState<ResumoPeriodo[]>([]);
  const [melhoresDias, setMelhoresDias] = useState<DiasRecomendacao[]>([]);
  const [pioresDias, setPioresDias] = useState<DiasRecomendacao[]>([]);
  const [kpiSaude, setKpiSaude] = useState<KPISaude | null>(null);

  // Carregar todos os dados ao inicializar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseURL = process.env.REACT_APP_API_URL || API_BASE_URL;

        // Executar todas as requisições em paralelo
        const [respDiario, respSemanal, respPeriodos, respMelhores, respPiores, respKpi] = 
          await Promise.all([
            fetch(`${baseURL}/v1/fluxo-caixa-tradicional/diario`),
            fetch(`${baseURL}/v1/fluxo-caixa-tradicional/semanal`),
            fetch(`${baseURL}/v1/fluxo-caixa-tradicional/periodos`),
            fetch(`${baseURL}/v1/fluxo-caixa-tradicional/melhores`),
            fetch(`${baseURL}/v1/fluxo-caixa-tradicional/piores`),
            fetch(`${baseURL}/v1/fluxo-caixa-tradicional/kpi-saude`)
          ]);

        // Validar respostas
        if (!respDiario.ok) throw new Error('Erro ao carregar fluxo diário');
        if (!respSemanal.ok) throw new Error('Erro ao carregar análise semanal');
        if (!respPeriodos.ok) throw new Error('Erro ao carregar períodos');
        if (!respMelhores.ok) throw new Error('Erro ao carregar melhores dias');
        if (!respPiores.ok) throw new Error('Erro ao carregar piores dias');
        if (!respKpi.ok) throw new Error('Erro ao carregar KPI');

        // Parse JSON
        const dataDiario = await respDiario.json();
        const dataSemanal = await respSemanal.json();
        const dataPeriodos = await respPeriodos.json();
        const dataMelhores = await respMelhores.json();
        const dataPiores = await respPiores.json();
        const dataKpi = await respKpi.json();

        // Atualizar estados
        setFluxoDiario(dataDiario.data || []);
        setFluxoSemanal(dataSemanal.data || []);
        setResumoPeriodos(dataPeriodos.data || []);
        setMelhoresDias(dataMelhores.data || []);
        setPioresDias(dataPiores.data || []);
        setKpiSaude(dataKpi.data || null);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados');
        console.error('[FluxoCaixa] Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Formatar valor monetário
  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  // Formatar percentual
  const formatarPercentual = (valor: number): string => {
    return (valor || 0).toFixed(2) + '%';
  };

  // Obter cor do status
  const obterCorStatus = (status: string): string => {
    switch (status) {
      case 'CRÍTICO':
      case '🔴':
        return '#dc3545';
      case 'ATENÇÃO':
      case '🟡':
        return '#ffc107';
      case 'NORMAL':
      case '🟢':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  // Configuração de colunas AG-Grid para fluxo diário
  const colDefsDiario = [
    {
      field: 'data_exibicao',
      headerName: 'Data',
      width: 100,
      sortable: true,
      filter: true
    },
    {
      field: 'dia_semana_nome',
      headerName: 'Dia',
      width: 80,
      sortable: true
    },
    {
      field: 'total_receber',
      headerName: 'A Receber',
      width: 120,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: { textAlign: 'right', color: '#28a745', fontWeight: 'bold' }
    },
    {
      field: 'total_pagar',
      headerName: 'A Pagar',
      width: 120,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: { textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }
    },
    {
      field: 'saldo_diario',
      headerName: 'Saldo',
      width: 120,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: (params: any) => ({
        textAlign: 'right',
        fontWeight: 'bold',
        color: (params.value || 0) >= 0 ? '#28a745' : '#dc3545'
      })
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      cellStyle: (params: any) => ({
        backgroundColor: obterCorStatus(params.value),
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold'
      })
    }
  ];

  // Configuração de colunas AG-Grid para fluxo semanal
  const colDefsSemanal = [
    {
      field: 'numero_semana',
      headerName: 'Semana',
      width: 80
    },
    {
      field: 'data_inicio_semana',
      headerName: 'De',
      width: 100
    },
    {
      field: 'data_fim_semana',
      headerName: 'Até',
      width: 100
    },
    {
      field: 'total_receber_semana',
      headerName: 'A Receber',
      width: 130,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: { textAlign: 'right', color: '#28a745', fontWeight: 'bold' }
    },
    {
      field: 'total_pagar_semana',
      headerName: 'A Pagar',
      width: 130,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: { textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }
    },
    {
      field: 'saldo_semana',
      headerName: 'Saldo',
      width: 130,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: (params: any) => ({
        textAlign: 'right',
        fontWeight: 'bold',
        color: (params.value || 0) >= 0 ? '#28a745' : '#dc3545'
      })
    },
    {
      field: 'recomendacao',
      headerName: 'Recomendação',
      width: 150,
      cellStyle: { textAlign: 'center' }
    }
  ];

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
        <p className="mt-3">Carregando dados do fluxo de caixa...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="fluxo-caixa-container py-4">
      {/* Cabeçalho */}
      <Row className="mb-4">
        <Col>
          <h1 className="page-title">💰 Fluxo de Caixa Tradicional</h1>
          <p className="text-muted">Análise simplificada de caixa: Diário, Semanal e Períodos</p>
        </Col>
      </Row>

      {/* Mensagem de erro */}
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" dismissible>
              <strong>Erro:</strong> {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* KPI de Saúde Financeira */}
      {kpiSaude && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="kpi-card" style={{ borderLeft: `4px solid ${kpiSaude.cor}` }}>
              <Card.Body>
                <div className="kpi-label">Saúde Financeira</div>
                <div className="kpi-value" style={{ color: kpiSaude.cor }}>
                  {kpiSaude.saude}
                </div>
                <div className="kpi-icon" style={{ fontSize: '2em', marginTop: '10px' }}>
                  {kpiSaude.saude === 'NORMAL' && '🟢'}
                  {kpiSaude.saude === 'ATENÇÃO' && '🟡'}
                  {kpiSaude.saude === 'CRÍTICO' && '🔴'}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="kpi-card">
              <Card.Body>
                <div className="kpi-label">Total a Receber</div>
                <div className="kpi-value" style={{ color: '#28a745' }}>
                  {formatarMoeda(kpiSaude.total_receber)}
                </div>
                <div className="kpi-icon">📥</div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="kpi-card">
              <Card.Body>
                <div className="kpi-label">Total a Pagar</div>
                <div className="kpi-value" style={{ color: '#dc3545' }}>
                  {formatarMoeda(kpiSaude.total_pagar)}
                </div>
                <div className="kpi-icon">📤</div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="kpi-card">
              <Card.Body>
                <div className="kpi-label">Saldo Total</div>
                <div
                  className="kpi-value"
                  style={{ color: (kpiSaude.saldo_total || 0) >= 0 ? '#28a745' : '#dc3545' }}
                >
                  {formatarMoeda(kpiSaude.saldo_total)}
                </div>
                <div className="kpi-icon">💵</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Abas de Períodos */}
      <Row className="mb-4">
        <Col>
          <div className="period-selector">
            <button
              className={`period-btn ${periodSelecionado === '30' ? 'active' : ''}`}
              onClick={() => setPeriodSelecionado('30')}
            >
              +30 dias
            </button>
            <button
              className={`period-btn ${periodSelecionado === '60' ? 'active' : ''}`}
              onClick={() => setPeriodSelecionado('60')}
            >
              +60 dias
            </button>
            <button
              className={`period-btn ${periodSelecionado === '90' ? 'active' : ''}`}
              onClick={() => setPeriodSelecionado('90')}
            >
              +90 dias
            </button>
          </div>
        </Col>
      </Row>

      {/* Resumo de Períodos */}
      {resumoPeriodos.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Header className="bg-light">
                <h5>📊 Resumo dos Períodos</h5>
              </Card.Header>
              <Card.Body>
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th className="text-end">A Receber</th>
                      <th className="text-end">A Pagar</th>
                      <th className="text-end">Saldo</th>
                      <th className="text-end">% Pagar/Receber</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumoPeriodos.map((periodo, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{periodo.periodo}</strong>
                        </td>
                        <td className="text-end text-success">
                          <strong>{formatarMoeda(periodo.total_receber)}</strong>
                        </td>
                        <td className="text-end text-danger">
                          <strong>{formatarMoeda(periodo.total_pagar)}</strong>
                        </td>
                        <td
                          className="text-end"
                          style={{
                            color:
                              (periodo.saldo_total || 0) >= 0 ? '#28a745' : '#dc3545',
                            fontWeight: 'bold'
                          }}
                        >
                          {formatarMoeda(periodo.saldo_total)}
                        </td>
                        <td className="text-end">
                          <Badge
                            bg={
                              (periodo.percentual_pagar_receber || 0) > 80
                                ? 'danger'
                                : 'success'
                            }
                          >
                            {formatarPercentual(periodo.percentual_pagar_receber)}
                          </Badge>
                        </td>
                        <td>{periodo.observacao}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Análise Analítica do Mestre */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-light">
              <h5>🔍 Análise Analítica do Mestre</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ overflowX: 'auto' }}>
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Dia da Semana</th>
                      <th className="text-end">A Receber</th>
                      <th className="text-end">A Pagar</th>
                      <th className="text-end">Saldo Diário</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fluxoDiario.map((dia, idx) => (
                      <tr key={idx}>
                        <td><strong>{dia.data_exibicao}</strong></td>
                        <td>{dia.dia_semana_nome}</td>
                        <td className="text-end text-success"><strong>{formatarMoeda(dia.total_receber)}</strong></td>
                        <td className="text-end text-danger"><strong>{formatarMoeda(dia.total_pagar)}</strong></td>
                        <td className="text-end" style={{ color: (dia.saldo_diario || 0) >= 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>{formatarMoeda(dia.saldo_diario)}</td>
                        <td>
                          <Badge bg={dia.status === '🟢' || dia.status === 'NORMAL' ? 'success' : dia.status === '🟡' || dia.status === 'ATENÇÃO' ? 'warning' : 'danger'}>
                            {dia.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Fluxo Diário */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-light">
              <h5>📅 Fluxo de Caixa Diário (30 dias)</h5>
            </Card.Header>
            <Card.Body>
              <div className="ag-theme-bootstrap" style={{ height: '400px', overflowY: 'auto', overflowX: 'auto' }}>
                <AgGridReact columnDefs={colDefsDiario as any} rowData={fluxoDiario} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Análise Semanal */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-light">
              <h5>📈 Análise Semanal</h5>
            </Card.Header>
            <Card.Body>
              <div className="ag-theme-bootstrap" style={{ height: '300px', overflowY: 'auto', overflowX: 'auto' }}>
                <AgGridReact columnDefs={colDefsSemanal as any} rowData={fluxoSemanal} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Melhores e Piores Dias */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-success text-white">
              <h5>✅ Top 5 Melhores Dias para Pagamentos</h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th className="text-end">Saldo</th>
                    <th>Recomendação</th>
                  </tr>
                </thead>
                <tbody>
                  {melhoresDias.map((dia, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{dia.data_dia}</strong> ({dia.dia_semana_nome})
                      </td>
                      <td className="text-end text-success">
                        <strong>{formatarMoeda(dia.saldo_dia)}</strong>
                      </td>
                      <td>{dia.recomendacao_dia}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header className="bg-danger text-white">
              <h5>❌ Top 5 Piores Dias para Pagamentos</h5>
            </Card.Header>
            <Card.Body>
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th className="text-end">Saldo</th>
                    <th>Recomendação</th>
                  </tr>
                </thead>
                <tbody>
                  {pioresDias.map((dia, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{dia.data_dia}</strong> ({dia.dia_semana_nome})
                      </td>
                      <td
                        className="text-end"
                        style={{ color: (dia.saldo_dia || 0) < 0 ? '#dc3545' : '#6c757d' }}
                      >
                        <strong>{formatarMoeda(dia.saldo_dia)}</strong>
                      </td>
                      <td>{dia.recomendacao_dia}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FluxoCaixaTradicional;













