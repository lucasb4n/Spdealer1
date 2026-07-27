const mysql = require('mysql2/promise');

(async () => {
  try {
    const clienteCodigo = process.argv[2] || '2356';

    const creds = [
      { user: 'root', password: process.env.DB_PASS || 'seprocom123@2024' },
      { user: 'root', password: 'k15720' }
    ];

    let lastErr = null;
    for (const c of creds) {
      try {
        const conn = await mysql.createConnection({
          host: '100.126.166.63',
          user: c.user,
          password: c.password,
          database: 'erp',
          port: 3306,
          connectTimeout: 5000
        });

        const [rows] = await conn.execute('SELECT * FROM clientes WHERE codigo_cli = ?', [clienteCodigo]);
        if (!rows || rows.length === 0) {
          console.log(`Nenhum registro encontrado para codigo_cli=${clienteCodigo}`);
        } else {
          console.log(JSON.stringify(rows, null, 2));
        }

        await conn.end();
        return;
      } catch (e) {
        lastErr = e;
        console.warn(`Tentativa com usuário=${c.user} falhou: ${e.message}`);
      }
    }

    console.error('Todas as tentativas falharam. Último erro:', lastErr && lastErr.message);
    process.exit(1);
  } catch (e) {
    console.error('Erro inesperado:', e.message);
    process.exit(1);
  }
})();
