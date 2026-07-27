const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Log TODOS os requests
app.use((req, res, next) => {
  console.log(`>>> ${req.method} ${req.path}`);
  next();
});

// Proxy SIMPLES
console.log('Registrando proxy para /api...');
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true
}));

console.log('Proxy registrado!');

// Fallback
app.use((req, res) => {
  console.log(`<<< FALLBACK: ${req.path}`);
  res.status(404).send('Not found');
});

app.listen(3000, () => {
  console.log('Server on port 3000');
});
