const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  const page = await browser.newPage();

  try {
    console.log('🔍 DEBUG: Inspecionar botões APÓS Gerar Relatório\n');

    await page.goto('http://localhost:3000/login', { waitUntil: 'load' });
    const inputs = await page.$$('input');
    await inputs[0].fill('admin');
    await inputs[1].fill('admin');
    await inputs[1].press('Enter');
    
    await page.waitForNavigation({ waitUntil: 'load', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    console.log('✅ Login realizado\n');

    // Navegar para relatórios
    await page.goto('http://localhost:3000/financeiro/relatorios', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    console.log('📍 Página de Relatórios acessada\n');

    // Preencher datas
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length >= 2) {
      await dateInputs[0].fill('2025-12-01');
      await dateInputs[1].fill('2025-12-06');
      console.log('✅ Datas preenchidas\n');
    }

    // Clicar em "Gerar Relatório"
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = (await btn.textContent()).toLowerCase().trim();
      if (text.includes('gerar') && (text.includes('relatorio') || text.includes('relatório'))) {
        console.log('✅ Clicando em "Gerar Relatório"\n');
        await btn.click();
        await page.waitForTimeout(3000);
        break;
      }
    }

    console.log('═'.repeat(70));
    console.log('BOTÕES ENCONTRADOS APÓS GERAR RELATÓRIO:');
    console.log('═'.repeat(70));

    const btnsAfter = await page.$$('button');
    console.log(`\nTotal de botões: ${btnsAfter.length}\n`);

    for (let i = 0; i < btnsAfter.length; i++) {
      const text = await btnsAfter[i].textContent();
      const title = await btnsAfter[i].getAttribute('title');
      const ariaLabel = await btnsAfter[i].getAttribute('aria-label');
      const className = await btnsAfter[i].getAttribute('class');
      const id = await btnsAfter[i].getAttribute('id');
      
      console.log(`\n[BOTÃO ${i}]`);
      console.log(`  Texto: "${text.trim()}"`);
      console.log(`  Title: ${title || '(vazio)'}`);
      console.log(`  Aria-label: ${ariaLabel || '(vazio)'}`);
      console.log(`  ID: ${id || '(vazio)'}`);
      console.log(`  Class: ${className ? className.substring(0, 60) : '(vazio)'}`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ DEBUG CONCLUÍDO - Browser aberto por 20s\n');
    
    await page.waitForTimeout(20000);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.waitForTimeout(30000);
  } finally {
    await browser.close();
  }
})();
