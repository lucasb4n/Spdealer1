import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const SqlEditor: React.FC = () => {
  const [sql, setSql] = useState<string>('SELECT * FROM ');
  const [tables, setTables] = useState<string[]>([]);
  const [dictTables, setDictTables] = useState<any[]>([]);
  const [dictColumns, setDictColumns] = useState<Record<string, any[]>>({});
  const [selectedTable, setSelectedTable] = useState<string|undefined>(undefined);
  const [results, setResults] = useState<any[]>([]);
  const [layout, setLayout] = useState<any|null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/reports/tables')
      .then((r) => r.json())
      .then(setTables)
      .catch(() => setTables([]));
    fetch('/api/reports/history')
      .then((r) => r.json())
      .then((h) => setHistory(Array.isArray(h) ? h : []))
      .catch(() => setHistory([]));
    // carregar dictionary tables para o designer
    fetch('/api/v1/dictionary/tables')
      .then(r=>r.json())
      .then((data)=>{ setDictTables(Array.isArray(data)?data:[]); if(Array.isArray(data) && data.length>0) setSelectedTable(data[0].table_name); })
      .catch(()=>setDictTables([]));
  }, []);

  // Ao mudar a tabela selecionada, carregar colunas do dicionário (se ainda não carregadas)
  useEffect(()=>{
    if (!selectedTable) return;
    if (dictColumns[selectedTable]) return;
    fetch(`/api/v1/dictionary/tables/${encodeURIComponent(selectedTable)}/columns`)
      .then(r=>r.json())
      .then(cols=>setDictColumns(prev=>({...prev, [selectedTable]: Array.isArray(cols)?cols:[]})))
      .catch(()=>setDictColumns(prev=>({...prev, [selectedTable]: []})));
  },[selectedTable]);

  const getAvailableFields = () => {
    const groups: Array<{table:string, cols:any[]}> = [];
    if (selectedTable && dictColumns[selectedTable]) {
      const mainCols = dictColumns[selectedTable].filter((c:any)=> Number(c.is_report)===1 || c.is_report===true || c.isReport===1);
      groups.push({table: selectedTable, cols: mainCols});
      // foreign keys
      const fks = dictColumns[selectedTable].filter((c:any)=> c.is_foreign_key===1 || c.is_foreign_key===true || c.isForeignKey===true);
      for (const fk of fks) {
        const refTable = fk.table || fk.tableName || fk.table_name;
        if (refTable) {
          if (!dictColumns[refTable]) {
            fetch(`/api/v1/dictionary/tables/${encodeURIComponent(refTable)}/columns`).then(r=>r.json()).then(cols=>setDictColumns(prev=>({...prev,[refTable]:Array.isArray(cols)?cols:[]}))).catch(()=>setDictColumns(prev=>({...prev,[refTable]:[]})));
          }
          const cols = dictColumns[refTable] ? dictColumns[refTable].filter((c:any)=> Number(c.is_report)===1 || c.is_report===true || c.isReport===1) : [];
          groups.push({table: refTable, cols});
        }
      }
    }
    return groups;
  };

  const run = async () => {
    setError(null);
    setResults([]);
    try {
      const res = await fetch('/api/reports/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, limit: 200 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || JSON.stringify(data));
        return;
      }
      setResults(data.rows || []);
      // refresh history
      fetch('/api/reports/history').then(r=>r.json()).then(h=>setHistory(Array.isArray(h)?h:[]));
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const formatSql = () => {
    // Simple normalize: trim trailing spaces and ensure nice linebreaks after commas
    let s = sql.trim();
    s = s.replace(/\s+,\s+/g, ', ');
    s = s.replace(/\s+FROM\s+/i, '\nFROM ');
    s = s.replace(/\s+WHERE\s+/i, '\nWHERE ');
    setSql(s);
  };

  return (
    <div style={{ padding: 12 }}>
      <h2>Editor SQL — Relatórios Dinâmicos</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <textarea value={sql} onChange={e=>setSql(e.target.value)} rows={12} style={{ width: '100%', fontFamily: 'monospace' }} />
          <div style={{ marginTop: 8 }}>
            <button onClick={run}>🚀 Executar</button>
            <button onClick={formatSql} style={{ marginLeft: 8 }}>🧹 Format</button>
          </div>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </div>

        <div style={{ width: 320 }}>
          <section>
            <h4>Tabelas</h4>
            <div style={{ maxHeight: 120, overflow: 'auto' }}>
              {tables.map(t => (
                <div key={t}><button onClick={() => setSql(s => s + t)} style={{ margin: 4 }}>{t}</button></div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 8 }}>
            <h4>Dictionary</h4>
            <div>
              <label>Tabela:</label>
              <select value={selectedTable} onChange={e=>setSelectedTable(e.target.value)} style={{ width:'100%' }}>
                <option value={undefined as any}>-- selecione --</option>
                {dictTables.map(dt=> <option key={dt.table_name} value={dt.table_name}>{dt.table_label || dt.table_name}</option>)}
              </select>
            </div>
            <div style={{ marginTop:8, maxHeight:220, overflow:'auto' }}>
              {getAvailableFields().map(group=> (
                <div key={group.table} style={{ marginBottom:8 }}>
                  <div style={{ fontWeight:700 }}>{group.table}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                    {group.cols.map((c:any)=> (
                      <div key={c.column_name} draggable
                        onDragStart={(ev)=>{ ev.dataTransfer.setData('application/json', JSON.stringify({ table: group.table, column: c.column_name, label: c.alias || c.column_name })); }}
                        style={{ padding:'6px 8px', border:'1px solid #ddd', borderRadius:4, cursor:'grab' }}>
                        {c.alias || c.column_name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 12 }}>
            <h4>Histórico</h4>
            <div style={{ maxHeight: 120, overflow: 'auto' }}>
              {history.map((h, i) => (
                <div key={i}><a href="#" onClick={(e)=>{e.preventDefault(); setSql(h);}}>{h.length>80? h.slice(0,80)+'...':h}</a></div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section style={{ marginTop: 16 }}>
        <h4>Resultados ({results.length})</h4>
        <div style={{ overflow: 'auto', maxHeight: 400 }}>
          {results.length === 0 && <div>Nenhum resultado</div>}
          {results.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                      {Object.keys(results[0]).map(c=> <th key={c} style={{ border: '1px solid #ddd', padding: 6 }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx}>
                        {Object.keys(results[0]).map(c=> <td key={c} style={{ border: '1px solid #eee', padding: 6 }}>{String(r[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

        <section style={{ marginTop: 16 }}>
          <h4>Designer (Ajustar visual do relatório)</h4>
          {results.length===0 && <div>Execute a query para habilitar o designer</div>}
          {results.length>0 && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}
                   onDragOver={(e)=>{ e.preventDefault(); }}
                   onDrop={(e)=>{
                     e.preventDefault();
                     try {
                       const raw = e.dataTransfer.getData('application/json');
                       if (!raw) return;
                       const info = JSON.parse(raw);
                       const fieldName = info.column || info.field;
                       const label = info.label || fieldName;
                       const cols = layout?.columns ? [...layout.columns] : Object.keys(results[0]).map(k=>({field:k,label:k,visible:true,total:false}));
                       // avoid duplicates by field
                       if (!cols.find((x:any)=>x.field===fieldName)) {
                         cols.push({ field: fieldName, label });
                         setLayout({...layout, columns: cols});
                       }
                     } catch (ex) { console.error('drop parse', ex); }
                   }}>
                <p>Colunas (arrume ordem / habilite total / agrupe) — arraste campos aqui</p>
                <DragDropContext onDragEnd={(result: DropResult)=>{
                  const { destination, source } = result;
                  if (!destination) return;
                  const cols = layout?.columns ? [...layout.columns] : Object.keys(results[0]).map(k=>({field:k,label:k,visible:true,total:false}));
                  const [removed] = cols.splice(source.index, 1);
                  cols.splice(destination.index, 0, removed);
                  setLayout({...layout, columns: cols});
                }}>
                  <Droppable droppableId="designer-columns">
                    {(provided)=> (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {(() => {
                          const designerColumns = layout?.columns && layout.columns.length>0 ? layout.columns : Object.keys(results[0]).map(k=>({field:k,label:k,visible:true,total:false}));
                          return designerColumns.map((col:any, idx:number) => (
                            <Draggable key={col.field} draggableId={String(col.field)} index={idx}>
                              {(providedDr)=>(
                                <div ref={providedDr.innerRef} {...providedDr.draggableProps} {...providedDr.dragHandleProps} style={{ display:'flex', alignItems:'center', gap:8, padding:4, borderBottom:'1px solid #eee', background:'#fff', ...providedDr.draggableProps.style }}>
                                  <div style={{ width:140 }}>{col.label}</div>
                                  <div style={{ display:'flex', gap:6 }}>
                                    <label style={{ marginLeft: 8 }}><input type="checkbox" checked={!!col.total} onChange={(e)=>{
                                      const cols = layout?.columns ? [...layout.columns] : Object.keys(results[0]).map(k=>({field:k,label:k,visible:true,total:false}));
                                      const i = cols.findIndex((x:any)=>x.field===col.field);
                                      if (i===-1) cols.push({field:col.field,label:col.label,visible:true,total:e.target.checked}); else cols[i].total = e.target.checked;
                                      setLayout({...layout, columns:cols});
                                    }} /> Total</label>
                                    <button style={{ marginLeft: 8 }} onClick={()=>{
                                      const cols = layout?.columns ? [...layout.columns] : Object.keys(results[0]).map(k=>({field:k,label:k,visible:true,total:false}));
                                      const i = cols.findIndex((x:any)=>x.field===col.field);
                                      if (i>-1) { cols.splice(i,1); setLayout({...layout, columns:cols}); }
                                    }}>✖</button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ));
                        })()}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
              <div style={{ width:300 }}>
                <p>Opções</p>
                <label>Font size: <input type="number" value={layout?.fontSize?.replace?.('px','')||12} onChange={(e)=>setLayout({...layout, fontSize: e.target.value+'px'})} style={{ width:80 }} /></label>
                <br />
                <label>Row height (px): <input type="number" value={layout?.rowHeight?.replace?.('px','')||20} onChange={(e)=>setLayout({...layout, rowHeight: e.target.value+'px'})} style={{ width:80 }} /></label>
                <br />
                <div style={{ marginTop:8 }}>
                  <button onClick={async ()=>{
                    // prepare layout default if empty
                    const cols = layout?.columns && layout.columns.length>0 ? layout.columns : Object.keys(results[0]).map(k=>({field:k,label:k,visible:true,total:false}));
                    const payload = { tipo:'receber', templateName:'ContasReceberReport', layout: { ...layout, columns: cols } };
                    try {
                      const res = await fetch('/api/relatorios-jasper/financeiro/export', {
                        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
                      });
                      if (!res.ok) { const txt = await res.text(); alert('Erro: '+txt); return; }
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'ContasReceber.pdf'; document.body.appendChild(a); a.click(); a.remove();
                    } catch (e:any) { alert('Erro exportar: '+e.message); }
                  }}>Exportar PDF (Designer)</button>
                  <button style={{ marginLeft:8 }} onClick={async ()=>{
                    try {
                      const name = window.prompt('Nome do template (ex: meus_relatorios/contas_receber_custom)');
                      if (!name) return;
                      const cols = layout?.columns && layout.columns.length>0 ? layout.columns : Object.keys(results[0]).map(k=>({field:k,label:k,visible:true,total:false}));
                      const defaultLayout = { columns: cols, fontSize: layout?.fontSize || '12px', rowHeight: layout?.rowHeight || '20px' };

                      const fragment = '<!-- Gerado pelo SqlEditor - defaultLayout: ' + JSON.stringify(defaultLayout) + ' -->\n' +
                        '<div th:fragment="content">\n' +
                        '  <h1 th:text="${title ?: \"Relatório\"}">Relatório</h1>\n' +
                        '  <div th:with="rowHeight=${layout?.rowHeight ?: \'20px\'}, fontSize=${layout?.fontSize ?: \'12px\'}">\n' +
                        '    <style>\n' +
                        '      .report-table th, .report-table td { padding: 6px; border:1px solid #ddd }\n' +
                        '      .report-table tbody tr { height: [[${rowHeight}]]; }\n' +
                        '      .report-table { font-size: [[${fontSize}]]; width:100%; border-collapse:collapse }\n' +
                        '    </style>\n' +
                        '    <table class="report-table">\n' +
                        '      <thead>\n' +
                        '        <tr>\n' +
                        '          <th th:each="col : ${columns}" th:text="${col.label}">Col</th>\n' +
                        '        </tr>\n' +
                        '      </thead>\n' +
                        '      <tbody>\n' +
                        '        <tr th:each="row : ${records}">\n' +
                        '          <td th:each="col : ${columns}" th:text="${row[col.field]}">-</td>\n' +
                        '        </tr>\n' +
                        '      </tbody>\n' +
                        '    </table>\n' +
                        '  </div>\n' +
                        '</div>';

                      const res = await fetch('/api/reports/templates', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, content: fragment }) });
                      if (!res.ok) { const txt = await res.text(); alert('Erro ao salvar: '+txt); return; }
                      alert('Template salvo com sucesso');
                    } catch (e:any) { alert('Erro salvar template: '+e.message); }
                  }}>Salvar template</button>
                </div>
              </div>
            </div>
          )}
        </section>
    </div>
  );
};

export default SqlEditor;













