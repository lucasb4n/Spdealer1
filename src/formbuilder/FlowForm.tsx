/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { FlowStudio } from './flow/FlowStudio';
import type { FlowDefinition } from 'flow';
import DevLogButton from 'components/Dev/DevLogButton';

const initialFlow: FlowDefinition = {
  id: 'new-flow',
  name: 'Novo Fluxo',
  description: 'Fluxo inicial',
  version: 1,
  params: [],
  steps: [],
  connections: [],
  visual_config: {},
  data_config: {},
};

const FlowForm: React.FC = () => {
  const [flow, setFlow] = React.useState<FlowDefinition>(initialFlow);
  return (
    <>
      <FlowStudio flow={flow} onChange={setFlow} />
      {/* <DevLogButton /> Removido para evitar overlay duplicado */}
    </>
  );
};

export default FlowForm;















