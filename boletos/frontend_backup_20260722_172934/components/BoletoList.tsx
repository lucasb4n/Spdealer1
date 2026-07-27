import React from 'react';
import { Autoriza } from '../types';
import StatusBadge from './StatusBadge';

interface BoletoListProps {
  boletos: Autoriza[];
  onSelecionar: (boleto: Autoriza) => void;
  onEnviar: (id: number) => void;
  onEmitir?: (id: number) => void;
  carregando?: boolean;
}

function formatarData(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

const BANCOS_SUPORTADOS = ['748', '237'];

export default function BoletoList({ boletos, onSelecionar, onEnviar, onEmitir, carregando }: BoletoListProps) {
  if (carregando && boletos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <span className="animate-spin material-symbols-outlined text-5xl text-primary">progress_activity</span>
        <p className="mt-3 text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (boletos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-300">search_off</span>
        <p className="mt-3 text-gray-500">Nenhum boleto encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Num. Apo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vencimento</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Banco</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nosso Numero</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {boletos.map((b) => {
              const temNossoNumero = !!(b.nossonumero || b.nossoNumero);
              const bancoSuportado = BANCOS_SUPORTADOS.includes(b.bancoAut || '');
              const podeEmitir = !temNossoNumero && bancoSuportado && onEmitir;

              return (
                <tr key={b.id} className="hover:bg-blue-50/50 cursor-pointer" onClick={() => onSelecionar(b)}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{b.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {b.numapo1Aut}/{b.numapo2Aut}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatarData(b.dataautAut)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatarData(b.vencimentoAut)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{b.bancoAut || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {temNossoNumero ? (b.nossonumero || b.nossoNumero) : '-'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusBadge
                      sucesso={b.sucesso}
                      cancelado={b.cancelado}
                      enviaAut={b.enviaAut}
                      situacao={b.situacaoDescricao}
                    />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onSelecionar(b)}
                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-md"
                        title="Detalhes"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      {podeEmitir && (
                        <button
                          onClick={() => onEmitir!(b.id)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Emitir boleto no banco"
                        >
                          <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        </button>
                      )}
                      {temNossoNumero && (
                        <button
                          onClick={() => onEnviar(b.id)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md"
                          title="Consultar no banco"
                        >
                          <span className="material-symbols-outlined text-[18px]">send</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
