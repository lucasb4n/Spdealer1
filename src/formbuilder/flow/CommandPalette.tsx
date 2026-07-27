import React from 'react';

interface CommandPaletteProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectCommand?: (command: string) => void;
  onCommand?: (command: any) => void;
  position?: any;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectCommand, onCommand, position }) => {
  if (!isOpen) return null;

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
      alignItems: 'flex-start',
      paddingTop: '100px',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        width: '500px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <div style={{ padding: '16px' }}>
          <h5>Comandos</h5>
          <p style={{ color: '#888', fontSize: '12px' }}>Pressione ESC para fechar</p>
          <button 
            onClick={() => {
              onSelectCommand?.('add-node');
              onClose?.();
            }}
            style={{ padding: '8px', width: '100%', textAlign: 'left' }}
          >
            Adicionar Node
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
export { CommandPalette };















