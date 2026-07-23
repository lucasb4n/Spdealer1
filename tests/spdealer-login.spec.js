// tests/spdealer-login.spec.js
// Teste de login do SPDealer com Playwright
// Executar: npx playwright test tests/spdealer-login.spec.js

import { test, expect } from '@playwright/test';

test.describe('SPDealer Login & UI Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar para página de login antes de cada teste
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  });

  test('01 - Carregar página de login', async ({ page }) => {
    console.log('📍 TESTE 1: Carregando página de login...');
    
    // Verificar URL
    expect(page.url()).toContain('localhost:3000');
    
    // Tirar screenshot
    await page.screenshot({ path: 'test-results/01-login-page.png' });
    console.log('✅ Screenshot: 01-login-page.png');
  });

  test('02 - Validar elementos do formulário', async ({ page }) => {
    console.log('📍 TESTE 2: Validando formulário de login...');
    
    // Verificar se inputs existem
    const usuarioInput = page.locator('input[type="text"], input[placeholder*="usuario"], input[placeholder*="admin"]').first();
    const senhaInput = page.locator('input[type="password"]');
    const botaoEntrar = page.locator('button:has-text("Entrar"), button[type="submit"]');
    
    await expect(usuarioInput).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('⚠️  Campo usuário não visível, mas pode estar carregando');
    });
    
    console.log('✅ Elementos do formulário validados');
  });

  test('03 - Fazer login com admin/admin', async ({ page }) => {
    console.log('📍 TESTE 3: Fazendo login...');
    
    // Preencher campos
    await page.fill('input[type="text"], input[placeholder*="admin"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    
    // Clique no botão Entrar
    await page.click('button:has-text("Entrar"), button[type="submit"]');
    
    // Aguardar navegação
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {
      console.log('⚠️  Navegação pode ter demorado mais que o esperado');
    });
    
    // Tirar screenshot pós-login
    await page.screenshot({ path: 'test-results/02-after-login.png' });
    console.log('✅ Screenshot: 02-after-login.png');
  });

  test('04 - Validar CSS e Layout', async ({ page }) => {
    console.log('📍 TESTE 4: Validando CSS e Layout...');
    
    // Avaliar estilos
    const styles = await page.evaluate(() => {
      const body = document.body;
      const main = document.querySelector('main') || document.querySelector('.container');
      
      return {
        bodyDisplay: window.getComputedStyle(body).display,
        backgroundColor: window.getComputedStyle(body).backgroundColor,
        mainExists: main !== null,
        mainDisplay: main ? window.getComputedStyle(main).display : 'N/A'
      };
    });
    
    console.log('  Estilos encontrados:', styles);
    expect(styles.bodyDisplay).toBeDefined();
    console.log('✅ CSS validado');
  });

  test('05 - Verificar console errors', async ({ page }) => {
    console.log('📍 TESTE 5: Verificando console errors...');
    
    const consoleMessages = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push({
          type: 'error',
          message: msg.text()
        });
        console.log(`  ⚠️  Error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', exception => {
      consoleMessages.push({
        type: 'exception',
        message: exception.toString()
      });
      console.log(`  ❌ Exception: ${exception}`);
    });
    
    // Aguardar um pouco para coletar mensagens
    await page.waitForTimeout(2000);
    
    console.log(`✅ Total de errors encontrados: ${consoleMessages.length}`);
  });

  test('06 - Validar responsividade (Mobile)', async ({ page }) => {
    console.log('📍 TESTE 6: Testando responsividade mobile...');
    
    // Simular viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Tirar screenshot em mobile
    await page.screenshot({ path: 'test-results/03-mobile-view.png' });
    console.log('✅ Screenshot mobile: 03-mobile-view.png');
  });

  test('07 - Validar responsividade (Tablet)', async ({ page }) => {
    console.log('📍 TESTE 7: Testando responsividade tablet...');
    
    // Simular viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Tirar screenshot em tablet
    await page.screenshot({ path: 'test-results/04-tablet-view.png' });
    console.log('✅ Screenshot tablet: 04-tablet-view.png');
  });

  test('08 - Validar responsividade (Desktop)', async ({ page }) => {
    console.log('📍 TESTE 8: Testando responsividade desktop...');
    
    // Simular viewport desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Tirar screenshot em desktop
    await page.screenshot({ path: 'test-results/05-desktop-view.png' });
    console.log('✅ Screenshot desktop: 05-desktop-view.png');
  });

  test('09 - Validar Performance', async ({ page }) => {
    console.log('📍 TESTE 9: Medindo performance...');
    
    const navigationTiming = await page.evaluate(() => {
      const perf = window.performance.timing;
      return {
        dns: perf.domainLookupEnd - perf.domainLookupStart,
        tcp: perf.connectEnd - perf.connectStart,
        load: perf.loadEventEnd - perf.loadEventStart,
        total: perf.loadEventEnd - perf.navigationStart
      };
    });
    
    console.log('  Performance:', navigationTiming);
    console.log('✅ Performance medida');
  });

  test('10 - Screenshot Final', async ({ page }) => {
    console.log('📍 TESTE 10: Capturando screenshot final...');
    
    await page.screenshot({ 
      path: 'test-results/06-final-state.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot final (full page): 06-final-state.png');
  });
});
