/**
 * MasforForm.tsx - Componente CRUD para Tipos de Fornecedores
 * ListForm (listagem com AG-Grid) + ModalForm (edição/inclusão)
 * Data: 17 de janeiro de 2026
 * Padrão: PADRAO_ESQUELETO_FORMULARIO.md
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { API_BASE_URL } from 'services/apiConfig';
import { Masfor, MasforCreateDTO, MasforUpdateDTO } from './masfor.types';
import './MasforForm.css';

// ============ LISTFORM ============
interface ListFormProps {
  onEdit: (masfor: Masfor | null) => void;
}

const ListForm: React.FC<ListFormProps> = ({ onEdit }) => {
  const [masforList, setMasforList] = useState<Masfor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  // Carregar dados
  useEffect(() => {
    const fetchMasfor = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/refatorado/masfor`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Erro ao carregar: ${response.status}`);
        }

        const data: Masfor[] = await response.json();
        setMasforList(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
        console.error('Erro ao carregar masfor:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMasfor();
  }, []);

  // Filtrar dados
  const filteredData = masforList.filter(
    (item) =>
      item.tipo_for.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descr_for.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Deletar
  const handleDelete = async (tipoFor: string) => {
    if (!window.confirm(`Deseja deletar o tipo de fornecedor "${tipoFor}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/refatorado/masfor/${tipoFor}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar: ${response.status}`);
      }

      setMasforList(masforList.filter((item) => item.tipo_for !== tipoFor));
      alert('Tipo de fornecedor deletado com sucesso!');
    } catch (err: any) {
      alert('Erro ao deletar: ' + err.message);
    }
  };

  const columns = [
    {
      field: 'tipo_for',
      headerName: 'Código',
      width: 150,
      sortable: true,
      filter: true
    },
    {
      field: 'descr_for',
      headerName: 'Descrição',
      flex: 1,
      sortable: true,
      filter: true
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <div className="masfor-grid-actions">
          <button
            className="masfor-btn-edit"
            onClick={() => onEdit(params.data)}
            title="Editar"
          >
            ✏️
          </button>
          <button
            className="masfor-btn-delete"
            onClick={() => handleDelete(params.data.tipo_for)}
            title="Deletar"
          >
            🗑️
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return <div className="masfor-loading"><div className="masfor-loading-spinner"></div></div>;
  }

  return (
    <div className="masfor-list-container">
      <div className="masfor-list-header">
        <h2>Tipos de Fornecedores</h2>
        <div className="masfor-search-bar">
          <input
            type="text"
            placeholder="Localizar por Código ou Descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="masfor-btn-incluir" onClick={() => onEdit(null)}>
            + Incluir
          </button>
        </div>
      </div>

      {error && <div className="masfor-message error">{error}</div>}

      <div className="ag-theme-alpine ag-grid-container">
        <AgGridReact
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columns}
          pagination={true}
          paginationPageSize={10}
          animateRows={true}
        />
      </div>
    </div>
  );
};

// ============ MODAL FORM ============
interface ModalFormProps {
  masfor: Masfor | null;
  onSave: (masfor: Masfor) => void;
  onCancel: () => void;
}

const ModalForm: React.FC<ModalFormProps> = ({ masfor, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm<Masfor>({
    defaultValues: masfor || { tipo_for: '', descr_for: '' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    reset(masfor || { tipo_for: '', descr_for: '' });
  }, [masfor, reset]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, onCancel]);

  const onSubmit = async (data: Masfor) => {
    try {
      setLoading(true);
      setError(null);

      const url = masfor ? `${API_BASE_URL}/refatorado/masfor/${masfor.tipo_for}` : `${API_BASE_URL}/refatorado/masfor`;
      const method = masfor ? 'PUT' : 'POST';
      const body = masfor ? { descr_for: data.descr_for } : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao salvar: ${response.status}`);
      }

      const savedMasfor = await response.json();
      onSave(savedMasfor);
      alert(`Tipo de fornecedor ${masfor ? 'atualizado' : 'criado'} com sucesso!`);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
      console.error('Erro ao salvar masfor:', err);
    } finally {
      setLoading(false);
    }
  };

  const tipoFor = watch('tipo_for');
  const isEditMode = !!masfor;

  return (
    <div className="masfor-modal-overlay">
      <div className="sp-card">
        <div className="sp-card__header">
          <h3>{isEditMode ? '✏️ Editar Tipo de Fornecedor' : '➕ Novo Tipo de Fornecedor'}</h3>
          <div className="sp-card__header-controls">
            <button className="sp-card__header-btn" title="Minimizar">_</button>
            <button className="sp-card__header-btn" title="Maximizar">□</button>
            <button className="sp-card__header-btn" onClick={onCancel} title="Fechar">✕</button>
          </div>
        </div>

        <div className="sp-card__body">
          {error && <div className="masfor-message error">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="sp-form-grid">
              <div className="sp-form__group">
                <label className="sp-form__label required">Código</label>
                <Controller
                  name="tipo_for"
                  control={control}
                  rules={{
                    required: 'Código é obrigatório',
                    maxLength: { value: 30, message: 'Máximo 30 caracteres' }
                  }}
                  render={({ field }) => (
                    <>
                      <input
                        {...field}
                        type="text"
                        className={`sp-form__input ${errors.tipo_for ? 'error' : ''}`}
                        placeholder="Ex: FOR001"
                        maxLength={30}
                        disabled={isEditMode}
                      />
                      {errors.tipo_for && <span className="sp-form__error">{errors.tipo_for.message}</span>}
                    </>
                  )}
                />
              </div>

              <div className="sp-form__group">
                <label className="sp-form__label required">Descrição</label>
                <Controller
                  name="descr_for"
                  control={control}
                  rules={{
                    required: 'Descrição é obrigatória',
                    maxLength: { value: 200, message: 'Máximo 200 caracteres' }
                  }}
                  render={({ field }) => (
                    <>
                      <input
                        {...field}
                        type="text"
                        className={`sp-form__input ${errors.descr_for ? 'error' : ''}`}
                        placeholder="Ex: Distribuidor Autorizado"
                        maxLength={200}
                      />
                      {errors.descr_for && <span className="sp-form__error">{errors.descr_for.message}</span>}
                    </>
                  )}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="sp-card__footer">
          <button className="sp-card__footer-btn secondary" onClick={onCancel}>
            Cancelar (ESC)
          </button>
          <button
            className="sp-card__footer-btn primary"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Gravar (CTRL+G)'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============
const MasforForm: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMasfor, setSelectedMasfor] = useState<Masfor | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (masfor: Masfor | null) => {
    setSelectedMasfor(masfor);
    setModalOpen(true);
  };

  const handleSave = (masfor: Masfor) => {
    setModalOpen(false);
    setSelectedMasfor(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setModalOpen(false);
    setSelectedMasfor(null);
  };

  return (
    <div>
      <ListForm key={refreshKey} onEdit={handleEdit} />
      {modalOpen && <ModalForm masfor={selectedMasfor} onSave={handleSave} onCancel={handleCancel} />}
    </div>
  );
};

export default MasforForm;













