/**
 * Playwright Visual Test Script
 * 
 * Conecta ao Chrome remoto (192.168.10.70:9222) e executa testes visuais
 * 
 * Para executar:
 *   npx playwright test visual-test-remote.js
 *   ou
 *   node visual-test-remote.js
 * 
 * O Chrome deve estar rodando com:
 *   chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\chrome-debug
 */

const { chromium } = require('playwright');

const CONFIG = {
  // URL do servidor de desenvolvimento (HTTP, não HTTPS)
  baseUrl: 'http://192.168.10.70:8080/spdealer',
  // Porta de debug do Chrome remoto (localhost ou IP remoto)
  debugPort: 9222,
  debugHost: 'localhost',  // Altere para IP remoto se necessário
  // Pasta para salvar screenshots
  screenshotDir: './test-screenshots'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectToRemoteChrome() {
  console.log('🔌 Conectando ao Chrome remoto...');
  
  try {
    const browser = await chromium.connectOverCDP({
      endpointURL: `http://${CONFIG.debugHost}:${CONFIG.debugPort}`,
      timeout: 30000
    });
    
    console.log('✅ Conectado ao Chrome remoto!');
    return browser;
  } catch (error) {
    console.error('❌ Erro ao conectar ao Chrome remoto:', error.message);
    console.log('\n💡 Para iniciar o Chrome com debug remoto:');
    console.log('   chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\\chrome-debug');
    throw error;
  }
}

async function takeScreenshot(page, name) {
  const fs = require('fs');
  const path = require('path');
  
  // Garantir que a pasta existe
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }
  
  const filepath = path.join(CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot salvo: ${filepath}`);
  return filepath;
}

async function runVisualTests() {
  let browser;
  let allPassed = true;
  const results = [];
  
  console.log('\n🧪 INICIANDO TESTES VISUAIS\n');
  console.log('========================================');
  
  try {
    // Conectar ao Chrome remoto
    browser = await connectToRemoteChrome();
    
    // Obter contextos existentes
    const contexts = browser.contexts();
    
    if (contexts.length === 0) {
      console.log('⚠️  Nenhum contexto encontrado, criando novo...');
      const context = await browser.newContext();
      const page = await context.newPage();
      await runPageTests(page);
    } else {
      // Usar o primeiro contexto
      const context = contexts[0];
      
      // Criar nova página e navegar para o app
      console.log('📄 Criando nova página para testes...');
      const page = await context.newPage();
      await runPageTests(page, 'spdealer');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:', error.message);
    allPassed = false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Resumo
  console.log('\n========================================');
  console.log('📊 RESUMO DOS TESTES');
  console.log('========================================');
  
  if (allPassed) {
    console.log('✅ Todos os testes passaram!');
  } else {
    console.log('❌ Alguns testes falharam!');
    process.exit(1);
  }
}

async function runPageTests(page, prefix = 'test') {
  const consoleLogs = [];
  const errors = [];
  
  // Capturar console logs
  page.on('console', msg => {
    const log = {
      type: msg.type(),
      text: msg.text(),
      time: new Date().toISOString()
    };
    consoleLogs.push(log);
    
    // Log imediato
    const color = msg.type() === 'error' ? '❌' : 
                  msg.type() === 'warning' ? '⚠️' : '📝';
    console.log(`  ${color} [${msg.type()}] ${msg.text()}`);
  });
  
  // Capturar erros de página
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      time: new Date().toISOString()
    });
    console.log(`  ❌ Page Error: ${error.message}`);
  });
  
  try {
    // 1. Navegar para a URL do SPDealer
    console.log(`\n🌐 Navegando para: ${CONFIG.baseUrl}`);
    await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(3000); // Aguardar carregamento completo
    
    // 2. Obter URL atual
    const url = page.url();
    console.log(`🌐 URL atual: ${url}`);
    
    // 3. Tirar screenshot inicial
    console.log('📸 Tirando screenshot inicial...');
    await takeScreenshot(page, `${prefix}-01-initial`);
    
    // 3. Verificar título
    const title = await page.title();
    console.log(`📄 Título: ${title}`);
    
    // 4. Verificar elementos principais
    console.log('🔍 Verificando elementos...');
    
    // Verificar se há menu
    const menuExists = await page.locator('nav, .sidebar, [class*="menu"]').count() > 0;
    console.log(`  Menu encontrado: ${menuExists ? '✅' : '❌'}`);
    
    // Verificar se há conteúdo
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasContent = bodyText.length > 10;
    console.log(`  Conteúdo encontrado: ${hasContent ? '✅' : '❌'}`);
    
    // Verificar erros críticos
    const hasCriticalErrors = errors.filter(e => 
      !e.message.includes('Warning') && 
      !e.message.includes('deprecated')
    ).length > 0;
    
    console.log(`  Erros críticos: ${hasCriticalErrors ? '❌ ' + hasCriticalErrors : '✅ Nenhum'}`);
    
    // 5. Testar navegação para Fluxo de Caixa
    console.log('\n🧪 Testando navegação para Fluxo de Caixa...');
    
    // Tentar encontrar link do Fluxo de Caixa
    const fluxoCaixaLinks = await page.locator('text=Fluxo de Caixa').count();
    console.log(`  Links "Fluxo de Caixa" encontrados: ${fluxoCaixaLinks}`);
    
    if (fluxoCaixaLinks > 0) {
      await page.locator('text=Fluxo de Caixa').first().click();
      await sleep(2000);
      await takeScreenshot(page, `${prefix}-02-fluxo-caixa`);
      
      // Verificar se os cards de banco apareceram
      const bankCards = await page.locator('[class*="BankCard"], [class*="bank"]').count();
      console.log(`  Cards de banco encontrados: ${bankCards}`);
    }
    
    // 6. Salvar logs do console
    console.log('\n💾 Salvando logs do console...');
    const fs = require('fs');
    const logsPath = `./test-screenshots/${prefix}-console-logs.json`;
    
    if (!fs.existsSync('./test-screenshots')) {
      fs.mkdirSync('./test-screenshots', { recursive: true });
    }
    
    fs.writeFileSync(logsPath, JSON.stringify({
      console: consoleLogs,
      errors: errors,
      url: url,
      title: title,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`  Logs salvos em: ${logsPath}`);
    
  } catch (error) {
    console.error(`  ❌ Erro durante teste: ${error.message}`);
  }
}

// Executar testes
runVisualTests().catch(console.error);
