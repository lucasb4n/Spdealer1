import React from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';
import CaixaBancosForm from 'components/Forms/CaixaBancosForm';

const PreviewCaixa: React.FC = () => {
  return (
    <NotificationProvider>
      <div style={{ padding: 20, background: '#f6f7fb', minHeight: '100vh' }}>
        <h2 style={{ marginBottom: 12 }}>Preview - Caixa e Bancos (Formulário)</h2>
        <div style={{ background: 'white', padding: 16, borderRadius: 8 }}>
          <CaixaBancosForm />
        </div>
      </div>
    </NotificationProvider>
  );
};

export default PreviewCaixa;













