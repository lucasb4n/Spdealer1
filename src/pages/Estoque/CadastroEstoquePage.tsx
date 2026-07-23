import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faCheckCircle, faExclamationTriangle, faCoins, faUpload, faPlus } from '@fortawesome/free-solid-svg-icons';
import FilterPanel from 'components/Estoque/FilterPanel';
import AgGridResults from 'components/Estoque/AgGridResults';
import GerencialPanel from 'components/Estoque/GerencialPanel';
import EstoqueForm from './EstoqueForm';
import './CadastroEstoquePage.css';

interface FormData {
  deposito_est: string;
  fab_est: string;
  codprod_est: string;
  locac_kar: string;
  descr_est: string;
  referencia_est: string;
  codfis_est: string;
  codtribicms_est: string;
  ipi_est: string;
  grupofab_est: string;
  ean_est: string;
  sigla_est: string;
  catitem_est: string;
  unimed_est: string;
  peso_est: string;
  natureza_est: string;
  tipofreq_kar: string;
  codesc_kar: string;
  modmaqui_est: string;
  grfuncao_est: string;
  estini_est: string;
  procedencia_est: string;
  anp_est: string;
  descranp_est: string;

  // Itens Correspondentes
  fabcorr_est1: string;
  fabcorr_est2: string;
  fabcorr_est3: string;
  fabcorr_est4: string;
  mascorr_est1: string;
  mascorr_est2: string;
  mascorr_est3: string;
  mascorr_est4: string;
  desccorr_est1: string;
  desccorr_est2: string;
  desccorr_est3: string;
  desccorr_est4: string;
  precorep_kar: string;
  precopub_kar: string;
  precogar_kar: string;
  percsug_kar: string;
  precodol_kar: string;
  precusto_kar: string;
  codpco_kar: string;
  tabela_kar: string;
  estmin_kar: string;
  estmax_kar: string;
  estmind_kar: string;
  reserva_est: string;
}

const CadastroEstoquePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fab: editFab, codprod: editCodprod } = useParams<{ fab?: string; codprod?: string }>();
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editData, setEditData] = useState<Partial<FormData> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [filters, setFilters] = useState<any>({});
  const [showGerencial, setShowGerencial] = useState(false);
  const gridRef = useRef<any>(null);

  const [resumo, setResumo] = useState({
    totalProdutos: 0,
    comEstoque: 0,
    itensSolicitados: 0,
    valorEstoque: 0
  });

  const handleTotalsChange = useCallback((totals: { totalProdutos: number; comEstoque: number; valorEstoque: number }) => {
    setResumo(prev => ({ ...prev, ...totals }));
  }, []);

  useEffect(() => {
    if (!mostrarForm) {
      (async () => {
        try {
          const resp = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/consulta/resumo`);
          if (resp.ok) {
            const data = await resp.json();
            setResumo(prev => ({
              ...prev,
              itensSolicitados: Number(data.itensSolicitados || 0),
            }));
          }
        } catch (e) {
          console.error('Erro ao carregar resumo:', e);
        }
      })();
    }
  }, [mostrarForm]);

  const formatCurrency = (v: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  };

  const handleExportCsv = () => {
    if (gridRef.current && typeof gridRef.current.exportCsv === 'function') {
      gridRef.current.exportCsv();
    } else {
      const btn = document.querySelector('button[title*="CSV"]') as HTMLButtonElement;
      if (btn) btn.click();
    }
  };

  useEffect(() => {
    if (location.state && (location.state as any).action === 'new') {
      setIsEditing(false);
      setEditData(null);
      setMostrarForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/cadastro`);
      if (resp.ok) {
        const data = await resp.json();
        setDados(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (editFab && editCodprod) {
      setIsEditing(true);
      setMostrarForm(true);
      (async () => {
        try {
          const resp = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/cadastro/${encodeURIComponent(editFab)}/${encodeURIComponent(editCodprod)}`);
          if (resp.ok) {
            const data = await resp.json();
            const mapped: Partial<FormData> = {
              fab_est: String(data.fab_est || ''),
              codprod_est: String(data.codprod_est || ''),
              deposito_est: String(data.dep_kar ?? data.deposito_est ?? ''),
              descr_est: String(data.descr_est || ''),
              referencia_est: String(data.referencia_est || ''),
              codfis_est: String(data.codfis_est || ''),
              codtribicms_est: String(data.codtribicms_est || ''),
              ipi_est: String(data.ipi_est ?? '0'),
              grupofab_est: String(data.grupofab_est || ''),
              ean_est: String(data.ean_est || ''),
              sigla_est: String(data.sigla_est || ''),
              catitem_est: String(data.catitem_est || ''),
              unimed_est: String(data.unimed_est ?? data.unined_est ?? ''),
              peso_est: String(data.peso_est ?? '0'),
              natureza_est: String(data.natureza_est || ''),
              tipofreq_kar: String(data.tipofreq_kar || ''),
              codesc_kar: String(data.codesc_kar || 'N'),
              modmaqui_est: String(data.modmaqui_est || ''),
              grfuncao_est: String(data.grfuncao_est || ''),
              estini_est: String(data.estini_est || 'N'),
              locac_kar: String(data.locac_kar || ''),
              procedencia_est: String(data.procedencia_est || ''),
              anp_est: String(data.anp_est || ''),
              descranp_est: String(data.descranp_est || ''),
              reserva_est: String(data.reserva_est ?? ''),

              // Itens Correspondentes
              fabcorr_est1: String(data.fabcorr_est1 || ''),
              fabcorr_est2: String(data.fabcorr_est2 || ''),
              fabcorr_est3: String(data.fabcorr_est3 || ''),
              fabcorr_est4: String(data.fabcorr_est4 || ''),
              mascorr_est1: String(data.mascorr_est1 || ''),
              mascorr_est2: String(data.mascorr_est2 || ''),
              mascorr_est3: String(data.mascorr_est3 || ''),
              mascorr_est4: String(data.mascorr_est4 || ''),
              desccorr_est1: data.mascorr_est1 ? String(data.desccorr_est1 || '') : '',
              desccorr_est2: data.mascorr_est2 ? String(data.desccorr_est2 || '') : '',
              desccorr_est3: data.mascorr_est3 ? String(data.desccorr_est3 || '') : '',
              desccorr_est4: data.mascorr_est4 ? String(data.desccorr_est4 || '') : '',

              // Preço / Kardex
              precorep_kar: data.precorep_kar != null && data.precorep_kar !== '' ? Number(data.precorep_kar).toFixed(2) : '',
              precopub_kar: data.precopub_kar != null && data.precopub_kar !== '' ? Number(data.precopub_kar).toFixed(2) : '',
              precogar_kar: data.precogar_kar != null && data.precogar_kar !== '' ? Number(data.precogar_kar).toFixed(2) : '',
              percsug_kar: String(data.percsug_kar ?? ''),
              precodol_kar: String(data.precodol_kar ?? ''),
              precusto_kar: String(data.precusto_kar ?? ''),
              codpco_kar: String(data.codpco_kar ?? 'N'),
              tabela_kar: String(data.tabela_kar ?? 'N'),
              estmin_kar: String(data.estmin_kar ?? ''),
              estmax_kar: String(data.estmax_kar ?? ''),
              estmind_kar: String(data.estmind_kar ?? ''),
            };
            setEditData(mapped);
          }
        } catch (e) {
          console.error('Erro ao carregar produto para edição:', e);
        }
      })();
    }
  }, [editFab, editCodprod]);

  const handleIncluir = useCallback(() => {
    setIsEditing(false);
    setEditData(null);
    setMostrarForm(true);
  }, []);

  const handleSalvar = useCallback(() => {
    setMostrarForm(false);
    setEditData(null);
    setIsEditing(false);
    carregarDados();
  }, [carregarDados]);

  const handleCancelar = useCallback(() => {
    setMostrarForm(false);
    setEditData(null);
    setIsEditing(false);
    if (editFab && editCodprod) {
      navigate('/pecas/cadastro-estoque');
    }
  }, [navigate, editFab, editCodprod]);

  return (
    <div className="page-estoque-consulta" style={{ padding: '24px', backgroundColor: '#f8fafc', height: 'calc(100vh - 60px)', overflowY: mostrarForm ? 'hidden' : 'auto' }}>
      {mostrarForm ? (
        <div className="sp-list-container">
          <div className="sp-list-header">
            <h2>{isEditing ? 'Editar Produto' : 'Cadastro de Estoque'}</h2>
          </div>
          <div className="sp-list-content">
            <EstoqueForm
              onSave={handleSalvar}
              onCancel={handleCancelar}
              isEditing={isEditing}
              initialData={editData || undefined}
            />
          </div>
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div className="sp-header-bar">
            <h1>Cadastro de Estoque</h1>
            <div className="sp-actions-group">
              <button className="sp-btn-dashboard" onClick={handleExportCsv} title="Importar CSV">
                <FontAwesomeIcon icon={faUpload} /> Importar CSV
              </button>
              <button 
                className="sp-btn-dashboard sp-btn-dashboard--success" 
                onClick={handleIncluir}
                title="Novo Produto"
              >
                <FontAwesomeIcon icon={faPlus} /> Novo Produto
              </button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="sp-dashboard-cards">
            <div className="sp-kpi-card">
              <div className="sp-kpi-card__info">
                <span className="sp-kpi-card__label">Total de Produtos</span>
                <span className="sp-kpi-card__value">{resumo.totalProdutos}</span>
              </div>
              <div className="sp-kpi-card__icon-wrapper sp-kpi-card__icon-wrapper--indigo">
                <FontAwesomeIcon icon={faBox} />
              </div>
            </div>

            <div className="sp-kpi-card">
              <div className="sp-kpi-card__info">
                <span className="sp-kpi-card__label">Com Estoque</span>
                <span className="sp-kpi-card__value sp-kpi-card__value--green">{resumo.comEstoque}</span>
              </div>
              <div className="sp-kpi-card__icon-wrapper sp-kpi-card__icon-wrapper--green">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
            </div>

            <div className="sp-kpi-card">
              <div className="sp-kpi-card__info">
                <span className="sp-kpi-card__label">Item Solicitado</span>
                <span className="sp-kpi-card__value sp-kpi-card__value--orange">{resumo.itensSolicitados}</span>
              </div>
              <div className="sp-kpi-card__icon-wrapper sp-kpi-card__icon-wrapper--orange">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
            </div>

            <div className="sp-kpi-card">
              <div className="sp-kpi-card__info">
                <span className="sp-kpi-card__label">Valor em Estoque</span>
                <span className="sp-kpi-card__value sp-kpi-card__value--blue">{formatCurrency(resumo.valorEstoque)}</span>
              </div>
              <div className="sp-kpi-card__icon-wrapper sp-kpi-card__icon-wrapper--blue">
                <FontAwesomeIcon icon={faCoins} />
              </div>
            </div>
          </div>

          {/* SEARCH PANEL AND GRID */}
          <div className="row mb-2 align-items-start">
            <div className="col-12">
              <FilterPanel 
                onChange={setFilters} 
                onToggleGerencial={() => setShowGerencial(s => !s)} 
                showGerencial={showGerencial} 
                mode="cadastro"
              />
            </div>
          </div>

          <div className="row" style={{ marginTop: '-4px' }}>
            {showGerencial && (
              <aside className="col-md-4">
                <GerencialPanel 
                  filters={filters} 
                  onApplyFilters={setFilters} 
                  onHighlight={(produto)=> gridRef.current?.highlightProduct(produto)} 
                />
              </aside>
            )}
            <main className={showGerencial ? 'col-md-8' : 'col-12'}>
              <AgGridResults ref={gridRef} filters={filters} mode="cadastro" onTotalsChange={handleTotalsChange} />
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default CadastroEstoquePage;
