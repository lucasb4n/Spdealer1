import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSync, faTrash, faPencil } from '@fortawesome/free-solid-svg-icons';

interface MovimentoCaixa {
  id: number;
  dtmovi_cai: string;
  banco_cai: string;
  banco_nome: string;
  dc_cai: 'C' | 'D';
  valor_cai: number;
  historico_cai: string;
  cliente_cai: string;
}

interface GradeMovimentosCaixaProps {
  onNovoMovimento?: () => void;
  onEditarMovimento?: (movimento: MovimentoCaixa) => void;
  onDeletarMovimento?: (id: number) => void;
  onRefresh?: () => void;
}

// ============================================================
// STYLED COMPONENTS
// ============================================================

const Container = styled.div`
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
`;

const Title = styled.h3`
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    
    & > * {
      width: 100%;
    }
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    
    & > * {
      width: 100%;
    }
  }
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 768px) {
    min-width: auto;
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 768px) {
    min-width: auto;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover { background: #e5e7eb; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const GridContainer = styled.div`
  height: 500px;
  width: 100%;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 400px;
  }

  @media (max-width: 480px) {
    height: 300px;
  }

  .ag-root {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
  }

  .ag-header-cell {
    background-color: #f9fafb;
    font-weight: 600;
    border-color: #e5e7eb;
  }

  .ag-row {
    border-color: #e5e7eb;
  }

  .ag-row:hover {
    background-color: #f9fafb;
  }

  .ag-cell {
    padding: 8px;
    font-size: 13px;
  }
`;

const Badge = styled.span<{ $type?: 'credito' | 'debito' }>`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;

  ${props => {
    switch (props.$type) {
      case 'credito':
        return `
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        `;
      case 'debito':
        return `
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        `;
      default:
        return `
          background-color: #e0e7ff;
          color: #3730a3;
          border: 1px solid #c7d2fe;
        `;
    }
  }}
`;

const StatusMessage = styled.div<{ $type?: 'success' | 'error' | 'warning' | 'info' }>`
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-weight: 500;
  font-size: 14px;

  ${props => {
    switch (props.$type) {
      case 'success':
        return `
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        `;
      case 'error':
        return `
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        `;
      case 'warning':
        return `
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        `;
      default:
        return `
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        `;
    }
  }}
`;

// ============================================================
// COMPONENT
// ============================================================

const GradeMovimentosCaixa: React.FC<GradeMovimentosCaixaProps> = ({
  onNovoMovimento,
  onEditarMovimento,
  onDeletarMovimento,
  onRefresh
}) => {
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [filtroData, setFiltroData] = useState('');
  const [filtroBanco, setFiltroBanco] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'C' | 'D' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'success' | 'error' | 'warning' | 'info'; texto: string } | null>(null);
  const [bancos, setBancos] = useState<any[]>([]);
  const gridRef = useRef<any>(null);
  const gridApiRef = useRef<any>(null);

  const parseCurrency = (v: any) => {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    let s = String(v).trim();
    s = s.replace(/R\$|\s/g, '');
    s = s.replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  // Carregar movimentos ao montar
  useEffect(() => {
    carregarMovimentos();
  }, []);

  // Carregar dados de bancos
  useEffect(() => {
    carregarBancos();
  }, []);

  const carregarMovimentos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/caixa/movimentos');
      if (response.ok) {
        const data = await response.json();
        // Normalizar dados: valor numérico e dc_cai padronizado
        const normalized = (data || []).map((m: any) => ({
          ...m,
          // Normalizar campo do banco (várias variantes possíveis do backend)
          banco_cai: m.codbanco_cai ?? m.banco_cai ?? m.banco_codigo ?? m.banco ?? m.banco_cod ?? '',
          banco_nome: m.banco_nome ?? m.nome_bco ?? m.nomefan_bco ?? (m.banco ?? ''),
          valor_cai: parseCurrency(m.valor_cai ?? m.valor ?? m.vlrsal ?? m.vlrtot),
          dc_cai: (String(m.dc_cai || m.tipo || m.DC || '').toUpperCase().startsWith('D') ? 'D' : 'C')
        }));
        setMovimentos(normalized);
        setMensagem(null);
      } else {
        setMensagem({ tipo: 'error', texto: 'Erro ao carregar movimentos' });
      }
    } catch (error) {
      console.error('Erro ao carregar movimentos:', error);
      setMensagem({ tipo: 'error', texto: 'Erro de conexão ao carregar movimentos' });
    } finally {
      setLoading(false);
    }
  };

  const carregarBancos = async () => {
    try {
      const response = await fetch('/api/v1/caixa/bancos');
      if (response.ok) {
        const data = await response.json();
        setBancos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar bancos:', error);
    }
  };

  const handleRefresh = () => {
    carregarMovimentos();
    onRefresh?.();
  };

  const handleDeletar = (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este movimento?')) {
      onDeletarMovimento?.(id);
      setMensagem({ tipo: 'success', texto: 'Movimento deletado com sucesso' });
      setTimeout(() => carregarMovimentos(), 500);
    }
  };

  // Formatadores de valores
  const formatarData = (dataISO: string) => {
    if (!dataISO) return '';
    const date = new Date(dataISO);
    return date.toLocaleDateString('pt-BR');
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Renderizadores de colunas
  const renderizarTipo = (params: any) => (
    <Badge $type={params.value === 'C' ? 'credito' : 'debito'}>
      {params.value === 'C' ? 'Crédito' : 'Débito'}
    </Badge>
  );

  const renderizarValor = (params: any) => (
    <span style={{ fontWeight: '600', color: params.data?.dc_cai === 'C' ? '#10b981' : '#ef4444' }}>
      {formatarMoeda(Math.abs(Number(params.value) || 0))}
    </span>
  );

  const renderizarAcoes = (params: any) => {
    // Não renderizar ações para linhas fixas (pinned bottom/aggregation) ou linhas de total sem id
    if (!params || !params.node) return null;
    // checar pinned bottom/top
    if (params.node.rowPinned === 'bottom' || params.node.rowPinned === 'top') return null;
    // checar se é uma linha de footer/aggregate (algumas versões expõem `footer`)
    if (params.node.footer === true) return null;
    // checar grupo/aggregate/índice inválido
    if (params.node.group === true || params.node.rowIndex == null || params.node.rowIndex < 0) return null;
    if (!params.data) return null;
    // se não existe id (linha de total/placeholder), não mostrar ações
    if (params.data.id == null) return null;

    return (
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => onEditarMovimento?.(params.data)}
          style={{
            padding: '4px 8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="Editar movimento"
        >
          <FontAwesomeIcon icon={faPencil} />
        </button>
        <button
          onClick={() => handleDeletar(params.data.id)}
          style={{
            padding: '4px 8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="Deletar movimento"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    );
  };

  // Definição de colunas
  const columnDefs: ColDef<MovimentoCaixa>[] = [
    {
      headerName: 'Data',
      field: 'dtmovi_cai',
      width: 110, // +10%
      valueFormatter: (params: any) => {
        // evitar mostrar "Invalid Date" no rodapé/aggregate
        if (!params) return '';
        // Se linha é pinned (bottom) ou é uma linha de footer/aggregate/group, não mostrar data
        if (params.node?.rowPinned || params.node?.footer || params.node?.group || params.node?.rowIndex == null || params.node?.rowIndex < 0) return '';
        const v = params.value;
        if (!v) return '';
        const d = new Date(v);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('pt-BR');
      },
      sortable: true,
      filter: 'agDateColumnFilter'
    },
    {
      headerName: 'Banco',
      field: 'banco_nome',
      width: 156, // +30% sobre 120
      sortable: true,
      filter: 'agTextColumnFilter'
    },
    {
      headerName: 'Histórico',
      field: 'historico_cai',
      width: 300,
      sortable: true,
      filter: 'agTextColumnFilter',
      cellStyle: { whiteSpace: 'normal', overflowWrap: 'break-word' }
    },
    {
      headerName: 'D/C',
      field: 'dc_cai',
      width: 90,
      cellRenderer: renderizarTipo,
      sortable: true,
      filter: false
    },
    {
      headerName: 'Valor',
      field: 'valor_cai',
      width: 120,
      // valueGetter retorna o valor com sinal: Crédito (C) = positivo, Débito (D) = negativo
      valueGetter: (params: any) => {
        if (!params.data) return 0;
        const raw = Number(params.data.valor_cai) || 0;
        const sinal = params.data.dc_cai === 'C' ? 1 : -1;
        return raw * sinal;
      },
      cellRenderer: renderizarValor,
      sortable: true,
      filter: false,
      type: 'rightAligned',
      // soma segura evitando NaN
      aggFunc: (params: any) => {
        try {
          const values = params.values ?? params.valuesMap ?? [];
          return (values || []).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
        } catch (e) {
          return 0;
        }
      }
    },
    {
      headerName: 'Seq',
      field: 'id',
      width: 80,
      sortable: true,
      filter: false
    },
    {
      headerName: 'Ações',
      field: 'id',
      width: 100,
      cellRenderer: renderizarAcoes,
      sortable: false,
      filter: false,
      pinned: 'right'
    }
  ];

  // Filtrar movimentos baseado em critérios (exceto busca rápida)
  const movimentosBaseFiltrados = movimentos.filter(mov => {
    const dataMatch = !filtroData || String(mov.dtmovi_cai || '').includes(filtroData);
    const tipoMatch = !filtroTipo || mov.dc_cai === filtroTipo;

    // Banco: usar comparação tolerante entre códigos e nomes
    if (!filtroBanco) {
      return dataMatch && tipoMatch;
    }

    const normalize = (v: any) => String(v ?? '').replace(/^0+/, '').trim().toLowerCase();
    const movCodigo = normalize(mov.banco_cai);
    const filtroCodigo = normalize(filtroBanco);

    // Tentar comparar por código
    if (movCodigo && movCodigo === filtroCodigo) return dataMatch && tipoMatch;

    // Tentar comparar por nome do banco (quando backend retorna nome em vez de código)
    const movNome = String(mov.banco_nome ?? '').toLowerCase();
    const selectedBanco = bancos.find(b => String(b.codigo_bco) === String(filtroBanco));
    const selectedNome = selectedBanco ? String(selectedBanco.nome_bco ?? '').toLowerCase() : '';

    if (selectedNome && movNome.includes(selectedNome)) return dataMatch && tipoMatch;

    // Fallback: verificações mais frouxas (contém)
    if (movNome && selectedNome && (movNome.includes(selectedNome) || selectedNome.includes(movNome))) return dataMatch && tipoMatch;

    // última tentativa: comparar se o código do filtro aparece em qualquer campo
    if (String(mov.banco_cai ?? '').includes(String(filtroBanco))) return dataMatch && tipoMatch;

    return false;
  });

  // Aplicar quick filter na grid (para suportar campo de busca rápido externo)
  useEffect(() => {
    const api = gridApiRef.current || gridRef.current?.api;
    if (!api) return;
    try {
      const anyApi: any = api;
      if (typeof anyApi.setQuickFilter === 'function') {
        anyApi.setQuickFilter(searchTerm || '');
        console.debug('[GradeMovimentosCaixa] quickFilter applied via grid API', { searchTerm });
      } else if (typeof anyApi.setQuickFilterText === 'function') {
        anyApi.setQuickFilterText(searchTerm || '');
        console.debug('[GradeMovimentosCaixa] quickFilter applied via legacy API', { searchTerm });
      }
    } catch (err) {
      console.warn('[GradeMovimentosCaixa] setQuickFilter failed', err);
    }
  }, [searchTerm]);

  // Fallback local: se a API do grid não estiver aplicando o filtro (ou por segurança),
  // filtramos os movimentos no próprio componente para garantir resultado visual.
  const matchesSearchTerm = (mov: any, term: string) => {
    if (!term) return true;
    const s = String(term).trim().toLowerCase();
    const fields = [mov.banco_nome, mov.historico_cai, mov.cliente_cai, mov.dtmovi_cai, mov.banco_cai, mov.id];
    for (const f of fields) {
      if (String(f ?? '').toLowerCase().includes(s)) return true;
    }
    // também checar valor formatado
    try {
      const valor = Math.abs(Number(mov.valor_cai) || 0);
      if (formatarMoeda(valor).toLowerCase().includes(s)) return true;
      if (String(valor).toLowerCase().includes(s)) return true;
    } catch (e) {
      // ignore
    }
    return false;
  };

  const manualFilteredBySearch = React.useMemo(() => {
    if (!searchTerm) return movimentosBaseFiltrados;
    return movimentosBaseFiltrados.filter(m => matchesSearchTerm(m, searchTerm));
  }, [movimentosBaseFiltrados, searchTerm]);

  // Logar amostra dos primeiros movimentos para diagnóstico (quando mudam)
  useEffect(() => {
    if (movimentos && movimentos.length > 0) {
      console.debug('[GradeMovimentosCaixa] sample movimentos:', movimentos.slice(0, 3));
    }
  }, [movimentos]);

  return (
    <Container>
      <Header>
        <Title>📊 Movimentos de Caixa</Title>
        <ButtonGroup>
          <Button $variant="primary" onClick={onNovoMovimento} title="Adicionar novo movimento">
            <FontAwesomeIcon icon={faPlus} />
            Novo
          </Button>
          <Button onClick={handleRefresh} disabled={loading} title="Atualizar listagem">
            <FontAwesomeIcon icon={faSync} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Atualizar
          </Button>
        </ButtonGroup>
      </Header>

      {mensagem && (
        <StatusMessage $type={mensagem.tipo}>
          {mensagem.tipo === 'success' && '✓ '} 
          {mensagem.tipo === 'error' && '✗ '} 
          {mensagem.tipo === 'warning' && '⚠ '} 
          {mensagem.tipo === 'info' && 'ℹ '} 
          {mensagem.texto}
        </StatusMessage>
      )}

      <FilterGroup>
        <FilterInput
          type="date"
          value={filtroData}
          onChange={(e) => setFiltroData(e.target.value)}
          placeholder="Filtrar por data"
          title="Filtrar movimentos por data"
        />
        <FilterSelect
          value={filtroBanco}
          onChange={(e) => setFiltroBanco(e.target.value)}
          title="Filtrar movimentos por banco"
        >
          <option value="">Todos os Bancos</option>
          {(bancos || []).map(banco => (
            <option key={banco.codigo_bco} value={banco.codigo_bco}>
              {banco.nome_bco}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as 'C' | 'D' | '')}
          title="Filtrar movimentos por tipo"
        >
          <option value="">Todos os Tipos</option>
          <option value="C">Crédito</option>
          <option value="D">Débito</option>
        </FilterSelect>
        <FilterInput
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Busca Rápida (procura em qualquer coluna)"
          title="Pesquisar em qualquer coluna"
        />
      </FilterGroup>

      <GridContainer>
        <AgGridReact
          ref={gridRef}
          onGridReady={(params) => {
            gridApiRef.current = params.api;
            // garantir quickFilter inicial caso o termo já exista
            try {
              const anyApi: any = params.api;
              if (searchTerm && anyApi) {
                if (typeof anyApi.setQuickFilter === 'function') {
                  anyApi.setQuickFilter(searchTerm);
                } else if (typeof anyApi.setQuickFilterText === 'function') {
                  anyApi.setQuickFilterText(searchTerm);
                }
              }
            } catch (e) {
              console.warn('[GradeMovimentosCaixa] Erro ao aplicar quickFilter onGridReady', e);
            }
          }}
          columnDefs={columnDefs}
          // rowData recebe movimentos filtrados por critérios (data/banco/tipo).
          // Se houver termo de busca, usamos o filtro local `manualFilteredBySearch` como fallback
          // (a API do grid também é chamada, mas este garante resultado visual consistente).
          rowData={searchTerm ? manualFilteredBySearch : movimentosBaseFiltrados}
          defaultColDef={{
            resizable: true,
            sortable: true,
            filter: true
          }}
          pagination={true}
          paginationPageSize={20}
          onCellDoubleClicked={(params) => params.data && onEditarMovimento?.(params.data)}
          domLayout="normal"
          suppressMenuHide={false}
          suppressRowDeselection={false}
        />
      </GridContainer>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Container>
  );
};

export default GradeMovimentosCaixa;













