import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ClienteTab } from 'shared/components/Vendas/ClienteTab';
import { PecasTab } from 'shared/components/Vendas/PecasTab';
import { DadosTab } from 'shared/components/Vendas/DadosTab';
import { TransporteTab } from 'shared/components/Vendas/TransporteTab';
import { Orcamento, ItemOrcamento, Parcela } from 'shared/components/Vendas/OrcamentoTypes';
import '../../shared/components/Vendas/OrcamentoForm.css';

type TabType = 'cliente' | 'pecas' | 'dados' | 'transporte';

const API_BASE = '/api/v1/orcamentos';

const defaultOrcamento: Partial<Orcamento> = {
  NUMERO_ORP: undefined,
  DTEMI_ORP: new Date().toISOString().split('T')[0],
  TIPO_ORP: 'O',
  TIPO: 'Orçamento',
  CONDPAG_ORP: '001',
  NIVEL_ORP: '',
  RAZAOFRET: '',
  PLACA: '',
  PORCONTA: 1,
  CONTATO_ORP: '',
  TIPOCONTATO_ORP: '',
  MODELO_ORP: '',
  CODCLI_ORP: 0,
  CGCCPF_CLI: '',
  NOME_CLI: '',
  LOGRA_ORP: '',
  BAIRRO_ORP: '',
  CIDADE_ORP: '',
  UF_ORP: '',
  CEP_ORP: '',
  INSCEST_ORP: '',
  FONE_ORP: '',
  VENDEDOR_ORP: 0,
  CGCTRANS: '',
  ENDER: '',
  MUNICF: '',
  UFTRANS: '',
  QTDE: 0,
  ESPECIE: '',
  PESOBR: 0,
  PESLIQ: 0,
  MARCA: '',
  LOCAL_ENTREGA: '',
  OBS_ORP: '',
};

const tabs: { id: TabType; label: string }[] = [
  { id: 'cliente', label: '1. Cliente' },
  { id: 'pecas', label: '2. Peças / Serviços' },
  { id: 'dados', label: '3. Fechamento' },
  { id: 'transporte', label: '4. Transporte' },
];

export default function OrcamentoPage() {
  const navigate = useNavigate();
  const { numero } = useParams<{ numero: string }>();
  const isEditing = !!numero && numero !== 'novo';

  const [activeTab, setActiveTab] = useState<TabType>('cliente');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [totais, setTotais] = useState({ totpec: 0, totser: 0, totger: 0 });
  const [error, setError] = useState<string | null>(null);
  const [showPerdaModal, setShowPerdaModal] = useState(false);
  const [showReverterModal, setShowReverterModal] = useState(false);
  const [perdaMotivo, setPerdaMotivo] = useState('');
  const [masperList, setMasperList] = useState<any[]>([]);
  const [showLimiteModal, setShowLimiteModal] = useState(false);
  const [limiteInfo, setLimiteInfo] = useState<{ cliente: string; valorPedido: number; limite: number; saldoPendente: number; disponivel: number } | null>(null);

  const { control, setValue, watch, handleSubmit, reset, formState: { errors } } = useForm<Partial<Orcamento>>({
    defaultValues: defaultOrcamento,
  });

  const onSubmit = useCallback(async (formData: Partial<Orcamento>) => {
    setError(null);

    const vendedor = formData.VENDEDOR_ORP;
    const condPag = formData.CONDPAG_ORP;
    const vendedorValido = vendedor !== undefined && vendedor !== null && Number(vendedor) > 0;
    const condPagValido = condPag !== undefined && condPag !== null && String(condPag).trim() !== '';

    if (!vendedorValido || !condPagValido) {
      let msg = 'Preencha os campos obrigatórios:';
      if (!vendedorValido) msg += ' Vendedor';
      if (!vendedorValido && !condPagValido) msg += ',';
      if (!condPagValido) msg += ' Condição de Pagamento';
      msg += ' para finalizar o orçamento.';
      setError(msg);
      setIsSaving(false);
      return;
    }

    const totalParcelas = parcelas.reduce((sum, p) => sum + (p.VALOR || 0), 0);
    const diff = Math.abs(totalParcelas - (totais.totger || 0));
    if (diff >= 0.01 && parcelas.length > 0) {
      setError(`Total das parcelas (R$ ${totalParcelas.toFixed(2)}) não confere com o Valor Total Líquido (R$ ${(totais.totger || 0).toFixed(2)}). Ajuste antes de gravar.`);
      setIsSaving(false);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        itens: itens.map((item, idx) => ({
          ...item,
          SEQ_ORPP: idx + 1,
        })),
      };

      const url = isEditing ? `${API_BASE}/${numero}` : API_BASE;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        if (!isEditing) {
          navigate(`/vendas/orcamento/${data.numero}`, { replace: true });
        }
        alert('Orçamento salvo com sucesso!');
      } else {
        setError(data.error || 'Erro ao salvar');
      }
    } catch (err) {
      setError('Erro ao salvar orçamento');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [itens, isEditing, numero, navigate]);

  const handleImprimir = useCallback(async () => {
    if (!isEditing || !numero) {
      alert('Salve o orçamento antes de imprimir.');
      return;
    }
    try {
      const resp = await fetch(`${API_BASE}/${numero}/imprimir`, { credentials: 'include' })
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
  }, [isEditing, numero])

  const handleFaturar = useCallback(async () => {
    if (!isEditing) return;
    const tipoOrp = watch('TIPO_ORP');
    if (tipoOrp !== 'P') {
      alert('Apenas pedidos confirmados podem ser faturados. Transforme o orçamento em pedido primeiro.');
      return;
    }
    if (!window.confirm('Confirma o faturamento deste pedido? Esta ação gerará a Nota Fiscal.')) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/${numero}/confirmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Pedido faturado com sucesso!\nNota Fiscal: ${data.numeroNota}\nSerie: ${data.serie}`);
        if (data.pdfBase64) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${data.pdfBase64}`;
          link.download = data.pdfFileName || `NF_${data.numeroNota}.pdf`;
          link.click();
        }
      } else {
        setError(data.error || 'Erro ao faturar');
      }
    } catch (err) {
      setError('Erro ao faturar pedido');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [isEditing, numero, watch]);

  const calculateTotais = useCallback((items: ItemOrcamento[]) => {
    let totpec = 0;
    let totser = 0;

    items.forEach(item => {
      if (item.QTPERD_ORPP) return;
      const qtd = Number(item.QTALOC_ORPP) || 0;
      const preco = Number(item.PRECOPUB_ORPP) || 0;
      const desc = Number(item.VLRDESC_ORPP) || 0;
      const total = qtd * preco * (1 - desc / 100);
      if (isNaN(total)) return;
      if (item.TIPO_ITEM === 'S') {
        totser += total;
      } else {
        totpec += total;
      }
    });

    setTotais({
      totpec,
      totser,
      totger: totpec + totser,
    });
  }, []);

  const loadNextNumero = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/numero-next`);
      const data = await response.json();
      if (data.success) {
        // Não populamos mais automaticamente para permitir preenchimento manual
        // setValue('NUMERO_ORP', data.numero);
      }
    } catch (err) {
      console.error('Erro ao carregar número:', err);
    }
  }, [setValue]);

  const loadOrcamento = useCallback(async (num: string | number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/${num}`);
      const data = await response.json();
      if (data.success) {
        const orc = data.data;
        reset(orc);

        if (orc.ITENS || orc.itens) {
          const rawItens = orc.ITENS || orc.itens;
          const itensNormalizados = rawItens.map((item: any) => {
            const normalized: any = {};
            // Garante que todas as chaves fiquem em maiúsculas para o grid
            Object.keys(item).forEach(key => {
              normalized[key.toUpperCase()] = item[key];
            });

            // Tratamento específico para campos que mudaram de nome ou precisam de fallback
            if (!normalized.DESCR_ORPP) normalized.DESCR_ORPP = normalized.DESCRICAO_ORPP || normalized.DESCR_ORP;

            // Reforço total para o campo de Quantidade (QTDE) - Usando QTREC_ORPP conforme solicitado
            normalized.QTREC_ORPP = normalized.QTREC_ORPP ?? normalized.QTALOC_ORPP ?? normalized.QTDE_ORPP ?? normalized.QTDE_ORP ?? normalized.QUANTIDADE ?? 0;
            normalized.QTALOC_ORPP = normalized.QTREC_ORPP; // Mantém sincronizado se necessário

            if (!normalized.PRECOPUB_ORPP) normalized.PRECOPUB_ORPP = normalized.PRECO_ORPP || normalized.PRECO_ORP || normalized.VALOR_UNI;
            if (!normalized.VLRDESC_ORPP) normalized.VLRDESC_ORPP = normalized.VLRDESC_ORP || 0;
            if (!normalized.PRECOTOT_ORPP) normalized.PRECOTOT_ORPP = normalized.PRECOTOT_ORP || normalized.VLRTOTAL_ORP || 0;

            // Define o tipo (Peça ou Serviço) baseado no fabricante ou flag
            normalized.TIPO_ITEM = (normalized.FAB_ORPP === 'S' || normalized.FABRICANTE === 'SERVICO') ? 'S' : 'P';

            return normalized;
          });

          setItens(itensNormalizados);
          if (calculateTotais) calculateTotais(itensNormalizados);
        }
      } else {
        setError('Orçamento não encontrado');
      }
    } catch (err) {
      setError('Erro ao carregar orçamento');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [reset, calculateTotais]);

  const handleClientChange = useCallback(() => {
    console.log('[OrcamentoPage] Mudança de cliente detectada. Limpando itens e código...');
    setItens([]);
    setParcelas([]);
    setTotais({ totpec: 0, totser: 0, totger: 0 });
    
    if (numero !== 'novo') {
      navigate('/vendas/orcamento/novo', { replace: true });
    }
  }, [numero, navigate, setValue]);

  useEffect(() => {
    if (isEditing) {
      loadOrcamento(parseInt(numero));
    } else {
      loadNextNumero();
    }
  }, [isEditing, numero, loadOrcamento, loadNextNumero]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const tipoOrp = watch('TIPO_ORP');
        if (tipoOrp === 'P') {
          handleFaturar();
        } else {
          handleSubmit(onSubmit)();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, onSubmit, handleFaturar, watch]);

  const handleItensChange = useCallback((newItens: ItemOrcamento[]) => {
    setItens(newItens);
    calculateTotais(newItens);
  }, [calculateTotais]);

  const handleRecalcularItensPorNivel = useCallback((percNiv: number) => {
    setItens(prev => {
      const updated = prev.map(item => {
        const baseOriginal = item.VALORAVI_ORPP ?? item.PRECOPUB_ORPP ?? 0;
        const novoPrecoPub = baseOriginal * (1 + percNiv / 100);
        const qtde = item.QTALOC_ORPP ?? item.QTREC_ORPP ?? 0;
        const descPerc = item.VLRDESC_ORPP ?? 0;
        const novoPrecoTot = qtde * novoPrecoPub * (1 - descPerc / 100);
        return {
          ...item,
          VALORAVI_ORPP: baseOriginal,
          PRECOPUB_ORPP: novoPrecoPub,
          PRECOTOT_ORPP: novoPrecoTot,
          PERC_NIVEL_ORPP: percNiv,
          VLR_NIVEL_ORPP: novoPrecoPub,
        };
      });
      calculateTotais(updated);
      return updated;
    });
  }, [calculateTotais]);

  const handleExcluirPerda = useCallback(async () => {
    if (!isEditing || !numero || !perdaMotivo) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/${numero}/marcar-perda?motivo=${encodeURIComponent(perdaMotivo)}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        navigate('/vendas/orcamento/novo');
      } else {
        setError(data.error || 'Erro ao marcar venda perdida');
      }
    } catch (err) {
      setError('Erro ao marcar venda perdida');
      console.error(err);
    } finally {
      setIsSaving(false);
      setShowPerdaModal(false);
    }
  }, [isEditing, numero, perdaMotivo, navigate]);

  const handleReverterPerda = useCallback(async () => {
    if (!isEditing || !numero) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/${numero}/reverter-perda`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        alert(`Perda revertida! ${data.itensRestaurados} item(ns) restaurado(s).`);
        navigate(`/vendas/orcamento/${numero}`, { replace: true });
      } else {
        setError(data.error || 'Erro ao reverter perda');
      }
    } catch (err) {
      setError('Erro ao reverter perda');
      console.error(err);
    } finally {
      setIsSaving(false);
      setShowReverterModal(false);
    }
  }, [isEditing, numero, navigate]);

  const openPerdaModal = useCallback(() => {
    setPerdaMotivo('');
    fetch('/api/tabelas-auxiliares/masper')
      .then(r => r.json())
      .then((data: any) => {
        const list = data?.rows ?? (Array.isArray(data) ? data : []);
        setMasperList(list);
      })
      .catch(() => setMasperList([]));
    setShowPerdaModal(true);
  }, []);

  const handleVirarPedido = useCallback(async () => {
    const codCli = watch('CODCLI_ORP');
    if (!codCli || Number(codCli) <= 0) {
      alert('Selecione um cliente antes de virar pedido.');
      return;
    }
    try {
      const response = await fetch(`/api/clientes/${codCli}/limite-disponivel`);
      if (!response.ok) {
        alert('Erro ao consultar o valor disponível do cliente.');
        return;
      }
      const data = await response.json();
      const limite = Number(data.limite_credito || 0);
      const saldoPendente = Number(data.saldo_pendente || 0);
      const disponivel = Number(data.limite_disponivel || 0);
      const valorPedido = totais.totger || 0;

      if (valorPedido > disponivel) {
        setLimiteInfo({
          cliente: watch('NOME_CLI') || '',
          valorPedido,
          limite,
          saldoPendente,
          disponivel,
        });
        setShowLimiteModal(true);
        return;
      }

      setValue('TIPO_ORP', 'P');
    } catch (err) {
      alert('Erro ao consultar o valor disponível do cliente.');
      console.error(err);
    }
  }, [watch, setValue, totais.totger]);

  if (isLoading) {
    return (
      <div className="orcamento-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="orcamento-text-center">
          <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid #e2e8f0', borderTopColor: '#475569', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  const currentStatus = watch('TIPO_ORP');
  const isConfirmado = currentStatus === 'C';
  const statusLabel = currentStatus === 'P' ? 'Pedido' : isConfirmado ? 'Confirmado' : 'Orçamento';

  return (
    <div className="orcamento-page">
      {/* HEADER */}
      <header className="orcamento-header">
        <div className="orcamento-header__title">
          <button
            onClick={() => navigate('/vendas')}
            className="orcamento-btn orcamento-btn--ghost"
            style={{ padding: '0 0.5rem' }}
            title="Voltar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1>{isEditing ? `Venda #${numero}` : 'Novo Atendimento'}</h1>
              <span className={`orcamento-header__badge ${currentStatus === 'P' ? 'orcamento-header__badge--pedido' : isConfirmado ? 'orcamento-header__badge--confirmado' : 'orcamento-header__badge--orcamento'}`}>
                {statusLabel}
              </span>
            </div>
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, marginTop: '0.125rem' }}>
              SPDealer • Módulo de Vendas
            </p>
          </div>
        </div>

        <div className="orcamento-header__actions">
          <button onClick={handleImprimir} className="orcamento-btn orcamento-btn--ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Imprimir
          </button>

          {isEditing && (
            <>
              <button
                onClick={openPerdaModal}
                className="orcamento-btn orcamento-btn--danger"
                disabled={isConfirmado}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Excluir
              </button>
              <button
                onClick={() => setShowReverterModal(true)}
                className="orcamento-btn orcamento-btn--secondary"
                title="Reverter venda perdida"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Reverter
              </button>
            </>
          )}

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || isConfirmado}
            className="orcamento-btn orcamento-btn--primary"
          >
            {isSaving ? (
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            Gravar Alt+S
          </button>
        </div>
      </header>

      {/* TABS */}
      <nav className="orcamento-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`orcamento-tab ${activeTab === tab.id ? 'orcamento-tab--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTEÚDO */}
      <main className="orcamento-content">
        {error && (
          <div style={{ marginBottom: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {activeTab === 'cliente' && (
          <ClienteTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            onSelectOrcamento={(num) => navigate(`/vendas/orcamento/${num}`)}
            onClientChange={handleClientChange}
            readOnly={isConfirmado}
            isEditing={isEditing}
          />
        )}

        {activeTab === 'pecas' && (
          <PecasTab
            itens={itens}
            onItensChange={handleItensChange}
            onTotaisChange={setTotais}
            disabled={isSaving || isConfirmado}
            modeloVeiculo={watch('MODELO_ORP')}
            condPag={watch('CONDPAG_ORP')}
            numero={numero}
            readOnly={isConfirmado}
          />
        )}

        {activeTab === 'dados' && (
          <DadosTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            parcelas={parcelas}
            onParcelasChange={setParcelas}
            totais={totais}
            disabled={isSaving || isConfirmado}
            onNumeroOrcamentoChange={(num) => navigate(`/vendas/orcamento/${num}`)}
            activeTab={activeTab}
            numero={numero}
            itens={itens}
            onRecalcularItensPorNivel={handleRecalcularItensPorNivel}
            onVirarPedido={handleVirarPedido}
          />
        )}

        {activeTab === 'transporte' && (
          <TransporteTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            disabled={isSaving || isConfirmado}
          />
        )}
      </main>

      {/* FOOTER FLUTUANTE */}
      <footer className="orcamento-footer">
        <div className="orcamento-footer__totals">
          <div className="orcamento-footer__total-item">
            <span>Soma de Peças</span>
            <strong>{totais.totpec.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>
          <div style={{ width: '1px', height: '1.25rem', background: '#334155' }} />
          <div className="orcamento-footer__total-item">
            <span>Soma de Serviços</span>
            <strong>{totais.totser.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>
          <div style={{ width: '1px', height: '1.25rem', background: '#334155' }} />
          <div className="orcamento-footer__total-item">
            <span>Itens na Lista</span>
            <strong style={{ color: '#60a5fa' }}>{itens.length}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="orcamento-footer__grand-total">
            <span>Total Geral Líquido</span>
            <strong>{totais.totger.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || isConfirmado}
            className="orcamento-btn orcamento-btn--success"
            style={{ height: '1.75rem', padding: '0 0.75rem', fontSize: '0.5625rem' }}
          >
            {isSaving ? (
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            Concluir e Salvar
          </button>
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {showLimiteModal && limiteInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480,
            padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#dc2626' }}>!</span>
                Valor acima do disponível
              </h3>
              <button onClick={() => setShowLimiteModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Cliente</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{limiteInfo.cliente || '—'}</div>
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.8125rem', color: '#4b5563', lineHeight: 1.6 }}>
              O valor do pedido <strong>{limiteInfo.valorPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> passa do valor disponível de <strong>{limiteInfo.disponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> para este cliente. O orçamento <strong>não</strong> foi convertido em pedido.
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0' }}>
                <span style={{ color: '#64748b' }}>Limite de crédito</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{limiteInfo.limite.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0' }}>
                <span style={{ color: '#64748b' }}>Saldo pendente</span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>{limiteInfo.saldoPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '2px 0' }}>
                <span style={{ color: '#64748b' }}>Valor disponível</span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{limiteInfo.disponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowLimiteModal(false)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 6, border: 'none',
                  background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showPerdaModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480,
            padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#b45309' }}>✕</span>
                Excluir / Venda Perdida
              </h3>
              <button onClick={() => setShowPerdaModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Orçamento / Pedido</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>#{numero} — {itens.length} item(ns)</div>
              <div style={{ fontSize: '0.6875rem', color: '#b45309', marginTop: 4 }}>O orçamento será marcado como venda perdida. Registros não serão excluídos.</div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Motivo da Perda</label>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, maxHeight: 160, overflow: 'auto' }}>
                {masperList.length === 0 ? (
                  <div style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Nenhum motivo disponível</div>
                ) : masperList.map((m: any, idx: number) => {
                  const cod = String(m.codigo_mper ?? m.codigo ?? m.CODIGO_MPER ?? m.CODIGO ?? '').trim();
                  const isSelected = perdaMotivo === cod;
                  return (
                    <div
                      key={idx}
                      onClick={() => setPerdaMotivo(cod)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        background: isSelected ? '#eff6ff' : 'transparent',
                        color: isSelected ? '#2563eb' : '#1e293b',
                        borderBottom: '1px solid #f1f5f9',
                        fontWeight: isSelected ? 700 : 400
                      }}
                    >
                      {m.descr_mper || m.descricao || m.DESCR_MPER || 'Sem descrição'}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowPerdaModal(false)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirPerda}
                disabled={!perdaMotivo}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 6, border: 'none',
                  background: perdaMotivo ? '#b45309' : '#e2e8f0',
                  color: '#fff', fontWeight: 600, cursor: perdaMotivo ? 'pointer' : 'default',
                  fontSize: '0.8125rem', opacity: perdaMotivo ? 1 : 0.5
                }}
              >
                Confirmar Perda
              </button>
            </div>
          </div>
        </div>
      )}

      {showReverterModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480,
            padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Reverter Venda Perdida
              </h3>
              <button onClick={() => setShowReverterModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Orçamento / Pedido</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>#{numero} — {itens.length} item(ns)</div>
              <div style={{ fontSize: '0.6875rem', color: '#2563eb', marginTop: 4 }}>Os itens marcados como venda perdida serão restaurados e a alocação no estoque será reajustada.</div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowReverterModal(false)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReverterPerda}
                disabled={isSaving}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 6, border: 'none',
                  background: '#2563eb',
                  color: '#fff', fontWeight: 600, cursor: 'pointer',
                  fontSize: '0.8125rem'
                }}
              >
                {isSaving ? 'Revertendo...' : 'Confirmar Reversão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}













