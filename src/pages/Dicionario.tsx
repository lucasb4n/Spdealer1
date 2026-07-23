import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 24px;
`;

export default function Dicionario() {
  return (
    <Container>
      <h2>Dicionário</h2>
      <p>Área do Dicionário — selecione uma tabela para visualizar ou editar metadados.</p>
      <p>Se o conteúdo não aparecer, verifique se as entradas em <strong>dictionary_tables</strong> foram populadas.</p>
    </Container>
  );
}













