import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import Localizar from '../../../components/Localizar';
import { Button } from '../../../components/ui/Button';

type ReparoRow = {
  rep_codigo?: string;
  rep_modelo?: string;
  rep_descricao?: string;
  rep_qtde?: number;
  rep_fab?: string;
  rep_codprod?: string;
  rep_registro?: string;
};

export default function ManutencaoGrupoReparoList() {
  const [rowData, setRowData] = useState<ReparoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ codigo: '', modelo: '', tipo: 'P', codigo_prod: '', campo2: '', descricao: '', rep_qtde: 0 });
  const [mdsOptions, setMdsOptions] = useState<Array<{ codigo_mds: string; descr_mds: string }>>([]);
  const [masfabOptions, setMasfabOptions] = useState<Array<{ codigo: string; descricao: string }>>([]);
  const [campo2Options, setCampo2Options] = useState<Array<{ value: string; label: string }>>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [targetModelo, setTargetModelo] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const navigate = useNavigate();

  const columns = useMemo(() => [
    { headerName: 'Código', field: 'rep_codigo', minWidth: 160 },
    { headerName: 'Modelo', field: 'rep_modelo', minWidth: 160 },
    { headerName: 'Descrição', field: 'rep_descricao', flex: 1 },
    { headerName: 'Ação', cellRenderer: (params: any) => {
        const data: ReparoRow = params.data || {};
        const id = (data as any).rep_codigo || (data as any).rep_modelo || '';
        return (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button title="Editar" onClick={() => { try { (window as any).openEditRow && (window as any).openEditRow(params.data); } catch(e){ console.debug(e); } }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6 }}>
              <FontAwesomeIcon icon={faPencil} style={{ width: 14, height: 14 }} /> <span style={{ fontSize: 12 }}>Editar</span>
            </button>
            <button title="Excluir" onClick={() => { if (!window.confirm('Confirma exclusão?')) return; try { fetch(`/api/refatorado/reparo/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(r => { if(r.ok) params.api.applyTransaction({ remove: [params.data] }); else alert('Falha ao excluir'); }).catch(()=>alert('Erro ao excluir')); } catch(e){ console.debug(e); } }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6 }}>
              <FontAwesomeIcon icon={faTrash} style={{ width: 14, height: 14 }} /> <span style={{ fontSize: 12 }}>Excluir</span>
            </button>
          </div>
        );
      }, pinned: 'right', width: 160 }
  ], [navigate]);

  // Expor função global temporária que pode ser chamada pelo renderer da grid
  // para abrir o formulário de edição com os dados da linha.
  // Usamos window.openEditRow para evitar re-creating functions inside cellRenderer.
  useEffect(() => {
    (window as any).openEditRow = (row: any) => {
      if (!row) return;
      // debug: log da linha recebida
      try { console.debug('[openEditRow] row=', row); } catch(e){}

      // mapear campos do row para o formulário (tentar várias chaves possíveis)
      const codigo = row.rep_codigo || row.rep_codigo_1 || row.codigo || '';
      const modelo = row.rep_modelo || row.modelo || '';
      const descricao = row.rep_descricao || row.descricao || '';
      const codigoProd = row.rep_fab || row.codigo_prod || row.rep_codigo_prod || '';
      const campo2 = row.rep_codprod || row.rep_campo2 || row.campo2 || '';

      // rep_qtde pode ser string/number/BigDecimal -> transformar em number para input
      let repQtdeVal: any = 0;
      try {
        if (row.rep_qtde == null) repQtdeVal = 0;
        else if (typeof row.rep_qtde === 'number') repQtdeVal = row.rep_qtde;
        else {
          const s = String(row.rep_qtde).replace(',', '.').trim();
          // se for formato 000010000 (inteiro posicional), converter para number simples
          const num = Number(s);
          repQtdeVal = isNaN(num) ? 0 : num;
        }
      } catch (e) { repQtdeVal = 0; }

      // decidir tipo: se rep_fab === 'S' ou codigoProd === 'S' então tipo = 'S'
      const tipo = (String(codigoProd).toUpperCase() === 'S') ? 'S' : 'P';

      // função local para popular opções e formulário
      const applyForm = (cp: string, c2: string) => {
        if (cp) {
          setMasfabOptions((prev: any[]) => {
            try { if (prev.some(p => String(p.codigo) === String(cp))) return prev; } catch(e){}
            return [{ codigo: String(cp), descricao: '' }, ...(prev || [])];
          });
        }
        if (c2) {
          setCampo2Options((prev: any[]) => {
            try { if (prev.some(p => String(p.value) === String(c2))) return prev; } catch(e){}
            return [{ value: String(c2), label: String(c2) }, ...(prev || [])];
          });
        }
        setForm((f: any) => ({ ...(f || {}), codigo, modelo, tipo, codigo_prod: cp || codigoProd, campo2: c2 || campo2, descricao, rep_qtde: repQtdeVal }));
        // se tiver codigo_prod, buscar descrição automática para preencher descricao (caso esteja vazia)
        if ((cp || codigoProd) && (!descricao || descricao === '')) {
          try { fetchAutoDescription(cp || codigoProd); } catch(e){}
        }
        setShowForm(true);
      };

      // se codigo_prod ou campo2 estiverem vazios, tentar buscar registro completo pelo backend
      if ((!codigoProd || !campo2) && codigo && modelo) {
        fetch(`/api/refatorado/reparo?codigo=${encodeURIComponent(codigo)}&modelo=${encodeURIComponent(modelo)}`)
          .then(r => r.ok ? r.json() : null)
          .then((data: any) => {
            if (!data) {
              applyForm(codigoProd, campo2);
              return;
            }
            let found = null;
            if (Array.isArray(data) && data.length) {
              // preferir registro com rep_registro === '02' (manutenção)
              found = data.find((d: any) => String(d.rep_registro) === '02') || data[0];
            } else found = data;
            if (!found) { applyForm(codigoProd, campo2); return; }
            const cp = found.rep_fab || found.codigo_prod || codigoProd || '';
            const c2 = found.rep_codprod || found.rep_campo2 || found.campo2 || campo2 || '';
            applyForm(cp, c2);
          })
          .catch(e => {
            console.warn('openEditRow: falha ao buscar registro completo', e);
            applyForm(codigoProd, campo2);
          });
      } else {
        applyForm(codigoProd, campo2);
      }
    };
    return () => { try { delete (window as any).openEditRow; } catch(e){} };
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/refatorado/reparo')
      .then(r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(data => {
        // debug: log length and sample shape to help diagnose empty grid
        try {
          // eslint-disable-next-line no-console
          console.debug('reparo list fetched, length=', Array.isArray(data) ? data.length : (data ? 1 : 0), 'sample=', Array.isArray(data) && data.length ? data[0] : data);
        } catch (e) { /* ignore */ }
        if (mounted && Array.isArray(data)) setRowData(data as ReparoRow[]);
      })
      .catch(err => {
        console.error('Erro carregando reparo:', err);
        if (mounted) setRowData([]);
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  // carregar opções de modelo (mds)
  useEffect(() => {
    let mounted = true;
    fetch('/api/mds')
      .then(r => r.ok ? r.json() : [])
      .then((data: any) => { if (mounted && Array.isArray(data)) setMdsOptions(data.map((d: any) => ({ codigo_mds: d.codigo_mds, descr_mds: d.descr_mds }))); })
      .catch(e => console.warn('Erro carregando mds options', e));
    return () => { mounted = false; };
  }, []);

  // carregar opções de codigo_fab (masfab) para lista dinâmica
  useEffect(() => {
    let mounted = true;
    fetch('/api/tabelas-auxiliares/masfab')
      .then(r => r.ok ? r.json() : [])
      .then((data: any) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          // mapear descrições possivelmente presentes como `descricao_fab` ou `descricao`
          setMasfabOptions(data.map((d: any) => ({ codigo: d.codigo, descricao: d.descricao_fab || d.descricao || '' })));
        } else {
          setMasfabOptions([]);
        }
      })
      .catch(e => { console.warn('Erro carregando masfab options', e); setMasfabOptions([]); });
    return () => { mounted = false; };
  }, []);

  // carregar opções do Campo 2 dependendo do tipo
  useEffect(() => {
    let mounted = true;
    const tipo = form.tipo;
    const codigoProd = form.codigo_prod;

    // Tipo P -> buscar produtos do estoque filtrando por fab = codigoProd
    if (tipo === 'P') {
      if (!codigoProd) {
        setCampo2Options([]);
        return () => { mounted = false; };
      }
      fetch(`/api/estoque/produtos?fab=${encodeURIComponent(String(codigoProd))}&limit=100`)
        .then(r => r.ok ? r.json() : [])
        .then((data: any) => {
          if (!mounted) return;
          if (Array.isArray(data)) {
            setCampo2Options(data.map((d: any) => {
              const code = d.codigo || d.codprod || String(d.produto || '');
              const desc = d.descricao || d.descr || String(d.descricao || '');
              return { value: code, label: `${code} - ${desc}` };
            }));
          } else {
            setCampo2Options([]);
          }
        })
        .catch(e => { console.warn('Erro carregando estoque/produtos para campo2', e); if (mounted) setCampo2Options([]); });
      return () => { mounted = false; };
    }

    // Tipo S -> carregar lista de TMO (descr_tmo)
    if (tipo === 'S') {
      fetch('/api/servico/manutencao/tipo-tmo')
        .then(r => r.ok ? r.json() : [])
        .then((data: any) => {
          if (!mounted) return;
          if (Array.isArray(data)) {
            setCampo2Options(data.map((d: any) => {
              const code = d.codmo_tmo || d.codmo || String(d.codmo_tmo || '');
              const desc = d.descr_tmo || d.descricao || '';
              return { value: code, label: `${code} - ${desc}` };
            }));
          } else {
            setCampo2Options([]);
          }
        })
        .catch(e => { console.warn('Erro carregando tmo para campo2', e); if (mounted) setCampo2Options([]); });
      return () => { mounted = false; };
    }

    // outros tipos -> limpar
    setCampo2Options([]);
    return () => { mounted = false; };
  }, [form.tipo, form.codigo_prod]);

    // quando código + modelo preenchidos, procurar registro existente e mostrar no preview (apenas se existir no banco)
  useEffect(() => {
    const codigo = (form.codigo || '').toString().trim();
    const modelo = (form.modelo || '').toString().trim();
    if (!codigo || !modelo) {
      setPreviewRows([]);
      return;
    }

    (async () => {
      try {
        const q = `/api/refatorado/reparo?codigo=${encodeURIComponent(codigo)}&modelo=${encodeURIComponent(modelo)}`;
        const resp = await fetch(q);
        if (!resp.ok) {
          setPreviewRows([]);
          return;
        }
        const data = await resp.json();
        const rowsFound = Array.isArray(data) ? data : (data ? [data] : []);
        try { console.debug('preview fetch rowsFound length=', rowsFound.length, 'sample=', rowsFound[0]); } catch (e) {}
        // filtrar apenas registros com rep_registro === '02' para o preview
        const filtered = rowsFound.filter((r: any) => String(r.rep_registro) === '02');
        if (filtered.length > 0) setPreviewRows(filtered);
        else setPreviewRows([]);
      } catch (e) {
        console.warn('Erro buscando reparo por codigo+modelo', e);
        setPreviewRows([]);
      }
    })();
  }, [form.codigo, form.modelo]);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/refatorado/reparo');
      if (!r.ok) throw new Error('Erro');
      const d = await r.json();
      setRowData(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
      setRowData([]);
    } finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // garantir que a descrição (derivada de `descricao`) seja enviada como `rep_descricao` para o backend
      const payload = { ...form, rep_descricao: form.descricao ?? '' };
      const resp = await fetch('/api/refatorado/reparo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('Falha ao salvar');
      setShowForm(false);
      setForm({ codigo: '', modelo: '', tipo: 'P', codigo_prod: '', campo2: '', descricao: '', rep_qtde: 0 });
      await refresh();
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Falha ao salvar registro');
    }
  };

  const fetchAutoDescription = async (codigo: string) => {
    if (!codigo) {
      setForm((f: any) => ({ ...f, descricao: '' }));
      return;
    }
    try {
      const r = await fetch(`/api/refatorado/reparo/descricao?codigo=${encodeURIComponent(codigo)}`);
      if (!r.ok) {
        setForm((f: any) => ({ ...f, descricao: '' }));
        return;
      }
      const d = await r.json();
      // espera { descricao: '...' } ou string
      const desc = (d && (d.descricao || d.descr || d)) || '';
      setForm((f: any) => ({ ...f, descricao: String(desc) }));
    } catch (e) {
      console.warn('fetchAutoDescription failed', e);
      setForm((f: any) => ({ ...f, descricao: '' }));
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h3>Serviço — Manutenção — Grupo de Reparo</h3>
        <div>
          <Button $variant="primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Fechar' : '+ Incluir Registro'}</Button>
        </div>
      </div>

      {showForm ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #e6e6e6', borderRadius: 6, background: '#fafafa' }}>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12 }}>Código</label>
              <input value={form.codigo} onChange={e => setForm((f: any) => ({ ...f, codigo: e.target.value }))} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12 }}>Modelo</label>
                <select value={form.modelo} onChange={e => {
                  const v = e.target.value;
                  const found = mdsOptions.find(m => m.codigo_mds === v);
                  const descr = found ? found.descr_mds : '';
                  setForm((f: any) => ({ ...f, modelo: v, descricao: descr }));
                }}>
                  <option value="">-- selecione --</option>
                  {mdsOptions && mdsOptions.map((opt: any, i: number) => (
                    <option key={`${opt.codigo_mds}-${i}`} value={opt.codigo_mds}>{`${opt.codigo_mds} (${opt.descr_mds})`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12 }}>Descrição</label>
                <input value={form.descricao || ''} readOnly placeholder="descrição automática" style={{ width: '100%', marginTop: 6 }} />
              </div>
            </div>

            <div style={{ marginTop: 6, fontWeight: 600 }}>Dados Produto</div>

            <div>
              <label style={{ display: 'block', fontSize: 12 }}>Tipo</label>
              <select value={form.tipo} onChange={e => {
                const v = e.target.value;
                // ao mudar tipo: se S -> codigo_prod obrigatoriamente 'S' e não editável
                  if (v === 'S') {
                    setForm((f: any) => ({ ...f, tipo: 'S', codigo_prod: 'S', descricao: 'M.O. MECANICA' }));
                  } else {
                    // P -> habilitar lista dinâmica e limpar valor para forçar escolha
                    setForm((f: any) => ({ ...f, tipo: 'P', codigo_prod: '', descricao: '' }));
                  }
              }}>
                <option value="P">P</option>
                <option value="S">S</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.45fr 0.45fr 0.1fr', gap: 8, alignItems: 'start' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12 }}>Código (produto)</label>
                {form.tipo === 'S' ? (
                  <input value={'S'} readOnly style={{ width: '100%', maxWidth: 120, display: 'inline-block' }} />
                ) : (
                  <select value={form.codigo_prod} onChange={e => {
                    const v = e.target.value;
                    const found = masfabOptions.find(m => m.codigo === v);
                    const descricaoFab = found ? found.descricao : '';
                    // preencher `descricao` (usado para rep_descricao) quando produto selecionado
                    setForm((f: any) => ({ ...f, codigo_prod: v, descricao: descricaoFab }));
                    fetchAutoDescription(v);
                  }}>
                    <option value="">-- selecione --</option>
                    {masfabOptions && masfabOptions.map((opt: any, i: number) => (
                      <option key={`${opt.codigo}-${i}`} value={opt.codigo}>{`${opt.codigo} - ${opt.descricao || ''}`}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12 }}>Campo 2</label>
                <select value={form.campo2} onChange={e => setForm((f: any) => ({ ...f, campo2: e.target.value }))}>
                  <option value="">-- selecione --</option>
                  {campo2Options && campo2Options.map((opt: any, i: number) => (
                    <option key={`${opt.value}-${i}`} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12 }}>Qtde</label>
                <input type="number" min={0} value={form.rep_qtde ?? 0} onChange={e => setForm((f: any) => ({ ...f, rep_qtde: e.target.value === '' ? 0 : Number(e.target.value) }))} style={{ width: '100%' }} />
              </div>
            </div>

            

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" className="sp-btn sp-btn--primary">Salvar</button>
              <button type="button" className="sp-btn" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>

          

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview (grid)</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={targetModelo} onChange={e => setTargetModelo(e.target.value)} style={{ padding: '6px 8px' }}>
                  <option value="">-- Enviar Para (modelo) --</option>
                  {mdsOptions && mdsOptions.map((m: any) => <option key={m.codigo_mds} value={m.codigo_mds}>{`${m.codigo_mds} (${m.descr_mds})`}</option>)}
                </select>
                <button className={`sp-btn ${selectMode ? 'sp-btn--primary' : 'sp-btn--primary'}`} onClick={() => {
                  if (!selectMode) {
                    // entrar em modo seleção e alterar rótulo para Confirmar
                    setSelectMode(true);
                    return;
                  }
                  // já em modo seleção -> tentar confirmar
                  if (!targetModelo) { alert('Escolha o modelo "Enviar Para" antes de duplicar.'); return; }
                  if (!selectedRows || selectedRows.length === 0) { alert('Selecione ao menos 1 registro para duplicar.'); return; }
                  setShowConfirmModal(true);
                }} style={{ padding: '6px 10px', borderRadius: 6 }}>
                  {selectMode ? 'Confirmar' : 'Duplicar'}
                </button>
                {selectMode ? (
                  <button className="sp-btn" onClick={() => { setSelectMode(false); setSelectedRows([]); }} style={{ padding: '6px 8px' }}>Cancelar</button>
                ) : null}
              </div>
            </div>

            <Localizar
              title="Preview"
              columns={columns}
              data={previewRows}
              paginationPageSize={10}
              onRowSelected={(rows: any[]) => { setSelectedRows(rows || []); }}
            />

            {showConfirmModal ? (
              <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                <div style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 360 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Confirmar duplicação</div>
                  <div style={{ marginBottom: 12 }}>Duplicar <strong>{selectedRows.length}</strong> registro(s) para o modelo <strong>{targetModelo}</strong> e Código <strong>{form.codigo}</strong>?</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="sp-btn" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
                    <button className="sp-btn sp-btn--primary" onClick={async () => {
                      setDuplicating(true);
                      try {
                        const results: Array<{ ok: boolean; status?: number; msg?: string }> = [];
                        for (const r of selectedRows) {
                          const payload: any = {
                            rep_codigo: form.codigo,
                            rep_modelo: targetModelo,
                            rep_registro: r.rep_registro || '02',
                            rep_descricao: r.rep_descricao || r.descricao || '',
                            rep_codprod: r.rep_codprod || r.rep_campo2 || r.campo2 || '',
                            rep_fab: r.rep_fab || r.codigo_prod || '',
                            rep_qtde: r.rep_qtde ?? 0
                          };
                          try {
                            // Debug: log payload to browser console
                            console.debug('[Duplicar] payload:', payload);
                            // Enviar log ao backend para auditoria (será registrado no server.log)
                            try { await fetch('/api/refatorado/reparo/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'duplicate_attempt', timestamp: new Date().toISOString(), payload }) }); } catch (le) { console.warn('Falha ao enviar log de duplicação', le); }

                            const resp = await fetch('/api/refatorado/reparo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                            if (resp.ok) results.push({ ok: true });
                            else results.push({ ok: false, status: resp.status, msg: await resp.text() });
                          } catch (e: any) {
                            results.push({ ok: false, msg: String(e && e.message ? e.message : e) });
                          }
                        }
                        const failed = results.filter(r => !r.ok);
                        if (failed.length === 0) {
                          alert(`Duplicação concluída: ${results.length} registro(s) criados.`);
                        } else {
                          alert(`Duplicação concluída with ${failed.length} falha(s).`);
                        }
                        // limpar estado e atualizar preview/main
                        setShowConfirmModal(false);
                        setSelectMode(false);
                        setSelectedRows([]);
                        await refresh();
                        // também refetch preview (forçar re-fetch do efeito)
                        try {
                          const q = `/api/refatorado/reparo?codigo=${encodeURIComponent(form.codigo)}&modelo=${encodeURIComponent(form.modelo)}`;
                          const resp = await fetch(q);
                          if (resp.ok) {
                            const d = await resp.json();
                            const rowsFound = Array.isArray(d) ? d : (d ? [d] : []);
                            const filtered = rowsFound.filter((x: any) => String(x.rep_registro) === '02');
                            setPreviewRows(filtered.length ? filtered : []);
                          }
                        } catch (e) { /* ignore */ }
                      } finally {
                        setDuplicating(false);
                      }
                    }}>{duplicating ? 'Duplicando...' : 'Confirmar'}</button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading ? <div>Carregando...</div> : null}
      <Localizar
        title="Serviço — Manutenção — Grupo de Reparo"
        columns={columns}
        data={rowData}
        paginationPageSize={50}
      />
    </div>
  );
}
