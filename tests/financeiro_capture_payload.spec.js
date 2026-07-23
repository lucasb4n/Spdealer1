const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Test to capture POST body for /api/relatorios/financeiro/export
test.setTimeout(120 * 1000);

const loginIfNeeded = async (page) => {
  // Try to reach login screen; prefer explicit /login but accept root
  await page.goto('/login', { waitUntil: 'networkidle' }).catch(async () => {
    await page.goto('/', { waitUntil: 'networkidle' }).catch(() => {});
  });
  // small delay to allow dynamic company/branch lists to populate
  await page.waitForTimeout(2000);

  // broaden selectors to detect various login inputs/placeholders
  const userInput = page.locator('input[type="text"], input[name="username"], input#username, input[placeholder*="Usu"], input[placeholder*="nome"]');
  const passInput = page.locator('input[type="password"], input[name="senha"], input#password');
  const entrarBtn = page.locator('button:has-text("Entrar"), button:has-text("Login"), button[type="submit"]');

  try {
    // wait for either inputs or Entrar button to appear
    await page.waitForSelector('button:has-text("Entrar"), input[placeholder*="Usu"], input[placeholder*="nome"], input[type="password"]', { timeout: 20000 });
  } catch (e) {
    // continue - maybe already logged in or different layout
  }

  if ((await userInput.count()) > 0 && (await passInput.count()) > 0) {
    await userInput.first().fill('admin');
    await passInput.first().fill('admin');
    // prefer pressing Enter to submit in case button is hidden behind custom component
    try {
      await passInput.first().press('Enter');
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    } catch (e) {
      if ((await entrarBtn.count()) > 0) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {}),
          entrarBtn.first().click().catch(() => {})
        ]);
      }
    }
  }
};

const navigateToRelatorios = async (page) => {
  const targetUrl = '/financeiro/relatorios';
  await page.goto(targetUrl, { waitUntil: 'networkidle' }).catch(() => {});
  try {
    await page.waitForSelector('label:has-text("Tipo de Data")', { timeout: 45000 });
  } catch (err) {
    let menuFinanceiro = page.locator('button:has-text("Financeiro")').first();
    if (await menuFinanceiro.count() === 0) {
      menuFinanceiro = page.locator('text=Financeiro').first();
    }
    if (await menuFinanceiro.count() > 0) {
      await menuFinanceiro.click().catch(() => {});
      let relatoriosItem = page.locator('text=Relatórios Operacionais').first();
      if (await relatoriosItem.count() === 0) relatoriosItem = page.locator('text=Relatórios').first();
      if (await relatoriosItem.count() === 0) relatoriosItem = page.locator('text=Relatórios Financeiros').first();
      if (await relatoriosItem.count() > 0) {
        await relatoriosItem.click().catch(() => {});
      }
      await page.waitForSelector('label:has-text("Tipo de Data")', { timeout: 45000 });
    } else {
      throw err;
    }
  }
};

test('Captura payload do POST /api/relatorios/financeiro/export', async ({ page }) => {
  await loginIfNeeded(page);
  await navigateToRelatorios(page);

  // set date filters to 2025-12-17
  const dataInicial = page.getByLabel('Data Inicial');
  const dataFinal = page.getByLabel('Data Final');
  const targetDate = '2025-12-17';
  if (await dataInicial.count() > 0) await dataInicial.first().fill(targetDate);
  if (await dataFinal.count() > 0) await dataFinal.first().fill(targetDate);

  // capture POST body
  let captured = null;
  page.on('request', async (req) => {
    try {
      if (req.method() === 'POST' && req.url().includes('/api/relatorios/financeiro/export')) {
        const postData = req.postData();
        captured = postData;
        // ensure directory exists
        try {
          if (!fs.existsSync('test-results')) fs.mkdirSync('test-results');
        } catch (mkdirErr) {
          // ignore
        }
        // write to file immediately (stringify if object)
        const out = postData || '';
        fs.writeFileSync('test-results/export-payload.json', out);
        console.log('Payload salvo em test-results/export-payload.json');
      }
    } catch (e) {
      console.warn('Erro ao capturar request', e);
    }
  });

  // gerar relatório antes de exportar (mesma lógica do teste principal)
  const generateButton = page.getByRole('button', { name: /Gerar Relat/i }).first();
  const responsePromise = page.waitForResponse((response) => {
    return response.url().includes('/api/relatorios/financeiro') && response.status() === 200;
  });
  if ((await generateButton.count()) > 0) {
    await Promise.all([
      responsePromise.catch(() => {}),
      generateButton.click().catch(() => {})
    ]);
  } else {
    await responsePromise.catch(() => {});
  }

  // aguardar a grade aparecer
  const grid = page.locator('.ag-root').first();
  await expect(grid).toBeVisible({ timeout: 15000 });

  const exportButton = page.getByRole('button', { name: /Exportar PDF/i }).first();
  if (await exportButton.count() > 0) {
    await exportButton.click().catch(() => {});
    // wait for payload file to be written by the request handler (up to 10s)
    const maxWait = 10000;
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      if (fs.existsSync('test-results/export-payload.json')) break;
      await page.waitForTimeout(500);
    }
  } else {
    throw new Error('Botão Exportar PDF não encontrado');
  }

  // assert that payload file exists
  const exists = fs.existsSync('test-results/export-payload.json');
  expect(exists).toBeTruthy();

  if (exists) {
    const content = fs.readFileSync('test-results/export-payload.json', 'utf8');
    console.log('Captured payload length:', content.length);
  }
});
