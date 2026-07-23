import React from 'react';
import type { FlowDefinition } from 'flow';
import { ConnectionEditor } from './ConnectionEditor';

export const FlowDetails: React.FC<{ flow: FlowDefinition; onChange?: (next: FlowDefinition) => void }> = ({ flow, onChange }) => {
  return (
    <>
      <h4>Detalhes</h4>
      <pre>{JSON.stringify(flow, null, 2)}</pre>
      <ConnectionEditor flow={flow} onChange={onChange} />
    </>
  );
};















