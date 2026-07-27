import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import CustomHeader from './CustomHeader';

type ColumnMeta = { column_name: string; alias?: string; form_visible?: number; required?: number };

const CadastroClientes: React.FC = () => {
  const [cols, setCols] = useState<ColumnMeta[]>([]);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/dictionary/columns/clientes');
        if (!res.ok) throw new Error('no-dict');
        const data = await res.json();
        setCols(data || []);
      } catch (e) {
        setCols([
          { column_name: 'codigo_cli', alias: 'Código', form_visible: 1 },
          { column_name: 'documento_cli', alias: 'Documento', form_visible: 1 },
          { column_name: 'nome_razao', alias: 'Nome/Razão', form_visible: 1 },
        ]);
      }
    };
    load();
  }, []);

  async function onSubmit(data: any) {
    try {
      await fetch('/api/refatorado/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      alert('Salvo (simulado)');
    } catch (e) {
      alert('Falha ao salvar (endpoint não disponível)');
    }
  }

  return (
    <div style={{ height: '100%' }}>
      <CustomHeader title="Cadastro de Clientes" subtitle="Homologação - Lucas" />

      <div style={{ padding: 16 }}>
        <div className="sp-card__body">
          <h2>Dados do Cliente</h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            {cols.filter((c) => c.form_visible).map((c) => (
              <div key={c.column_name} style={{ marginBottom: 8 }}>
                <label className="sp-form__label">{c.alias || c.column_name}</label>
                <input className="sp-form__input" {...register(c.column_name, { required: !!c.required })} />
              </div>
            ))}

            <div style={{ marginTop: 12 }} className="sp-card__footer">
              <button type="button" onClick={() => window.history.back()} style={{ padding: '8px 12px', marginRight: 8 }}>
                Cancelar
              </button>
              <button type="submit" style={{ padding: '8px 12px' }}>
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastroClientes;













