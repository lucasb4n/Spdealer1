const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Inspecionando estrutura da aplicação...\n');

    // Login
    await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
    const inputs = await page.$$('input');
    await inputs[0].fill('admin');
    await inputs[1].fill('admin');
    await inputs[1].press('Enter');
    
    await page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    console.log(`✅ Login realizado - URL: ${page.url()}\n`);

    // Lista todos os links na página
    console.log('📋 Links encontrados no menu/dashboard:\n');
    
    const links = await page.$$('a');
    const linkTexts = new Set();

    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      
      if (text && text.trim()) {
        linkTexts.add(`${text.trim()} → ${href || 'sem href'}`);
      }
    }

    for (const link of linkTexts) {
      console.log(`  • ${link}`);
    }

    console.log('\n⏳ Deixando browser aberto por 30s...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await browser.close();
  }
})();
