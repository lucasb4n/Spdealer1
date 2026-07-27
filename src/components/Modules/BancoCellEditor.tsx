import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from 'services/apiConfig';

interface BancoCellEditorProps {
  value: string;
  data: any;
  onValueChange: (newValue: string) => void;
  stopEditing: () => void;
  eGridCell: any;
}

const BancoCellEditor: React.FC<BancoCellEditorProps> = (props) => {
  const [bancos, setBancos] = useState<any[]>([]);
  const [selectedBanco, setSelectedBanco] = useState<string>(props.value || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de bancos ao inicializar
  useEffect(() => {
    const carregarBancos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/relatorios/bancos`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar bancos');
        }
        
        const data = await response.json();
        setBancos(data);
        setError(null);
      } catch (err) {
        console.error('❌ Erro ao carregar bancos:', err);
        setError('Erro ao carregar lista de bancos');
      } finally {
        setLoading(false);
      }
    };
    
    carregarBancos();
  }, []);

  // Salvar mudança
  const handleSave = async (valueToSave?: string) => {
    const bankValue = valueToSave || selectedBanco;
    
    if (!bankValue) {
      setError('Selecione um banco');
      return;
    }

    try {
      const tableName = props.data.vlrsal_rec !== undefined ? 'receber' : 'pagar';
      const id = props.data.codigo_rec || props.data.codigo_pag;
      const fieldName = tableName === 'receber' ? 'banco_rec' : 'banco_pag';

      // Chamar API para atualizar
      const response = await fetch(
        `${API_BASE_URL}/relatorios/${tableName}/${id}/banco`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            [fieldName]: bankValue
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar banco');
      }

      // Sucesso: atualizar valor na grid e fechar editor
      props.onValueChange(bankValue);
      props.stopEditing();
    } catch (err) {
      console.error('❌ Erro ao salvar banco:', err);
      setError('Erro ao salvar banco');
    }
  };

  // Salvar ao perder foco (blur)
  const handleBlur = () => {
    if (selectedBanco && selectedBanco !== props.value) {
      handleSave(selectedBanco);
    } else {
      props.stopEditing();
    }
  };

  // Fechar editor sem salvar
  const handleCancel = () => {
    props.stopEditing();
  };

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px',
        backgroundColor: '#fff',
        border: '2px solid #0d6efd',
        borderRadius: '4px'
      }}
    >
      {loading ? (
        <span>Carregando...</span>
      ) : error ? (
        <span style={{ color: 'red' }}>{error}</span>
      ) : (
        <>
          <select
            autoFocus
            value={selectedBanco}
            onChange={(e) => {
              setSelectedBanco(e.target.value);
              setError(null);
            }}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave(selectedBanco);
              } else if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              fontSize: '13px'
            }}
          >
            <option value="">-- Selecione um banco --</option>
            {bancos.map((banco) => (
              <option 
                key={banco.codigo_bco} 
                value={banco.codigo_bco}
              >
                {banco.nomefan_bco}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};

export default BancoCellEditor;













