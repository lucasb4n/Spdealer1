import React, { useState, useEffect } from 'react';

type Props = {
  visible: boolean;
  onClose: (refresh?: boolean) => void;
  documentoIds: number[];
  initialTipo?: 'RECEBER'|'PAGAR';
  initialBanco?: string;
  initialOperacao?: number;
  initialValor?: number;
};

export default function RegistrarLancamentoModal({ visible, onClose, documentoIds, initialTipo = 'RECEBER', initialBanco = '001', initialOperacao = 500, initialValor = 0 }: Props) {
  const [tipo, setTipo] = useState<'RECEBER'|'PAGAR'>(initialTipo);
  const [banco, setBanco] = useState(initialBanco || '001');
  const [operacao, setOperacao] = useState(initialOperacao || 500);
  const [valorCalculado, setValorCalculado] = useState<number>(initialValor ?? 0);
  const [confirmChecked, setConfirmChecked] = useState<boolean>(false);
  const [data, setData] = useState(new Date().toISOString().slice(0,10));
  const [historico, setHistorico] = useState('Lancamento via Fluxo de Caixa');
  const [loading, setLoading] = useState(false);

  // Sync internal state when modal props change (so modal reflects calculated values)
  useEffect(() => {
    if (!visible) return;
    setTipo(initialTipo);
    setBanco(initialBanco || '001');
    setOperacao(initialOperacao || 500);
    setValorCalculado(Number(initialValor || 0));
    setConfirmChecked(false);
    setData(new Date().toISOString().slice(0,10));
    setHistorico('Lancamento via Fluxo de Caixa');
  }, [visible, initialTipo, initialBanco, initialOperacao, initialValor]);

  if (!visible) return null;

  async function submit() {
    setLoading(true);
    try {
      const payload = {
        tipo,
        operacao,
        banco,
        cliente: banco,
        data,
        historico,
        documentoIds,
        filial: 1
      };

      const res = await fetch('/api/v1/fluxo-caixa/lancamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const j = await res.json();
        alert('Erro: ' + (j.error || JSON.stringify(j)));
      } else {
        alert('Lançamento registrado com sucesso');
        onClose(true);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao registrar lançamento');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal show d-block" tabIndex={-1} role="dialog">
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Registrar Lançamento no Caixa</h5>
            <button type="button" className="close btn btn-sm" onClick={() => onClose(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="mb-2">
              <label>Valor (calculado)</label>
              <input className="form-control" value={new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(valorCalculado || 0)} readOnly />
            </div>
            <div className="mb-2 form-check">
              <input type="checkbox" className="form-check-input" id="confirmValor" checked={confirmChecked} onChange={e => setConfirmChecked(e.target.checked)} />
              <label className="form-check-label" htmlFor="confirmValor">Confirmo que o valor corresponde à soma dos documentos selecionados</label>
            </div>
            <div className="mb-2">
              <label>Tipo</label>
              <select className="form-control" value={tipo} onChange={e => setTipo(e.target.value as any)}>
                <option value="RECEBER">Receber (Crédito)</option>
                <option value="PAGAR">Pagar (Débito)</option>
              </select>
            </div>
            <div className="mb-2 row">
              <div className="col-md-6">
                <label>Banco</label>
                <input className="form-control" value={banco} onChange={e => setBanco(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label>Operação</label>
                <input className="form-control" type="number" value={operacao} onChange={e => setOperacao(Number(e.target.value))} />
              </div>
            </div>
            <div className="mb-2">
              <label>Data</label>
              <input className="form-control" type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div className="mb-2">
              <label>Histórico</label>
              <input className="form-control" value={historico} onChange={e => setHistorico(e.target.value)} />
            </div>
            <div>
              <small>Documentos selecionados: {documentoIds.length}</small>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => onClose(false)} disabled={loading}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading || !confirmChecked}>{loading ? 'Gravando...' : 'Registrar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}













