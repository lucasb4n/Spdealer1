import React, { useCallback, useEffect, useState } from 'react';
import InventarioFilter from 'components/Inventario/InventarioFilter';
import InventarioGrid from 'components/Inventario/InventarioGrid';

const InventarioPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadByDate = useCallback((date: string | null) => {
    if (!date) { setRows([]); return; }
    setLoading(true);
    const url = `/api/v1/invent/by-date?date=${encodeURIComponent(date)}`;
    fetch(url)
      .then(async r => {
        if (!r.ok) {
          const txt = await r.text();
          console.error('Inventario API error', r.status, txt);
          throw new Error(`Server error ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        // normalize response shape
        if (Array.isArray(data)) setRows(data);
        else if (data && Array.isArray((data as any).rows)) setRows((data as any).rows);
        else if (data && Array.isArray((data as any).data)) setRows((data as any).data);
        else setRows([]);
      })
      .catch(e => {
        console.error('Failed to load invent by date:', e);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadByDate(selectedDate); }, [selectedDate, loadByDate]);

  const gridRef = React.useRef<any>(null);

  const exportPdf = async () => {
    if (!selectedDate) return alert('Selecione uma data antes de exportar');
    try {
      const params = { tipo: 'inventario', templateName: 'InventarioReport', date: selectedDate };
      const resp = await fetch('/api/relatorios-jasper/financeiro/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
      });
      if (!resp.ok) throw new Error('Erro ao gerar PDF');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inventario_${selectedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar PDF');
    }
  };

  const exportCsv = () => {
    if (!gridRef.current) return alert('Grid não inicializado');
    gridRef.current.exportCsv();
  };

  return (
    <div>
      <h2>Registro de Inventário Mensal</h2>
      <div className="row">
        <div className="col-md-3">
          <InventarioFilter onSelectDate={setSelectedDate} />
        </div>
        <div className="col-md-9">
          <div className="mb-2 d-flex justify-content-end" style={{ gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={exportCsv} disabled={!selectedDate}>Exportar CSV</button>
            <button className="btn btn-sm btn-primary" onClick={exportPdf} disabled={!selectedDate}>Exportar PDF (Jasper)</button>
          </div>
          {loading ? <div>Carregando...</div> : <InventarioGrid ref={gridRef} rows={rows} date={selectedDate} />}
        </div>
      </div>
    </div>
  );
};

export default InventarioPage;













