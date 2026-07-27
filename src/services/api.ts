// Centraliza a construção das URLs de API para evitar hardcodeds espalhados.
const getContextPath = () => {
  if (typeof window === 'undefined') return '/spdealer';
  const path = window.location.pathname;
  const parts = path.split('/');
  if (parts.length > 1 && parts[1] && parts[1].startsWith('spdealer')) {
    return '/' + parts[1];
  }
  return '/spdealer';
};

const context = typeof window !== 'undefined' ? getContextPath() : '/spdealer';

const RAW = process.env.REACT_APP_API_URL || '/api';
export const API_URL = (process.env.NODE_ENV === 'development')
  ? RAW.replace(/\/+$/, '')
  : (RAW.startsWith('/api') ? `${context}${RAW}` : RAW).replace(/\/+$/, '');

const RAW_PUBLIC = process.env.REACT_APP_API_URL_PUBLIC || `${API_URL}/v1`;
export const API_PUBLIC = RAW_PUBLIC.replace(/\/+$/, '');

function joinBase(base: string, path: string) {
  if (!path) return base;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const p = path.startsWith('/') ? path : '/' + path;
  // evitar duplicar /api when base already ends with /api and path starts with /api
  if (base.endsWith('/api') && p.startsWith('/api')) return base + p.slice(4);
  return base + p;
}

export function api(path: string) {
  return joinBase(API_URL, path);
}

export function apiPublic(path: string) {
  return joinBase(API_PUBLIC, path);
}

export default api;













