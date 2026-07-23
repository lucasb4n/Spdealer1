import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AgGridReact } from 'ag-grid-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faTrash, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'
// Removed legacy ag-grid.css import to use Theming API
import 'ag-grid-community/styles/ag-theme-alpine.css'
import './aggrid-overrides.css'
import './KardexMovimentoModal.css'
import { ReactComponent as RtcIcon } from 'assets/icons/rtc-calculator.svg'
import KardexMovimentoModal from './KardexMovimentoModal'

interface Props { filters: any; mode?: 'cadastro' | 'consulta'; onTotalsChange?: (totals: { totalProdutos: number; comEstoque: number; valorEstoque: number }) => void }

const ImageCellRenderer = React.memo(({ categoria, produto, onDoubleClick }: { categoria: string; produto: string; onDoubleClick?: (url: string) => void }) => {
  const [hasError, setHasError] = React.useState(false);
  const src = `${process.env.REACT_APP_API_URL || '/api'}/estoque/imagens/produto/${categoria}/${produto}`;

  if (hasError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: 40, margin: '0 auto' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 4,
          background: '#f1f5f9', border: '1px dashed #cbd5e1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#94a3b8'
        }}>
          📷
        </div>
      </div>
    );
  }

  const handleDoubleClick = () => {
    onDoubleClick?.(src);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <img
        src={src}
        alt=""
        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
        onError={() => setHasError(true)}
        onDoubleClick={handleDoubleClick}
        title="Duplo clique para ampliar"
      />
    </div>
  );
});

const AgGridResults = forwardRef(({ filters, mode = 'consulta', onTotalsChange }: Props, ref: any) => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState<any[]>([])
  const [pinnedBottomRow, setPinnedBottomRow] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  // const [footerHeight, setFooterHeight] = useState<number>(56) // Removido: não utilizado
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(null)
  const gridRef = useRef<any>(null)
  const [showInventModal, setShowInventModal] = useState(false)
  const [inventDate, setInventDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressInterval = useRef<any>(null)

  const [showKardexModal, setShowKardexModal] = useState(false)
  const [kardexProduct, setKardexProduct] = useState<any | null>(null)

  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)

  const handleRowDoubleClick = useCallback((params: any) => {
    const data = params?.data
    if (data?.produto && data?.categoria) {
      setKardexProduct({
        fab: data.categoria,
        codprod: data.produto,
        descricao: data.descricao
      })
      setShowKardexModal(true)
    }
  }, [])

  const handleEdit = useCallback((data: any) => {
    if (data?.categoria && data?.produto) {
      navigate(`/pecas/cadastro-estoque/${encodeURIComponent(data.categoria)}/${encodeURIComponent(data.produto)}/edit`)
    }
  }, [navigate])

  const handleDelete = useCallback(async (data: any) => {
    if (!data) return;
    const cat = data.categoria ? String(data.categoria).trim() : '';
    const cod = data.produto ? String(data.produto).trim() : '';
    try {
      const resp = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/cadastro/${encodeURIComponent(cat)}/${encodeURIComponent(cod)}`, {
        method: 'DELETE',
      });
      if (resp.ok) {
        setConfirmDelete(null);
        alert('Produto excluído com sucesso');
        setRowData(prev => prev.filter(r => !(r.categoria === data.categoria && r.produto === data.produto)));
      } else {
        const json = await resp.json().catch(() => ({}));
        setConfirmDelete(null);
        alert(json.error || 'Erro ao excluir produto');
      }
    } catch (err: any) {
      setConfirmDelete(null);
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir produto');
    }
  }, [])

  const [showRtcModal, setShowRtcModal] = useState(false)
  const [rtcRow, setRtcRow] = useState<any | null>(null)
  const [rtcNcmInfo, setRtcNcmInfo] = useState<any | null>(null)
  const [rtcRequestText, setRtcRequestText] = useState<string>('')
  const [rtcResponseText, setRtcResponseText] = useState<string>('')
  const [rtcLoading, setRtcLoading] = useState(false)
  const [rtcError, setRtcError] = useState<string | null>(null)

  const openRtcModal = async (row: any) => {
    try {
      setRtcError(null)
      setRtcResponseText('')
      setRtcNcmInfo(null)
      setRtcRow(row)
      setShowRtcModal(true)

      const codfis = row?.codfis_est ? String(row.codfis_est).trim() : ''

      const basePayload: any = {
        produto: {
          codigo: row?.produto ?? '',
          descricao: row?.descricao ?? '',
          ncm: codfis || null,
          unidade: row?.un_medida ?? row?.unidade ?? null
        },
        operacao: {
          quantidade: 1,
          valorUnitario: row?.preco_pub ?? null,
          valorTotal: row?.preco_pub ?? null
        },
        observacao: 'Ajuste o payload conforme a especificacao RTC (regime-geral)'
      }

      setRtcRequestText(JSON.stringify(basePayload, null, 2))

      if (codfis) {
        const resp = await fetch(`/api/rtc/ncm?codfis=${encodeURIComponent(codfis)}`, { credentials: 'include' })
        if (resp.ok) {
          const json = await resp.json().catch(() => null)
          if (json) setRtcNcmInfo(json)
        }
      }
    } catch (e: any) {
      setRtcError(e?.message || String(e))
    }
  }

  const runRtcCalculo = async () => {
    try {
      setRtcLoading(true)
      setRtcError(null)
      setRtcResponseText('')

      let parsed: any
      try {
        parsed = JSON.parse(rtcRequestText || '{}')
      } catch (e: any) {
        setRtcError('JSON invalido no payload. Verifique e tente novamente.')
        return
      }

      const resp = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/rtc/calculadora/regime-geral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
        credentials: 'include'
      })

      const txt = await resp.text()
      if (!resp.ok) {
        setRtcError(txt || `Erro HTTP ${resp.status}`)
        return
      }

      try {
        const json = JSON.parse(txt)
        setRtcResponseText(JSON.stringify(json, null, 2))
      } catch {
        setRtcResponseText(txt)
      }
    } catch (e: any) {
      setRtcError(e?.message || String(e))
    } finally {
      setRtcLoading(false)
    }
  }

  // Client-side filtering when in 'cadastro' mode because the backend endpoint does not filter.
  const filteredData = React.useMemo(() => {
    if (mode !== 'cadastro') return rowData;
    return rowData.filter(item => {
      // 1. filter by search text (in description or product code)
      if (filters?.search) {
        const s = filters.search.toLowerCase()
        const desc = String(item.descricao || '').toLowerCase()
        const cod = String(item.produto || '').toLowerCase()
        if (!desc.includes(s) && !cod.includes(s)) return false
      }
      // 2. filter by category (fabricante)
      if (filters?.fab && item.categoria !== filters.fab) return false
      // 3. filter by group
      if (filters?.grupo) {
        const itemGroup = String(item.grupo || '').toLowerCase()
        const filterGroup = String(filters.grupo).toLowerCase()
        if (!itemGroup.includes(filterGroup)) return false
      }
      return true
    })
  }, [rowData, filters, mode])

  // 1. Fetch for Cadastro mode (runs only on mount or when mode changes to 'cadastro')
  useEffect(() => {
    if (mode !== 'cadastro') return

    const controller = new AbortController()
    fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/cadastro`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const normalized = data.map((item: any) => ({
            ...item,
            produto: item.codigo || item.produto
          }))
          setRowData(normalized)
          setError(null)
        } else if (data && (data.error || data.message)) {
          setRowData([])
          setError(String(data.error || data.message))
        }
      }).catch(()=>{})

    return ()=> controller.abort()
  }, [mode])

  // 2. Fetch for Consulta mode (runs when filters change)
  useEffect(() => {
    if (mode === 'cadastro') return

    const controller = new AbortController()
    const qs = new URLSearchParams()
    if (filters?.deposito) qs.set('deposito', filters.deposito)
    if (filters?.categoria) qs.set('fab', String(filters.categoria))
    else if (filters?.fab) qs.set('fab', String(filters.fab))
    if (filters?.grupo) qs.set('grupo', String(filters.grupo))
    if (filters?.codprod) qs.set('codprod', filters.codprod)
    if (filters?.search) qs.set('search', filters.search)
    if (filters?.somenteComSaldo !== undefined) qs.set('somenteComSaldo', String(filters.somenteComSaldo))
    if (filters?.semMovimentoDias) qs.set('semMovimentoDias', String(filters.semMovimentoDias))
    qs.set('limit','5000')

    fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/consulta?${qs.toString()}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const normalized = data.map((item: any) => ({
            ...item,
            produto: item.codigo || item.produto
          }))
          setRowData(normalized)
          setError(null)
        } else if (data && (data.error || data.message)) {
          setRowData([])
          setError(String(data.error || data.message))
        }
      }).catch(()=>{})

    return ()=> controller.abort()
  }, [filters, mode])

  const scrollGrid = (direction: 'up' | 'down') => {
    try {
      const api = gridRef?.current?.api
      if (!api) return
      
      const rowCount = api.getDisplayedRowCount()
      if (rowCount === 0) return
      
      let firstVisible = 0
      if (typeof api.getFirstDisplayedRow === 'function') {
        firstVisible = api.getFirstDisplayedRow()
      }
      
      let targetIndex = firstVisible
      if (direction === 'up') {
        targetIndex = Math.max(0, firstVisible - 8)
      } else {
        targetIndex = Math.min(rowCount - 1, firstVisible + 8)
      }
      
      if (typeof api.ensureIndexVisible === 'function') {
        api.ensureIndexVisible(targetIndex, 'top')
      }
    } catch (e) {
      console.error('Erro ao rolar grid:', e)
    }
  }

  useImperativeHandle(ref, () => ({
    highlightProduct: (productCode: string) => {
      try {
        setHighlightedProduct(productCode)
        const api = gridRef?.current?.api
        if (api && typeof api.forEachNode === 'function') {
          let foundIndex: number | null = null
          api.forEachNode((node: any, idx: number) => {
            if (node && node.data && String(node.data.produto) === String(productCode)) {
              foundIndex = node.rowIndex
            }
          })
          if (foundIndex !== null && typeof api.ensureIndexVisible === 'function') {
            api.ensureIndexVisible(foundIndex, 'middle')
            // focus the cell and flash it
            try { api.setFocusedCell(foundIndex, 'produto') } catch(e){}
            try { const node = api.getDisplayedRowAtIndex(foundIndex); if (node) api.flashCells({ rowNodes: [node] }) } catch(e){}
          }
        }
      } catch (e) { /* ignore */ }
    },
    exportCsv: () => {
      exportCsv()
    }
  }))

  // recalcula totais para exibir no rodapé (pinned bottom row)
  const computeTotals = () => {
    try {
      const totals: any = { saldo: 0, custo_uni: 0, custo_total: 0, preco_pub: 0 }
      const api = gridRef?.current?.api
      if (api && typeof api.forEachNodeAfterFilterAndSort === 'function') {
        api.forEachNodeAfterFilterAndSort((node: any) => {
          const r = node?.data || {}
          totals.saldo += Number(r.saldo || 0)
          totals.custo_uni += Number(r.custo_uni || 0)
            totals.custo_total += Number(r.custo_total || 0)
            totals.preco_pub += Number(r.preco_pub || 0)
        })
      } else if (filteredData && filteredData.length) {
        for (const r of filteredData) {
          totals.saldo += Number(r.saldo || 0)
          totals.custo_uni += Number(r.custo_uni || 0)
            totals.custo_total += Number(r.custo_total || 0)
            totals.preco_pub += Number(r.preco_pub || 0)
        }
      }

      setPinnedBottomRow([{
        categoria: '',
        produto: '',
        descricao: 'Total',
        grupo: '',
        saldo: totals.saldo,
        custo_uni: totals.custo_uni,
        custo_total: totals.custo_total,
          preco_pub: totals.preco_pub
      }])
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    computeTotals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData])

  useEffect(() => {
    if (mode !== 'cadastro' || !onTotalsChange) return;
    const data = filteredData;
    const totalProdutos = data.length;
    const comEstoque = data.filter((item: any) => Number(item.saldo || 0) > 0).length;
    const valorEstoque = data.reduce((sum: number, item: any) => sum + (Number(item.saldo || 0) * Number(item.preco_pub || 0)), 0);
    onTotalsChange({ totalProdutos, comEstoque, valorEstoque });
  }, [filteredData, mode, onTotalsChange])

  // Export CSV helper (global header button will call this)
  const exportCsv = () => {
    try {
      const api = gridRef?.current?.api
      if (!api) return alert('Grid não inicializado')
      // build filename from filters
      const parts: string[] = []
      if (filters?.deposito) parts.push(String(filters.deposito))
      if (filters?.fab) parts.push(String(filters.fab))
      if (filters?.grupo) parts.push(String(filters.grupo))
      const suffix = parts.length ? '_' + parts.join('_') : ''
      const fileName = `Estoque${suffix}.csv`
      api.exportDataAsCsv({ fileName, allColumns: true, columnSeparator: ';' })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Erro ao exportar CSV:', e)
      alert('Erro ao exportar CSV')
    }
  }

  // compute footer height dynamically to reserve space for application footer
  useEffect(() => {
    const getFooterHeight = () => {
      try {
        const selectors = ['footer', '#appFooter', '.app-footer', '.footer', '.footer-fixed', '.main-footer']
        for (const s of selectors) {
          const el = document.querySelector(s)
          if (el) return Math.ceil((el as HTMLElement).getBoundingClientRect().height)
        }
        // fallback: find any fixed-bottom element
        const all = Array.from(document.querySelectorAll('body *')) as HTMLElement[]
        for (const el of all) {
          const style = window.getComputedStyle(el)
          if (style.position === 'fixed' && style.bottom !== 'auto' && Number.parseInt(style.bottom) === 0) {
            return Math.ceil(el.getBoundingClientRect().height)
          }
        }
      } catch (e) {
        // ignore
      }
      return 56
    }

    // const compute = () => setFooterHeight(getFooterHeight()) // Removido: setFooterHeight não utilizado
    // compute()
    // window.addEventListener('resize', compute)
    // return () => window.removeEventListener('resize', compute)
  }, [])

  const columnDefs = mode === 'cadastro' ? [
    {
      headerName: 'IMG',
      field: 'imagem',
      width: 64,
      minWidth: 64,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        if (!params.data || params.node?.rowPinned) return null;
        return <ImageCellRenderer categoria={params.data.categoria} produto={params.data.produto} onDoubleClick={(url) => setViewingImageUrl(url)} />;
      }
    },
    {
      headerName: 'Produto',
      field: 'descricao',
      filter: true,
      floatingFilter: true,
      flex: 2,
      minWidth: 200,
      cellRenderer: (params: any) => {
        if (!params.data) return params.value || '';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.2' }}>
            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{params.data.descricao}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Código: {params.data.produto} | {params.data.fab_descricao}</span>
          </div>
        );
      }
    },
    {
      headerName: 'Categoria / Grupo',
      field: 'categoria',
      filter: true,
      floatingFilter: true,
      flex: 1,
      minWidth: 140,
      cellRenderer: (params: any) => {
        if (!params.data || params.node?.rowPinned) return '';
        const groupName = params.data.grupo ? params.data.grupo.split(' - ')[1] || params.data.grupo : 'PEÇAS';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', lineHeight: '1.2', gap: '2px' }}>
            <span className="badge bg-light text-dark" style={{ fontSize: '9px', alignSelf: 'flex-start', padding: '2px 4px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }}>{groupName}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>🏷️ {params.data.categoria}</span>
          </div>
        );
      }
    },
    {
      headerName: 'Preços',
      field: 'preco_pub',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (params: any) => {
        if (params.value == null) return '';
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value);
        return (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <span style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '14px' }}>{formatted}</span>
          </div>
        );
      }
    },
    {
      headerName: 'Estoque',
      field: 'saldo',
      sortable: true,
      filter: true,
      width: 150,
      cellRenderer: (params: any) => {
        if (!params.data || params.node?.rowPinned) return formatNumber(params.value);
        const saldo = Number(params.data.saldo || 0);
        const min = Number(params.data.estmin_kar || params.data.estmin || 1);
        const pct = Math.min(100, Math.max(0, min > 0 ? (saldo / min) * 100 : 100));
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#334155', lineHeight: '1' }}>
              <span>{saldo} un.</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>{pct.toFixed(0)}%</span>
            </div>
            <div className="progress" style={{ height: '4px', marginTop: '4px', backgroundColor: '#e2e8f0' }}>
              <div className="progress-bar bg-success" style={{ width: `${pct}%` }}></div>
            </div>
          </div>
        );
      }
    },
    {
      headerName: 'Ações',
      field: 'acoes',
      width: 100,
      pinned: 'right' as const,
      sortable: false,
      filter: false,
      cellClass: 'text-center',
      cellRenderer: (params: any) => {
        if (params.node?.rowPinned) return null;
        return (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              onClick={() => handleEdit(params.data)}
              title="Editar produto"
            >
              <FontAwesomeIcon icon={faPencil} />
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-danger"
              style={{ padding: '2px 6px', fontSize: '11px' }}
              onClick={() => setConfirmDelete(params.data)}
              title="Excluir produto"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        );
      }
    }
  ] : [
    { field: 'categoria', headerName: 'Categoria', sortable:true, filter:true, floatingFilter: true, width: 52, minWidth: 48 },
    { field: 'produto', headerName: 'Código', sortable:true, filter:true, floatingFilter: true, flex: 1, minWidth: 150 },
    { field: 'descricao', headerName: 'Descrição', filter:true, floatingFilter: true, flex: 1, minWidth: 150 },
    { headerName: 'Referência', field: 'referencia_est', width: 140, valueGetter: (p:any) => {
        const d = p.data || {}
        return d.referencia_est || d.referencia || d.ref || ''
      }
    },
    { headerName: 'Dt Ult Entr.', field: 'dtultent_kar', width: 92, valueGetter: (p:any) => {
        try {
          const d = p.data || {}
          const raw = d.dtultent_kar ?? (d.kardex && d.kardex.dtultent_kar) ?? d.dtultent_kar ?? ''
          if (!raw) return ''
          let s = String(raw).trim().padStart(8, '0')
          return `${s.substring(0, 2)}/${s.substring(2, 4)}/${s.substring(4, 8)}`
        } catch (e) { return '' }
      }, cellClass: 'text-center'
    },
    { headerName: 'Dt Ult Saida', field: 'dtultsai_kar', width: 92, valueGetter: (p:any) => {
        try {
          const d = p.data || {}
          const raw = d.dtultsai_kar ?? (d.kardex && d.kardex.dtultsai_kar) ?? d.dtultsai_kar ?? ''
          if (!raw) return ''
          let s = String(raw).trim().padStart(8, '0')
          return `${s.substring(0, 2)}/${s.substring(2, 4)}/${s.substring(4, 8)}`
        } catch (e) { return '' }
      }, cellClass: 'text-center'
    },
    { field: 'grupo', headerName: 'Grupo', sortable:true, filter:true, width: 180, floatingFilter: true },
    { field: 'saldo', headerName: 'Saldo', valueFormatter: (p:any)=>formatNumber(p.value), cellClass:'text-end', headerClass: 'text-end', filter:true, floatingFilter: true, width: 110 },
    { field: 'alocado', headerName: 'Alocada', valueFormatter: (p:any)=>formatNumber(p.value), cellClass:'text-end', headerClass: 'text-end', filter:true, floatingFilter: true, width: 100 },
    { field: 'custo_uni', headerName: 'Custo Unit.', valueFormatter: (p:any)=>formatNumber(p.value), cellClass:'text-end', headerClass: 'text-end', filter:true, floatingFilter: true, width: 120 },
    { field: 'custo_total', headerName: 'Custo Total', valueFormatter: (p:any)=>formatNumber(p.value), cellClass:'text-end', headerClass: 'text-end', filter:true, floatingFilter: true, width: 140 },
    { field: 'preco_pub', headerName: 'Publico', valueFormatter: (p:any)=>formatNumber(p.value), cellClass:'text-end', headerClass: 'text-end', filter:true, floatingFilter: true, width: 120 },
    { headerName: 'DSM', field: 'dsm', filter: 'agNumberColumnFilter', valueGetter: (p:any) => {
        try {
          const data = p.data || {}
          const rawDms = data.DMS ?? data.dms
          if (rawDms !== undefined && rawDms !== null && rawDms !== '') {
            const n = Number(rawDms)
            if (!isNaN(n)) return n
          }
          const dateVal = data.ult_saida || data.ult_entrada || null
          if (!dateVal) return null
          let s = String(dateVal).trim()
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const dt = new Date(s)
            if (!isNaN(dt.getTime())) return Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24))
            return null
          }
          s = s.padStart(8, '0')
          const dd = parseInt(s.substring(0,2), 10)
          const mm = parseInt(s.substring(2,4), 10)
          const yyyy = parseInt(s.substring(4,8), 10)
          const dt = new Date(yyyy, mm - 1, dd)
          if (isNaN(dt.getTime())) return null
          return Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24))
        } catch (e) { return '' }
      }, valueFormatter: (p:any) => p.value === '' || p.value == null ? '' : String(p.value), cellClass: 'text-end', headerClass: 'text-end', width: 90 },
    {
      headerName: 'Tributos',
      field: 'rtc',
      width: 76,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellClass: 'text-center',
      cellRenderer: (params: any) => (
        params?.node?.rowPinned ? null : (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm rtc-icon-btn"
            onClick={() => openRtcModal(params?.data)}
            title="Calcular tributos (RTC) para este item"
            aria-label="Calcular tributos (RTC) para este item">
            <RtcIcon className="rtc-icon" aria-hidden="true" focusable="false" />
          </button>
        )
      )
    }
  ]

  // Traduções PT-BR para labels e filtros do AG Grid
  const localeText = {
    // Filter panel
    equals: 'Igual',
    notEqual: 'Diferente',
    lessThan: 'Menor que',
    greaterThan: 'Maior que',
    lessThanOrEqual: 'Menor ou igual',
    greaterThanOrEqual: 'Maior ou igual',
    inRange: 'Entre',
    contains: 'Contém',
    notContains: 'Não contém',
    startsWith: 'Começa com',
    endsWith: 'Termina com',
    // Buttons
    applyFilter: 'Aplicar',
    resetFilter: 'Resetar',
    clearFilter: 'Limpar',
    cancelFilter: 'Cancelar',
    // General
    loadingOoo: 'Carregando...',
    noRowsToShow: 'Sem linhas para mostrar',
    // Tool Panel / column menu
    pinColumn: 'Fixar coluna',
    valueAggregation: 'Agregação',
    autosizeThiscolumn: 'Auto-ajustar coluna',
    autosizeAllColumns: 'Auto-ajustar todas as colunas',
    groupBy: 'Agrupar por',
    ungroupBy: 'Desagrupar por',
    resetColumns: 'Resetar colunas',
    expandAll: 'Expandir todos',
    collapseAll: 'Colapsar todos',
    toolPanel: 'Painel de ferramentas',
    export: 'Exportar',
    csvExport: 'Exportar CSV',
    excelExport: 'Exportar Excel (.xlsx)',
    // Set filter
    selectAll: 'Selecionar todos',
    searchOoo: 'Pesquisar...',
    apply: 'Aplicar',
    // pagination
    page: 'Página',
    of: 'de',
    to: 'até',
    more: 'mais'
  }

  function formatNumber(v:any) {
    if (v === null || v === undefined) return '0'
    const n = Number(v)
    if (isNaN(n)) return String(v)
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div>
      {error && <div className="alert alert-warning">Erro: {error}</div>}
      <div className="ag-theme-alpine" style={{ width: '100%', paddingBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
          <div className="text-muted small">Linhas: {filteredData ? filteredData.length : 0}</div>
          <div>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={exportCsv}
              disabled={!filteredData || filteredData.length === 0}
              title="Exportar todos os registros (CSV; ; separador)">
              Exportar CSV
            </button>
          </div>
        </div>
        <AgGridReact
          theme="legacy"
          ref={gridRef}
          rowHeight={60}
          rowData={filteredData}
          localeText={localeText}
          pinnedBottomRowData={pinnedBottomRow}
          rowClassRules={{
            'highlighted-product': (params: any) => {
              try {
                if (!params || !params.data) return false
                return highlightedProduct !== null && String(params.data.produto) === String(highlightedProduct)
              } catch (e) { return false }
            }
          }}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true, sortable: true, filter: true, floatingFilter: true }}
          onRowDoubleClicked={mode === 'consulta' ? handleRowDoubleClick : undefined}
          onFilterChanged={() => computeTotals()}
          onSortChanged={() => computeTotals()}
          pagination={true}
          paginationPageSize={10}
          domLayout="autoHeight"
        />
      </div>
      {showRtcModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tributos (RTC)</h5>
                <button type="button" className="btn-close" onClick={() => setShowRtcModal(false)} disabled={rtcLoading}></button>
              </div>
              <div className="modal-body">
                {rtcError && <div className="alert alert-warning">{rtcError}</div>}

                <div className="row g-3">
                  <div className="col-12">
                    <div className="small text-muted">
                      Item: <strong>{rtcRow?.produto}</strong> - {rtcRow?.descricao}
                      {rtcRow?.codfis_est ? <span> | CodFis/NCM: <strong>{String(rtcRow.codfis_est)}</strong></span> : null}
                      {rtcNcmInfo?.descricao ? <span> | NCM Desc: {String(rtcNcmInfo.descricao)}</span> : null}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Payload (JSON) - /api/calculadora/regime-geral</label>
                    <textarea
                      className="form-control"
                      style={{ fontFamily: 'Consolas, monospace', fontSize: 12, minHeight: 260 }}
                      value={rtcRequestText}
                      onChange={(e) => setRtcRequestText(e.target.value)}
                      disabled={rtcLoading}
                    />
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-primary btn-sm" onClick={runRtcCalculo} disabled={rtcLoading}>
                        {rtcLoading ? 'Calculando...' : 'Calcular'}
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => { setRtcResponseText(''); setRtcError(null) }} disabled={rtcLoading}>
                        Limpar retorno
                      </button>
                    </div>
                    <div className="form-text">
                      Backend proxy: <code>/api/rtc/calculadora/regime-geral</code> (configurar <code>rtc.calculadora.base-url</code>).
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Retorno</label>
                    <textarea
                      className="form-control"
                      style={{ fontFamily: 'Consolas, monospace', fontSize: 12, minHeight: 260 }}
                      value={rtcResponseText}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowRtcModal(false)} disabled={rtcLoading}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Inventario button below the grid, aligned right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, paddingBottom: 8 }}>
        <button className="btn btn-success btn-sm" onClick={()=>setShowInventModal(true)}>Inventario</button>
      </div>
        {/* Modal simples para confirmar data de inventario */}
        {showInventModal && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmar Inventário</h5>
                  <button type="button" className="btn-close" onClick={()=>setShowInventModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-2">Informe a data de referência para o inventário:</div>
                  <input type="date" className="form-control" value={inventDate} onChange={e=>setInventDate(e.target.value)} />
                </div>
                  <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={()=>setShowInventModal(false)} disabled={isProcessing}>Cancelar</button>
                  <button className="btn btn-primary btn-sm" onClick={async ()=>{
                    try {
                      const api = gridRef?.current?.api
                      const rows: any[] = []
                      if (api && typeof api.forEachNodeAfterFilterAndSort === 'function') {
                        api.forEachNodeAfterFilterAndSort((node: any) => {
                          if (node && node.data) rows.push(node.data)
                        })
                      } else if (rowData && rowData.length) {
                        rows.push(...rowData)
                      }

                      if (rows.length === 0) {
                        alert('Nenhum registro para incluir no inventário.')
                        return
                      }

                      // iniciar progresso
                      setIsProcessing(true)
                      setProgress(5)
                      progressInterval.current = setInterval(() => {
                        setProgress(p => {
                          const next = p + Math.floor(Math.random() * 10) + 1
                          return next >= 90 ? 90 : next
                        })
                      }, 400)

                      const payload = { dateInv: inventDate, rows }
                      const resp = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/inventario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' })
                      if (resp.ok) {
                        // concluído
                        setProgress(100)
                        clearInterval(progressInterval.current)
                        const json = await resp.json().catch(()=>null)
                        console.debug('inventario response', json)
                        const inserted = json && json.inserted !== undefined ? json.inserted : null
                        const skipped = json && json.skippedFabNull !== undefined ? json.skippedFabNull : null
                        setTimeout(()=>{
                          setIsProcessing(false)
                          setShowInventModal(false)
                          setProgress(0)
                          let msg = 'Inventário salvo com sucesso.'
                          if (inserted !== null) msg += ' Inseridos: ' + inserted + '.'
                          if (skipped !== null) msg += ' Pulados (sem fab): ' + skipped + '.'
                          alert(msg)
                        }, 350)
                      } else {
                        clearInterval(progressInterval.current)
                        setIsProcessing(false)
                        setProgress(0)
                        const txt = await resp.text()
                        alert('Erro ao gravar inventario: ' + txt)
                      }
                    } catch (err:any) {
                      clearInterval(progressInterval.current)
                      setIsProcessing(false)
                      setProgress(0)
                      console.error(err)
                      alert('Erro ao gravar inventario: ' + (err?.message || String(err)))
                    }
                  }} disabled={isProcessing}>Confirmar</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Progress modal */}
        {isProcessing && (
          <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Gravando Inventário</h5>
                </div>
                <div className="modal-body">
                  <div className="mb-2">Aguardando conclusão do processo. Por favor aguarde...</div>
                  <div className="progress">
                    <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style={{ width: `${progress}%` }} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>{progress}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      {showKardexModal && kardexProduct && (
        <KardexMovimentoModal
          product={kardexProduct}
          onClose={() => setShowKardexModal(false)}
        />
      )}

      {confirmDelete && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar Exclusão</h5>
                <button type="button" className="btn-close" onClick={() => setConfirmDelete(null)} />
              </div>
              <div className="modal-body">
                <p className="mb-1">Deseja realmente excluir o produto abaixo?</p>
                <p className="mb-0 fw-bold">{confirmDelete.descricao || confirmDelete.produto}</p>
                <p className="text-muted small mb-0">
                  {confirmDelete.categoria} / {confirmDelete.produto}
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>
                  <FontAwesomeIcon icon={faTrash} /> Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingImageUrl && (
        <div
          className="modal show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setViewingImageUrl(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ background: 'transparent', border: 'none' }}>
              <div style={{ textAlign: 'right', marginBottom: 8 }}>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setViewingImageUrl(null)}
                >
                  Fechar
                </button>
              </div>
              <img
                src={viewingImageUrl}
                alt=""
                style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default AgGridResults













