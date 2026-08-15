import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrash, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { AgGridReact } from 'ag-grid-react';
import ManutencaoModelosForm from './ManutencaoModelosForm';

interface ModelRow {
  codigo_mod: string;
  modelo_mod: string;
  fabricante_mod: string;
  fab_descricao?: string;
  grupo_mod: string;
  dtalter_mod: string;
}

export default function ManutencaoModelosPage() {
  const [rawData, setRawData] = useState<ModelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected filter values
  const [filterModelo, setFilterModelo] = useState('');
  const [filterGrupo, setFilterGrupo] = useState('');
  const [filterFabricante, setFilterFabricante] = useState('');

  // Form modal states
  const [formVisible, setFormVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelRow | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/servico/manutencao/modelos');
      if (response.ok) {
        const data = await response.json();
        setRawData(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar modelos de máquinas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (codigo: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o modelo "${codigo}"?`)) return;
    try {
      const response = await fetch(`/api/servico/manutencao/modelos/${encodeURIComponent(codigo)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Modelo excluído com sucesso.');
        loadData();
      } else {
        const errData = await response.json();
        alert(errData.error || 'Erro ao excluir modelo.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro na requisição de exclusão.');
    }
  };

  // Extract unique values for filter dropdowns
  const uniqueModelos = useMemo(() => {
    const set = new Set<string>();
    rawData.forEach(r => {
      const val = r.modelo_mod ? r.modelo_mod.trim() : '';
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [rawData]);

  const uniqueGrupos = useMemo(() => {
    const set = new Set<string>();
    rawData.forEach(r => {
      const val = r.grupo_mod ? r.grupo_mod.trim() : '';
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [rawData]);

  const uniqueFabricantes = useMemo(() => {
    const set = new Set<string>();
    rawData.forEach(r => {
      const name = r.fab_descricao || r.fabricante_mod;
      const val = name ? name.trim() : '';
      if (val) set.add(val);
    });
    return Array.from(set).sort();
  }, [rawData]);

  // Client-side filtering logic
  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      // 1. Dropdown Filters
      if (filterModelo && row.modelo_mod?.trim() !== filterModelo) return false;
      if (filterGrupo && row.grupo_mod?.trim() !== filterGrupo) return false;
      
      const fabName = row.fab_descricao || row.fabricante_mod;
      if (filterFabricante && fabName?.trim() !== filterFabricante) return false;

      // 2. Global Text Search
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          row.codigo_mod?.toLowerCase().includes(term) ||
          row.modelo_mod?.toLowerCase().includes(term) ||
          (row.fab_descricao || row.fabricante_mod)?.toLowerCase().includes(term) ||
          row.grupo_mod?.toLowerCase().includes(term);
        
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [rawData, filterModelo, filterGrupo, filterFabricante, searchTerm]);

  // Columns definition for AG-Grid
  const columnDefs: any[] = useMemo(() => [
    { headerName: 'Nome', field: 'codigo_mod', sortable: true, filter: true, flex: 1 },
    { headerName: 'Modelo', field: 'modelo_mod', sortable: true, filter: true, flex: 1 },
    { 
      headerName: 'Fabricante', 
      field: 'fab_descricao', 
      valueGetter: (params: any) => params.data?.fab_descricao || params.data?.fabricante_mod || '',
      sortable: true, 
      filter: true, 
      flex: 1 
    },
    { headerName: 'Grupo', field: 'grupo_mod', sortable: true, filter: true, flex: 1 },
    {
      headerName: '',
      width: 100,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        return (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', height: '100%', alignItems: 'center' }}>
            <button 
              title="Editar" 
              onClick={() => {
                setEditingModel(data);
                setFormVisible(true);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <FontAwesomeIcon icon={faPencil} style={{ width: 14, height: 14, color: '#94a3b8' }} />
            </button>
            <button 
              title="Excluir" 
              onClick={() => handleDelete(data.codigo_mod)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ width: 14, height: 14, color: '#ef4444' }} />
            </button>
          </div>
        );
      }
    }
  ], [rawData]);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
  }), []);

  return (
    <div className="page-container" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Breadcrumb & Title */}
      <div style={{ marginBottom: '20px' }}>
        <small style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          SERVIÇO / MANUTENÇÃO / <span style={{ color: '#2563eb' }}>MODELOS DE MÁQUINA</span>
        </small>
        <h2 style={{ margin: '4px 0 0 0', color: '#1e293b', fontSize: '24px', fontWeight: 700 }}>
          Modelos de Máquina
        </h2>
      </div>

      {/* Search and Action Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FontAwesomeIcon 
            icon={faSearch} 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
          />
          <input
            type="text"
            placeholder="Pesquisar em qualquer coluna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 42px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#334155',
              background: '#fff',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
        </div>
        <button
          onClick={() => {
            setEditingModel(null);
            setFormVisible(true);
          }}
          style={{
            background: '#1e4e79',
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <FontAwesomeIcon icon={faPlus} /> Novo modelo
        </button>
      </div>

      {/* Filters Section */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Modelo
          </label>
          <select
            className="form-control"
            value={filterModelo}
            onChange={(e) => setFilterModelo(e.target.value)}
            style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', height: 'auto' }}
          >
            <option value="">Modelo (todos)</option>
            {uniqueModelos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Grupo
          </label>
          <select
            className="form-control"
            value={filterGrupo}
            onChange={(e) => setFilterGrupo(e.target.value)}
            style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', height: 'auto' }}
          >
            <option value="">Grupo (todos)</option>
            {uniqueGrupos.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Fabricante
          </label>
          <select
            className="form-control"
            value={filterFabricante}
            onChange={(e) => setFilterFabricante(e.target.value)}
            style={{ padding: '10px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', height: 'auto' }}
          >
            <option value="">Fabricante (todos)</option>
            {uniqueFabricantes.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* AG-Grid Table Container */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div className="ag-theme-alpine" style={{ height: '500px', width: '100%' }}>
          <AgGridReact<any>
            rowData={filteredData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            pagination={true}
            paginationPageSize={10}
            theme="legacy"
          />
        </div>
        <div style={{ padding: '12px 24px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #f1f5f9' }}>
          {filteredData.length} de {rawData.length} registro(s)
        </div>
      </div>

      {/* Drawer/Modal Form */}
      <ManutencaoModelosForm
        visible={formVisible}
        onClose={(refresh) => {
          setFormVisible(false);
          setEditingModel(null);
          if (refresh) loadData();
        }}
        editingModel={editingModel}
      />
    </div>
  );
}
