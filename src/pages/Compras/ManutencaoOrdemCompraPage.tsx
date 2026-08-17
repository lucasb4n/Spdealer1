import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faChevronDown, faChevronRight, faSearch } from '@fortawesome/free-solid-svg-icons';

interface ItemOrdem {
  fab: string;
  codigo: string;
  nome: string;
  qtde: number;
  preco: number;
  vlrtot?: number;
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
  const [ordens, setOrdens] = useState<OrdemCompra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [ordemExcluir, setOrdemExcluir] = useState<OrdemCompra | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrdens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = busca.trim()
        ? `/api/compras/ordens?search=${encodeURIComponent(busca.trim())}`
        : '/api/compras/ordens';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      setOrdens(list);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar ordens de compra');
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  }, [busca]);

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

  return (
    <div className="sp-page" style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, color: '#1e4e79' }}>Manutenção de Ordem de Compra</h1>
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
          }}
        >
          <FontAwesomeIcon icon={faPlus} /> + Nova Ordem
        </button>
      </div>

      {/* Filter Box */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          background: '#f8fafc',
          padding: '14px 16px',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
            Buscar por Número, Fornecedor ou Código
          </label>
          <input
            type="text"
            placeholder="Digite para filtrar ordens de compra..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchOrdens();
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              background: '#fff',
            }}
          />
        </div>
        <button
          onClick={fetchOrdens}
          style={{
            background: '#1e4e79',
            color: '#fff',
            border: 'none',
            padding: '8px 20px',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            height: 38,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FontAwesomeIcon icon={faSearch} /> Buscar
        </button>
      </div>

      {/* Feedback Messages */}
      {loading && <div style={{ padding: 12, color: '#64748b', fontSize: 14 }}>Carregando ordens de compra...</div>}
      {error && <div style={{ padding: 12, color: '#dc2626', fontSize: 14 }}>Erro: {error}</div>}

      {/* Main Table */}
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
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '12px 14px', width: 30 }}></th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#334155' }}>Número</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#334155' }}>Fornecedor</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#334155' }}>Data Emissão</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#334155', textAlign: 'right' }}>
                  Valor Total
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#334155' }}>Vendedor</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
                  Urgência
                </th>
                <th style={{ padding: '12px 14px', fontWeight: 700, color: '#334155', textAlign: 'center', width: 100 }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {ordens.length > 0 ? (
                ordens.map((ordem) => {
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

                      {/* Expandable Detail Panel for Items */}
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
