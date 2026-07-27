import React from 'react';
import { CustomerCreditData } from '../../../Cadastro de Clientes/IncluirRegistro/Frontend/types';

interface Props {
  data: CustomerCreditData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const InputLabel: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
    {children}
  </label>
);

const CreditTab: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-3">
          <InputLabel>Limite Crédito</InputLabel>
          <input
            name="limiteCredito"
            value={data.limiteCredito as any}
            onChange={onChange}
            className="w-full bg-gray-100 border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
          />
        </div>
        <div className="col-span-3">
          <InputLabel>Saldo Disponível</InputLabel>
          <input
            readOnly
            name="saldoDisponivel"
            value={data.saldoDisponivel as any}
            className="w-full bg-gray-100 border-transparent rounded p-2 text-sm cursor-not-allowed opacity-75"
          />
        </div>
        <div className="col-span-4">
          <InputLabel>Última Compra</InputLabel>
          <input
            name="ultimaCompra"
            value={data.ultimaCompra as any}
            onChange={onChange}
            placeholder="00/00/0000"
            className="w-full bg-gray-100 border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
          />
        </div>
        <div className="col-span-2 flex flex-col items-center">
          <InputLabel>Ativo</InputLabel>
          <input
            type="checkbox"
            name="ativo"
            checked={!!data.ativo}
            onChange={onChange}
            className="h-5 w-5 rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-2">
          <InputLabel>Cond. Pag.</InputLabel>
          <input
            name="condPag"
            value={data.condPag as any}
            onChange={onChange}
            className="w-full bg-gray-100 border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
          />
        </div>
        <div className="col-span-4 flex items-center gap-2 pb-1.5">
          <input
            type="checkbox"
            id="naNfeAvista"
            name="naNfeAvista"
            checked={!!data.naNfeAvista}
            onChange={onChange}
            className="rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
          />
          <label htmlFor="naNfeAvista" className="text-[10px] font-semibold text-gray-600 leading-tight uppercase">
            Na NF-e descr. A VISTA
          </label>
        </div>
        <div className="col-span-3">
          <InputLabel>Desconto</InputLabel>
          <input
            name="desconto"
            value={data.desconto as any}
            onChange={onChange}
            className="w-full bg-gray-100 border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
          />
        </div>
        <div className="col-span-3">
          <InputLabel>Vencimento</InputLabel>
          <input
            name="vencimento"
            value={data.vencimento as any}
            onChange={onChange}
            className="w-full bg-gray-100 border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-[#0066cc] uppercase tracking-widest border-b border-gray-100 pb-1 mb-3">
          Opção de Faturamento
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="faturarLiquido"
            name="faturarLiquido"
            checked={!!data.faturarLiquido}
            onChange={onChange}
            className="h-5 w-5 rounded-full border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
          />
          <label htmlFor="faturarLiquido" className="text-sm text-gray-700">
            Faturar pelo valor líquido
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <InputLabel>SPC</InputLabel>
          <textarea
            name="obsSpc"
            value={data.obsSpc as any}
            onChange={onChange}
            placeholder="Observações de crédito/SPC..."
            className="w-full bg-gray-100 border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm h-20 resize-none"
          />
        </div>
        <div>
          <InputLabel>Bancos</InputLabel>
          <textarea
            name="referenciasBancos"
            value={data.referenciasBancos as any}
            onChange={onChange}
            placeholder="Referências bancárias..."
            className="w-full bg-gray-100 border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm h-20 resize-none"
          />
        </div>
        <div>
          <InputLabel>Comerciais</InputLabel>
          <textarea
            name="referenciasComerciais"
            value={data.referenciasComerciais as any}
            onChange={onChange}
            placeholder="Referências comerciais..."
            className="w-full bg-gray-100 border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm h-20 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default CreditTab;













