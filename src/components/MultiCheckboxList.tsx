import React, { useMemo, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  height?: number;
}

const MultiCheckboxList: React.FC<Props> = ({
  label,
  options,
  selected,
  onChange,
  height = 180
}) => {
  const [search, setSearch] = useState('');

  const validOptions = useMemo(() => options.filter(o => o && o.value), [options]);

  const filtered = useMemo(() => {
    if (!search.trim()) return validOptions;
    const term = search.toLowerCase();
    return validOptions.filter(o => o.label.toLowerCase().includes(term));
  }, [validOptions, search]);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const toggleAll = (checked: boolean) => {
    onChange(checked ? validOptions.map(o => o.value) : []);
  };

  const allSelected = validOptions.length > 0 && validOptions.every(o => selected.includes(o.value));

  return (
    <div>
      <label className="form-label">{label}</label>
      <div style={{ maxHeight: height, overflowY: 'auto', border: '1px solid #e6e6e6', padding: 8, borderRadius: 4 }}>
        <input
          className="form-control mb-2"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id={`select_all_${label.replace(/\s+/g, '_')}`}
            checked={allSelected}
            onChange={e => toggleAll(e.target.checked)}
          />
          <label className="form-check-label" htmlFor={`select_all_${label.replace(/\s+/g, '_')}`}>Selecionar todos</label>
        </div>

        {filtered.map(opt => (
          <div key={opt.value} className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id={`opt_${opt.value}`}
              checked={selected.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            <label className="form-check-label" htmlFor={`opt_${opt.value}`}>{opt.label}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiCheckboxList;













