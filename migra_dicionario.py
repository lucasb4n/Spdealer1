import pymysql

try:
    print('Conectando ao Localhost...')
    conn_local = pymysql.connect(host='localhost', user='root', password='k15720', database='spprot')
    cursor_local = conn_local.cursor(pymysql.cursors.DictCursor)

    print('Conectando ao Servidor .73 (100.119.184.70)...')
    conn_remoto = pymysql.connect(host='100.119.184.70', user='root', password='k15720', database='spprot')
    cursor_remoto = conn_remoto.cursor()

    # Garantir Tabelas no Remoto
    cursor_remoto.execute('CREATE TABLE IF NOT EXISTS dictionary_tables (table_name VARCHAR(50) PRIMARY KEY, alias_name VARCHAR(100), description TEXT)')
    cursor_remoto.execute('CREATE TABLE IF NOT EXISTS dictionary_columns (table_name VARCHAR(50), column_name VARCHAR(50), alias_name VARCHAR(100), description TEXT, PRIMARY KEY (table_name, column_name))')

    # Migrar dictionary_tables
    print('Migrando nomes das tabelas...')
    cursor_local.execute('SELECT * FROM dictionary_tables')
    for row in cursor_local.fetchall():
        cursor_remoto.execute('REPLACE INTO dictionary_tables (table_name, alias_name, description) VALUES (%s, %s, %s)', 
                              (row['table_name'], row['alias_name'], row['description']))

    # Migrar dictionary_columns
    print('Migrando colunas e aliases (pode demorar um pouco)...')
    cursor_local.execute('SELECT * FROM dictionary_columns')
    rows_cols = cursor_local.fetchall()
    for row in rows_cols:
        cursor_remoto.execute('REPLACE INTO dictionary_columns (table_name, column_name, alias_name, description) VALUES (%s, %s, %s, %s)', 
                              (row['table_name'], row['column_name'], row['alias_name'], row['description']))

    conn_remoto.commit()
    conn_local.close()
    conn_remoto.close()
    print('✅ Migração para o servidor .73 concluída com sucesso!')

except Exception as e:
    print('❌ Erro na migração: {}'.format(str(e)))
