import pymysql

def guess_alias(col):
    col = col.replace('_', ' ')
    return col.title()

tables = [
    ('ctp001', 'Apontamento'), ('ctp000', 'Cadastro de Pagadores'), 
    ('ctp002', 'Endereco de Pagadores'), ('ctp003', 'Cadastro de Portadores'),
    ('ctp011', 'Cadastro de Cedentes'), ('ctp012', 'Cadastro de Sacadores'),
    ('ctpsol', 'Cadastro de Solicitantes'), ('log', 'Log das Operacoes'),
    ('selos', 'Estoque de Selos'), ('selados', 'Selos Utilizados'),
    ('ctpapo', 'Apontamento Distribuidos'), ('alegacao', 'Alegacoes de Pagadores'),
    ('motivo', 'Motivos de Protesto'), ('especie', 'Especies de Titulos'),
    ('recibo', 'Cadastro de Recibos'), ('fin_condpag', 'Condicoes de Pagamento'),
    ('fin_pago', 'Forma de Pagamento de Recibos'), ('ctpcam', 'Caminhos de Arquivos'),
    ('custas', 'Cadastro de Custas'), ('ctpreq', 'Requerimentos de Cancelamento'),
    ('ctprem', 'Titulos em Requerimento'), ('ctptex', 'Textos de Certidoes'),
    ('jurament', 'Juramentados'), ('pagar', 'Contas a Pagar'),
    ('situacao', 'Situacoes de Titulos'), ('trzcai', 'Transacoes de Caixa'),
    ('uteis', 'Dias Uteis'), ('autoriza', 'Autorizacao e Boletos')
]

try:
    conn = pymysql.connect(host='localhost', user='root', password='k15720', database='spprot')
    cursor = conn.cursor()

    print("--- INICIANDO POPULACAO COMPLETA (SEM EMOJIS) ---")
    
    for table_tech, table_alias in tables:
        cursor.execute("REPLACE INTO dictionary_tables (table_name, alias_name) VALUES (%s, %s)", (table_tech, table_alias))
        
        cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'spprot' AND TABLE_NAME = %s", (table_tech,))
        cols = cursor.fetchall()
        
        if not cols:
            print("AVISO: Tabela '{}' nao encontrada.".format(table_tech))
            continue
            
        print("OK: Processando {} colunas de '{}'...".format(len(cols), table_tech))
        
        for (col_name,) in cols:
            alias = guess_alias(col_name)
            cursor.execute("INSERT IGNORE INTO dictionary_columns (table_name, column_name, alias_name) VALUES (%s, %s, %s)", (table_tech, col_name, alias))

    conn.commit()
    conn.close()
    print("--- FINALIZADO COM SUCESSO ---")
except Exception as e:
    print("ERRO: {}".format(str(e)))
