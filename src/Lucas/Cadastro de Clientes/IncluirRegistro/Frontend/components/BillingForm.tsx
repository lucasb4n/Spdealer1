import React, { useState, useEffect } from 'react';
import { inputClass, labelClass } from './styles';
import { ClientesService } from '../../../../../services/ClientesService';
import { maskCEP } from '../../../../../utils/maskUtils';
import './BillingForm.css';

interface BillingFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

const BillingForm: React.FC<BillingFormProps> = ({ data, onChange }) => {
  const [consultandoCep, setConsultandoCep] = useState(false);

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name, e.target.checked);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name, e.target.value);
  };

  const maskPhone = (raw: string) => {
    const d = (raw || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) {
      return d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_m, a, b, c) => {
        if (!b) return a ? `(${a})` : '';
        if (!c) return `(${a}) ${b}`;
        return `(${a}) ${b}-${c}`;
      }).trim();
    }
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_m, a, b, c) => {
      if (!c) return `(${a}) ${b}`;
      return `(${a}) ${b}-${c}`;
    }).trim();
  };

  const [localContact, setLocalContact] = useState(() => maskPhone(data.contatos_cli || ''));

  useEffect(() => {
    setLocalContact(maskPhone(data.contatos_cli || ''));
  }, [data.contatos_cli]);

  return (
    <div className="billing-form-root space-y-6 p-2 animate-in fade-in duration-300">
      
      {/* SEÇÃO 1: ENDEREÇO DE COBRANÇA */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Endereço de Faturamento" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex gap-4 items-end">
            <div className="flex-1">
              <label className={`${labelClass} block mb-1.5`}>Logradouro</label>
              <input 
                type="text" 
                className={inputClass} 
                value={data.logra1_cli || ''} 
                onChange={handleInput} 
                name="logra1_cli" 
                placeholder="Rua, Avenida, etc."
              />
            </div>
            <div style={{ width: '150px' }}>
              <label className={`${labelClass} block mb-1.5`}>CEP</label>
              <input
                className={`${inputClass} ${consultandoCep ? 'opacity-50' : ''}`}
                placeholder="00000-000"
                value={maskCEP(data.cep1_cli || '')}
                onChange={async (e) => {
                  const masked = maskCEP(e.target.value);
                  onChange('cep1_cli', masked);
                  const cepLimpo = (masked || '').replace(/\D/g, '');
                  if (cepLimpo.length === 8) {
                    try {
                      setConsultandoCep(true);
                      const dados = await ClientesService.buscarCEP(cepLimpo);
                      setConsultandoCep(false);
                      if (dados) {
                        if (dados.logradouro) onChange('logra1_cli', dados.logradouro);
                        if (dados.bairro) onChange('bairro1_cli', dados.bairro);
                        if (dados.localidade) onChange('cidade1_cli', dados.localidade);
                        if (dados.uf) onChange('uf1_cli', dados.uf);
                      }
                    } catch (err) {
                      setConsultandoCep(false);
                    }
                  }
                }}
                name="cep1_cli"
              />
            </div>
          </div>

          <div className="col-span-12 flex gap-4 items-end mt-2">
            <div style={{ width: '250px' }}>
              <label className={`${labelClass} block mb-1.5`}>Bairro</label>
              <input type="text" className={inputClass} value={data.bairro1_cli || ''} onChange={handleInput} name="bairro1_cli" />
            </div>
            <div className="flex-1">
              <label className={`${labelClass} block mb-1.5`}>Cidade</label>
              <input type="text" className={inputClass} value={data.cidade1_cli || ''} onChange={handleInput} name="cidade1_cli" />
            </div>
            <div style={{ width: '80px' }}>
              <label className={`${labelClass} block mb-1.5 text-center`}>UF</label>
              <input
                type="text"
                className={`${inputClass} text-center uppercase`}
                maxLength={2}
                value={data.uf1_cli || ''}
                onChange={(e) => onChange('uf1_cli', e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase())}
                name="uf1_cli"
              />
            </div>
            <div style={{ width: '150px' }}>
              <label className={`${labelClass} block mb-1.5`}>Ult. Alteração</label>
              <input
                type="text"
                className={inputClass}
                value={data.datalt_cli || ''}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                  let masked = v;
                  if (v.length > 4) masked = v.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
                  else if (v.length > 2) masked = v.replace(/(\d{2})(\d{0,2})/, '$1/$2');
                  onChange('datalt_cli', masked);
                }}
                name="datalt_cli"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: DADOS BANCÁRIOS E OPERACIONAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box: Instruções Bancárias */}
        <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
          <SectionTitle title="Instruções de Protesto" />
          <div className="grid grid-cols-12 gap-3 mt-4">
            <div className="col-span-4">
              <label className={`${labelClass} block mb-1.5`}>Cod. Banco</label>
              <input type="text" className={inputClass} value={data.codbco_cli || ''} onChange={handleInput} name="codbco_cli" />
            </div>
            <div className="col-span-8">
              <label className={`${labelClass} block mb-1.5`}>Tipo Cobrança</label>
              <input type="text" className={inputClass} value={data.tipcob_cli || ''} onChange={handleInput} name="tipcob_cli" />
            </div>
            <div className="col-span-4">
              <label className={`${labelClass} block mb-1.5`}>Dias Protesto</label>
              <input type="number" className={inputClass} value={data.vcto_cli || ''} onChange={handleInput} name="vcto_cli" placeholder="0" />
            </div>
            <div className="col-span-8">
              <label className={`${labelClass} block mb-1.5`}>Contato para Instrução</label>
              <input
                type="text"
                className={inputClass}
                placeholder="(00) 00000-0000"
                value={localContact}
                onChange={(e) => {
                  const masked = maskPhone(e.target.value);
                  setLocalContact(masked);
                  onChange('contatos_cli', masked);
                }}
              />
            </div>
          </div>
        </div>

        {/* Box: Comissões e Tributação */}
        <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
          <SectionTitle title="Comissões e Carga Tributária" />
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <label className={`${labelClass} block mb-1.5`}>Com. Prazo</label>
              <input type="text" className={inputClass} value={data.comissao_cli || ''} onChange={handleInput} name="comissao_cli" />
            </div>
            <div>
              <label className={`${labelClass} block mb-1.5`}>Com. Vista</label>
              <input type="text" className={inputClass} value={data.comissaoavi_cli || ''} onChange={handleInput} name="comissaoavi_cli" />
            </div>
            <div>
              <label className={`${labelClass} block mb-1.5`}>Despesa Fixa</label>
              <input type="text" className={inputClass} value={data.despesa_cli || ''} onChange={handleInput} name="despesa_cli" />
            </div>
            <div className="col-span-3">
              <label className={`${labelClass} block mb-1.5`}>Tributação</label>
              <div className="flex gap-2">
                <input type="text" className={`${inputClass} w-24`} value={data.trib_cli || ''} onChange={handleInput} name="trib_cli" placeholder="Código" />
                <input type="text" className={inputClass} value={data.cargamedia_cli || ''} onChange={handleInput} name="cargamedia_cli" placeholder="Carga Média %" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: PARÂMETROS FISCAIS E RETENÇÕES */}
      <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg">
        <SectionTitle title="Parâmetros Fiscais de Retenção" />
        
        <div className="grid grid-cols-12 gap-6 mt-4">
          <div className="col-span-12 flex flex-wrap gap-6 mb-2">
            <div className="flex items-center gap-2">
              <input id="pis" type="checkbox" checked={data.retainPisCofins || false} onChange={handleCheckbox} name="retainPisCofins" className="w-5 h-5 text-[#0066cc] border-gray-300 rounded focus:ring-[#0066cc]" />
              <label htmlFor="pis" className="text-xs font-bold text-gray-700 cursor-pointer uppercase">Reter PIS/COFINS/CSL</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="deduzir" type="checkbox" checked={data.deductRetentionFinancial || false} onChange={handleCheckbox} name="deductRetentionFinancial" className="w-5 h-5 text-[#0066cc] border-gray-300 rounded focus:ring-[#0066cc]" />
              <label htmlFor="deduzir" className="text-xs font-bold text-gray-700 cursor-pointer uppercase">Deduzir Retenção do Financeiro</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="deduzir_total" type="checkbox" checked={data.deductRetentionsFromTotal || false} onChange={handleCheckbox} name="deductRetentionsFromTotal" className="w-5 h-5 text-[#0066cc] border-gray-300 rounded focus:ring-[#0066cc]" />
              <label htmlFor="deduzir_total" className="text-xs font-bold text-gray-700 cursor-pointer uppercase">Deduzir Retenções do Total NF</label>
            </div>
          </div>

          <div className="col-span-12 flex gap-6 flex-wrap">
            <div style={{ width: '150px' }} className="flex items-center gap-3 bg-white p-2 border rounded">
              <input type="checkbox" checked={data.issret_cli || false} onChange={handleCheckbox} name="issret_cli" className="w-5 h-5" />
              <div className="flex-1">
                <label className={`${labelClass} text-[10px]`}>ISS (%)</label>
                <input type="text" className={`${inputClass} text-xs p-1`} value={data.issPercent || ''} onChange={handleInput} name="issPercent" />
              </div>
            </div>
            <div style={{ width: '150px' }} className="flex items-center gap-3 bg-white p-2 border rounded">
              <input type="checkbox" checked={data.retainIrrf || false} onChange={handleCheckbox} name="retainIrrf" className="w-5 h-5" />
              <div className="flex-1">
                <label className={`${labelClass} text-[10px]`}>IRRF (%)</label>
                <input type="text" className={`${inputClass} text-xs p-1`} value={data.irrfPercent || ''} onChange={handleInput} name="irrfPercent" />
              </div>
            </div>
            <div style={{ width: '150px' }} className="flex items-center gap-3 bg-white p-2 border rounded">
              <input type="checkbox" checked={data.retainInss || false} onChange={handleCheckbox} name="retainInss" className="w-5 h-5" />
              <div className="flex-1">
                <label className={`${labelClass} text-[10px]`}>INSS (%)</label>
                <input type="text" className={`${inputClass} text-xs p-1`} value={data.inssPercent || ''} onChange={handleInput} name="inssPercent" />
              </div>
            </div>
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

export default BillingForm;
