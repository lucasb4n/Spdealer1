import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Localizar from 'components/Localizar';
import './RecebimentoList.css';

interface Recebimento {
  id: number;
  cliente_rec: string;
  valor_rec: number;
  dtvenci_rec: string;
  status_rec: string;
}

const RecebimentoList: React.FC = () => {
  const navigate = useNavigate();
  const [dados, setDados] = useState<Recebimento[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar recebimentos (placeholder)
  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        // TODO: Chamar API real quando disponível
        setDados([]);
      } catch (error) {
        console.error('Erro ao carregar recebimentos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Colunas AG-Grid
  const columns = [
    { headerName: 'ID', field: 'id', width: 80, pinned: 'left' },
    { headerName: 'Cliente', field: 'cliente_rec', flex: 1, minWidth: 200 },
    {
      headerName: 'Valor',
      field: 'valor_rec',
      width: 120,
      valueFormatter: (params: any) =>
        params.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      headerName: 'Vencimento',
      field: 'dtvenci_rec',
      width: 120,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleDateString('pt-BR');
      }
    },
    {
      headerName: 'Status',
      field: 'status_rec',
      width: 100,
      cellStyle: (params: any) => {
        const status = params.data.status_rec;
        if (status === 'pago') return { color: '#059669', fontWeight: 600 };
        if (status === 'vencido') return { color: '#dc2626', fontWeight: 600 };
        return { color: '#d97706', fontWeight: 600 };
      }
    }
  ];

  // Editar recebimento
  const handleEditar = (registro: Recebimento) => {
    navigate(`/financeiro/recebimentos/${registro.id}/edit`);
  };

  // Incluir novo
  const handleIncluir = () => {
    navigate('/financeiro/recebimentos/novo');
  };

  return (
    <div className="recebimento-list-container">
      <div className="recebimento-list-header">
        <h2>Contas a Receber</h2>
        <button className="btn-primary" onClick={handleIncluir}>
          + Incluir Registro
        </button>
      </div>
      
      <div className="recebimento-list-content">
        {loading ? (
          <div className="loading">Carregando contas a receber...</div>
        ) : dados.length === 0 ? (
          <div className="empty-state">Nenhum registro de recebimento</div>
        ) : (
          <Localizar
            title="Contas a Receber"
            columns={columns}
            data={dados}
            editable={false}
            onRowSelected={(rows) => {
              if (rows && rows.length === 1) handleEditar(rows[0]);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default RecebimentoList;













