import React from 'react';
import { inputClass, labelClass } from './styles';
import { CustomerData } from '../types';

interface Props {
  data: CustomerData;
  onChange: (field: keyof CustomerData, value: any) => void;
}

const formatRG = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8, 9)}`;
};

const formatDate = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`.slice(0,10);
};

const formatCPF = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
  return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}`.slice(0,14);
};

const PhysicalForm: React.FC<Props> = ({ data, onChange }) => {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof CustomerData;
    let value: any = (e.target as HTMLInputElement).value;

    if (name === 'ident_cli') value = formatRG(value);
    if (name === 'document') value = formatCPF(value);

    onChange(name, value);
  };

  const read = (k: string) => (data as any)[k] ?? '';

  return (
    <div className="space-y-6 p-2 animate-in fade-in duration-300">
      
      {/* SEÇÃO 1: IDENTIFICAÇÃO PESSOAL */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Identificação Pessoal" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex gap-4 items-end">
            <div style={{ width: '150px' }}>
              <label className={`${labelClass} block mb-1.5`}>R.G.</label>
              <input
                name="ident_cli"
                value={read("ident_cli")}
                onChange={handleInput}
                placeholder="00.000.000-0"
                maxLength={14}
                className={inputClass}
                type="text"
              />
            </div>
            <div style={{ width: '200px' }}>
              <label className={`${labelClass} block mb-1.5`}>Órgão Emissor</label>
              <input
                name="orgemis_cli"
                value={read("orgemis_cli")}
                onChange={handleInput}
                className={inputClass}
                type="text"
              />
            </div>
            <div style={{ width: '120px' }}>
              <label className={`${labelClass} block mb-1.5`}>Sexo</label>
              <select
                name="sexo_cli"
                value={read("sexo_cli")}
                onChange={handleInput}
                className={inputClass}
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div style={{ width: '130px' }}>
              <label className={`${labelClass} block mb-1.5`}>Data Nasc</label>
              <input
                name="datanasc_cli"
                value={read("datanasc_cli")}
                onChange={(e) => {
                  const name = e.target.name as keyof CustomerData;
                  const formatted = formatDate(e.target.value);
                  onChange(name, formatted);
                }}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className={inputClass}
                type="text"
              />
            </div>
            <div style={{ width: '150px' }}>
              <label className={`${labelClass} block mb-1.5`}>Estado Civil</label>
              <input
                name="civil_cli"
                value={read("civil_cli")}
                onChange={handleInput}
                className={inputClass}
                type="text"
              />
            </div>
            <div className="flex-1" />
          </div>

          <div className="col-span-12 flex gap-4 items-end mt-2">
            <div style={{ width: '200px' }}>
              <label className={`${labelClass} block mb-1.5`}>Nacionalidade</label>
              <input
                name="natural_cli"
                value={read("natural_cli")}
                onChange={handleInput}
                className={inputClass}
                type="text"
              />
            </div>
            <div className="flex-1">
              <label className={`${labelClass} block mb-1.5`}>Profissão</label>
              <input
                name="prof_cli"
                value={read("prof_cli")}
                onChange={handleInput}
                className={inputClass}
                type="text"
              />
            </div>
            <div style={{ width: '200px' }}>
              <label className={`${labelClass} block mb-1.5`}>Inscr. Estadual</label>
              <input
                name="inscest_cli"
                value={read("inscest_cli")}
                onChange={handleInput}
                className={inputClass}
                type="text"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: FILIAÇÃO */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Filiação" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 md:col-span-6">
            <label className={`${labelClass} block mb-1.5`}>Nome do Pai</label>
            <input
              name="pai_cli"
              value={read("pai_cli")}
              onChange={handleInput}
              className={inputClass}
              type="text"
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <label className={`${labelClass} block mb-1.5`}>Nome da Mãe</label>
            <input
              name="mae_cli"
              value={read("mae_cli")}
              onChange={handleInput}
              className={inputClass}
              type="text"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: DADOS DO CÔNJUGE */}
      <div className="bg-[#f0f9ff] p-5 border border-blue-200 rounded-lg shadow-sm">
        <SectionTitle title="Dados do Cônjuge" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex gap-4 items-end">
            <div className="flex-1">
              <label className={`${labelClass} block mb-1.5`}>Nome do Cônjuge</label>
              <input
                name="conjuge_cli"
                value={read("conjuge_cli")}
                onChange={handleInput}
                className={inputClass}
              />
            </div>
            <div style={{ width: '130px' }}>
              <label className={`${labelClass} block mb-1.5`}>Data Nasc</label>
              <input
                name="dtnasconj_cli"
                value={read("dtnasconj_cli")}
                onChange={(e) => {
                  const formatted = formatDate(e.target.value);
                  onChange('dtnasconj_cli' as keyof CustomerData, formatted);
                }}
                placeholder="DD/MM/AAAA"
                maxLength={10}
                className={inputClass}
                type="text"
              />
            </div>
            <div style={{ width: '180px' }}>
              <label className={`${labelClass} block mb-1.5`}>CPF</label>
              <input
                name="cpfconj_cli"
                value={read("cpfconj_cli")}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  onChange('cpfconj_cli' as keyof CustomerData, formatted);
                }}
                className={inputClass}
              />
            </div>
            <div style={{ width: '180px' }}>
              <label className={`${labelClass} block mb-1.5`}>R.G.</label>
              <input
                name="ideconj_cli"
                value={read("ideconj_cli")}
                onChange={(e) => {
                  const formatted = formatRG(e.target.value);
                  onChange('ideconj_cli' as keyof CustomerData, formatted);
                }}
                placeholder="00.000.000-0"
                maxLength={14}
                className={inputClass}
                type="text"
              />
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

export default PhysicalForm;
