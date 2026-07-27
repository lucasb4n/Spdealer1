import axios from 'axios';

// Centraliza a configuração da URL base da API para evitar hardcodes espalhados.
// Sanitiza variáveis de ambiente para evitar espaços acidentais que causam URLs com %20.
function cleanEnvUrl(value?: string | null) {
  if (!value) return undefined;
  // Trim e remove espaços em excesso (espacos internos inesperados não são válidos em paths)
  return value.toString().trim().replace(/\s+/g, '');
}

const envApiUrl = cleanEnvUrl(process.env.REACT_APP_API_URL);
const envApiBase = cleanEnvUrl(process.env.REACT_APP_API_BASE_URL);
const envApiPublic = cleanEnvUrl(process.env.REACT_APP_API_URL_PUBLIC);

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

// Se envApiUrl for '/api', prepende o contexto
const resolvedApiUrl = (envApiUrl && envApiUrl.startsWith('/api')) 
  ? `${context}${envApiUrl}` 
  : envApiUrl;

// Em desenvolvimento usa http://localhost:8080/api quando REACT_APP_API_URL não estiver definido.
// Em produção, prefere a variável de ambiente `REACT_APP_API_URL` e como fallback
// usa `window.location.origin + '/spdealer/api'` para evitar bundling com localhost.
const API_BASE_URL = (process.env.NODE_ENV === 'development')
  ? (envApiUrl || 'http://localhost:5070/api')
  : (resolvedApiUrl || envApiBase || (typeof window !== 'undefined' ? `${window.location.origin}${context}/api` : `${context}/api`));

// Algumas partes do app usam uma URL pública separada (ex: dashboard builder). Mantemos fallback coerente.
const API_PUBLIC_URL = envApiPublic || API_BASE_URL.replace(/\/api\/?$/, '') + '/api/v1';

// Configuração global do Axios para suportar sessões (cookies) em requisições cross-origin
axios.defaults.withCredentials = true;

export { API_BASE_URL, API_PUBLIC_URL };













