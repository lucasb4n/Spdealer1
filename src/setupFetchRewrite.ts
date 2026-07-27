// Reescreve chamadas fetch que usem 'http://localhost:8080' para usar
// o valor de `process.env.REACT_APP_API_URL` (se definido) ou caminho relativo.
// Isso ajuda a corrigir referências hardcoded no código que foram deixadas
// apontando para localhost após o build — evita alterar muitos arquivos.

import { API_URL } from 'services/api';

const API_BASE = API_URL || '';

function shouldRewrite(url: string) {
  return url.startsWith('http://localhost:8080');
}

function rewriteUrl(url: string) {
  const base = API_BASE.replace(/\/+$/, ''); // remove trailing slash

  try {
    const u = new URL(url);
    let path = u.pathname + (u.search || '') + (u.hash || '');

    // Evita duplicar '/api' quando API_BASE já contém '/api' e a URL original também
    if (base.endsWith('/api') && path.startsWith('/api')) {
      path = path.replace(/^\/api/, '');
    }

    if (!base) return path; // relativo
    return base + path;
  } catch (e) {
    // Fallback simples (regex) — ainda evitando duplicar /api
    if (!API_BASE) return url.replace(/^https?:\/\/localhost:8080/, '');
    if (API_BASE.endsWith('/api')) {
      return url.replace(/^https?:\/\/localhost:8080\/api/, API_BASE).replace(/^https?:\/\/localhost:8080/, API_BASE);
    }
    return url.replace(/^https?:\/\/localhost:8080/, API_BASE);
  }
}

if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);
  // @ts-ignore - augmentação global em runtime
  window.fetch = async (input: RequestInfo, init?: RequestInit) => {
    try {
      if (typeof input === 'string') {
        if (shouldRewrite(input)) input = rewriteUrl(input);
        return originalFetch(input, init);
      }

      if (input instanceof Request) {
        const url = input.url;
        if (shouldRewrite(url)) {
          const newUrl = rewriteUrl(url);
          // Cria um novo Request preservando método, headers e body
          const newReq = new Request(newUrl, {
            method: input.method,
            headers: input.headers,
            body: input.body,
            mode: input.mode,
            credentials: input.credentials,
            cache: input.cache,
            redirect: input.redirect,
            referrer: input.referrer,
            referrerPolicy: input.referrerPolicy,
            integrity: input.integrity,
            keepalive: (input as any).keepalive,
            signal: input.signal
          });
          return originalFetch(newReq, init);
        }
        return originalFetch(input, init);
      }

      return originalFetch(input as any, init);
    } catch (e) {
      // Em caso de qualquer erro, fallback para o fetch original
      return originalFetch(input as any, init);
    }
  };
}

export {};













