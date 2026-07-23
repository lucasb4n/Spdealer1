/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import type { FlowDefinition, FlowConnection } from 'flow';

export interface ConnectionEditorProps {
  flow: FlowDefinition;
  selectedConnectionId?: string | null;
  onChange?: (next: FlowDefinition) => void;
}

// Editor mínimo de conexões: lista conexões e permite alterar o campo condition.
// Regras: sem estilos inline; estilização futura via visual_config no container pai.
export const ConnectionEditor: React.FC<ConnectionEditorProps> = ({ flow, selectedConnectionId, onChange }) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(selectedConnectionId || null);

  React.useEffect(() => {
    setSelectedId(selectedConnectionId || null);
  }, [selectedConnectionId]);

  const selected = flow.connections.find((c) => c.id === selectedId) || null;

  const updateCondition = (cond: string) => {
    const next: FlowDefinition = {
      ...flow,
      connections: flow.connections.map((c) => (c.id === selectedId ? { ...c, condition: cond } : c)),
    };
    onChange?.(next);
  };

  return (
    <div>
      <h5>Conexões</h5>
      <div>
        <select
          value={selectedId || ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
        >
          <option value="">Selecionar conexão…</option>
          {flow.connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fromStepId} → {c.toStepId}
            </option>
          ))}
        </select>
      </div>
      {selected ? (
        <div>
          <label>
            Condição:
            <input
              type="text"
              value={selected.condition || ''}
              onChange={(e) => updateCondition(e.target.value)}
            />
          </label>
        </div>
      ) : (
        <p>Nenhuma conexão selecionada.</p>
      )}
    </div>
  );
};

export default ConnectionEditor;















