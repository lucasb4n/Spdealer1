import React from 'react';

export interface DadosAdicionaisData {
  trib_cli?: string;
  precsub_cli?: string;
  codativ1_cli?: string;
  codativ2_cli?: string;
  codativ3_cli?: string;
  codativ4_cli?: string;
}

interface DadosAdicionaisProps {
  value?: DadosAdicionaisData;
  onChange?: (data: DadosAdicionaisData) => void;
}

export const DadosAdicionais: React.FC<DadosAdicionaisProps> = ({ value = {}, onChange }) => {
  const handleChange = (field: keyof DadosAdicionaisData, val: string) => {
    if (onChange) {
      onChange({
        ...value,
        [field]: val
      });
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: 12 }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Tributação Cliente/Fornecedor</label>
        <input
          type="text"
          value={value.trib_cli || ''}
          onChange={e => handleChange('trib_cli', e.target.value)}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Preço Substituição</label>
        <input
          type="text"
          value={value.precsub_cli || ''}
          onChange={e => handleChange('precsub_cli', e.target.value)}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Cód. Atividade 1</label>
        <input
          type="text"
          value={value.codativ1_cli || ''}
          onChange={e => handleChange('codativ1_cli', e.target.value)}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Cód. Atividade 2</label>
        <input
          type="text"
          value={value.codativ2_cli || ''}
          onChange={e => handleChange('codativ2_cli', e.target.value)}
          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
};

export default DadosAdicionais;
