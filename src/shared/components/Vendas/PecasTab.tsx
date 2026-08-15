import React, { useState, useCallback, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ItemOrcamento } from './OrcamentoTypes';
import Localizar from 'components/Localizar';
import ImageGalleryModal from 'components/Estoque/ImageGalleryModal';
import './OrcamentoForm.css';

interface PecasTabProps {
  itens: ItemOrcamento[];
  onItensChange: (itens: ItemOrcamento[]) => void;
  onTotaisChange: (totais: { totpec: number; totser: number; totger: number }) => void;
  disabled?: boolean;
  modeloVeiculo?: string;
  condPag?: string;
  numero?: string;
  readOnly?: boolean;
}

interface ProductLookup {
  CODIGO: string;
  DESCRICAO: string;
  PRECO_VENDA: number;
  ESTOQUE: number;
  CODFAB: string;
  IPI?: number;
  CUSTO?: number;
  LOCACAO?: number;
}

interface PrecoNivel {
  nivel: string;
  valor: number;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const PecasTab: React.FC<PecasTabProps> = ({
  itens,
  onItensChange,
  onTotaisChange,
  disabled = false,
  modeloVeiculo,
  condPag,
  numero,
  readOnly = false
}) => {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const itensRef = useRef(itens);
  itensRef.current = itens;
  const onItensChangeRef = useRef(onItensChange);
  onItensChangeRef.current = onItensChange;

  const [searchItem, setSearchItem] = useState<Partial<ItemOrcamento>>({
    QTALOC_ORPP: 1,
    VLRDESC_ORPP: 0,
    PRECOPUB_ORPP: 0,
    TIPO_ITEM: 'P',
  });

  const [productResults, setProductResults] = useState<ProductLookup[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalData, setModalData] = useState<any[]>([]);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  const [showReparoModal, setShowReparoModal] = useState(false);
  const [reparoData, setReparoData] = useState<any[]>([]);
  const [isLoadingReparo, setIsLoadingReparo] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingGrupo, setPendingGrupo] = useState<any>(null);

  const [showSelecaoItensModal, setShowSelecaoItensModal] = useState(false);
  const [grupoItensData, setGrupoItensData] = useState<any[]>([]);
  const [isLoadingGrupoItens, setIsLoadingGrupoItens] = useState(false);
  const [selectedItensParaImportacao, setSelectedItensParaImportacao] = useState<any[]>([]);

  const [codigoBloqueado, setCodigoBloqueado] = useState(false);

  const [niveisConfig, setNiveisConfig] = useState<any[]>([]);
  const [niveisPreco, setNiveisPreco] = useState<PrecoNivel[]>([]);
  const [maspagMap, setMaspagMap] = useState<Record<string, number>>({});

  const [precoSugeridoInfo, setPrecoSugeridoInfo] = useState<any>(null);
  const [showPrecoSugeridoModal, setShowPrecoSugeridoModal] = useState(false);
  const [calculatingPrecoSugerido, setCalculatingPrecoSugerido] = useState(false);
  const [precoSugeridoMap, setPrecoSugeridoMap] = useState<Record<string, any>>({});

  const [showVendaPerdidaModal, setShowVendaPerdidaModal] = useState(false);
  const [vendaPerdidaItem, setVendaPerdidaItem] = useState<ItemOrcamento | null>(null);
  const [vendaPerdidaQtde, setVendaPerdidaQtde] = useState(0);
  const [vendaPerdidaMotivo, setVendaPerdidaMotivo] = useState('');
  const [masperList, setMasperList] = useState<any[]>([]);
  const [isLoadingMasper, setIsLoadingMasper] = useState(false);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageItem, setImageItem] = useState<ItemOrcamento | null>(null);

  const [showDuplicadoModal, setShowDuplicadoModal] = useState(false);
  const [duplicadoItemInfo, setDuplicadoItemInfo] = useState<{ codigo: string; descricao: string } | null>(null);

  // Carrega os níveis de preço da tabela masniv
  React.useEffect(() => {
    fetch('/api/v1/niveis-preco?size=100')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setNiveisConfig(res.data);
          // Inicializa o grid de níveis vazio
          setNiveisPreco(res.data.map((n: any) => ({
            nivel: n.descr_niv,
            valor: 0
          })));
        }
      })
      .catch(err => console.error('Erro ao carregar níveis:', err));
  }, []);

  // Carrega condições de pagamento para mapear codigo_paga → nivel_paga
  React.useEffect(() => {
    fetch('/api/maspag')
      .then(res => res.json())
      .then((data: any[]) => {
        const map: Record<string, number> = {};
        data.forEach((item: any) => {
          map[String(item.codigo)] = Number(item.nivel_paga);
        });
        setMaspagMap(map);
      })
      .catch(err => console.error('Erro ao carregar maspag:', err));
  }, []);

  // Reseta os campos de busca e níveis quando os itens são limpos (novo registro)
  React.useEffect(() => {
    if (itens.length === 0) {
      setSearchItem({
        QTALOC_ORPP: 1,
        VLRDESC_ORPP: 0,
        PRECOPUB_ORPP: 0,
        TIPO_ITEM: 'P',
      });
      if (niveisConfig.length > 0) {
        setNiveisPreco(niveisConfig.map((n: any) => ({
          nivel: n.descr_niv,
          valor: 0
        })));
      }
      setCodigoBloqueado(false);
      setPrecoSugeridoInfo(null);
      setPrecoSugeridoMap({});
    }
  }, [itens.length, niveisConfig]);

  const columnDefs: ColDef[] = useMemo(() => [
    { field: 'FAB_ORPP', headerName: 'Fab.', width: 6 },
    { field: 'CODIGO_ORPP', headerName: 'cod.prod', width: 156 },
    { field: 'DESCR_ORPP', headerName: 'descrição', flex: 0.7, minWidth: 175 },
    { 
      field: 'PRECOPUB_ORPP', 
      headerName: 'valor uni', 
      width: 150, 
      type: 'numericColumn',
      valueFormatter: params => formatCurrency(params.value),
      cellRenderer: (params: any) => {
        const abaixoSugerido = params.data?._abaixoSugerido;
        const precoSugerido = params.data?._precoSugerido;
        return (
          <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end'}}>
            <span>{formatCurrency(params.value)}</span>
            {abaixoSugerido && (
              <span
                style={{color:'#eab308',cursor:'pointer',fontSize:14}}
                title={`Preço abaixo do sugerido (R$ ${(precoSugerido ?? 0).toLocaleString('pt-BR',{minimumFractionDigits:2})})`}
              >⚠</span>
            )}
          </div>
        );
      }
    },
    { field: 'VLRDESC_ORPP', headerName: '%desc', width: 90, type: 'numericColumn' },
    { field: 'QTREC_ORPP', headerName: 'QTDE', width: 90, type: 'numericColumn', editable: true },
    { 
      field: 'PRECOTOT_ORPP', 
      headerName: 'valor total', 
      width: 140, 
      type: 'numericColumn',
      valueFormatter: params => formatCurrency(params.value)
    },
    {
        headerName: 'Ações',
        width: 160,
        pinned: 'right',
        cellRenderer: (params: any) => (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <button 
                onClick={() => {
                    if (disabled) return;
                    const newItens = itens.filter((_, idx) => idx !== params.node.rowIndex);
                    onItensChange(newItens);
                }}
                disabled={disabled}
                className="orcamento-btn orcamento-btn--danger"
                title="Excluir item"
                style={{ 
                    padding: '0', 
                    height: '24px', 
                    width: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    flexShrink: 0
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
            <button 
                onClick={() => {
                    if (disabled) return;
                    const item = itens[params.node.rowIndex];
                    setImageItem(item);
                    setShowImageModal(true);
                }}
                disabled={disabled}
                className="orcamento-btn orcamento-btn--primary"
                title="Imagens do produto"
                style={{ 
                    padding: '0', 
                    height: '24px', 
                    width: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    flexShrink: 0
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                </svg>
            </button>
            <button 
                onClick={() => {
                    if (disabled) return;
                    const item = itens[params.node.rowIndex];
                    setIsLoadingMasper(true);
                    fetch('/api/tabelas-auxiliares/masper')
                        .then(r => r.json())
                        .then((data: any) => {
                            const list = data?.rows ?? (Array.isArray(data) ? data : []);
                            setMasperList(list);
                            setIsLoadingMasper(false);
                        })
                        .catch(() => { setMasperList([]); setIsLoadingMasper(false); });
                    setVendaPerdidaItem(item);
                    setVendaPerdidaQtde(item.QTREC_ORPP || 0);
                    setVendaPerdidaMotivo('');
                    setShowVendaPerdidaModal(true);
                }}
                disabled={disabled}
                className="orcamento-btn"
                title="Venda Perdida"
                style={{ 
                    padding: '0', 
                    height: '24px', 
                    width: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#fef3c7',
                    color: '#b45309',
                    border: 'none',
                    borderRadius: '4px',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    flexShrink: 0
                }}
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </button>
          </div>
        )
    }
  ], [itens, onItensChange, disabled]);

  const handleSearchProduct = useCallback((term: string) => {
    if (disabled) return;
    if (!term || term.length < 2) {
      setProductResults([]);
      setShowResults(false);
      return;
    }

    const tipo = searchItem.TIPO_ITEM || 'P';
    let endpoint = '';
    if (tipo === 'S') {
      endpoint = `/api/servico/manutencao/tipo-tmo?term=${encodeURIComponent(term)}`;
    } else {
      endpoint = `/api/v1/produtos/lookup?term=${encodeURIComponent(term)}`;
    }
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        const list = data.slice(0, 10);
        setProductResults(list);
        setShowResults(list.length > 0);
      })
      .catch(err => console.error('Erro na busca:', err));
  }, [searchItem.TIPO_ITEM, disabled]);

  const openItemModal = useCallback(async () => {
    if (disabled) return;
    setIsLoadingModal(true);
    setShowItemModal(true);
    try {
      const tipo = searchItem.TIPO_ITEM || 'P';
      let endpoint = '';
      if (tipo === 'S') {
        endpoint = '/api/servico/manutencao/tipo-tmo'; // Full list or lookup
      } else {
        endpoint = '/api/v1/produtos/lookup?size=5000'; // Larger set for modal
      }
      const response = await fetch(endpoint);
      const result = await response.json();
      
      // Adapt result based on endpoint structure
      const data = Array.isArray(result) ? result : (result.data || []);
      setModalData(data);
    } catch (error) {
      console.error('Erro ao carregar dados para o modal:', error);
    } finally {
      setIsLoadingModal(false);
    }
  }, [searchItem.TIPO_ITEM, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'F4') {
      e.preventDefault();
      openItemModal();
    }
  };

  interface TmoLookup {
    codmo_tmo: string;
    descr_tmo: string;
    valor_tmo?: number;
  }

  const selectProduct = (p: ProductLookup | TmoLookup) => {
    if (disabled) return;
    const tipo = searchItem.TIPO_ITEM || 'P';
    const basePrice = tipo === 'S' ? (p as TmoLookup).valor_tmo || 0 : (p as ProductLookup).PRECO_VENDA;

    if (tipo === 'S') {
      const tmo = p as TmoLookup;
      setSearchItem({
        ...searchItem,
        CODIGO_ORPP: tmo.codmo_tmo,
        DESCR_ORPP: tmo.descr_tmo,
        PRECOPUB_ORPP: tmo.valor_tmo || 0,
        VALORAVI_ORPP: tmo.valor_tmo || 0,
        QTALOC_ORPP: 1,
        QTREC_ORPP: 1,
        VLRDESC_ORPP: 0,
        PRECOTOT_ORPP: tmo.valor_tmo || 0,
        TIPO_ITEM: 'S',
        FAB_ORPP: 'S',
      });
    } else {
      const prod = p as ProductLookup;
      setSearchItem({
        ...searchItem,
        CODIGO_ORPP: prod.CODIGO,
        DESCR_ORPP: prod.DESCRICAO,
        PRECOPUB_ORPP: prod.PRECO_VENDA,
        VALORAVI_ORPP: prod.PRECO_VENDA,
        ESTOQUE_ORPP: prod.ESTOQUE,
        FAB_ORPP: prod.CODFAB,
        QTALOC_ORPP: 1,
        QTREC_ORPP: 1,
        VLRDESC_ORPP: 0,
        PRECOTOT_ORPP: prod.PRECO_VENDA,
        TIPO_ITEM: 'P',
      });
    }

    // Calcula os níveis dinamicamente baseados na tabela masniv
    const novosNiveis = niveisConfig.map(n => ({
      nivel: n.descr_niv,
      valor: basePrice * (1 + (Number(n.perc_niv || 0) / 100))
    }));
    setNiveisPreco(novosNiveis);

    setShowResults(false);
    setTimeout(() => {
      setShowItemModal(false);
    }, 100);
    setCodigoBloqueado(true);

    // Busca preço sugerido baseado na margem
    if (tipo === 'P') {
      setCalculatingPrecoSugerido(true);
      const prod = p as ProductLookup;
      fetch('/api/v1/produtos/calcular-preco-sugerido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fab: prod.CODFAB,
          codigo: prod.CODIGO,
          precoInformado: basePrice,
          deposito: 1
        })
      })
        .then(res => res.json())
        .then(data => {
          setPrecoSugeridoInfo(data);
          if (data && data.success) {
            const key = prod.CODFAB + '_' + prod.CODIGO;
            setPrecoSugeridoMap(prev => ({ ...prev, [key]: data }));
          }
        })
        .catch(() => setPrecoSugeridoInfo(null))
        .finally(() => setCalculatingPrecoSugerido(false));
    }

    codeInputRef.current?.focus();
  };

  const productColumns: ColDef[] = [
    { field: 'fab', headerName: 'Fabricante', width: 10 },
    { field: 'codigo', headerName: 'Código', width: 120 },
    { field: 'descricao', headerName: 'Descrição', flex: 1.3 },
    { field: 'preco_pub', headerName: 'Preço', width: 120, valueFormatter: p => formatCurrency(p.value), cellStyle: { textAlign: 'right' } },
    { field: 'estoque', headerName: 'Estoque', width: 100, cellStyle: { textAlign: 'center' } }
  ];

  const tmoColumns: ColDef[] = [
    { field: 'codmo_tmo', headerName: 'Código', width: 120 },
    { field: 'descr_tmo', headerName: 'Descrição', flex: 1 },
    { field: 'prcpub_tmo', headerName: 'Valor', width: 120, valueFormatter: p => formatCurrency(p.value) }
  ];

  const selecaoColumns: ColDef[] = useMemo(() => [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      maxWidth: 50,
      pinned: 'left',
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
    },
    { field: 'rep_codprod', headerName: 'Código', width: 130 },
    { field: 'rep_descricao', headerName: 'Descrição', flex: 1.5, valueGetter: (params: any) => params.data.descricao || params.data.rep_descricao },
    { field: 'rep_tipo', headerName: 'Tipo', width: 80, valueFormatter: (params: any) => params.value === 'S' ? 'Serviço' : 'Peça' },
    { 
      field: 'rep_qtde', 
      headerName: 'Quantidade', 
      width: 100, 
      type: 'numericColumn',
      valueFormatter: (params: any) => (Number(params.value || 0) / 10000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    },
    { 
      field: 'preco', 
      headerName: 'Preço', 
      width: 110, 
      type: 'numericColumn',
      valueFormatter: (params: any) => formatCurrency(params.value)
    },
    { 
      field: 'estoque_atual', 
      headerName: 'Estoque', 
      width: 100, 
      type: 'numericColumn',
      valueFormatter: (params: any) => Number(params.value || 0).toLocaleString('pt-BR')
    }
  ], []);

  const selecaoGridOptions = useMemo(() => ({
    onFirstDataRendered: (params: any) => {
      params.api.selectAll();
    },
    onRowDataChanged: (params: any) => {
      params.api.selectAll();
    }
  }), []);

  const reparoColumns: ColDef[] = [
    { field: 'rep_codigo', headerName: 'Cód. Reparo', width: 120, editable: false },
    { field: 'rep_descricao', headerName: 'Descrição', flex: 1, editable: false },
    { field: 'rep_tipo', headerName: 'Tipo', width: 100, editable: false },
  ];

  const openReparoModal = useCallback(async () => {
    if (!modeloVeiculo) return;
    setIsLoadingReparo(true);
    setShowReparoModal(true);
    try {
      // Busca apenas registros 01 para o modelo do veículo
      const response = await fetch(`/api/refatorado/reparo/importar-grupo?modelo=${encodeURIComponent(modeloVeiculo)}`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      setReparoData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar grupos de reparo:', error);
      setReparoData([]);
    } finally {
      setIsLoadingReparo(false);
    }
  }, [modeloVeiculo]);

  const handleGrupoSelected = useCallback(async (grupo: any) => {
    if (disabled) return;
    setPendingGrupo(grupo);
    setIsLoadingGrupoItens(true);
    setShowReparoModal(false);
    setShowSelecaoItensModal(true);
    try {
      const response = await fetch(`/api/refatorado/reparo/itens-grupo?codigo=${encodeURIComponent(grupo.rep_codigo)}&modelo=${encodeURIComponent(grupo.rep_modelo)}`);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setGrupoItensData(list);
      setSelectedItensParaImportacao(list);
    } catch (error) {
      console.error('Erro ao buscar itens do grupo:', error);
      setGrupoItensData([]);
      setSelectedItensParaImportacao([]);
      alert('Erro ao carregar itens do grupo de reparo.');
    } finally {
      setIsLoadingGrupoItens(false);
    }
  }, [disabled]);

  const handleShowConfirm = useCallback((grupo: any) => {
    if (disabled) return;
    setPendingGrupo(grupo);
    setShowConfirmModal(true);
  }, [disabled]);

  const executarImportacao = useCallback(() => {
    if (!pendingGrupo || disabled) return;
    
    setShowConfirmModal(false);
    try {
      const itensNovos = selectedItensParaImportacao.map((r: any, idx: number) => {
        // Formatação da quantidade (5 antes, 4 depois da vírgula conforme exemplo 000010000 -> 1)
        const qtdeFormatada = Number(r.rep_qtde || 0) / 10000 || 1;
        
        return {
          CODIGO_ORPP: r.rep_codprod,
          DESCR_ORPP: r.descricao || r.rep_descricao,
          QTALOC_ORPP: qtdeFormatada,
          QTREC_ORPP: qtdeFormatada,
          PRECOPUB_ORPP: Number(r.preco || 0),
          VLRDESC_ORPP: 0,
          PRECOTOT_ORPP: qtdeFormatada * Number(r.preco || 0),
          TIPO_ITEM: r.rep_tipo || 'P',
          FAB_ORPP: r.rep_fab || '',
          ESTOQUE_ORPP: Number(r.estoque_atual || 0),
          SEQ_ORPP: itens.length + idx + 1
        } as any;
      });

      if (itensNovos.length > 0) {
        onItensChange([...itens, ...itensNovos]);
        setShowSelecaoItensModal(false);
        setPendingGrupo(null);
        setGrupoItensData([]);
        setSelectedItensParaImportacao([]);
      } else {
        alert('Este grupo não possui itens selecionados.');
      }
    } catch (error) {
      console.error('Erro ao importar grupo:', error);
      alert('Erro ao importar itens do grupo de reparo.');
    }
  }, [itens, onItensChange, disabled, pendingGrupo, selectedItensParaImportacao]);

  const addItem = () => {
    if (disabled || !searchItem.CODIGO_ORPP) return;

    const tipo = searchItem.TIPO_ITEM || 'P';

    const fab = tipo === 'S' ? 'S' : (searchItem.FAB_ORPP || '');
    const codigo = searchItem.CODIGO_ORPP || '';

    if (fab || codigo) {
      const duplicado = itensRef.current.find(i => (i.FAB_ORPP || '') === fab && (i.CODIGO_ORPP || '') === codigo);
      if (duplicado) {
        setDuplicadoItemInfo({ codigo: codigo, descricao: duplicado.DESCR_ORPP || '' });
        setShowDuplicadoModal(true);
        return;
      }
    }

    // Busca o nivel_paga da condição de pagamento (codigo_paga → nivel_paga)
    // Normaliza a chave: "001" → "1" pois maspagMap usa o inteiro cru do DB
    const pagKey = condPag ? String(Number(condPag)) : '';
    const nivelPaga = pagKey ? maspagMap[pagKey] : undefined;
    // Encontra o percentual do nível correspondente em niveisConfig
    const nivConfig = nivelPaga ? niveisConfig.find((n: any) => Number(n.nivel_niv) === Number(nivelPaga)) : null;
    const percNiv = nivConfig ? Number(nivConfig.perc_niv || 0) : 0;
    const basePreco = searchItem.PRECOPUB_ORPP || 0;
    const nivelPreco = basePreco * (1 + percNiv / 100);

    const itemKey = (searchItem.FAB_ORPP || '') + '_' + (searchItem.CODIGO_ORPP || '');
    const sugerido = precoSugeridoMap[itemKey];

    const newItem: ItemOrcamento = {
      ...searchItem as ItemOrcamento,
      REQUIS_ORPP: itens.length + 1,
      PRECOPUB_ORPP: nivelPreco,
      PRECOTOT_ORPP: (searchItem.QTALOC_ORPP || 0) * nivelPreco * (1 - (searchItem.VLRDESC_ORPP || 0) / 100),
      PERC_NIVEL_ORPP: percNiv,
      VLR_NIVEL_ORPP: nivelPreco,
      TIPO_ITEM: tipo,
      FAB_ORPP: tipo === 'S' ? 'S' : (searchItem.FAB_ORPP || ''),
      _precoSugerido: sugerido?.precoSugerido ?? null,
      _abaixoSugerido: sugerido?.precoSugerido != null && nivelPreco <= sugerido.precoSugerido,
    } as any;

    const newItens = [...itens, newItem];
    onItensChange(newItens);

    setSearchItem({ QTALOC_ORPP: 1, VLRDESC_ORPP: 0, PRECOPUB_ORPP: 0, TIPO_ITEM: searchItem.TIPO_ITEM || 'P' });
    setNiveisPreco(niveisPreco.map(n => ({ ...n, valor: 0 })));
    setCodigoBloqueado(false);
    codeInputRef.current?.focus();
  };

  const handleCellValueChanged = useCallback((params: any) => {
    if (params.colDef.field !== 'QTREC_ORPP') return;
    const oldVal = Number(params.oldValue ?? 0);
    const newVal = Number(params.newValue ?? 0);
    if (oldVal === newVal) return;
    const rowIndex = params.node?.rowIndex ?? -1;
    if (rowIndex < 0) return;
    const currentItens = itensRef.current;
    const updated = currentItens.map((item, idx) => {
      if (idx !== rowIndex) return item;
      const precoUni = item.PRECOPUB_ORPP || 0;
      const desc = item.VLRDESC_ORPP || 0;
      return {
        ...item,
        QTREC_ORPP: newVal,
        QTALOC_ORPP: newVal,
        PRECOTOT_ORPP: newVal * precoUni * (1 - desc / 100)
      };
    });
    onItensChangeRef.current(updated);
  }, []);

  const totaisCalculados = useMemo(() => {
    const res = { estoque: 0, falta: 0, serv: 0, total: 0 };
    itens.forEach(i => {
      if (i.QTPERD_ORPP) return;
      res.total += i.PRECOTOT_ORPP || 0;
      if (i.TIPO_ITEM === 'S') res.serv += i.PRECOTOT_ORPP || 0;
      else {
        if ((i.ESTOQUE_ORPP || 0) >= (i.QTALOC_ORPP || 0)) res.estoque += i.PRECOTOT_ORPP || 0;
        else res.falta += i.PRECOTOT_ORPP || 0;
      }
    });
    return res;
  }, [itens]);

  return (
    <div className="orcamento-fade-in">
      <div className="orcamento-layout orcamento-layout--3-1">
        <div className="orcamento-panel">
          <div className="orcamento-panel__header">
            <h3>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Itens do Orçamento
            </h3>
            <button 
              onClick={openItemModal}
              disabled={disabled}
              style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', background: disabled ? '#f1f5f9' : '#fef3c7', color: disabled ? '#94a3b8' : '#b45309', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', border: 'none', cursor: disabled ? 'default' : 'pointer' }}>
              F4: Pesquisa
            </button>
          </div>
          <div className="orcamento-panel__body">
            {showItemModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 1000, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                      Pesquisar {searchItem.TIPO_ITEM === 'S' ? 'Serviços' : 'Peças'}
                    </h3>
                    <button onClick={() => setShowItemModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden', padding: '0.5rem' }}>
                    {isLoadingModal ? (
                      <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>
                    ) : (
                      <Localizar
                        title=""
                        columns={searchItem.TIPO_ITEM === 'S' ? tmoColumns : productColumns}
                        data={modalData}
                        onRowDoubleClicked={(row) => {
                           if (searchItem.TIPO_ITEM === 'S') {
                               selectProduct({
                                 codmo_tmo: row.codmo_tmo,
                                 descr_tmo: row.descr_tmo,
                                 valor_tmo: row.prcpub_tmo
                               });
                             } else {
                               selectProduct({
                                 CODIGO: row.codigo,
                                 DESCRICAO: row.descricao,
                                 PRECO_VENDA: row.preco_pub,
                                 ESTOQUE: row.estoque,
                                 CODFAB: row.fab
                               });
                             }
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {showReparoModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 1000, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                      Importar Grupo de Reparo - {modeloVeiculo}
                    </h3>
                    <button onClick={() => setShowReparoModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden', padding: '0.5rem' }}>
                    {isLoadingReparo ? (
                      <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando Grupos...</div>
                    ) : (
                      <Localizar
                        title=""
                        columns={reparoColumns}
                        data={reparoData}
                        editable={false}
                        rowSelectionMode="singleRow"
                        onRowDoubleClicked={(row) => {
                           handleGrupoSelected(row);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {showSelecaoItensModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', zIndex: 1002,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ background: '#fff', borderRadius: 12, width: '90vw', maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                      Selecionar Itens para Importação - {pendingGrupo?.rep_descricao}
                    </h3>
                    <button onClick={() => { setShowSelecaoItensModal(false); setPendingGrupo(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                    {isLoadingGrupoItens ? (
                      <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando itens...</div>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <Localizar
                          title=""
                          columns={selecaoColumns}
                          data={grupoItensData}
                          editable={false}
                          rowSelectionMode="multiRow"
                          onRowSelected={setSelectedItensParaImportacao}
                          gridOptions={selecaoGridOptions}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', background: '#f8fafc' }}>
                    <button 
                      onClick={() => { setShowSelecaoItensModal(false); setPendingGrupo(null); }}
                      className="orcamento-btn orcamento-btn--secondary"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedItensParaImportacao.length === 0) {
                          alert('Selecione pelo menos um item para importar.');
                          return;
                        }
                        setShowConfirmModal(true);
                      }}
                      className="orcamento-btn orcamento-btn--primary"
                      disabled={selectedItensParaImportacao.length === 0}
                    >
                      Importar Selecionados ({selectedItensParaImportacao.length})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showConfirmModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)', zIndex: 1100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(2px)'
              }}>
                <div style={{ 
                  background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, 
                  padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    background: '#eff6ff', width: 60, height: 60, borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    margin: '0 auto 1.5rem', color: '#3b82f6'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Confirmar Importação</h3>
                  <p style={{ margin: '0 0 2rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    Deseja importar os itens do grupo <br/>
                    <strong>"{pendingGrupo?.rep_descricao}"</strong> <br/>
                    para este orçamento?
                  </p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      style={{ 
                        flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', 
                        background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer' 
                      }}
                    >
                      Não, Cancelar
                    </button>
                    <button 
                      onClick={executarImportacao}
                      style={{ 
                        flex: 1, padding: '0.75rem', borderRadius: 8, border: 'none', 
                        background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' 
                      }}
                    >
                      Sim, Importar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="orcamento-field-grid">
              <div className="orcamento-field orcamento-field--2">
                <label className="orcamento-field__label">Tipo</label>
                <select
                  value={searchItem.TIPO_ITEM || 'P'}
                  disabled={disabled}
                  onChange={(e) => {
                    const tipo = e.target.value as 'P' | 'S';
                    setSearchItem({ ...searchItem, TIPO_ITEM: tipo, CODIGO_ORPP: '', DESCR_ORPP: '', PRECOPUB_ORPP: 0 });
                    setProductResults([]);
                    setShowResults(false);
                    setCodigoBloqueado(false);
                    codeInputRef.current?.focus();
                  }}
                  className={`orcamento-field__select ${disabled ? 'orcamento-field__input--readonly' : ''}`}
                >
                  <option value="P">P - Peça</option>
                  <option value="S">S - Serviço</option>
                </select>
              </div>

              <div className="orcamento-field orcamento-field--2 orcamento-relative">
                <label className="orcamento-field__label">Código</label>
                <input
                  type="text"
                  ref={codeInputRef}
                  disabled={disabled || codigoBloqueado}
                  value={searchItem.CODIGO_ORPP || ''}
                  onChange={(e) => setSearchItem({ ...searchItem, CODIGO_ORPP: e.target.value })}
                  onBlur={() => {
                    if (searchItem.CODIGO_ORPP && searchItem.CODIGO_ORPP.length >= 2 && !codigoBloqueado) {
                      handleSearchProduct(searchItem.CODIGO_ORPP);
                    }
                  }}
                  onKeyDown={(e) => {
                    handleKeyDown(e);
                    if (e.key === 'Enter' && searchItem.CODIGO_ORPP && searchItem.CODIGO_ORPP.length >= 2 && !codigoBloqueado) {
                      e.preventDefault();
                      handleSearchProduct(searchItem.CODIGO_ORPP);
                    }
                  }}
                  className={`orcamento-field__input orcamento-field__input--highlight ${disabled || codigoBloqueado ? 'orcamento-field__input--readonly' : ''}`}
                />
                {showResults && productResults.length > 0 && !disabled && (
                  <div className="orcamento-dropdown">
                    {productResults.map(p => (
                      <button key={p.CODIGO} onClick={() => selectProduct(p)} className="orcamento-dropdown__item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div className="orcamento-dropdown__item-title">{p.CODIGO}</div>
                          <div className="orcamento-dropdown__item-subtitle">{p.DESCRICAO}</div>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>{formatCurrency(p.PRECO_VENDA)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="orcamento-field orcamento-field--6">
                <label className="orcamento-field__label">Descrição</label>
                <input type="text" readOnly value={searchItem.DESCR_ORPP || ''} className="orcamento-field__input orcamento-field__input--readonly" />
              </div>

              <div className="orcamento-field orcamento-field--2">
                <label className="orcamento-field__label">
                  Preço Público
                  {calculatingPrecoSugerido && <span style={{ marginLeft: 6, fontSize: '0.5625rem', color: '#64748b' }}>calculando...</span>}
                </label>
                <div className="orcamento-price-warning">
                  <input type="text" readOnly value={formatCurrency(searchItem.PRECOPUB_ORPP)} className="orcamento-field__input orcamento-field__input--readonly orcamento-text-right" style={{ flex: 1 }} />
                  {precoSugeridoInfo?.abaixo && (
                    <span
                      className="orcamento-price-warning__icon"
                      onClick={() => setShowPrecoSugeridoModal(true)}
                      title="Preço abaixo do sugerido — clique para detalhes"
                    >
                      ⚠
                    </span>
                  )}
                </div>
              </div>

              <div className={searchItem.TIPO_ITEM === 'S' ? "orcamento-field orcamento-field--3" : "orcamento-field orcamento-field--1"}>
                <label className="orcamento-field__label">
                  {searchItem.TIPO_ITEM === 'S' ? 'Horas' : 'Qtde'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={disabled}
                  value={searchItem.QTALOC_ORPP || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSearchItem({ ...searchItem, QTALOC_ORPP: val, QTREC_ORPP: val });
                  }}
                  className={`orcamento-field__input orcamento-text-center ${disabled ? 'orcamento-field__input--readonly' : ''}`}
                />
              </div>

              <div className="orcamento-field orcamento-field--1">
                <label className="orcamento-field__label">Desc %</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={searchItem.VLRDESC_ORPP || ''}
                  onChange={(e) => setSearchItem({ ...searchItem, VLRDESC_ORPP: Number(e.target.value) })}
                  className={`orcamento-field__input orcamento-text-center ${disabled ? 'orcamento-field__input--readonly' : ''}`}
                />
              </div>

              {searchItem.TIPO_ITEM !== 'S' && (
                <div className="orcamento-field orcamento-field--1">
                  <label className="orcamento-field__label">Estq.</label>
                  <input type="text" readOnly value={searchItem.ESTOQUE_ORPP || 0} className="orcamento-field__input orcamento-field__input--readonly orcamento-text-center" />
                </div>
              )}

              <div className="orcamento-field orcamento-field--12" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!searchItem.CODIGO_ORPP || disabled}
                  className="orcamento-btn orcamento-btn--secondary"
                  style={{ flex: 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Confirmar Item
                </button>
                <button
                  type="button"
                  onClick={openReparoModal}
                  className="orcamento-btn orcamento-btn--ghost"
                  style={{ flex: 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Importar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="orcamento-panel" style={{ maxHeight: '220px', display: 'flex', flexDirection: 'column' }}>
          <div className="orcamento-panel__header">
            <h2>Níveis de Preço</h2>
          </div>
          <div className="orcamento-panel__body" style={{ flex: 1, padding: '0', overflow: 'auto' }}>
            <table className="orcamento-price-table">
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                  <th style={{ whiteSpace: 'nowrap' }}>Nível</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {niveisPreco.map((n, idx) => (
                  <tr key={idx}>
                    <td style={{ whiteSpace: 'nowrap' }}>{n.nivel}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(n.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="orcamento-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '280px' }}>
        <div className="orcamento-panel__header">
          <h2>Itens Registrados no Orçamento</h2>
          <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            {itens.length} ITENS
          </span>
        </div>
        <div className="ag-theme-alpine" style={{ height: '560px', width: '100%', marginTop: '0.5rem' }}>
          <AgGridReact
            theme="legacy"
            rowData={itens.filter(i => !i.QTPERD_ORPP)}
            columnDefs={columnDefs.map(col => ({ ...col, minWidth: 120 }))}
            defaultColDef={{ resizable: true, sortable: true }}
            overlayNoRowsTemplate="<span class='ag-overlay-loading-center'>Nenhum item registrado no orçamento</span>"
            onCellValueChanged={handleCellValueChanged}
          />
        </div>

        <div style={{ background: '#0f172a', padding: '0.25rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div className="orcamento-flex orcamento-gap-3 orcamento-items-center">
            <div className="orcamento-footer__total-item">
              <span>Em Estoque</span>
              <strong style={{ color: '#fff' }}>{formatCurrency(totaisCalculados.estoque)}</strong>
            </div>
            <div style={{ width: '1px', height: '1.25rem', background: '#334155' }} />
            <div className="orcamento-footer__total-item">
              <span style={{ color: '#f87171' }}>Em Falta</span>
              <strong style={{ color: '#f87171' }}>{formatCurrency(totaisCalculados.falta)}</strong>
            </div>
            <div style={{ width: '1px', height: '1.25rem', background: '#334155' }} />
            <div className="orcamento-footer__total-item">
              <span style={{ color: '#60a5fa' }}>Serviços</span>
              <strong style={{ color: '#60a5fa' }}>{formatCurrency(totaisCalculados.serv)}</strong>
            </div>
          </div>
          <div className="orcamento-text-right">
            <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Total</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#4ade80', lineHeight: 1.1, margin: 0 }}>{formatCurrency(totaisCalculados.total)}</p>
          </div>
        </div>
      </div>

      {showPrecoSugeridoModal && precoSugeridoInfo && (
        <div className="orcamento-preco-modal-overlay" onClick={() => setShowPrecoSugeridoModal(false)}>
          <div className="orcamento-preco-modal" onClick={e => e.stopPropagation()}>
            <div className="orcamento-preco-modal__header">
              <h3>
                <span style={{ color: '#eab308' }}>⚠</span>
                Detalhamento do Preço Sugerido
              </h3>
              <button className="orcamento-preco-modal__close" onClick={() => setShowPrecoSugeridoModal(false)}>×</button>
            </div>
            <div className="orcamento-preco-modal__body">
              <div className="orcamento-preco-modal__section-title">Resumo</div>
              <div className={`orcamento-preco-modal__row ${precoSugeridoInfo.abaixo ? 'orcamento-preco-modal__row--danger' : 'orcamento-preco-modal__row--success'}`}>
                <span className="orcamento-preco-modal__row-label">Preço Informado</span>
                <span className="orcamento-preco-modal__row-value">{formatCurrency(precoSugeridoInfo.precoInformado)}</span>
              </div>
              <div className="orcamento-preco-modal__row">
                <span className="orcamento-preco-modal__row-label">Preço Sugerido</span>
                <span className="orcamento-preco-modal__row-value">{formatCurrency(precoSugeridoInfo.precoSugerido)}</span>
              </div>
              <div className={`orcamento-preco-modal__row ${precoSugeridoInfo.abaixo ? 'orcamento-preco-modal__row--danger' : 'orcamento-preco-modal__row--success'}`}>
                <span className="orcamento-preco-modal__row-label">Diferença</span>
                <span className="orcamento-preco-modal__row-value">
                  {precoSugeridoInfo.diferenca >= 0
                    ? `- ${formatCurrency(precoSugeridoInfo.diferenca)}`
                    : `+ ${formatCurrency(Math.abs(precoSugeridoInfo.diferenca))}`}
                </span>
              </div>
              <div className="orcamento-preco-modal__row">
                <span className="orcamento-preco-modal__row-label">Preço de Custo</span>
                <span className="orcamento-preco-modal__row-value">{formatCurrency(precoSugeridoInfo.precoCusto)}</span>
              </div>
              <div className="orcamento-preco-modal__row">
                <span className="orcamento-preco-modal__row-label">Margem Aplicada</span>
                <span className="orcamento-preco-modal__row-value">{precoSugeridoInfo.margemAplicada}%</span>
              </div>
              <div className="orcamento-preco-modal__row">
                <span className="orcamento-preco-modal__row-label">Origem da Margem</span>
                <span className="orcamento-preco-modal__row-value" style={{ fontSize: '0.6875rem' }}>{precoSugeridoInfo.origemMargem}</span>
              </div>
              <div className="orcamento-preco-modal__row">
                <span className="orcamento-preco-modal__row-label">Tipo de Preço</span>
                <span className="orcamento-preco-modal__row-value">{precoSugeridoInfo.tipoPreco}</span>
              </div>

              {precoSugeridoInfo.detalhes && precoSugeridoInfo.detalhes.length > 0 && (
                <>
                  <div className="orcamento-preco-modal__divider" />
                  <div className="orcamento-preco-modal__section-title">Detalhes do Cálculo</div>
                  {precoSugeridoInfo.detalhes.map((d: string, i: number) => (
                    <div key={i} className="orcamento-preco-modal__detalhe">{d}</div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showImageModal && imageItem && (
        <ImageGalleryModal
          fab_est={imageItem.FAB_ORPP || ''}
          codprod_est={imageItem.CODIGO_ORPP || ''}
          onClose={() => { setShowImageModal(false); setImageItem(null); }}
          readOnly
        />
      )}

      {showDuplicadoModal && duplicadoItemInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420,
            padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#eab308' }}>!</span>
                Item já cadastrado
              </h3>
              <button onClick={() => { setShowDuplicadoModal(false); setDuplicadoItemInfo(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Item</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                {duplicadoItemInfo.codigo} - {duplicadoItemInfo.descricao}
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#4b5563', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Este item já foi adicionado ao orçamento. Para alterar a quantidade, dê um duplo clique no campo QTDE no grid de itens.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button
                onClick={() => { setShowDuplicadoModal(false); setDuplicadoItemInfo(null); }}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 6, border: 'none',
                  background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem'
                }}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {showVendaPerdidaModal && vendaPerdidaItem && (
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
                Venda Perdida
              </h3>
              <button onClick={() => setShowVendaPerdidaModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Item</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{vendaPerdidaItem.CODIGO_ORPP} - {vendaPerdidaItem.DESCR_ORPP}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Motivo da Perda</label>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, maxHeight: 160, overflow: 'auto' }}>
                {isLoadingMasper ? (
                  <div style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Carregando motivos...</div>
                ) : masperList.length === 0 ? (
                  <div style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>Nenhum motivo disponível</div>
                ) : masperList.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setVendaPerdidaMotivo(String(m.codigo || m.codigo_mper))}
                    style={{
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      background: vendaPerdidaMotivo === String(m.codigo || m.codigo_mper) ? '#eff6ff' : 'transparent',
                      color: vendaPerdidaMotivo === String(m.codigo || m.codigo_mper) ? '#2563eb' : '#1e293b',
                      borderBottom: '1px solid #f1f5f9',
                      fontWeight: vendaPerdidaMotivo === String(m.codigo || m.codigo_mper) ? 700 : 400
                    }}
                  >
                    {m.descricao || m.descr_mper || 'Sem descrição'}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Quantidade Perdida</label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={vendaPerdidaItem.QTREC_ORPP || 0}
                value={vendaPerdidaQtde}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const max = vendaPerdidaItem.QTREC_ORPP || 0;
                  setVendaPerdidaQtde(val > max ? max : val < 0 ? 0 : val);
                }}
                style={{
                  width: '100%', padding: '8px 12px', border: '2px solid #e5e7eb', borderRadius: 6,
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: 4 }}>
                Máximo: {(vendaPerdidaItem.QTREC_ORPP || 0).toLocaleString('pt-BR')} (Qtde. Registrada)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <button
                onClick={() => setShowVendaPerdidaModal(false)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#64748b', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!vendaPerdidaItem || !vendaPerdidaMotivo) return;
                  const updated = itens.map(item => {
                    const isTarget = (item.REQUIS_ORPP && vendaPerdidaItem.REQUIS_ORPP)
                      ? String(item.REQUIS_ORPP) === String(vendaPerdidaItem.REQUIS_ORPP)
                      : item === vendaPerdidaItem;
                    return isTarget
                      ? { ...item, QTPERD_ORPP: vendaPerdidaQtde, CODIGO_MPER: vendaPerdidaMotivo, MOTIVO_ORPP: vendaPerdidaMotivo }
                      : item;
                  });
                  onItensChange(updated);
                  setShowVendaPerdidaModal(false);
                  const apiBase = '/api/v1/orcamentos';
                  if (numero && numero !== 'novo') {
                    try {
                      await fetch(`${apiBase}/${numero}/itens/${vendaPerdidaItem.REQUIS_ORPP}/marcar-perda`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ motivo: vendaPerdidaMotivo, filial: 1 })
                      });
                    } catch (err) {
                      console.error('Erro ao registrar perda no backend:', err);
                    }
                  }
                }}
                disabled={!vendaPerdidaMotivo || readOnly}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 6, border: 'none',
                  background: vendaPerdidaMotivo ? '#b45309' : '#e2e8f0',
                  color: '#fff', fontWeight: 600, cursor: vendaPerdidaMotivo ? 'pointer' : 'default',
                  fontSize: '0.8125rem', opacity: vendaPerdidaMotivo ? 1 : 0.5
                }}
              >
                Confirmar Perda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PecasTab;
