import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

interface Props { 
  onChange: (filters: any) => void; 
  onToggleGerencial?: () => void; 
  showGerencial?: boolean;
  mode?: 'cadastro' | 'consulta';
}

const FilterPanel: React.FC<Props> = ({ onChange, onToggleGerencial, showGerencial, mode = 'consulta' }) => {
  // Common states
  const [fabricantes, setFabricantes] = useState<Array<{ codigo: string; descricao: string }>>([])
  const [groups, setGroups] = useState<Array<any>>([])
  const [onlySaldo, setOnlySaldo] = useState(true)

  // Mode: Cadastro States
  const [searchText, setSearchText] = useState('')
  const [fabCadastro, setFabCadastro] = useState('')
  const [groupCadastro, setGroupCadastro] = useState('')

  // Mode: Consulta States
  const [fabConsulta, setFabConsulta] = useState('')
  const [fabQuery, setFabQuery] = useState('')
  const [fabOpen, setFabOpen] = useState(false)
  const [groupConsulta, setGroupConsulta] = useState('')
  const [groupQuery, setGroupQuery] = useState('')
  const [groupOpen, setGroupOpen] = useState(false)
  const [codprod, setCodprod] = useState('')
  const [prodQuery, setProdQuery] = useState('')
  const [prodOpen, setProdOpen] = useState(false)
  const [prodSuggestions, setProdSuggestions] = useState<Array<{ codigo: string; descricao: string }>>([])

  // Load manufacturers (common)
  useEffect(() => {
    const auxPath = `${process.env.REACT_APP_API_URL || '/api'}/tabelas-auxiliares`
    const ac = new AbortController()
    let mounted = true

    const carregar = async () => {
      try {
        const resp = await fetch(`${auxPath}/masfab`, { method: 'GET', credentials: 'include', signal: ac.signal })
        if (!mounted) return
        if (resp.ok) {
          const data = await resp.json()
          setFabricantes(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return
        console.error('[FilterPanel] erro ao carregar masfab', err)
      }
    }

    carregar()
    return () => { mounted = false; ac.abort() }
  }, [])

  // Load groups (common)
  useEffect(() => {
    const auxPath = `${process.env.REACT_APP_API_URL || '/api'}/tabelas-auxiliares`
    const ac = new AbortController()
    let mounted = true

    const carregarGrupos = async () => {
      try {
        const resp = await fetch(`${auxPath}/masgru`, { method: 'GET', credentials: 'include', signal: ac.signal })
        if (!mounted) return
        if (resp.ok) {
          const data = await resp.json()
          setGroups(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return
        console.error('[FilterPanel] erro ao carregar masgru', err)
      }
    }

    carregarGrupos()
    return () => { mounted = false; ac.abort() }
  }, [])

  // Load product suggestions (Consulta mode only)
  useEffect(() => {
    if (mode !== 'consulta') return
    const ac = new AbortController()
    let mounted = true
    const t = setTimeout(async () => {
      const q = prodQuery.trim()
      if (q.length < 2) {
        setProdSuggestions([])
        return
      }
      try {
        const auxPath = `${process.env.REACT_APP_API_URL || '/api'}/estoque/produtos`
        const params = new URLSearchParams()
        params.set('search', q)
        params.set('limit', '50')
        if (fabConsulta) params.set('fab', fabConsulta)
        if (groupConsulta) params.set('grupo', String(groupConsulta).padStart(3, '0'))
        const resp = await fetch(`${auxPath}?${params.toString()}`, { credentials: 'include', signal: ac.signal })
        if (!mounted) return
        if (resp.ok) {
          const data = await resp.json()
          setProdSuggestions(Array.isArray(data) ? data : [])
          setProdOpen(true)
        } else {
          setProdSuggestions([])
        }
      } catch (err:any) {
        if (err.name === 'AbortError') return
        console.error('[FilterPanel] erro ao carregar produtos', err)
      }
    }, 300)

    return () => { mounted = false; ac.abort(); clearTimeout(t) }
  }, [prodQuery, fabConsulta, groupConsulta, mode])

  const apply = () => {
    if (mode === 'cadastro') {
      const filters: any = {}
      if (searchText.trim()) filters.search = searchText.trim()
      if (fabCadastro !== '') filters.fab = fabCadastro
      if (groupCadastro !== '') filters.grupo = String(groupCadastro).padStart(3, '0')
      onChange(filters)
    } else {
      const filters: any = { codprod, somenteComSaldo: onlySaldo }
      if (fabConsulta) filters.fab = fabConsulta
      if (groupConsulta) filters.grupo = String(groupConsulta).padStart(3, '0')
      onChange(filters)
    }
  }

  // Auto apply filters for Cadastro mode when state changes
  useEffect(() => {
    if (mode === 'cadastro') {
      apply()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, fabCadastro, groupCadastro, mode])

  // Apply default query filters once on mount for Consulta mode (matching original behavior)
  useEffect(() => {
    if (mode === 'consulta') {
      apply()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      apply()
    }
  }

  const [fabCadastroQuery, setFabCadastroQuery] = useState('')
  const [fabCadastroOpen, setFabCadastroOpen] = useState(false)
  const [groupCadastroQuery, setGroupCadastroQuery] = useState('')
  const [groupCadastroOpen, setGroupCadastroOpen] = useState(false)

  if (mode === 'cadastro') {
    return (
      <div className="sp-card" style={{ padding: '12px 20px', marginBottom: 0, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
          {/* BUSCA */}
          <div style={{ flex: '2 1 280px', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center', pointerEvents: 'none', fontSize: 15 }}>
                <FontAwesomeIcon icon={faSearch} />
              </span>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: 42, height: 42, borderRadius: 6, border: '2px solid #e5e7eb', fontSize: 14, margin: 0, boxSizing: 'border-box' }}
                placeholder="Buscar produto..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* FILTRO CAT. (FABRICANTE) */}
          <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <input
              className="form-control"
              style={{ height: 42, borderRadius: 6, border: '2px solid #e5e7eb', fontSize: 14, margin: 0, boxSizing: 'border-box', paddingRight: 8, paddingLeft: 10 }}
              placeholder="Cat. (Fabricante)"
              value={fabCadastroQuery}
              onChange={e => { setFabCadastroQuery(e.target.value); setFabCadastro(''); setFabCadastroOpen(true) }}
              onFocus={() => setFabCadastroOpen(true)}
              onBlur={() => setTimeout(() => setFabCadastroOpen(false), 150)}
            />
            {fabCadastroOpen && (
              <div className="list-group position-absolute" style={{ zIndex: 50, width: '100%', maxHeight: 220, overflow: 'auto', top: '100%', left: 0 }}>
                <button className="list-group-item list-group-item-action py-1 px-2 small" style={{ fontSize: 12 }} onMouseDown={() => { setFabCadastro(''); setFabCadastroQuery(''); setFabCadastroOpen(false) }}>Cat. (Todos)</button>
                {fabricantes.filter(f => (`${f.codigo} ${f.descricao}`.toLowerCase()).includes((fabCadastroQuery || '').toLowerCase())).map(f => (
                  <button key={f.codigo} className="list-group-item list-group-item-action py-1 px-2 small" style={{ fontSize: 12 }} onMouseDown={() => { setFabCadastro(String(f.codigo)); setFabCadastroQuery(`${f.codigo} - ${f.descricao}`); setFabCadastroOpen(false) }}>{`${f.codigo} - ${f.descricao}`}</button>
                ))}
              </div>
            )}
          </div>

          {/* FILTRO GRUPO */}
          <div style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', position: 'relative' }}>
            <input
              className="form-control"
              style={{ height: 42, borderRadius: 6, border: '2px solid #e5e7eb', fontSize: 14, margin: 0, boxSizing: 'border-box', paddingRight: 8, paddingLeft: 10 }}
              placeholder="Grupo"
              value={groupCadastroQuery}
              onChange={e => { setGroupCadastroQuery(e.target.value); setGroupCadastro(''); setGroupCadastroOpen(true) }}
              onFocus={() => setGroupCadastroOpen(true)}
              onBlur={() => setTimeout(() => setGroupCadastroOpen(false), 150)}
            />
            {groupCadastroOpen && (
              <div className="list-group position-absolute" style={{ zIndex: 50, width: '100%', maxHeight: 220, overflow: 'auto', top: '100%', left: 0 }}>
                <button className="list-group-item list-group-item-action py-1 px-2 small" style={{ fontSize: 12 }} onMouseDown={() => { setGroupCadastro(''); setGroupCadastroQuery(''); setGroupCadastroOpen(false) }}>Grupo (Todos)</button>
                {groups.filter(g => ((`${String(g.codigogru || g.codigo).padStart(3, '0')} ${g.descr_gru || g.descricao}`) || '').toLowerCase().includes((groupCadastroQuery || '').toLowerCase())).map(g => {
                  const code = String(g.codigogru || g.codigo).padStart(3, '0')
                  const desc = g.descr_gru || g.descricao || ''
                  return (
                    <button key={code} className="list-group-item list-group-item-action py-1 px-2 small" style={{ fontSize: 12 }} onMouseDown={() => { setGroupCadastro(code); setGroupCadastroQuery(`${code} - ${desc}`); setGroupCadastroOpen(false) }}>{`${code} - ${desc}`}</button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* BOTÃO GERENCIAL */}
        {typeof onToggleGerencial === 'function' && (
          <div className="d-flex justify-content-start mt-2 pt-2 border-top" style={{ borderTopStyle: 'dashed' }}>
            <button 
              className={`btn btn-sm ${showGerencial ? 'btn-secondary' : 'btn-outline-secondary'}`} 
              style={{ fontSize: 12, borderRadius: 4 }}
              onClick={onToggleGerencial}
            >
              {showGerencial ? 'Ocultar Painel Gerencial' : 'Exibir Painel Gerencial'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // mode === 'consulta' (perfect match to the user's uploaded image)
  return (
    <div className="card p-2 mb-2" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#ffffff' }}>
      <div className="row g-2 align-items-center mb-2">
        <div className="col-md-2" style={{ position: 'relative' }}>
          <input
            className="form-control"
            style={{ height: 38, fontSize: 13, border: '2px solid #e2e8f0', borderRadius: 6 }}
            placeholder="Categoria"
            value={fabQuery || (fabricantes.find(x=>x.codigo===fabConsulta) ? `${fabricantes.find(x=>x.codigo===fabConsulta)?.codigo} - ${fabricantes.find(x=>x.codigo===fabConsulta)?.descricao}` : '')}
            onChange={e=>{ setFabQuery(e.target.value); setFabConsulta(''); setFabOpen(true) }}
            onFocus={()=>setFabOpen(true)}
            onBlur={()=>setTimeout(()=>setFabOpen(false), 150)}
          />
          {fabOpen && (
            <div className="list-group position-absolute" style={{ zIndex: 50, width: '100%', maxHeight: 200, overflow: 'auto' }}>
              <button className="list-group-item list-group-item-action py-1 px-2 small" onMouseDown={()=>{ setFabConsulta(''); setFabQuery(''); setFabOpen(false) }}>Todos os fabricantes</button>
              {fabricantes.filter(f => (`${f.codigo} ${f.descricao}`.toLowerCase()).includes((fabQuery||'').toLowerCase())).map(f => (
                <button key={f.codigo} className="list-group-item list-group-item-action py-1 px-2 small" onMouseDown={()=>{ setFabConsulta(String(f.codigo)); setFabQuery(`${f.codigo} - ${f.descricao}`); setFabOpen(false) }}>{`${f.codigo} - ${f.descricao}`}</button>
              ))}
            </div>
          )}
        </div>
        <div className="col-md-2" style={{ position: 'relative' }}>
          <input
            className="form-control"
            style={{ height: 38, fontSize: 13, border: '2px solid #e2e8f0', borderRadius: 6 }}
            placeholder="Grupo"
            value={groupQuery || (groups.find(x=> String(x.codigogru||x.codigo).padStart(3,'0')===groupConsulta) ? `${String(groups.find(x=> String(x.codigogru||x.codigo).padStart(3,'0')===groupConsulta)?.codigogru || groups.find(x=> String(x.codigogru||x.codigo).padStart(3,'0')===groupConsulta)?.codigo).padStart(3,'0')} - ${groups.find(x=> String(x.codigogru||x.codigo).padStart(3,'0')===groupConsulta)?.descr_gru || groups.find(x=> String(x.codigogru||x.codigo).padStart(3,'0')===groupConsulta)?.descricao}` : '')}
            onChange={e=>{ setGroupQuery(e.target.value); setGroupConsulta(''); setGroupOpen(true) }}
            onFocus={()=>setGroupOpen(true)}
            onBlur={()=>setTimeout(()=>setGroupOpen(false), 150)}
          />
          {groupOpen && (
            <div className="list-group position-absolute" style={{ zIndex: 50, width: '100%', maxHeight: 200, overflow: 'auto' }}>
              <button className="list-group-item list-group-item-action py-1 px-2 small" onMouseDown={()=>{ setGroupConsulta(''); setGroupQuery(''); setGroupOpen(false) }}>Todos os grupos</button>
              {groups.filter(g => ((`${String(g.codigogru||g.codigo).padStart(3,'0')} ${g.descr_gru||g.descricao}`) || '').toLowerCase().includes((groupQuery||'').toLowerCase())).map(g => {
                const code = String(g.codigogru||g.codigo).padStart(3,'0')
                const desc = g.descr_gru || g.descricao || ''
                return (
                  <button key={code} className="list-group-item list-group-item-action py-1 px-2 small" onMouseDown={()=>{ setGroupConsulta(code); setGroupQuery(`${code} - ${desc}`); setGroupOpen(false) }}>{`${code} - ${desc}`}</button>
                )
              })}
            </div>
          )}
        </div>
        <div className="col-md-8" style={{ position: 'relative' }}>
          <input
            className="form-control"
            style={{ height: 38, fontSize: 13, border: '2px solid #e2e8f0', borderRadius: 6 }}
            placeholder="Código produto ou descrição"
            value={prodQuery || codprod}
            onChange={e=>{ setProdQuery(e.target.value); setCodprod('') }}
            onFocus={()=>setProdOpen(true)}
            onBlur={()=>setTimeout(()=>setProdOpen(false), 150)}
          />
          {prodOpen && prodSuggestions.length > 0 && (
            <div className="list-group position-absolute" style={{ zIndex: 50, width: '100%', maxHeight: 250, overflow: 'auto' }}>
              {prodSuggestions.map(p => (
                <button key={p.codigo} className="list-group-item list-group-item-action py-1 px-2 small" onMouseDown={()=>{ setCodprod(p.codigo); setProdQuery(p.codigo + ' - ' + p.descricao); setProdOpen(false) }}>{p.codigo} — {p.descricao}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          {typeof onToggleGerencial === 'function' && (
            <button 
              className={`btn btn-sm ${showGerencial ? 'btn-secondary' : 'btn-outline-secondary'}`} 
              style={{ fontSize: 11, borderRadius: 4, fontWeight: 700, padding: '4px 12px' }}
              onClick={onToggleGerencial}
            >
              GERENCIAL
            </button>
          )}
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
            <input 
              id="onlySaldo" 
              type="checkbox" 
              checked={onlySaldo} 
              className="form-check-input"
              onChange={e => setOnlySaldo(e.target.checked)} 
              style={{ width: 16, height: 16, cursor: 'pointer', margin: 0 }}
            />
            <label htmlFor="onlySaldo" style={{ fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
              Somente com saldo
            </label>
          </div>
          <button 
            className="btn btn-link btn-sm p-0 text-decoration-none" 
            style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}
            onClick={apply}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterPanel
