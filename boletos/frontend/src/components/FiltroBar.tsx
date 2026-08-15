import React from 'react';

interface FiltroBarProps {
  filtros: {
    banco: string;
    sucesso: string;
    numapo: string;
    inicio: string;
    fim: string;
  };
  onChange: (filtros: any) => void;
  onBuscar: () => void;
  onLimpar: () => void;
}

export default function FiltroBar({ filtros, onChange, onBuscar, onLimpar }: FiltroBarProps) {
  const handleChange = (campo: string, valor: string) => {
    onChange({ ...filtros, [campo]: valor });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Banco</label>
          <select
            value={filtros.banco}
            onChange={(e) => handleChange('banco', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todos</option>
            <option value="748">748 - Sicredi</option>
            <option value="461">461 - Asaas</option>
            <option value="756">756 - Sicoob</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={filtros.sucesso}
            onChange={(e) => handleChange('sucesso', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todos</option>
            <option value="OK">Sucesso (OK)</option>
            <option value="1">Sucesso (1)</option>
            <option value="ERRO">Erro</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Num. Apo</label>
          <input
            type="text"
            value={filtros.numapo}
            onChange={(e) => handleChange('numapo', e.target.value)}
            placeholder="Ex: 202607"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Data Inicio</label>
          <input
            type="date"
            value={filtros.inicio}
            onChange={(e) => handleChange('inicio', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Data Fim</label>
          <input
            type="date"
            value={filtros.fim}
            onChange={(e) => handleChange('fim', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBuscar}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Buscar
          </button>
          <button
            onClick={onLimpar}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <span className="material-symbols-outlined text-[18px]">clear_all</span>
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
