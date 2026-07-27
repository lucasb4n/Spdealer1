import React, { useState, useEffect } from 'react'
import NfeSaidaGrid from 'components/Financeiro/NfeSaidaGrid'

const NfeSaidaPage: React.FC = () => {
  const [dataini, setDataini] = useState<string>(()=> new Date().toISOString().slice(0,10))
  const [datafim, setDatafim] = useState<string>(()=> new Date().toISOString().slice(0,10))
  const [data, setData] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])

  const fetchData = async ()=>{
    try{
      const qs = new URLSearchParams({ dataini, datafim })
      const resp = await fetch(`/api/financeiro/nfe_saida?${qs.toString()}`, { credentials: 'include' })
      const json = await resp.json()
      setData(Array.isArray(json) ? json : [])
    }catch(e){ console.error(e); setData([]) }
  }

  useEffect(()=>{ fetchData() }, [])

  const onRowSelected = async (row:any) => {
    try{
      const params = new URLSearchParams({ filial: row.filial || '', emissaoi: row.DtEmissao, tipo: row.tipo_not || '', serie: row.Serie, numero: String(row.Numero) })
      const resp = await fetch(`/api/financeiro/nfe_saida/items?${params.toString()}`, { credentials: 'include' })
      const json = await resp.json()
      setItems(Array.isArray(json) ? json : [])
    }catch(e){ console.error(e); setItems([]) }
  }

  return (
    <div>
      <h3>NF-e Saída (teste Syncfusion DataGrid)</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div>
          <label>Data Inicial</label>
          <input type="date" className="form-control" value={dataini} onChange={e=>setDataini(e.target.value)} />
        </div>
        <div>
          <label>Data Final</label>
          <input type="date" className="form-control" value={datafim} onChange={e=>setDatafim(e.target.value)} />
        </div>
        <div style={{ alignSelf: 'end' }}>
          <button className="btn btn-primary" onClick={fetchData}>Buscar</button>
        </div>
      </div>

      <NfeSaidaGrid data={data} onRowSelected={onRowSelected} />

      <h5 style={{ marginTop: 16 }}>Itens da Nota</h5>
      <table className="table table-sm table-striped">
        <thead><tr><th>Categoria</th><th>Produto</th><th>Descrição</th><th>Qtde</th><th>Devol</th><th>Vlr Uni</th><th>Desconto</th><th>Frete</th><th>Total</th></tr></thead>
        <tbody>
          {items.map((it, idx)=> (
            <tr key={idx}>
              <td>{it.Categoria}</td>
              <td>{it.Produto}</td>
              <td>{it.Descrição}</td>
              <td className="text-end">{it.Qtde}</td>
              <td className="text-end">{it.Devolvido}</td>
              <td className="text-end">{it.VlrUni}</td>
              <td className="text-end">{it.Desconto}</td>
              <td className="text-end">{it.frete}</td>
              <td className="text-end">{it.VlrTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default NfeSaidaPage













