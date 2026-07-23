import pymysql

# Dicionário de tradução de prefixos e termos comuns
TRANSLATIONS = {
    'data': 'Data ', 'dt': 'Data ', 'vlr': 'Valor ', 'nome': 'Nome ',
    'docu': 'Documento ', 'cod': 'Codigo ', 'descr': 'Descricao ',
    'sit': 'Situacao ', 'pro': 'Protocolo ', 'bai': 'Baixa ',
    'apo': 'Apontamento ', 'dev': 'Devedor ', 'cre': 'Credor ',
    'por': 'Portador ', 'ced': 'Cedente ', 'sac': 'Sacador ',
    'tit': 'Titulo ', 'aut': 'Autorizacao ', 'rec': 'Recibo ',
    'cus': 'Custa ', 'venc': 'Vencimento ', 'pag': 'Pagamento ',
    'num': 'Numero ', 'obs': 'Observacao ', 'espec': 'Especie ',
    'jur': 'Juros ', 'mult': 'Multa ', 'desp': 'Despesa ',
    'end': 'Endereco ', 'cid': 'Cidade ', 'est': 'Estado ',
    'cep': 'CEP ', 'fon': 'Telefone ', 'mail': 'Email '
}

def smart_translate(col):
    col = col.lower()
    # Tenta casar prefixos conhecidos
    for tech, human in TRANSLATIONS.items():
        if tech in col:
            col = col.replace(tech, human)
    
    # Limpeza final
    col = col.replace('_', ' ').replace('001', '').replace('aut', '').replace('rec', '')
    return col.strip().title()

try:
    conn = pymysql.connect(host='localhost', user='root', password='k15720', database='spprot')
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    print("Buscando colunas para traducao...")
    cursor.execute("SELECT table_name, column_name FROM dictionary_columns")
    rows = cursor.fetchall()
    
    print(f"Traduzindo {len(rows)} colunas. Por favor, aguarde...")
    
    for row in rows:
        h_name = smart_translate(row['column_name'])
        cursor.execute("UPDATE dictionary_columns SET alias_name = %s WHERE table_name = %s AND column_name = %s",
                       (h_name, row['table_name'], row['column_name']))

    conn.commit()
    conn.close()
    print("Mapeamento massivo concluido com sucesso no Localhost!")

except Exception as e:
    print(f"Erro: {str(e)}")
