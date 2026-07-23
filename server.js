#!/usr/bin/env node
/**
 * SPDealer - Servidor Proxy + Static Files
 * 
 * Este servidor funciona em produção quando o build está compilado.
 * - Porta 3000: Frontend (arquivos estáticos)
 * - Proxy /api: Para backend (localhost:8080)
 * 
 * Para usar com auto-reload em desenvolvimento:
 * npm install --save-dev nodemon
 * npm run server:watch
 */

const express = require('express');
const httpProxy = require('http-proxy');
const path = require('path');
const fs = require('fs');

const app = express();
const proxy = httpProxy.createProxyServer({});

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const BUILD_PATH = path.join(__dirname, 'build');

// ==========================================
// LOGGING CONFIGURÁVEL
// ==========================================
const DEBUG = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production';

function log(level, message, data = null) {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const prefix = `[${timestamp}] [${level}]`;
  
  if (level === 'ERROR' || level === 'WARN') {
    console.error(prefix, message, data || '');
  } else if (DEBUG) {
    console.log(prefix, message, data || '');
  }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
log('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('INFO', 'SPDealer - Servidor Proxy & Static Files');
log('INFO', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('INFO', `Modo: ${DEBUG ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);
log('INFO', `Porta: ${PORT}`);
log('INFO', `Build Path: ${BUILD_PATH}`);
log('INFO', `Backend URL: ${BACKEND_URL}`);

// Verificar se build/ existe
if (!fs.existsSync(BUILD_PATH)) {
  log('WARN', '⚠️  Pasta build/ não encontrada!');
  log('WARN', 'Execute: npm run build');
}

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// PROXY /api → Backend - FUNCIONAVA NO BACKUP
// ==========================================
// Padrão original que funcionava: req.url tem /api removido,
// então adicionamos de volta para enviar o path completo ao backend
app.use('/api', (req, res) => {
  // Quando Express usa app.use('/api', ...), o req.url NÃO tem /api
  // Exemplo: GET /api/v1/dashboards/1 → req.url é /v1/dashboards/1
  // Precisamos reconstruir o path completo
  
  // DEBUG: Logar o que recebemos
  log('DEBUG', `[ENTRADA PROXY] req.method=${req.method}, req.url=${req.url}, req.path=${req.path}, req.originalUrl=${req.originalUrl}`);
  
  // O backend espera: /api/v1/dashboards/1
  // Então reconstituir o caminho completo
  const fullPath = '/api' + req.url;
  
  log('PROXY', `${req.method.padEnd(6)} ${fullPath}`, `→ ${BACKEND_URL}${fullPath}`);
  
  // CRÍTICO: Reescrever req.url para o path completo que o proxy enviará
  // Sem isso, http-proxy pode enviar apenas /v1/dashboards/1
  req.url = fullPath;
  
  // Enviar ao proxy
  proxy.web(req, res, {
    target: BACKEND_URL,
    changeOrigin: true
  });
});

// ==========================================
// HANDLERS DO PROXY
// ==========================================
proxy.on('error', (err, req, res) => {
  log('ERROR', `[PROXY ERROR] ${req.method} ${req.url}:`, err.code, err.message);
  res.writeHead(502, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Proxy error: ' + err.message,
    code: err.code,
    path: req.url
  }));
});

proxy.on('proxyRes', (proxyRes, req, res) => {
  log('PROXY', `[RESPOSTA] ${req.method} ${req.url} → ${proxyRes.statusCode}`);
});

proxy.on('proxyReq', (proxyReq, req, res) => {
  log('DEBUG', `[PROXY REQ ENVIADO] ${req.method} ${proxyReq.path || req.url}`);
});

// ==========================================
// STATIC FILES - Servir build/
// ==========================================
app.use(express.static(BUILD_PATH, {
  index: false,  // Desabilitar default index handler
  setHeaders: (res, filePath) => {
    // Cache control para arquivos
    if (filePath.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// ==========================================
// SPA FALLBACK - Servir index.html para rotas não encontradas
// ==========================================
app.use((req, res) => {
  const indexPath = path.resolve(BUILD_PATH, 'index.html');  // ✅ Usar path.resolve para garantir caminho absoluto válido
  
  // Se é uma requisição de arquivo estático, retornar 404
  if (req.path.match(/\.\w+$/)) {
    log('WARN', `Arquivo não encontrado: ${req.path}`);
    return res.status(404).send('Not Found');
  }
  
  // SPA fallback
  log('SPA', `Fallback para index.html: ${req.path}`);
  log('DEBUG', `Caminho completo: ${indexPath}`);  // ✅ Debug do caminho
  
  // ✅ Verificar se arquivo existe ANTES de tentar servir
  if (!fs.existsSync(indexPath)) {
    log('ERROR', `❌ Arquivo não existe: ${indexPath}`);
    return res.status(404).json({ 
      error: 'index.html not found',
      path: indexPath,
      buildPath: BUILD_PATH 
    });
  }
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      log('ERROR', `Falha ao servir index.html:`, err.message);
      res.status(500).send('Erro ao carregar página');
    }
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const server = app.listen(PORT, () => {
  log('INFO', '');
  log('INFO', `✅ Servidor rodando em: http://localhost:${PORT}`);
  log('INFO', `✅ Proxy /api para: ${BACKEND_URL}`);
  log('INFO', `✅ Arquivos estáticos: ${BUILD_PATH}`);
  log('INFO', '');
  log('INFO', 'Abra o navegador em: http://localhost:3000');
  log('INFO', '');
}).on('error', (err) => {
  log('ERROR', `Falha ao iniciar servidor:`, err.message);
  if (err.code === 'EADDRINUSE') {
    log('ERROR', `⚠️  Porta ${PORT} já está em uso!`);
    log('ERROR', 'Tente: netstat -ano | findstr :3000  (Windows)');
  }
  process.exit(1);
});

// ==========================================
// ERROR HANDLING
// ==========================================
process.on('uncaughtException', (err) => {
  log('ERROR', 'Exceção não capturada:', err.message);
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('ERROR', 'Promise rejection não tratada:', reason);
  process.exit(1);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
process.on('SIGTERM', () => {
  log('INFO', 'SIGTERM recebido, encerrando...');
  server.close(() => {
    log('INFO', 'Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('INFO', 'SIGINT recebido, encerrando...');
  server.close(() => {
    log('INFO', 'Servidor encerrado');
    process.exit(0);
  });
});
