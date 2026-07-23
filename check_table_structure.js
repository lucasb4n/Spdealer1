const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: '100.126.166.63',
      user: 'root',
      password: 'seprocom123@2024',
      database: 'erp'
    });
    
    const [rows] = await conn.execute('DESC clientes');
    console.log('\n📊 Table Structure (clientes):');
    rows.slice(0, 30).forEach((row, i) => {
      const key = row.Key === 'PRI' ? ' [PRIMARY]' : '';
      const nullable = row.Null === 'YES' ? ' [NULL OK]' : ' [NOT NULL]';
      console.log(`${i+1}. ${row.Field} (${row.Type})${key}${nullable}`);
    });
    
    console.log(`\nTotal columns: ${rows.length}`);
    await conn.end();
  } catch (e) {
    console.log('Error: ' + e.message);
  }
})();
