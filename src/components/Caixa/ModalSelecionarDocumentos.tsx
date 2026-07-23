import React, { useEffect, useState } from 'react';

type Documento = {
  codigo: number;
  numdup?: string;
  parcela?: string;
  dtvenci?: string;
  vlrdup?: number;
  vlrmult?: number;
  vlracre?: number;
  vlrdesc?: number;
  vlrtot?: number;
  vlrsal?: number;
};

interface Props {
  tipo: 'RECEBER' | 'PAGAR';
  clienteOuFornecedor: string;
  valorMovimento: number;
  movimentoId?: number | null;
  onConfirm: (documentos: Documento[], total: number) => void;
  onCancel: () => void;
}

export default function ModalSelecionarDocumentos(props: Props) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [selected, setSelected] = useState<Record<number, Documento>>({});
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const buscar = async () => {
      setLoading(true);
      try {
        const url = props.tipo === 'RECEBER'
          ? `/api/v1/receber/cliente/${props.clienteOuFornecedor}`
          : `/api/v1/pagar/fornecedor/${props.clienteOuFornecedor}`;

        const r = await fetch(url);
        if (!r.ok) throw new Error('Erro ao buscar documentos');
        const data = await r.json();
        setDocumentos(data || []);
      } catch (e) {
        console.error(e);
        setDocumentos([]);
      } finally {
        setLoading(false);
      }
    };

    if (props.clienteOuFornecedor) buscar();
  }, [props.clienteOuFornecedor, props.tipo]);

  useEffect(() => {
    const sum = Object.values(selected).reduce((s, d) => s + (d.vlrtot || 0), 0);
    setTotal(sum);
  }, [selected]);

  const toggle = (doc: Documento) => {
    setSelected(prev => {
      const copy = { ...prev };
      if (copy[doc.codigo]) delete copy[doc.codigo]; else copy[doc.codigo] = doc;
      return copy;
    });
  };

  const confirmar = async () => {
    const docs = Object.values(selected);
    const totalSel = docs.reduce((s, d) => s + (d.vlrtot || 0), 0);
    if (Math.abs(totalSel - props.valorMovimento) > 0.01) {
      alert('Totais não conferem!');
      return;
    }

    // Envia para callback - integração com backend feita no Formulario
    props.onConfirm(docs, totalSel);
  };

  return (
    <div className="modal-selecionar-documentos">
      <div className="modal-header">
        <h3>Selecionar Documentos - {props.tipo}</h3>
        <button onClick={props.onCancel}>Fechar</button>
      </div>
      <div className="modal-body">
        {loading && <div>Carregando...</div>}
        {!loading && documentos.length === 0 && <div>Nenhum documento encontrado</div>}

        {!loading && documentos.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Documento</th>
                <th>Parc</th>
                <th>Venc</th>
                <th>Valor</th>
                <th>Multa</th>
                <th>Juros</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => (
                <tr key={doc.codigo}>
                  <td>
                    <input type="checkbox" checked={!!selected[doc.codigo]} onChange={() => toggle(doc)} />
                  </td>
                  <td>{doc.numdup || doc.codigo}</td>
                  <td>{doc.parcela}</td>
                  <td>{doc.dtvenci}</td>
                  <td>{(doc.vlrdup || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td>{(doc.vlrmult || 0).toFixed(2)}</td>
                  <td>{(doc.vlracre || 0).toFixed(2)}</td>
                  <td>{(doc.vlrtot || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
      <div className="modal-footer">
        <div>Total Selecionado: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        <button onClick={confirmar} disabled={Math.abs(total - props.valorMovimento) > 0.01}>Confirmar Baixa</button>
        <button onClick={props.onCancel}>Cancelar</button>
      </div>
    </div>
  );
}













