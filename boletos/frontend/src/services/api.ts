const _ctxPrefix = (() => {
  const segs = window.location.pathname.split('/').filter(Boolean);
  if (segs.length > 0 && !segs[0].includes('.')) return '/' + segs[0];
  return '';
})();

const _api = (path: string) => {
  if (path.startsWith('/api/')) return _ctxPrefix + path;
  return path;
};

async function getJson<T>(url: string): Promise<T> {
  const resp = await fetch(_api(url));
  if (!resp.ok) throw new Error(`Erro ${resp.status}: ${resp.statusText}`);
  return resp.json();
}

async function postJson<T>(url: string, body?: any): Promise<T> {
  const resp = await fetch(_api(url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ mensagem: resp.statusText }));
    throw new Error(err.mensagem || `Erro ${resp.status}`);
  }
  return resp.json();
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function listarBoletos(filtros: {
  banco?: string;
  sucesso?: string;
  numapo?: string;
  inicio?: string;
  fim?: string;
  page?: number;
  size?: number;
}) {
  const params = new URLSearchParams();
  if (filtros.banco) params.set('banco', filtros.banco);
  if (filtros.sucesso) params.set('sucesso', filtros.sucesso);
  if (filtros.numapo) params.set('numapo', filtros.numapo);
  if (filtros.inicio) params.set('inicio', filtros.inicio);
  if (filtros.fim) params.set('fim', filtros.fim);
  params.set('page', String(filtros.page ?? 0));
  params.set('size', String(filtros.size ?? 50));
  const qs = params.toString();
  return getJson<PaginatedResponse<any>>(`/api/boletos?${qs}`);
}

export async function buscarBoleto(id: number) {
  return getJson<any>(`/api/boletos/${id}`);
}

export async function enviarParaBanco(id: number) {
  return postJson<any>(`/api/boletos/enviar/${id}`);
}

export async function emitirBanco(id: number) {
  return postJson<any>(`/api/boletos/emitir/${id}`);
}

export async function baixarBanco(id: number) {
  return postJson<any>(`/api/boletos/baixar/${id}`);
}

export async function obterStats() {
  return getJson<any>('/api/boletos/stats');
}

export const listarAutoriza = listarBoletos;
export const buscarAutoriza = buscarBoleto;
