import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import axios from 'axios';
import './FluxoCaixa.css';
import { API_BASE_URL } from 'services/apiConfig';

const API_BASE = process.env.REACT_APP_API_URL || API_BASE_URL;

/**
 * FluxoCaixaProjetado90Dias - Projeção de Caixa para 90 Dias
 * 
 * Features:
 * 1. KPI Cards (Estatísticas gerais)
 * 2. AG Grid com dados diários + pivot
 * 3. Modal de detalhes (clique no "+" para expandir e ver documentos)
 * 4. Cards com melhores dias para pagar
 * 5. Recomendações de estratégia de pagamento
 * 6. Análise de risco (dias críticos, atenção, positivos)
 */
const FluxoCaixaProjetado90Dias: React.FC = () => {
  // Estado
  const [fluxoData, setFluxoData] = useState<any[]>([]);
  const [resumoMensal, setResumoMensal] = useState<any[]>([]);
  const [analiseRisco, setAnaliseRisco] = useState<any>(null);
  const [recomendacao, setRecomendacao] = useState('');
  const [melhorDias, setMelhorDias] = useState<any[]>([]);
  
  const [modalAberto, setModalAberto] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [documentosModal, setDocumentosModal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Evitar warning de variável atribuída mas não utilizada (algumas build-flows usam apenas setter)
  void resumoMensal;

  // 1️⃣ Carregar dados ao montar
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Requisições paralelas
      const [resFluxo, resResumo, resRisco, resRecom, resMelhores] = await Promise.all([
        axios.get(`${API_BASE}/v1/fluxo-caixa-projetado/diario`),
        axios.get(`${API_BASE}/v1/fluxo-caixa-projetado/mensal`),
        axios.get(`${API_BASE}/v1/fluxo-caixa-projetado/risco`),
        axios.get(`${API_BASE}/v1/fluxo-caixa-projetado/recomendacao`),
        axios.get(`${API_BASE}/v1/fluxo-caixa-projetado/melhores-dias`)
      ]);

      setFluxoData(resFluxo.data || []);
      setResumoMensal(resResumo.data || []);
      setAnaliseRisco(resRisco.data || {});
      setRecomendacao(resRecom.data?.recomendacao || '');
      setMelhorDias(resMelhores.data || []);
      
    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Abrir modal com detalhes do dia
  const abrirModalDetalhes = async (data: string) => {
    try {
      const res = await axios.get(`${API_BASE}/v1/fluxo-caixa-projetado/dia/${data}`);
      setDocumentosModal(res.data || []);
      setDataSelecionada(data);
      setModalAberto(true);
    } catch (error) {
      console.error('Erro ao buscar detalhes do dia:', error);
    }
  };

  // 2.5️⃣ Atualizar data de fluxo de caixa para um documento
  const handleAtualizarDataFluxo = async (pagarId: number, novaData: string) => {
    try {
      console.log(`📅 Atualizando Data Fluxo - ID: ${pagarId}, Nova Data: ${novaData}`);
      
      const response = await axios.patch(
        `${API_BASE}/pagar/${pagarId}/dtfluxo`,
        { dtfluxo_pag: novaData || null },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.sucesso) {
        console.log('✅ Data de fluxo atualizada com sucesso');
        
        // Recarregar dados para refletir mudança
        carregarDados();
        // Notificação de sucesso (opcional)
        console.log(`✅ ${response.data.mensagem}`);
      } else {
        console.error('❌ Erro ao atualizar:', response.data.erro);
        alert(`Erro: ${response.data.erro}`);
      }
    } catch (error: any) {
      console.error('❌ Erro na requisição:', error);
      const mensagem = error.response?.data?.erro || 'Erro ao atualizar data de fluxo';
      alert(`Erro: ${mensagem}`);
    }
  };

  // 3️⃣ Definição de colunas AG Grid
  const columnDefs: any[] = [
    {
      headerName: 'Data',
      field: 'data_projecao',
      width: 140,
      pinned: 'left',
      cellRenderer: (params: any) => {
        const data = params.data;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => abrirModalDetalhes(data.data_projecao)}
              title="Clique para ver documentos"
              style={{ padding: '2px 6px' }}
            >
              +
            </button>
            <div>
              <div style={{ fontWeight: 'bold' }}>{data.data_exibicao}</div>
              <div style={{ fontSize: '0.85em', color: '#666' }}>{data.dia_semana}</div>
            </div>
          </div>
        );
      }
    },
    {
      headerName: 'Receber (R$)',
      field: 'total_receber',
      width: 130,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: { textAlign: 'right', backgroundColor: '#e8f5e9' },
      type: 'numericColumn'
    },
    {
      headerName: 'Pagar (R$)',
      field: 'total_pagar',
      width: 130,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: { textAlign: 'right', backgroundColor: '#ffebee' },
      type: 'numericColumn'
    },
    {
      headerName: 'Saldo Diário (R$)',
      field: 'saldo_diario',
      width: 150,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: (params: any) => {
        const valor = params.value;
        return {
          textAlign: 'right',
          color: valor > 0 ? '#2e7d32' : '#c62828',
          fontWeight: 'bold',
          backgroundColor: valor > 0 ? '#f1f8f6' : '#fef5f5'
        };
      },
      type: 'numericColumn'
    },
    {
      headerName: 'Saldo Acumulado (R$)',
      field: 'saldo_acumulado',
      width: 170,
      valueFormatter: (params: any) => formatarMoeda(params.value),
      cellStyle: (params: any) => {
        const valor = params.value;
        let backgroundColor = '#fff9c4';
        if (valor > 0) backgroundColor = '#c8e6c9';
        if (valor < 0) backgroundColor = '#ffcdd2';
        return { textAlign: 'right', backgroundColor, fontWeight: 'bold' };
      },
      type: 'numericColumn'
    },
    {
      headerName: 'Indicador',
      field: 'indicador',
      width: 140,
      cellRenderer: (params: any) => {
        const indicador = params.data.indicador;
        const emojiMap: Record<string, string> = {
          'POSITIVO': '✅',
          'ATENÇÃO': '⚠️',
          'CRÍTICO': '🔴'
        };
        return `${emojiMap[indicador] || '❓'} ${indicador}`;
      },
      cellStyle: (params: any) => {
        const cores: Record<string, any> = {
          'POSITIVO': { backgroundColor: '#c8e6c9', color: '#1b5e20' },
          'ATENÇÃO': { backgroundColor: '#fff9c4', color: '#f57f17' },
          'CRÍTICO': { backgroundColor: '#ffcdd2', color: '#b71c1c' }
        };
        return cores[params.data.indicador] || { backgroundColor: '#f5f5f5' };
      }
    },
    {
      headerName: 'Qtd Rec',
      field: 'qtd_receber',
      width: 90,
      type: 'numericColumn',
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: 'Qtd Pag',
      field: 'qtd_pagar',
      width: 90,
      type: 'numericColumn',
      cellStyle: { textAlign: 'center' }
    },
    {
      headerName: '📅 Data Fluxo',
      field: 'dtfluxo_pag',
      width: 140,
      editable: true,
      cellEditor: 'agDateStringCellEditor',
      cellEditorParams: {
        min: new Date().toISOString().split('T')[0],
        max: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      valueFormatter: (params: any) => {
        if (!params.value) return '---';
        try {
          const data = new Date(params.value);
          return data.toLocaleDateString('pt-BR');
        } catch {
          return params.value;
        }
      },
      cellStyle: (params: any) => {
        const dtFluxo = params.data?.dtfluxo_pag;
        const dtVenci = params.data?.dtvenci_pag;
        
        // Se não tem data fluxo, retorna style padrão
        if (!dtFluxo) {
          return { backgroundColor: '#f9f9f9', textAlign: 'center' };
        }
        
        // Se data fluxo é diferente de vencimento, destaca em amarelo
        if (dtFluxo !== dtVenci) {
          return {
            backgroundColor: '#fff3cd',
            borderLeft: '4px solid #ffc107',
            fontWeight: 'bold',
            textAlign: 'center'
          };
        }
        
        return { backgroundColor: '#f9f9f9', textAlign: 'center' };
      },
      onCellValueChanged: (params: any) => {
        const { data } = params;
        if (data && data.pagar_id && data.dtfluxo_pag) {
          handleAtualizarDataFluxo(data.pagar_id, data.dtfluxo_pag);
        }
      }
    }
  ];

  // 4️⃣ KPI Cards
  const renderKPIs = () => {
    if (!analiseRisco || Object.keys(analiseRisco).length === 0) return null;
    if (analiseRisco.status === 'SEM_DADOS') return null;

    return (
      <div className="row mb-4" style={{ gap: '1rem' }}>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Saldo Máximo</h6>
              <h4 style={{ color: '#4caf50' }}>
                {formatarMoeda(analiseRisco.saldo_maximo)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Saldo Mínimo</h6>
              <h4 style={{ color: '#f44336' }}>
                {formatarMoeda(analiseRisco.saldo_minimo)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Dias Críticos</h6>
              <h4 style={{ color: '#f44336' }}>
                {analiseRisco.dias_criticos} ({analiseRisco.percentual_critico})
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h6 className="card-title text-muted">Dias em Atenção</h6>
              <h4 style={{ color: '#ff9800' }}>
                {analiseRisco.dias_atencao} ({analiseRisco.percentual_atencao})
              </h4>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 5️⃣ Modal de Detalhes
  const renderModal = () => {
    if (!modalAberto) return null;

    return (
      <div 
        className="modal d-block" 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} 
        onClick={() => setModalAberto(false)}
      >
        <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Detalhes de Documentos - {dataSelecionada}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setModalAberto(false)}
              />
            </div>
            
            <div className="modal-body">
              {documentosModal.length === 0 ? (
                <p className="text-center text-muted">Sem documentos para este dia</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-sm table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Tipo</th>
                        <th>Documento</th>
                        <th>Parcela</th>
                        <th>Nome</th>
                        <th>CNPJ/CPF</th>
                        <th className="text-end">Valor</th>
                        <th>Emissão</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentosModal.map((doc, idx) => (
                        <tr 
                          key={idx}
                          style={{
                            backgroundColor: doc.tipo_movimento === 'RECEBER' ? '#f0f8f0' : '#f8f0f0'
                          }}
                        >
                          <td>
                            <span>{doc.tipo_movimento === 'RECEBER' ? '📥' : '📤'}</span>
                            <strong>{doc.tipo_movimento}</strong>
                          </td>
                          <td>{doc.numero_documento}</td>
                          <td>{doc.parcela}</td>
                          <td>{doc.nome_pessoa || '---'}</td>
                          <td>{formatarCNPJCPF(doc.cnpj_cpf, doc.tipo_pessoa)}</td>
                          <td className="text-end">
                            <strong style={{ color: doc.tipo_movimento === 'RECEBER' ? '#4caf50' : '#f44336' }}>
                              {formatarMoeda(doc.valor)}
                            </strong>
                          </td>
                          <td>{doc.data_emissao_exibicao}</td>
                          <td>
                            <span className="badge bg-info">{doc.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 6️⃣ Renderização Principal
  if (loading) {
    return <div className="text-center p-4">Carregando fluxo de caixa projetado...</div>;
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📊 Fluxo de Caixa Projetado (90 dias)</h2>
        <button className="btn btn-primary" onClick={carregarDados}>
          🔄 Atualizar
        </button>
      </div>

      {/* KPIs */}
      {renderKPIs()}

      {/* AG Grid */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Projeção Diária</h5>
        </div>
        <div className="card-body">
          <div className="ag-theme-quartz" style={{ height: '500px', width: '100%' }}>
            <AgGridReact
              columnDefs={columnDefs}
              rowData={fluxoData}
              defaultColDef={{
                flex: 1,
                minWidth: 100,
                resizable: true,
                sortable: true,
                filter: true
              }}
              enableCellTextSelection={true}
              suppressHorizontalScroll={false}
            />
          </div>
        </div>
      </div>

      {/* Melhores Dias */}
      {melhorDias.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">⭐ Top 5 Melhores Dias para Pagar</h5>
          </div>
          <div className="card-body">
            <div className="row">
              {melhorDias.map((dia, idx) => (
                <div key={idx} className="col-md-6 col-lg-4 mb-3">
                  <div 
                    className="card h-100"
                    style={{ 
                      borderLeft: '5px solid #2196F3',
                      backgroundColor: '#f0f7ff'
                    }}
                  >
                    <div className="card-body">
                      <h6 className="card-title">{dia.data_exibicao}</h6>
                      <div className="mb-2">
                        <small className="text-muted">Score: </small>
                        <strong>{dia.score_recomendacao}</strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Qualidade: </small>
                        <div>{dia.qualidade_dia}</div>
                      </div>
                      <hr />
                      <div style={{ fontSize: '0.9em' }}>
                        <div>Receber: <strong style={{ color: '#4caf50' }}>{formatarMoeda(dia.total_receber)}</strong></div>
                        <div>Saldo: <strong style={{ color: '#2196F3' }}>{formatarMoeda(dia.saldo_acumulado)}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recomendações */}
      {recomendacao && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">💡 Recomendações de Estratégia</h5>
          </div>
          <div className="card-body">
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '1rem', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: '"Courier New", monospace',
              fontSize: '0.9em'
            }}>
              {recomendacao}
            </pre>
          </div>
        </div>
      )}

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

// Funções auxiliares
const formatarMoeda = (valor: any) => {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(valor));
};

const formatarCNPJCPF = (valor: string, tipo: string) => {
  if (!valor) return '---';
  const apenas_numeros = valor.replace(/\D/g, '');
  
  if (tipo === 'J' || apenas_numeros.length === 14) {
    // CNPJ
    return apenas_numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  } else {
    // CPF
    return apenas_numeros.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
};

export default FluxoCaixaProjetado90Dias;













