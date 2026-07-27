import React, { useState } from 'react';
import CustomHeader from '../../Cabecario/Frontend/CustomHeader';
import '../../Cabecario/Frontend/CustomHeader.css';

const TabsClientes: React.FC = () => {
  const [tab, setTab] = useState<'juridica' | 'fisica'>('juridica');

  return (
    <div style={{ height: '100%' }}>
      <CustomHeader title="Cadastro de Clientes" subtitle="Homologação - Lucas" />

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setTab('juridica')} aria-pressed={tab === 'juridica'}>
            Jurídica
          </button>
          <button onClick={() => setTab('fisica')} aria-pressed={tab === 'fisica'}>
            Física
          </button>
        </div>

        {tab === 'juridica' ? (
          <div>
            <h3>Formulário: Jurídica (exemplo)</h3>
            <p>Este conteúdo demonstra o cabeçario presente em todas as abas e o espaço do formulário.</p>
          </div>
        ) : (
          <div>
            <h3>Formulário: Física (exemplo)</h3>
            <p>Placeholder para a aba Física.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabsClientes;













