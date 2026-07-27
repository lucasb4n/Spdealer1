const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      // Encaminha /api/* para backend em http://localhost:8080 sem reescrever o caminho.
      // Removido pathRewrite por recomendação de Lucas para evitar 404/400.
    })
  );
};
