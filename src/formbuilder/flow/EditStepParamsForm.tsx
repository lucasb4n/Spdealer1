import React from 'react';

interface EditStepParamsFormProps {
  stepId?: string;
  params?: any;
  initialConfig?: any;
  onChange?: (params: any) => void;
  onSave?: (params: any) => void;
  onCancel?: () => void;
}

const EditStepParamsForm: React.FC<EditStepParamsFormProps> = ({ onSave, onCancel, initialConfig }) => {
  return (
    <div style={{ padding: '1rem' }}>
      <h5>Editar Parâmetros do Step</h5>
      <p style={{ color: '#666', fontSize: '12px' }}>Componente em desenvolvimento - Config: {JSON.stringify(initialConfig)}</p>
      <button onClick={() => onCancel?.()} className="btn btn-secondary btn-sm">
        Cancelar
      </button>
    </div>
  );
};

export default EditStepParamsForm;















