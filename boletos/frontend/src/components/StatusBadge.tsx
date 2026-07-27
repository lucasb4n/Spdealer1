import React from 'react';

type StatusType = 'ok' | 'erro' | 'pendente' | 'enviado' | 'cancelado';

interface StatusBadgeProps {
  sucesso?: string;
  cancelado?: string;
  enviaAut?: string;
  situacao?: string;
}

function getStatus(sucesso?: string, cancelado?: string, enviaAut?: string): StatusType {
  if (cancelado === 'S') return 'cancelado';
  if (sucesso === 'OK' || sucesso === '1') return 'ok';
  if (sucesso === 'ERRO') return 'erro';
  if (enviaAut === 'S') return 'enviado';
  return 'pendente';
}

const styles: Record<StatusType, { bg: string; text: string; label: string }> = {
  ok: { bg: 'bg-green-100', text: 'text-green-800', label: 'Sucesso' },
  erro: { bg: 'bg-red-100', text: 'text-red-800', label: 'Erro' },
  pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
  enviado: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Enviado' },
  cancelado: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelado' },
};

export default function StatusBadge({ sucesso, cancelado, enviaAut, situacao }: StatusBadgeProps) {
  const status = getStatus(sucesso, cancelado, enviaAut);
  const s = styles[status];
  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.label}
      </span>
      {situacao && (
        <span className="text-xs text-gray-500 truncate max-w-[200px]" title={situacao}>
          {situacao}
        </span>
      )}
    </div>
  );
}
