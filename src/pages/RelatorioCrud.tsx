import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './RelatorioCrud.css';
import { API_BASE_URL } from 'services/apiConfig';
import MultiSelectDropdown from 'components/MultiSelectDropdown';
import MultiCheckboxList from 'components/MultiCheckboxList';

// Opções fixas
const clientesFornecedores = [
  { value: 'clientes', label: 'Clientes' }, 
  { value: 'fornecedores', label: 'Fornecedores' },
];
const faixasAtraso = [
  { value: '', label: 'Todas' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
  { value: '120', label: '120 dias' },
  { value: '150', label: '150 dias' },
  { value: '190', label: '190 dias' },
];

const RelatorioCrud: React.FC = () => {
  const API_URL = API_BASE_URL;
  
  // Estados para listas dinâmicas
  const [tiposCobranca, setTiposCobranca] = useState<{ value: string; label: string }[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<{ value: string; label: string }[]>([]);
  const [departamentos, setDepartamentos] = useState<{ value: string; label: string }[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<{ value: string; label: string }[]>([]);

  const location = useLocation() as ReturnType<typeof useLocation> & { state?: { tipo?: string } };
  const tipo = location.state?.tipo || (location.pathname.includes('pagar') ? 'pagar' : 'receber');
  
  // Estados do formulário
  const [tipoDataFiltro, setTipoDataFiltro] = useState('cadastro');
  const [dataFiltroInicial, setDataFiltroInicial] = useState('');
  const [dataFiltroFinal, setDataFiltroFinal] = useState('');
  const [pessoaTipo, setPessoaTipo] = useState('clientes');
  const [tipoCobranca, setTipoCobranca] = useState('');
  // tipoDocumento (compatibilidade) + seleção múltipla de tipos de documento
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [tiposDocumentoSelected, setTiposDocumentoSelected] = useState<string[]>([]);
  const [departamento, setDepartamento] = useState('');
  const [centroCusto, setCentroCusto] = useState('');
  const [faixaAtraso, setFaixaAtraso] = useState('');
  const [soEmAberto, setSoEmAberto] = useState(false);
  const [soPagos, setSoPagos] = useState(false);
  
  // Estados da tabela
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [buscaTabela, setBuscaTabela] = useState(''); // Campo de busca na tabela

  // Buscar listas dinâmicas ao montar
  useEffect(() => {
    // Tipos de documento
    axios.get(`${API_URL}/relatorios/tipos-documento`).then(resp => {
      setTiposDocumento([{ value: '', label: 'Todos' }, ...resp.data]);
    }).catch(() => setTiposDocumento([{ value: '', label: 'Todos' }]));
    
    // Departamentos
    axios.get(`${API_URL}/relatorios/departamentos`).then(resp => {
      setDepartamentos([{ value: '', label: 'Todos' }, ...resp.data]);
    }).catch(() => setDepartamentos([{ value: '', label: 'Todos' }]));
    
    // Centros de custo
    axios.get(`${API_URL}/relatorios/centros-custo`).then(resp => {
      setCentrosCusto([{ value: '', label: 'Todos' }, ...resp.data]);
    }).catch(() => setCentrosCusto([{ value: '', label: 'Todos' }]));
  }, [API_URL]);

  // Buscar tipos de cobrança conforme tipo de pessoa
  useEffect(() => {
    if (pessoaTipo === 'clientes') {
      axios.get(`${API_URL}/relatorios/tipos-cobranca-clientes`).then(resp => {
        setTiposCobranca([{ value: '', label: 'Todos' }, ...resp.data]);
      }).catch(() => setTiposCobranca([{ value: '', label: 'Todos' }]));
    } else {
      axios.get(`${API_URL}/relatorios/tipos-cobranca-fornecedores`).then(resp => {
        setTiposCobranca([{ value: '', label: 'Todos' }, ...resp.data]);
      }).catch(() => setTiposCobranca([{ value: '', label: 'Todos' }]));
    }
  }, [pessoaTipo, API_URL]);

  // Filtrar dados com base na busca na tabela
  const dadosFiltrados = useMemo(() => {
    if (!buscaTabela.trim()) return dados;

    const termo = buscaTabela.toLowerCase();
    return dados.filter(row => {
      return Object.values(row).some(valor => 
        String(valor).toLowerCase().includes(termo)
      );
    });
  }, [dados, buscaTabela]);

  // Calcular totalizadores (apenas colunas numéricas)
  const totalizadores = useMemo(() => {
    if (dadosFiltrados.length === 0) return {};

    const totais: Record<string, number> = {};
    const colunas = dadosFiltrados.length > 0 ? Object.keys(dadosFiltrados[0]) : [];

    dadosFiltrados.forEach(row => {
      colunas.forEach(col => {
        const valor = row[col];
        if (typeof valor === 'number') {
          totais[col] = (totais[col] || 0) + valor;
        }
      });
    });

    return totais;
  }, [dadosFiltrados]);

  // Função para gerar relatório PDF/Excel
  const gerarRelatorio = async (formato: 'pdf' | 'excel') => {
    setGerandoRelatorio(true);
    setErro(null);
    try {
      const filtros = {
        tipo,
        tipoDataFiltro,
        dataFiltroInicial,
        dataFiltroFinal,
        pessoaTipo,
        tipoCobranca,
        // compatibilidade: enviar primeiro selecionado como tipoDocumento
        tipoDocumento: tipoDocumento || (tiposDocumentoSelected[0] || ''),
        tiposDocumento: tiposDocumentoSelected,
        departamento,
        centroCusto,
        faixaAtraso,
        soEmAberto,
        soPagos
      };
      const resp = await axios.post(`${API_URL}/relatorios/financeiro/${formato}`, filtros, {
        responseType: 'blob'
      });
      // Download do arquivo
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-financeiro.${formato === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setErro('Erro ao gerar relatório');
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const buscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErro(null);
    setBuscaTabela(''); // Limpar busca ao gerar novo relatório
    try {
      const filtros = {
        tipo,
        tipoDataFiltro,
        dataFiltroInicial,
        dataFiltroFinal,
        pessoaTipo,
        tipoCobranca,
        tipoDocumento: tipoDocumento || (tiposDocumentoSelected[0] || ''),
        tiposDocumento: tiposDocumentoSelected,
        departamento,
        centroCusto,
        faixaAtraso,
        soEmAberto,
        soPagos
      };
      const resp = await axios.post(`${API_URL}/relatorios/financeiro`, filtros);
      setDados(resp.data);
    } catch (err: any) {
      setErro(err?.response?.data || 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  const colunas = dadosFiltrados.length > 0 ? Object.keys(dadosFiltrados[0]) : [];

  return (
    <div className="relatorioCrudContainer">
      <h2 className="mb-4">Relatórios Financeiros - {tipo === 'receber' ? 'Contas a Receber' : 'Contas a Pagar'}</h2>
      
      {/* SEÇÃO 1: FILTROS */}
      <form className="filtrosSection mb-4" onSubmit={buscar}>
        <div className="filtrosGrid">
          {/* Linha 1: Tipo de Data, Datas e Tipo de Pessoa */}
          <div>
            <label className="form-label">Tipo de Data</label>
            <select className="form-select" value={tipoDataFiltro} onChange={e => setTipoDataFiltro(e.target.value)}>
              <option value="cadastro">Cadastro</option>
              <option value="vencimento">Vencimento</option>
              <option value="pagamento">Pagamento</option>
              <option value="emissao">Emissão</option>
            </select>
          </div>
          <div>
            <label className="form-label">Data Inicial</label>
            <input type="date" className="form-control" value={dataFiltroInicial} onChange={e => setDataFiltroInicial(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Data Final</label>
            <input type="date" className="form-control" value={dataFiltroFinal} onChange={e => setDataFiltroFinal(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Tipo de Pessoa</label>
            <select className="form-select" value={pessoaTipo} onChange={e => setPessoaTipo(e.target.value)}>
              {clientesFornecedores.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Linha 2: Cobrança, Documento, Departamento, Centro Custo */}
          <div>
            <label className="form-label">Tipo de Cobrança</label>
            <select className="form-select" value={tipoCobranca} onChange={e => setTipoCobranca(e.target.value)}>
              {tiposCobranca.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Tipo de Documento</label>
            <MultiSelectDropdown
              placeholder="Selecione os documentos..."
              options={tiposDocumento}
              selectedValues={tiposDocumentoSelected}
              onChange={(vals) => {
                setTiposDocumentoSelected(vals);
                setTipoDocumento(vals[0] || '');
              }}
            />
          </div>
          <div>
            <label className="form-label">Departamento</label>
            <select className="form-select" value={departamento} onChange={e => setDepartamento(e.target.value)}>
              {departamentos.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Centro de Custo</label>
            <select className="form-select" value={centroCusto} onChange={e => setCentroCusto(e.target.value)}>
              {centrosCusto.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* Linha 3: Faixa Atraso */}
          <div>
            <label className="form-label">Faixa de Atraso</label>
            <select className="form-select" value={faixaAtraso} onChange={e => setFaixaAtraso(e.target.value)}>
              {faixasAtraso.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Linha 4: Checkboxes + Botões (em 1 linha horizontal) */}
        <div className="filtrosCheckboxEBotoes">
          <div className="checkboxGroup">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={soEmAberto} 
                onChange={e => setSoEmAberto(e.target.checked)} 
                id="soEmAberto" 
              />
              <label className="form-check-label" htmlFor="soEmAberto">
                Apenas em Aberto
              </label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                checked={soPagos} 
                onChange={e => setSoPagos(e.target.checked)} 
                id="soPagos" 
              />
              <label className="form-check-label" htmlFor="soPagos">
                Apenas Pagos
              </label>
            </div>
          </div>

          <div className="botoes">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Buscando...' : 'Gerar Relatório'}
            </button>
            <button 
              type="button" 
              className="btn btn-success" 
              disabled={gerandoRelatorio || loading || dados.length === 0} 
              onClick={() => gerarRelatorio('pdf')}
            >
              {gerandoRelatorio ? 'Gerando PDF...' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      </form>

      {/* SEÇÃO 2: MENSAGENS DE ERRO */}
      {erro && <div className="alert alert-danger">{erro}</div>}

      {/* SEÇÃO 3: BUSCA NA TABELA (se houver dados) */}
      {dadosFiltrados.length > 0 && (
        <div className="searchBoxSection mb-3">
          <input 
            type="text" 
            className="form-control" 
            placeholder="🔍 Buscar na tabela..." 
            value={buscaTabela}
            onChange={e => setBuscaTabela(e.target.value)}
          />
          <small className="text-muted d-block mt-1">
            Resultados: {dadosFiltrados.length} de {dados.length} registros
            {buscaTabela && ` (filtrados por: "${buscaTabela}")`}
          </small>
        </div>
      )}

      {/* SEÇÃO 4: TABELA E TOTALIZADORES */}
      {dadosFiltrados.length > 0 && (
        <div className="tabelaContainer">
          <div className="table-responsive tableScrollable">
            <table className="table table-bordered table-sm tableRelatorio">
              <thead className="stickyHeader">
                <tr>
                  {colunas.map(col => <th key={col}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((row, i) => (
                  <tr key={i}>
                    {colunas.map(col => (
                      <td key={col} className={typeof row[col] === 'number' ? 'text-end' : ''}>
                        {typeof row[col] === 'number' 
                          ? row[col].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : row[col]
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totalizadores em Sticky Footer */}
          {Object.keys(totalizadores).length > 0 && (
            <div className="totalizadoresSticky">
              <div className="totalizadoresContent">
                <strong>TOTAIS:</strong>
                <div className="totalizadoresGrid">
                  {colunas.map(col => (
                    totalizadores[col] !== undefined && (
                      <div key={col} className="totalizadorItem">
                        <span className="totalizadorLabel">{col}:</span>
                        <span className="totalizadorValor">
                          {totalizadores[col].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 5: MENSAGENS DE VAZIO */}
      {dadosFiltrados.length === 0 && !loading && !erro && dados.length === 0 && (
        <div className="alert alert-info">
          <strong>ℹ️ Nenhum dado carregado</strong><br/>
          Selecione os filtros acima e clique em "Gerar Relatório" para visualizar os dados.
        </div>
      )}

      {dadosFiltrados.length === 0 && !loading && !erro && dados.length > 0 && (
        <div className="alert alert-warning">
          <strong>⚠️ Nenhum resultado encontrado</strong><br/>
          Sua busca na tabela não retornou resultados. Tente alterar os termos de busca.
        </div>
      )}

      {loading && (
        <div className="alert alert-info">
          <strong>⏳ Carregando dados...</strong> Por favor, aguarde.
        </div>
      )}
    </div>
  );
};

export default RelatorioCrud;













