import { CustomerCreditData } from '../types';
import { labelClass } from './styles';

interface Props {
  data: CustomerCreditData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const CreditTab: React.FC<Props> = ({ data, onChange }) => {
  return (
    <div className="space-y-6 p-2 animate-in fade-in duration-300">
      
      {/* SEÇÃO 1: LIMITES E STATUS FINANCEIRO */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Limites e Disponibilidade" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex gap-6 items-end">
            <div style={{ width: '180px' }}>
              <label className={`${labelClass} block mb-1.5`}>Limite Crédito</label>
              <input
                name="limiteCredito"
                value={data.limiteCredito}
                onChange={onChange}
                className="w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
              />
            </div>
            <div style={{ width: '180px' }}>
              <label className={`${labelClass} block mb-1.5`}>Saldo Disponível</label>
              <input
                readOnly
                name="saldoDisponivel"
                value={data.saldoDisponivel}
                className="w-full bg-[#e9ecef] border-transparent rounded p-2 text-sm cursor-not-allowed opacity-75"
              />
            </div>
            <div style={{ width: '150px' }}>
              <label className={`${labelClass} block mb-1.5`}>Última Compra</label>
              <input
                name="ultimaCompra"
                value={data.ultimaCompra}
                onChange={onChange}
                placeholder="00/00/0000"
                className="w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
              />
            </div>
            <div className="flex flex-col items-center justify-center pb-1">
              <label className={`${labelClass} block mb-1.5`}>Cliente Ativo</label>
              <input
                type="checkbox"
                name="ativo"
                checked={data.ativo}
                onChange={onChange}
                className="h-6 w-6 rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
              />
            </div>
            <div className="flex-1" />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: CONDIÇÕES DE PAGAMENTO */}
      <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
        <SectionTitle title="Condições e Faturamento" />
        <div className="grid grid-cols-12 gap-4 mt-4">
          <div className="col-span-12 flex gap-6 items-end">
            <div style={{ width: '150px' }}>
              <label className={`${labelClass} block mb-1.5`}>Cond. Pagamento</label>
              <input
                name="condPag"
                value={data.condPag}
                onChange={onChange}
                className="w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
              />
            </div>
            <div style={{ width: '100px' }}>
              <label className={`${labelClass} block mb-1.5`}>Desconto (%)</label>
              <input
                name="desconto"
                value={data.desconto}
                onChange={onChange}
                className="w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
              />
            </div>
            <div style={{ width: '150px' }}>
              <label className={`${labelClass} block mb-1.5`}>Vencimento</label>
              <input
                name="vencimento"
                value={data.vencimento}
                onChange={onChange}
                className="w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="faturarLiquido"
                name="faturarLiquido"
                checked={data.faturarLiquido}
                onChange={onChange}
                className="h-5 w-5 rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
              />
              <label htmlFor="faturarLiquido" className="text-[10px] font-bold text-gray-600 uppercase whitespace-nowrap">Faturar Líquido</label>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="naNfeAvista"
                name="naNfeAvista"
                checked={data.naNfeAvista}
                onChange={onChange}
                className="h-5 w-5 rounded border-gray-300 text-[#0066cc] focus:ring-[#0066cc]"
              />
              <label htmlFor="naNfeAvista" className="text-[10px] font-bold text-gray-600 uppercase whitespace-nowrap">"A VISTA" na NF-e</label>
            </div>
            <div className="flex-1" />
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: OBSERVAÇÕES E REFERÊNCIAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <SectionTitle title="Observações SPC" />
          <textarea
            name="obsSpc"
            value={data.obsSpc}
            onChange={onChange}
            className="w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm h-32 mt-2 resize-none"
          />
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <SectionTitle title="Referências Bancos" />
          <textarea
            name="referenciasBancos"
            value={data.referenciasBancos}
            onChange={onChange}
            className="w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm h-32 mt-2 resize-none"
          />
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <SectionTitle title="Referências Comerciais" />
          <textarea
            name="referenciasComerciais"
            value={data.referenciasComerciais}
            onChange={onChange}
            className="w-full bg-[#f1f3f5] border-transparent focus:border-[#0066cc] focus:ring-0 rounded p-2 text-sm h-32 mt-2 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-[11px] font-bold text-[#0066cc] uppercase tracking-widest border-b border-gray-100 pb-1">
    {title}
  </h3>
);

export default CreditTab;
