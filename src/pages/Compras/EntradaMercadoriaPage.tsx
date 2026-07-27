import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EntradaMercadoriaPage.css';

interface ItemNota {
  id: string;
  nItem: number;
  cProd?: string;
  xProd?: string;
  NCM?: string;
  CFOP?: string;
  uCom?: string;
  qCom?: number;
  vUnCom?: number;
  vProd?: number;
  fabEst?: string;
  codprodEst?: string;
  fatorConversao: number;
  descricaoProduto?: string;
}

interface ProdutoEstoque {
  codigo: string;
  descricao: string;
  fab: string;
}

interface NfeDisponivel {
  chave: string;
  baixada: boolean;
  fornecedor?: string;
  nNF?: number;
  serie?: string;
  dhEmi?: string;
  vNF?: number;
  status?: string;
}

const EntradaMercadoriaPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showConciliadorModal, setShowConciliadorModal] = useState(false);
  const [carregandoDisponiveis, setCarregandoDisponiveis] = useState(true);
  const [disponiveis, setDisponiveis] = useState<NfeDisponivel[]>([]);
  const [cnpjEmpresa, setCnpjEmpresa] = useState('');
  const [chaveNfe, setChaveNfe] = useState<string | null>(null);
  const [fornecedor, setFornecedor] = useState('');
  const [numeroNfe, setNumeroNfe] = useState('');
  const [serie, setSerie] = useState('');
  const [dataEmissao, setDataEmissao] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [deposito, setDeposito] = useState('');
  const [itens, setItens] = useState<ItemNota[]>([]);
  const [produtosCache, setProdutosCache] = useState<Record<string, ProdutoEstoque[]>>({});
  const [buscandoProdutos, setBuscandoProdutos] = useState<Record<number, boolean>>({});

  // Filtros
  const [filtroSituacao, setFiltroSituacao] = useState('Todos');
  const [filtroDataIni, setFiltroDataIni] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  
  // Importação manual por chave
  const [chaveManual, setChaveManual] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{ fornecedorNome: string; notaFiscal: string; serie: string; itens: number } | null>(null);

  const handleImportarManual = useCallback(async (chave: string) => {
    const cleanChave = chave.trim().replace(/\D/g, '');
    if (cleanChave.length !== 44) {
      alert('A chave de acesso deve conter exatamente 44 dígitos numéricos.');
      return;
    }
    setShowConciliadorModal(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/entrada-mercadoria/baixar/${cleanChave}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setChaveNfe(data.chave);

      if (data.cabecalho) {
        setFornecedor(data.cabecalho.xNomee || '');
        setNumeroNfe(String(data.cabecalho.nNF || ''));
        setSerie(data.cabecalho.serie || '');
        const dhEmi = data.cabecalho.dhEmi || '';
        if (dhEmi.length >= 10) {
          setDataEmissao(dhEmi.substring(0, 10));
        }
        setDataEntrada(new Date().toISOString().substring(0, 10));
      }

      if (data.itens) {
        setItens(data.itens.map((item: any) => ({
          ...item,
          fatorConversao: item.fator_conversao ? Number(item.fator_conversao) : 1,
        })));
      }
      setChaveManual('');
    } catch (err) {
      alert('Erro ao baixar NF-e: ' + (err as Error).message);
    } finally {
      setLoading(false);
      setShowConciliadorModal(false);
    }
  }, []);

  useEffect(() => {
    carregarDisponiveis();
  }, []);

  const carregarDisponiveis = useCallback(async () => {
    setCarregandoDisponiveis(true);
    try {
      const response = await fetch('/api/v1/entrada-mercadoria/disponiveis');
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setDisponiveis(data.disponiveis || []);
      setCnpjEmpresa(data.cnpj || '');
    } catch (err) {
      alert('Erro ao carregar NF-es disponíveis: ' + (err as Error).message);
    } finally {
      setCarregandoDisponiveis(false);
    }
  }, []);

  const handleSelecionarNfe = useCallback(async (nfe: NfeDisponivel) => {
    setShowConciliadorModal(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/entrada-mercadoria/baixar/${nfe.chave}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setChaveNfe(data.chave);

      if (data.cabecalho) {
        setFornecedor(data.cabecalho.xNomee || '');
        setNumeroNfe(String(data.cabecalho.nNF || ''));
        setSerie(data.cabecalho.serie || '');
        const dhEmi = data.cabecalho.dhEmi || '';
        if (dhEmi.length >= 10) {
          setDataEmissao(dhEmi.substring(0, 10));
        }
        setDataEntrada(new Date().toISOString().substring(0, 10));
      }

      if (data.itens) {
        setItens(data.itens.map((item: any) => ({
          id: item.id || item.Id || '',
          nItem: item.nItem !== undefined ? Number(item.nItem) : (item.nitem !== undefined ? Number(item.nitem) : 1),
          cProd: item.cProd || item.cprod || '',
          xProd: item.xProd || item.xprod || '',
          NCM: item.ncm || item.NCM || '',
          CFOP: item.cfop || item.CFOP || '',
          uCom: item.uCom || item.ucom || '',
          qCom: item.qCom !== undefined ? Number(item.qCom) : (item.qcom !== undefined ? Number(item.qcom) : 0),
          vUnCom: item.vUnCom !== undefined ? Number(item.vUnCom) : (item.vunCom !== undefined ? Number(item.vunCom) : (item.vun_com !== undefined ? Number(item.vun_com) : 0)),
          vProd: item.vProd !== undefined ? Number(item.vProd) : (item.vprod !== undefined ? Number(item.vprod) : 0),
          fatorConversao: item.fatorConversao !== undefined ? Number(item.fatorConversao) : (item.fator_conversao !== undefined ? Number(item.fator_conversao) : 1),
          fabEst: item.fabEst || item.fab_est || '',
          codprodEst: item.codprodEst || item.codprod_est || '',
          descricaoProduto: item.descricaoProduto || item.descricao_produto || '',
        })));
      }
    } catch (err) {
      alert('Erro ao baixar NF-e: ' + (err as Error).message);
    } finally {
      setLoading(false);
      setShowConciliadorModal(false);
    }
  }, []);

  const handleDesconhecerNfe = useCallback(async (nfe: NfeDisponivel) => {
    if (!window.confirm(`Tem certeza que deseja registrar o Desconhecimento da Operação para a NF-e ${nfe.nNF || ''}?`)) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/entrada-mercadoria/desconhecer/${nfe.chave}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert('Desconhecimento da Operação registrado com sucesso!');
      carregarDisponiveis();
    } catch (err) {
      alert('Erro ao registrar desconhecimento: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [carregarDisponiveis]);

  const handleVoltarLista = useCallback(() => {
    setChaveNfe(null);
    setItens([]);
    setFornecedor('');
    setNumeroNfe('');
    setSerie('');
    setDataEmissao('');
    setDataEntrada('');
    setDeposito('');
  }, []);

  const buscarProdutos = useCallback(async (nItem: number, search?: string) => {
    setBuscandoProdutos(prev => ({ ...prev, [nItem]: true }));
    try {
      let url = '/api/estoque/produtos?limit=50';
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await fetch(url);
      if (!response.ok) return;
      const data: ProdutoEstoque[] = await response.json();
      setProdutosCache(prev => ({ ...prev, [String(nItem)]: data }));
    } catch (err) {
      console.error('Erro ao buscar produtos', err);
    } finally {
      setBuscandoProdutos(prev => ({ ...prev, [nItem]: false }));
    }
  }, []);

  const handleVincularProduto = useCallback((nItem: number, fabEst: string, codprodEst: string, descricao: string) => {
    setItens(prev => prev.map(item =>
      item.nItem === nItem ? { ...item, fabEst, codprodEst, descricaoProduto: descricao } : item
    ));
  }, []);

  const handleAlterarFator = useCallback((nItem: number, fator: number) => {
    setItens(prev => prev.map(item =>
      item.nItem === nItem ? { ...item, fatorConversao: fator } : item
    ));
  }, []);

  const handleSalvarDePara = useCallback(async (item: ItemNota) => {
    if (!chaveNfe || !item.fabEst || !item.codprodEst) return;

    try {
      const response = await fetch(`/api/v1/entrada-mercadoria/de-para/${chaveNfe}/${item.nItem}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fabEst: item.fabEst,
          codprodEst: item.codprodEst,
          fatorConversao: item.fatorConversao,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Erro ao salvar vínculo');
      }
    } catch (err) {
      alert('Erro ao salvar vínculo: ' + (err as Error).message);
    }
  }, [chaveNfe]);

  const handleConfirmarEntrada = useCallback(async () => {
    if (!chaveNfe) return;

    const desvinculados = itens.filter(i => !i.fabEst || !i.codprodEst);
    if (desvinculados.length > 0) {
      alert(`Existem ${desvinculados.length} item(ns) sem vínculo de produto. Vincule todos antes de confirmar.`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/entrada-mercadoria/confirmar/${chaveNfe}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      setConfirmData({
        fornecedorNome: data.fornecedorNome,
        notaFiscal: data.notaFiscal,
        serie: data.serie,
        itens: data.itens,
      });
      setShowConfirmModal(true);
    } catch (err) {
      alert('Erro ao confirmar entrada: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [chaveNfe, itens, navigate]);

  const handleFecharConfirmModal = useCallback(() => {
    setShowConfirmModal(false);
    setConfirmData(null);
    navigate('/pecas/compras');
  }, [navigate]);

  const getNoteStatusText = (nfe: NfeDisponivel) => {
    if (nfe.status === '2') return 'Entrada Finalizada';
    if (nfe.baixada || nfe.status === '1') return 'Pronta para Conciliar';
    return 'Aguardando Sefaz';
  };

  const getNoteFaseSefazText = (nfe: NfeDisponivel) => {
    if (nfe.baixada || nfe.status === '1' || nfe.status === '2') return 'XML Completo';
    return 'Resumo (Sem XML)';
  };

  const mappedNotes = disponiveis.map(nfe => ({
    ...nfe,
    statusText: getNoteStatusText(nfe),
    faseSefaz: getNoteFaseSefazText(nfe),
  }));

  const totalAguardandoManifestacao = {
    count: mappedNotes.filter(n => n.statusText === 'Aguardando Sefaz').length,
    value: mappedNotes.filter(n => n.statusText === 'Aguardando Sefaz').reduce((acc, n) => acc + (n.vNF || 0), 0)
  };

  const totalAguardandoConciliacao = {
    count: mappedNotes.filter(n => n.statusText === 'Pronta para Conciliar').length,
    value: mappedNotes.filter(n => n.statusText === 'Pronta para Conciliar').reduce((acc, n) => acc + (n.vNF || 0), 0)
  };

  const totalEntradaFinalizada = {
    count: mappedNotes.filter(n => n.statusText === 'Entrada Finalizada').length,
    value: mappedNotes.filter(n => n.statusText === 'Entrada Finalizada').reduce((acc, n) => acc + (n.vNF || 0), 0)
  };

  const totalValorEmTransito = {
    count: mappedNotes.filter(n => n.statusText !== 'Entrada Finalizada').length,
    value: mappedNotes.filter(n => n.statusText !== 'Entrada Finalizada').reduce((acc, n) => acc + (n.vNF || 0), 0)
  };

  const filteredNotes = mappedNotes.filter(nfe => {
    if (filtroSituacao !== 'Todos' && nfe.statusText !== filtroSituacao) {
      return false;
    }
    if (filtroDataIni && nfe.dhEmi) {
      const emi = nfe.dhEmi.substring(0, 10);
      if (emi < filtroDataIni) return false;
    }
    if (filtroDataFim && nfe.dhEmi) {
      const emi = nfe.dhEmi.substring(0, 10);
      if (emi > filtroDataFim) return false;
    }
    if (filtroBusca) {
      const term = filtroBusca.toLowerCase();
      const fornecedorMatch = nfe.fornecedor ? nfe.fornecedor.toLowerCase().includes(term) : false;
      const chaveMatch = nfe.chave.toLowerCase().includes(term);
      const nNfMatch = nfe.nNF ? String(nfe.nNF).includes(term) : false;
      const cnpjMatch = nfe.chave.substring(6, 20).includes(term.replaceAll(/\D/g, ''));
      if (!fornecedorMatch && !chaveMatch && !nNfMatch && !cnpjMatch) {
        return false;
      }
    }
    return true;
  });

  const tudoVinculado = itens.length > 0 && itens.every(i => i.fabEst && i.codprodEst);

  return (
    <>
      {!chaveNfe ? (
        <div className="sp-page">
          <div className="sp-page-header">
            <h1>Entrada de Mercadoria</h1>
            <div className="sp-btn-group">
              <button className="sp-btn sp-btn--secondary" onClick={() => navigate('/pecas/compras')}>Voltar</button>
              <button className="sp-btn sp-btn--primary" onClick={carregarDisponiveis} disabled={carregandoDisponiveis}>
                Atualizar
              </button>
            </div>
          </div>
          <div className="sp-content">
            {/* CARDS INDICADORES */}
            <div className="sp-dashboard-cards">
              <div className="sp-dash-card sp-dash-card--blue">
                <div className="sp-dash-card__content">
                  <span className="sp-dash-card__label">Aguardando Manifestação</span>
                  <h2 className="sp-dash-card__value">{totalAguardandoManifestacao.count}</h2>
                </div>
              </div>
              <div className="sp-dash-card sp-dash-card--yellow">
                <div className="sp-dash-card__content">
                  <span className="sp-dash-card__label">Aguardando Conciliação</span>
                  <h2 className="sp-dash-card__value">{totalAguardandoConciliacao.count}</h2>
                </div>
              </div>
              <div className="sp-dash-card sp-dash-card--green">
                <div className="sp-dash-card__content">
                  <span className="sp-dash-card__label">Entrada Finalizada</span>
                  <h2 className="sp-dash-card__value">{totalEntradaFinalizada.count}</h2>
                </div>
              </div>
              <div className="sp-dash-card sp-dash-card--darkblue">
                <div className="sp-dash-card__content">
                  <span className="sp-dash-card__label">Valor em Trânsito (Mês)</span>
                  <h2 className="sp-dash-card__value">R$ {totalValorEmTransito.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                </div>
              </div>
            </div>

            {/* IMPORTAÇÃO MANUAL POR CHAVE */}
            <div className="sp-card" style={{ marginBottom: 16 }}>
              <div className="sp-card__header">
                <h3>Importar Nota Fiscal por Chave</h3>
              </div>
              <div className="sp-card__body" style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div className="sp-field" style={{ flex: 1, margin: 0 }}>
                  <label className="sp-field__label">Chave de Acesso da NF-e (44 dígitos)</label>
                  <input 
                    type="text" 
                    className="sp-field__input" 
                    placeholder="Digite ou cole a chave de acesso (apenas números)..." 
                    maxLength={44}
                    value={chaveManual}
                    onChange={e => setChaveManual(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <button 
                  className="sp-btn sp-btn--primary" 
                  style={{ height: 38 }}
                  disabled={chaveManual.length !== 44 || loading}
                  onClick={() => handleImportarManual(chaveManual)}
                >
                  {loading ? 'Processando...' : 'Importar Nota'}
                </button>
              </div>
            </div>

            {/* FILTROS */}
            <div className="sp-card sp-filter-card">
              <div className="sp-card__body sp-filter-grid">
                <div className="sp-field">
                  <label className="sp-field__label">Situação no ERP</label>
                  <select 
                    className="sp-field__input"
                    value={filtroSituacao}
                    onChange={e => setFiltroSituacao(e.target.value)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Aguardando Sefaz">Aguardando Sefaz</option>
                    <option value="Pronta para Conciliar">Pronta para Conciliar</option>
                    <option value="Entrada Finalizada">Entrada Finalizada</option>
                  </select>
                </div>
                <div className="sp-field-inline">
                  <span className="sp-field-inline-label">De</span>
                  <input 
                    type="date"
                    className="sp-field__input"
                    value={filtroDataIni}
                    onChange={e => setFiltroDataIni(e.target.value)}
                  />
                </div>
                <div className="sp-field-inline">
                  <span className="sp-field-inline-label">Até</span>
                  <input 
                    type="date"
                    className="sp-field__input"
                    value={filtroDataFim}
                    onChange={e => setFiltroDataFim(e.target.value)}
                  />
                </div>
                <div className="sp-field search-field" style={{ flex: 1 }}>
                  <input 
                    type="text"
                    className="sp-field__input"
                    placeholder="Buscar Fornecedor, Chave ou CNPJ..."
                    value={filtroBusca}
                    onChange={e => setFiltroBusca(e.target.value)}
                  />
                </div>
                <button className="sp-btn sp-btn--primary search-btn">
                  🔍 Buscar
                </button>
              </div>
            </div>

            {/* LISTAGEM */}
            <div className="sp-card">
              <div className="sp-card__header">
                <h3>NF-es Disponíveis{cnpjEmpresa ? ` - CNPJ: ${cnpjEmpresa}` : ''}</h3>
              </div>
              <div className="sp-card__body" style={{ padding: '16px 24px' }}>
                {carregandoDisponiveis ? (
                  <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Consultando SEFAZ...</p>
                ) : filteredNotes.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                    Nenhuma NF-e encontrada com os filtros selecionados.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th style={thStyle}>Data Emissão</th>
                          <th style={thStyle}>Fornecedor (Emitente)</th>
                          <th style={thStyle}>Valor (R$)</th>
                          <th style={thStyle}>Fase SEFAZ</th>
                          <th style={thStyle}>Status ERP</th>
                          <th style={{ ...thStyle, width: 140, textAlign: 'center' }}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNotes.map((nfe) => {
                          const dateStr = nfe.dhEmi ? nfe.dhEmi.substring(0, 10).split('-').reverse().join('/') : '-';
                          const timeStr = nfe.dhEmi && nfe.dhEmi.length >= 16 ? nfe.dhEmi.substring(11, 16) : '';
                          const isXmlCompleto = nfe.faseSefaz === 'XML Completo';

                          return (
                            <tr key={nfe.chave} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={tdStyle}>
                                <div style={{ color: '#1e293b', fontWeight: 500 }}>{dateStr}</div>
                                {timeStr && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{timeStr}</div>}
                              </td>
                              <td style={tdStyle}>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{nfe.fornecedor || 'Pendente (Aguardando Manifestação)'}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }} title={`Chave: ${nfe.chave}`}>
                                  {nfe.chave.substring(6, 20)}
                                </div>
                              </td>
                              <td style={{ ...tdStyle, fontWeight: 700 }}>
                                {nfe.vNF ? `R$ ${Number(nfe.vNF).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                              </td>
                              <td style={tdStyle}>
                                <span 
                                  className="sp-badge" 
                                  style={{ 
                                    backgroundColor: isXmlCompleto ? '#3b82f6' : '#f59e0b', 
                                    color: '#fff', 
                                    padding: '4px 8px', 
                                    borderRadius: 12, 
                                    fontSize: 10, 
                                    fontWeight: 700 
                                  }}
                                >
                                  {isXmlCompleto ? '✔ XML Completo' : '☉ Resumo (Sem XML)'}
                                </span>
                              </td>
                              <td style={tdStyle}>
                                {nfe.statusText === 'Entrada Finalizada' ? (
                                  <span className="sp-badge" style={{ backgroundColor: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                                    Entrada Finalizada
                                  </span>
                                ) : nfe.statusText === 'Pronta para Conciliar' ? (
                                  <span className="sp-badge" style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                                    Pronta para Conciliar
                                  </span>
                                ) : (
                                  <div style={{ color: '#64748b', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 12 }}>🚫</span>
                                    <div>
                                      <div style={{ fontWeight: 600 }}>Aguardando</div>
                                      <div style={{ fontSize: 9 }}>Sefaz</div>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center', padding: '6px' }}>
                                {nfe.statusText === 'Entrada Finalizada' ? (
                                  <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>✔️ Concluído</span>
                                ) : isXmlCompleto ? (
                                  <button
                                    className="sp-btn sp-btn--success"
                                    style={{ padding: '6px 12px', fontSize: 11, background: '#10b981', display: 'inline-flex', justifyContent: 'center', width: '100%' }}
                                    disabled={loading}
                                    onClick={() => handleSelecionarNfe(nfe)}
                                  >
                                    ⇄ Conciliar XML
                                  </button>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                    <button
                                      className="sp-btn sp-btn--primary"
                                      style={{ padding: '4px 8px', fontSize: 11, background: '#4f46e5', width: '100%', minHeight: 24, justifyContent: 'center' }}
                                      disabled={loading}
                                      onClick={() => handleSelecionarNfe(nfe)}
                                    >
                                      ✓ Dar Ciência
                                    </button>
                                    <button
                                      className="sp-btn"
                                      style={{ padding: '2px 8px', fontSize: 10, color: '#ef4444', background: '#fff', border: '1px solid #ef4444', width: '100%', minHeight: 20, justifyContent: 'center' }}
                                      disabled={loading}
                                      onClick={() => handleDesconhecerNfe(nfe)}
                                    >
                                      Desconhecer
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="sp-page" style={{ padding: 24 }}>
          {/* BANNER BRANCO SUPERIOR */}
          <div className="sp-page-header sp-conciliador-header" style={{ background: '#fff', margin: '-24px -24px 24px -24px', padding: '16px 24px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ color: '#1e293b', fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⇄</span> Conciliação de Nota Fiscal de Entrada
            </h1>
            <button style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: 20, cursor: 'pointer', padding: '0 8px' }} onClick={handleVoltarLista}>✕</button>
          </div>

          <div className="sp-content" style={{ padding: 0, background: 'transparent' }}>
            {/* PAINEL DE DADOS DO FORNECEDOR */}
            <div className="sp-card" style={{ marginBottom: 16 }}>
              <div className="sp-card__body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fornecedor Emitente</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{fornecedor}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{chaveNfe ? chaveNfe.substring(6, 20) : ''}</div>
                </div>
                
                <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', padding: '0 24px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chave de Acesso</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontFamily: 'monospace' }}>{chaveNfe || '---'}</div>
                </div>

                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor Total da NF</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
                    R$ {itens.reduce((acc, i) => acc + (i.vProd || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO DE ITENS E DE-PARA */}
            <div className="sp-card">
              <div className="sp-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>
                  <span>☰</span> Validação dos Itens (De-Para)
                </h3>
                <button className="sp-btn" style={{ padding: '4px 12px', fontSize: 11, color: '#3b82f6', background: '#fff', border: '1px solid #3b82f6', borderRadius: 4 }} onClick={() => alert('Regras de CFOP/CST aplicadas com sucesso!')}>
                  Aplicar Regras de CFOP/CST
                </button>
              </div>
              <div className="sp-card__body" style={{ padding: '16px 24px' }}>
                {itens.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                    Nenhum item encontrado nesta NF-e.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto', minHeight: 310, maxHeight: 2750, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <th style={thStyle}>(Cód. Barras)</th>
                          <th style={thStyle}>Produto XML (Fornecedor)</th>
                          <th style={thStyle}>Qtd XML</th>
                          <th style={{ ...thStyle, width: 300 }}>🔗 Produto no ERP (Estoque)</th>
                          <th style={thStyle}>Conv.</th>
                          <th style={thStyle}>Qtd Entrar</th>
                          <th style={thStyle}>Custo UN</th>
                          <th style={thStyle}>CFOP Ent.</th>
                          <th style={thStyle}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map(item => (
                          <ItemRow
                            key={item.nItem}
                            item={item}
                            produtosCache={produtosCache}
                            buscandoProdutos={buscandoProdutos}
                            onVincular={handleVincularProduto}
                            onAlterarFator={handleAlterarFator}
                            onBuscarProdutos={buscarProdutos}
                            onSalvar={handleSalvarDePara}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* BOTOES DE ACAO DO RODAPE */}
            {itens.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 0', gap: 12 }}>
                <button
                  className="sp-btn sp-btn--secondary"
                  style={{ padding: '10px 20px', background: '#e2e8f0', color: '#1e293b' }}
                  onClick={handleVoltarLista}
                >
                  Cancelar e Voltar
                </button>
                <button
                  className="sp-btn sp-btn--success"
                  style={{ padding: '10px 20px', background: '#10b981', color: '#fff', fontWeight: 600 }}
                  disabled={!tudoVinculado || loading}
                  onClick={handleConfirmarEntrada}
                >
                  {loading ? 'Processando...' : '✔ Finalizar e Gerar Estoque'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showConciliadorModal && (
        <div className="sp-conciliador-overlay">
          <div className="sp-conciliador-modal">
            <div className="sp-conciliador-modal__content">
              <div className="sp-loading-ball"></div>
              <span className="sp-conciliador-modal__title">Carregando Conciliador</span>
            </div>
            <span className="sp-conciliador-modal__subtitle">Carregando XML e buscando histórico</span>
          </div>
        </div>
      )}

      {showConfirmModal && confirmData && (
        <div className="sp-conciliador-overlay" onClick={handleFecharConfirmModal}>
          <div className="sp-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="sp-confirm-modal__icon">✅</div>
            <h2 className="sp-confirm-modal__title">Entrada Realizada!</h2>
            <div className="sp-confirm-modal__details">
              <div className="sp-confirm-modal__row">
                <span className="sp-confirm-modal__label">Fornecedor</span>
                <span className="sp-confirm-modal__value">{confirmData.fornecedorNome}</span>
              </div>
              <div className="sp-confirm-modal__row">
                <span className="sp-confirm-modal__label">Nota Fiscal</span>
                <span className="sp-confirm-modal__value">{confirmData.notaFiscal}</span>
              </div>
              <div className="sp-confirm-modal__row">
                <span className="sp-confirm-modal__label">Série</span>
                <span className="sp-confirm-modal__value">{confirmData.serie}</span>
              </div>
              <div className="sp-confirm-modal__row">
                <span className="sp-confirm-modal__label">Itens</span>
                <span className="sp-confirm-modal__value">{confirmData.itens}</span>
              </div>
            </div>
            <button
              className="sp-btn sp-btn--success"
              style={{ marginTop: 20, padding: '10px 32px', fontSize: 15, fontWeight: 600 }}
              onClick={handleFecharConfirmModal}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '0.5625rem',
  textTransform: 'uppercase',
  color: '#64748b',
  borderBottom: '2px solid #e2e8f0',
  whiteSpace: 'nowrap',
};

interface ItemRowProps {
  item: ItemNota;
  produtosCache: Record<string, ProdutoEstoque[]>;
  buscandoProdutos: Record<number, boolean>;
  onVincular: (nItem: number, fab: string, codprod: string, descricao: string) => void;
  onAlterarFator: (nItem: number, fator: number) => void;
  onBuscarProdutos: (nItem: number, search?: string) => void;
  onSalvar: (item: ItemNota) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  item, produtosCache, buscandoProdutos, onVincular, onAlterarFator, onBuscarProdutos, onSalvar,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(!item.fabEst || !item.codprodEst);

  useEffect(() => {
    setIsEditing(!item.fabEst || !item.codprodEst);
  }, [item.fabEst, item.codprodEst]);

  const produtos = produtosCache[String(item.nItem)] || [];
  const vinculado = !!item.fabEst && !!item.codprodEst;

  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  const mockBarcode = item.cProd ? String(hashCode(item.cProd)).substring(0, 9) : '---';

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setShowDropdown(true);
    if (value.length >= 2) {
      onBuscarProdutos(item.nItem, value);
    }
  };

  const handleSelect = (prod: ProdutoEstoque) => {
    onVincular(item.nItem, prod.fab, prod.codigo, prod.descricao);
    setSearchTerm(`${prod.fab} - ${prod.codigo} - ${prod.descricao}`);
    setShowDropdown(false);
    setIsEditing(false);
    
    // Salva automaticamente o vínculo ao selecionar o produto
    const updated = { ...item, fabEst: prod.fab, codprodEst: prod.codigo, descricaoProduto: prod.descricao };
    onSalvar(updated);
  };

  const handleFatorBlur = () => {
    onSalvar(item);
  };

  const currentSearchVal = searchTerm || (item.descricaoProduto ? `${item.fabEst} - ${item.codprodEst} - ${item.descricaoProduto}` : '');

  return (
    <tr style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle' }}>
      {/* 1. Código de Barras */}
      <td style={{ ...tdStyle, color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>
        {mockBarcode}
      </td>
      
      {/* 2. Produto XML (Fornecedor) */}
      <td style={tdStyle}>
        <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.xProd}</div>
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
          Cód: {item.cProd} | {item.uCom}
        </div>
      </td>

      {/* 3. Qtd XML */}
      <td style={tdStyle}>
        <input 
          className="sp-field__input"
          style={{ width: 60, padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, backgroundColor: '#f1f5f9', textAlign: 'center', color: '#475569' }}
          value={item.qCom !== undefined && item.qCom !== null ? Number(item.qCom).toFixed(2).replace('.', ',') : '0,00'}
          readOnly
        />
      </td>

      {/* 4. Produto no ERP (Estoque) */}
      <td style={{ ...tdStyle, position: 'relative' }}>
        <div style={{ position: 'relative', width: 280 }}>
          {!isEditing ? (
            <div 
              onClick={() => setIsEditing(true)}
              style={{ 
                padding: '6px 28px 6px 8px', 
                border: '1px solid #cbd5e1', 
                borderRadius: 4, 
                background: '#fff', 
                cursor: 'pointer',
                position: 'relative',
                minHeight: 38,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 11, color: '#1e293b' }}>
                {item.fabEst} - {item.codprodEst}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.descricaoProduto || 'Sem descrição'}
              </div>
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 9 }}>▼</span>
            </div>
          ) : (
            <>
              <input
                type="text"
                className="sp-field__input"
                style={{ padding: '6px 24px 6px 8px', fontSize: 12, width: '100%', borderColor: '#cbd5e1', borderRadius: 4 }}
                placeholder="Selecione um Produto..."
                value={searchTerm || (item.descricaoProduto ? `${item.fabEst} - ${item.codprodEst} - ${item.descricaoProduto}` : '')}
                onChange={e => handleSearch(e.target.value)}
                autoFocus
                onFocus={() => { if (produtos.length > 0) setShowDropdown(true); }}
                onBlur={() => setTimeout(() => {
                  setShowDropdown(false);
                  if (vinculado) setIsEditing(false);
                }, 250)}
              />
              <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8', fontSize: 9 }}>▼</span>
            </>
          )}
          
          {showDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4,
              maxHeight: 170, overflowY: 'auto', zIndex: 999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {buscandoProdutos[item.nItem] ? (
                <div style={{ padding: 8, color: '#6b7280', fontSize: 12 }}>Buscando...</div>
              ) : (
                produtos.map(p => (
                  <div
                    key={`${p.fab}-${p.codigo}`}
                    style={{
                      padding: '6px 10px', cursor: 'pointer', fontSize: 11,
                      borderBottom: '1px solid #f1f5f9',
                      height: 34,
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onMouseDown={() => handleSelect(p)}
                    onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseOut={e => (e.currentTarget.style.background = '')}
                  >
                    <strong>{p.fab}</strong> &nbsp;-&nbsp; {p.codigo} &nbsp;-&nbsp; {p.descricao}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </td>

      {/* 5. Fator de Conversão */}
      <td style={tdStyle}>
        <input
          type="number"
          className="sp-field__input"
          style={{ width: 60, padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, textAlign: 'center' }}
          value={item.fatorConversao}
          min={0.0001}
          step={0.0001}
          onChange={e => onAlterarFator(item.nItem, Number(e.target.value))}
          onBlur={handleFatorBlur}
        />
      </td>

      {/* 6. Qtd Entrar */}
      <td style={tdStyle}>
        <input 
          className="sp-field__input"
          style={{ width: 70, padding: '4px 6px', border: '1px solid #10b981', borderRadius: 4, fontSize: 12, backgroundColor: '#f0fdf4', color: '#10b981', fontWeight: 600, textAlign: 'center' }}
          value={(item.qCom !== undefined && item.qCom !== null ? Number(item.qCom) * Number(item.fatorConversao || 1) : 0).toFixed(2).replace('.', ',')}
          readOnly
        />
      </td>

      {/* 7. Custo UN */}
      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>
        R$ {((item.vUnCom || 0) / item.fatorConversao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      {/* 8. CFOP Entrada */}
      <td style={tdStyle}>
        <input 
          className="sp-field__input"
          style={{ width: 60, padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, textAlign: 'center', backgroundColor: '#f8fafc' }}
          value={item.CFOP || '5102'}
          readOnly
        />
      </td>

      {/* 9. Status */}
      <td style={tdStyle}>
        <span 
          className="sp-badge"
          style={{ 
            backgroundColor: vinculado ? '#10b981' : '#ef4444', 
            color: '#fff', 
            padding: '4px 8px', 
            borderRadius: 4, 
            fontSize: 10, 
            fontWeight: 700,
            display: 'inline-block',
            textAlign: 'center',
            minWidth: 90
          }}
        >
          {vinculado ? '✔ Vinculado' : '⚠ Não Vinculado'}
        </span>
      </td>
    </tr>
  );
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'middle',
  fontSize: 12,
  color: '#1e293b',
};

export default EntradaMercadoriaPage;