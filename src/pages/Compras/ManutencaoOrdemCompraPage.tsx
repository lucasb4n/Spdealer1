import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OrdemCompra {
  id: string;
  numero: string;
  fornecedor: string;
  dataEmissao: string;
  valorTotal: number;
  status: 'Pendente' | 'Aprovada' | 'Cancelada' | 'Recebida';
}

const ManutencaoOrdemCompraPage: React.FC = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('Todos');

  // Dados mockados para exibição inicial premium
  const [ordens] = useState<OrdemCompra[]>([
    { id: '1', numero: 'OC-2026-001', fornecedor: 'Distribuidora de Peças Automotivas S/A', dataEmissao: '12/08/2026', valorTotal: 15450.00, status: 'Pendente' },
    { id: '2', numero: 'OC-2026-002', fornecedor: 'Metalúrgica Central Ltda', dataEmissao: '10/08/2026', valorTotal: 8900.50, status: 'Aprovada' },
    { id: '3', numero: 'OC-2026-003', fornecedor: 'Importadora Global de Componentes', dataEmissao: '05/08/2026', valorTotal: 45000.00, status: 'Recebida' },
    { id: '4', numero: 'OC-2026-004', fornecedor: 'Pneus Rápido Distribuição', dataEmissao: '01/08/2026', valorTotal: 12000.00, status: 'Cancelada' },
  ]);

  const getStatusBadgeClass = (status: OrdemCompra['status']) => {
    switch (status) {
      case 'Pendente': return 'status-pendente';
      case 'Aprovada': return 'status-aprovada';
      case 'Recebida': return 'status-recebida';
      case 'Cancelada': return 'status-cancelada';
      default: return '';
    }
  };

  const ordensFiltradas = ordens.filter(ordem => {
    const matchesBusca = ordem.numero.toLowerCase().includes(busca.toLowerCase()) || 
                          ordem.fornecedor.toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = statusFiltro === 'Todos' || ordem.status === statusFiltro;
    return matchesBusca && matchesStatus;
  });

  return (
    <div className="sp-page" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="sp-page-header">
        <h1>Manutenção de ordem de compra</h1>
        <div className="sp-btn-group">
          <button 
            className="sp-btn sp-btn--primary"
            onClick={() => navigate('/pecas/compras/manutencao-ordem-compra/nova')}
          >
            <i className="fas fa-plus"></i> Nova Ordem
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        background: '#f9fafb',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Buscar Ordem ou Fornecedor</label>
          <input
            type="text"
            placeholder="Digite o número ou fornecedor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563' }}>Filtrar por Status</label>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: '#fff',
              outline: 'none'
            }}
          >
            <option value="Todos">Todos</option>
            <option value="Pendente">Pendente</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Recebida">Recebida</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#fff'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Número</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Fornecedor</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Data Emissão</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', textAlign: 'right' }}>Valor Total</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {ordensFiltradas.length > 0 ? (
              ordensFiltradas.map((ordem) => (
                <tr key={ordem.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>{ordem.numero}</td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>{ordem.fornecedor}</td>
                  <td style={{ padding: '12px 16px', color: '#4b5563' }}>{ordem.dataEmissao}</td>
                  <td style={{ padding: '12px 16px', color: '#111827', textAlign: 'right', fontWeight: 500 }}>
                    {ordem.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span className={`badge ${getStatusBadgeClass(ordem.status)}`}>
                      {ordem.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button 
                        title="Editar" 
                        onClick={() => alert(`Editar Ordem ${ordem.numero}`)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb' }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        title="Visualizar" 
                        onClick={() => alert(`Visualizar Ordem ${ordem.numero}`)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4b5563' }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  Nenhuma ordem de compra localizada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-pendente {
          background-color: #fef3c7;
          color: #d97706;
        }
        .status-aprovada {
          background-color: #dbeafe;
          color: #2563eb;
        }
        .status-recebida {
          background-color: #d1fae5;
          color: #059669;
        }
        .status-cancelada {
          background-color: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default ManutencaoOrdemCompraPage;
