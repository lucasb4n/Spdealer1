import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Função para formatar data de YYYY-MM-DD para DD/MM/YYYY
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 10) return dateStr;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

interface Row {
  date_inv: string;
  categoria: string;
  produto: string;
  descricao: string;
  unid_med: string;
  qtde: number;
  custo_uni: number;
  custo_total: number;
}

interface Props {
  rows: Row[];
  /** optional date string used to build export filename */
  date?: string | null;
}

export interface InventarioGridHandle {
  exportCsv: () => void;
}

const InventarioGrid = forwardRef<InventarioGridHandle, Props>(({ rows, date }, ref) => {
  const gridRef = useRef<AgGridReact>(null);
  const columnDefs = useMemo<ColDef<Row>[]>(() => [
    { field: 'date_inv', headerName: 'Data', width: 120, valueFormatter: (params: any) => formatDate(params.value), filter: 'agSetColumnFilter', filterParams: {
      // load distinct date values from server for the set filter
      values: (params: any) => {
        fetch('/api/v1/invent/dates', { credentials: 'include' })
          .then(async r => {
            const text = await r.text();
            try { return JSON.parse(text); } catch (e) { return null; }
          })
          .then((data: any) => {
            let vals: string[] = [];
            if (Array.isArray(data)) vals = data;
            else if (data && Array.isArray(data.dates)) vals = data.dates;
            else if (data && Array.isArray(data.rows)) vals = data.rows.map((r: any) => r.date_inv || r.date || String(r));
            params.success(vals);
          })
          .catch(() => params.success([]));
      }
    } } as ColDef<Row>,
    { field: 'categoria', headerName: 'Categoria', width: 160, rowGroup: false } as ColDef<Row>,
    { field: 'produto', headerName: 'Produto', width: 160 } as ColDef<Row>,
    { field: 'descricao', headerName: 'Descrição', flex: 1 } as ColDef<Row>,
    { field: 'unid_med', headerName: 'UnidMed', width: 80 } as ColDef<Row>,
    { field: 'qtde', headerName: 'Qtde', width: 100, valueFormatter: (p: any) => p.value } as ColDef<Row>,
    { field: 'custo_uni', headerName: 'CustoUni', width: 120, valueFormatter: (p: any) => Number(p.value || 0).toFixed(2), cellStyle: { textAlign: 'right' } } as ColDef<Row>,
    { field: 'custo_total', headerName: 'CustoTotal', width: 140, valueFormatter: (p: any) => Number(p.value || 0).toFixed(2), cellStyle: { textAlign: 'right' }, aggFunc: 'sum' } as ColDef<Row>,
  ], []);

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), []);

  // remove statusBar usage to avoid requiring enterprise modules registration
  // const statusBar = null; // Removido: não utilizado

  const gridOptions = useMemo(() => ({
    groupIncludeFooter: true,
  }) as unknown as GridOptions, []);

  useImperativeHandle(ref, () => ({
    exportCsv: () => {
      try {
        const api = gridRef.current?.api;
        if (api) {
          const fileName = date ? `Inventario_${date}.csv` : 'Inventario.csv';
          api.exportDataAsCsv({ fileName, allColumns: true, columnSeparator: ';' });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Erro ao exportar CSV do inventario:', err);
      }
    }
  }));

  return (
    <div className="card p-3">
      <div className="ag-theme-alpine" style={{ height: 480, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          gridOptions={gridOptions as any}
        />
      </div>
    </div>
  );
});

export default InventarioGrid;













