import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormularioMovimentoCaixa from 'components/FormularioMovimentoCaixa';

const CaixaMovimentoPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();

  // Se houver id, poderia carregar movimento para edição (não implementado ainda)
  const movimentoId = params['id'];

  const handleSalvar = (movimento: any) => {
    // Implementação mínima: aqui você chamaria a API para salvar o movimento
    // Por enquanto apenas navega de volta para a lista
    console.log('Salvar movimento (stub):', movimento);
    navigate('/financeiro/caixa');
  };

  const handleCancel = () => {
    navigate('/financeiro/caixa');
  };

  return (
    <div style={{ padding: 20 }}>
      <FormularioMovimentoCaixa
        isOpen={true}
        modo={movimentoId ? 'editar' : 'novo'}
        movimento={undefined}
        onSalvar={handleSalvar}
        onCancel={handleCancel}
        bancos={[]}
      />
    </div>
  );
};

export default CaixaMovimentoPage;













