import React, { useState } from 'react'
import FilterPanel from 'components/Estoque/FilterPanel'
import AgGridResults from 'components/Estoque/AgGridResults'
import GerencialPanel from 'components/Estoque/GerencialPanel'
import './EstoqueConsultaPage.css'

const EstoqueConsultaPage: React.FC = () => {
  const [filters, setFilters] = useState<any>({})
  const [showGerencial, setShowGerencial] = useState(false)

  return (
    <div className="page-estoque-consulta container-fluid" style={{ padding: '24px', backgroundColor: '#f8fafc', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
      <div className="sp-header-bar">
        <h1>Consulta de Estoque</h1>
      </div>

      <div className="row mb-1">
        <div className="col-12">
          <FilterPanel 
            onChange={setFilters} 
            mode="consulta" 
            onToggleGerencial={() => setShowGerencial(s => !s)}
            showGerencial={showGerencial}
          />
        </div>
      </div>

      <div className="row" style={{ marginTop: '-4px' }}>
        {showGerencial && (
          <aside className="col-md-4">
            <GerencialPanel filters={filters} />
          </aside>
        )}
        <main className={showGerencial ? 'col-md-8' : 'col-12'}>
          <AgGridResults filters={filters} mode="consulta" />
        </main>
      </div>
    </div>
  )
}

export default EstoqueConsultaPage
