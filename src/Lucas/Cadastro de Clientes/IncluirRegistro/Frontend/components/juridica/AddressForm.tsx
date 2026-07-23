import React, { useState, useEffect } from 'react';
import { inputClass, labelClass } from '../styles';
import { ClientesService } from '../../../../../../services/ClientesService';
import { maskCEP, maskPhone } from '../../../../../../utils/maskUtils';

interface AddressFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ data = {}, onChange }) => {
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [regioes, setRegioes] = useState<Array<{reg_codigo: string, reg_descricao: string}>>([]);

  const read = (k: string, fallback?: any) => data[k] ?? fallback ?? '';

  useEffect(() => {
    let mounted = true;
    const fetchRegioes = async () => {
      try {
        const res = await fetch('/api/regioes');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setRegioes(data.map((r: any) => ({ reg_codigo: String(r.reg_codigo), reg_descricao: r.reg_descricao })));
      } catch (err) {
        console.error('Erro ao carregar regiões', err);
      }
    };
    fetchRegioes();
    return () => { mounted = false };
  }, []);

  const consultCep = async () => {
    try {
      const cep = read('cep-cli', read('cep', ''));
      const cepLimpo = (cep || '').replace(/\D/g, '');
      if (!cepLimpo || cepLimpo.length !== 8) {
        alert('Informe um CEP válido (8 dígitos) antes de consultar.');
        return;
      }

      setConsultandoCep(true);
      const dados = await ClientesService.buscarCEP(cepLimpo);
      setConsultandoCep(false);

      if (dados) {
        if (dados.logradouro) onChange('logra-cli', dados.logradouro);
        if (dados.bairro) onChange('bairro-cli', dados.bairro);
        if (dados.localidade) onChange('cidade-cli', dados.localidade);
        if (dados.uf) onChange('uf-cli', dados.uf);
      }
    } catch (err) {
      setConsultandoCep(false);
    }
  }

  return (
    <div className="space-y-6 p-2 animate-in fade-in duration-300">
      
      {/* SEÇÃO: LOCALIZAÇÃO PRINCIPAL */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Endereço Principal" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex gap-4 items-end">
            <div style={{ flex: '1 0 500px' }}>
              <label className={`${labelClass} block mb-1.5`}>Logradouro</label>
              <input
                className={inputClass}
                placeholder="Rua, Av, etc."
                value={read('logra-cli', read('street'))}
                onChange={(e) => onChange('logra-cli', e.target.value)}
              />
            </div>
            <div style={{ width: '100px' }}>
              <label className={`${labelClass} block mb-1.5`}>Número</label>
              <input
                className={inputClass}
                placeholder="nº"
                value={read('numero-cli', read('number'))}
                onChange={(e) => onChange('numero-cli', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="atualizado"
                className="w-5 h-5 rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc] cursor-pointer"
                checked={!!(read('atualizado-cli') || read('updatedAt'))}
                onChange={(e) => onChange('atualizado-cli', e.target.checked)}
              />
              <label htmlFor="atualizado" className={`${labelClass} cursor-pointer select-none whitespace-nowrap`}>Cadastro Atualizado</label>
            </div>
          </div>

          <div className="col-span-12 flex gap-4 items-end mt-2">
            <div style={{ width: '250px' }}>
              <label className={`${labelClass} block mb-1.5`}>Bairro</label>
              <input
                className={inputClass}
                value={read('bairro-cli', read('neighborhood'))}
                onChange={(e) => onChange('bairro-cli', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className={`${labelClass} block mb-1.5`}>Cidade</label>
              <input
                className={inputClass}
                value={read('cidade-cli', read('city'))}
                onChange={(e) => onChange('cidade-cli', e.target.value)}
              />
            </div>
            <div style={{ width: '80px' }}>
              <label className={`${labelClass} block mb-1.5`}>UF</label>
              <input
                className={`${inputClass} uppercase text-center`}
                maxLength={2}
                value={read('uf-cli', read('uf'))}
                onChange={(e) => onChange('uf-cli', e.target.value.toUpperCase())}
              />
            </div>
            <div style={{ width: '140px' }}>
              <label className={`${labelClass} block mb-1.5`}>CEP</label>
              <div className="flex gap-1">
                <input
                  style={{ width: '120px' }}
                  className={`${inputClass} text-center px-1`}
                  placeholder="00000-000"
                  value={maskCEP(read('cep-cli', read('cep')) as string)}
                  onChange={(e) => onChange('cep-cli', maskCEP(e.target.value))}
                />
                <button
                  type="button"
                  onClick={consultCep}
                  disabled={consultandoCep}
                  className="bg-[#0066cc] text-white px-2 py-2 rounded text-[9px] font-bold uppercase hover:bg-[#0052a3] transition-colors disabled:bg-gray-300 flex-1"
                >
                  {consultandoCep ? '...' : 'Buscar'}
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 flex items-end mt-2">
            <div className="flex-1" />
            <div className="flex gap-4 items-end">
              <div style={{ width: '180px' }}>
                <label className={`${labelClass} block mb-1.5`}>Latitude</label>
                <input
                  className={inputClass}
                  value={read('latitude-cli', read('latitude'))}
                  onChange={(e) => onChange('latitude-cli', e.target.value)}
                />
              </div>
              <div style={{ width: '180px' }}>
                <label className={`${labelClass} block mb-1.5`}>Longitude</label>
                <input
                  className={inputClass}
                  value={read('longitude-cli', read('longitude'))}
                  onChange={(e) => onChange('longitude-cli', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO: CONTATOS */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Contatos e Comunicação" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex gap-4 items-end mt-4">
            <div className="flex-1">
              <label className={`${labelClass} block mb-1.5`}>Fone Comercial</label>
              <input
                className={inputClass}
                placeholder="(00) 0000-0000"
                value={maskPhone(read('fone1-cli', read('phone')) as string)}
                onChange={(e) => onChange('fone1-cli', maskPhone(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className={`${labelClass} block mb-1.5`}>Celular</label>
              <input
                className={inputClass}
                placeholder="(00) 90000-0000"
                value={maskPhone(read('celular-cli', read('cellphone')) as string)}
                onChange={(e) => onChange('celular-cli', maskPhone(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className={`${labelClass} block mb-1.5`}>WhatsApp</label>
              <input
                className={inputClass}
                placeholder="(00) 90000-0000"
                value={maskPhone(read('fone2-cli', read('whatsapp')) as string)}
                onChange={(e) => onChange('fone2-cli', maskPhone(e.target.value))}
              />
            </div>
          </div>
          <div className="col-span-12">
            <label className={`${labelClass} block mb-1.5`}>E-mail</label>
            <input
              className={inputClass}
              placeholder="email@exemplo.com.br"
              type="email"
              value={read('email-cli', read('email'))}
              onChange={(e) => onChange('email-cli', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO: LOGÍSTICA / REGIÃO */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Região e Logística" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 md:col-span-4">
            <label className={`${labelClass} block mb-1.5`}>Região</label>
            <select
              className={inputClass}
              value={read('regiao-cli', read('regionId'))}
              onChange={(e) => {
                const val = e.target.value;
                onChange('regiao-cli', val);
                const found = regioes.find(r => r.reg_codigo === val);
                if (found) onChange('reg_descrição', found.reg_descricao);
                else onChange('reg_descrição', '');
              }}
            >
              <option value="">-- Selecione --</option>
              {regioes.map(r => (
                <option key={r.reg_codigo} value={r.reg_codigo}>{r.reg_descricao}</option>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className={`${labelClass} block mb-1.5`}>Descrição da Região</label>
            <input
              className={inputClass}
              placeholder="Descrição da Região"
              value={read('reg_descrição', read('regionDescription'))}
              onChange={(e) => onChange('reg_descrição', e.target.value)}
            />
          </div>
          <div className="col-span-12 md:col-span-2 flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="etiquetas"
              className="w-5 h-5 rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
              checked={!!read('etiquetas-cli', read('printLabels'))}
              onChange={(e) => onChange('etiquetas-cli', e.target.checked)}
            />
            <label htmlFor="etiquetas" className={`${labelClass} cursor-pointer`}>Emitir Etiquetas</label>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-[11px] font-bold text-[#0066cc] uppercase tracking-widest border-b border-gray-100 pb-1 mb-2">
    {title}
  </h3>
);

export default AddressForm;
