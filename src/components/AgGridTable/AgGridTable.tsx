import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';

export interface AgGridTableProps {
  rowData: any[];
  columnDefs: any[];
  groupBy?: string[];
  rowClassRules?: Record<string, string>;
  onRowSelected?: (row: any) => void;
  onCellValueChanged?: (params: any) => void;
  height?: number | string;
  theme?: string;
  quickFilterText?: string;
  pinnedBottomRowData?: any[];
  loading?: boolean;
  pagination?: boolean;
  paginationPageSize?: number;
}

export const AgGridTable: React.FC<AgGridTableProps> = ({
  rowData,
  columnDefs,
  groupBy,
  rowClassRules,
  onRowSelected,
  onCellValueChanged,
  height = 400,
  theme = 'ag-theme-alpine',
  quickFilterText,
  pinnedBottomRowData,
  loading,
  pagination = true,
  paginationPageSize = 20,
}) => {
  const gridRef = React.useRef<any>(null);

  // Aplicar quick filter quando o texto mudar
  React.useEffect(() => {
    if (!gridRef.current?.api) return;
    try {
      if (typeof gridRef.current.api.setQuickFilter === 'function') {
        gridRef.current.api.setQuickFilter(quickFilterText || '');
      } else if (typeof gridRef.current.api.setQuickFilterText === 'function') {
        gridRef.current.api.setQuickFilterText(quickFilterText || '');
      }
    } catch (err) {
      console.warn('[AgGridTable] quickFilter application failed:', err);
    }
  }, [quickFilterText]);

  return (
    <div className="ag-theme-quartz" style={{ width: '100%', height }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        groupDisplayType={groupBy ? 'groupRows' : undefined}
        rowClassRules={rowClassRules}
        onRowSelected={onRowSelected}
        onCellValueChanged={onCellValueChanged}
        pinnedBottomRowData={pinnedBottomRowData}
        loading={loading}
        animateRows={true}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        suppressRowClickSelection={false}
        rowSelection="single"
        statusBar={{
          statusPanels: [
            {
              statusPanel: 'agTotalAndFilteredRowCountComponent',
              align: 'left',
            },
            {
              statusPanel: 'agAggregationComponent',
              align: 'right',
            },
          ],
        }}
      />
    </div>
  );
};













