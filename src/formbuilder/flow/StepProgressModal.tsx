import React from 'react';

interface StepProgressModalProps {
  show?: boolean;
  onClose?: () => void;
  onHide?: () => void;
  stepId?: string;
  progress?: number;
  status?: string;
}

const StepProgressModal: React.FC<StepProgressModalProps> = ({ show, onClose, onHide, progress, status }) => {
  const closeHandler = onHide || onClose;
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '2rem',
        minWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <h5>Progresso do Step</h5>
        {status && <p style={{ marginBottom: '1rem', color: '#666' }}>{status}</p>}
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <div style={{
            width: '100%',
            height: '20px',
            background: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: '#28a745',
              width: `${progress || 0}%`,
              transition: 'width 0.3s'
            }} />
          </div>
          <p style={{ marginTop: '0.5rem', textAlign: 'center' }}>
            {progress || 0}%
          </p>
        </div>
        <button onClick={() => closeHandler?.()} className="btn btn-primary btn-sm">
          Fechar
        </button>
      </div>
    </div>
  );
};

export default StepProgressModal;















