/**
 * Página de demonstração — VERSÃO ORIGINAL DOS CLIENTES (pré-refatoração v3.0)
 *
 * Esta página replica fielmente o comportamento visual da versão original
 * que existia no backup (H:\DISCO_D\Desenvolvimento\Seprocom\spdealer):
 *
 *   - ClientesManager: Lista + Formulário no MESMO componente (monolítico)
 *   - ClienteList: Grade AG-Grid simples, sem KPIs, sem filtros avançados
 *   - ClienteForm: Modal lateral com APENAS o campo "nome" editável
 *   - Dados mock hardcoded (não integração real)
 *   - Botões de ação inline no grid ("Editar" texto simples)
 *   - Sem tabs, sem design system sp-*, sem validação
 *
 * A rota /demo/cliente-original permite comparar lado-a-lado com:
 *   /cadastros/clientes        (ClienteListPage.tsx   — v3.0)
 *   /cadastros/clientes/novo   (ClienteEditar.tsx     — v3.0)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── TIPOS ─── */
interface ClienteMock {
  id: string;
  codigo_cli: string;
  nome_cli: string;
  tipopessoa_cli: 'F' | 'J';
  cliforn_cli: 'C' | 'F';
  cgccpf_cli?: string;
  email_cli?: string;
  fone_cli?: string;
  celular_cli?: string;
  cidade_cli?: string;
  uf_cli?: string;
}

/* ─── DADOS MOCKADOS (hardcoded) — versão original ─── */
const MOCK_CLIENTES: ClienteMock[] = [
  { id: '1', codigo_cli: '001', nome_cli: 'Posto Shell Centro',      tipopessoa_cli: 'J', cliforn_cli: 'C', cgccpf_cli: '12.345.678/0001-90', cidade_cli: 'São Paulo',       uf_cli: 'SP', fone_cli: '(11) 3456-7890', email_cli: 'contato@shellcentro.com' },
  { id: '2', codigo_cli: '002', nome_cli: 'Oficina do Zé',           tipopessoa_cli: 'F', cliforn_cli: 'C', cgccpf_cli: '123.456.789-00',     cidade_cli: 'Rio de Janeiro',  uf_cli: 'RJ', fone_cli: '(21) 98765-4321', email_cli: 'ze@oficina.com' },
  { id: '3', codigo_cli: '003', nome_cli: 'Auto Peças Sul',          tipopessoa_cli: 'J', cliforn_cli: 'C', cgccpf_cli: '98.765.432/0001-10', cidade_cli: 'Curitiba',        uf_cli: 'PR', fone_cli: '(41) 3344-5566', email_cli: 'vendas@autopecassul.com' },
  { id: '4', codigo_cli: '004', nome_cli: 'Maria das Peças',         tipopessoa_cli: 'F', cliforn_cli: 'C', cgccpf_cli: '987.654.321-00',     cidade_cli: 'Belo Horizonte',  uf_cli: 'MG', fone_cli: '(31) 99887-6655', email_cli: 'maria@pecas.com' },
  { id: '5', codigo_cli: '005', nome_cli: 'Centro Automotivo Norte', tipopessoa_cli: 'J', cliforn_cli: 'C', cgccpf_cli: '45.678.901/0001-23', cidade_cli: 'Porto Alegre',    uf_cli: 'RS', fone_cli: '(51) 3210-4567', email_cli: 'norte@centroauto.com' },
];

/* ─── SUB-COMPONENTE: Lista original (ClienteList.tsx) ─── */
const ClienteListOriginal: React.FC<{
  clientes: ClienteMock[];
  onEditar: (c: ClienteMock) => void;
  onIncluir: () => void;
}> = ({ clientes, onEditar, onIncluir }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 24 }}>
      {/* Header simples */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1f2937' }}>Clientes</h2>
        <button
          onClick={onIncluir}
          style={{
            background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6,
            padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer'
          }}
        >
          + Incluir Registro
        </button>
      </div>

      {/* Grid mock (table HTML simples simulando AG-Grid básico) */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', width: 80 }}>Ações</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', width: 100 }}>Código</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Nome / Razão Social</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', width: 80 }}>Tipo</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', width: 160 }}>Documento</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', width: 100 }}>UF</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', width: 140 }}>Telefone</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151', width: 200 }}>E-mail</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => onEditar(c)}>
                <td style={{ padding: '10px 16px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditar(c); }}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                </td>
                <td style={{ padding: '10px 16px', color: '#6b7280', fontFamily: 'monospace' }}>{c.codigo_cli}</td>
                <td style={{ padding: '10px 16px', fontWeight: 500, color: '#111827' }}>{c.nome_cli}</td>
                <td style={{ padding: '10px 16px', color: '#6b7280' }}>{c.tipopessoa_cli === 'J' ? 'Jurídica' : 'Física'}</td>
                <td style={{ padding: '10px 16px', color: '#374151', fontFamily: 'monospace', fontSize: 13 }}>{c.cgccpf_cli}</td>
                <td style={{ padding: '10px 16px', color: '#6b7280' }}>{c.uf_cli}</td>
                <td style={{ padding: '10px 16px', color: '#374151' }}>{c.fone_cli}</td>
                <td style={{ padding: '10px 16px', color: '#6b7280', fontSize: 13 }}>{c.email_cli}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── SUB-COMPONENTE: Formulário original (ClienteForm.tsx) ───
 *   Modal lateral com APENAS 1 campo editável (nome)
 *   Sem tabs, sem validação, sem design system
 */
const ClienteFormOriginal: React.FC<{
  cliente: ClienteMock | null;
  isOpen: boolean;
  onSave: (nome: string) => void;
  onCancel: () => void;
}> = ({ cliente, isOpen, onSave, onCancel }) => {
  const [nome, setNome] = useState('');

  useEffect(() => {
    setNome(cliente?.nome_cli || '');
  }, [cliente]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 420,
        background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #e5e7eb',
        animation: 'slideIn 0.25s ease',
      }}
    >
      {/* Header do modal */}
      <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>
          {cliente ? 'Editar Cliente' : 'Novo Cliente'}
        </h3>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}
        >
          ×
        </button>
      </div>

      {/* Corpo — APENAS 1 campo (nome) */}
      <div style={{ padding: '24px', flex: 1 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Nome / Razão Social
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Digite o nome do cliente"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Campos em modo read-only (só para mostrar o que existia) */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#9ca3af' }}>Código</label>
          <div style={{ fontSize: 14, color: '#6b7280', fontFamily: 'monospace' }}>
            {cliente?.codigo_cli || '(auto)'}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#9ca3af' }}>Documento</label>
          <div style={{ fontSize: 14, color: '#6b7280', fontFamily: 'monospace' }}>
            {cliente?.cgccpf_cli || '—'}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#9ca3af' }}>Cidade / UF</label>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            {cliente?.cidade_cli || '—'} / {cliente?.uf_cli || '—'}
          </div>
        </div>
      </div>

      {/* Footer com botões */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px', background: '#f3f4f6', color: '#374151',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(nome)}
          style={{
            padding: '8px 16px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          }}
        >
          Salvar
        </button>
      </div>
    </div>
  );
};

/* ─── SUB-COMPONENTE: Manager original (ClientesManager.tsx) ───
 *   Lista + formulário no MESMO componente, painel lateral slide-in
 */
const ClientesManagerOriginal: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteMock[]>(MOCK_CLIENTES);
  const [showForm, setShowForm] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteMock | null>(null);

  const handleEditar = (c: ClienteMock) => {
    setClienteSelecionado(c);
    setShowForm(true);
  };

  const handleIncluir = () => {
    setClienteSelecionado(null);
    setShowForm(true);
  };

  const handleSalvar = (nome: string) => {
    if (clienteSelecionado) {
      // Editar existente
      setClientes(prev =>
        prev.map(c => c.id === clienteSelecionado.id ? { ...c, nome_cli: nome } : c)
      );
    } else {
      // Incluir novo (mock)
      const novo: ClienteMock = {
        id: String(Date.now()),
        codigo_cli: String(clientes.length + 1).padStart(3, '0'),
        nome_cli: nome || 'Novo Cliente',
        tipopessoa_cli: 'F',
        cliforn_cli: 'C',
      };
      setClientes(prev => [...prev, novo]);
    }
    setShowForm(false);
    setClienteSelecionado(null);
  };

  const handleCancelar = () => {
    setShowForm(false);
    setClienteSelecionado(null);
  };

  return (
    <div style={{ display: 'flex', position: 'relative', height: '100%', minHeight: 500 }}>
      {/* Grade principal */}
      <div style={{ flex: 1, transition: 'filter 0.2s', filter: showForm ? 'blur(0.5px)' : 'none' }}>
        <ClienteListOriginal
          clientes={clientes}
          onEditar={handleEditar}
          onIncluir={handleIncluir}
        />
      </div>

      {/* Painel lateral do formulário (modal lateral) */}
      <ClienteFormOriginal
        cliente={clienteSelecionado}
        isOpen={showForm}
        onSave={handleSalvar}
        onCancel={handleCancelar}
      />

      {/* Overlay escuro quando form aberto */}
      {showForm && (
        <div
          onClick={handleCancelar}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)',
            zIndex: 40, cursor: 'pointer',
          }}
        />
      )}
    </div>
  );
};

/* ─── PÁGINA DE DEMONSTRAÇÃO ─── */
const ClienteFormOriginalDemo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Banner de alerta */}
      <div style={{ padding: 20, background: '#fff3cd', borderBottom: '1px solid #ffc107' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#856404' }}>
              ⚠️ VERSÃO ORIGINAL (LEGADO) — ClientesManager + ClienteForm + ClienteList
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#856404' }}>
              Componente <strong>MONOLÍTICO</strong> — lista + modal no mesmo arquivo · Dados <strong>MOCK</strong> hardcoded ·
              Modal com <strong>1 campo</strong> (nome) · Sem tabs, sem design system, sem validação
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/cadastros/clientes')}
              style={{
                padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none',
                borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}
            >
              Ver v3.0 — Lista
            </button>
            <button
              onClick={() => navigate('/cadastros/clientes/novo')}
              style={{
                padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none',
                borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}
            >
              Ver v3.0 — Formulário
            </button>
          </div>
        </div>
      </div>

      {/* Manager original renderizado */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 0' }}>
        <ClientesManagerOriginal />
      </div>

      {/* Tabela comparativa */}
      <div style={{ maxWidth: 1400, margin: '0 auto 40px', padding: '0 24px' }}>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>
              📋 Evolução: Original (acima) vs. Atual v3.0
            </h3>
          </div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600, color: '#374151', width: 180 }}>Aspecto</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600, color: '#dc2626', width: '40%' }}>Versão Original (esta página)</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600, color: '#059669', width: '40%' }}>Versão Atual v3.0</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Arquitetura</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Monolítico — ClientesManager.tsx engloba lista + form</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Separado — ClienteListPage.tsx + ClienteEditar.tsx</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Dados</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Hardcoded mock (5 registros fixos no código)</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>API real — <code>/api/clientes/com-movimento</code></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Layout Lista</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Table HTML simples; botão "Editar" texto inline</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>AG-Grid completo + KPIs + filtros avançados + busca rápida</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Layout Formulário</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Painel lateral com <strong>1 campo</strong> (nome) + read-only</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Página dedicada com <strong>5 tabs</strong> (Jurídica, Endereço, Física, Cobrança, Crédito)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Campos</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Apenas <code>nome_cli</code> editável</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>52 campos do <code>dictionary_columns</code> com máscaras e validação</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Design System</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Nenhum — inline styles hardcoded, cores arbitrárias</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Tokens <code>sp-*</code> completos — cores, espaçamento, tipografia, botões</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Navegação</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Painel lateral sobreposto (slide-in), mesma rota</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Rotas dedicadas — <code>/novo</code>, <code>/:id/edit</code></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Validação</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Nenhuma — aceita nome vazio</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>CPF/CNPJ, e-mail, campos obrigatórios, máscaras automáticas</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827' }}>Atalhos de Teclado</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>Apenas ESC para fechar modal</td>
                  <td style={{ padding: '10px 16px', color: '#374151' }}>ENTER, TAB, ESC, CTRL+S, DEL — navegação completa</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClienteFormOriginalDemo;













