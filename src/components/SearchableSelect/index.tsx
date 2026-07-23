import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  fetchUrl: string;
  valueField: string;
  displayField: string;
  value: string;
  onChange: (value: string, display: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

interface Option {
  [key: string]: any;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Digite para buscar...',
  fetchUrl,
  valueField,
  displayField,
  value,
  onChange,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);
  const focusedRef = useRef(false);

  const formatDisplay = useCallback((val: string, disp: string) => {
    if (!disp) return val;
    const cleanVal = String(val).trim();
    const cleanDisp = String(disp).trim();
    if (cleanDisp.startsWith(cleanVal)) {
      return cleanDisp;
    }
    return `${cleanVal} - ${cleanDisp}`;
  }, []);

  const renderOptionText = useCallback((val: string, disp: string) => {
    if (!disp) return <strong>{val}</strong>;
    const cleanVal = String(val).trim();
    const cleanDisp = String(disp).trim();
    if (cleanDisp.startsWith(cleanVal)) {
      const rest = cleanDisp.substring(cleanVal.length).replace(/^[\s-:]+/, '');
      return (
        <>
          <strong>{cleanVal}</strong> {rest ? `- ${rest}` : ''}
        </>
      );
    }
    return (
      <>
        <strong>{cleanVal}</strong> - {cleanDisp}
      </>
    );
  }, []);

  const doSearch = useCallback(async (term: string) => {
    let searchVal = term;
    if (term.includes(' - ')) {
      searchVal = term.split(' - ')[0].trim();
    }
    if (!searchVal || searchVal.length < 1) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || '/api';
      let resolvedUrl = fetchUrl;
      if (fetchUrl.startsWith('/api') && !fetchUrl.startsWith(baseUrl)) {
        resolvedUrl = baseUrl + fetchUrl.substring(4);
      }
      const separator = resolvedUrl.includes('?') ? '&' : '?';
      const resp = await fetch(`${resolvedUrl}${separator}search=${encodeURIComponent(searchVal)}`);
      if (resp.ok) {
        const data = await resp.json();
        const arr = Array.isArray(data) ? data.slice(0, 50) : [];
        setOptions(arr);
        if (!focusedRef.current) {
          const exactMatch = arr.find(item => String(item[valueField]).trim() === searchVal.trim());
          if (exactMatch) {
            const disp = String(exactMatch[displayField] || '');
            setSearchTerm(formatDisplay(searchVal, disp));
          }
        }
      }
    } catch { } finally {
      setLoading(false);
    }
  }, [fetchUrl, valueField, displayField, formatDisplay]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doSearch(searchTerm);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [searchTerm, doSearch]);

  useEffect(() => {
    const trimmedVal = String(value || '').trim();
    if (!trimmedVal) {
      setSearchTerm('');
    } else {
      const trimmedTerm = String(searchTerm || '').trim();
      if (trimmedVal !== trimmedTerm && !trimmedTerm.includes(` - `)) {
        setSearchTerm(trimmedVal);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
        focusedRef.current = false;
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (opt: Option) => {
    onChange(String(opt[valueField]), String(opt[displayField]));
    const disp = String(opt[displayField] || '');
    setSearchTerm(formatDisplay(String(opt[valueField]), disp));
    setFocused(false);
    focusedRef.current = false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!e.target.value) {
      onChange('', '');
    }
  };

  return (
    <div className="sp-searchable-select" ref={containerRef}>
      {label && <label className="sp-field__label">{label}</label>}
      <input
        className="sp-field__input sp-searchable-input"
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => { if (!disabled) { setFocused(true); focusedRef.current = true; } }}
        autoComplete="off"
        disabled={disabled}
      />
      {focused && (
        <div className="sp-searchable-results">
          {loading ? (
            <div className="sp-searchable-item">Buscando...</div>
          ) : options.length > 0 ? (
            options.map((opt, i) => (
              <div
                key={i}
                className={`sp-searchable-item${String(opt[valueField]) === value ? ' sp-searchable-item--selected' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
              >
                {renderOptionText(String(opt[valueField]), String(opt[displayField]))}
              </div>
            ))
          ) : searchTerm.length > 0 ? (
            <div className="sp-searchable-item">Nenhum resultado encontrado</div>
          ) : (
            <div className="sp-searchable-item">Digite para buscar...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
