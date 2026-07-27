import React from 'react';

interface StepTypeSelectorProps {
  value?: string;
  onChange?: (type: string) => void;
}

const StepTypeSelector: React.FC<StepTypeSelectorProps> = ({ value, onChange }) => {
  const stepTypes = [
    { value: 'action', label: 'Ação' },
    { value: 'condition', label: 'Condição' },
    { value: 'loop', label: 'Loop' },
    { value: 'delay', label: 'Espera' },
  ];

  return (
    <div style={{ padding: '0.5rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        Tipo de Step
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className="form-control"
        style={{ fontSize: '12px' }}
      >
        <option value="">-- Selecione --</option>
        {stepTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default StepTypeSelector;















