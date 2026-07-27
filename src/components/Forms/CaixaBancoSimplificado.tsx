import React, { useState } from 'react';
import './CaixaBancoSimplificado.css';

// ✅ NOVO: Interface com props para callbacks
interface CaixaBancoSimplificadoProps {
  onNovoRegistro?: () => void;
  onEditarRegistro?: (registro: any) => void;
}

const CaixaBancoSimplificado: React.FC<CaixaBancoSimplificadoProps> = ({
  onNovoRegistro,
  onEditarRegistro
}) => {
  const [activeTab, setActiveTab] = useState<'saldo' | 'movimentacoes'>('saldo');
  
  // ✅ NOVO: State para dados de saldos
  const [saldos] = useState([
    {
      id: 1,
      banco_nome: 'Banco do Brasil - CC 12345-6',
      saldo: 15450.00,
      data_atualizacao: '09/11/2025'
    },
    {
      id: 2,
      banco_nome: 'Caixa Geral',
      saldo: 2350.50,
      data_atualizacao: '09/11/2025'
    },
    {
      id: 3,
      banco_nome: 'Bradesco - Poupança',
      saldo: 8920.75,
      data_atualizacao: '08/11/2025'
    }
  ]);

  return (
    <div className="caixa-bancos-container">
      {/* HEADER COM ABAS */}
      <div className="caixa-header">
        <h1>Caixa e Bancos</h1>
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'saldo' ? 'active' : ''}`}
            onClick={() => setActiveTab('saldo')}
          >
            Saldo Consolidado
          </button>
          <button 
            className={`tab-button ${activeTab === 'movimentacoes' ? 'active' : ''}`}
            onClick={() => setActiveTab('movimentacoes')}
          >
            Movimentações
          </button>
          {/* ✅ NOVO: onClick handler para botão "+ Novo Registro" */}
          <button 
            className="btn-novo"
            onClick={onNovoRegistro}
          >
            + Novo Registro
          </button>
        </div>
      </div>

      {/* ABA 1: SALDO CONSOLIDADO */}
      {activeTab === 'saldo' && (
        <div className="tab-content">
          <div className="section-title">Saldo por Caixa/Banco</div>
          
          {/* TABELA DE SALDOS */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Banco/Caixa</th>
                <th>Saldo Atual</th>
                <th>Última Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ NOVO: Mapear dados dinâmicos com handler */}
              {saldos.map((saldo) => (
                <tr key={saldo.id}>
                  <td>{saldo.banco_nome}</td>
                  <td className="valor">R$ {saldo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{saldo.data_atualizacao}</td>
                  <td>
                    <button 
                      className="btn-action"
                      onClick={() => onEditarRegistro?.(saldo)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="total-row">
                <td><strong>TOTAL</strong></td>
                <td className="valor">
                  <strong>
                    R$ {saldos
                      .reduce((sum, s) => sum + s.saldo, 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ABA 2: MOVIMENTAÇÕES */}
      {activeTab === 'movimentacoes' && (
        <div className="tab-content">
          <div className="section-title">Movimentações de Caixa</div>

          {/* FILTROS */}
          <div className="filters-section">
            <input type="date" placeholder="Data Inicial" className="filter-input" />
            <input type="date" placeholder="Data Final" className="filter-input" />
            <select className="filter-select">
              <option value="">Todos os Bancos</option>
              <option value="bb">Banco do Brasil</option>
              <option value="bradesco">Bradesco</option>
              <option value="caixa">Caixa Geral</option>
            </select>
            <select className="filter-select">
              <option value="">Tipo: Todos</option>
              <option value="D">Débito</option>
              <option value="C">Crédito</option>
            </select>
            <button className="btn-filtrar">Filtrar</button>
          </div>

          {/* TABELA DE MOVIMENTAÇÕES */}
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Banco/Caixa</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Saldo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>09/11/2025</td>
                <td>Banco do Brasil</td>
                <td><span className="badge credito">C</span></td>
                <td>Recebimento Cliente XYZ</td>
                <td className="valor">R$ 5.000,00</td>
                <td className="valor">R$ 15.450,00</td>
                <td>
                  <button className="btn-action">Editar</button>
                  <button className="btn-action danger">Deletar</button>
                </td>
              </tr>
              <tr>
                <td>09/11/2025</td>
                <td>Caixa Geral</td>
                <td><span className="badge debito">D</span></td>
                <td>Pagamento Fornecedor ABC</td>
                <td className="valor">-R$ 1.200,00</td>
                <td className="valor">R$ 2.350,50</td>
                <td>
                  <button className="btn-action">Editar</button>
                  <button className="btn-action danger">Deletar</button>
                </td>
              </tr>
              <tr>
                <td>08/11/2025</td>
                <td>Bradesco</td>
                <td><span className="badge credito">C</span></td>
                <td>Rendimento Poupança</td>
                <td className="valor">R$ 125,50</td>
                <td className="valor">R$ 8.920,75</td>
                <td>
                  <button className="btn-action">Editar</button>
                  <button className="btn-action danger">Deletar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CaixaBancoSimplificado;













