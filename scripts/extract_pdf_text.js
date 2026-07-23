const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const inFile = path.resolve(__dirname, '..', 'test-results', 'relatorio_receber_20251201_20251210.pdf');
const outFile = path.resolve(__dirname, '..', 'test-results', 'relatorio_receber_20251201_20251210.txt');

if (!fs.existsSync(inFile)) {
  console.error('PDF não encontrado:', inFile);
  process.exit(2);
}

const dataBuffer = fs.readFileSync(inFile);

pdf(dataBuffer).then(function(data) {
  fs.writeFileSync(outFile, data.text, 'utf8');
  console.log('Texto extraído salvo em:', outFile);
  console.log('\n--- PREVIEW (primeiros 4000 caracteres) ---\n');
  console.log(data.text.substring(0, 4000));
}).catch(function(err){
  console.error('Erro ao processar PDF:', err);
  process.exit(1);
});
