/**
 * CaixaOperacaoSelector.tsx
 * 
 * Componente para seleção de Operação de Caixa com busca dinâmica de títulos
 * 
 * Fluxo:
 * 1. dc_cai = 'D' (Débito) → Buscar em PAGAR (Fornecedores)
 * 2. dc_cai = 'C' (Crédito) → Buscar em RECEBER (Clientes)
 * 3. Filtro obrigatório: filial_ocai = id_fil (da sessão)
 * 4. Renderizar lista dinâmica com código + nome + valor + vencimento
 */

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import axios from 'axios';

interface CaixaOperacaoSelectorProps {
  dc_cai: 'C' | 'D' | '';
  banco_cai: string;
  onSelectOperacao: (operacao: CaixaOperacao) => void;
  disabled?: boolean;
  filial_id?: string | number;
}

interface CaixaOperacao {
  id: string;
  codigo_cli: string;
  nome_cli: string;
  valor: number;
  data_vencimento: string;
  tipo: 'cliente' | 'fornecedor';
  titulo_id?: string;
}

interface RecebimentoTitulo {
  codigo_rec: string;
  cliente_rec: string;
  nomefan_rec?: string;
  vlrsal_rec: number;
  dtvenci_rec: string;
  filial_rec: string;
}

interface PagamentoTitulo {
  codigo_pag: string;
  fornecedor_pag: string;
  nomefan_pag?: string;
  vlrsal_pag: number;
  dtvenci_pag: string;
  filial_pag: string;
}

const CaixaOperacaoSelector: React.FC<CaixaOperacaoSelectorProps> = ({
  dc_cai,
  banco_cai,
  onSelectOperacao,
  disabled = false,
  filial_id = '001'
}) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

  const [operacoes, setOperacoes] = useState<CaixaOperacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperacao, setSelectedOperacao] = useState<CaixaOperacao | null>(null);

  /**
   * FUNÇÃO 1: Buscar Operações conforme dc_cai
   * dc_cai = 'C' → RECEBER (Clientes)
   * dc_cai = 'D' → PAGAR (Fornecedores)
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!dc_cai || !filial_id) {
      setOperacoes([]);
      setSelectedOperacao(null);
      return;
    }

    buscarOperacoes();
  }, [dc_cai, filial_id]);

  const buscarOperacoes = async () => {
    setLoading(true);
    setErro(null);
    try {
      let endpoint = '';

      if (dc_cai === 'C') {
        // Crédito = RECEBER (Clientes) -> usar endpoint documentos-abertos
        endpoint = `${API_URL.replace(/\/$/, '')}/documentos-abertos/receber`;
      } else if (dc_cai === 'D') {
        // Débito = PAGAR (Fornecedores) -> usar endpoint documentos-abertos
        endpoint = `${API_URL.replace(/\/$/, '')}/documentos-abertos/pagar`;
      }

      const response = await axios.get(endpoint);
      const dados = response.data;

      // Mapear resposta conforme tipo
      let operacoesFormatadas: CaixaOperacao[] = [];

      if (dc_cai === 'C' && Array.isArray(dados)) {
        // Receber
        operacoesFormatadas = dados.map((item: RecebimentoTitulo) => ({
          id: `REC-${item.codigo_rec}`,
          codigo_cli: item.cliente_rec,
          nome_cli: item.nomefan_rec || item.cliente_rec,
          valor: item.vlrsal_rec,
          data_vencimento: item.dtvenci_rec,
          tipo: 'cliente' as const,
          titulo_id: item.codigo_rec
        }));
      } else if (dc_cai === 'D' && Array.isArray(dados)) {
        // Pagar
        operacoesFormatadas = dados.map((item: PagamentoTitulo) => ({
          id: `PAG-${item.codigo_pag}`,
          codigo_cli: item.fornecedor_pag,
          nome_cli: item.nomefan_pag || item.fornecedor_pag,
          valor: item.vlrsal_pag,
          data_vencimento: item.dtvenci_pag,
          tipo: 'fornecedor' as const,
          titulo_id: item.codigo_pag
        }));
      }

      setOperacoes(operacoesFormatadas);
    } catch (err: any) {
      setErro(err?.response?.data?.message || 'Erro ao buscar operações');
      setOperacoes([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * FUNÇÃO 2: Filtrar Operações por termo de busca
   */
  const operacoesFiltradas = operacoes.filter(op => {
    const termo = searchTerm.toLowerCase();
    return (
      op.codigo_cli.toLowerCase().includes(termo) ||
      op.nome_cli.toLowerCase().includes(termo) ||
      op.valor.toString().includes(termo)
    );
  });

  /**
   * FUNÇÃO 3: Selecionar Operação
   */
  const handleSelectOperacao = (operacao: CaixaOperacao) => {
    setSelectedOperacao(operacao);
    setSearchTerm('');
    onSelectOperacao(operacao);
  };

  /**
   * FUNÇÃO 4: Formatar moeda para exibição
   */
  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  /**
   * FUNÇÃO 5: Formatar data para exibição
   */
  const formatarData = (data: string) => {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (!dc_cai) {
    return (
      <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
        <strong>⚠️ Selecione o tipo de movimento (Crédito/Débito) primeiro</strong>
      </div>
    );
  }

  return (
    <div className="caixa-operacao-selector">
      {/* LABEL */}
      <label className="form-label fw-bold">
        {dc_cai === 'C' ? '👥 Cliente / Título a Receber' : '🏢 Fornecedor / Título a Pagar'}
      </label>

      {/* INPUT DE BUSCA */}
      <div className="input-group mb-2">
        <span className="input-group-text">🔍</span>
        <input
          type="text"
          className="form-control"
          placeholder={
            dc_cai === 'C'
              ? 'Buscar cliente ou número do título...'
              : 'Buscar fornecedor ou número do título...'
          }
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          disabled={disabled || loading}
        />
      </div>

      {/* MOSTRANDO SELECIONADO */}
      {selectedOperacao && (
        <div className="alert alert-info mb-3">
          <strong>✅ Selecionado:</strong><br />
          <span>
            {selectedOperacao.codigo_cli} - {selectedOperacao.nome_cli}
            <br />
            Valor: {formatarMoeda(selectedOperacao.valor)}
            <br />
            Vencimento: {formatarData(selectedOperacao.data_vencimento)}
          </span>
        </div>
      )}

      {/* ESTADO: CARREGANDO */}
      {loading && (
        <div className="alert alert-info">
          <span className="spinner-border spinner-border-sm me-2"></span>
          Carregando {dc_cai === 'C' ? 'clientes' : 'fornecedores'}...
        </div>
      )}

      {/* ESTADO: ERRO */}
      {erro && (
        <div className="alert alert-danger">
          <strong>❌ Erro:</strong> {erro}
          <button
            className="btn btn-sm btn-danger ms-2"
            onClick={buscarOperacoes}
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* ESTADO: NENHUM RESULTADO */}
      {!loading && !erro && operacoesFiltradas.length === 0 && operacoes.length > 0 && (
        <div className="alert alert-warning">
          <strong>⚠️ Nenhuma operação encontrada</strong> com o termo "{searchTerm}"
        </div>
      )}

      {/* ESTADO: VAZIO (sem dados do servidor) */}
      {!loading && !erro && operacoes.length === 0 && (
        <div className="alert alert-warning">
          <strong>ℹ️ Nenhum {dc_cai === 'C' ? 'cliente' : 'fornecedor'}</strong> com títulos em aberto
        </div>
      )}

      {/* LISTA DE OPERAÇÕES */}
      {!loading && operacoesFiltradas.length > 0 && (
        <div className="operacoes-list">
          <div className="list-group">
            {operacoesFiltradas.map(operacao => (
              <button
                key={operacao.id}
                type="button"
                className={`list-group-item list-group-item-action ${
                  selectedOperacao?.id === operacao.id ? 'active' : ''
                }`}
                onClick={() => handleSelectOperacao(operacao)}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '0.3rem',
                  border: '1px solid #dee2e6',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="d-flex w-100 justify-content-between">
                  <div className="text-start">
                    <strong>{operacao.codigo_cli}</strong>
                    <br />
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      {operacao.nome_cli}
                    </span>
                  </div>
                  <div className="text-end">
                    <strong style={{ color: '#007bff' }}>
                      {formatarMoeda(operacao.valor)}
                    </strong>
                    <br />
                    <small style={{ color: '#999' }}>
                      Vencimento: {formatarData(operacao.data_vencimento)}
                    </small>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <small className="text-muted d-block mt-2">
            Total: {operacoesFiltradas.length} de {operacoes.length} operações
          </small>
        </div>
      )}

      {/* ESTILO INLINE */}
      <style>{`
        .caixa-operacao-selector {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 0.5rem;
          border-left: 4px solid #007bff;
        }

        .operacoes-list {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 0.3rem;
          padding: 0.5rem;
          background-color: white;
        }

        .operacoes-list .list-group-item {
          transition: all 0.2s ease;
        }

        .operacoes-list .list-group-item:hover {
          background-color: #f8f9fa;
          transform: translateX(5px);
        }

        .operacoes-list .list-group-item.active {
          background-color: #007bff !important;
          color: white;
          border-color: #007bff;
        }

        .operacoes-list .list-group-item.active strong {
          color: white;
        }

        .operacoes-list .list-group-item.active small {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};

export default CaixaOperacaoSelector;













