import React from 'react';
import { AddressData } from '../types';

interface AddressFormProps {
  data: AddressData;
  onChange: (field: keyof AddressData, value: string | boolean) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ data, onChange }) => {
  const inputClass = "w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm text-gray-800 placeholder:text-gray-400 transition-all";
  const labelClass = "block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-3">
        <div className="flex-[3]">
          <label className={labelClass}>Endereço</label>
          <input 
            className={inputClass} 
            placeholder="Rua..." 
            type="text" 
            value={data.street}
            onChange={(e) => onChange('street', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Nº</label>
          <input 
            className={inputClass} 
            placeholder="Ex: 123" 
            type="text"
            value={data.number}
            onChange={(e) => onChange('number', e.target.value)}
          />
        </div>
        <div className="flex-[2]">
          <label className={labelClass}>Atualizado</label>
          <input 
            className={inputClass} 
            type="date"
            value={data.updatedAt}
            onChange={(e) => onChange('updatedAt', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Bairro</label>
          <input 
            className={inputClass} 
            placeholder="Ex: Centro" 
            type="text"
            value={data.neighborhood}
            onChange={(e) => onChange('neighborhood', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Cidade</label>
          <input 
            className={inputClass} 
            placeholder="Ex: São Paulo" 
            type="text"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-[30%]">
          <label className={labelClass}>CEP</label>
          <input 
            className={inputClass} 
            placeholder="00000-000" 
            type="text"
            value={data.cep}
            onChange={(e) => onChange('cep', e.target.value)}
          />
        </div>
        <div className="w-[35%]">
          <label className={labelClass}>Latitude</label>
          <input 
            className={inputClass} 
            placeholder="-23.5505" 
            type="text"
            value={data.latitude}
            onChange={(e) => onChange('latitude', e.target.value)}
          />
        </div>
        <div className="w-[35%]">
          <label className={labelClass}>Longitude</label>
          <input 
            className={inputClass} 
            placeholder="-46.6333" 
            type="text"
            value={data.longitude}
            onChange={(e) => onChange('longitude', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className={labelClass}>Fone Com.</label>
          <input 
            className={inputClass} 
            placeholder="(00) 0000-0000" 
            type="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Celular</label>
          <input 
            className={inputClass} 
            placeholder="(00) 90000-0000" 
            type="tel"
            value={data.cellphone}
            onChange={(e) => onChange('cellphone', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Whats</label>
          <input 
            className={inputClass} 
            placeholder="(00) 90000-0000" 
            type="tel"
            value={data.whatsapp}
            onChange={(e) => onChange('whatsapp', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-[50%]">
          <label className={labelClass}>Tipo Residencia</label>
          <select 
            className={`${inputClass} appearance-none cursor-pointer`}
            value={data.residenceType}
            onChange={(e) => onChange('residenceType', e.target.value)}
          >
            <option>Própria</option>
            <option>Alugada</option>
            <option>Cedida</option>
          </select>
        </div>
        <div className="w-[50%]">
          <label className={labelClass}>Tempo de Residencia</label>
          <input 
            className={inputClass} 
            placeholder="Ex: 5 anos" 
            type="text"
            value={data.residenceTime}
            onChange={(e) => onChange('residenceTime', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-[50%]">
          <label className={labelClass}>Emitir Etiquetas</label>
          <label className="flex items-center gap-2 mt-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc] cursor-pointer"
              checked={data.printLabels}
              onChange={(e) => onChange('printLabels', e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Sim</span>
          </label>
        </div>
        <div className="w-[15%]">
          <label className={labelClass}>Região</label>
          <input 
            className={inputClass} 
            placeholder="ID" 
            type="text"
            value={data.regionId}
            onChange={(e) => onChange('regionId', e.target.value)}
          />
        </div>
        <div className="w-[35%]">
          <label className={labelClass}>&nbsp;</label>
          <input 
            className={inputClass} 
            placeholder="Descrição Região" 
            type="text"
            value={data.regionDescription}
            onChange={(e) => onChange('regionDescription', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input 
          className={inputClass} 
          placeholder="cliente@exemplo.com.br" 
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
        />
      </div>
    </div>
  );
};

export default AddressForm;













