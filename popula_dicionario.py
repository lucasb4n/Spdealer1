import pymysql
import re

def guess_alias(col):
    col = col.replace('_', ' ')
    return col.title()

tables = ['ctp001', 'ctp000', 'ctp002', 'ctp003', 'ctp011', 'ctp012', 'ctpsol', 'log', 'selos', 'selados', 'ctpapo', 'alegacao', 'motivo', 'especie', 'recibo', 'fin_condpag', 'fin_pago', 'ctpcam', 'custas', 'ctpreq', 'ctprem', 'ctptex', 'jurament', 'pagar', 'situacao', 'trzcai', 'uteis', 'autoriza']

try:
    # USANDO O IP REAL DO TAILSCALE PARA O SERVIDOR 70
    conn = pymysql.connect(host='100.108.147.26', user='root', password='k15720', database='spprot')
    cursor = conn.cursor()

    cursor.execute('CREATE TABLE IF NOT EXISTS dictionary_tables (table_name VARCHAR(50) PRIMARY KEY, alias_name VARCHAR(100), description TEXT)')
    cursor.execute('CREATE TABLE IF NOT EXISTS dictionary_columns (table_name VARCHAR(50), column_name VARCHAR(50), alias_name VARCHAR(100), description TEXT, PRIMARY KEY (table_name, column_name))')

    for t in tables:
        print('Lendo colunas de {}...'.format(t)) 
        cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'spprot' AND TABLE_NAME = '{}'".format(t))
        cols = cursor.fetchall()
        for (col_name,) in cols:
            alias = guess_alias(col_name)
            cursor.execute('INSERT IGNORE INTO dictionary_columns (table_name, column_name, alias_name) VALUES (%s, %s, %s)', (t, col_name, alias))

    conn.commit()
    conn.close()
    print('✅ Dicionário do servidor ATUALIZADO com IP real!')
except Exception as e:
    print('❌ Erro: {}'.format(str(e)))
