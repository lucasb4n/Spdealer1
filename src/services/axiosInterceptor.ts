import axios from 'axios';

// Interceptor simples para logar requests/responses e erros (apenas em dev)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // armazenar últimos requests para depuração rápida no console
  (window as any).__apiLogs = (window as any).__apiLogs || [];

  axios.interceptors.request.use(req => {
    try {
      const entry = {
        type: 'request',
        method: req.method,
        url: req.url,
        data: req.data,
        params: req.params,
        time: new Date().toISOString()
      };
      (window as any).__apiLogs.push(entry);
      if ((window as any).__apiLogs.length > 200) (window as any).__apiLogs.shift();
      // log leve para console
      // eslint-disable-next-line no-console
      console.debug('[API REQ]', entry);
    } catch (e) {
      // ignore
    }
    return req;
  }, err => {
    // eslint-disable-next-line no-console
    console.error('[API REQ ERR]', err);
    return Promise.reject(err);
  });

  axios.interceptors.response.use(resp => {
    try {
      const entry = {
        type: 'response',
        url: resp.config?.url,
        status: resp.status,
        data: resp.data,
        time: new Date().toISOString()
      };
      (window as any).__apiLogs.push(entry);
      if ((window as any).__apiLogs.length > 200) (window as any).__apiLogs.shift();
      // eslint-disable-next-line no-console
      console.debug('[API RES]', entry);
    } catch (e) {
      // ignore
    }
    return resp;
  }, err => {
    try {
      const cfg = err.config || {};
      const entry = {
        type: 'response_error',
        url: cfg.url,
        method: cfg.method,
        status: err.response?.status,
        responseData: err.response?.data,
        message: err.message,
        time: new Date().toISOString()
      };
      (window as any).__apiLogs.push(entry);
      if ((window as any).__apiLogs.length > 200) (window as any).__apiLogs.shift();
      // eslint-disable-next-line no-console
      console.error('[API ERR]', entry);
    } catch (e) {
      // ignore
    }
    return Promise.reject(err);
  });
}

const axiosInterceptor = {};

export default axiosInterceptor;













