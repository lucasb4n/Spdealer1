const mysql = require('mysql');

const connection = mysql.createConnection({
  host: '100.126.166.63',
  user: 'root',
  password: 'seprocom123@2024',
  database: 'erp'
});

connection.connect(function(err) {
  if (err) {
    console.log('❌ Conexão falhou:', err.message);
    process.exit(1);
  }
  
  // Consulta a estrutura da tabela clientes
  connection.query(`
    SELECT 
      COLUMN_NAME,
      COLUMN_TYPE,
      IS_NULLABLE,
      COLUMN_KEY,
      COLUMN_DEFAULT,
      CHARACTER_MAXIMUM_LENGTH,
      NUMERIC_PRECISION,
      NUMERIC_SCALE,
      DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'clientes' AND TABLE_SCHEMA = 'erp'
    ORDER BY ORDINAL_POSITION
  `, function(err, results) {
    if (err) {
      console.log('❌ Query falhou:', err.message);
      connection.end();
      process.exit(1);
    }
    
    console.log('\n📊 ESTRUTURA DA TABELA CLIENTES\n');
    console.log('Nº | Column Name           | Data Type                    | Max Chars | Nullable | Default');
    console.log('---|--------------------|----|--------|----------|---------|----------');
    
    results.forEach((col, idx) => {
      const maxChar = col.CHARACTER_MAXIMUM_LENGTH || '-';
      const nullable = col.IS_NULLABLE === 'YES' ? 'SIM' : 'NÃO';
      const dataType = col.COLUMN_TYPE;
      const defaultVal = col.COLUMN_DEFAULT || '-';
      const colName = col.COLUMN_NAME;
      
      const numStr = String(idx + 1).padEnd(2);
      const nameStr = colName.padEnd(20);
      const typeStr = dataType.padEnd(28);
      const charStr = String(maxChar).padEnd(9);
      
      console.log(`${numStr}| ${nameStr} | ${typeStr} | ${charStr} | ${nullable.padEnd(8)} | ${defaultVal}`);
    });
    
    console.log(`\n✅ Total: ${results.length} colunas`);
    
    // Salvar em arquivo JSON para análise
    const columnInfo = {};
    results.forEach(col => {
      columnInfo[col.COLUMN_NAME] = {
        tipo: col.DATA_TYPE,
        tipoCompleto: col.COLUMN_TYPE,
        maxChars: col.CHARACTER_MAXIMUM_LENGTH,
        nullable: col.IS_NULLABLE === 'YES',
        chave: col.COLUMN_KEY,
        padrao: col.COLUMN_DEFAULT,
        precisao: col.NUMERIC_PRECISION,
        escala: col.NUMERIC_SCALE
      };
    });
    
    const fs = require('fs');
    fs.writeFileSync('db_schema_clientes.json', JSON.stringify(columnInfo, null, 2));
    console.log('\n✅ Esquema salvo em: db_schema_clientes.json');
    
    connection.end();
  });
});
