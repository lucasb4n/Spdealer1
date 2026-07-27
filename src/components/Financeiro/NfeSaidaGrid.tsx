import React, { useRef, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { ColDef } from 'ag-grid-community'

interface Props { data: any[], onRowSelected?: (row:any)=>void }

const NfeSaidaGrid: React.FC<Props> = ({ data, onRowSelected }) => {
  const gridRef = useRef<AgGridReact>(null)

  const columnDefs: ColDef[] = [
    { field: 'DtEmissao', headerName: 'Dt Emissão', width: 120 },
    { field: 'Serie', headerName: 'Série', width: 80 },
    { field: 'Numero', headerName: 'Número', width: 100 },
    { field: 'Dpcumento', headerName: 'Documento', width: 150 },
    { field: 'Cliente', headerName: 'Cliente', flex: 1 },
    { field: 'Dpto', headerName: 'Dpto', width: 100 },
    { field: 'CondPgto', headerName: 'Cond. Pgto', width: 140 },
    { field: 'Vend', headerName: 'Vend', width: 80 },
    { field: 'VlrMerc', headerName: 'Vlr Merc', width: 120 },
    { field: 'Desconto', headerName: 'Desconto', width: 120 },
    { field: 'VlrNota', headerName: 'Vlr Nota', width: 140 },
  ]

  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={data}
        columnDefs={columnDefs}
        defaultColDef={{ sortable: true, filter: true }}
        pagination={true}
        paginationPageSize={20}
        onRowClicked={(e) => onRowSelected && onRowSelected(e.data)}
      />
    </div>
  )
}

export default NfeSaidaGrid
