import React, { useState } from 'react';
import { Autoriza } from '../types';

interface BoletoDetalheProps {
  boleto: Autoriza;
  onClose: () => void;
  onEnviar: (id: number) => void;
  onEmitir?: (id: number) => void;
  onBaixar?: (id: number) => void;
  enviando: boolean;
}

function formatarData(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function formatarDataHora(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('pt-BR');
  } catch {
    return dateStr;
  }
}

function formatarValor(val?: number) {
  if (val == null) return '-';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Campo({ label, valor, mono }: { label: string; valor?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className={`text-sm text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {valor || '-'}
      </span>
    </div>
  );
}

function CopiarButton({ valor }: { valor?: string | null }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    if (!valor) return;
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = valor;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <button
      onClick={copiar}
      className="ml-2 p-1 text-gray-400 hover:text-primary rounded"
      title="Copiar"
    >
      <span className="material-symbols-outlined text-[14px]">
        {copiado ? 'check' : 'content_copy'}
      </span>
    </button>
  );
}

export default function BoletoDetalhe({ boleto, onClose, onEnviar, onEmitir, onBaixar, enviando }: BoletoDetalheProps) {
  const temPix = boleto.pixQrcode;
  const temNossoNumero = !!(boleto.nossonumero || boleto.nossoNumero);
  const podeBaixar = temNossoNumero && (boleto.situacaoDescricao === 'EM_CARTEIRA' || boleto.situacaoDescricao === 'EMITIDO');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary to-blue-600 rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-2xl">receipt_long</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Boleto #{boleto.id}</h2>
              <p className="text-sm text-blue-100">
                {boleto.numapo1Aut}/{boleto.numapo2Aut} - {formatarData(boleto.dataautAut)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dados do Boleto */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
              Dados do Boleto
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Campo label="Tipo" valor={boleto.tipoAut} />
              <Campo label="Banco" valor={`${boleto.bancoAut || '-'}`} />
              <Campo label="Cooperativa" valor={boleto.cooperativa} />
              <Campo label="Posto" valor={boleto.posto} />
              <Campo label="Data Emissao" valor={formatarData(boleto.dataautAut)} />
              <Campo label="Vencimento" valor={formatarData(boleto.vencimentoAut)} />
              <Campo label="Data Envio" valor={formatarDataHora(boleto.dataenvAut)} />
              <Campo label="Valor Cancelado" valor={formatarValor(boleto.valorcanAut)} />
            </div>
          </div>

          {/* Nosso Numero e Codigos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">tag</span>
              Nosso Numero e Codigos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Campo label="Nosso Numero" valor={boleto.nossonumero || boleto.nossoNumero} mono />
              <Campo label="Nosso Numero Completo" valor={boleto.nossoNumeroCompleto} mono />
              <Campo label="Nosso Numero DV" valor={boleto.nossoNumeroDv} mono />
              <Campo label="Cod API" valor={boleto.codapiAut} />
              <Campo label="Cod Boleto" valor={boleto.codbolAut} />
              <Campo label="Controle" valor={boleto.controleAut} />
            </div>
          </div>

          {/* Linha Digitavel e Codigo de Barras */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">barcode</span>
              Linha Digitavel e Codigo de Barras
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-500">Linha Digitavel</span>
                  <p className="font-mono text-xs text-gray-900 break-all mt-1">
                    {boleto.linhaDigitavel || '-'}
                  </p>
                </div>
                <CopiarButton valor={boleto.linhaDigitavel} />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-500">Codigo de Barras</span>
                  <p className="font-mono text-xs text-gray-900 break-all mt-1">
                    {boleto.codigoBarras || '-'}
                  </p>
                </div>
                <CopiarButton valor={boleto.codigoBarras} />
              </div>
            </div>
          </div>

          {/* PIX */}
          {temPix && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                PIX
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="txid" valor={boleto.txid || boleto.pixTxid} mono />
                <div className="bg-gray-50 rounded-lg p-3 col-span-2 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-500">QR Code PIX</span>
                    <p className="font-mono text-xs text-gray-900 break-all mt-1 max-h-24 overflow-y-auto">
                      {boleto.pixQrcode || '-'}
                    </p>
                  </div>
                  <CopiarButton valor={boleto.pixQrcode} />
                </div>
              </div>
            </div>
          )}

          {/* Status e Resposta */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">info</span>
              Status e Resposta
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Campo label="Sucesso" valor={boleto.sucesso} />
              <Campo label="Situacao" valor={boleto.situacaoDescricao} />
              <Campo label="Cancelado" valor={boleto.cancelado === 'S' ? 'Sim' : 'Nao'} />
              <Campo label="Envia Auto" valor={boleto.enviaAut} />
              <Campo label="HTTPS Status" valor={boleto.httpsStatusCode} />
              <Campo label="API Versao" valor={boleto.apiVersao} />
            </div>
            {boleto.servidorResposta && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <span className="text-xs font-medium text-gray-500">Resposta do Servidor</span>
                <pre className="font-mono text-xs text-gray-900 whitespace-pre-wrap mt-1 max-h-40 overflow-y-auto">
                  {boleto.servidorResposta}
                </pre>
              </div>
            )}
            {boleto.msgAut && (
              <div className="mt-3 bg-red-50 rounded-lg p-3">
                <span className="text-xs font-medium text-red-600">Mensagem de Erro</span>
                <p className="text-xs text-red-700 mt-1">{boleto.msgAut}</p>
              </div>
            )}
          </div>

          {/* Acoes */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Fechar
            </button>
            {podeBaixar && onBaixar && (
              <button
                onClick={() => onBaixar(boleto.id)}
                disabled={enviando}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                Baixar Boleto
              </button>
            )}
            {temNossoNumero && (
              <a
                href={`/${window.location.pathname.split('/').filter(Boolean)[0] || 'boleto'}/api/autoriza/${boleto.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Imprimir
              </a>
            )}
            <button
              onClick={() => onEnviar(boleto.id)}
              disabled={enviando || !temNossoNumero}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {enviando ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[18px]">refresh</span>
                  Consultando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Consultar no Banco
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
