import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faPencil, faTrash, faBank } from '@fortawesome/free-solid-svg-icons';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { CaixaBancosService } from 'services/CaixaBancosService';
import CaixaBancosForm from './CaixaBancosForm';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  ${props => {
    switch (props.$variant) {
      case 'secondary':
        return `
          background: #e5e7eb;
          color: #374151;
          &:hover { background: #d1d5db; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GridContainer = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  box-sizing: border-box;
  /* Espaço inferior para evitar overlap com footer fixo */
  padding-bottom: 80px;

  .ag-root {
    font-family: inherit;
    /* garantir que o grid ocupe todo o espaço disponível dentro do container flex */
    flex: 1 1 auto;
    height: 100%;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
`;

// ============================================================================
// COMPONENT
// ============================================================================

interface CaixaBancosData {
  dtmovi_cai?: string;
  filial_cai?: string;
  tipocai_cai?: string;
  codbanco_cai?: string;
  seq_cai?: number;
  dc_cai?: string;
  valor_cai?: number;
  [key: string]: any;
}

interface CaixaFormularioLocalizarProps {
  enableEdit?: boolean;          // Habilita funcionalidades de edição e inclusão
  enableNew?: boolean;           // Habilita botão de incluir novo
  onRegistroSelecionado?: (registro: CaixaBancosData) => void; // Callback ao selecionar registro
  consultaMode?: boolean;        // Modo consulta (apenas leitura)
  origem?: 'relatorio' | 'direto';  // 'relatorio' = chamado de /financeiro/relatorios, 'direto' = chamado de /financeiro/caixa
}

const CaixaFormularioLocalizar: React.FC<CaixaFormularioLocalizarProps> = ({
  enableEdit = true,
  enableNew = true,
  onRegistroSelecionado,
  consultaMode = false,
  origem = 'direto'  // Padrão: chamado direto de /financeiro/caixa
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  // Se origem === 'relatorio', começa em modo 'editar' (form); senão começa em 'localizar' (grid)
  const [modo, setModo] = useState<'localizar' | 'editar' | 'incluir'>(
    origem === 'relatorio' ? 'editar' : 'localizar'
  );
  const [registros, setRegistros] = useState<CaixaBancosData[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  
  // Filtros de busca
  const [filtroDataInicial, setFiltroDataInicial] = useState('');
  const [filtroDataFinal, setFiltroDataFinal] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');

  // Lista de bancos (dropdown)
  const [bancos, setBancos] = useState<any[]>([]);
  
  // Dados de suporte
  const [confirmDelete, setConfirmDelete] = useState<CaixaBancosData | null>(null);
  
  // Quick Filter
  const [quickFilterText, setQuickFilterText] = useState('');
  
  // Formulário (editar/incluir)
  const [formData, setFormData] = useState<CaixaBancosData>({
    dtmovi_cai: new Date().toISOString().split('T')[0],
    codbanco_cai: '',
    dc_cai: 'C',
    valor_cai: 0
  });
  
  // AG-Grid
  const gridRef = useRef<any>(null);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]);
  const [footerDc, setFooterDc] = useState<string>('');

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  // Aplicar quick filter quando o texto muda
  useEffect(() => {
    if (gridRef.current && gridRef.current.api && typeof (gridRef.current.api as any).setQuickFilter === 'function') {
      (gridRef.current.api as any).setQuickFilter(quickFilterText || '');
      // Recalcular total após aplicar quick filter
      recalcularTotal();
    }
  }, [quickFilterText]);

  // Recalcula total da coluna de valor baseada nas linhas atualmente visíveis/após filtro
  const recalcularTotal = () => {
    try {
      if (!gridRef.current || !gridRef.current.api || typeof (gridRef.current.api as any).forEachNodeAfterFilter !== 'function') {
        setPinnedBottomRowData([]);
        setFooterDc('');
        return;
      }

      let total = 0;
      let debitCount = 0;
      let creditCount = 0;

      (gridRef.current.api as any).forEachNodeAfterFilter((node: any) => {
        if (node && node.data) {
          const d = node.data;
          const v = d.valor_cai ?? d.valor ?? 0;
          const num = typeof v === 'string' ? parseFloat(String(v).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(/,/g, '.')) : Number(v || 0);
          if (!isNaN(num)) total += num;
          const dc = (d.dc_cai || d.dc || '').toString().toUpperCase();
          if (dc === 'D') debitCount++; else if (dc === 'C') creditCount++;
        }
      });

      // Determinar D/C do rodape: preferencia por maioria, senão por sinal do total
      let footerType = 'Crédito';
      if (debitCount > 0 && creditCount === 0) footerType = 'Débito';
      else if (creditCount > 0 && debitCount === 0) footerType = 'Crédito';
      else footerType = total < 0 ? 'Débito' : 'Crédito';
      setFooterDc(footerType);

      // Montar linha de totais sem causar "Invalid Date"
      const totalRow: any = { dtmovi_cai: '', codbanco_cai: '', histor_cai: 'TOTAIS', dc_cai: footerType, valor_cai: total };
      setPinnedBottomRowData([totalRow]);
    } catch (e) {
      console.error('Erro ao recalcular total do AG Grid:', e);
    }
  };

  // Recalcular total quando os registros mudam (p.ex. após busca)
  useEffect(() => {
    if (gridRef.current && gridRef.current.api) {
      recalcularTotal();
    } else {
      // fallback: calcular diretamente a partir do array registros
      try {
        let total = 0;
        (registros || []).forEach(r => {
          const v = r.valor_cai ?? r.valor ?? 0;
          const num = typeof v === 'string' ? parseFloat(String(v).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(/,/g, '.')) : Number(v || 0);
          if (!isNaN(num)) total += num;
        });
        setPinnedBottomRowData([{ dtmovi_cai: 'TOTAL', valor_cai: total }]);
      } catch (e) {
        setPinnedBottomRowData([]);
      }
    }
  }, [registros]);

  // ------------------------------------------------------------------------
  // Filtragem local (filtro por banco e quick filter) — evita depender do
  // backend para filtrar por código de banco que varia entre ambientes.
  // ------------------------------------------------------------------------
  const normalizeCode = (v: any) => String(v ?? '').replace(/^0+/, '').trim().toLowerCase();

  const matchesQuick = (row: any, term: string) => {
    if (!term) return true;
    const s = String(term).trim().toLowerCase();
    const fields = [row.nomefan_bco, row.nome_bco, row.banco, row.banco_nome, row.histor_cai, row.historico_cai, row.cliente_cai, row.dtmovi_cai, row.codbanco_cai, row.seq_cai, row.seq];
    for (const f of fields) {
      if (String(f ?? '').toLowerCase().includes(s)) return true;
    }
    try {
      const val = Number(row.valor_cai ?? row.valor ?? 0) || 0;
      if (CaixaBancosService.formatarMoeda(Math.abs(val)).toLowerCase().includes(s)) return true;
      if (String(val).toLowerCase().includes(s)) return true;
    } catch (e) {
      // ignore
    }
    return false;
  };

  const displayedRegistros = React.useMemo(() => {
    let arr = Array.isArray(registros) ? registros.slice() : [];

    // Aplicar filtro por período de datas (localmente) — inclui o dia final até 23:59:59
    if (filtroDataInicial || filtroDataFinal) {
      let start: Date | null = null;
      let end: Date | null = null;
      try {
        if (filtroDataInicial) start = new Date(filtroDataInicial);
        if (filtroDataFinal) { end = new Date(filtroDataFinal); end.setHours(23,59,59,999); }
      } catch (e) {
        start = null; end = null;
      }
      arr = arr.filter(r => {
        try {
          if (!r || !r.dtmovi_cai) return false;
          const d = new Date(r.dtmovi_cai);
          if (isNaN(d.getTime())) return false;
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        } catch (e) {
          return false;
        }
      });
    }

    if (filtroBanco) {
      const filtroNorm = normalizeCode(filtroBanco);
      arr = arr.filter(r => {
        const movCodigo = normalizeCode(r.codbanco_cai ?? r.banco_cai ?? r.banco_codigo ?? r.banco ?? '');
        if (movCodigo && movCodigo === filtroNorm) return true;

        const movNome = String(r.nomefan_bco ?? r.nome_bco ?? r.banco ?? r.banco_nome ?? '').toLowerCase();
        const selectedBanco = bancos.find((b: any) => String(b.codigo_bco) === String(filtroBanco));
        const selectedNome = selectedBanco ? String(selectedBanco.nome_bco || selectedBanco.nomefan_bco || '').toLowerCase() : '';
        if (selectedNome && movNome.includes(selectedNome)) return true;

        if (movNome && filtroNorm && (movNome.includes(filtroNorm) || selectedNome.includes(movNome))) return true;

        return false;
      });
    }

    if (quickFilterText) {
      arr = arr.filter(r => matchesQuick(r, quickFilterText));
    }

    return arr;
  }, [registros, filtroBanco, quickFilterText, bancos, filtroDataInicial, filtroDataFinal]);

  // Atualizar total quando registros exibidos mudam
  useEffect(() => {
    try {
      // Preferir cálculo via API do grid quando disponível
      recalcularTotal();
    } catch (e) {
      // fallback simples
      try {
        let total = 0;
        (displayedRegistros || []).forEach(r => {
          const v = r.valor_cai ?? r.valor ?? 0;
          const num = typeof v === 'string' ? parseFloat(String(v).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(/,/g, '.')) : Number(v || 0);
          if (!isNaN(num)) total += num;
        });
        setPinnedBottomRowData([{ dtmovi_cai: '', histor_cai: 'TOTAIS', dc_cai: footerDc, valor_cai: total }]);
      } catch (er) {
        // ignore
      }
    }
  }, [displayedRegistros, footerDc]);

  const carregarDadosIniciais = async () => {
    try {
      setLoading(true);
      setErro(null);
      
      // Carregar bancos e operações
      const bancosData = await CaixaBancosService.listarBancos();
      setBancos(bancosData || []);
      
      setLoading(false);
    } catch (err) {
      setErro('Erro ao carregar dados iniciais. Verifique sua conexão.');
      console.error('[CaixaFormularioLocalizar] Erro:', err);
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const buscarRegistros = async () => {
    try {
      setLoading(true);
      setErro(null);
      
      // Validar datas obrigatórias
      if (!filtroDataInicial || !filtroDataFinal) {
        setErro('Data inicial e final são obrigatórias');
        setLoading(false);
        return;
      }
      
      // Construir parâmetros de busca (não enviar filtro de banco ao backend
      // — faremos filtro localmente para maior tolerância a variações de código)
      const params: any = {
        dataInicial: filtroDataInicial,
        dataFinal: filtroDataFinal,
      };
      // if (filtroTipoCaixa) params.tipocai_cai = filtroTipoCaixa; // removido, não utilizado
      
      console.log('[CaixaFormularioLocalizar] Buscando com parâmetros:', params);
      
      // Chamar novo endpoint de busca de movimentos
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/v1/caixa/buscar-movimentos?${queryString}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensagem || 'Erro ao buscar movimentos');
      }
      
      const dados = await response.json();
      setRegistros(dados || []);

      if (!dados || (Array.isArray(dados) && dados.length === 0)) {
        setErro('Nenhum movimento encontrado para os filtros selecionados');
      }
      
      setLoading(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao buscar registros.');
      console.error('[CaixaFormularioLocalizar] Erro:', err);
      setLoading(false);
    }
  };

  const [showCaixaModal, setShowCaixaModal] = useState(false);
  const [modalPayload, setModalPayload] = useState<any>(null);

  const abrirFormIncluir = () => {
    const payload = {
      dtmovi_cai: new Date().toISOString().split('T')[0],
      codbanco_cai: '',
      dc_cai: 'C',
      valor_cai: 0,
      _mode: 'incluir'
    };
    setModalPayload(payload);
    setShowCaixaModal(true);
  };

  const abrirFormEditar = (registro: CaixaBancosData) => {
    const payload = { ...registro, _mode: 'editar' };
    setModalPayload(payload);
    setShowCaixaModal(true);
  };

  // ...existing code...

  const removerRegistro = async (registro: CaixaBancosData) => {
    // Usar modal de confirmação em vez de confirm() para seguir ESLint
    setConfirmDelete(registro);
  };

  const confirmarRemocao = async () => {
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      
      // Chamar serviço de exclusão
      // await CaixaBancosService.deletarMovimento(confirmDelete.id);
      
      // Recarregar lista
      await buscarRegistros();
      setConfirmDelete(null);
      setLoading(false);
    } catch (err) {
      setErro('Erro ao remover registro.');
      console.error('[CaixaFormularioLocalizar] Erro:', err);
      setLoading(false);
    }
  };

  // ============================================================================
  // COLUMN DEFINITIONS (AG-Grid)
  // ============================================================================

  const columnDefs = [
    { 
      field: 'dtmovi_cai', 
      headerName: 'Data', 
      width: 100,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('pt-BR');
      }
    },
    { 
      field: 'codbanco_cai', 
      headerName: 'Banco', 
      width: 220,
      valueFormatter: (params: any) => {
        try {
          const valRaw = params.value;
          const val = valRaw == null ? '' : String(valRaw).trim();
          // Tentar casar por igualdade direta
          let banco = bancos.find((b: any) => String(b.codigo_bco).trim() === val);
          // Tentar remover zeros à esquerda
          if (!banco && val) {
            const norm = val.replace(/^0+/, '');
            banco = bancos.find((b: any) => String(b.codigo_bco).replace(/^0+/, '') === norm);
          }
          // Tentar comparar numericamente
          if (!banco && val) {
            const nVal = Number(val);
            if (!isNaN(nVal)) {
              banco = bancos.find((b: any) => !isNaN(Number(b.codigo_bco)) && Number(b.codigo_bco) === nVal);
            }
          }
          if (banco) return `${String(banco.codigo_bco).padStart(3, '0')} - ${banco.nomefan_bco || banco.nome_bco || ''}`;
          const row = params.data || {};
          const alt = row.nomefan_bco || row.nome_bco || row.banco || row.banco_nome || row.cliente_banco || row.nome_cai;
          if (alt) return String(alt);
          return val || '';
        } catch (e) {
          return params.value || '';
        }
      }
    },
    { 
      field: 'histor_cai',
      headerName: 'Histórico',
      width: 540,
      autoHeight: true,
      cellStyle: { whiteSpace: 'normal', overflowWrap: 'break-word' } as any,
      valueFormatter: (params: any) => params.value || params.data?.historico || params.data?.histor_cai || ''
    },
    { 
      field: 'dc_cai', 
      headerName: 'D/C', 
      width: 80,
      valueFormatter: (params: any) => params.value === 'D' ? 'Débito' : 'Crédito'
    },
    { 
      field: 'valor_cai', 
      headerName: 'Valor', 
      width: 120,
      valueFormatter: (params: any) => CaixaBancosService.formatarMoeda(params.value || 0),
      cellStyle: { textAlign: 'right' } as any
    },
    { 
      field: 'seq_cai', 
      headerName: 'Seq', 
      width: 80
    },
    {
      headerName: 'Ações',
      width: 120,
      cellRenderer: (params: any) => {
        // Não renderizar botões na linha de rodapé/pinned
        if (params && params.node && params.node.rowPinned) return null;
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            <button 
              onClick={() => abrirFormEditar(params.data)}
              style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
              title="Editar"
            >
              <FontAwesomeIcon icon={faPencil} />
            </button>
            <button 
              onClick={() => removerRegistro(params.data)}
              style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', color: 'red' }}
              title="Remover"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        );
      }
    }
  ];

  // ============================================================================
  // RENDER - Modo LOCALIZAR
  // ============================================================================

  if (modo === 'localizar') {
    return (
      <Container>
        <Header>
          <Title>
            <FontAwesomeIcon icon={faBank} /> Movimento Caixa e Bancos
          </Title>
          <Button $variant="primary" onClick={abrirFormIncluir}>
            <FontAwesomeIcon icon={faPlus} /> Incluir
          </Button>
        </Header>

        {erro && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee',
            border: '1px solid #f88',
            borderRadius: '4px',
            color: '#c33'
          }}>
            ⚠️ {erro}
          </div>
        )}

        <FilterSection>
          <FilterGroup>
            <Label>Data Inicial</Label>
            <Input 
              type="date" 
              value={filtroDataInicial} 
              onChange={(e) => setFiltroDataInicial(e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <Label>Data Final</Label>
            <Input 
              type="date" 
              value={filtroDataFinal} 
              onChange={(e) => setFiltroDataFinal(e.target.value)}
            />
          </FilterGroup>
          <FilterGroup>
            <Label>Banco</Label>
            <Select 
              value={filtroBanco} 
              onChange={(e) => setFiltroBanco(e.target.value)}
            >
              <option value="">Todos</option>
              {(bancos || []).map(b => (
                <option key={b.codigo_bco} value={b.codigo_bco}>
                  {b.codigo_bco} - {b.nome_bco}
                </option>
              ))}
            </Select>
          </FilterGroup>
          <FilterGroup>
            <Label>Busca Rápida</Label>
            <Input 
              type="text" 
              placeholder="Procurar em qualquer coluna..."
              value={quickFilterText} 
              onChange={(e) => setQuickFilterText(e.target.value)}
            />
          </FilterGroup>
          <Button $variant="primary" onClick={buscarRegistros} disabled={loading}>
            <FontAwesomeIcon icon={faSearch} />
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </FilterSection>

        <GridContainer>
          <AgGridReact
            ref={gridRef}
            columnDefs={columnDefs}
            rowData={displayedRegistros}
            pinnedBottomRowData={pinnedBottomRowData}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true
            }}
            onRowDoubleClicked={(event) => event.data && abrirFormEditar(event.data)}
            pagination={true}
            paginationPageSize={20}
            domLayout="normal"
            onGridReady={(params) => {
              // garantir referência à API do grid
              try {
                // manter compatibilidade com uso anterior gridRef.current.api
                gridRef.current = { api: params.api };
                // aplicar quick filter se já houver texto (cast para any para evitar erros de typing)
                if (quickFilterText && typeof (params.api as any).setQuickFilter === 'function') {
                  (params.api as any).setQuickFilter(quickFilterText);
                }
                // recalcular total inicialmente
                recalcularTotal();
              } catch (e) {
                console.error('onGridReady error:', e);
              }
            }}
            onFilterChanged={() => recalcularTotal()}
          />
        </GridContainer>

        {confirmDelete && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              <h3>Confirmar Remoção</h3>
              <p>Tem certeza que deseja remover este registro?</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                <Button $variant="secondary" onClick={() => setConfirmDelete(null)}>
                  Cancelar
                </Button>
                <Button $variant="danger" onClick={confirmarRemocao}>
                  Remover
                </Button>
              </div>
            </div>
          </div>
        )}
        {showCaixaModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
          }}>
            <div style={{
              width: '98%',
              maxWidth: '1320px', // aumentada em ~10% para evitar quebra de linha/horizontal scroll
              maxHeight: '90vh',
              overflowY: 'auto', // permitir rolagem vertical quando necessário
              overflowX: 'hidden', // remover barra de rolagem horizontal
              boxSizing: 'border-box',
              background: '#fff',
              borderRadius: 8,
              padding: 12,
              position: 'relative'
            }}>
              <Header style={{ marginBottom: 8 }}>
                <Title>
                  <FontAwesomeIcon icon={faBank} /> {modalPayload && modalPayload._mode === 'incluir' ? 'Novo Movimento' : 'Editar Movimento'}
                </Title>
                <Button $variant="secondary" onClick={() => { setShowCaixaModal(false); setModalPayload(null); }}>
                  ✕ Fechar
                </Button>
              </Header>
              <CaixaBancosForm
                initialPayload={modalPayload}
                readOnlyPrimary={false}
                onClose={(shouldRefresh?: boolean) => {
                  setShowCaixaModal(false);
                  setModalPayload(null);
                  if (shouldRefresh !== false) {
                    buscarRegistros();
                  }
                }}
              />
            </div>
          </div>
        )}
      </Container>
    );
  }

  // ============================================================================
  // RENDER - Modo EDITAR / INCLUIR
  // ============================================================================

  if (modo === 'editar' || modo === 'incluir') {
    const handleFormChange = (field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleSalvar = async () => {
      try {
        setLoading(true);
        setErro(null);

        const endpoint = modo === 'editar' 
          ? `/api/v1/caixa/atualizar-movimento`
          : `/api/v1/caixa/criar-movimento`;

        const method = modo === 'editar' ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensagem || 'Erro ao salvar movimento');
        }

        setLoading(false);
        setModo('localizar'); // substitui voltarParaLocalizar removido
        buscarRegistros();
      } catch (err) {
        setErro(err instanceof Error ? err.message : 'Erro ao salvar movimento.');
        console.error('[CaixaFormularioLocalizar] Erro:', err);
        setLoading(false);
      }
    };

    return (
      <Container>
        <Header>
          <Title>
            <FontAwesomeIcon icon={faBank} /> {modo === 'editar' ? 'Editar Movimento' : 'Novo Movimento'}
          </Title>
          <Button $variant="secondary" onClick={() => setModo('localizar')}>
            ✕ Voltar
          </Button>
        </Header>
        
        {erro && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fee',
            border: '1px solid #f88',
            borderRadius: '4px',
            color: '#c33'
          }}>
            ⚠️ {erro}
          </div>
        )}

        <div style={{
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          {/* Data do Movimento */}
          <FilterGroup>
            <Label>Data do Movimento *</Label>
            <Input 
              type="date" 
              value={formData.dtmovi_cai || ''}
              onChange={(e) => handleFormChange('dtmovi_cai', e.target.value)}
            />
          </FilterGroup>

          {/* Banco */}
          <FilterGroup>
            <Label>Banco *</Label>
            <Select 
              value={formData.codbanco_cai || ''}
              onChange={(e) => handleFormChange('codbanco_cai', e.target.value)}
            >
              <option value="">Selecione um banco</option>
              {(bancos || []).map(banco => (
                <option key={banco.codigo_bco} value={banco.codigo_bco}>
                  {banco.codigo_bco} - {banco.nome_bco}
                </option>
              ))}
            </Select>
          </FilterGroup>

          {/* Tipo de Operação (D/C) */}
          <FilterGroup>
            <Label>Tipo de Operação *</Label>
            <Select 
              value={formData.dc_cai || 'C'}
              onChange={(e) => handleFormChange('dc_cai', e.target.value)}
            >
              <option value="D">Débito</option>
              <option value="C">Crédito</option>
            </Select>
          </FilterGroup>

          {/* Valor */}
          <FilterGroup>
            <Label>Valor *</Label>
            <Input 
              type="number" 
              step="0.01"
              value={formData.valor_cai || ''}
              onChange={(e) => handleFormChange('valor_cai', parseFloat(e.target.value) || 0)}
            />
          </FilterGroup>

          {/* Sequência (somente exibição) */}
          <FilterGroup>
            <Label>Sequência</Label>
            <Input 
              type="text" 
              value={formData.seq_cai || ''}
              disabled
            />
          </FilterGroup>

          {/* Observação */}
          <FilterGroup>
            <Label>Observação</Label>
            <Input 
              type="text" 
              value={formData.obs_cai || ''}
              onChange={(e) => handleFormChange('obs_cai', e.target.value)}
              placeholder="Digite uma observação (opcional)"
            />
          </FilterGroup>
        </div>

        <ActionButtonsContainer>
          <Button $variant="secondary" onClick={() => setModo('localizar')} disabled={loading}>
            Cancelar
          </Button>
          <Button $variant="primary" onClick={handleSalvar} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </ActionButtonsContainer>
      </Container>
    );
  }

  return null;
};

export default CaixaFormularioLocalizar;













