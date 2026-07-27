import React, { useEffect, useState } from 'react';

interface Props {
  onSelectDate: (date: string | null) => void;
}

// Função para formatar data de YYYY-MM-DD para DD/MM/YYYY
const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length !== 10) return dateStr;
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const InventarioFilter: React.FC<Props> = ({ onSelectDate }) => {
  const [dates, setDates] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/invent/dates', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) {
          console.warn('Inventario dates fetch response not ok', r.status, r.statusText);
        }
        const text = await r.text();
        try {
          const d = JSON.parse(text);
          return d;
        } catch (e) {
          console.warn('Inventario dates: response not JSON', text.substring(0,200));
          return null;
        }
      })
      .then((d: any) => {
        // API may return an array or an object with a property; normalize to array
        if (Array.isArray(d)) return setDates(d);
        if (d && Array.isArray(d.dates)) return setDates(d.dates);
        // if response is an object with rows, try to extract a single column
        if (d && Array.isArray(d.rows)) return setDates(d.rows.map((r: any) => r.date_inv || r.date || String(r)));
        setDates([]);
      })
      .catch(() => setDates([]));
  }, []);

  useEffect(() => {
    onSelectDate(selected);
  }, [selected, onSelectDate]);

  return (
    <div className="card mb-3 p-3">
      <h5>Filtro</h5>
      <div className="list-group" style={{ maxHeight: 200, overflowY: 'auto' }}>
        {(!Array.isArray(dates) || dates.length === 0) && <div className="text-muted">Nenhuma data encontrada</div>}
        {Array.isArray(dates) && dates.map(d => (
          <button
            key={d}
            className={`list-group-item list-group-item-action ${selected === d ? 'active' : ''}`}
            onClick={() => setSelected(d)}
          >
            {formatDate(d)}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <button className="btn btn-sm btn-secondary me-2" onClick={() => setSelected(null)}>Limpar</button>
      </div>
    </div>
  );
};

export default InventarioFilter;













