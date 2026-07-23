import React from 'react';
import { inputClass, labelClass } from '../styles';
import { CustomerData } from '../../types';

interface LegalEntityFormProps {
  data: CustomerData;
  onChange: (field: keyof CustomerData, value: any) => void;
}

const LegalEntityForm: React.FC<LegalEntityFormProps> = ({ data, onChange }) => {
  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name as keyof CustomerData, e.target.checked);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.name as keyof CustomerData, e.target.value);
  };

  const read = (k: string) => (data as any)[k] ?? '';

  return (
    <div className="space-y-6 p-2 animate-in fade-in duration-300">
      
      {/* SEÇÃO 1: IDENTIFICAÇÃO E INSCRIÇÕES */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Identificação da Empresa" />
        <div className="flex gap-4 items-end mt-4">
          <div style={{ flex: '2 1 0%' }}>
            <label className={`${labelClass} block mb-1.5`}>Nome Fantasia</label>
            <input
              name="nomefan-cli"
              value={read("nomefan-cli")}
              onChange={handleInput}
              className={`${inputClass} uppercase`}
              type="text"
            />
          </div>
          <div style={{ width: '200px' }}>
            <label className={`${labelClass} block mb-1.5`}>Inscrição Municipal</label>
            <input 
              name="inscmun-cli" 
              value={read("inscmun-cli")} 
              onChange={handleInput} 
              className={inputClass} 
              type="text" 
            />
          </div>
          <div style={{ width: '200px' }}>
            <label className={`${labelClass} block mb-1.5`}>Inscrição Estadual</label>
            <input 
              name="inscest-cli" 
              value={read("inscest-cli")} 
              onChange={handleInput} 
              className={inputClass} 
              type="text" 
              maxLength={30} 
            />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex flex-wrap gap-4">
             <div className="flex items-center gap-2">
                <input name="naocontr-cli" checked={!!read("naocontr-cli")} onChange={handleCheckbox} type="checkbox" className="w-5 h-5" />
                <label className={`${labelClass} cursor-pointer`}>Não Contribuinte</label>
             </div>
             <div className="flex items-center gap-2">
                <input name="contr-cli" checked={!!read("contr-cli")} onChange={handleCheckbox} type="checkbox" className="w-5 h-5" />
                <label className={`${labelClass} cursor-pointer`}>Contribuinte</label>
             </div>
             <div className="flex items-center gap-2">
                <input name="optsimples-cli" checked={!!read("optsimples-cli")} onChange={handleCheckbox} type="checkbox" className="w-5 h-5" />
                <label className={`${labelClass} cursor-pointer`}>Optante Simples</label>
             </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: CATEGORIZAÇÃO E PERFIS */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Perfis e Regras de Negócio" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex flex-wrap gap-x-24 gap-y-16">
            <ProfileCheck name="clivenda-cli" checked={!!read("clivenda-cli")} onChange={handleCheckbox} label="Venda Novos" />
            <ProfileCheck name="cliusado-cli" checked={!!read("cliusado-cli")} onChange={handleCheckbox} label="Venda Usados" />
            <ProfileCheck name="cliofic-cli" checked={!!read("cliofic-cli")} onChange={handleCheckbox} label="Oficina" />
            <ProfileCheck name="clivip-cli" checked={!!read("clivip-cli")} onChange={handleCheckbox} label="VIP" />
            <ProfileCheck name="clirevenda-cli" checked={!!read("clirevenda-cli")} onChange={handleCheckbox} label="Revendedor" />
            <ProfileCheck name="naommi-cli" checked={!!read("naommi-cli")} onChange={handleCheckbox} label="Não MMI" />
          </div>
          <div className="col-span-12 pt-2 border-t">
             <div className="flex items-center gap-[60px]">
                <label className={`${labelClass} cursor-pointer select-none`} onClick={() => onChange('deslmarg-cli' as keyof CustomerData, !read('deslmarg-cli'))}>Desconsiderar Cálculo de Margem</label>
                <input name="deslmarg-cli" checked={!!read("deslmarg-cli")} onChange={handleCheckbox} type="checkbox" className="w-5 h-5 cursor-pointer" />
             </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: VENDEDORES E CONSULTORES */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Vendedores e Consultores Responsáveis" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mt-4">
          {[
            { label: 'Cons. Peça', code: 'vendedor-cli', desc: 'W_nome_ven', visit: 'agepec-cli' },
            { label: 'Cons. Serviço', code: 'vendedor1-cli', desc: 'W_nome1_ven', visit: 'ageser-cli' },
            { label: 'Cons. Venda', code: 'vendedor2-cli', desc: 'w_nome2_ven', visit: 'agemaq-cli' },
            { label: 'Cons. Locação', code: 'vendedor3-cli', desc: 'w_nome3_ven', visit: 'ageloc-cli' },
          ].map((row, idx) => (
            <div key={idx} className="flex items-center gap-4 border-b border-gray-50 py-3">
               <label className={`${labelClass} w-[120px] flex-shrink-0`}>{row.label}</label>
               <div className="flex-1 grid grid-cols-12 gap-2">
                  <div className="col-span-3">
                    <input name={row.code} value={read(row.code)} onChange={handleInput} className={`${inputClass} text-center`} type="text" placeholder="Cód" />
                  </div>
                  <div className="col-span-7">
                    <input name={row.desc} value={read(row.desc)} onChange={handleInput} className={inputClass} type="text" placeholder="Nome do Vendedor" />
                  </div>
                  <div className="col-span-2">
                    <input name={row.visit} value={read(row.visit)} onChange={handleInput} className={`${inputClass} text-center`} placeholder="Freq" type="text" />
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO 4: ATIVIDADES */}
      <div className="bg-gray-50 p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Códigos de Atividades" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
           {[1, 2, 3, 4].map(num => (
             <div key={num}>
                <label className={`${labelClass} block mb-1.5`}>Atividade {num}</label>
                <input
                  name={`codativ${num}-cli`}
                  value={read(`codativ${num}-cli`)}
                  onChange={handleInput}
                  className={`${inputClass} text-center`}
                  placeholder="0"
                  type="text"
                />
             </div>
           ))}
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

const ProfileCheck: React.FC<{ name: string, checked: boolean, onChange: any, label: string }> = ({ name, checked, onChange, label }) => (
  <div className="flex items-center gap-[60px] py-2">
    <span className="text-[11px] font-semibold text-gray-600 uppercase cursor-pointer select-none" onClick={() => onChange({ target: { name, checked: !checked } })}>{label}</span>
    <input name={name} checked={checked} onChange={onChange} type="checkbox" className="w-5 h-5 rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc] cursor-pointer" />
  </div>
);

export default LegalEntityForm;

