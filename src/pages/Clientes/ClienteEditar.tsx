/**
 * ClienteEditar.tsx
 * 
 * PADRÃO SPDealer COMPLETO:
 * ✅ LAYOUT: Botões topo-esquerda (Novo, Gravar, Deletar, Sair)
 * ✅ DICTIONARY-FIRST: 100% dados do banco (dictionary_columns)
 * ✅ ATALHOS: ENTER (próximo), ESC (voltar), CTRL+S (gravar), DEL (deletar)
 * ✅ DINÂMICO: Campos renderizados via useTableColumns() hook
 * ✅ VALIDAÇÃO: CPF/CNPJ/Email do dictionary
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DynamicField from '../../components/Form/DynamicField';
import { ClienteForm } from '../../components/Forms/ClienteForm';
import { DocumentoFormatterService } from '../../services/DocumentoFormatterService';
import { focusField } from '../../utils/formFieldNavigation';
import { useTableColumns } from '../../hooks/useTableColumns';
import './ClienteEditar.css';

// ✅ Interface gerada dinamicamente do dictionary
interface ClienteData {
  [key: string]: any;
}

interface ClienteEditarProps {
  clienteId?: string;
}

const ClienteEditar: React.FC<ClienteEditarProps> = ({ clienteId }) => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const id = clienteId ?? params.id;
  const formRef = useRef<HTMLFormElement>(null);

  // ✅ DICTIONARY-FIRST: Carregar coluna definição do banco
  const { columns: colunas, loading: colunasCarregando, error: colunasErro } = useTableColumns('clientes', 'form_edit');
  
  // Estado do formulário
  const [modo, setModo] = useState<'novo' | 'editar'>('novo');
  const [dados, setDados] = useState<ClienteData>({});
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [campos, setCampos] = useState<string[]>([]);

  // ✅ Inicializar dados vazios com todos os campos do dictionary
  useEffect(() => {
    if (colunas && colunas.length > 0) {
      const novosDados: ClienteData = {};
      const camposForm: string[] = [];
      
      colunas.forEach((col) => {
        novosDados[col.column_name] = '';
        camposForm.push(col.column_name);
      });
      
      setDados(novosDados);
      setCampos(camposForm);
    }
  }, [colunas]);

  // ✅ Carregar dados se modo edição
  useEffect(() => {
    if (id) {
      setModo('editar');
      carregarCliente(id);
    } else {
      setModo('novo');
      // Focar primeiro campo em novo
      setTimeout(() => formRef.current && focusField(formRef.current, campos[0] || 'codigo_cli'), 100);
    }
  }, [id, campos]);

  const carregarCliente = async (clienteId: string) => {
    setCarregando(true);
    try {
      const response = await fetch(`/api/clientes/${clienteId}`);
      if (!response.ok) throw new Error('Erro ao carregar cliente');
      const data = await response.json();
      setDados(data);
      setSucesso(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  };

  // Handler: Gravar (aceita opcionalmente um objeto cliente vindo do ClienteForm)
  const handleGravar = async (clienteOverride?: any) => {
    const payload = clienteOverride ?? dados;

    // Validação mínima
    if (!payload.nome_cli?.toString().trim()) {
      setErro('Nome é obrigatório');
      focusField(formRef.current!, 'nome_cli');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const url = modo === 'novo' ? '/api/clientes' : `/api/clientes/${payload.codigo_cli}`;
      const method = modo === 'novo' ? 'POST' : 'PUT';

      // Não enviar `compl_cli` em updates — campo não existe no DB
      if (method === 'PUT' && payload && Object.prototype.hasOwnProperty.call(payload, 'compl_cli')) {
        delete payload.compl_cli;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao gravar');
      }

      const savedData = await response.json().catch(() => payload);
      setSucesso(`Cliente ${modo === 'novo' ? 'criado' : 'atualizado'} com sucesso!`);
      setDados(savedData);

      if (modo === 'novo') {
        setModo('editar');
        setTimeout(() => navigate(`/cadastros/clientes/${savedData.codigo_cli}/edit`), 500);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao gravar');
    } finally {
      setCarregando(false);
    }
  };

  // Handler: Novo
  const handleNovo = () => {
    setDados({
      nome_cli: '',
      nomefan_cli: '',
      email_cli: '',
      telefone_cli: '',
      celular_cli: '',
      cpf_cnpj_cli: '',
      categoria_cli: '',
      ativo_cli: true,
      observacao_cli: '',
    });
    setModo('novo');
    setErro(null);
    setSucesso(null);
    setTimeout(() => formRef.current && focusField(formRef.current, 'codigo_cli'), 100);
  };

  // Handler: Deletar
  const handleDeletar = () => {
    if (modo === 'novo') {
      alert('Não é possível deletar um cliente novo');
      return;
    }

    if (!window.confirm('Tem certeza que deseja deletar este cliente?')) {
      return;
    }

    setCarregando(true);
    fetch(`/api/clientes/${dados.codigo_cli}`, { method: 'DELETE' })
      .then(() => {
        setSucesso('Cliente deletado com sucesso!');
        setTimeout(() => navigate('/cadastros/clientes'), 2000);
      })
      .catch(err => {
        setErro(err instanceof Error ? err.message : 'Erro ao deletar');
        setCarregando(false);
      });
  };

  // Handler: Voltar
  const handleVoltar = () => {
    navigate('/cadastros/clientes');
  };

  // Handlers de mudança de campo
  const handleMudanca = (campo: keyof ClienteData, valor: string | number | boolean) => {
    const field = String(campo);

    setDados(prev => {
      // Troca de tipo de pessoa: limpar documento e campos relacionados
      if (field === 'tipopessoa_cli') {
        return {
          ...prev,
          [campo]: valor,
          cgccpf_cli: '',
          cpf_cnpj_cli: '',
        } as ClienteData;
      }

      // Aplicar máscara/formatação ao campo de documento
      if (field === 'cgccpf_cli' || field === 'cpf_cnpj_cli' || (field.toLowerCase().includes('cpf') && field.toLowerCase().includes('cnpj'))) {
        const tipo = (prev.tipopessoa_cli as string) || 'F';
        if (tipo === 'F') {
          return { ...prev, [campo]: DocumentoFormatterService.formatarCPF(String(valor || '')) } as ClienteData;
        }
        return { ...prev, [campo]: DocumentoFormatterService.formatarCNPJ(String(valor || '')) } as ClienteData;
      }

      // Caso geral
      return { ...prev, [campo]: valor } as ClienteData;
    });

    setErro(null);
  };

  // ✅ ATALHOS DE TECLADO: ENTER (próximo), ESC (voltar), CTRL+S (gravar), DEL (deletar)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      const currentFieldName = (e.target as HTMLElement).getAttribute('name') || '';
      const allFields = formRef.current?.querySelectorAll('input, select, textarea') || [];
      const currentIndex = Array.from(allFields).findIndex(f => f.getAttribute('name') === currentFieldName);
      
      if (currentIndex !== -1 && currentIndex < allFields.length - 1) {
        (allFields[currentIndex + 1] as HTMLElement).focus();
      } else {
        handleGravar();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleVoltar();
    } else if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleGravar();
    } else if (e.key === 'Delete' && e.ctrlKey) {
      e.preventDefault();
      handleDeletar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Registrar listeners de teclado
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (carregando) {
    return <div className="container mt-5"><p>Carregando...</p></div>;
  }

  return (
    <div className="cliente-container">
      {/* Cabeçalho com botões (padrão SPDealer topo-esquerda) */}
      <div className="form-header-top">
        <h1>{modo === 'novo' ? 'Novo Cliente' : `Editar Cliente: ${dados.nome_cli}`}</h1>
        <div className="btn-group-top">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleVoltar}
            title="ESC para voltar"
            disabled={carregando}
          >
            <i className="bi bi-arrow-left"></i> Voltar
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleNovo}
            title="Novo cliente"
            disabled={carregando}
          >
            <i className="bi bi-plus-circle"></i> Novo
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleGravar}
            title="CTRL+S para gravar"
            disabled={carregando}
          >
            <i className="bi bi-check-circle"></i> Gravar
          </button>
          {modo === 'editar' && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeletar}
              title="DEL para deletar"
              disabled={carregando}
            >
              <i className="bi bi-trash"></i> Deletar
            </button>
          )}
        </div>
      </div>

      {/* Mensagens de erro/sucesso */}
      {erro && <div className="alert alert-danger mt-3 alert-dismissible fade show" role="alert">
        {erro}
        <button type="button" className="btn-close" onClick={() => setErro(null)}></button>
      </div>}
      {sucesso && <div className="alert alert-success mt-3 alert-dismissible fade show" role="alert">
        {sucesso}
        <button type="button" className="btn-close" onClick={() => setSucesso(null)}></button>
      </div>}

      {/* Formulário inline (estático) - sempre renderizar o formulário existente */}
      <div className="cliente-form mt-4">
        <ClienteForm
          showLocalizer={true}
          cliente={dados as any}
          isEditing={true}
          onSave={(c: any) => handleGravar(c)}
          onCancel={handleVoltar}
        />
      </div>

      {/* Dicas de teclado */}
      <div className="keyboard-hints mt-5 mb-4">
        <p className="text-muted">
          <strong>Atalhos de teclado:</strong>
          ENTER = próximo campo | TAB/SHIFT+TAB = navegação | ESC = voltar |
          CTRL+S = gravar | DEL = deletar | CTRL+ENTER (textarea) = próximo
        </p>
      </div>
    </div>
  );
};

export default ClienteEditar;
