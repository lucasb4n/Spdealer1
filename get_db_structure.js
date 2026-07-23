const mysql = require('mysql');

const connection = mysql.createConnection({
  host: '100.126.166.63',
  user: 'root',
  password: 'seprocom123@2024',
  database: 'erp'
});

connection.connect();

// Query para pegar a estrutura da tabela
connection.query("SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'clientes' AND TABLE_SCHEMA = 'erp' ORDER BY ORDINAL_POSITION", function (error, results) {
  if (error) {
    console.log('ERROR:', error);
  } else {
    console.log('\n📊 ESTRUTURA DA TABELA CLIENTES (Banco de Dados)\n');
    console.log('Coluna | Tipo | Nullable | Key');
    console.log('------|------|----------|-----');
    results.forEach(row => {
      console.log(`${row.COLUMN_NAME} | ${row.COLUMN_TYPE} | ${row.IS_NULLABLE} | ${row.COLUMN_KEY || '-'}`);
    });
    
    console.log('\n\nTOTAL DE COLUNAS:', results.length);
  }
  
  connection.end();
});
