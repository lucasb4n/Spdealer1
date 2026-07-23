import React, { useEffect, useState } from 'react';
import Localizar from 'components/Localizar';
import ClienteFormPage from '../Forms/ClienteFormPage';
import FornecedorFormPage from '../Forms/FornecedorFormPage';
import { ClientesService } from 'services/ClientesService';
import { FornecedoresService } from 'services/FornecedoresService';
import { formatarDocumento, formatarTelefone } from 'utils/formatters';

interface ClientesManagerProps {
  tipo: 'C' | 'F'; // 'C' para Clientes, 'F' para Fornecedores
}

const ClientesManager: React.FC<ClientesManagerProps> = ({ tipo }) => {
  const [dados, setDados] = useState<any[]>([]);
  const [_loading, setLoading] = useState(false);
  // evitar warning de variável atribuída e não usada
  void _loading;
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'edit' | 'add' | null>(null);
  const [registroSelecionado, setRegistroSelecionado] = useState<any | null>(null);

  // Busca dados conforme tipo
  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      if (tipo === 'C') {
        const res = await ClientesService.getClientes();
        setDados(res);
      } else {
        const res = await FornecedoresService.getFornecedores();
        setDados(res);
      }
      setLoading(false);
    };
    fetch();
  }, [tipo, showForm]);

  // Colunas padrão
  const columns = [
    { headerName: 'Código', field: 'codigo_cli', width: 100 },
  { headerName: 'Documento', field: 'cgccpf_cli', width: 150, valueFormatter: (params: any) => formatarDocumento(params.value, params.data.tipopessoa_cli) },
    { headerName: 'Nome/Razão Social', field: 'nome_cli', flex: 1 },
    { headerName: 'UF', field: 'uf_cli', width: 60 },
    { headerName: 'Inscrição Estadual', field: 'inscest_cli', width: 140 },
  { headerName: 'Telefone', field: 'fone_cli', width: 120, valueFormatter: (params: any) => formatarTelefone(params.value) },
  { headerName: 'Celular', field: 'celular_cli', width: 120, valueFormatter: (params: any) => formatarTelefone(params.value) },
    {
      headerName: 'Ações',
      field: 'acoes',
      width: 120,
      cellRenderer: (params: any) => (
        <button onClick={() => handleEditar(params.data)} style={{ marginRight: 8 }}>Editar</button>
      )
    }
  ];

  // Editar registro
  const handleEditar = (registro: any) => {
    // debug: inspecionar registro passado para o formulário
    // Remover/ajustar este log após diagnóstico
    // eslint-disable-next-line no-console
    console.debug('DEBUG: handleEditar registro:', registro);
    setRegistroSelecionado(registro);
    setFormMode('edit');
    setShowForm(true);
  };

  // Incluir novo
  const handleIncluir = () => {
    setRegistroSelecionado(null);
    setFormMode('add');
    setShowForm(true);
  };

  // Excluir registro (com regra de bloqueio)
  const handleExcluir = async (registro: any) => {
    let podeExcluir = false;
    if (tipo === 'C') {
      podeExcluir = await ClientesService.canDeleteCliente(registro.codigo_cli);
    } else {
      podeExcluir = await FornecedoresService.canDeleteFornecedor(registro.codigo_cli);
    }
    if (!podeExcluir) {
      alert('Não é possível excluir: existem registros vinculados em contas a receber/pagar.');
      return;
    }
    if (window.confirm('Confirma exclusão?')) {
      if (tipo === 'C') await ClientesService.deleteCliente(registro.codigo_cli);
      else await FornecedoresService.deleteFornecedor(registro.codigo_cli);
      setShowForm(false);
    }
  };

  // Salvar (após inclusão/edição)
  const handleSalvar = () => {
    setShowForm(false);
    setFormMode(null);
  };

  return (
    <div style={{ display: 'flex', position: 'relative', height: '100%', minHeight: 500 }}>
      {/* Grade principal */}
      <div style={{ flex: 1, padding: 24, transition: 'filter 0.2s', filter: showForm ? 'blur(0.5px)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>{tipo === 'C' ? 'Clientes' : 'Fornecedores'}</h2>
          <button onClick={handleIncluir} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>+ Incluir Registro</button>
        </div>
        <Localizar
          title={tipo === 'C' ? 'Clientes' : 'Fornecedores'}
          columns={columns}
          data={dados}
          editable={false}
          onRowSelected={rows => {
            if (rows && rows.length === 1) handleEditar(rows[0]);
          }}
        />
      </div>
      {/* Painel lateral do formulário */}
      {showForm && (
        <div style={{ width: 480, background: '#fff', boxShadow: '-2px 0 16px rgba(0,0,0,0.08)', height: '100%', position: 'absolute', right: 0, top: 0, zIndex: 10, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '18px 18px 0 18px' }}>
            {formMode === 'edit' && registroSelecionado && (
              <button onClick={() => handleExcluir(registroSelecionado)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Excluir</button>
            )}
            <button onClick={() => setShowForm(false)} style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancelar</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 18px 18px' }}>
            {tipo === 'C' ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                <p>Use o menu Cadastros &gt; Clientes para criar/editar registros.</p>
                <p style={{ fontSize: '0.875rem', marginTop: 8 }}>ClienteFormPage foi refatorado para pagina independente.</p>
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                <p>Use o menu Cadastros &gt; Fornecedores para criar/editar registros.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesManager;













