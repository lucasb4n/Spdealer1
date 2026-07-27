import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <h1>404 — Página não encontrada</h1>
      <p>Desculpe, a página que você está tentando acessar não existe.</p>
      <p>
        <Link to="/">Voltar para o início</Link>
      </p>
    </div>
  );
};

export default NotFound;













