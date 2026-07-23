import React from 'react';

interface StepParamsFormProps {
  stepType?: string;
  params?: any;
  onChange?: (params: any) => void;
}

const StepParamsForm: React.FC<StepParamsFormProps> = ({ stepType, onChange }) => {
  return (
    <div style={{ padding: '0.5rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        Parâmetros {stepType ? `(${stepType})` : ''}
      </label>
      <textarea
        className="form-control"
        rows={3}
        style={{ fontSize: '12px' }}
        placeholder="Parâmetros em JSON"
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
};

export default StepParamsForm;















