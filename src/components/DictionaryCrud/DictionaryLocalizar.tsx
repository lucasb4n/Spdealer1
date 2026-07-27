import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Button } from '../ui/Button';

type ColumnMeta = {
  column_name: string;
  display_name?: string;
  data_type?: string;
};

export default function DictionaryLocalizar() {
  const { table } = useParams<{ table: string }>();
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!table) return;
    // carregar colunas metadata
    fetch(`/api/dictionary/columns/${table}`)
      .then((r) => r.json())
      .then((data) => setColumns(data || []))
      .catch(() => setColumns([]));

    // carregar dados para localizar (paginado: 100)
    fetch(`/api/refatorado/${table}?limit=100`)
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, [table]);

  const columnDefs = useMemo(() => {
    const defs: any[] = (columns || []).map((c) => ({
      headerName: c.display_name || c.column_name,
      field: c.column_name,
      sortable: true,
      filter: true,
      resizable: true,
    } as any));
    // coluna de ações (usar any para compatibilidade com tipos do ag-grid)
    defs.push({
      headerName: 'Ações',
      field: '__actions',
      cellRenderer: (params: any) => {
        return (
          <div>
            <button onClick={() => handleEdit(params.data)}>Editar</button>
          </div>
        );
      },
      width: 120,
    } as any);
    return defs as any;
  }, [columns]);

  function handleEdit(row: any) {
    if (!table) return;
    const id = row && (row.id || row.ID || row.pk || row.codigo || row.code);
    // navegar para o form (padrão: /parametros/<table>/editar/:id)
    if (id) {
      navigate(`/parametros/${table}/editar/${id}`);
    } else {
      // fallback: navegar para form sem id
      navigate(`/parametros/${table}`);
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 8 }}>
        <h3>Localizar: {table}</h3>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
      <div className="ag-theme-alpine" style={{ flex: 1 }}>
        <AgGridReact rowData={rows} columnDefs={columnDefs} defaultColDef={{ flex: 1 }} />
      </div>
    </div>
  );
}













