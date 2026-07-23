import React, { useEffect, useState } from 'react';

type MesDto = {
  valorEsperado: number;
  valorReal: number;
  variacao: number;
};

type LinhaDto = {
  id: number;
  codigo_linha: string;
  descricao: string;
  tipo_linha: string;
  meses: { [key: number]: MesDto };
};

const FluxoCaixaDashboard: React.FC<{ ano?: number }> = ({ ano = new Date().getFullYear() }) => {
  const [data, setData] = useState<{ ano: number; linhas: LinhaDto[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/fluxo-caixa/12meses/${ano}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .catch((err) => console.error('Erro ao carregar fluxo de caixa', err))
      .finally(() => setLoading(false));
  }, [ano]);

  if (loading) return <div>Carregando fluxo de caixa...</div>;
  if (!data) return <div>Nenhum dado disponível.</div>;

  return (
    <div className="fluxo-caixa-dashboard">
      <h3>Fluxo de Caixa - {data.ano}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Linha</th>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <th key={m}>{m.toString().padStart(2, '0')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.linhas.map((linha) => (
              <tr key={linha.id}>
                <td>
                  <strong>{linha.codigo_linha}</strong>
                  <div>{linha.descricao}</div>
                </td>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const mes = linha.meses?.[m];
                  return (
                    <td key={m} style={{ minWidth: 120 }}>
                      <div style={{ fontSize: 12 }}>{(mes?.valorReal ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{(mes?.valorEsperado ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FluxoCaixaDashboard;













