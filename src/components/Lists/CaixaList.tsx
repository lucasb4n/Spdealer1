import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * CaixaList.tsx (DEPRECATED)
 * - Componente não funcional removido do fluxo principal.
 * - Mantido apenas para compatibilidade; redireciona para `/financeiro/caixa` (CaixaBancos).
 */
const CaixaList: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate('/financeiro/caixa', { replace: true }), 50);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Caixa e Bancos (Descontinuado)</h2>
      <p>Esta rota foi descontinuada. Você será redirecionado para a nova página de Caixa e Bancos.</p>
    </div>
  );
};

export default CaixaList;













