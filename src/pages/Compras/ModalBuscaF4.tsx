import React, { useState, useEffect, useCallback } from 'react';
import { Localizar } from '../../components/Localizar';

interface ModalBuscaF4Props {
  title: string;
  fetchUrl: string;
  columns: any[];
  open: boolean;
  onClose: () => void;
  onSelect: (row: any) => void;
}

const ModalBuscaF4: React.FC<ModalBuscaF4Props> = ({ title, fetchUrl, columns, open, onClose, onSelect }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.data ?? []);
      setData(list);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [open, fetchUrl]);

  useEffect(() => {
    load();
  }, [load]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          width: 900,
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: '#1e4e79',
            color: '#fff',
            padding: '12px 16px',
            fontSize: 15,
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {loading && <div style={{ color: '#64748b', fontSize: 14 }}>Carregando...</div>}
          {error && <div style={{ color: '#dc2626', fontSize: 14 }}>Erro: {error}</div>}
          {!loading && !error && (
            <div style={{ minHeight: 300, flex: 1 }}>
              <Localizar
                columns={columns}
                data={data}
                editable={false}
                rowSelectionMode="singleRow"
                onRowDoubleClicked={(row) => {
                  onSelect(row);
                  onClose();
                }}
              />
            </div>
          )}
        </div>
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #e2e8f0',
            fontSize: 12,
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Dê um duplo clique para selecionar</span>
          <button
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalBuscaF4;