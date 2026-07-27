import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { WebFunctionsService } from 'services/WebFunctionsService';
import type { WebFunction } from 'flow';

const Title = styled.h4``; // estilos devem vir por visual_config; mantemos styled vazio como wrapper
const Category = styled.div``;
const List = styled.ul``;
const Item = styled.li``;

export const FlowBlockPalette: React.FC = () => {
  const [functions, setFunctions] = useState<WebFunction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    WebFunctionsService.listAll()
      .then((data) => {
        if (mounted) setFunctions(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.warn('Falha ao carregar web_functions, usando fallback mínimo.', e);
        if (mounted) setError('Falha ao carregar funções');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, WebFunction[]>();
    for (const fn of functions) {
      const key = fn.category || 'Geral';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(fn);
    }
    return map;
  }, [functions]);

  if (error && functions.length === 0) {
    // Fallback mínimo conforme regras: não quebrar renderização
    return (
      <>
        <Title>Blocos</Title>
        <List>
          <Item>Ação</Item>
          <Item>Condição</Item>
          <Item>Subfluxo</Item>
          <Item>Evento</Item>
        </List>
      </>
    );
  }

  return (
    <>
      <Title>Blocos</Title>
      {functions.length === 0 ? (
        <small>Carregando...</small>
      ) : (
        Array.from(grouped.entries()).map(([cat, items]) => (
          <Category key={cat}>
            <strong>{cat}</strong>
            <List>
              {items.map((fn) => (
                <Item key={fn.code} title={fn.description || ''}>
                  {fn.name || fn.code}
                </Item>
              ))}
            </List>
          </Category>
        ))
      )}
    </>
  );
};















