import React from 'react';

interface Props {
  value?: string;
  data?: any;
}

const AlertCellRenderer: React.FC<Props> = ({ value, data }) => {
  const level = data?.alertLevel || '';
  const icon = value || '';
  const color = level === 'danger' ? '#dc3545' : level === 'warning' ? '#ffc107' : '#28a745';

  return (
    <span title={level} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color, fontWeight: 700 }}>{icon}</span>
      <small style={{ color: '#333', opacity: 0.8 }}>{/* espaço para texto se necessário */}</small>
    </span>
  );
};

export default AlertCellRenderer;













