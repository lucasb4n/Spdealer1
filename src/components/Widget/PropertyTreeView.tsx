import React from 'react';

interface PropertyTreeViewProps {
  value: any;
  onChange: (v: any) => void;
}

// util: deep clone
function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Normalize group_config.columns: width 1..12 -> convert to flex (number)
function normalizeGroupConfig(root: any) {
  if (!root || typeof root !== 'object') return root;
  const copy = deepClone(root);
  const gc = copy.group_config || copy.group;
  if (!gc) return copy;
  if (!Array.isArray(gc.columns)) return copy;

  gc.columns = gc.columns.map((col: any, idx: number) => {
    if (!col || typeof col !== 'object') return { items: Array.isArray(col) ? col : [], flex: 1 };
    const newCol: any = deepClone(col);

    // Normalize items to array
    if (!Array.isArray(newCol.items)) newCol.items = Array.isArray(newCol.items || []) ? newCol.items : [];

    // If width present, coerce to int 1..12 and convert to fractional flex (width/12)
    if (newCol.width !== undefined && newCol.width !== null) {
      const w = Number(newCol.width);
      if (Number.isNaN(w) || !Number.isFinite(w)) {
        throw new Error(`columns[${idx}].width não é um número válido`);
      }
      let wi = Math.trunc(w);
      if (wi < 1) wi = 1;
      if (wi > 12) wi = 12;
      // convert to fractional flex: e.g., width=6 -> flex = 0.5
      const frac = Math.max(0.01, Math.min(1, wi / 12));
      newCol.flex = Number(frac.toFixed(4));
      delete newCol.width;
    } else if (newCol.flex !== undefined && newCol.flex !== null) {
      const f = Number(newCol.flex);
      if (Number.isNaN(f) || !Number.isFinite(f) || f <= 0) {
        throw new Error(`columns[${idx}].flex deve ser número > 0`);
      }
      newCol.flex = f;
    } else {
      // default
      newCol.flex = 1;
    }

    // Ensure gap is a string with units (leave as-is otherwise)
    if (newCol.gap !== undefined && newCol.gap !== null) {
      newCol.gap = String(newCol.gap);
    }

    return newCol;
  });

  // assign back
  if (copy.group_config) copy.group_config = gc;
  else copy.group = gc;

  return copy;
}

const primitiveInputStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: 12,
  fontFamily: 'monospace',
  width: '100%',
  boxSizing: 'border-box'
};

const NodeRow: React.FC<{ indent: number; children?: React.ReactNode }> = ({ indent, children }) => (
  <div style={{ paddingLeft: indent * 10, display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>{children}</div>
);

function isObject(v: any) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export const PropertyTreeView: React.FC<PropertyTreeViewProps> = ({ value, onChange }) => {
  const [data, setData] = React.useState<any>(() => deepClone(value || {}));
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [editingPath, setEditingPath] = React.useState<string | null>(null);

  React.useEffect(() => {
    setData(deepClone(value || {}));
    setExpanded({});
    setEditingPath(null);
  }, [value]);

  const toggle = (path: string) => setExpanded((s) => ({ ...s, [path]: !s[path] }));

  const setAtPath = (path: (string | number)[], newValue: any) => {
    const copy = deepClone(data);
    let cur: any = copy;
    for (let i = 0; i < path.length - 1; i++) {
      const p = path[i];
      if (cur[p] === undefined) cur[p] = typeof path[i + 1] === 'number' ? [] : {};
      cur = cur[p];
    }
    const last = path[path.length - 1];
    cur[last as any] = newValue;
    setData(copy);
  };

  const deleteAtPath = (path: (string | number)[]) => {
    const copy = deepClone(data);
    let cur: any = copy;
    for (let i = 0; i < path.length - 1; i++) {
      cur = cur[path[i] as any];
      if (cur === undefined) return;
    }
    const last = path[path.length - 1];
    if (Array.isArray(cur)) cur.splice(Number(last), 1);
    else delete cur[last as any];
    setData(copy);
  };

  const addObjectProp = (path: (string | number)[]) => {
    const key = window.prompt('Nome da propriedade (ex: new_prop)');
    if (!key) return;
    const valRaw = window.prompt('Valor inicial (JSON válido) — ex: "", 0, true, { }');
    let parsed: any = null;
    try {
      parsed = valRaw ? JSON.parse(valRaw) : '';
    } catch (e) {
      // treat as string
      parsed = valRaw;
    }
    const copy = deepClone(data);
    let cur: any = copy;
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (cur[p] === undefined) cur[p] = {};
      cur = cur[p];
    }
    cur[key] = parsed;
    setData(copy);
  };

  const addArrayItem = (path: (string | number)[]) => {
    const valRaw = window.prompt('Valor do item (JSON válido) — ex: "", 0, true, { }');
    let parsed: any = null;
    try {
      parsed = valRaw ? JSON.parse(valRaw) : '';
    } catch (e) {
      parsed = valRaw;
    }
    const copy = deepClone(data);
    let cur: any = copy;
    for (let i = 0; i < path.length; i++) {
      cur = cur[path[i] as any];
      if (cur === undefined) return;
    }
    if (!Array.isArray(cur)) return;
    cur.push(parsed);
    setData(copy);
  };

  const renderNode = (node: any, pathArr: (string | number)[], name?: string | number, indent = 0) => {
    const path = pathArr.join('.');
    if (isObject(node)) {
      const keys = Object.keys(node);
      const isExpanded = !!expanded[path];
      return (
        <div key={path}>
          <NodeRow indent={indent}>
            <button type="button" onClick={() => toggle(path)} style={{ width: 22 }}>{isExpanded ? '-' : '+'}</button>
            <strong style={{ minWidth: 120 }}>{name ?? '(obj)'}</strong>
            <span style={{ color: '#6b7280', fontSize: 12 }}>{'{ object }'}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => addObjectProp(pathArr)} style={{ fontSize: 12 }}>+ propriedade</button>
              {pathArr.length > 0 && <button type="button" onClick={() => deleteAtPath(pathArr)} style={{ fontSize: 12 }}>Remover</button>}
            </div>
          </NodeRow>
          {isExpanded && (
            <div>
              {keys.map((k) => renderNode(node[k], [...pathArr, k], k, indent + 1))}
            </div>
          )}
        </div>
      );
    }

    if (Array.isArray(node)) {
      const isExpanded = !!expanded[path];
      return (
        <div key={path}>
          <NodeRow indent={indent}>
            <button type="button" onClick={() => toggle(path)} style={{ width: 22 }}>{isExpanded ? '-' : '+'}</button>
            <strong style={{ minWidth: 120 }}>{name ?? '(array)'}</strong>
            <span style={{ color: '#6b7280', fontSize: 12 }}>{`[ array ] — ${node.length} itens`}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => addArrayItem(pathArr)} style={{ fontSize: 12 }}>+ item</button>
              {pathArr.length > 0 && <button type="button" onClick={() => deleteAtPath(pathArr)} style={{ fontSize: 12 }}>Remover</button>}
            </div>
          </NodeRow>
          {isExpanded && (
            <div>
              {node.map((it: any, idx: number) => renderNode(it, [...pathArr, idx], idx, indent + 1))}
            </div>
          )}
        </div>
      );
    }

    // primitive value
    const display = node === null ? 'null' : String(node);
    const editing = editingPath === path;
    return (
      <NodeRow key={path} indent={indent}>
        <div style={{ width: 22 }} />
        <div style={{ minWidth: 120, color: '#111827' }}>{String(name ?? '')}</div>
        {!editing ? (
          <div style={{ color: '#374151', fontFamily: 'monospace', flex: 1 }}>{display}</div>
        ) : (
          <input
            autoFocus
            style={primitiveInputStyle}
            defaultValue={display === 'null' ? '' : display}
            onBlur={(e) => {
              const raw = e.target.value;
              let parsed: any = raw;
              // try to parse numbers and booleans and JSON
              if (raw === '') parsed = '';
              else if (raw === 'null') parsed = null;
              else if (raw === 'true') parsed = true;
              else if (raw === 'false') parsed = false;
              else if (!Number.isNaN(Number(raw)) && raw.trim() !== '') parsed = Number(raw);
              else {
                try { parsed = JSON.parse(raw); } catch (_e) { parsed = raw; }
              }
              setAtPath(pathArr, parsed);
              setEditingPath(null);
            }}
          />
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {!editing && <button type="button" onClick={() => setEditingPath(path)} style={{ fontSize: 12 }}>Editar</button>}
          <button type="button" onClick={() => deleteAtPath(pathArr)} style={{ fontSize: 12 }}>Remover</button>
        </div>
      </NodeRow>
    );
  };

  const apply = () => {
    try {
      const normalized = normalizeGroupConfig(data);
      onChange(normalized);
      // keep local data in sync with normalized form
      setData(deepClone(normalized));
      // collapse all
      setExpanded({});
      // small visual confirmation
      // eslint-disable-next-line no-alert
      alert('Propriedades aplicadas e normalizadas com sucesso.');
    } catch (err: any) {
      // eslint-disable-next-line no-alert
      alert('Erro na validação: ' + (err?.message || String(err)));
    }
  };

  const cancel = () => {
    setData(deepClone(value || {}));
    setExpanded({});
    setEditingPath(null);
  };

  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13 }}>Propriedades do Widget (Tree)</label>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 6, maxHeight: 420, overflow: 'auto', fontSize: 13 }}>
        {renderNode(data, [], 'root', 0)}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button type="button" onClick={apply} style={{ padding: '6px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13 }}>Aplicar</button>
        <button type="button" onClick={cancel} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13 }}>Cancelar</button>
      </div>
      <div style={{ marginTop: 6, color: '#6b7280', fontSize: 11 }}>
        Dica: para definir larguras em colunas use <code>width</code> (1..12) e o editor irá convertê-lo para <code>flex</code> automaticamente.
      </div>
    </div>
  );
};

export default PropertyTreeView;













