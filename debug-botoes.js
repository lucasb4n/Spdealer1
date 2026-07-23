const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  const page = await browser.newPage();

  try {
    console.log('🔍 DEBUG: Inspeccionar botões na página\n');

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
    console.log('═'.repeat(70));
    console.log('BOTÕES ENCONTRADOS NA PÁGINA:');
    console.log('═'.repeat(70));

    const buttons = await page.$$('button');
    console.log(`\nTotal de botões: ${buttons.length}\n`);

    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const title = await buttons[i].getAttribute('title');
      const ariaLabel = await buttons[i].getAttribute('aria-label');
      const className = await buttons[i].getAttribute('class');
      
      console.log(`\n[BOTÃO ${i}]`);
      console.log(`  Texto: "${text.trim()}"`);
      console.log(`  Title: ${title || '(vazio)'}`);
      console.log(`  Aria-label: ${ariaLabel || '(vazio)'}`);
      console.log(`  Class: ${className ? className.substring(0, 60) : '(vazio)'}`);
      console.log(`  HTML: ${(await buttons[i].innerHTML()).substring(0, 80)}`);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('SELECTS ENCONTRADOS NA PÁGINA:');
    console.log('═'.repeat(70));

    const selects = await page.$$('select');
    console.log(`\nTotal de selects: ${selects.length}\n`);

    for (let i = 0; i < selects.length; i++) {
      const text = await selects[i].textContent();
      const id = await selects[i].getAttribute('id');
      const name = await selects[i].getAttribute('name');
      const options = await selects[i].$$('option');
      
      console.log(`\n[SELECT ${i}]`);
      console.log(`  ID: ${id || '(vazio)'}`);
      console.log(`  Name: ${name || '(vazio)'}`);
      console.log(`  Opções (${options.length}):`);
      
      for (let j = 0; j < Math.min(options.length, 5); j++) {
        const optText = await options[j].textContent();
        const optValue = await options[j].getAttribute('value');
        console.log(`    - "${optText.trim()}" (value: ${optValue})`);
      }
      
      if (options.length > 5) {
        console.log(`    ... e ${options.length - 5} mais`);
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('INPUTS ENCONTRADOS NA PÁGINA:');
    console.log('═'.repeat(70));

    const inputs2 = await page.$$('input');
    console.log(`\nTotal de inputs: ${inputs2.length}\n`);

    for (let i = 0; i < inputs2.length; i++) {
      const type = await inputs2[i].getAttribute('type');
      const id = await inputs2[i].getAttribute('id');
      const name = await inputs2[i].getAttribute('name');
      const placeholder = await inputs2[i].getAttribute('placeholder');
      const value = await inputs2[i].inputValue();
      
      if (type && type !== 'hidden') {
        console.log(`\n[INPUT ${i}]`);
        console.log(`  Type: ${type}`);
        console.log(`  ID: ${id || '(vazio)'}`);
        console.log(`  Name: ${name || '(vazio)'}`);
        console.log(`  Placeholder: ${placeholder || '(vazio)'}`);
        console.log(`  Value: ${value || '(vazio)'}`);
      }
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
