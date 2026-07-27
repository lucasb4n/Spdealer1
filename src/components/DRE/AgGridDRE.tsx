import React, { useEffect, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';

type DreRow = {
  fluxo_caixa_linha_id: number;
  codigo_linha: string;
  descricao: string;
  tipo_linha: string;
  ordem: number;
  ano_mes: string; // YYYY-MM-DD (first of month)
  valor_esperado: number | null;
  valor_real: number | null;
  registros: number | null;
};

type Props = {
  // Suporta props do DashboardRenderEngine: config/widgetId/data/visual
  config?: any;
  widgetId?: number;
  data?: any;
  visual?: any;
  apiUrl?: string; // e.g. /api/v2/dre/data
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
};

const AgGridDRE: React.FC<Props> = ({ apiUrl = '/api/v2/dre/data', start, end }) => {
  const [rowData, setRowData] = useState<DreRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams();
    if (start) q.set('start', start);
    if (end) q.set('end', end);
    const url = apiUrl + (q.toString() ? `?${q.toString()}` : '');
    setLoading(true);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((data: DreRow[]) => setRowData(data))
      .catch((err) => console.error('Erro ao carregar DRE:', err))
      .finally(() => setLoading(false));
  }, [apiUrl, start, end]);

  // Use `any` for columnDefs to avoid strict nested field path typing issues
  const columnDefs = useMemo(() => [
    { field: 'codigo_linha', headerName: 'Código', pinned: 'left', width: 160 },
    { field: 'descricao', headerName: 'Descrição', flex: 1, minWidth: 240 },
    { field: 'tipo_linha', headerName: 'Tipo', width: 140 },
    { field: 'ordem', headerName: 'Ordem', width: 100, type: 'numericColumn' },
    { field: 'ano_mes', headerName: 'Mês', width: 140 },
    {
      field: 'valor_esperado',
      headerName: 'Valor Esperado',
      valueFormatter: (p: any) => p.value != null ? p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
      width: 160,
      cellClass: 'ag-right-aligned-cell'
    },
    {
      field: 'valor_real',
      headerName: 'Valor Real',
      valueFormatter: (p: any) => p.value != null ? p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '',
      width: 160,
      cellClass: 'ag-right-aligned-cell'
    },
    { field: 'registros', headerName: 'Registros', width: 120 }
  ], []);

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), []);

  const exportCsv = () => {
    const grid = (document.querySelector('.ag-root') as any)?._componentRef?.gridOptions.api;
    if (grid) grid.exportDataAsCsv({ fileName: 'dre_export.csv' });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={exportCsv} className="btn btn-sm btn-outline-secondary">Exportar CSV</button>
        <div style={{ alignSelf: 'center' }}>{loading ? 'Carregando...' : `Linhas: ${rowData.length}`}</div>
      </div>

      <div className="ag-theme-alpine" style={{ height: '650px', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          // cast columnDefs to any to satisfy AgGrid React generic typings
          columnDefs={columnDefs as any}
          defaultColDef={defaultColDef}
          animateRows={true}
          rowSelection="single"
          suppressRowClickSelection={true}
        />
      </div>
    </div>
  );
};

export default AgGridDRE;













