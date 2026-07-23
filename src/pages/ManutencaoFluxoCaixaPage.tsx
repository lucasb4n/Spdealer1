import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNotification } from '../contexts/NotificationContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
`;

interface FluxoCaixaLinha {
  id?: number;
  codigoLinha: string;
  descricao: string;
  tipoLinha: 'TITULO' | 'RECEITA' | 'DESPESA' | 'TOTAL' | 'RESULTADO';
  queryId?: number;
  ehCalculada?: boolean;
  ordem: number;
  nivelHierarquia?: number;
  ehTotalizadora?: boolean;
  paiId?: number;
}

interface Query {
  id: number;
  nome: string;
  sql_query: string;
}

const ManutencaoFluxoCaixaPage: React.FC = () => {
  const { notify } = useNotification();
  const [linhas, setLinhas] = useState<FluxoCaixaLinha[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState<FluxoCaixaLinha>({
    codigoLinha: '',
    descricao: '',
    tipoLinha: 'RECEITA',
    queryId: undefined,
    ehCalculada: false,
    ordem: 0,
    nivelHierarquia: 0,
    ehTotalizadora: false,
    paiId: undefined,
  });

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar linhas
      const responseLinhas = await fetch('/api/v1/fluxo-caixa-linhas', { method: 'GET' });
      if (responseLinhas.ok) {
        const data = await responseLinhas.json();
        setLinhas(data);
      } else {
        const errorText = await responseLinhas.text();
        console.error('Erro ao carregar linhas:', responseLinhas.status, errorText);
        notify('error', `Erro ao carregar linhas (${responseLinhas.status})`);
      }
      
      // Carregar queries disponíveis
      const responseQueries = await fetch('/api/v1/dashboard-queries', { method: 'GET' });
      if (responseQueries.ok) {
        const data = await responseQueries.json();
        setQueries(data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      notify('error', 'Erro ao conectar ao servidor');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigoLinha || !formData.descricao) {
      notify('error', 'Preenchha todos os campos obrigatórios');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/fluxo-caixa-linhas/${editingId}` : '/api/fluxo-caixa-linhas';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        notify('success', editingId ? 'Linha atualizada' : 'Linha criada');
        setShowForm(false);
        setEditingId(null);
        resetForm();
        carregarDados();
      } else {
        notify('error', 'Erro ao salvar linha');
      }
    } catch (error) {
      console.error('Erro:', error);
      notify('error', 'Erro ao conectar ao servidor');
    }
  };

  const handleEdit = (linha: FluxoCaixaLinha) => {
    setFormData(linha);
    setEditingId(linha.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar?')) return;

    try {
      const response = await fetch(`/api/fluxo-caixa-linhas/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        notify('success', 'Linha deletada');
        carregarDados();
      } else {
        notify('error', 'Erro ao deletar linha');
      }
    } catch (error) {
      console.error('Erro:', error);
      notify('error', 'Erro ao conectar ao servidor');
    }
  };

  const resetForm = () => {
    setFormData({
      codigoLinha: '',
      descricao: '',
      tipoLinha: 'RECEITA',
      queryId: undefined,
      ehCalculada: false,
      ordem: 0,
      nivelHierarquia: 0,
      ehTotalizadora: false,
      paiId: undefined,
    });
    setEditingId(null);
  };

  const getTipoLinhaBadge = (tipo: string) => {
    const colors: { [key: string]: string } = {
      TITULO: 'secondary',
      RECEITA: 'success',
      DESPESA: 'danger',
      TOTAL: 'info',
      RESULTADO: 'primary',
    };
    return <span className={`badge bg-${colors[tipo] || 'secondary'}`}>{tipo}</span>;
  };

  if (loading) {
    return <div className="p-0">Carregando...</div>;
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Manutenção do Fluxo de Caixa</h2>
          <button
            className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Nova Linha
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 p-4">
          <h5>{editingId ? 'Editar Linha' : 'Nova Linha'}</h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-3">
                <label className="form-label">Código *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.codigoLinha}
                  onChange={(e) => setFormData({ ...formData, codigoLinha: e.target.value })}
                  disabled={!!editingId}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label">Descrição *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Tipo</label>
                <select
                  className="form-control"
                  value={formData.tipoLinha}
                  onChange={(e) => setFormData({ ...formData, tipoLinha: e.target.value as any })}
                >
                  <option value="TITULO">TITULO</option>
                  <option value="RECEITA">RECEITA</option>
                  <option value="DESPESA">DESPESA</option>
                  <option value="TOTAL">TOTAL</option>
                  <option value="RESULTADO">RESULTADO</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Ordem</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="row mt-3">
              <div className="col-md-4">
                <label className="form-label">Query ID</label>
                <select
                  className="form-control"
                  value={formData.queryId || ''}
                  onChange={(e) => setFormData({ ...formData, queryId: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">-- Selecione uma query --</option>
                  {queries.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.id} - {q.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Nível</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.nivelHierarquia || 0}
                  onChange={(e) => setFormData({ ...formData, nivelHierarquia: parseInt(e.target.value) })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Pai ID</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.paiId || ''}
                  onChange={(e) => setFormData({ ...formData, paiId: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div className="col-md-4 d-flex align-items-end gap-2">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="calculada"
                    checked={formData.ehCalculada || false}
                    onChange={(e) => setFormData({ ...formData, ehCalculada: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="calculada">
                    Calculada
                  </label>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="totalizadora"
                    checked={formData.ehTotalizadora || false}
                    onChange={(e) => setFormData({ ...formData, ehTotalizadora: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="totalizadora">
                    Totalizadora
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-3 gap-2 d-flex">
              <button type="submit" className="btn btn-success">
                Salvar
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Query ID</th>
              <th>Ordem</th>
              <th>Nível</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  Nenhuma linha cadastrada
                </td>
              </tr>
            ) : (
              linhas.map((linha) => (
                <tr key={linha.id}>
                  <td>
                    <code>{linha.codigoLinha}</code>
                  </td>
                  <td>{linha.descricao}</td>
                  <td>{getTipoLinhaBadge(linha.tipoLinha)}</td>
                  <td>{linha.queryId || '-'}</td>
                  <td>{linha.ordem}</td>
                  <td>{linha.nivelHierarquia || '-'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-info me-2"
                      onClick={() => handleEdit(linha)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(linha.id!)}
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ManutencaoFluxoCaixaPage;













