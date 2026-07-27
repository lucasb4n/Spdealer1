import React, { useEffect, useState } from 'react'
import { Pie } from 'react-chartjs-2'
import 'chart.js/auto'

interface Props { filters: any; onApplyFilters?: (f: any) => void; onHighlight?: (produto: string) => void }

const GerencialPanel: React.FC<Props> = ({ filters, onApplyFilters, onHighlight }) => {
  const [rows, setRows] = useState<any[]>([])
  const [expandedABC, setExpandedABC] = useState<Record<string, boolean>>({})
  const [expandedXYZ, setExpandedXYZ] = useState<Record<string, boolean>>({})
  const [selectedProduto, setSelectedProduto] = useState<string | null>(null)
  const [masfab, setMasfab] = useState<Array<{ codigo: string; descricao: string }>>([])
  const [filialNome, setFilialNome] = useState('L&S PEÇAS E SERVIÇOS')
  const [filialCnpj, setFilialCnpj] = useState('47.563.976/0001-36')

  useEffect(()=>{
    const qs = new URLSearchParams()
    if (filters?.deposito) qs.set('deposito', filters.deposito)
    // aceitar `categoria` ou `fab` vindo do painel de filtros
    if (filters?.categoria) {
      qs.set('fab', String(filters.categoria))
    } else if (filters?.fab) {
      qs.set('fab', String(filters.fab))
    }
    if (filters?.codprod) qs.set('codprod', filters.codprod)
    if (filters?.somenteComSaldo !== undefined) qs.set('somenteComSaldo', String(filters.somenteComSaldo))
    if (filters?.semMovimentoDias) qs.set('semMovimentoDias', String(filters.semMovimentoDias))
    if (filters?.grupo) qs.set('grupo', filters.grupo)
    // request larger limit so gerencial receives full totals (no truncation)
    qs.set('limit','5000')
    fetch(`${process.env.REACT_APP_API_URL || '/api'}/estoque/consulta?${qs.toString()}`)
      .then(r=>r.json())
      .then(data=> Array.isArray(data) && setRows(data))
      .catch(()=>{})
  }, [filters])

  // carregar mapeamento de categorias (masfab) para exibir "NNN - DESCRICAO"
  useEffect(() => {
    const ac = new AbortController()
    let mounted = true
    const auxPath = `${process.env.REACT_APP_API_URL}/tabelas-auxiliares`
    ;(async () => {
      try {
        const resp = await fetch(`${auxPath}/masfab`, { method: 'GET', credentials: 'include', signal: ac.signal })
        if (!mounted) return
        if (resp.ok) {
          const data = await resp.json()
          setMasfab(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
      }
    })()
    return () => { mounted = false; ac.abort() }
  }, [])

  // carregar filial selecionada para o cabeçalho do relatório
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
              // aplicar máscara simples no CNPJ se existir
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

  // Agrupar por fabricante/categoria usando custo_total (soma do custo_total)
  // preferir o campo `categoria` retornado pelo backend, com fallbacks
  const byFab = rows.reduce((acc:any,row)=>{
    const k = row.categoria || row.fab_est || row.fab || 'N/A'
    acc[k] = (acc[k]||0) + (Number(row.custo_total||0))
    return acc
  }, {})
  const byGrupo = rows.reduce((acc:any,row)=>{ const k=row.grupo||row.catitem_est||'N/A'; acc[k]=(acc[k]||0)+ (Number(row.custo_total||0)); return acc }, {})

  const makeChart = (obj:any)=>({
    labels: Object.keys(obj),
    datasets: [{ data: Object.values(obj), backgroundColor: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949'] }]
  })

  const summary = (()=>{
    type Bucket = { qtde: number; valor: number }
    // buckets fixos na ordem desejada para sempre aparecerem
    const keys = ['<=15', '+15', '+30', '+60', '+90', '+120', '+180', '>180']
    const buckets: Record<string, Bucket> = {}
    const bucketSets: Record<string, Set<string>> = {}
    keys.forEach(k => { buckets[k] = { qtde: 0, valor: 0 }; bucketSets[k] = new Set<string>() })

    rows.forEach((r:any)=>{
      // prefer backend-provided DMS (DMS or dms); fallback to parsing ult_entrada/ult_saida
      let d = Number(r.DMS ?? r.dms)
      if (!d || isNaN(d)) {
        const dateVal = r.ult_saida || r.ult_entrada || null
        if (dateVal) {
          const s = String(dateVal).padStart(8,'0')
          const dd = parseInt(s.substring(0,2),10)
          const mm = parseInt(s.substring(2,4),10)
          const yyyy = parseInt(s.substring(4,8),10)
          if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
            const dt = new Date(yyyy, mm-1, dd)
            if (!isNaN(dt.getTime())) d = Math.floor((Date.now() - dt.getTime())/86400000)
          }
        }
      }
      if (!d || isNaN(d)) d = 9999
      const key = d>180? '>180' : d>120? '+120' : d>90? '+90' : d>60? '+60' : d>30? '+30' : d>15? '+15' : '<=15'
      // contar itens únicos por produto (cada produto conta 1, independentemente do saldo)
      const prodKey = String(r.produto || r.codigo || r.codprod || '')
      if (prodKey) bucketSets[key].add(prodKey)
      // usar custo_total como valor financeiro no resumo
      buckets[key].valor += Number(r.custo_total || 0)
    })
    // finalizar qtde a partir dos sets (itens únicos)
    const results = keys.map(k=>({ dias:k, qtde: bucketSets[k].size, valor: buckets[k].valor }))
    const totalValor = results.reduce((s, r) => s + r.valor, 0)
    // adicionar indice percentual sobre o valor total
    return results.map(r => ({ ...r, indice: totalValor > 0 ? (r.valor / totalValor) * 100 : 0 }))
  })()

  const currency = (v:number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  // resumo por grupo
  const grupoSummary = (()=>{
    const map: Record<string, { grupo:string, custoTotal:number, reposicao:number, venda:number }> = {}
    for (const r of rows) {
      const g = r.grupo || r.catitem_est || 'N/A'
      const saldo = Number(r.saldo || 0)
      const custo = Number(r.custo_total || 0)
      const precoRep = Number(r.precorep || r.preco_rep || r.preco_pub || 0)
      const precoPub = Number(r.preco_pub || 0)
      if (!map[g]) map[g] = { grupo: g, custoTotal: 0, reposicao: 0, venda: 0 }
      map[g].custoTotal += custo
      map[g].reposicao += precoRep * saldo
      map[g].venda += precoPub * saldo
    }
    const arr = Object.values(map)
    const totalCusto = arr.reduce((s,a)=>s+a.custoTotal,0)
    // ordenar pelo código do grupo extraído do prefixo 'NNN - descrição' (numérico)
    arr.sort((a,b) => {
      try {
        const codeA = parseInt(String(a.grupo || '').split(' - ')[0].trim(), 10)
        const codeB = parseInt(String(b.grupo || '').split(' - ')[0].trim(), 10)
        if (!isNaN(codeA) && !isNaN(codeB)) return codeA - codeB
      } catch (e) { /* ignore */ }
      return String(a.grupo).localeCompare(String(b.grupo))
    })
    return arr.map(a=>({
      ...a,
      indice: totalCusto>0 ? (a.custoTotal / totalCusto) * 100 : 0
    }))
  })()

  // resumo por categoria
  const categoriaSummary = (()=>{
    const map: Record<string, { categoria:string, custoTotal:number, reposicao:number, venda:number }> = {}
    for (const r of rows) {
      const c = r.categoria || r.fab_est || r.fab || 'N/A'
      const saldo = Number(r.saldo || 0)
      const custo = Number(r.custo_total || 0)
      const precoRep = Number(r.precorep || r.preco_rep || r.preco_pub || 0)
      const precoPub = Number(r.preco_pub || 0)
      if (!map[c]) map[c] = { categoria: c, custoTotal: 0, reposicao: 0, venda: 0 }
      map[c].custoTotal += custo
      map[c].reposicao += precoRep * saldo
      map[c].venda += precoPub * saldo
    }
    const arr = Object.values(map)
    const totalCusto = arr.reduce((s,a)=>s+a.custoTotal,0)
    // ordenar pelo código da categoria extraído do prefixo 'NNN - descricao' (numérico)
    arr.sort((a,b) => {
      try {
        const codeA = parseInt(String(a.categoria || '').split(' - ')[0].trim(), 10)
        const codeB = parseInt(String(b.categoria || '').split(' - ')[0].trim(), 10)
        if (!isNaN(codeA) && !isNaN(codeB)) return codeA - codeB
      } catch (e) { /* ignore */ }
      return String(a.categoria).localeCompare(String(b.categoria))
    })
    return arr.map(a=>({
      ...a,
      indice: totalCusto>0 ? (a.custoTotal / totalCusto) * 100 : 0
    }))
  })()

  // helper para calcular DMS (reaproveita lógica usada acima)
  const computeDMS = (r:any) => {
    let d = Number(r.DMS ?? r.dms)
    if (!d || isNaN(d)) {
      const dateVal = r.ult_saida || r.ult_entrada || null
      if (dateVal) {
        const s = String(dateVal).padStart(8,'0')
        const dd = parseInt(s.substring(0,2),10)
        const mm = parseInt(s.substring(2,4),10)
        const yyyy = parseInt(s.substring(4,8),10)
        if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
          const dt = new Date(yyyy, mm-1, dd)
          if (!isNaN(dt.getTime())) d = Math.floor((Date.now() - dt.getTime())/86400000)
        }
      }
    }
    if (!d || isNaN(d)) d = 9999
    return d
  }

  // formata label de categoria como 'NNN - DESCRICAO' usando `masfab` quando disponível
  const formatCategoriaLabel = (cat: any): string => {
    if (cat === null || cat === undefined) return ''
    const s = String(cat)
    if (!s) return ''
    // já está no formato 'NNN - descricao'
    if (s.includes(' - ')) return s
    // procurar no mapping masfab por codigo exato ou padded
    const padded = s.padStart(3, '0')
    const found = masfab.find(m => String(m.codigo) === s || String(m.codigo) === padded)
    if (found) {
      // se for código de fabricante (codigo com 1 caractere), não aplicar left-pad
      const codigoStr = String(found.codigo)
      if (codigoStr.length === 1) return `${codigoStr} - ${found.descricao}`
      return `${codigoStr.padStart(3, '0')} - ${found.descricao}`
    }
    // se for numérico, aplicar pad apenas para códigos com mais de 1 dígito (categorias)
    const asNum = parseInt(s, 10)
    if (!isNaN(asNum)) {
      if (s.length === 1) return String(asNum)
      return String(asNum).padStart(3, '0')
    }
    return s
  }

  // CURVA ABC - por Custo Total
  const abcSummary = (()=>{
    const items = rows.map((r:any)=>({
      key: String(r.produto || r.codigo || r.codprod || ''),
      custo: Number(r.custo_total || 0)
    })).filter(i=>i.key)
    const total = items.reduce((s,i)=>s + i.custo, 0)
    items.sort((a,b)=>b.custo - a.custo)
    const buckets: Record<string,{qtde:number, valor:number}> = { A: {qtde:0,valor:0}, B:{qtde:0,valor:0}, C:{qtde:0,valor:0} }
    let acc = 0
    for (const it of items) {
      acc += it.custo
      const pct = total > 0 ? (acc / total) * 100 : 0
      const cls = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C'
      buckets[cls].qtde += 1
      buckets[cls].valor += it.custo
    }
    return Object.entries(buckets).map(([k,v])=>({ classe: k, qtde: v.qtde, valor: v.valor, indice: total>0? (v.valor/total)*100 : 0 }))
  })()

  // CURVA XYZ - classifica por DMS (X: <=30, Y:31-90, Z:>90)
  const xyzSummary = (()=>{
    const map: Record<string,{qtde:number, valor:number}> = { X:{qtde:0,valor:0}, Y:{qtde:0,valor:0}, Z:{qtde:0,valor:0} }
    for (const r of rows) {
      const d = computeDMS(r)
      const cls = d <= 30 ? 'X' : d <= 90 ? 'Y' : 'Z'
      map[cls].qtde += 1
      map[cls].valor += Number(r.custo_total || 0)
    }
    const total = map.X.valor + map.Y.valor + map.Z.valor
    return Object.entries(map).map(([k,v])=>({ classe: k, qtde: v.qtde, valor: v.valor, indice: total>0? (v.valor/total)*100 : 0 }))
  })()

  // map items by ABC class for expansion view
  const abcItems = (()=>{
    const items = rows.map((r:any)=>({
      categoria: r.categoria || r.fab_est || r.fab || '',
      produto: r.produto || r.codigo || r.codprod || '',
      descricao: r.descricao || '',
      saldo: Number(r.saldo || 0),
      custo_total: Number(r.custo_total || 0)
    }))
    items.sort((a,b)=>b.custo_total - a.custo_total)
    const total = items.reduce((s,i)=>s + i.custo_total, 0)
    const map: Record<string, any[]> = { A: [], B: [], C: [] }
    let acc = 0
    for (const it of items) {
      acc += it.custo_total
      const pct = total > 0 ? (acc / total) * 100 : 0
      const cls = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C'
      map[cls].push(it)
    }
    return map
  })()

  // map items by XYZ class for expansion view
  const xyzItems = (()=>{
    const map: Record<string, any[]> = { X: [], Y: [], Z: [] }
    for (const r of rows) {
      const d = computeDMS(r)
      const cls = d <= 30 ? 'X' : d <= 90 ? 'Y' : 'Z'
      map[cls].push({
        categoria: r.categoria || r.fab_est || r.fab || '',
        produto: r.produto || r.codigo || r.codprod || '',
        descricao: r.descricao || '',
        saldo: Number(r.saldo || 0),
        custo_total: Number(r.custo_total || 0),
        dms: d
      })
    }
    return map
  })()

  const applyToGrid = (item:any) => {
    // prefer produto code; keep existing filters (fab/grupo) and set codprod
    setSelectedProduto(item.produto)
    // Prefer highlighting the product in the grid when available
    if (item.produto && typeof onHighlight === 'function') {
      onHighlight(item.produto)
      return
    }

    // Fallback: apply filters to parent (legacy behavior)
    const newFilters = { ...(filters || {}) }
    if (item.produto) newFilters.codprod = item.produto
    if (item.categoria) newFilters.categoria = item.categoria
    if (typeof onApplyFilters === 'function') {
      onApplyFilters(newFilters)
    }
  }

  const getPeriodoTexto = () => {
    const parts: string[] = []
    if (filters?.deposito) parts.push(`Depósito: ${filters.deposito}`)
    if (filters?.categoria) parts.push(`Categoria: ${formatCategoriaLabel(filters.categoria)}`)
    else if (filters?.fab) parts.push(`Categoria: ${formatCategoriaLabel(filters.fab)}`)
    if (filters?.grupo) parts.push(`Grupo: ${filters.grupo}`)
    if (filters?.codprod) parts.push(`Produto: ${filters.codprod}`)
    if (filters?.somenteComSaldo !== undefined && filters?.somenteComSaldo !== 'false') parts.push(`Só com Saldo`)
    if (filters?.semMovimentoDias) parts.push(`Sem Movimento > ${filters.semMovimentoDias} dias`)
    
    return parts.length > 0 ? parts.join(' | ') : 'Sem filtros ativos'
  }

  const handleGerarRelatorio = () => {
    // 1. Capturar as imagens dos gráficos do Chart.js
    const canvases = document.querySelectorAll('.card canvas') as NodeListOf<HTMLCanvasElement>;
    const chartImages: string[] = [];
    canvases.forEach((canvas) => {
      try {
        chartImages.push(canvas.toDataURL('image/png'));
      } catch (e) {
        console.error('Erro ao capturar gráfico:', e);
      }
    });

    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = userObj.name || userObj.username || 'Admin';
    const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const periodoTxt = getPeriodoTexto();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para visualizar o relatório.');
      return;
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Consulta de Estoque - Gerencial</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #1f2937;
      margin: 25px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-box {
      border: 1px solid #d1d5db;
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .header-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 5px;
      margin-bottom: 3px;
    }
    .header-filters {
      font-size: 10px;
      color: #4b5563;
      border-top: 1px dashed #e5e7eb;
      margin-top: 5px;
      padding-top: 5px;
    }
    .charts-container {
      display: flex;
      gap: 20px;
      justify-content: space-around;
      margin-bottom: 25px;
    }
    .chart-box {
      text-align: center;
      flex: 1;
      max-width: 250px;
    }
    .chart-box img {
      width: 100%;
      height: auto;
      max-height: 200px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #111827;
      margin-top: 20px;
      margin-bottom: 5px;
      border-left: 3px solid #2563eb;
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10px;
    }
    th {
      background-color: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border-bottom: 2px solid #e5e7eb;
      text-transform: uppercase;
      font-size: 9px;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e5e7eb;
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
    <div class="header-title">RELATÓRIO DE CONSULTA DE ESTOQUE - GERENCIAL</div>
    <div class="header-filters">
      <strong>Período / Filtros:</strong> ${periodoTxt}
    </div>
  </div>

  <!-- GRÁFICOS -->
  <div class="charts-container">
    ${chartImages[0] ? `
    <div class="chart-box">
      <div style="font-weight: bold; margin-bottom: 5px; font-size: 10px; text-transform: uppercase;">Por Categoria</div>
      <img src="${chartImages[0]}" />
    </div>
    ` : ''}
    ${chartImages[1] ? `
    <div class="chart-box">
      <div style="font-weight: bold; margin-bottom: 5px; font-size: 10px; text-transform: uppercase;">Por Grupo</div>
      <img src="${chartImages[1]}" />
    </div>
    ` : ''}
  </div>

  <!-- CURVA ABC -->
  <div class="section-title">CURVA ABC (por Custo Total)</div>
  <table>
    <thead>
      <tr>
        <th>Classe</th>
        <th class="text-end">Qtde Itens</th>
        <th class="text-end">Valor</th>
        <th class="text-end">% sobre Total</th>
      </tr>
    </thead>
    <tbody>
      ${abcSummary.map(a => `
        <tr>
          <td>${a.classe}</td>
          <td class="text-end">${a.qtde}</td>
          <td class="text-end">${currency(a.valor)}</td>
          <td class="text-end">${a.indice.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- CURVA XYZ -->
  <div class="section-title">CURVA XYZ (por DMS)</div>
  <table>
    <thead>
      <tr>
        <th>Classe</th>
        <th class="text-end">Qtde Itens</th>
        <th class="text-end">Valor (Custo Total)</th>
        <th class="text-end">% sobre Total</th>
      </tr>
    </thead>
    <tbody>
      ${xyzSummary.map(x => `
        <tr>
          <td>${x.classe}</td>
          <td class="text-end">${x.qtde}</td>
          <td class="text-end">${currency(x.valor)}</td>
          <td class="text-end">${x.indice.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- RESUMO DSM -->
  <div class="section-title">Resumo por D.S.M.</div>
  <table>
    <thead>
      <tr>
        <th>D.S.M.</th>
        <th class="text-end">Qtde</th>
        <th class="text-end">Índice</th>
        <th class="text-end">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${summary.map(s => `
        <tr>
          <td>${s.dias}</td>
          <td class="text-end">${s.qtde}</td>
          <td class="text-end">${(s.indice || 0).toFixed(2)}%</td>
          <td class="text-end">${currency(s.valor)}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr class="totals-row">
        <th>Total</th>
        <th class="text-end">${summary.reduce((a, b) => a + b.qtde, 0)}</th>
        <th class="text-end">${(summary.reduce((a, b) => a + b.valor, 0) > 0 ? '100.00%' : '0.00%')}</th>
        <th class="text-end">${currency(summary.reduce((a, b) => a + b.valor, 0))}</th>
      </tr>
    </tfoot>
  </table>

  <!-- RESUMO POR GRUPO -->
  <div class="section-title">Resumo por Grupo</div>
  <table>
    <thead>
      <tr>
        <th>Grupo</th>
        <th class="text-end">Valor Custo Total</th>
        <th class="text-end">Valor Reposição</th>
        <th class="text-end">Valor Venda</th>
        <th class="text-end">Índice</th>
      </tr>
    </thead>
    <tbody>
      ${grupoSummary.map(g => `
        <tr>
          <td>${g.grupo}</td>
          <td class="text-end">${currency(g.custoTotal)}</td>
          <td class="text-end">${currency(g.reposicao)}</td>
          <td class="text-end">${currency(g.venda)}</td>
          <td class="text-end">${g.indice.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- RESUMO POR CATEGORIA -->
  <div class="section-title">Resumo por Categoria</div>
  <table>
    <thead>
      <tr>
        <th>Categoria</th>
        <th class="text-end">Valor Custo Total</th>
        <th class="text-end">Valor Reposição</th>
        <th class="text-end">Valor Venda</th>
        <th class="text-end">Índice</th>
      </tr>
    </thead>
    <tbody>
      ${categoriaSummary.map(c => `
        <tr>
          <td>${formatCategoriaLabel(c.categoria)}</td>
          <td class="text-end">${currency(c.custoTotal)}</td>
          <td class="text-end">${currency(c.reposicao)}</td>
          <td class="text-end">${currency(c.venda)}</td>
          <td class="text-end">${c.indice.toFixed(2)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Aguardar o carregamento das imagens dos gráficos em Base64 e disparar impressão
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 800);
  };

  return (
    <div className="card p-2" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
        <h6 className="m-0" style={{ fontWeight: 'bold', color: '#1e293b' }}>Painel Gerencial</h6>
        <button className="btn btn-sm btn-success" onClick={handleGerarRelatorio}>
          Gerar Relatório (PDF)
        </button>
      </div>
      <div className="d-flex gap-2">
        <div style={{width: '50%'}}>
          <small>Por Categoria</small>
          <Pie data={makeChart(Object.keys(byFab).length? byFab : { 'N/A': 0 })} />
        </div>
        <div style={{width: '50%'}}>
          <small>Por Grupo</small>
          <Pie data={makeChart(Object.keys(byGrupo).length? byGrupo : { 'N/A': 0 })} />
        </div>
      </div>

      <div className="mt-3">
        <small>CURVA ABC (por Custo Total)</small>
        <table className="table table-sm mt-1">
          <thead>
            <tr>
              <th>Classe</th>
              <th className="text-end">Qtde Itens</th>
              <th className="text-end">Valor</th>
              <th className="text-end">% sobre Total</th>
            </tr>
          </thead>
          <tbody>
            {abcSummary.map(a => {
              const isOpen = !!expandedABC[a.classe]
              return (
                <React.Fragment key={a.classe}>
                  <tr onClick={()=>setExpandedABC(s=>({ ...s, [a.classe]: !s[a.classe] }))} style={{ cursor: 'pointer' }}>
                    <td>{a.classe}</td>
                    <td className="text-end">{a.qtde}</td>
                    <td className="text-end">{currency(a.valor)}</td>
                    <td className="text-end">{a.indice.toFixed(2)}%</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={4} style={{ padding: 0 }}>
                        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                          <table className="table table-sm mb-0">
                            <thead>
                              <tr>
                                <th>Categoria</th>
                                <th>Produto</th>
                                <th>Descrição</th>
                                <th className="text-end">Saldo</th>
                                <th className="text-end">Custo Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(abcItems[a.classe] || []).map((it, idx) => {
                                const isSel = selectedProduto && selectedProduto === it.produto
                                return (
                                  <tr key={idx} onClick={()=>applyToGrid(it)} style={{ cursor: 'pointer', background: isSel ? '#e6f2ff' : undefined }}>
                                    <td>{formatCategoriaLabel(it.categoria)}</td>
                                    <td>{it.produto}</td>
                                    <td>{it.descricao}</td>
                                    <td className="text-end">{it.saldo}</td>
                                    <td className="text-end">{currency(it.custo_total)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 mb-2">
        <small>CURVA XYZ (por DMS)</small>
        <table className="table table-sm mt-1 mb-2">
          <thead>
            <tr>
              <th>Classe</th>
              <th className="text-end">Qtde Itens</th>
              <th className="text-end">Valor (Custo Total)</th>
              <th className="text-end">% sobre Total</th>
            </tr>
          </thead>
          <tbody>
            {xyzSummary.map(x => {
              const isOpen = !!expandedXYZ[x.classe]
              return (
                <React.Fragment key={x.classe}>
                  <tr onClick={()=>setExpandedXYZ(s=>({ ...s, [x.classe]: !s[x.classe] }))} style={{ cursor: 'pointer' }}>
                    <td>{x.classe}</td>
                    <td className="text-end">{x.qtde}</td>
                    <td className="text-end">{currency(x.valor)}</td>
                    <td className="text-end">{x.indice.toFixed(2)}%</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={4} style={{ padding: 0 }}>
                        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                          <table className="table table-sm mb-0">
                            <thead>
                              <tr>
                                <th>Categoria</th>
                                <th>Produto</th>
                                <th>Descrição</th>
                                <th className="text-end">Saldo</th>
                                <th className="text-end">Custo Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(xyzItems[x.classe] || []).map((it, idx) => {
                                const isSel = selectedProduto && selectedProduto === it.produto
                                return (
                                  <tr key={idx} onClick={()=>applyToGrid(it)} style={{ cursor: 'pointer', background: isSel ? '#e6f2ff' : undefined }}>
                                    <td>{formatCategoriaLabel(it.categoria)}</td>
                                    <td>{it.produto}</td>
                                    <td>{it.descricao}</td>
                                    <td className="text-end">{it.saldo}</td>
                                    <td className="text-end">{currency(it.custo_total)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2">
        <small>Resumo</small>
        <table className="table table-sm mt-1">
          <thead>
            <tr>
              <th>D.S.M.</th>
              <th className="text-end">Qtde</th>
              <th className="text-end">Indice</th>
              <th className="text-end">Valor</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(s=> (
              <tr key={s.dias}>
                <td>{s.dias}</td>
                <td className="text-end">{s.qtde}</td>
                <td className="text-end">{(s.indice || 0).toFixed(2)}%</td>
                <td className="text-end">{s.valor.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Total</th>
              <th className="text-end">{summary.reduce((a,b)=>a+b.qtde,0)}</th>
              <th className="text-end">{(summary.reduce((a,b)=>a+b.valor,0) > 0 ? '100.00%' : '0.00%')}</th>
              <th className="text-end">{summary.reduce((a,b)=>a+b.valor,0).toFixed(2)}</th>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3">
        <small>Resumo por Grupo</small>
        <table className="table table-sm mt-1">
          <thead>
            <tr>
              <th>Grupo</th>
              <th className="text-end">Valor Custo Total</th>
              <th className="text-end">Valor Reposicao</th>
              <th className="text-end">Valor Venda</th>
              <th className="text-end">Indice</th>
            </tr>
          </thead>
          <tbody>
            {grupoSummary.map(g => (
              <tr key={g.grupo}>
                <td>{g.grupo}</td>
                <td className="text-end">{currency(g.custoTotal)}</td>
                <td className="text-end">{currency(g.reposicao)}</td>
                <td className="text-end">{currency(g.venda)}</td>
                <td className="text-end">{g.indice.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <small>Resumo por Categoria</small>
        <table className="table table-sm mt-1">
          <thead>
            <tr>
              <th>Categoria</th>
              <th className="text-end">Valor Custo Total</th>
              <th className="text-end">Valor Reposicao</th>
              <th className="text-end">Valor Venda</th>
              <th className="text-end">Indice</th>
            </tr>
          </thead>
          <tbody>
            {categoriaSummary.map(c => (
              <tr key={c.categoria}>
                <td>{formatCategoriaLabel(c.categoria)}</td>
                <td className="text-end">{currency(c.custoTotal)}</td>
                <td className="text-end">{currency(c.reposicao)}</td>
                <td className="text-end">{currency(c.venda)}</td>
                <td className="text-end">{c.indice.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GerencialPanel













