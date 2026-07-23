import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import Localizar from '../../../components/Localizar';
import { Button } from '../../../components/ui/Button';

type TmoRow = {
  modelo_tmo?: string;
  codmo_tmo?: string;
  descr_tmo?: string;
  tempo_tmo?: number;
  prcpub_tmo?: number;
  ativo_tmo?: string;
};

export default function ManutencaoTipoTmoList() {
  const [rowData, setRowData] = useState<TmoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const columns = useMemo(() => [
    { headerName: 'Modelo', field: 'modelo_tmo', width: 140, sortable: true, filter: true },
    { headerName: 'Código', field: 'codmo_tmo', width: 120, sortable: true, filter: true },
    { headerName: 'Descrição', field: 'descr_tmo', flex: 1, sortable: true, filter: true },
    { headerName: 'Tempo', field: 'tempo_tmo', width: 100, type: 'numericColumn' },
    { headerName: 'Preço Público', field: 'prcpub_tmo', width: 140, type: 'numericColumn', valueFormatter: (p: any) => p.value ? `R$ ${Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '' },
    { headerName: 'Ativo', field: 'ativo_tmo', width: 90, cellStyle: (p: any) => ({ color: p.value === 'S' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold', textAlign: 'center' }) },
    { 
      headerName: 'Ações', 
      width: 150,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        return (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', height: '100%', alignItems: 'center' }}>
            <button 
              title="Editar" 
              className="sp-btn sp-btn--sm"
              onClick={() => navigate(`/servico/manutencao/tipo-tmo/${encodeURIComponent(data.codmo_tmo)}/edit?modelo=${encodeURIComponent(data.modelo_tmo)}`)}
              style={{ padding: '4px 8px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}
            >
              <FontAwesomeIcon icon={faPencil} style={{ width: 16, height: 16, color: '#2563eb' }} />
            </button>
            <button 
              title="Excluir" 
              className="sp-btn sp-btn--sm"
              onClick={() => handleDelete(data)}
              style={{ padding: '4px 8px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 4, cursor: 'pointer' }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ width: 16, height: 16, color: '#ef4444' }} />
            </button>
          </div>
        );
      } 
    }
  ], [navigate]);

  const refresh = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/servico/manutencao/tipo-tmo');
      if (!resp.ok) throw new Error('Falha ao carregar TMO');
      const data = await resp.json();
      setRowData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (data: TmoRow) => {
    if (!window.confirm(`Confirma a exclusão do TMO ${data.codmo_tmo} (${data.modelo_tmo})?`)) return;
    try {
      const resp = await fetch(`/api/servico/manutencao/tipo-tmo/${encodeURIComponent(data.codmo_tmo || '')}`, { method: 'DELETE' });
      if (resp.ok) {
        setRowData(prev => prev.filter(r => !(r.codmo_tmo === data.codmo_tmo && r.modelo_tmo === data.modelo_tmo)));
      } else {
        alert('Falha ao excluir registro.');
      }
    } catch (err) {
      alert('Erro na requisição de exclusão.');
    }
  };

  return (
    <div className="page-container" style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Manutenção de TMO</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 14 }}>Gestão de Tempos e Mão de Obra</p>
        </div>
        <Button 
          $variant="primary" 
          onClick={() => navigate('/servico/manutencao/tipo-tmo/cad')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: 20 }} /> Incluir Novo TMO
        </Button>
      </div>

      <Localizar
        title="Listagem Geral de TMO"
        columns={columns}
        data={rowData}
        paginationPageSize={50}
        searchControls={
          <Button $variant="secondary" onClick={refresh} disabled={loading}>
            {loading ? 'Atualizando...' : 'Recarregar'}
          </Button>
        }
      />
    </div>
  );
}
