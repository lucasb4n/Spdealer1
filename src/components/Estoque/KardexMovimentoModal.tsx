import React, { useEffect, useState, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-theme-alpine.css'

interface Props {
  product: { fab: string; codprod: string; descricao: string }
  onClose: () => void
}

const KardexMovimentoModal: React.FC<Props> = ({ product, onClose }) => {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [dataInicial, setDataInicial] = useState(thirtyDaysAgo)
  const [dataFinal, setDataFinal] = useState(today)
  const [filtroEntrada, setFiltroEntrada] = useState(true)
  const [filtroSaida, setFiltroSaida] = useState(true)
  const [filtroAjuste, setFiltroAjuste] = useState(true)
  const [rowData, setRowData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gridRef = useRef<any>(null)
  const [filialNome, setFilialNome] = useState('L&S PEÇAS E SERVIÇOS')
  const [filialCnpj, setFilialCnpj] = useState('47.563.976/0001-36')

  useEffect(() => {
    const activeFilId = localStorage.getItem('filialId') || '001'
    const baseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '')
    fetch(`${baseUrl}/api/tabelas-auxiliares/filiais`, { credentials: 'include' })
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const found = data.find(f => String(f.codigo) === activeFilId || String(f.codigo).padStart(3,'0') === activeFilId)
          if (found) {
            setFilialNome(found.descricao || found.nome_fil || 'L&S PEÇAS E SERVIÇOS')
            if (found.cnpj_fil) {
              const c = String(found.cnpj_fil)
              if (c.length === 14) {
                setFilialCnpj(`${c.substring(0,2)}.${c.substring(2,5)}.${c.substring(5,8)}/${c.substring(8,12)}-${c.substring(12,14)}`)
              } else {
                setFilialCnpj(c)
              }
            }
          }
        }
      })
      .catch(() => {})
  }, [])

  const fetchMovimentos = async () => {
    try {
      setLoading(true)
      setError(null)

      const tipos: string[] = []
      if (filtroEntrada) tipos.push('E')
      if (filtroSaida) tipos.push('S')
      if (filtroAjuste) tipos.push('A')

      if (tipos.length === 0) {
        setRowData([])
        setLoading(false)
        return
      }

      const qs = new URLSearchParams({
        fab: product.fab,
        codprod: product.codprod,
        dataInicial,
        dataFinal,
        tipos: tipos.join(',')
      })

      const resp = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/kardexm-movimentos?${qs.toString()}`, { credentials: 'include' })
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '')
        setError(txt || `Erro HTTP ${resp.status}`)
        setRowData([])
        return
      }
      const data = await resp.json()
      setRowData(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || String(e))
      setRowData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovimentos()
  }, [])

  const formatDate = (value: any) => {
    if (!value && value !== 0) return ''
    let s = String(value).trim()
    s = s.padStart(8, '0')
    const dd = s.substring(0, 2)
    const mm = s.substring(2, 4)
    const yyyy = s.substring(4, 8)
    if (dd === '00' || mm === '00' || yyyy === '0000') return ''
    return `${dd}/${mm}/${yyyy}`
  }

  const formatNumber = (v: any) => {
    if (v === null || v === undefined) return '0'
    const n = Number(v)
    if (isNaN(n)) return String(v)
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const tpMovRenderer = (params: any) => {
    const v = params?.value || ''
    if (v === 'E') return <span style={{ color: '#16a34a', fontWeight: 700 }}>E</span>
    if (v === 'S') return <span style={{ color: '#ef4444', fontWeight: 700 }}>S</span>
    if (v === 'A') return <span style={{ color: '#f59e0b', fontWeight: 700 }}>A</span>
    return v
  }

  const columnDefs = [
    { headerName: 'TpMov', field: 'tpMov', width: 70, cellRenderer: tpMovRenderer, cellClass: 'text-center' },
    { headerName: 'Serie', field: 'serie', width: 60 },
    { headerName: 'NroNFe', field: 'nroNFe', width: 100 },
    { headerName: 'Dt.Emissão', field: 'dtEmissao', width: 100, valueFormatter: (p: any) => formatDate(p.value), cellClass: 'text-center' },
    { headerName: 'Documento', field: 'documento', width: 140 },
    { headerName: 'Cliente/Fornecedor', field: 'clienteFornecedor', width: 220 },
    { headerName: 'Quant.', field: 'quantidade', width: 100, valueFormatter: (p: any) => formatNumber(p.value), cellClass: 'text-end', headerClass: 'text-end' },
    { headerName: 'Pr.Custo', field: 'prCusto', width: 110, valueFormatter: (p: any) => formatNumber(p.value), cellClass: 'text-end', headerClass: 'text-end' },
    { headerName: 'Pr.Saida', field: 'prSaida', width: 110, valueFormatter: (p: any) => formatNumber(p.value), cellClass: 'text-end', headerClass: 'text-end' }
  ]

  const localeText = {
    loadingOoo: 'Carregando...',
    noRowsToShow: 'Nenhum movimento encontrado',
    page: 'Página',
    of: 'de',
    to: 'até',
    more: 'mais'
  }

  const formatDateRaw = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  const handleGerarRelatorio = () => {
    const userObj = JSON.parse(localStorage.getItem('user') || '{}')
    const userName = userObj.name || userObj.username || 'Admin'
    const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

    const tipos: string[] = []
    if (filtroEntrada) tipos.push('Entradas (E)')
    if (filtroSaida) tipos.push('Saídas (S)')
    if (filtroAjuste) tipos.push('Ajustes (A)')
    const tiposFiltroTxt = tipos.join(', ') || 'Nenhum'

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor, permita pop-ups para visualizar o relatório.')
      return;
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Movimento de Estoque (Kardex)</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1f2937;
      margin: 25px;
      font-size: 10px;
      line-height: 1.4;
    }
    .header-box {
      border: 1px solid #d1d5db;
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
    }
    .header-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 5px;
      margin-bottom: 3px;
    }
    .header-filters {
      font-size: 9px;
      color: #4b5563;
      border-top: 1px dashed #e5e7eb;
      margin-top: 5px;
      padding-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 9px;
    }
    th {
      background-color: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-align: left;
      padding: 5px 6px;
      border-bottom: 2px solid #e5e7eb;
      text-transform: uppercase;
      font-size: 8px;
    }
    td {
      padding: 4px 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .text-center {
      text-align: center;
    }
    .text-end {
      text-align: right;
    }
    .totals-row th, .totals-row td {
      font-weight: bold;
      background-color: #f9fafb;
      border-top: 2px solid #e5e7eb;
    }
    @media print {
      body { margin: 10px; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- CABEÇALHO CONFORME CABECALHO.MD -->
  <div class="header-box">
    <div class="header-row">
      <div style="font-weight: bold;">${filialNome}</div>
      <div>${agora}</div>
    </div>
    <div class="header-row" style="margin-top: 2px;">
      <div>CNPJ: ${filialCnpj}</div>
      <div>Usuário: ${userName}</div>
    </div>
    <div class="header-title">RELATÓRIO DE MOVIMENTO DE ESTOQUE (KARDEX)</div>
    <div class="header-filters">
      <strong>Produto:</strong> ${product.fab} / ${product.codprod} - ${product.descricao}<br/>
      <strong>Período:</strong> ${formatDateRaw(dataInicial)} a ${formatDateRaw(dataFinal)} | 
      <strong>Filtros:</strong> ${tiposFiltroTxt}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-center" style="width: 50px;">TpMov</th>
        <th style="width: 50px;">Série</th>
        <th style="width: 70px;">Nro NFe</th>
        <th class="text-center" style="width: 80px;">Dt. Emissão</th>
        <th style="width: 100px;">Documento</th>
        <th>Cliente / Fornecedor</th>
        <th class="text-end" style="width: 80px;">Quant.</th>
        <th class="text-end" style="width: 80px;">Pr. Custo</th>
        <th class="text-end" style="width: 80px;">Pr. Saída</th>
      </tr>
    </thead>
    <tbody>
      ${rowData.map(r => `
        <tr>
          <td class="text-center" style="font-weight: bold; color: ${r.tpMov === 'E' ? '#16a34a' : r.tpMov === 'S' ? '#ef4444' : '#f59e0b'};">${r.tpMov || ''}</td>
          <td>${r.serie || ''}</td>
          <td>${r.nroNFe || ''}</td>
          <td class="text-center">${formatDate(r.dtEmissao)}</td>
          <td>${r.documento || ''}</td>
          <td>${r.clienteFornecedor || ''}</td>
          <td class="text-end">${formatNumber(r.quantidade)}</td>
          <td class="text-end">${formatNumber(r.prCusto)}</td>
          <td class="text-end">${formatNumber(r.prSaida)}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="6">TOTAL (Registros: ${rowData.length})</td>
        <td class="text-end">${formatNumber(rowData.reduce((sum, r) => sum + (Number(r.quantidade) || 0), 0))}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="kardex-modal-overlay" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="kardex-modal">
        <div className="kardex-modal__header">
          <div className="kardex-modal__header-left">
            <h3>Movimento de Estoque</h3>
            <span className="kardex-modal__product-info">
              {product.fab} / {product.codprod} - {product.descricao}
            </span>
          </div>
          <button type="button" className="kardex-modal__close" onClick={onClose} aria-label="Fechar">&times;</button>
        </div>

        <div className="kardex-modal__filters">
          <div className="kardex-modal__filter-group">
            <label className="kardex-modal__filter-label">Data Inicial</label>
            <input type="date" className="kardex-modal__filter-input" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
          </div>
          <div className="kardex-modal__filter-group">
            <label className="kardex-modal__filter-label">Data Final</label>
            <input type="date" className="kardex-modal__filter-input" value={dataFinal} onChange={e => setDataFinal(e.target.value)} />
          </div>
          <div className="kardex-modal__filter-group">
            <label className="kardex-modal__filter-label">Movimento</label>
            <div className="kardex-modal__toggle-group">
              <button
                className={`kardex-modal__toggle ${filtroEntrada ? 'kardex-modal__toggle--on' : ''}`}
                onClick={() => setFiltroEntrada(v => !v)}
                title="Entradas">
                E
              </button>
              <button
                className={`kardex-modal__toggle ${filtroSaida ? 'kardex-modal__toggle--on' : ''}`}
                onClick={() => setFiltroSaida(v => !v)}
                title="Saídas">
                S
              </button>
              <button
                className={`kardex-modal__toggle ${filtroAjuste ? 'kardex-modal__toggle--on' : ''}`}
                onClick={() => setFiltroAjuste(v => !v)}
                title="Ajustes">
                A
              </button>
            </div>
          </div>
          <div className="kardex-modal__filter-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="orcamento-btn orcamento-btn--primary" onClick={fetchMovimentos} disabled={loading}>
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
            {rowData.length > 0 && (
              <button className="orcamento-btn" onClick={handleGerarRelatorio} type="button" style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}>
                Gerar Relatório
              </button>
            )}
          </div>
        </div>

        <div className="kardex-modal__body">
          {error && <div className="orcamento-alert orcamento-alert--danger">{error}</div>}
          {!loading && rowData.length === 0 && !error && (
            <div className="kardex-modal__empty">Nenhum movimento encontrado para o filtro selecionado.</div>
          )}
          <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              localeText={localeText}
              defaultColDef={{ resizable: true, sortable: true }}
              pagination={true}
              paginationPageSize={25}
              domLayout="normal"
            />
          </div>
        </div>

        <div className="kardex-modal__footer">
          <div className="kardex-modal__footer-left">
            Registros: {rowData.length}
          </div>
          <button className="orcamento-btn orcamento-btn--secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default KardexMovimentoModal
