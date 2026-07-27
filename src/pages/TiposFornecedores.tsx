/**
 * TiposFornecedores.tsx
 * 
 * Componente para gerenciar Tipos de Fornecedores
 * ✅ Tabela: masfor (banco 192.168.10.100 erp)
 * ✅ ABA: Tipos de Fornecedores
 * ✅ LAYOUT: Uma coluna
 * ✅ CAMPOS: tipo_for, descr_for
 * ✅ LABEL DO GRUPO: Tipo de Fornecedores
 * ✅ SEM LOCALIZAR: Formulário direto para edição dos parâmetros
 */

import React, { useState, useRef, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import './ParametrosGerais.css';

// ✅ Interface para campo inline
interface CampoInline {
  field: string;
  label: string;
  isCheckbox: 0 | 1;
  maxLength?: number;
  mask?: string;
}

// ✅ Interface para dados
interface TiposFornecedoresData {
  [key: string]: any;
}

// ✅ CAMPOS DA ABA - Layout 1 coluna
const CAMPOS_TIPOS_FORNECEDORES_INLINE: CampoInline[] = [
  { field: 'tipo_for', label: 'Tipo', isCheckbox: 0 },
  { field: 'descr_for', label: 'Descrição', isCheckbox: 0, maxLength: 50 },
];

// ✅ LAYOUT 1 COLUNA
const LAYOUT_TIPOS_FORNECEDORES_1COL = {
  secao1: {
    label: 'Tipo de Fornecedores',
    campos: ['tipo_for', 'descr_for'],
  },
};

// ✅ Componente Principal
const TiposFornecedores: FC = () => {
  const navigate = useNavigate();
  const [dados, setDados] = useState<TiposFornecedoresData>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});

  // ✅ Carregar dados ao montar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        setErro('');
        const response = await fetch('/api/parametros-gerais/masfor');
        if (!response.ok) {
          throw new Error(`Erro ao carregar dados: ${response.status}`);
        }
        const data = await response.json();
        setDados(data);
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar dados');
        console.error('Erro ao carregar TiposFornecedores:', err);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  // ✅ Tratar mudanças de campo
  const handleChange = (field: string, value: string | boolean | number) => {
    setDados(prev => ({
      ...prev,
      [field]: value,
    }));
    setSucesso('');
  };

  // ✅ Salvar dados
  const handleSalvar = async () => {
    try {
      setSucesso('');
      setErro('');
      const response = await fetch('/api/parametros-gerais/masfor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      if (!response.ok) {
        throw new Error(`Erro ao salvar: ${response.status}`);
      }
      setSucesso('Dados salvos com sucesso!');
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar dados');
      console.error('Erro ao salvar TiposFornecedores:', err);
    }
  };

  // ✅ Voltar
  const handleVoltar = () => {
    navigate('/parametros');
  };

  // ✅ Renderizar campo
  const renderCampo = (campo: CampoInline) => {
    const valor = dados[campo.field] ?? '';

    if (campo.isCheckbox) {
      return (
        <div key={campo.field} className="form-group">
          <label>
            <input
              type="checkbox"
              checked={valor === 1 || valor === true}
              onChange={(e) => handleChange(campo.field, e.target.checked ? 1 : 0)}
            />
            {campo.label}
          </label>
        </div>
      );
    }

    return (
      <div key={campo.field} className="form-group">
        <label htmlFor={campo.field}>{campo.label}</label>
        <input
          id={campo.field}
          ref={(el) => { if (el) inputRefs.current[campo.field] = el; }}
          type="text"
          value={valor}
          onChange={(e) => handleChange(campo.field, e.target.value)}
          maxLength={campo.maxLength}
          className="form-control"
        />
      </div>
    );
  };

  if (carregando) return <div className="loading">Carregando...</div>;

  return (
    <div className="parametros-gerais-container">
      <div className="parametros-header">
        <h1>Tipos de Fornecedores</h1>
        <div className="parametros-buttons">
          <button onClick={handleSalvar} className="btn btn-success">
            💾 Salvar (Ctrl+S)
          </button>
          <button onClick={handleVoltar} className="btn btn-secondary">
            ← Voltar (ESC)
          </button>
        </div>
      </div>

      {erro && <div className="alert alert-danger">{erro}</div>}
      {sucesso && <div className="alert alert-success">{sucesso}</div>}

      <div className="parametros-content">
        <div className="form-grid-1col">
          <div className="form-section">
            <h3>{LAYOUT_TIPOS_FORNECEDORES_1COL.secao1.label}</h3>
            <div className="form-section-content">
              {LAYOUT_TIPOS_FORNECEDORES_1COL.secao1.campos.map((fieldName) => {
                const campo = CAMPOS_TIPOS_FORNECEDORES_INLINE.find(c => c.field === fieldName);
                return campo ? renderCampo(campo) : null;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiposFornecedores;













