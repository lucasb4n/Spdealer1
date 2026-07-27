import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './ManutencaoTipoTmoForm.css';

interface FormState {
  modelo_tmo: string;
  codigoMaoObra: string;
  unidadeTempo: string;
  descricao: string;
  codigoCategoria: string;
  codtrib_trib: string;
  precoGarantido: string;
  precoPublico: string;
  acrecimoDesconto: string;
  ativo: boolean;
  codigo: string;
  campoSemLabel: string;
}

export default function ManutencaoTipoTmoForm(): JSX.Element {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation() as any;

  const [form, setForm] = useState<FormState>({
    modelo_tmo: '',
    codigoMaoObra: '',
    unidadeTempo: '',
    descricao: '',
    codigoCategoria: '',
    codtrib_trib: '',
    precoGarantido: '',
    precoPublico: '',
    acrecimoDesconto: '',
    ativo: true,
    codigo: '',
    campoSemLabel: ''
  });

  const [originalModelo, setOriginalModelo] = useState<string | null>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const [mdsOptions, setMdsOptions] = useState<Array<any>>([]);
  const [codigoMaoOptions, setCodigoMaoOptions] = useState<Array<any>>([]);
  const [mastribOptions, setMastribOptions] = useState<Array<any>>([]);
  const [tipotmoOptions, setTipotmoOptions] = useState<Array<any>>([]);
  const [tipotmoSelectedTipo, setTipotmoSelectedTipo] = useState<string | null>(null);
  const [showTipotmoSuggestions, setShowTipotmoSuggestions] = useState(false);
  const [filteredTipotmoOptions, setFilteredTipotmoOptions] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rawId = params?.id ?? (location && location.state && location.state.id ? location.state.id : undefined);
    const id = rawId ? String(rawId).trim() : undefined;
    setIsEdit(!!id);

    const load = async () => {
      try {
        const resp = await fetch('/api/mds');
        let fetchedMds: Array<any> = [];
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) {
            fetchedMds = data;
            setMdsOptions(data);
          }
        }

        let mastribNormalized: Array<any> = [];
        try {
          const rTrib = await fetch('/api/tabelas-auxiliares/mastrib');
          if (rTrib && rTrib.ok) {
            const t = await rTrib.json();
            if (Array.isArray(t)) {
              mastribNormalized = t.map((it: any) => {
                const raw = String(it.codigo ?? it.codigo_trib ?? '').trim();
                const codigo = (/^\d+$/.test(raw) ? raw.padStart(2, '0') : raw);
                return { codigo, descricao: it.descricao ?? it.descr_trib ?? '' };
              });
              setMastribOptions(mastribNormalized);
            }
          }
        } catch (err) {
          // ignore
        }

        try {
          const rTipo = await fetch('/api/mds/tipotmo');
          if (rTipo && rTipo.ok) {
            const tt = await rTipo.json();
            if (Array.isArray(tt)) {
              const normalized = tt.map((it: any) => ({ tipo: String(it.tipo ?? '').trim(), descricao: String(it.descricao ?? '').trim() }));
              setTipotmoOptions(normalized);
              setFilteredTipotmoOptions(normalized);
            }
          }
        } catch (e) {
          // ignore
        }

        if (id) {
          setLoading(true);
          const r = await fetch(`/api/servico/manutencao/tipo-tmo/${encodeURIComponent(id)}`);
          if (r.ok) {
            const registro = await r.json();
            if (registro) {
              let modeloValor: string = registro.modelo_tmo || '';
              if (modeloValor && Array.isArray(fetchedMds) && fetchedMds.length > 0) {
                const trimmed = String(modeloValor).trim();
                const matchByCodigo = (fetchedMds as Array<any>).find((m: any) => String(m.codigo_mds).trim() === trimmed);
                if (matchByCodigo) modeloValor = matchByCodigo.codigo_mds;
                else {
                  const matchesByDescr = (fetchedMds as Array<any>).filter((m: any) => String(m.descr_mds).trim() === trimmed);
                  if (matchesByDescr.length === 1) modeloValor = matchesByDescr[0].codigo_mds;
                  else if (matchesByDescr.length > 1) {
                    matchesByDescr.sort((a: any, b: any) => String(b.codigo_mds).length - String(a.codigo_mds).length);
                    modeloValor = matchesByDescr[0].codigo_mds;
                  }
                }
              }

              const registroCodtribRaw = registro.codtrib_trib ?? registro.codigo_tributacao ?? registro.codigoTributacao ?? '';
              const registroCodTrim = registroCodtribRaw ? String(registroCodtribRaw).trim() : '';

              if (registroCodTrim && !mastribNormalized.some((m: any) => String(m.codigo) === registroCodTrim) && !mastribOptions.some(m => String(m.codigo) === registroCodTrim)) {
                const withAdded = [...mastribNormalized, { codigo: registroCodTrim, descricao: registroCodTrim }];
                setMastribOptions(withAdded);
                mastribNormalized = withAdded;
              }

              setForm(prev => ({
                ...prev,
                modelo_tmo: modeloValor || '',
                codigoMaoObra: registro.codmo_tmo || '',
                unidadeTempo: registro.tempo_tmo || '',
                descricao: registro.descr_tmo || '',
                codigoCategoria: registro.codcat_tmo || registro.codigo_categoria || registro.codigoCategoria || '',
                codtrib_trib: registroCodTrim || '',
                precoGarantido: registro.prcgar_tmo != null ? String(registro.prcgar_tmo) : (registro.preco_garantado || registro.precoGarantado || ''),
                precoPublico: registro.prcpub_tmo != null ? String(registro.prcpub_tmo) : (registro.precoPublico || ''),
                acrecimoDesconto: registro.acredesc_tmo || registro.acrescimo_desconto || registro.acrecimoDesconto || '',
                ativo: registro.ativo_tmo == null ? (registro.ativo == null ? true : Boolean(registro.ativo)) : (String(registro.ativo_tmo).toUpperCase() === 'S'),
                codigo: registro.tipo_tmo || registro.codmo_tmo || registro.id || registro.codigo || ''
              }));

              setOriginalModelo(registro.modelo_tmo || modeloValor || null);
            }
          }
        }
      } catch (err) {
        console.debug('Erro ao inicializar formulário:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    const modelo = form.modelo_tmo;
    if (!modelo) {
      setCodigoMaoOptions([]);
      setForm(prev => ({ ...prev, codigoMaoObra: '' }));
      return;
    }

    let mounted = true;
    const loadMao = async () => {
      try {
        const resp = await fetch(`/api/mds/${encodeURIComponent(modelo)}/maos`);
        if (!resp.ok) {
          setCodigoMaoOptions([]);
          return;
        }
        const data = await resp.json();
        if (mounted && Array.isArray(data)) {
          const opts = data.map((it: any) => ({
            codigo: String(it.codigo || it.codmo || it.codmo_tmo || it.codigo_mo || '').trim(),
            descricao: String(it.descricao || it.descr || it.descr_mo || it.descricao_mo || it.nome || '').trim(),
            tipo: it.tipo_ttmo || it.tipo || null
          }));
          setCodigoMaoOptions(opts);
          const exists = opts.some(o => o.codigo === form.codigoMaoObra);
          if (!exists) setForm(prev => ({ ...prev, codigoMaoObra: '' }));
        }
      } catch (err) {
        setCodigoMaoOptions([]);
      }
    };

    loadMao();
    return () => { mounted = false; };
  }, [form.modelo_tmo]);

  const searchTipoTmo = async (q: string) => {
    try {
      const url = q && q.trim() !== '' ? `/api/mds/tipotmo?search=${encodeURIComponent(q)}` : '/api/mds/tipotmo';
      const r = await fetch(url);
      if (!r.ok) return;
      const data = await r.json();
      if (Array.isArray(data)) {
        const normalized = data.map((it: any) => ({ tipo: String(it.tipo ?? '').trim(), descricao: String(it.descricao ?? '').trim() }));
        setTipotmoOptions(normalized);
        setFilteredTipotmoOptions(normalized);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleCodigoInputChangeValue = (v: string) => {
    setForm(prev => ({ ...prev, codigo: v }));
    setTipotmoSelectedTipo(null);
    if (!v || v.trim() === '') {
      setFilteredTipotmoOptions(tipotmoOptions);
      setShowTipotmoSuggestions(true);
      return;
    }
    const q = String(v).toLowerCase();
    const matched = tipotmoOptions.filter((t: any) => String(t.descricao || '').toLowerCase().includes(q));
    if (matched.length > 0) {
      setFilteredTipotmoOptions(matched);
      setShowTipotmoSuggestions(true);
    } else {
      searchTipoTmo(v);
      setShowTipotmoSuggestions(true);
    }
  };

  const handleSelectTipotmo = (opt: { tipo: string; descricao: string }) => {
    setForm(prev => ({ ...prev, codigo: String(opt.descricao || '') }));
    setTipotmoSelectedTipo(String(opt.tipo || ''));
    setShowTipotmoSuggestions(false);
  };

  const handleChange = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = (e.target as HTMLInputElement | HTMLSelectElement).type === 'checkbox'
      ? ((e.target as HTMLInputElement).checked as any)
      : (e.target as HTMLInputElement | HTMLSelectElement).value;
    setForm(prev => ({ ...prev, [k]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parseNumber = (v: any) => {
        if (v === undefined || v === null) return null;
        const s = String(v).trim();
        if (s === '') return null;
        const n = Number(s.replace(',', '.'));
        return Number.isNaN(n) ? null : n;
      };

      const payload: any = {
        modelo_tmo: form.modelo_tmo,
        codmo_tmo: form.codigoMaoObra,
        descr_tmo: form.descricao,
        tempo_tmo: parseNumber(form.unidadeTempo),
        codtrib_trib: form.codtrib_trib || null,
        prcpub_tmo: parseNumber(form.precoPublico),
        prcgar_tmo: parseNumber(form.precoGarantido)
      };
      payload.codcat_tmo = form.codigoCategoria || null;
      payload.codmo_tmo = form.codigoMaoObra || null;
      try {
        if (tipotmoSelectedTipo) {
          payload.tipo_tmo = tipotmoSelectedTipo;
        } else if (form.codigo && String(form.codigo).trim() !== '') {
          const found = tipotmoOptions.find((t: any) => String(t.descricao) === String(form.codigo).trim() || String(t.tipo) === String(form.codigo).trim());
          payload.tipo_tmo = found ? found.tipo : null;
        } else {
          const selectedMao = codigoMaoOptions.find((o: any) => o.codigo === form.codigoMaoObra);
          payload.tipo_tmo = selectedMao && selectedMao.tipo ? selectedMao.tipo : null;
        }
      } catch (e) {
        payload.tipo_tmo = null;
      }
      payload.acredesc_tmo = (form.acrecimoDesconto && String(form.acrecimoDesconto).trim() !== '')
        ? String(form.acrecimoDesconto).trim().toUpperCase()
        : null;

      const rawId = params?.id ?? (location && location.state && location.state.id ? location.state.id : undefined);
      const id = rawId ? String(rawId).trim() : undefined;
      if (id && (!payload.codmo_tmo || String(payload.codmo_tmo).trim() === '')) {
        payload.codmo_tmo = id;
      }
      if (id) payload.originalModelo = originalModelo || form.modelo_tmo || null;

      if (id) {
        const url = `/api/servico/manutencao/tipo-tmo/${encodeURIComponent(id)}`;
        const resp = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!resp.ok) throw new Error('Falha ao atualizar');
      } else {
        const url = '/api/servico/manutencao/tipo-tmo';
        const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!resp.ok) throw new Error('Falha ao criar');
      }
      navigate('/servico/manutencao/tipo-tmo');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar. Veja console para detalhes.');
    }
  };

  return (
    <form className="mant-tmo-form" onSubmit={handleSubmit}>
      <div className="row">
        <label>
          Modelo Veículo
          <select value={form.modelo_tmo} onChange={handleChange('modelo_tmo')} disabled={isEdit}>
            <option value="">-- Selecione --</option>
            {mdsOptions.map((opt: any, i: number) => (
              <option key={`${opt.codigo_mds}-${i}`} value={opt.codigo_mds}>{`${opt.codigo_mds} (${opt.descr_mds})`}</option>
            ))}
          </select>
        </label>
        <label>
          Código Mão de Obra
          {codigoMaoOptions.length > 0 ? (
            <select value={form.codigoMaoObra} onChange={handleChange('codigoMaoObra')} disabled={isEdit}>
              <option value="">-- Selecione --</option>
              {codigoMaoOptions.map((opt: any, i: number) => (
                <option key={`${opt.codigo}-${i}`} value={opt.codigo}>{opt.descricao || opt.codigo}</option>
              ))}
            </select>
          ) : (
            <input type="text" value={form.codigoMaoObra} onChange={handleChange('codigoMaoObra')} readOnly={isEdit} />
          )}
        </label>
      </div>

      <div className="row">
        <label>
          Unidade de Tempo
          <input type="text" value={form.unidadeTempo} onChange={handleChange('unidadeTempo')} />
        </label>
        <label>
          Descrição
          <input type="text" value={form.descricao} onChange={handleChange('descricao')} />
        </label>
      </div>

      <div className="row">
        <label>
          Código Categoria
          <input type="text" value={form.codigoCategoria} onChange={handleChange('codigoCategoria')} />
        </label>
        <label>
          Tributação
          <select value={form.codtrib_trib} onChange={handleChange('codtrib_trib')}>
            <option value="">-- Selecione --</option>
            {mastribOptions.map((m: any, i: number) => (
              <option key={`${m.codigo}-${i}`} value={m.codigo}>{m.descricao || m.codigo}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="row">
        <label>
          Preço Público (R$)
          <input type="text" value={form.precoPublico} onChange={handleChange('precoPublico')} />
        </label>
        <label>
          Preço Garantia (R$)
          <input type="text" value={form.precoGarantido} onChange={handleChange('precoGarantido')} />
        </label>
        <label>
          Acrésc./Desc.
          <input type="text" value={form.acrecimoDesconto} onChange={handleChange('acrecimoDesconto')} />
        </label>
      </div>

      <div className="row">
        <label className="tipo-tmo-field">
          Tipo TMO
          <input type="text" value={form.codigo} onChange={(e) => handleCodigoInputChangeValue(e.target.value)} onFocus={() => { setShowTipotmoSuggestions(true); setFilteredTipotmoOptions(tipotmoOptions); }} />
          {showTipotmoSuggestions && filteredTipotmoOptions.length > 0 && (
            <ul className="suggestions">
              {filteredTipotmoOptions.map((opt: any, i: number) => (
                <li key={`${opt.tipo}-${i}`} onClick={() => handleSelectTipotmo(opt)}>{`${opt.descricao} (${opt.tipo})`}</li>
              ))}
            </ul>
          )}
        </label>
        <label>
          Ativo
          <input type="checkbox" checked={form.ativo} onChange={handleChange('ativo')} />
        </label>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/servico/manutencao/tipo-tmo')}>Cancelar</button>
        <button type="submit" className="btn btn-primary">{isEdit ? 'Salvar Alterações' : 'Criar TMO'}</button>
      </div>
    </form>
  );
}
