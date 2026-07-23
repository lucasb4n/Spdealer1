import React from 'react'
import { Pie } from 'react-chartjs-2'

interface Props { filters?: any, rows: any[], items?: any[] }

const ServicoGerencialPanel: React.FC<Props> = ({ filters, rows, items = [] }) => {
  // Agrupar por item/serviço (descr_cdt) a partir dos itens detalhados
  const byTipo = items.reduce((acc:any, item:any) => {
    const k = item.servico || 'N/A'
    acc[k] = acc[k] || { qtde: 0, total: 0 }
    acc[k].qtde += 1
    acc[k].total += (Number(item.valor) || 0)
    return acc
  }, {})

  const byModelo = rows.reduce((acc:any, row:any) => {
    const k = row.modelo || 'N/A'
    acc[k] = acc[k] || { qtde: 0, total: 0 }
    acc[k].qtde += 1
    acc[k].total += (Number(row.total) || 0) - (Number(row.descser_ser) || 0)
    return acc
  }, {})

  const makeChart = (obj:any) => ({
    labels: Object.keys(obj),
    datasets: [{
      data: Object.values(obj).map((v:any) => typeof v === 'number' ? v : v.total),
      backgroundColor: ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949']
    }]
  })

  const totalItems = items.length
  const sumTotalItems = items.reduce((s, i) => s + (Number(i.valor) || 0), 0)

  const topClientes = Object.entries(items.reduce((acc:any, item:any) => {
    const k = String(item.cliente || 'N/A')
    acc[k] = acc[k] || 0
    acc[k] += (Number(item.valor) || 0)
    return acc
  }, {} as Record<string, number>)).sort((a:any,b:any)=>b[1]-a[1]).slice(0,8)

  const currency = (v:number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="card p-2" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      <h6>Gerencial (Serviço por Tipo)</h6>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <small>Por Item (total)</small>
          <Pie data={makeChart(byTipo)} />
        </div>
        <div style={{ flex: 1 }}>
          <small>Por Modelo (valor)</small>
          <Pie data={makeChart(byModelo)} />
        </div>
      </div>

      <div className="mt-2">
        <div><strong>Período:</strong> {filters?.dataini || '-'} → {filters?.datafim || '-'}</div>
        <div><strong>Filtro Tipo:</strong> {Array.isArray(filters?.tipos) && filters.tipos.length > 0 ? filters.tipos.join(', ') : (filters?.tipo || 'Todos')}</div>
        <div style={{ marginTop: 8 }}><strong>Resumo:</strong> {totalItems} itens — {currency(sumTotalItems)} (valor total)</div>
      </div>

      <div className="mt-3">
        <small>Top Clientes por valor (top 8)</small>
        <table className="table table-sm mt-1 mb-0">
          <thead>
            <tr><th>Cliente</th><th className="text-end">Valor</th></tr>
          </thead>
          <tbody>
            {topClientes.map(([cliente,valor]: any, idx:number)=> (
              <tr key={idx}><td>{cliente}</td><td className="text-end">{currency(Number(valor))}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default ServicoGerencialPanel
