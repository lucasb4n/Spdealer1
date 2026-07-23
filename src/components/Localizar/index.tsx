import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export interface LocalizarProps {
  title?: string;
  columns: any[];
  data: any[];
  editable?: boolean;
  paginationPageSize?: number;
  onRowSelected?: (rows: any[]) => void;
  onRowDoubleClicked?: (row: any) => void;
  onCellEdit?: (row: any, col: any, newValue: any) => void;
  onCellClicked?: (params: any) => void;
  // Elementos adicionais a serem renderizados na mesma linha do campo de busca
  searchControls?: React.ReactNode;
  gridOptions?: any;
  components?: { [key: string]: any };
  rowSelectionMode?: 'singleRow' | 'multiRow';
}

export const Localizar: React.FC<LocalizarProps> = ({
  title,
  columns,
  data,
  editable = true,
  paginationPageSize = 50,
  rowSelectionMode = 'multiRow',
  onRowSelected,
  onRowDoubleClicked,
  onCellEdit,
  onCellClicked,
  searchControls,
  gridOptions,
  components,
}) => {
  const [filteredData, setFilteredData] = useState(data);
  const [searchTerm, setSearchTerm] = useState('');
  const gridRef = React.useRef<AgGridReact>(null);

  // Atualizar dados filtrados quando data ou searchTerm muda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = data.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(term);
        });
      });
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  const columnDefs = useMemo(() => columns.map(col => ({
    ...col,
    editable: editable && (col.editable !== false),
    filter: true,
    sortable: true,
  })), [columns, editable]);

  // debug: expose columnDefs, gridOptions and components for quick inspection in browser console
  // eslint-disable-next-line no-console
  console.debug('Localizar columnDefs:', columnDefs, 'gridOptions:', gridOptions, 'components:', components);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 120,
    sortable: true,
    filter: true,
  }), []);

  return (
    <div className="aggrid-localizar-card" style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(34,51,106,0.06)', padding: '12px', margin: '8px 0', width: '100%', maxWidth: '100%' }}>
      {title && <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px', color: '#333' }}>{title}</div>}
      
      {/* 🔥 NOVO: Campo de busca */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por qualquer campo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              padding: '10px 16px',
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Limpar
          </button>
        )}
        {/* Espaço para controles adicionais (ex.: filtros) */}
        {searchControls}
        {/* Export CSV button (ag-grid-community native) */}
        <button
          onClick={() => {
            try {
              const api = gridRef.current?.api;
              if (api) {
                api.exportDataAsCsv({
                  fileName: `${title ? title.replace(/[^a-zA-Z0-9-_]/g, '_') : 'export'}.csv`,
                  allColumns: true,
                  columnSeparator: ';',
                });
              }
            } catch (err) {
              // fail silently but log for debugging
              // eslint-disable-next-line no-console
              console.error('Erro ao exportar CSV:', err);
            }
          }}
          style={{
            padding: '10px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Exportar CSV
        </button>
        {/* fim dos controles de busca */}
      </div>

      {/* Informação de registros */}
      <div style={{ marginBottom: '10px', fontSize: '13px', color: '#6b7280' }}>
        {filteredData.length > 0 ? (
          <span>
            Exibindo <strong>{filteredData.length}</strong> de <strong>{data.length}</strong> registro(s)
          </span>
        ) : (
          <span style={{ color: '#ef4444' }}>Nenhum registro encontrado</span>
        )}
      </div>

      <div className="ag-theme-alpine" style={{ height: 620, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          theme="legacy"
          rowData={filteredData}
          columnDefs={columnDefs}
          gridOptions={gridOptions}
          defaultColDef={defaultColDef}
          // pass React components mapping for custom renderers
          // @ts-ignore: ag-Grid types may vary between versions but runtime accepts this prop
          components={components}
          rowSelection={{ mode: rowSelectionMode, enableSelectionWithoutKeys: true }}
          animateRows={true}
          pagination={true}
          paginationPageSize={paginationPageSize}
          onRowSelected={(e) => {
            if (onRowSelected && gridRef.current) {
              const selectedRows = gridRef.current.api.getSelectedRows();
              onRowSelected(selectedRows);
            }
          }}
          onRowDoubleClicked={(e) => {
            if (onRowDoubleClicked) onRowDoubleClicked(e.data);
          }}
          onCellClicked={(e) => {
            if (onCellClicked) onCellClicked(e);
          }}
        />
      </div>
    </div>
  );
};

export default Localizar;













