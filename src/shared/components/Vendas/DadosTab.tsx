import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Parcela, TIPO_ORP_OPTIONS, ItemOrcamento } from './OrcamentoTypes';
import Localizar from 'components/Localizar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import './OrcamentoForm.css';

interface BancoItem {
  codigo_bco: string;
  nome_bco: string;
}

interface CobrancaItem {
  codigo: string;
  descricao: string;
}

interface NivelPreco {
  nivel_niv: string;
  descr_niv: string;
  perc_niv: number;
}

interface DadosTabProps {
  control: any;
  setValue: any;
  watch: any;
  errors: any;
  parcelas: Parcela[];
  onParcelasChange: (parcelas: Parcela[]) => void;
  totais: { totpec: number; totser: number; totger: number };
  disabled?: boolean;
  onNumeroOrcamentoChange?: (numero: number) => void;
  activeTab?: string;
  numero?: string;
  itens?: ItemOrcamento[];
  onRecalcularItensPorNivel?: (percNiv: number) => void;
  onVirarPedido?: () => void;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDateToBR = (iso: string): string => {
  if (!iso) return '';
  if (iso.includes('/')) return iso;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
};

const parseDateToISO = (br: string): string => {
  if (!br) return '';
  if (br.includes('-')) return br;
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return br;
};

export const DadosTab: React.FC<DadosTabProps> = ({
  control,
  setValue,
  watch,
  errors,
  parcelas,
  onParcelasChange,
  totais,
  disabled = false,
  onNumeroOrcamentoChange,
  activeTab,
  numero,
  itens,
  onRecalcularItensPorNivel,
  onVirarPedido,
}) => {
  const [showOrcamentoModal, setShowOrcamentoModal] = useState(false);
  const [orcamentoListData, setOrcamentoListData] = useState<any[]>([]);
  const [vendedorList, setVendedorList] = useState<any[]>([]);
  const [niveisList, setNiveisList] = useState<NivelPreco[]>([]);
  const [maspagList, setMaspagList] = useState<{ codigo: string; descricao: string; nivel_paga: number | null }[]>([]);
  const [bancosList, setBancosList] = useState<BancoItem[]>([]);
  const [cobrancaList, setCobrancaList] = useState<CobrancaItem[]>([]);

  useEffect(() => {
    fetch('/api/v1/niveis-preco?size=100')
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setNiveisList(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/maspag')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMaspagList(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/bancos')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setBancosList(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/mascob')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setCobrancaList(data);
      })
      .catch(() => {});
  }, []);

  const condpagOrp = watch('CONDPAG_ORP');

  useEffect(() => {
    if (!numero) return;
    fetch(`/api/v1/orcamentos/${numero}/parcelas`)
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          onParcelasChange(res.data);
        }
      })
      .catch(() => {});
  }, [numero, condpagOrp]);

  const maspagMap = useMemo(() => {
    const map = new Map<string, string>();
    maspagList.forEach(p => {
      map.set(p.codigo, p.descricao);
      const numeric = String(Number(p.codigo));
      map.set(numeric, p.descricao);
      map.set(numeric.padStart(2, '0'), p.descricao);
      map.set(numeric.padStart(3, '0'), p.descricao);
    });
    return map;
  }, [maspagList]);

  const getCondpagDesc = (codigo: string | undefined): string => {
    if (!codigo) return '';
    if (maspagMap.has(codigo)) return maspagMap.get(codigo) || '';
    const numeric = String(Number(codigo));
    if (maspagMap.has(numeric)) return maspagMap.get(numeric) || '';
    if (maspagMap.has(numeric.padStart(2, '0'))) return maspagMap.get(numeric.padStart(2, '0')) || '';
    if (maspagMap.has(numeric.padStart(3, '0'))) return maspagMap.get(numeric.padStart(3, '0')) || '';
    return '';
  };

  const parcelasTotal = useMemo(() => {
    return parcelas.reduce((sum, p) => sum + (p.VALOR || 0), 0);
  }, [parcelas]);

  const diffParcelasTotal = useMemo(() => {
    return Math.abs(parcelasTotal - (totais.totger || 0));
  }, [parcelasTotal, totais.totger]);

  const parcelasBatendo = diffParcelasTotal < 0.01;

  const handleIncluirEntrada = useCallback(() => {
    const maxPar = parcelas.reduce((m, p) => Math.max(m, p.PARCELA || 0), 0);
    const nova: Parcela = {
      NUMERO_ORP: Number(numero) || 0,
      PARCELA: maxPar + 1,
      DATA_VCTO: '',
      VALOR: 0,
      EP: 'E',
    };
    const updated = [...parcelas, nova];
    onParcelasChange(updated);
    if (numero) {
      fetch(`/api/v1/orcamentos/${numero}/parcelas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  }, [parcelas, numero, onParcelasChange]);

  const handleExcluirParcela = useCallback((index: number) => {
    const updated = parcelas.filter((_, i) => i !== index);
    onParcelasChange(updated);
    if (numero) {
      fetch(`/api/v1/orcamentos/${numero}/parcelas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  }, [parcelas, numero, onParcelasChange]);

  useEffect(() => {
    fetch('/api/tabelas-auxiliares/masven')
      .then(r => r.json())
      .then(data => {
        setVendedorList(Array.isArray(data) ? data : []);
      })
      .catch(() => setVendedorList([]));
  }, []);

  const openOrcamentoModal = useCallback(() => {
    fetch('/api/v1/orcamentos?size=100')
      .then(r => r.json())
      .then(data => {
        const rawData = data.data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setOrcamentoListData(rawData.filter((o: any) => o.fechado_orp !== 2));
      })
      .catch(() => setOrcamentoListData([]));
    setShowOrcamentoModal(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' && activeTab === 'dados') {
        e.preventDefault();
        openOrcamentoModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, openOrcamentoModal]);

  const orcamentoColumns = [
    { field: 'numero_orp', headerName: 'Nº Orc.', width: 100 },
    { field: 'nome_cli', headerName: 'Cliente', flex: 1, minWidth: 250 },
    { field: 'cgccpf_cli', headerName: 'CPF/CNPJ', width: 180 },
    {
      field: 'tipo_orp',
      headerName: 'Tipo',
      width: 120,
      cellRenderer: (params: any) => {
        const t = params.value;
        if (t === 'O') return 'Orçamento';
        if (t === 'P') return 'Pedido';
        if (t === 'C') return 'Confirmado';
        return t;
      }
    },
    { field: 'data_orp', headerName: 'Data', width: 110 },
    {
      field: 'totger_orp',
      headerName: 'Total Geral',
      width: 140,
      valueFormatter: (params: any) => params.value != null ? params.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
    },
  ];

  const columnDefsParcelas: ColDef[] = useMemo(() => [
    {
      field: 'PARCELA',
      headerName: 'Par',
      width: 50,
      cellRenderer: (params: any) => {
        const ep = params.data?.EP;
        if (ep === 'E') return <span style={{ color: '#2563eb', fontWeight: 700 }}>E</span>;
        return params.value;
      }
    },
    {
      field: 'DATA_VCTO',
      headerName: 'Vencimento',
      width: 140,
      editable: true,
      valueFormatter: (params) => formatDateToBR(params.value),
      valueParser: (params) => parseDateToISO(params.newValue),
    },
    {
      field: 'VALOR',
      headerName: 'Valor da Parcela',
      width: 130,
      valueFormatter: (params) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right', fontWeight: 'bold' }
    },
    {
      field: 'BANCO',
      headerName: 'Banco',
      width: 170,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...bancosList.map(b => b.codigo_bco)],
      },
      valueFormatter: (params) => {
        if (!params.value) return '';
        const banco = bancosList.find(b => b.codigo_bco === params.value);
        return banco ? `${params.value} - ${banco.nome_bco}` : params.value;
      },
    },
    {
      field: 'COBRANCA',
      headerName: 'Cobrança',
      width: 140,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['', ...cobrancaList.map(c => c.codigo)],
      },
      valueFormatter: (params) => {
        if (!params.value) return '';
        const cob = cobrancaList.find(c => c.codigo === params.value);
        return cob ? `${params.value} - ${cob.descricao}` : params.value;
      },
    },
    {
      headerName: 'Ações',
      width: 70,
      pinned: 'right',
      cellRenderer: (params: any) => {
        if (disabled) return null;
        return (
          <button
            onClick={() => handleExcluirParcela(params.node.rowIndex)}
            title="Excluir parcela"
            style={{
              background: '#fee2e2',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              padding: '4px 6px',
              color: '#dc2626',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        );
      }
    },
  ], [bancosList, cobrancaList, disabled, handleExcluirParcela]);

  const nivMap = useMemo(() => {
    const map = new Map<string, number>();
    niveisList.forEach(n => map.set(String(n.nivel_niv), n.perc_niv));
    return map;
  }, [niveisList]);

  const pagamentoResumo = useMemo(() => {
    if (!itens || itens.length === 0 || !maspagList.length) return [];

    return maspagList
      .filter(p => p.nivel_paga != null)
      .map(p => {
        const percNiv = nivMap.get(String(p.nivel_paga));
        const perc = percNiv ?? 0;

        const totalBase = itens.reduce((sum, item) => {
          const valoravi = item.VALORAVI_ORPP ?? item.PRECOPUB_ORPP ?? 0;
          const qtde = item.QTALOC_ORPP ?? item.QTREC_ORPP ?? 0;
          return sum + valoravi * qtde;
        }, 0);

        const acrescimo = totalBase * perc / 100;
        const totalComAcrescimo = totalBase + acrescimo;

        return {
          descr_paga: p.descricao || p.codigo,
          perc_niv: perc,
          totalBase,
          totalComAcrescimo,
          acrescimo,
        };
      })
      .filter(r => r.perc_niv > 0);
  }, [itens, maspagList, nivMap]);

  const columnDefsResumo: ColDef[] = useMemo(() => [
    {
      field: 'descr_paga',
      headerName: 'Condição de Pagamento',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'totalComAcrescimo',
      headerName: 'Valor Total c/ Acréscimo',
      width: 170,
      valueFormatter: (params) => formatCurrency(params.value),
      cellStyle: { textAlign: 'right', fontWeight: 'bold' },
    },
  ], []);

  const handleImprimir = async () => {
    if (!numero) {
      alert('Salve o orçamento antes de imprimir.')
      return
    }
    try {
      const resp = await fetch(`/api/v1/orcamentos/${numero}/imprimir`, { credentials: 'include' })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        alert('Erro ao gerar PDF: ' + (txt || `HTTP ${resp.status}`))
        return
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 30000)
    } catch (err: any) {
      alert('Erro ao imprimir: ' + (err?.message || String(err)))
    }
  }

  return (
    <div className="orcamento-fade-in">
      {showOrcamentoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 900, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Pesquisar Orçamento / Pedido</h3>
              <button onClick={() => setShowOrcamentoModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div className="orcamento-grid ag-theme-alpine" style={{ flex: 1 }}>
              <AgGridReact
                theme="legacy"
                rowData={orcamentoListData}
                columnDefs={orcamentoColumns}
                pagination={true}
                paginationPageSize={50}
                onRowDoubleClicked={(event) => {
                  if (event.data) {
                    const r = event.data;
                    const num = r.numero_orp || r.NUMERO_ORP;
                    if (onNumeroOrcamentoChange) {
                      onNumeroOrcamentoChange(num);
                    }
                    setShowOrcamentoModal(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="orcamento-layout orcamento-layout--2col">
        {/* LADO ESQUERDO */}
        <div className="orcamento-flex orcamento-flex-col" style={{ gap: '0.75rem' }}>

          {/* Cabeçalho */}
          <div className="orcamento-panel">
            <div className="orcamento-panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Dados do Orçamento</h3>
              <button
                onClick={openOrcamentoModal}
                style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', background: '#fef3c7', color: '#b45309', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
                F4: Pesquisa
              </button>
            </div>
            <div className="orcamento-panel__body">
              <div className="orcamento-field-grid">
                <div className="orcamento-field orcamento-field--2">
                  <label className="orcamento-field__label">Orçamento Nº</label>
                  <Controller
                    name="NUMERO_ORP"
                    control={control}
                    render={({ field }) => (
                      <input {...field} readOnly className="orcamento-field__input orcamento-field__input--readonly orcamento-text-center" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--3">
                  <label className="orcamento-field__label">Tipo de Venda</label>
                  <Controller
                    name="TIPO_ORP"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="orcamento-field__select">
                        {TIPO_ORP_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--3">
                  <label className="orcamento-field__label">Data Emissão</label>
                  <Controller
                    name="DTEMI_ORP"
                    control={control}
                    render={({ field }) => (
                      <input type="date" {...field} className="orcamento-field__input" />
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--4">
                  <label className="orcamento-field__label">Vendedor</label>
                  <Controller
                    name="VENDEDOR_ORP"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="orcamento-field__select" value={field.value || ''}>
                        <option value="">Selecione um vendedor...</option>
                        {vendedorList.map(v => {
                          const cod = String(v.codigo ?? '');
                          const nome = v.descricao || '';
                          const last2 = cod.length >= 2 ? cod.slice(-2) : cod.padStart(2, '0');
                          return (
                            <option key={cod} value={cod}>{nome} ({last2})</option>
                          );
                        })}
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Fechamento e Logística */}
          <div className="orcamento-panel">
            <div className="orcamento-panel__header">
              <h3>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Fechamento e Logística
              </h3>
            </div>
            <div className="orcamento-panel__body">
              <div className="orcamento-field-grid">
                <div className="orcamento-field orcamento-field--6">
                  <label className="orcamento-field__label">Condição de Pagamento</label>
                  <Controller
                    name="CONDPAG_ORP"
                    control={control}
                    render={({ field }) => (
                      <div className="orcamento-field-group">
                        <input {...field} className="orcamento-field__input" style={{ width: '4rem', flex: 'none' }} placeholder="Cód." />
                        <input type="text" readOnly className="orcamento-field__input orcamento-field__input--readonly" value={getCondpagDesc(condpagOrp)} />
                      </div>
                    )}
                  />
                </div>
                <div className="orcamento-field orcamento-field--6">
                  <label className="orcamento-field__label">Nível de Preço</label>
                  <Controller
                    name="NIVEL_ORP"
                    control={control}
                    render={({ field }) => (
                      <select
                        {...field}
                        className="orcamento-field__select"
                        disabled={disabled}
                        onChange={(e) => {
                          field.onChange(e);
                          const nivelId = e.target.value;
                          if (nivelId && onRecalcularItensPorNivel) {
                            const item = niveisList.find(n => String(n.nivel_niv) === nivelId);
                            if (item && item.perc_niv) {
                              onRecalcularItensPorNivel(Number(item.perc_niv));
                            }
                          }
                        }}
                      >
                        <option value="">Selecione um nível...</option>
                        {niveisList.map(n => (
                          <option key={n.nivel_niv} value={n.nivel_niv}>{n.descr_niv}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div className="orcamento-field orcamento-field--5">
                  <label className="orcamento-field__label">Transportadora</label>
                  <input type="text" className="orcamento-field__input" placeholder="Pesquisar transportador..." />
                </div>
                <div className="orcamento-field orcamento-field--3">
                  <label className="orcamento-field__label">Placa / UF</label>
                  <div className="orcamento-field-group">
                    <input type="text" className="orcamento-field__input orcamento-uppercase orcamento-text-center" placeholder="ABC1234" />
                    <input type="text" maxLength={2} className="orcamento-field__input orcamento-field__input--fixed orcamento-uppercase orcamento-text-center" placeholder="UF" />
                  </div>
                </div>
                <div className="orcamento-field orcamento-field--4">
                  <label className="orcamento-field__label">Frete / Seguro</label>
                  <select className="orcamento-field__select">
                    <option>1 - CIF (Emitente)</option>
                    <option>2 - FOB (Destinatário)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Parcelas + Resumo Condições */}
          <div className="orcamento-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
            <div className="orcamento-panel__header">
              <h3>Detalhamento das Parcelas</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', color: '#64748b', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
                  Total: {formatCurrency(totais.totger)}
                </span>
              </div>
            </div>
            {!disabled && (
              <div style={{ padding: '4px 12px 0' }}>
                <button
                  onClick={handleIncluirEntrada}
                  title="Incluir Entrada"
                  style={{
                    background: '#dbeafe',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    color: '#2563eb',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  + Entrada
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', flex: 1, minHeight: 0, padding: '8px' }}>
              <div className="orcamento-grid ag-theme-alpine" style={{ flex: 1.2, minHeight: '150px' }}>
                {!parcelasBatendo && parcelas.length > 0 && (
                  <div style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 600, borderRadius: '0 0 4px 4px' }}>
                    ⚠ Total das parcelas ({formatCurrency(parcelasTotal)}) difere do Total Líquido ({formatCurrency(totais.totger)})
                  </div>
                )}
                <AgGridReact
                  theme="legacy"
                  rowData={parcelas}
                  columnDefs={columnDefsParcelas}
                  defaultColDef={{ resizable: true }}
                  domLayout="autoHeight"
                  pinnedBottomRowData={[
                    {
                      PARCELA: '',
                      DATA_VCTO: 'TOTAL',
                      VALOR: parcelasTotal,
                    }
                  ]}
                  onCellValueChanged={(event) => {
                    if (event.data) {
                      const updated = [...parcelas];
                      const rowIndex = event.node?.rowIndex;
                      if (rowIndex != null && rowIndex < updated.length) {
                        let newData = { ...event.data };
                        if (event.colDef.field === 'BANCO') {
                          const banco = bancosList.find(b => b.codigo_bco === newData.BANCO);
                          if (banco) newData.DBANCO = banco.nome_bco;
                        }
                        if (event.colDef.field === 'COBRANCA') {
                          const cob = cobrancaList.find(c => c.codigo === newData.COBRANCA);
                          if (cob) newData.DCOBRANCA = cob.descricao;
                        }
                        updated[rowIndex] = newData;
                        onParcelasChange(updated);
                        fetch(`/api/v1/orcamentos/${numero}/parcelas`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updated),
                        }).catch(() => {});
                      }
                    }
                  }}
                />
              </div>
              <div className="orcamento-panel" style={{ flex: 0.8, display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', background: '#f8fafc' }}>
                <div style={{ padding: '6px 10px', fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  Valor Total por Condição de Pagamento
                </div>
                <div className="orcamento-grid ag-theme-alpine" style={{ flex: 1, minHeight: '150px' }}>
                  <AgGridReact
                    theme="legacy"
                    rowData={pagamentoResumo}
                    columnDefs={columnDefsResumo}
                    defaultColDef={{ resizable: true }}
                    pagination={true}
                    paginationPageSize={10}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO: Resumo */}
        <div className="orcamento-summary" style={{ alignSelf: 'start' }}>
          <div className="orcamento-summary__header">
            <h3>Totais do Orçamento</h3>
          </div>

          <div className="orcamento-summary__body">
            <div className="orcamento-summary__row orcamento-summary__row--dimmed">
              <span className="orcamento-summary__label">Soma Peças</span>
              <span className="orcamento-summary__value">{formatCurrency(totais.totpec)}</span>
            </div>
            <div className="orcamento-summary__row orcamento-summary__row--dimmed">
              <span className="orcamento-summary__label">Soma Serviços</span>
              <span className="orcamento-summary__value">{formatCurrency(totais.totser)}</span>
            </div>
            <div className="orcamento-summary__row orcamento-summary__row--dimmed">
              <span className="orcamento-summary__label">Vlr. Frete / Seg.</span>
              <span className="orcamento-summary__value">{formatCurrency(0)}</span>
            </div>

            <div style={{ borderTop: '1px solid #334155', margin: '0.25rem 0' }} />

            <div className="orcamento-summary__row orcamento-summary__row--accent">
              <span className="orcamento-summary__label">Total IPI</span>
              <span className="orcamento-summary__value">{formatCurrency(0)}</span>
            </div>
            <div className="orcamento-summary__row orcamento-summary__row--accent">
              <span className="orcamento-summary__label">Total ICMS S.T</span>
              <span className="orcamento-summary__value">{formatCurrency(0)}</span>
            </div>

            <div style={{ borderTop: '1px solid #334155', margin: '0.25rem 0' }} />

            <div className="orcamento-summary__row orcamento-summary__row--negative">
              <span className="orcamento-summary__label">Desconto Financeiro</span>
              <span className="orcamento-summary__value">- {formatCurrency(0)}</span>
            </div>
            <div className="orcamento-summary__row orcamento-summary__row--negative">
              <span className="orcamento-summary__label">Desconto Itens</span>
              <span className="orcamento-summary__value">- {formatCurrency(0)}</span>
            </div>

            <div className="orcamento-summary__total">
              <span className="orcamento-summary__total-label">Valor Total Líquido</span>
              <span className="orcamento-summary__total-value">{formatCurrency(totais.totger)}</span>
            </div>

            {/* Observações */}
            <div style={{ marginTop: '0.5rem' }}>
              <label className="orcamento-field__label" style={{ color: '#64748b' }}>Observações Internas</label>
              <Controller
                name="OBS_ORP"
                control={control}
                render={({ field }) => (
                  <textarea {...field} rows={3} className="orcamento-textarea" style={{ background: '#1e293b', borderColor: '#334155', color: '#e2e8f0' }} placeholder="Notas do vendedor..." />
                )}
              />
            </div>
          </div>

          {/* Botões */}
          <div style={{ padding: '0.75rem', background: '#1e293b', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button type="button" className="orcamento-btn orcamento-btn--ghost" onClick={handleImprimir}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Imprimir
              </button>
              <button type="button" className="orcamento-btn orcamento-btn--secondary" style={{ background: '#d97706', color: '#fff' }} onClick={onVirarPedido} disabled={disabled}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Virar Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DadosTab;













