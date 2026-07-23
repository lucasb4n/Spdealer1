#!/usr/bin/env python3
"""
generate_fluxo_sql_from_csv.py

Gera scripts SQL para popular `fluxo_caixa_linhas`, `fluxo_caixa_dados` e templates de `dashboard_queries`
a partir de um CSV em formato 'long':

Colunas esperadas (obrigatórias):
- descricao       : texto da linha (ex: "Aluguel")
- tipo_linha      : RECEITA ou DESPESA
- ano_mes         : formato YYYY-MM (ex: 2025-08)
- previsto        : número (decimal) - pode ficar vazio
- realizado       : número (decimal) - pode ficar vazio

Colunas opcionais:
- contad_ocai     : código SCOPLA (se disponível)

Uso:
  python scripts/generate_fluxo_sql_from_csv.py --input planilha_long.csv --outdir sql_out

O script gera três arquivos em `sql_out/`:
 - populate_fluxo_caixa_linhas.sql
 - populate_fluxo_caixa_dados.sql
 - populate_fluxo_caixa_queries_template.sql

Este script NÃO executa nada no banco; é gerador de SQL idempotente.
"""
import argparse
import csv
import os
from collections import OrderedDict


def normalize_decimal(v):
    if v is None or v == '':
        return None
    s = str(v).strip()
    if s == '':
        return None
    # remove currency symbols and thousands separators
    s = s.replace('R$', '').replace('r$', '')
    s = s.replace('.', '').replace(',', '.') if s.count(',') > 0 and s.count('.') <= 1 else s.replace(',', '')
    try:
        return float(s)
    except Exception:
        try:
            return float(s.replace('\u00A0',''))
        except Exception:
            return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', '-i', required=True, help='CSV input (long format)')
    parser.add_argument('--outdir', '-o', default='sql_out', help='Output directory')
    args = parser.parse_args()

    inpath = args.input
    outdir = args.outdir
    os.makedirs(outdir, exist_ok=True)

    linhas = OrderedDict()  # key: (codigo_linha or descricao, tipo_linha) -> id placeholder
    dados = []
    used_codes = set()

    with open(inpath, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            descricao = (r.get('descricao') or r.get('referencia') or '').strip()
            tipo = (r.get('tipo_linha') or r.get('tipo') or '').strip().upper()
            contad = (r.get('contad_ocai') or r.get('conta') or '').strip()
            ano_mes = (r.get('ano_mes') or r.get('periodo') or r.get('mes') or '').strip()
            previsto = normalize_decimal(r.get('previsto') or r.get('valor_previsto') or r.get('valor'))
            realizado = normalize_decimal(r.get('realizado') or r.get('valor_real') or r.get('real'))

            if descricao == '' and contad == '':
                continue
            if ano_mes == '':
                continue

            # determine codigo_linha (must be NOT NULL and unique)
            if contad:
                codigo_linha = contad
            else:
                # generate safe code from descricao
                base = ''.join(ch for ch in descricao.upper() if ch.isalnum() or ch.isspace()).strip().replace(' ','_')
                if base == '':
                    base = 'MANUAL'
                # truncate base to leave room for suffix
                base = base[:14]
                codigo_linha = base
                suffix = 1
                while codigo_linha in used_codes:
                    codigo_linha = f"{base}_{suffix}"
                    suffix += 1
            used_codes.add(codigo_linha)

            key = (codigo_linha, tipo)
            if key not in linhas:
                linhas[key] = {
                    'codigo_linha': codigo_linha,
                    'descricao': descricao,
                    'tipo_linha': tipo
                }

            dados.append({
                'linha_key': key,
                'ano_mes': ano_mes,
                'previsto': previsto,
                'realizado': realizado
            })

    # Write populate_fluxo_caixa_linhas.sql
    with open(os.path.join(outdir, 'populate_fluxo_caixa_linhas.sql'), 'w', encoding='utf-8') as f:
        f.write('-- Idempotent inserts for fluxo_caixa_linhas\n')
        f.write('START TRANSACTION;\n')
        for key, v in linhas.items():
            codigo = v['codigo_linha'].replace("'", "''")
            descricao = v['descricao'].replace("'", "''")
            tipo = v['tipo_linha'] if v['tipo_linha'] else 'DESPESA'
            # insert using codigo_linha (unique NOT NULL) and descricao
            # note: target table schema uses columns (codigo_linha, descricao, tipo_linha, ordem)
            f.write(f"INSERT INTO fluxo_caixa_linhas (codigo_linha, descricao, tipo_linha, ordem)\n")
            f.write(f"SELECT '{codigo}', '{descricao}', '{tipo}', 0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM fluxo_caixa_linhas WHERE codigo_linha = '{codigo}');\n")
        f.write('COMMIT;\n')

    # Write populate_fluxo_caixa_dados.sql
    with open(os.path.join(outdir, 'populate_fluxo_caixa_dados.sql'), 'w', encoding='utf-8') as f:
        f.write('-- Inserts/updates for fluxo_caixa_dados (idempotent upsert by FK+ano_mes)\n')
        f.write('START TRANSACTION;\n')
        for row in dados:
            key = row['linha_key']
            contad_or_desc = key[0]
            tipo = key[1]
            ano_mes = row['ano_mes']
            previsto = row['previsto']
            realizado = row['realizado']

            # find linha id by contad or descricao
            # lookup by codigo_linha (always present)
            codigo = contad_or_desc.replace("'", "''")
            f.write(f"-- linha lookup by codigo_linha='{codigo}'\n")
            f.write("SET @linha_id := (SELECT id FROM fluxo_caixa_linhas WHERE codigo_linha = '%s' LIMIT 1);\n" % codigo)

            f.write("IF @linha_id IS NOT NULL AND @linha_id > 0 THEN\n")
            # Use INSERT ... ON DUPLICATE KEY assuming unique key exists on (fluxo_caixa_linha_id, ano_mes)
            vals = []
            if previsto is not None:
                vals.append(str(previsto))
            else:
                vals.append('NULL')
            if realizado is not None:
                vals.append(str(realizado))
            else:
                vals.append('NULL')

            f.write("  INSERT INTO fluxo_caixa_dados (fluxo_caixa_linha_id, ano_mes, valor_esperado, valor_real, data_criacao) VALUES (@linha_id, '%s-01', %s, %s, NOW())\n" % (ano_mes, vals[0], vals[1]))
            f.write("  ON DUPLICATE KEY UPDATE valor_esperado = COALESCE(VALUES(valor_esperado), valor_esperado), valor_real = COALESCE(VALUES(valor_real), valor_real);\n")
            f.write("END IF;\n\n")
        f.write('COMMIT;\n')

    # Write dashboard_queries template
    with open(os.path.join(outdir, 'populate_fluxo_caixa_queries_template.sql'), 'w', encoding='utf-8') as f:
        f.write('-- Template inserts for dashboard_queries\n')
        f.write('-- For each fluxo_caixa_linhas, create a dashboard_query that returns a single numeric value for given :ano and :mes\n')
        f.write('-- Example (replace <ID> and adjust SQL to your environment):\n')
        f.write("INSERT INTO dashboard_queries (id, name, sql_query, created_at) VALUES (NULL, 'fluxo_line_<ID>_monthly', 'SELECT SUM(valor) FROM caixa WHERE operacao_cai = ''<OPERACAO>'' AND YEAR(dtmovi_cai)=:ano AND MONTH(dtmovi_cai)=:mes', NOW());\n")

    print('SQL files generated in', outdir)


if __name__ == '__main__':
    main()
