const https = require('http');
const fs = require('fs');
const path = require('path');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/relatorios-jasper/financeiro/export',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const payload = JSON.stringify({
  templateName: 'ContasReceberReport',
  tipo: 'receber',
  dataini: '2025-12-01',
  datafim: '2025-12-10',
  tipoCampoData: 'dtvenci_rec',
  soEmAberto: false,
  soPagos: false
});

const req = https.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    if (res.statusCode === 200) {
      const outDir = path.join(__dirname, '..', 'tmp');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, 'ContasReceber_2025-12-01_2025-12-10.pdf');
      fs.writeFileSync(outPath, buf);
      console.log('Saved PDF to', outPath, 'size=', buf.length);
    } else {
      console.error('Request failed, body length=', buf.length);
      console.error(buf.toString('utf8'));
    }
  });
});

req.on('error', (e) => {
  console.error('problem with request:', e.message);
});

req.write(payload);
req.end();
