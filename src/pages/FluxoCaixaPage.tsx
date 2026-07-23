import React, { useEffect, useState } from 'react';
import RegistrarLancamentoModal from 'components/RegistrarLancamentoModal';
import { CaixaBancosService } from 'services/CaixaBancosService';

type Movimento = {
  seq: number;
  data: string;
  tipo: string;
  valor: number;
  banco: string;
  historico: string;
  documentos: any;
};

export default function FluxoCaixaPage(): JSX.Element {
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [banco, setBanco] = useState<string>('');
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [totais, setTotais] = useState({ total_credito: 0, total_debito: 0 });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function load(bancoFilter?: string) {
    setLoading(true);
    try {
      const q = bancoFilter ? `?banco=${encodeURIComponent(bancoFilter)}` : '';
      const res = await fetch(`/api/v1/fluxo-caixa/today${q}`);
      const j = await res.json();
      setMovimentos(j.movimentos || []);
      setTotais({ total_credito: j.total_credito || 0, total_debito: j.total_debito || 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggleSelect(seq: number) {
    setSelected(prev => ({ ...prev, [seq]: !prev[seq] }));
  }

  const documentosSelecionados = Object.keys(selected).filter(k => selected[Number(k)]).map(k => Number(k));

  return (
    <div className="container mt-3">
      <h3>Fluxo de Caixa - Hoje</h3>
      <div className="row mb-2">
        <div className="col-md-3">
          <label>Banco</label>
          <input className="form-control" value={banco} onChange={e => setBanco(e.target.value)} placeholder="Código do banco" />
        </div>
        <div className="col-md-3 align-self-end">
          <button className="btn btn-primary" onClick={() => load(banco)}>Filtrar</button>
        </div>
        <div className="col-md-6 text-end align-self-end">
          <strong>Crédito:</strong> {CaixaBancosService.formatarMoeda(totais.total_credito)} &nbsp;&nbsp;
          <strong>Débito:</strong> {CaixaBancosService.formatarMoeda(totais.total_debito)}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-striped">
          <thead>
            <tr>
              <th></th>
              <th>Seq</th>
              <th>Data</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Banco</th>
              <th>Histórico</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={7}>Carregando...</td></tr>) : movimentos.map(m => (
              <tr key={m.seq}>
                <td><input type="checkbox" checked={!!selected[m.seq]} onChange={() => toggleSelect(m.seq)} /></td>
                <td>{m.seq}</td>
                <td>{m.data}</td>
                <td>{m.tipo}</td>
                <td style={{ textAlign: 'right' }}>{CaixaBancosService.formatarMoeda(Number(m.valor) || 0)}</td>
                <td>{m.banco}</td>
                <td>{m.historico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-success" disabled={documentosSelecionados.length===0} onClick={() => setShowModal(true)}>
          Registrar no Caixa ({documentosSelecionados.length})
        </button>
      </div>

      {showModal && (
        <RegistrarLancamentoModal visible={showModal} documentoIds={documentosSelecionados} onClose={(refresh?: boolean) => { setShowModal(false); if (refresh) load(banco); }} />
      )}

    </div>
  );
}













