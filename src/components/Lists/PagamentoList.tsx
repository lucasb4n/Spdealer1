import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Localizar from 'components/Localizar';
import './PagamentoList.css';

interface Pagamento {
  id: number;
  fornecedor_pag: string;
  valor_pag: number;
  dtvenci_pag: string;
  status_pag: string;
}

const PagamentoList: React.FC = () => {
  const navigate = useNavigate();
  const [dados, setDados] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar pagamentos (placeholder)
  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        // TODO: Chamar API real quando disponível
        setDados([]);
      } catch (error) {
        console.error('Erro ao carregar pagamentos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Colunas AG-Grid
  const columns = [
    { headerName: 'ID', field: 'id', width: 80, pinned: 'left' },
    { headerName: 'Fornecedor', field: 'fornecedor_pag', flex: 1, minWidth: 200 },
    {
      headerName: 'Valor',
      field: 'valor_pag',
      width: 120,
      valueFormatter: (params: any) =>
        params.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      headerName: 'Vencimento',
      field: 'dtvenci_pag',
      width: 120,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        return date.toLocaleDateString('pt-BR');
      }
    },
    {
      headerName: 'Status',
      field: 'status_pag',
      width: 100,
      cellStyle: (params: any) => {
        const status = params.data.status_pag;
        if (status === 'pago') return { color: '#059669', fontWeight: 600 };
        if (status === 'vencido') return { color: '#dc2626', fontWeight: 600 };
        return { color: '#d97706', fontWeight: 600 };
      }
    }
  ];

  // Editar pagamento
  const handleEditar = (registro: Pagamento) => {
    navigate(`/financeiro/pagamentos/${registro.id}/edit`);
  };

  // Incluir novo
  const handleIncluir = () => {
    navigate('/financeiro/pagamentos/novo');
  };

  return (
    <div className="pagamento-list-container">
      <div className="pagamento-list-header">
        <h2>Contas a Pagar</h2>
        <button className="btn-primary" onClick={handleIncluir}>
          + Incluir Registro
        </button>
      </div>
      
      <div className="pagamento-list-content">
        {loading ? (
          <div className="loading">Carregando contas a pagar...</div>
        ) : dados.length === 0 ? (
          <div className="empty-state">Nenhum registro de pagamento</div>
        ) : (
          <Localizar
            title="Contas a Pagar"
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

export default PagamentoList;













