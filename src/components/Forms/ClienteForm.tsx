import React, { useState, useEffect, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
// import { FaPen, FaTrash } from 'react-icons/fa';
// Se o arquivo FormStyles não existir, crie um styled.div simples ou ajuste o caminho abaixo:
// import { FormContainer } from './FormStyles';
import styled from 'styled-components';
const FormContainer = styled.div``;

interface Cliente {
  id: string;
  codigo_cli: string;
  nome_cli: string;
  tipopessoa_cli: 'F' | 'J';
  cliforn_cli: 'C' | 'F';
  cgccpf_cli?: string;
  email_cli?: string;
  fone_cli?: string;
  fone1_cli?: string;
  celular_cli?: string;
  cep_cli?: string;
  logra_cli?: string;
  bairro_cli?: string;
  cidade_cli?: string;
  uf_cli?: string;
  nomefan_cli?: string;
}


interface ClienteFormProps {
  showLocalizer: boolean;
  onCancel?: () => void;
  onSave?: (cliente: Cliente) => void;
  cliente?: Cliente;
  isEditing?: boolean;
}

export const ClienteForm: React.FC<ClienteFormProps> = ({ showLocalizer, onCancel, onSave, cliente, isEditing: isEditingProp }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<Partial<Cliente>>({});
  const [isEditing, setIsEditing] = useState(!!isEditingProp);

  useEffect(() => {
    setClientes([
      { id: '1', codigo_cli: '001', nome_cli: 'Cliente Exemplo', tipopessoa_cli: 'F', cliforn_cli: 'C' },
    ]);
  }, []);

  // Atualiza formData quando cliente prop muda
  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
      setIsEditing(true);
    }
  }, [cliente]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
        } else {
          if (onCancel) onCancel();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isEditing, onCancel]);

  const handleEdit = useCallback((cliente: Cliente) => {
    setFormData(cliente);
    setIsEditing(true);
  }, []);

  const handleDelete = useCallback((cliente: Cliente) => {
    if (window.confirm('Confirma exclusão do cliente?')) {
      setClientes(prev => prev.filter(c => c.id !== cliente.id));
    }
  }, []);

  const columns: any[] = [
    {
      headerName: '',
      width: 50,
      cellRendererFramework: (params: any) => (
        <button onClick={() => handleEdit(params.data)} title="Editar">✏️</button>
      ),
    },
    {
      headerName: '',
      width: 50,
      cellRendererFramework: (params: any) => (
        <button onClick={() => handleDelete(params.data)} title="Excluir">🗑️</button>
      ),
    },
    { headerName: 'Código', field: 'codigo_cli', width: 100 },
    { headerName: 'Nome', field: 'nome_cli', width: 200 },
    { headerName: 'Tipo', field: 'tipopessoa_cli', width: 80 },
    { headerName: 'Documento', field: 'cgccpf_cli', width: 150 },
    { headerName: 'E-mail', field: 'email_cli', width: 180 },
  ];

  if (!showLocalizer) return null;

  return (
    <div style={{ padding: 24, minWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Clientes</h2>
        <button onClick={() => { setFormData({}); setIsEditing(true); }}>Novo Cliente</button>
      </div>
      <div style={{ height: 400 }}>
        <AgGridReact
          rowData={clientes}
          columnDefs={columns as any}
          rowSelection="single"
        />
      </div>
      {isEditing && (
        <div className="modal">
          <FormContainer>
            <input
              type="text"
              value={formData.nome_cli || ''}
              onChange={e => setFormData({ ...formData, nome_cli: e.target.value })}
              placeholder="Nome"
            />
            <button onClick={() => {
              // Garantir que o payload enviado contenha `codigo_cli` para updates
              const payload: any = { ...formData };
              if (!payload.codigo_cli) {
                // tentar usar `cliente.codigo_cli` ou `cliente.id` como fallback
                if (cliente && (cliente.codigo_cli || cliente.id)) {
                  payload.codigo_cli = cliente.codigo_cli || cliente.id;
                }
              }
              if (onSave) onSave(payload as Cliente);
              setIsEditing(false);
            }}>Salvar</button>
            <button onClick={() => {
              setIsEditing(false);
              if (onCancel) onCancel();
            }}>Cancelar</button>
          </FormContainer>
        </div>
      )}
    </div>
  );
};

