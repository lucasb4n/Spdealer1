import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faChevronDown,
  faChevronRight,
  faSearch,
  faBoxes,
  faFileInvoice,
  faDollarSign,
  faSort,
  faSortUp,
  faSortDown,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';

interface ItemOrdem {
  fab: string;
  codigo: string;
  nome: string;
  qtde: number;
  preco: number;
  vlrtot?: number;
  nrOrdem?: string;
  dataOrdem?: any;
}

interface OrdemCompra {
  empre: string;
  origem: string;
  nrordem: string;
  fornecCodigo: string;
  fornecedor: string;
  dtpedidoi?: string;
  dtpedido?: number;
  valorTotal: number;
  consultor?: string;
  vendedor?: string;
  tipo?: string;
  efetivado?: string;
  itens?: ItemOrdem[];
}

type SortField = 'nrordem' | 'fornecedor' | 'dtpedidoi' | 'valorTotal' | 'vendedor' | 'tipo';
type SortDirection = 'asc' | 'desc';

const formatMoney = (n: any): string => {
  const num = Number(n);
  return (isNaN(num) ? 0 : num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDateBr = (isoOrBr: any): string => {
  if (!isoOrBr) return '-';
  const s = String(isoOrBr).trim();
  if (s.includes('-')) {
    const parts = s.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  if (s.length === 8 && !isNaN(Number(s))) {
    return `${s.substring(6, 8)}/${s.substring(4, 6)}/${s.substring(0, 4)}`;
  }
  return s;
};

const getUrgenciaLabel = (tipo?: string) => {
  switch (tipo?.toUpperCase()) {
    case 'U':
      return { text: 'Urgente', bg: '#fee2e2', color: '#dc2626' };
    case 'E':
      return { text: 'Emergência', bg: '#fef3c7', color: '#d97706' };
    case 'N':
    default:
      return { text: 'Normal', bg: '#e0f2fe', color: '#0369a1' };
  }
};

const ManutencaoOrdemCompraPage: React.FC = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [dtInicial, setDtInicial] = useState('');
  const [dtFinal, setDtFinal] = useState('');
  const [ordens, setOrdens] = useState<OrdemCompra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [ordemExcluir, setOrdemExcluir] = useState<OrdemCompra | null>(null);
  const [deleting, setDeleting] = useState(false);

  // AG-Grid style header sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchOrdens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (busca.trim()) params.append('search', busca.trim());
      if (dtInicial.trim()) params.append('dtInicial', dtInicial.trim());
      if (dtFinal.trim()) params.append('dtFinal', dtFinal.trim());

      const url = `/api/compras/ordens${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rawList: OrdemCompra[] = Array.isArray(json) ? json : json.data || [];

      // Deduplicate orders by unique key (empre_origem_nrordem)
      const seen = new Set<string>();
      const uniqueList: OrdemCompra[] = [];
      for (const item of rawList) {
        const key = `${item.empre}_${item.origem}_${item.nrordem}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      }

      setOrdens(uniqueList);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar ordens de compra');
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  }, [busca, dtInicial, dtFinal]);

  useEffect(() => {
    fetchOrdens();
  }, [fetchOrdens]);

  const toggleExpand = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const handleExcluir = async () => {
    if (!ordemExcluir) return;
    setDeleting(true);
    try {
      const url = `/api/compras/excluir?empre=${encodeURIComponent(ordemExcluir.empre)}&origem=${encodeURIComponent(ordemExcluir.origem)}&nrordem=${encodeURIComponent(ordemExcluir.nrordem)}`;
      const res = await fetch(url, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || 'Erro ao excluir ordem de compra.');
        return;
      }
      setOrdens((prev) =>
        prev.filter(
          (o) =>
            !(
              o.empre === ordemExcluir.empre &&
              o.origem === ordemExcluir.origem &&
              o.nrordem === ordemExcluir.nrordem
            )
        )
      );
      setOrdemExcluir(null);
    } catch (e: any) {
      alert(e?.message || 'Falha na conexão ao excluir ordem de compra.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleClearFilters = () => {
    setBusca('');
    setDtInicial('');
    setDtFinal('');
  };

  // KPIs Calculations
  const kpis = useMemo(() => {
    let totalPecasUni = 0;
    let totalOrdens = ordens.length;
    let totalValor = 0;

    for (const o of ordens) {
      totalValor += Number(o.valorTotal) || 0;
      if (o.itens && Array.isArray(o.itens)) {
        for (const item of o.itens) {
          totalPecasUni += Number(item.qtde) || 0;
        }
      }
    }

    return { totalPecasUni, totalOrdens, totalValor };
  }, [ordens]);

  // Sorted Ordens List
  const sortedOrdens = useMemo(() => {
    if (!sortField) return ordens;
    return [...ordens].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'dtpedidoi') {
        aVal = a.dtpedidoi || a.dtpedido || '';
        bVal = b.dtpedidoi || b.dtpedido || '';
      } else if (sortField === 'valorTotal') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [ordens, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <FontAwesomeIcon icon={faSort} style={{ opacity: 0.3, marginLeft: 6, fontSize: 11 }} />;
    return sortDirection === 'asc' ? (
      <FontAwesomeIcon icon={faSortUp} style={{ marginLeft: 6, color: '#1e4e79', fontSize: 12 }} />
    ) : (
      <FontAwesomeIcon icon={faSortDown} style={{ marginLeft: 6, color: '#1e4e79', fontSize: 12 }} />
    );
  };

  return (
    <div className="sp-page" style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: '#1e4e79', fontWeight: 700 }}>
            Manutenção de Ordem de Compra
          </h1>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Gerenciamento e acompanhamento de ordens de compra e peças
          </span>
        </div>
        <button
          onClick={() => navigate('/pecas/compras/manutencao-ordem-compra/nova')}
          style={{
            background: '#1e4e79',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            boxShadow: '0 2px 4px rgba(30,78,121,0.2)',
          }}
        >
          <FontAwesomeIcon icon={faPlus} /> + Nova Ordem
        </button>
      </div>

      {/* KPI Cards Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* KPI 1: Peças Uni */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <FontAwesomeIcon icon={faBoxes} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Peças Uni
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {kpis.totalPecasUni.toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Unidades de Peças</div>
          </div>
        </div>

        {/* KPI 2: Ordens */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <FontAwesomeIcon icon={faFileInvoice} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Ordens
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {kpis.totalOrdens.toLocaleString('pt-BR')}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Ordens de Pedido</div>
          </div>
        </div>

        {/* KPI 3: Valor Total */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: '#faf5ff',
              color: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Valor Total
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {formatMoney(kpis.totalValor)}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Total das Ordens</div>
          </div>
        </div>
      </div>

      {/* Filter Box with Date Filter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          background: '#f8fafc',
          padding: '14px 16px',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Buscar por Número, Fornecedor ou Código
          </label>
          <input
            type="text"
            placeholder="Digite para buscar ordens de compra..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchOrdens();
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 13,
              outline: 'none',
              background: '#fff',
            }}
          />
        </div>

        <div style={{ width: 150, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Data Inicial
          </label>
          <input
            type="date"
            value={dtInicial}
            onChange={(e) => setDtInicial(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 13,
              outline: 'none',
              background: '#fff',
            }}
          />
        </div>

        <div style={{ width: 150, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Data Final
          </label>
          <input
            type="date"
            value={dtFinal}
            onChange={(e) => setDtFinal(e.target.value)}
            style={{
              padding: '7px 10px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 13,
              outline: 'none',
              background: '#fff',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={fetchOrdens}
            style={{
              background: '#1e4e79',
              color: '#fff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              height: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FontAwesomeIcon icon={faSearch} /> Buscar
          </button>

          {(busca || dtInicial || dtFinal) && (
            <button
              onClick={handleClearFilters}
              title="Limpar filtros"
              style={{
                background: '#e2e8f0',
                color: '#475569',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                height: 36,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FontAwesomeIcon icon={faUndo} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {loading && <div style={{ padding: 12, color: '#64748b', fontSize: 14 }}>Carregando ordens de compra...</div>}
      {error && <div style={{ padding: 12, color: '#dc2626', fontSize: 14 }}>Erro: {error}</div>}

      {/* Main Table with AG-Grid Header Properties */}
      {!loading && !error && (
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', userSelect: 'none' }}>
                <th style={{ padding: '12px 14px', width: 30 }}></th>
                <th
                  onClick={() => handleSort('nrordem')}
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#334155',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '.4px',
                    cursor: 'pointer',
                  }}
                >
                  Número {renderSortIcon('nrordem')}
                </th>
                <th
                  onClick={() => handleSort('fornecedor')}
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#334155',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '.4px',
                    cursor: 'pointer',
                  }}
                >
                  Fornecedor {renderSortIcon('fornecedor')}
                </th>
                <th
                  onClick={() => handleSort('dtpedidoi')}
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#334155',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '.4px',
                    cursor: 'pointer',
                  }}
                >
                  Data Emissão {renderSortIcon('dtpedidoi')}
                </th>
                <th
                  onClick={() => handleSort('valorTotal')}
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#334155',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '.4px',
                    textAlign: 'right',
                    cursor: 'pointer',
                  }}
                >
                  Valor Total {renderSortIcon('valorTotal')}
                </th>
                <th
                  onClick={() => handleSort('vendedor')}
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#334155',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '.4px',
                    cursor: 'pointer',
                  }}
                >
                  Vendedor {renderSortIcon('vendedor')}
                </th>
                <th
                  onClick={() => handleSort('tipo')}
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#334155',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '.4px',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  Urgência {renderSortIcon('tipo')}
                </th>
                <th
                  style={{
                    padding: '12px 14px',
                    fontWeight: 700,
                    color: '#334155',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '.4px',
                    textAlign: 'center',
                    width: 100,
                  }}
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedOrdens.length > 0 ? (
                sortedOrdens.map((ordem) => {
                  const rowKey = `${ordem.empre}_${ordem.origem}_${ordem.nrordem}`;
                  const isExpanded = expandedKey === rowKey;
                  const urg = getUrgenciaLabel(ordem.tipo);
                  const itensList = ordem.itens || [];

                  return (
                    <React.Fragment key={rowKey}>
                      {/* Main Row */}
                      <tr
                        style={{
                          borderBottom: '1px solid #e2e8f0',
                          background: isExpanded ? '#f8fafc' : '#fff',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onClick={() => toggleExpand(rowKey)}
                      >
                        <td style={{ padding: '12px 14px', color: '#64748b', textAlign: 'center' }}>
                          <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronRight} />
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1e4e79' }}>
                          {ordem.nrordem}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 500 }}>
                          {ordem.fornecedor || ordem.fornecCodigo || '-'}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {formatDateBr(ordem.dtpedidoi || ordem.dtpedido)}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#0f172a', textAlign: 'right', fontWeight: 700 }}>
                          {formatMoney(ordem.valorTotal)}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {ordem.vendedor || ordem.consultor || '-'}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              background: urg.bg,
                              color: urg.color,
                              padding: '3px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {urg.text}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                            <button
                              title="Editar ordem de compra"
                              onClick={() =>
                                navigate(
                                  `/pecas/compras/manutencao-ordem-compra/editar/${encodeURIComponent(
                                    ordem.empre
                                  )}/${encodeURIComponent(ordem.origem)}/${encodeURIComponent(ordem.nrordem)}`
                                )
                              }
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#2563eb',
                                padding: 4,
                                fontSize: 15,
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              title="Excluir ordem de compra"
                              onClick={() => setOrdemExcluir(ordem)}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#ef4444',
                                padding: 4,
                                fontSize: 15,
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Unitary Expandable Detail Panel for Items */}
                      {isExpanded && (
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                          <td colSpan={8} style={{ padding: '12px 24px 16px 42px' }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#1e4e79', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                              Peças Vinculadas ao Pedido ({itensList.length} item(ns))
                            </div>
                            {itensList.length > 0 ? (
                              <div style={{ border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                  <thead>
                                    <tr style={{ background: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
                                      <th style={{ padding: '8px 12px', width: 80, fontWeight: 700, color: '#475569' }}>Fab</th>
                                      <th style={{ padding: '8px 12px', width: 140, fontWeight: 700, color: '#475569' }}>Código</th>
                                      <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Nome</th>
                                      <th style={{ padding: '8px 12px', width: 100, textAlign: 'center', fontWeight: 700, color: '#475569' }}>Qtde</th>
                                      <th style={{ padding: '8px 12px', width: 130, textAlign: 'right', fontWeight: 700, color: '#475569' }}>Valor Uni</th>
                                      <th style={{ padding: '8px 12px', width: 110, fontWeight: 700, color: '#475569' }}>N° Ordem</th>
                                      <th style={{ padding: '8px 12px', width: 110, fontWeight: 700, color: '#475569' }}>Data Ordem</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {itensList.map((item, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 12px', color: '#334155' }}>{item.fab}</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e4e79' }}>{item.codigo}</td>
                                        <td style={{ padding: '8px 12px', color: '#334155' }}>{item.nome}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>{item.qtde}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a' }}>{formatMoney(item.preco)}</td>
                                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e4e79' }}>{item.nrOrdem || '-'}</td>
                                        <td style={{ padding: '8px 12px', color: '#334155' }}>{item.dataOrdem ? formatDateBr(item.dataOrdem) : '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                                Nenhuma peça vinculada encontrada nesta ordem.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    Nenhuma ordem de compra localizada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {ordemExcluir && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setOrdemExcluir(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              width: 480,
              maxWidth: '90vw',
              padding: 20,
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 17, color: '#1e4e79' }}>Confirmar Exclusão</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
              Deseja realmente apagar a Ordem de Compra nº <strong>{ordemExcluir.nrordem}</strong>? Esta ação removerá os dados do cabeçalho e todos os itens vinculados.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setOrdemExcluir(null)}
                disabled={deleting}
                style={{
                  background: '#fff',
                  border: '1px solid #cbd5e1',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
                disabled={deleting}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManutencaoOrdemCompraPage;
