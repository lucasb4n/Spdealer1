import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { maskDate, maskMoney } from '../../utils/maskUtils';
import ModalBuscaF4 from './ModalBuscaF4';
import ModalPecasFaltantes from './ModalPecasFaltantes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

interface ItemOrdem {
  fab: string;
  codigo: string;
  nome: string;
  qtde: number;
  preco: number;
  ospe: string;
  serie: string;
}

interface Msg {
  type: 'success' | 'error';
  text: string;
}

const formatMoney = (n: number): string =>
  (isNaN(n) ? 0 : n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseNum = (raw: any): number => {
  if (raw === null || raw === undefined) return 0;
  let s = String(raw).trim();
  if (!s) return 0;
  if (s.includes(',')) {
    s = s.replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/[^0-9.]/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const fieldWidth = (chars: number) => Math.min(60 + chars * 11, 340);

const inputStyle = (width?: number): React.CSSProperties => ({
  width: width ?? '100%',
  height: 'auto',
  padding: '8px 10px',
  fontSize: 13,
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  background: '#bebebe',
  color: '#334155',
  outline: 'none',
  boxSizing: 'border-box',
});

const readOnlyStyle = (width?: number): React.CSSProperties => ({
  ...inputStyle(width),
  background: '#bebebe',
  color: '#475569',
});

const Campo: React.FC<{ label: string; width?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  label,
  width,
  style,
  children,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: width ?? 'auto', minWidth: 0, ...style }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>
      {label}
    </label>
    {children}
  </div>
);

const OrdemCompraFormPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    origem: 'N',
    dtpedido: '',
    dtprev: '',
    condpag: '',
    fornecNome: '',
    fornecCodigo: '',
    codcobranca: '',
    clienteNome: '',
    clienteCodigo: '',
    classe: '',
    consultor: '',
    modelo: '',
    obsospe: 'SO',
    tipo: 'N',
    estoque: '',
    efetivado: '',
    obs: '',
  });

  const [produtoForm, setProdutoForm] = useState({
    fab: '',
    codigo: '',
    nome: '',
    qtde: '',
    preco: '',
    estmax: '',
    estmin: '',
    estatual: '',
    ospe: 'OS',
    serie: '',
  });

  const [vendedores, setVendedores] = useState<any[]>([]);
  const [itens, setItens] = useState<ItemOrdem[]>([]);
  const [modal, setModal] = useState<'fornecedor' | 'cliente' | 'produto' | null>(null);
  const [modalPecasOpen, setModalPecasOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);

  useEffect(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setForm((f) => ({ ...f, dtpedido: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }));
  }, []);

  useEffect(() => {
    fetch('/api/tabelas-auxiliares/vendedores')
      .then((r) => r.json())
      .then((j) => setVendedores(Array.isArray(j) ? j : j.data || []))
      .catch(() => setVendedores([]));
  }, []);

  const setF = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSelectFornecedor = (row: any) => {
    setForm((f) => ({ ...f, fornecNome: row.nome || '', fornecCodigo: row.codigo || '' }));
  };

  const handleSelectCliente = (row: any) => {
    setForm((f) => ({ ...f, clienteNome: row.nome || '', clienteCodigo: row.codigo || '' }));
  };

  const handleAddPecasFaltantes = (selectedPecas: any[]) => {
    const newItems: ItemOrdem[] = selectedPecas.map((row) => ({
      fab: (row.fab || '').trim(),
      codigo: (row.codigo || '').trim(),
      nome: (row.nome || '').trim(),
      qtde: parseNum(row.qtde) > 0 ? parseNum(row.qtde) : 1,
      preco: parseNum(row.preco) || 0,
      ospe: 'PE',
      serie: '',
    }));
    setItens((prev) => [...prev, ...newItems]);
  };

  const handleSelectProduto = async (row: any) => {
    const codigo = row.codigo || '';
    const fab = produtoForm.fab.trim() || row.fab || '';
    setProdutoForm((p) => ({ ...p, codigo, fab }));
    try {
      const res = await fetch(`/api/compras/produto-info?fab=${encodeURIComponent(fab)}&codigo=${encodeURIComponent(codigo)}`);
      const j = await res.json();
      if (j && !j.error) {
        const precoKar = Number(j.precorep_kar) || 0;
        setProdutoForm((p) => ({
          ...p,
          nome: j.descr || row.descricao || '',
          estmax: j.estmax_kar,
          estmin: j.estmin_kar,
          estatual: j.qtde_kar,
          preco: precoKar > 0 ? formatMoney(precoKar) : p.preco,
        }));
      } else {
        setProdutoForm((p) => ({ ...p, nome: row.descricao || '' }));
      }
    } catch {
      setProdutoForm((p) => ({ ...p, nome: row.descricao || '' }));
    }
  };

  const addItem = () => {
    const codigo = produtoForm.codigo.trim();
    const qtde = parseNum(produtoForm.qtde);
    const preco = parseNum(produtoForm.preco);
    if (!codigo) {
      setMsg({ type: 'error', text: 'Informe o código do produto (use F4 para pesquisar).' });
      return;
    }
    if (qtde <= 0) {
      setMsg({ type: 'error', text: 'Informe a quantidade do produto.' });
      return;
    }
    setItens((prev) => [
      ...prev,
      {
        fab: produtoForm.fab.trim(),
        codigo,
        nome: produtoForm.nome.trim(),
        qtde,
        preco,
        ospe: produtoForm.ospe,
        serie: produtoForm.serie.trim(),
      },
    ]);
    setProdutoForm((p) => ({ ...p, codigo: '', nome: '', qtde: '', preco: '', estmax: '', estmin: '', estatual: '', serie: '' }));
    setMsg(null);
  };

  const removeItem = (data: ItemOrdem) => {
    setItens((prev) => prev.filter((it) => it !== data));
  };

  const onCellValueChanged = (params: any) => {
    const data = params.data;
    const field = params.colDef.field;
    const val = field === 'qtde' || field === 'preco' ? parseNum(data[field]) : data[field];
    setItens((prev) => prev.map((it) => (it === data ? { ...it, [field]: val } : it)));
  };

  const totItens = itens.length;
  const totUnidades = itens.reduce((s, i) => s + (i.qtde || 0), 0);
  const totValor = itens.reduce((s, i) => s + (i.qtde || 0) * (i.preco || 0), 0);

  const pinnedBottom: any[] = useMemo(
    () => [{ fab: '', codigo: 'TOTAIS', nome: `${totItens} item(ns)`, preco: totValor, qtde: totUnidades }],
    [totItens, totValor, totUnidades]
  );

  const columnDefs: any[] = useMemo(
    () => [
      { headerName: 'Fab', field: 'fab', width: 90, sortable: true },
      { headerName: 'Codigo', field: 'codigo', width: 140, sortable: true },
      { headerName: 'Nome', field: 'nome', flex: 1, sortable: true },
      {
        headerName: 'Valor Uni',
        field: 'preco',
        width: 140,
        editable: true,
        valueFormatter: (p: any) => (p && p.value !== undefined && p.value !== null ? formatMoney(parseNum(p.value)) : ''),
      },
      { headerName: 'Qtde', field: 'qtde', width: 100, editable: true, sortable: true },
      {
        headerName: 'Ações',
        width: 80,
        cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
        cellRenderer: (params: any) => {
          if (!params || !params.data || params.data.codigo === 'TOTAIS') return null;
          const data = params.data;
          return (
            <button
              type="button"
              title="Apagar item"
              onClick={() => removeItem(data)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: 14,
                padding: '4px 8px',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          );
        },
      },
    ],
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        origem: form.origem,
        dtpedido: form.dtpedido,
        dtprev: form.dtprev,
        condpag: form.condpag,
        fornec: form.fornecCodigo,
        codcobranca: form.codcobranca,
        cliente: form.clienteCodigo,
        consultor: form.consultor,
        classe: form.classe,
        modelo: form.modelo,
        obsospe: form.obsospe,
        obs: form.obs,
        efetivado: form.efetivado,
        estoque: form.estoque,
        tipo: form.tipo,
        itens: itens.map((i) => ({
          fab: i.fab,
          produto: i.codigo,
          descr: i.nome,
          qtde: i.qtde,
          preco: i.preco,
          tipom: i.ospe,
          serie: i.serie,
        })),
      };
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: 'error', text: (j && j.error) || `Erro ${res.status}` });
        return;
      }
      setMsg({ type: 'success', text: `Ordem de compra ${j.nrordem} salva com sucesso!` });
      setItens([]);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message || 'Erro ao salvar a ordem de compra.' });
    } finally {
      setSaving(false);
    }
  };

  const colClienteFornecedor = [
    { field: 'codigo', headerName: 'Código', width: 110 },
    { field: 'nome', headerName: 'Nome', flex: 1 },
    { field: 'documento', headerName: 'Documento', width: 160 },
  ];

  const colProduto = [
    { field: 'codigo', headerName: 'Código', width: 140 },
    { field: 'descricao', headerName: 'Nome', flex: 1 },
    { field: 'estoque', headerName: 'Qtde', width: 90 },
  ];

  const produtoUrl = `/api/v1/produtos/lookup?size=5000${produtoForm.fab.trim() ? `&fab=${encodeURIComponent(produtoForm.fab.trim())}` : ''}`;

  const f4Props = {
    fornecedor: {
      title: 'Fornecedores',
      fetchUrl: '/api/compras/clientes?tipo=F',
      columns: colClienteFornecedor,
      onSelect: handleSelectFornecedor,
    },
    cliente: {
      title: 'Clientes',
      fetchUrl: '/api/compras/clientes?tipo=C',
      columns: colClienteFornecedor,
      onSelect: handleSelectCliente,
    },
    produto: {
      title: 'Produtos / Peças',
      fetchUrl: produtoUrl,
      columns: colProduto,
      onSelect: handleSelectProduto,
    },
  } as any;

  return (
    <div className="sp-page" style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20, color: '#1e4e79' }}>Nova Ordem de Compra</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/pecas/compras/manutencao-ordem-compra')}
            style={{ background: '#fff', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            Voltar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: '#1e4e79', color: '#fff', border: 'none', padding: '10px 28px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            marginBottom: 14,
            fontSize: 14,
            fontWeight: 500,
            background: msg.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: msg.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          {msg.text}
        </div>
      )}

      {/* ============ GROUP BOX PEDIDO ============ */}
      <fieldset
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: '12px 16px 18px',
          marginBottom: 18,
          background: '#fff',
        }}
      >
        <legend style={{ padding: '0 8px', fontSize: 13, fontWeight: 700, color: '#1e4e79', width: 'auto' }}>PEDIDO</legend>

        {/* Linha 01 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Campo label="Fornecedor (N/I)" width={90}>
            <select style={inputStyle()} value={form.origem} onChange={(e) => setF('origem', e.target.value)}>
              <option value="N">N</option>
              <option value="I">I</option>
            </select>
          </Campo>
          <Campo label="Número" width={140}>
            <input style={readOnlyStyle()} value="(automático)" readOnly />
          </Campo>
          <Campo label="Data Emissão" width={140}>
            <input
              style={inputStyle()}
              value={form.dtpedido}
              maxLength={10}
              onChange={(e) => setF('dtpedido', maskDate(e.target.value))}
              placeholder="dd/mm/aaaa"
            />
          </Campo>
          <Campo label="Condições de Pag." width={fieldWidth(30)}>
            <input style={inputStyle()} value={form.condpag} maxLength={30} onChange={(e) => setF('condpag', e.target.value)} />
          </Campo>
        </div>

        {/* Linha 02 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Campo label="Prev. Entrega Fornecedor" width={180}>
            <input
              style={inputStyle()}
              value={form.dtprev}
              maxLength={10}
              onChange={(e) => setF('dtprev', maskDate(e.target.value))}
              placeholder="dd/mm/aaaa"
            />
          </Campo>
          <Campo label="Cod. Fornecedor" width={380}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={readOnlyStyle()}
                value={form.fornecNome}
                readOnly
                placeholder="F4 para pesquisar"
                title={form.fornecNome}
                onKeyDown={(e) => {
                  if (e.key === 'F4') {
                    e.preventDefault();
                    setModal('fornecedor');
                  }
                }}
              />
              <button
                title="Pesquisar fornecedor (F4)"
                onClick={() => setModal('fornecedor')}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#334155' }}
              >
                F4
              </button>
            </div>
          </Campo>
          <Campo label="Código Cobrança" width={120}>
            <input style={inputStyle()} value={form.codcobranca} maxLength={3} onChange={(e) => setF('codcobranca', e.target.value)} />
          </Campo>
        </div>

        {/* Linha 03 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Campo label="Cliente" width={380}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={readOnlyStyle()}
                value={form.clienteNome}
                readOnly
                placeholder="F4 para pesquisar"
                title={form.clienteNome}
                onKeyDown={(e) => {
                  if (e.key === 'F4') {
                    e.preventDefault();
                    setModal('cliente');
                  }
                }}
              />
              <button
                title="Pesquisar cliente (F4)"
                onClick={() => setModal('cliente')}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#334155' }}
              >
                F4
              </button>
            </div>
          </Campo>
          <Campo label="Classe" width={fieldWidth(20)}>
            <input style={inputStyle()} value={form.classe} maxLength={20} onChange={(e) => setF('classe', e.target.value)} />
          </Campo>
          <Campo label="Consultor" width={240}>
            <select style={inputStyle()} value={form.consultor} onChange={(e) => setF('consultor', e.target.value)}>
              <option value="">Selecione</option>
              {vendedores.map((v: any) => (
                <option key={v.codigo} value={v.codigo}>
                  {v.descricao || v.nome_ven || v.codigo}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {/* Linha 04 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Campo label="Modelo/Série" width={fieldWidth(50)}>
            <input style={inputStyle()} value={form.modelo} maxLength={50} onChange={(e) => setF('modelo', e.target.value)} />
          </Campo>
          <Campo label="OS/Pedido" width={130}>
            <select style={inputStyle()} value={form.obsospe} onChange={(e) => setF('obsospe', e.target.value)}>
              <option value="SO">SO</option>
              <option value="Pe">Pe</option>
            </select>
          </Campo>
        </div>

        {/* Linha 05 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Campo label="Tipo N/U/E" width={110}>
            <select style={inputStyle()} value={form.tipo} onChange={(e) => setF('tipo', e.target.value)}>
              <option value="N">N</option>
              <option value="U">U</option>
              <option value="E">E</option>
            </select>
          </Campo>
          <Campo label="Inventário/Consumo" width={90}>
            <input style={inputStyle()} value={form.estoque} maxLength={1} onChange={(e) => setF('estoque', e.target.value.toUpperCase())} />
          </Campo>
          <Campo label="Efetivado na Fábrica" width={150}>
            <select style={inputStyle()} value={form.efetivado} onChange={(e) => setF('efetivado', e.target.value)}>
              <option value="">-</option>
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </Campo>
        </div>

        {/* Linha 06 */}
        <div>
          <Campo label="Observação" width={'100%' as any}>
            <input style={inputStyle()} value={form.obs} maxLength={100} onChange={(e) => setF('obs', e.target.value)} placeholder="Observações da ordem..." />
          </Campo>
        </div>
      </fieldset>

      {/* ============ GROUP BOX DADOS DO PRODUTO ============ */}
      <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 16px 18px', marginBottom: 18, background: '#fff' }}>
        <legend style={{ padding: '0 8px', fontSize: 13, fontWeight: 700, color: '#1e4e79', width: 'auto' }}>DADOS DO PRODUTO</legend>

        {/* Linha 01 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12, alignItems: 'flex-end' }}>
          <Campo label="Fab" width={80}>
            <input
              style={inputStyle()}
              value={produtoForm.fab}
              maxLength={1}
              onChange={(e) => setProdutoForm((p) => ({ ...p, fab: e.target.value.toUpperCase() }))}
            />
          </Campo>
          <Campo label="Código" width={220}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={inputStyle()}
                value={produtoForm.codigo}
                maxLength={30}
                onChange={(e) => setProdutoForm((p) => ({ ...p, codigo: e.target.value }))}
                placeholder="Digite o código ou F4"
                onKeyDown={(e) => {
                  if (e.key === 'F4') {
                    e.preventDefault();
                    setModal('produto');
                  }
                }}
              />
              <button
                title="Pesquisar produto (F4)"
                onClick={() => setModal('produto')}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#334155' }}
              >
                F4
              </button>
            </div>
          </Campo>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Campo label="Nome">
              <input style={readOnlyStyle()} value={produtoForm.nome} readOnly placeholder="Descrição da peça" />
            </Campo>
          </div>
        </div>

        {/* Linha 02 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <Campo label="Qtde" width={100}>
            <input
              style={inputStyle()}
              value={produtoForm.qtde}
              onChange={(e) => setProdutoForm((p) => ({ ...p, qtde: e.target.value.replace(/[^0-9]/g, '') }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
          </Campo>
          <Campo label="Valor Unitário" width={150}>
            <input
              style={inputStyle()}
              value={produtoForm.preco}
              onChange={(e) => setProdutoForm((p) => ({ ...p, preco: maskMoney(e.target.value) }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="0,00"
            />
          </Campo>
          <Campo label="Est. Máximo" width={120}>
            <input style={readOnlyStyle()} value={produtoForm.estmax} readOnly />
          </Campo>
          <Campo label="Est. Mínimo" width={120}>
            <input style={readOnlyStyle()} value={produtoForm.estmin} readOnly />
          </Campo>
          <Campo label="Est. Atual" width={120}>
            <input style={readOnlyStyle()} value={produtoForm.estatual} readOnly />
          </Campo>
        </div>

        {/* Linha 03 */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Campo label="OS/PE" width={110}>
            <select style={inputStyle()} value={produtoForm.ospe} onChange={(e) => setProdutoForm((p) => ({ ...p, ospe: e.target.value }))}>
              <option value="OS">OS</option>
              <option value="PE">PE</option>
            </select>
          </Campo>
          <Campo label="Série" width={fieldWidth(20)}>
            <input
              style={inputStyle()}
              value={produtoForm.serie}
              maxLength={20}
              onChange={(e) => setProdutoForm((p) => ({ ...p, serie: e.target.value }))}
            />
          </Campo>
          <button
            onClick={addItem}
            style={{ background: '#1e4e79', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', height: 36 }}
          >
            + Adicionar item
          </button>
          <button
            onClick={() => setModalPecasOpen(true)}
            style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d', padding: '10px 18px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', height: 36 }}
          >
            Traz Peças Faltantes Selecionadas
          </button>

        </div>
      </fieldset>

      {/* ============ AG GRID ============ */}
      <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', background: '#fff', marginBottom: 14, minHeight: 320 }}>
        <div className="ag-theme-alpine" style={{ height: 320, width: '100%' }}>
          <AgGridReact
            rowData={itens}
            columnDefs={columnDefs}
            defaultColDef={{ resizable: true, filter: true }}
            pinnedBottomRowData={pinnedBottom}
            onCellValueChanged={onCellValueChanged}
            overlayNoRowsTemplate='<span style="padding: 10px; color: #64748b;">Nenhum item adicionado à ordem.</span>'
          />
        </div>
      </div>

      {/* Totalizadores */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' }}>Qtde Itens</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e4e79', marginTop: 4 }}>{totItens}</div>
        </div>
        <div style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' }}>Total de Unidades</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e4e79', marginTop: 4 }}>{totUnidades}</div>
        </div>
        <div style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.4px' }}>Valor Geral</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e4e79', marginTop: 4 }}>{formatMoney(totValor)}</div>
        </div>
      </div>

      {/* ============ MODAIS F4 ============ */}
      <ModalBuscaF4
        title={f4Props.fornecedor.title}
        fetchUrl={f4Props.fornecedor.fetchUrl}
        columns={f4Props.fornecedor.columns}
        open={modal === 'fornecedor'}
        onClose={() => setModal(null)}
        onSelect={f4Props.fornecedor.onSelect}
      />
      <ModalBuscaF4
        title={f4Props.cliente.title}
        fetchUrl={f4Props.cliente.fetchUrl}
        columns={f4Props.cliente.columns}
        open={modal === 'cliente'}
        onClose={() => setModal(null)}
        onSelect={f4Props.cliente.onSelect}
      />
      <ModalBuscaF4
        title={f4Props.produto.title}
        fetchUrl={f4Props.produto.fetchUrl}
        columns={f4Props.produto.columns}
        open={modal === 'produto'}
        onClose={() => setModal(null)}
        onSelect={f4Props.produto.onSelect}
      />
      <ModalPecasFaltantes
        open={modalPecasOpen}
        onClose={() => setModalPecasOpen(false)}
        onSelectItems={handleAddPecasFaltantes}
      />
    </div>
  );
};

export default OrdemCompraFormPage;