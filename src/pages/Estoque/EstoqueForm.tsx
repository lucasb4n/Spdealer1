import React, { useState, useMemo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTrash } from '@fortawesome/free-solid-svg-icons';
import SearchableSelect from 'components/SearchableSelect';
import ImageGalleryModal from 'components/Estoque/ImageGalleryModal';
import './EstoqueForm.css';
import 'components/SearchableSelect/SearchableSelect.css';

interface EstoqueFormProps {
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  initialData?: Partial<FormData>;
}

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

const EstoqueForm: React.FC<EstoqueFormProps> = ({ onSave, onCancel, isEditing, initialData }) => {
  const procedenciaMap = useMemo(() => ({
    '0': 'Nacional, Exceto as indicadas nos códigos 3 a 5',
    '1': 'Estrangeira - Importação Direta, exceto a indicada no código 6',
    '2': 'Estrangeira - Adquirida no mercado interno, exceto a indicada no código 7',
    '3': 'Nacional, mercadoria ou bem com Conteúdo de Importação superior a 40%',
    '4': 'Nacional, cuja produção tenha sido feita em conformidade com os processos produtivos básicos de que tratam as legislação citada nos Ajustes',
    '5': 'Nacional, mercadoria ou bem com Conteúdo de importação inferior ou igual a 40%',
    '6': 'Estrangeira - importação direta, sem similar nacional, constante em lista da CAMEX',
    '7': 'Estrangeira - Adquirida no mercado interno, sem similar nacional, constante em lista da CAMEX',
    '8': 'Nacional, mercadoria ou bem com Conteúdo de Importação inferior ou igual a 70%',
  }), []);

  const [form, setForm] = useState<FormData>({
    deposito_est: '',
    fab_est: '',
    codprod_est: '',
    locac_kar: '',
    descr_est: '',
    referencia_est: '',
    codfis_est: '',
    codtribicms_est: '',
    ipi_est: '0',
    grupofab_est: '',
    ean_est: '',
    sigla_est: '',
    catitem_est: '',
    unimed_est: '',
    peso_est: '',
    natureza_est: '',
    tipofreq_kar: '',
    codesc_kar: 'N',
    modmaqui_est: '',
    grfuncao_est: '',
    estini_est: 'N',
    procedencia_est: '',
    anp_est: '',
    descranp_est: '',
    fabcorr_est1: '',
    fabcorr_est2: '',
    fabcorr_est3: '',
    fabcorr_est4: '',
    mascorr_est1: '',
    mascorr_est2: '',
    mascorr_est3: '',
    mascorr_est4: '',
    desccorr_est1: '',
    desccorr_est2: '',
    desccorr_est3: '',
    desccorr_est4: '',
    precorep_kar: '',
    precopub_kar: '',
    precogar_kar: '',
    percsug_kar: '',
    precodol_kar: 'N',
    precusto_kar: '',
    codpco_kar: 'N',
    tabela_kar: 'N',
    estmin_kar: '',
    estmax_kar: '',
    estmind_kar: '',
    reserva_est: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'preco'>('dados');

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCatChange = (index: 1 | 2 | 3 | 4, val: string) => {
    setForm(prev => {
      const next = { ...prev };
      if (index === 1) {
        next.fabcorr_est1 = val;
        next.mascorr_est1 = '';
        next.desccorr_est1 = '';
      } else if (index === 2) {
        next.fabcorr_est2 = val;
        next.mascorr_est2 = '';
        next.desccorr_est2 = '';
      } else if (index === 3) {
        next.fabcorr_est3 = val;
        next.mascorr_est3 = '';
        next.desccorr_est3 = '';
      } else if (index === 4) {
        next.fabcorr_est4 = val;
        next.mascorr_est4 = '';
        next.desccorr_est4 = '';
      }
      return next;
    });
  };

  const handleCodeChange = (index: 1 | 2 | 3 | 4, code: string, desc: string) => {
    setForm(prev => {
      const next = { ...prev };
      if (index === 1) {
        next.mascorr_est1 = code;
        next.desccorr_est1 = desc;
      } else if (index === 2) {
        next.mascorr_est2 = code;
        next.desccorr_est2 = desc;
      } else if (index === 3) {
        next.mascorr_est3 = code;
        next.desccorr_est3 = desc;
      } else if (index === 4) {
        next.mascorr_est4 = code;
        next.desccorr_est4 = desc;
      }
      return next;
    });
  };

  const handleClearRow = (index: 1 | 2 | 3 | 4) => {
    setForm(prev => {
      const next = { ...prev };
      if (index === 1) {
        next.fabcorr_est1 = '';
        next.mascorr_est1 = '';
        next.desccorr_est1 = '';
      } else if (index === 2) {
        next.fabcorr_est2 = '';
        next.mascorr_est2 = '';
        next.desccorr_est2 = '';
      } else if (index === 3) {
        next.fabcorr_est3 = '';
        next.mascorr_est3 = '';
        next.desccorr_est3 = '';
      } else if (index === 4) {
        next.fabcorr_est4 = '';
        next.mascorr_est4 = '';
        next.desccorr_est4 = '';
      }
      return next;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.fab_est || !form.codprod_est) {
      setError('Os campos Código e Produto são obrigatórios.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let url = '/api/estoque/cadastro';
      let method = 'POST';
      if (isEditing) {
        url = `/api/estoque/cadastro/${encodeURIComponent(form.fab_est)}/${encodeURIComponent(form.codprod_est)}`;
        method = 'PUT';
      }
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (resp.ok) {
        onSave();
      } else {
        const err = await resp.json();
        setError(err.error || 'Erro ao salvar produto');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="estoque-form">
      <div className="sp-card">
        <div className="sp-card__header">
          <h3>Dados do Produto</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="sp-btn sp-btn--secondary"
              onClick={onCancel}
            >
              Voltar
            </button>
            <button
              type="button"
              className="sp-btn sp-btn--primary"
              onClick={() => setShowImageModal(true)}
            >
              <FontAwesomeIcon icon={faCamera} />
              Imagem
            </button>
          </div>
        </div>
        <div className="sp-card__body">
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <div className="estoque-form-grid">
              <div className="sp-field sp-field--local">
                <label className="sp-field__label">Local</label>
                <input
                  className="sp-field__input"
                  value={form.deposito_est}
                  onChange={e => handleChange('deposito_est', e.target.value)}
                  placeholder="Depósito"
                  disabled={isEditing}
                />
              </div>
              <div className="sp-field sp-field--codigo">
                <label className="sp-field__label">Cat.</label>
                <input
                  className="sp-field__input"
                  value={form.fab_est}
                  onChange={e => handleChange('fab_est', e.target.value)}
                  placeholder="Cat."
                  disabled={isEditing}
                />
              </div>
              <div className="sp-field sp-field--produto">
                <label className="sp-field__label">Código</label>
                <input
                  className="sp-field__input"
                  value={form.codprod_est}
                  onChange={e => handleChange('codprod_est', e.target.value)}
                  placeholder="Código"
                  disabled={isEditing}
                />
              </div>
              <div className="sp-field sp-field--locacao">
                <label className="sp-field__label">Locação</label>
                <input
                  className="sp-field__input"
                  value={form.locac_kar}
                  onChange={e => handleChange('locac_kar', e.target.value)}
                  placeholder="Locação"
                />
              </div>
              <div className="sp-field sp-field--descricao">
                <label className="sp-field__label">Descrição Produto</label>
                <input
                  className="sp-field__input"
                  value={form.descr_est}
                  onChange={e => handleChange('descr_est', e.target.value)}
                  placeholder="Descrição do produto"
                />
              </div>
              <div className="sp-field sp-field--referencia">
                <label className="sp-field__label">Referência Fábrica/fornecedor</label>
                <input
                  className="sp-field__input"
                  value={form.referencia_est}
                  onChange={e => handleChange('referencia_est', e.target.value)}
                  placeholder="Referência"
                />
              </div>
            </div>

            <div className="sp-tabs" style={{ marginTop: 16 }}>
              <nav className="sp-tabs__nav">
                <button
                  type="button"
                  className={`sp-tabs__btn ${activeTab === 'dados' ? 'sp-tabs__btn--active' : ''}`}
                  onClick={() => setActiveTab('dados')}
                >Dados</button>
                <button
                  type="button"
                  className={`sp-tabs__btn ${activeTab === 'preco' ? 'sp-tabs__btn--active' : ''}`}
                  onClick={() => setActiveTab('preco')}
                >Preço</button>
              </nav>
            </div>

            {activeTab === 'dados' && (
              <>
            <div className="sp-card" style={{ marginTop: 16 }}>
              <div className="sp-card__header">
                <h3>Classificação Fiscal</h3>
              </div>
              <div className="sp-card__body">
                  <div className="classificacao-grid">
                  <div className="sp-field sp-field--ncm">
                    <label className="sp-field__label">N.C.M</label>
                    <SearchableSelect
                      fetchUrl="/api/cadastro-estoque/classificacao/ncm"
                      valueField="codigo_nbm"
                      displayField="descr_nbm"
                      value={form.codfis_est}
                      onChange={(val) => handleChange('codfis_est', val)}
                      placeholder="Digite para buscar NCM..."
                    />
                  </div>
                  <div className="sp-field sp-field--tributacao">
                    <label className="sp-field__label">Código tributação</label>
                    <SearchableSelect
                      fetchUrl="/api/cadastro-estoque/classificacao/tributacao"
                      valueField="codigo_trib"
                      displayField="descr_trib"
                      value={form.codtribicms_est}
                      onChange={(val) => handleChange('codtribicms_est', val)}
                      placeholder="Digite para buscar..."
                    />
                  </div>
                  <div className="sp-field sp-field--ipi">
                    <label className="sp-field__label">IPI (%)</label>
                    <input
                      className="sp-field__input"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={form.ipi_est}
                      onChange={e => handleChange('ipi_est', e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sp-card" style={{ marginTop: 16 }}>
              <div className="sp-card__header">
                <h3>Dados Específicos</h3>
              </div>
              <div className="sp-card__body">
                <div className="dados-especificos-grid">

                  <div className="sp-field sp-field--grupofab">
                    <label className="sp-field__label">Grupo na Fab/EAN</label>
                    <input
                      className="sp-field__input"
                      maxLength={3}
                      value={form.grupofab_est}
                      onChange={e => handleChange('grupofab_est', e.target.value)}
                      placeholder="000"
                    />
                  </div>

                  

                  <div className="sp-field sp-field--ean">
                    <input
                      className="sp-field__input"
                      maxLength={14}
                      value={form.ean_est}
                      onChange={e => handleChange('ean_est', e.target.value)}
                      placeholder="EAN"
                    />
                  </div>

                  

                  <div className="sp-field sp-field--sigla">
                    <label className="sp-field__label">Sigla</label>
                    <input
                      className="sp-field__input"
                      maxLength={10}
                      value={form.sigla_est}
                      onChange={e => handleChange('sigla_est', e.target.value)}
                      placeholder="Sigla"
                    />
                  </div>

                  

                  <div className="sp-field sp-field--grupo">
                    <label className="sp-field__label">Grupo</label>
                    <SearchableSelect
                      fetchUrl="/api/cadastro-estoque/classificacao/grupo"
                      valueField="codigo_gru"
                      displayField="descr_gru"
                      value={form.catitem_est}
                      onChange={(val) => handleChange('catitem_est', val)}
                      placeholder="Digite para buscar grupo..."
                    />
                  </div>

                  <div className="sp-field sp-field--natureza">
                    <label className="sp-field__label">Natureza do Item</label>
                    <SearchableSelect
                      fetchUrl="/api/cadastro-estoque/classificacao/natureza"
                      valueField="codigo_nat"
                      displayField="descricao_nat"
                      value={form.natureza_est}
                      onChange={(val) => handleChange('natureza_est', val)}
                      placeholder="Digite para buscar natureza..."
                    />
                  </div>

                  <div className="sp-field sp-field--tf">
                    <label className="sp-field__label">TF</label>
                    <select
                      className="sp-field__input"
                      value={form.tipofreq_kar}
                      onChange={e => handleChange('tipofreq_kar', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="1">1 - Frequente</option>
                      <option value="3">3 - Médio</option>
                      <option value="4">4 - Não Comprar</option>
                    </select>
                  </div>

                  <div className="sp-field sp-field--unimed">
                    <label className="sp-field__label">Unidade de Medida</label>
                    <select
                      className="sp-field__input"
                      value={form.unimed_est}
                      onChange={e => handleChange('unimed_est', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="CX">Caixa (CX)</option>
                      <option value="JG">Jogo (JG)</option>
                      <option value="KG">Quilograma (KG)</option>
                      <option value="KT">Kit (KT)</option>
                      <option value="LT">Litro (LT)</option>
                      <option value="MT">Metro (MT)</option>
                      <option value="M2">Metro Quadrado (M2)</option>
                      <option value="M3">Metro Cúbico (M3)</option>
                      <option value="ML">Milheiro (ML)</option>
                      <option value="PC">Peça (PC)</option>
                      <option value="TO">Tonelada (TO)</option>
                      <option value="UN">Unidade (UN)</option>
                    </select>
                  </div>

                  <div className="sp-field sp-field--peso">
                    <label className="sp-field__label">Peso</label>
                    <input
                      className="sp-field__input"
                      type="number"
                      step="0.001"
                      min="0"
                      value={form.peso_est}
                      onChange={e => handleChange('peso_est', e.target.value)}
                      placeholder="0,000"
                    />
                  </div>

                  <div className="sp-field sp-field--estmin-dados">
                    <label className="sp-field__label">Est. Mínimo</label>
                    <input
                      className="sp-field__input"
                      type="number"
                      step="1"
                      min="0"
                      value={form.estmin_kar}
                      onChange={e => handleChange('estmin_kar', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="sp-field sp-field--estmax-dados">
                    <label className="sp-field__label">Est. Máximo</label>
                    <input
                      className="sp-field__input"
                      type="number"
                      step="1"
                      min="0"
                      value={form.estmax_kar}
                      onChange={e => handleChange('estmax_kar', e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  

                  <div className="sp-field sp-field--modelo">
                    <label className="sp-field__label">Modelo</label>
                    <SearchableSelect
                      fetchUrl="/api/cadastro-estoque/classificacao/modelos"
                      valueField="codigo_mod"
                      displayField="modelo_mod"
                      value={form.modmaqui_est}
                      onChange={(val) => handleChange('modmaqui_est', val)}
                      placeholder="Digite para buscar modelo..."
                    />
                  </div>

                  <div className="sp-field sp-field--grfuncao">
                    <label className="sp-field__label">Marca</label>
                    <SearchableSelect
                      fetchUrl="/api/tabelas-auxiliares/fabric"
                      valueField="codigo"
                      displayField="descricao"
                      value={form.grfuncao_est}
                      onChange={(val) => handleChange('grfuncao_est', val)}
                      placeholder="Digite para buscar marca..."
                    />
                  </div>

                  

                  <div className="sp-field sp-field--acesc">
                    <label className="sp-field__label">Aceita Desc.</label>
                    <div className="sp-field__checkbox-wrapper">
                      <input
                        type="checkbox"
                        id="codesc_kar"
                        checked={form.codesc_kar === 'S'}
                        onChange={e => handleChange('codesc_kar', e.target.checked ? 'S' : 'N')}
                      />
                    </div>
                  </div>

                  <div className="sp-field sp-field--estini">
                    <label className="sp-field__label">Estoque Inicial</label>
                    <div className="sp-field__checkbox-wrapper">
                      <input
                        type="checkbox"
                        id="estini_est"
                        checked={form.estini_est === 'S'}
                        onChange={e => handleChange('estini_est', e.target.checked ? 'S' : 'N')}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="sp-card" style={{ marginTop: 16 }}>
              <div className="sp-card__header">
                <h3>Procedência / ANP</h3>
              </div>
              <div className="sp-card__body">
                <div className="procedencia-grid">

                  <div className="sp-field sp-field--procedencia">
                    <label className="sp-field__label">Procedência</label>
                    <select
                      className="sp-field__input"
                      value={form.procedencia_est}
                      onChange={e => handleChange('procedencia_est', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {Object.keys(procedenciaMap).map(k => (
                        <option key={k} value={k}>{k} - {procedenciaMap[k as keyof typeof procedenciaMap]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sp-field sp-field--anp">
                    <label className="sp-field__label">ANP</label>
                    <input
                      className="sp-field__input"
                      maxLength={15}
                      value={form.anp_est}
                      onChange={e => handleChange('anp_est', e.target.value)}
                      placeholder="ANP"
                    />
                  </div>

                  <div className="sp-field sp-field--descranp">
                    <label className="sp-field__label">Descrição ANP</label>
                    <input
                      className="sp-field__input"
                      maxLength={100}
                      value={form.descranp_est}
                      onChange={e => handleChange('descranp_est', e.target.value)}
                      placeholder="Descrição ANP"
                    />
                  </div>

                </div>
              </div>
            </div>

            <div className="sp-card" style={{ marginTop: 16 }}>
              <div className="sp-card__header">
                <h3>Itens Correspondentes</h3>
              </div>
              <div className="sp-card__body">
                <div className="correspondentes-grid">
                  {/* Linha 1 */}
                  <div className="sp-field sp-field--corr-cat">
                    <label className="sp-field__label">Cat.</label>
                    <SearchableSelect
                      fetchUrl="/api/estoque/categorias"
                      valueField="fab_est"
                      displayField="fab_est"
                      value={form.fabcorr_est1}
                      onChange={(val) => handleCatChange(1, val)}
                      placeholder="Buscar Cat..."
                    />
                  </div>
                  <div className="sp-field sp-field--corr-codigo">
                    <label className="sp-field__label">Código</label>
                    <SearchableSelect
                      fetchUrl={`/api/estoque/produtos-por-categoria?fab=${encodeURIComponent(form.fabcorr_est1)}`}
                      valueField="codprod_est"
                      displayField="descr_est"
                      value={form.mascorr_est1}
                      onChange={(code, desc) => handleCodeChange(1, code, desc)}
                      placeholder="Buscar Código..."
                    />
                  </div>
                  <div className="sp-field sp-field--corr-descricao">
                    <label className="sp-field__label">Descrição</label>
                    <input
                      className="sp-field__input"
                      value={form.desccorr_est1}
                      readOnly
                      placeholder="Descrição do item correspondente"
                    />
                  </div>
                  <div className="sp-field sp-field--corr-delete">
                    <label className="sp-field__label">&nbsp;</label>
                    <button
                      type="button"
                      className="sp-btn sp-btn--danger sp-btn--icon-only"
                      onClick={() => handleClearRow(1)}
                      title="Apagar item correspondente"
                      style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}
                    >
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    </button>
                  </div>

                  {/* Linha 2 */}
                  <div className="sp-field sp-field--corr-cat">
                    <label className="sp-field__label">Cat.</label>
                    <SearchableSelect
                      fetchUrl="/api/estoque/categorias"
                      valueField="fab_est"
                      displayField="fab_est"
                      value={form.fabcorr_est2}
                      onChange={(val) => handleCatChange(2, val)}
                      placeholder="Buscar Cat..."
                    />
                  </div>
                  <div className="sp-field sp-field--corr-codigo">
                    <label className="sp-field__label">Código</label>
                    <SearchableSelect
                      fetchUrl={`/api/estoque/produtos-por-categoria?fab=${encodeURIComponent(form.fabcorr_est2)}`}
                      valueField="codprod_est"
                      displayField="descr_est"
                      value={form.mascorr_est2}
                      onChange={(code, desc) => handleCodeChange(2, code, desc)}
                      placeholder="Buscar Código..."
                    />
                  </div>
                  <div className="sp-field sp-field--corr-descricao">
                    <label className="sp-field__label">Descrição</label>
                    <input
                      className="sp-field__input"
                      value={form.desccorr_est2}
                      readOnly
                      placeholder="Descrição do item correspondente"
                    />
                  </div>
                  <div className="sp-field sp-field--corr-delete">
                    <label className="sp-field__label">&nbsp;</label>
                    <button
                      type="button"
                      className="sp-btn sp-btn--danger sp-btn--icon-only"
                      onClick={() => handleClearRow(2)}
                      title="Apagar item correspondente"
                      style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}
                    >
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    </button>
                  </div>

                  {/* Linha 3 */}
                  <div className="sp-field sp-field--corr-cat">
                    <label className="sp-field__label">Cat.</label>
                    <SearchableSelect
                      fetchUrl="/api/estoque/categorias"
                      valueField="fab_est"
                      displayField="fab_est"
                      value={form.fabcorr_est3}
                      onChange={(val) => handleCatChange(3, val)}
                      placeholder="Buscar Cat..."
                    />
                  </div>
                  <div className="sp-field sp-field--corr-codigo">
                    <label className="sp-field__label">Código</label>
                    <SearchableSelect
                      fetchUrl={`/api/estoque/produtos-por-categoria?fab=${encodeURIComponent(form.fabcorr_est3)}`}
                      valueField="codprod_est"
                      displayField="descr_est"
                      value={form.mascorr_est3}
                      onChange={(code, desc) => handleCodeChange(3, code, desc)}
                      placeholder="Buscar Código..."
                    />
                  </div>
                  <div className="sp-field sp-field--corr-descricao">
                    <label className="sp-field__label">Descrição</label>
                    <input
                      className="sp-field__input"
                      value={form.desccorr_est3}
                      readOnly
                      placeholder="Descrição do item correspondente"
                    />
                  </div>
                  <div className="sp-field sp-field--corr-delete">
                    <label className="sp-field__label">&nbsp;</label>
                    <button
                      type="button"
                      className="sp-btn sp-btn--danger sp-btn--icon-only"
                      onClick={() => handleClearRow(3)}
                      title="Apagar item correspondente"
                      style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}
                    >
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    </button>
                  </div>

                  {/* Linha 4 */}
                  <div className="sp-field sp-field--corr-cat">
                    <label className="sp-field__label">Cat.</label>
                    <SearchableSelect
                      fetchUrl="/api/estoque/categorias"
                      valueField="fab_est"
                      displayField="fab_est"
                      value={form.fabcorr_est4}
                      onChange={(val) => handleCatChange(4, val)}
                      placeholder="Buscar Cat..."
                    />
                  </div>
                  <div className="sp-field sp-field--corr-codigo">
                    <label className="sp-field__label">Código</label>
                    <SearchableSelect
                      fetchUrl={`/api/estoque/produtos-por-categoria?fab=${encodeURIComponent(form.fabcorr_est4)}`}
                      valueField="codprod_est"
                      displayField="descr_est"
                      value={form.mascorr_est4}
                      onChange={(code, desc) => handleCodeChange(4, code, desc)}
                      placeholder="Buscar Código..."
                    />
                  </div>
                  <div className="sp-field sp-field--corr-descricao">
                    <label className="sp-field__label">Descrição</label>
                    <input
                      className="sp-field__input"
                      value={form.desccorr_est4}
                      readOnly
                      placeholder="Descrição do item correspondente"
                    />
                  </div>
                  <div className="sp-field sp-field--corr-delete">
                    <label className="sp-field__label">&nbsp;</label>
                    <button
                      type="button"
                      className="sp-btn sp-btn--danger sp-btn--icon-only"
                      onClick={() => handleClearRow(4)}
                      title="Apagar item correspondente"
                      style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}
                    >
                      <FontAwesomeIcon icon={faTrash} size="sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

              </>
            )}

            {activeTab === 'preco' && (
              <div className="preco-grid" style={{ marginTop: 16 }}>

                <div className="sp-field sp-field--precorep">
                  <label className="sp-field__label">Preço Reposição</label>
                  <input className="sp-field__input" type="number" step="0.01" min="0"
                    value={form.precorep_kar}
                    onChange={e => handleChange('precorep_kar', e.target.value)}
                    placeholder="0,00" />
                </div>

                <div className="sp-field sp-field--precopub">
                  <label className="sp-field__label">Preço Venda</label>
                  <input className="sp-field__input" type="number" step="0.01" min="0"
                    value={form.precopub_kar}
                    onChange={e => handleChange('precopub_kar', e.target.value)}
                    placeholder="0,00" />
                </div>

                <div className="sp-field sp-field--precogar">
                  <label className="sp-field__label">Preço Garantia</label>
                  <input className="sp-field__input" type="number" step="0.01" min="0"
                    value={form.precogar_kar}
                    onChange={e => handleChange('precogar_kar', e.target.value)}
                    placeholder="0,00" />
                </div>

                <div className="sp-field sp-field--precusto">
                  <label className="sp-field__label">Preço de Custo</label>
                  <input className="sp-field__input" type="number" step="0.01" min="0"
                    value={form.precusto_kar}
                    onChange={e => handleChange('precusto_kar', e.target.value)}
                    placeholder="0,00"
                    disabled={isEditing} />
                </div>

                <div className="sp-field sp-field--percsug">
                  <label className="sp-field__label">Margem Lucro%</label>
                  <input className="sp-field__input" type="number" step="0.01" min="0"
                    value={form.percsug_kar}
                    onChange={e => handleChange('percsug_kar', e.target.value)}
                    placeholder="0,00" />
                </div>

                <div className="sp-field sp-field--precodol">
                  <label className="sp-field__label">Preço em Dólar</label>
                  <input className="sp-field__input" type="number" step="0.01" min="0"
                    value={form.precodol_kar}
                    onChange={e => handleChange('precodol_kar', e.target.value)}
                    placeholder="0,00" />
                </div>

                <div className="sp-field sp-field--codpco">
                  <label className="sp-field__inline-switch">
                    <span className="sp-field__inline-switch-label">Atualização de preço pela lista não atualizara este item</span>
                    <div className={`sp-field__switch-track ${form.codpco_kar === 'S' ? 'on' : ''}`}>
                      <input type="checkbox"
                        checked={form.codpco_kar === 'S'}
                        onChange={e => handleChange('codpco_kar', e.target.checked ? 'S' : 'N')} />
                      <div className={`sp-field__switch-thumb ${form.codpco_kar === 'S' ? 'on' : ''}`} />
                    </div>
                  </label>
                </div>

                <div className="sp-field sp-field--tabela">
                  <label className="sp-field__inline-switch">
                    <span className="sp-field__inline-switch-label">Não calcular preço de venda (usar o da Tabela de preço)</span>
                    <div className={`sp-field__switch-track ${form.tabela_kar === 'S' ? 'on' : ''}`}>
                      <input type="checkbox"
                        checked={form.tabela_kar === 'S'}
                        onChange={e => handleChange('tabela_kar', e.target.checked ? 'S' : 'N')} />
                      <div className={`sp-field__switch-thumb ${form.tabela_kar === 'S' ? 'on' : ''}`} />
                    </div>
                  </label>
                </div>

                <div className="sp-field sp-field--estmin">
                  <label className="sp-field__label">Estoque mínimo</label>
                  <input className="sp-field__input" type="number" step="1" min="0"
                    value={form.estmin_kar}
                    onChange={e => handleChange('estmin_kar', e.target.value)}
                    placeholder="0" />
                </div>

                <div className="sp-field sp-field--estmax">
                  <label className="sp-field__label">Estoque Maximo</label>
                  <input className="sp-field__input" type="number" step="1" min="0"
                    value={form.estmax_kar}
                    onChange={e => handleChange('estmax_kar', e.target.value)}
                    placeholder="0" />
                </div>

                <div className="sp-field sp-field--estmind">
                  <label className="sp-field__label">Estoque mínimo Informado</label>
                  <input className="sp-field__input" type="number" step="1" min="0"
                    value={form.estmind_kar}
                    onChange={e => handleChange('estmind_kar', e.target.value)}
                    placeholder="0" />
                </div>

                <div className="sp-field sp-field--reserva">
                  <label className="sp-field__label">Reserva Técnica para Oficina</label>
                  <input className="sp-field__input" type="number" step="1" min="0"
                    value={form.reserva_est}
                    onChange={e => handleChange('reserva_est', e.target.value)}
                    placeholder="0" />
                </div>

              </div>
            )}

            {error && <div className="sp-field__error" style={{ marginTop: 12 }}>{error}</div>}

            <div className="estoque-form-actions">
              <button
                type="button"
                className="sp-btn sp-btn--secondary"
                onClick={onCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="sp-btn sp-btn--success"
                disabled={saving}
              >
                {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showImageModal && (
        <ImageGalleryModal
          fab_est={form.fab_est}
          codprod_est={form.codprod_est}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
};

export default EstoqueForm;
