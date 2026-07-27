import React, { useState, useEffect } from 'react';
import FlowStudio from './FlowStudio';
import Ajv from 'ajv';
// import flowSchema from '../../refatorado/flow/flow-schema.json'; // TODO: arquivo não existe
const flowSchema = {}; // fallback schema vazio

interface FlowStudioEditorProps {
  flow?: any;
  onClose?: () => void;
  onSaved?: (saved: any) => void;
}

export default function FlowStudioEditor({ flow: initialFlow, onClose, onSaved }: FlowStudioEditorProps) {
  const [current, setCurrent] = useState<any>(initialFlow || { id: '', name: '', params: [], steps: [], connections: [] });
  const [errors, setErrors] = useState<any[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrent(initialFlow || { id: '', name: '', params: [], steps: [], connections: [] });
  }, [initialFlow]);

  const validate = () => {
    try {
      const ajv = new Ajv();
      const validateFn = ajv.compile(flowSchema as any);
      const ok = validateFn(current);
      if (!ok) {
        setErrors(validateFn.errors || []);
        return false;
      }
      setErrors(null);
      return true;
    } catch (e) {
      setErrors([{ message: String(e) }]);
      return false;
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = current;
      const url = '/api/flows';
      const target = payload.id ? `/api/flows/${payload.id}` : url;
      const method = payload.id ? 'PUT' : 'POST';
      const resp = await fetch(target, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`Erro ao salvar flow: ${resp.status} ${body}`);
      }
      const saved = await resp.json().catch(() => null);
      onSaved?.(saved || payload);
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 12, height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>{current?.id ? 'Editar Flow' : 'Novo Flow'}</h4>
        <div>
          <button className="btn btn-sm btn-secondary me-2" onClick={onClose}>Fechar</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>Salvar</button>
        </div>
      </div>

      <div style={{ flex: 1, marginTop: 8, minHeight: 0 }}>
        <FlowStudio flow={current} onChange={(next: any) => setCurrent(next)} />
      </div>

      <div style={{ marginTop: 8 }}>
        {errors && errors.length > 0 && (
          <div style={{ background: '#fff4f4', padding: 8, borderRadius: 6 }}>
            <strong>Erros de validação:</strong>
            <ul>
              {errors.map((err, idx) => (
                <li key={idx}>{String(err.message || err)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}















