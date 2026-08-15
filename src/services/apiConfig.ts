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

// Derivar o contexto da aplicação (ex: /spdealer ou /spdealer_test)
const getContextPath = () => {
  if (typeof window === 'undefined') return '/spdealer';
  const path = window.location.pathname;
  const parts = path.split('/');
  if (parts.length > 1 && parts[1] && (parts[1].startsWith('spdealer') || parts[1] === 'spdealer_test')) {
    return '/' + parts[1];
  }
  return '';
};

const context = typeof window !== 'undefined' ? getContextPath() : '';

// Quando a aplicação está rodando no servidor (Tomcat), a API base deve obrigatoriamente
// seguir o contexto da URL atual do navegador (${context}/api) para evitar redirecionamento incorreto para produção (/spdealer/api).
const API_BASE_URL = (typeof window !== 'undefined' && window.location.port !== '3000')
  ? `${context}/api`
  : (cleanEnvUrl(process.env.REACT_APP_API_URL) || 'http://localhost:5070/api');

// Algumas partes do app usam uma URL pública separada (ex: dashboard builder). Mantemos fallback coerente.
const API_PUBLIC_URL = envApiPublic || API_BASE_URL.replace(/\/api\/?$/, '') + '/api/v1';

// Configuração global do Axios para suportar sessões (cookies) em requisições cross-origin
axios.defaults.withCredentials = true;

// Interceptor global para garantir que URLs relativas iniciando com /api/ incluam o contexto (/spdealer ou /spdealer_test)
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api/')) {
    const currentContext = typeof window !== 'undefined' ? getContextPath() : '';
    if (currentContext && !config.url.startsWith(currentContext)) {
      config.url = `${currentContext}${config.url}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export { API_BASE_URL, API_PUBLIC_URL };













