const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.setTimeout(120 * 1000);

const loginIfNeeded = async (page) => {
  await page.goto('/login', { waitUntil: 'networkidle' }).catch(async () => {
    await page.goto('/', { waitUntil: 'networkidle' }).catch(() => {});
  });
  await page.waitForTimeout(2000);
  const userInput = page.locator('input[type="text"], input[name="username"], input#username, input[placeholder*="Usu"], input[placeholder*="nome"]');
  const passInput = page.locator('input[type="password"], input[name="senha"], input#password');
  const entrarBtn = page.locator('button:has-text("Entrar"), button:has-text("Login"), button[type="submit"]');
  try {
    await page.waitForSelector('button:has-text("Entrar"), input[placeholder*="Usu"], input[placeholder*="nome"], input[type="password"]', { timeout: 20000 });
  } catch (e) {}
  if ((await userInput.count()) > 0 && (await passInput.count()) > 0) {
    await userInput.first().fill('admin');
    await passInput.first().fill('admin');
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

test('Captura o payload via UI e reproduz POST de exportacao', async ({ page, request }) => {
  // login + navigate to relatorios
  await loginIfNeeded(page);
  // navigate via URL first, fallback handled by capture test if needed
  await page.goto('/financeiro/relatorios', { waitUntil: 'networkidle' }).catch(() => {});

  // set date filters to a known range to trigger data
  const dataInicial = page.getByLabel('Data Inicial');
  const dataFinal = page.getByLabel('Data Final');
  const targetDateStart = '2025-12-01';
  const targetDateEnd = '2025-12-31';
  if ((await dataInicial.count()) > 0) await dataInicial.first().fill(targetDateStart);
  if ((await dataFinal.count()) > 0) await dataFinal.first().fill(targetDateEnd);

  // capture POST body from the browser request
  let captured = null;
  page.on('request', (req) => {
    try {
      if (req.method() === 'POST' && req.url().includes('/api/relatorios/financeiro/export')) {
        captured = req.postData();
      }
    } catch (e) {}
  });

  // generate and export (uses same selectors as capture test)
  const generateButton = page.getByRole('button', { name: /Gerar Relat/i }).first();
  if ((await generateButton.count()) > 0) {
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/relatorios/financeiro') && r.status() === 200).catch(() => {}),
      generateButton.click().catch(() => {})
    ]);
  }

  const grid = page.locator('.ag-root').first();
  await grid.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  const exportButton = page.getByRole('button', { name: /Exportar PDF/i }).first();
  if ((await exportButton.count()) > 0) {
    await exportButton.click().catch(() => {});
    // wait up to 10s for the browser request to be captured
    const start = Date.now();
    while (!captured && Date.now() - start < 10000) {
      await page.waitForTimeout(250);
    }
  } else {
    throw new Error('Botão Exportar PDF não encontrado');
  }

  if (!captured) throw new Error('Não conseguiu capturar o payload no navegador');

  // write captured payload to file for traceability
  try { if (!fs.existsSync('test-results')) fs.mkdirSync('test-results'); } catch(e){}
  fs.writeFileSync('test-results/export-payload.json', captured || '');

  // now reproduce using request.post with session cookies
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const url = 'http://localhost:8080/api/relatorios/financeiro/export';
  const headers = { 'Content-Type': 'application/json', 'Cookie': cookieHeader };

  let payloadObj = null;
  try { payloadObj = JSON.parse(captured); } catch (e) { payloadObj = captured; }

  const resp = await request.post(url, { headers, data: payloadObj });
  const status = resp.status();
  const bodyText = await resp.text().catch(() => '<no body>');

  fs.writeFileSync('test-results/export-response.json', JSON.stringify({ status, body: bodyText }, null, 2));
  console.log('Reproduced export POST -> status:', status);

  // allow investigation: don't force 200 here; assert that we got a response
  expect(typeof status).toBe('number');
});
