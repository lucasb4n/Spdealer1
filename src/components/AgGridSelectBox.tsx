"text/javascript; charset=utf-8"
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface SelectBoxRow {
  id?: number;
  tipo: string;
  valor: string;
  descricao: string;
}

interface CodeArrowButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

const CodeArrowButton: React.FC<CodeArrowButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        backgroundColor: '#3b82f6',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: 'white',
        width: '32px',
        height: '32px',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#2563eb';
          e.currentTarget.style.transform = 'translateX(2px)';
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#3b82f6';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    </button>
  );
};

interface AgGridSelectBoxProps {
  rowData: SelectBoxRow[];
  selectBoxColumnDefs: any[];
  onRowSelected?: (row: SelectBoxRow) => void;
  onSaveCodeArrow?: (row: SelectBoxRow) => void;
}

export const AgGridSelectBox = forwardRef<any, AgGridSelectBoxProps>(({ rowData, selectBoxColumnDefs, onRowSelected, onSaveCodeArrow }, ref) => {
  const gridRef = React.useRef<any>(null);

  const [selectedRow, setSelectedRow] = useState<SelectBoxRow | null>(null);

  useEffect(() => {
    if (rowData && rowData.length > 0 && !selectedRow) {
      setSelectedRow(rowData[0]);
      onRowSelected?.(rowData[0]);
    }
  }, [rowData, selectedRow, onRowSelected]);

  const handleRowClick = (event: any) => {
    const row = event.api.getSelectedNodes()[0];
    if (row && row.data) {
      setSelectedRow(row.data);
      onRowSelected?.(row.data);
    }
  };

  useImperativeHandle(ref, () => ({
    getSelectedRow: () => selectedRow,
    setSelectedRow: (row: SelectBoxRow | null) => {
      setSelectedRow(row);
      onRowSelected?.(row!);
    }
  }));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CodeArrowButton
          onClick={() => onSaveCodeArrow?.(selectedRow!)}
          disabled={!selectedRow}
        />
      </div>
      
      <div className="ag-theme-alpine" style={{ width: '100%', flex: 1 }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={selectBoxColumnDefs}
          rowSelection="single"
          onRowSelected={handleRowClick}
          defaultColDef={{
            resizable: true,
            filter: true,
            floatingFilter: true,
            sortable: true
          }}
          rowHeight={45}
          theme="legacy"
        />
      </div>
    </div>
  );
});

export default AgGridSelectBox;
