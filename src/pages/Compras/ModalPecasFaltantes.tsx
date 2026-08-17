import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface ModalPecasFaltantesProps {
  open: boolean;
  onClose: () => void;
  onSelectItems: (items: any[]) => void;
}

const ModalPecasFaltantes: React.FC<ModalPecasFaltantesProps> = ({ open, onClose, onSelectItems }) => {
  const [search, setSearch] = useState('');
  const [dtInicial, setDtInicial] = useState('');
  const [dtFinal, setDtFinal] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const gridRef = React.useRef<AgGridReact>(null);

  const fetchPecas = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (dtInicial.trim()) params.append('dtInicial', dtInicial.trim());
      if (dtFinal.trim()) params.append('dtFinal', dtFinal.trim());

      const res = await fetch(`/api/compras/pecas-faltantes?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      setData(list);
    } catch (e: any) {
      setError(e?.message || 'Erro ao consultar peças faltantes');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [open, search, dtInicial, dtFinal]);

  useEffect(() => {
    if (open) {
      fetchPecas();
      setSelectedRows([]);
    }
  }, [open, fetchPecas]);

  const columnDefs: any[] = useMemo(
    () => [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 50,
        resizable: false,
      },
      { headerName: 'Fab', field: 'fab', width: 90, sortable: true, filter: true },
      { headerName: 'Codigo', field: 'codigo', width: 140, sortable: true, filter: true },
      { headerName: 'Nome', field: 'nome', flex: 1, sortable: true, filter: true },
      { headerName: 'Qtde', field: 'qtde', width: 100, sortable: true, filter: true },
      {
        headerName: 'Data',
        field: 'data',
        width: 110,
        sortable: true,
        filter: true,
        valueFormatter: (p: any) => {
          if (!p || !p.value) return '';
          const s = String(p.value).trim();
          if (s.includes('-')) {
            const parts = s.split('T')[0].split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
          return s;
        },
      },
    ],
    []
  );

  const handleConfirmSelection = () => {
    if (selectedRows.length > 0) {
      onSelectItems(selectedRows);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
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
          width: 920,
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: '#1e4e79',
            color: '#fff',
            padding: '12px 16px',
            fontSize: 16,
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Peças Faltantes Selecionadas</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                Busca (Código / Nome / Fab)
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchPecas();
                }}
                placeholder="Digite para filtrar..."
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                Data Inicial
              </label>
              <input
                type="date"
                value={dtInicial}
                onChange={(e) => setDtInicial(e.target.value)}
                style={{
                  padding: '7px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                Data Final
              </label>
              <input
                type="date"
                value={dtFinal}
                onChange={(e) => setDtFinal(e.target.value)}
                style={{
                  padding: '7px 8px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={fetchPecas}
              style={{
                background: '#1e4e79',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                height: 35,
              }}
            >
              Filtrar
            </button>
          </div>
        </div>

        {/* Grid Content */}
        <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 340, overflow: 'hidden' }}>
          {loading && <div style={{ padding: 10, color: '#64748b', fontSize: 14 }}>Carregando peças faltantes...</div>}
          {error && <div style={{ padding: 10, color: '#dc2626', fontSize: 14 }}>{error}</div>}

          {!loading && !error && (
            <div className="ag-theme-alpine" style={{ height: 340, width: '100%' }}>
              <AgGridReact
                ref={gridRef}
                rowData={data}
                columnDefs={columnDefs}
                defaultColDef={{ resizable: true }}
                rowSelection="multiple"
                suppressRowClickSelection={true}
                onSelectionChanged={() => {
                  if (gridRef.current) {
                    const selected = gridRef.current.api.getSelectedRows();
                    setSelectedRows(selected);
                  }
                }}
                overlayNoRowsTemplate='<span style="padding: 10px; color: #64748b;">Nenhuma peça faltante localizada.</span>'
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {selectedRows.length === 1
              ? '1 peça selecionada'
              : `${selectedRows.length} peças selecionadas`}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={selectedRows.length === 0}
              style={{
                background: '#1e4e79',
                color: '#fff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: selectedRows.length === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedRows.length === 0 ? 0.5 : 1,
              }}
            >
              Adicionar Selecionadas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPecasFaltantes;
