import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FornecedorForm } from '../Forms/FornecedorForm';
import { FornecedoresService } from 'services/FornecedoresService';
import './FornecedorFormPage.css';

const FornecedorFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [fornecedor, setFornecedor] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Determinar modo baseado em id
  const modo = id ? 'edit' : 'add';

  // Carregar fornecedor se edição
  useEffect(() => {
    if (modo === 'edit' && id) {
      setLoading(true);
      const fetch = async () => {
        try {
          // Buscar detalhes completos do fornecedor por ID (retorna campos de endereço/documento)
          const numericId = Number(id);
          const found = await FornecedoresService.getFornecedorById(numericId);
          if (found) {
            setFornecedor(found);
          }
        } catch (error) {
          console.error('Erro ao carregar fornecedor:', error);
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }
  }, [id, modo]);

  // Salvar fornecedor (voltar para lista)
  const handleSalvar = () => {
    navigate('/cadastros/fornecedores');
  };

  // Cancelar
  const handleCancelar = () => {
    navigate('/cadastros/fornecedores');
  };

  // Excluir fornecedor
  const handleExcluir = async () => {
    if (!fornecedor) return;
    
    const podeExcluir = await FornecedoresService.canDeleteFornecedor(fornecedor.codigo_for);
    if (!podeExcluir) {
      alert('Não é possível excluir: existem registros vinculados em contas a pagar.');
      return;
    }
    
    if (window.confirm('Confirma exclusão do fornecedor?')) {
      try {
        await FornecedoresService.deleteFornecedor(fornecedor.codigo_for);
        navigate('/cadastros/fornecedores');
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        alert('Erro ao excluir fornecedor.');
      }
    }
  };

  return (
    <div className="fornecedor-form-page">
      <div className="fornecedor-form-header">
        <div className="fornecedor-form-title-section">
          <h2>{modo === 'edit' ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
          <p className="subtitle">
            {modo === 'edit' && fornecedor
              ? `Fornecedor: ${fornecedor.nome_for}`
              : 'Preencha os dados do novo fornecedor'}
          </p>
        </div>
        <div className="fornecedor-form-actions">
          {modo === 'edit' && fornecedor && (
            <button
              className="btn-danger"
              onClick={handleExcluir}
              title="Excluir fornecedor"
            >
              Excluir
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={handleCancelar}
          >
            Cancelar
          </button>
        </div>
      </div>

      <div className="fornecedor-form-content">
        {loading ? (
          <div className="loading">Carregando fornecedor...</div>
        ) : (
          <FornecedorForm
            fornecedor={modo === 'edit' ? fornecedor : null}
            onSave={handleSalvar}
            onCancel={handleCancelar}
            isEditing={modo === 'edit'}
          />
        )}
      </div>
    </div>
  );
};

export default FornecedorFormPage;













