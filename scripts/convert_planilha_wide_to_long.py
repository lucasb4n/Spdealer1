#!/usr/bin/env python3
"""
convert_planilha_wide_to_long.py

Heurístico para converter planilhas de planejamento (wide: meses como colunas
com subcolunas PREVISTO/REALIZADO) em um CSV long com colunas:
descricao,tipo_linha,contad_ocai,ano_mes,previsto,realizado

Usage:
  python scripts/convert_planilha_wide_to_long.py --input "database/PLANEJAMENTO financeiro ATUALIZADO 2.0.xlsx" --output database/PLANILHA_LONG.csv

This script uses pandas and requires `pip install pandas openpyxl` if not installed.
"""
import argparse
import re
import pandas as pd
from pathlib import Path

MONTHS_PT = ['JANEIRO','FEVEREIRO','MARÇO','MARCO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO']


def find_header_row_xlsx(path):
    # read first 20 rows raw to look for header row containing 'REFERENCIA' or 'REFERÊNCIA'
    xls = pd.read_excel(path, header=None, nrows=30, engine='openpyxl')
    for i in range(min(30, len(xls))):
        row = xls.iloc[i].astype(str).str.upper().fillna('')
        if row.str.contains('REFERENCIA').any() or row.str.contains('REFERÊNCIA').any() or row.str.contains('REFERÊNCIA').any():
            return i
    # fallback to first row
    return 0


def detect_year(path):
    xls = pd.read_excel(path, header=None, nrows=6, engine='openpyxl')
    text = ' '.join(xls.fillna('').astype(str).values.flatten()).upper()
    m = re.search(r'\b(20\d{2})\b', text)
    if m:
        return m.group(1)
    return None


def flatten_col(col):
    if isinstance(col, tuple):
        return ' '.join([str(x).strip() for x in col if str(x).strip() and not str(x).startswith('Unnamed')])
    return str(col)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', '-i', required=True)
    parser.add_argument('--output', '-o', default='database/PLANILHA_LONG.csv')
    parser.add_argument('--sheet', '-s', default=None)
    parser.add_argument('--header-row', '-H', type=int, default=None,
                        help='Explicit header row index (0-based). Overrides auto-detect')
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    header_row = find_header_row_xlsx(input_path)
    if args.header_row is not None:
        header_row = args.header_row
    year = detect_year(input_path) or ''

    # Read with detected header. If there is a row above containing month names,
    # try to read as MultiIndex header combining that row and the detected header.
    sheet_to_read = args.sheet if args.sheet is not None else 0
    try:
        # inspect nearby rows for month names
        possible_month_row = None
        raw_preview = pd.read_excel(input_path, header=None, nrows=max(0, header_row+1)+1, sheet_name=sheet_to_read, engine='openpyxl')
        for r in range(max(0, header_row-6), header_row):
            rowvals = raw_preview.iloc[r].astype(str).str.upper().fillna('')
            if any(m in ' '.join(rowvals.values) for m in MONTHS_PT):
                possible_month_row = r
                break

        if possible_month_row is not None and possible_month_row != header_row:
            # read with two header rows (month row + prev/real row)
            df = pd.read_excel(input_path, header=[possible_month_row, header_row], sheet_name=sheet_to_read, engine='openpyxl')
        else:
            df = pd.read_excel(input_path, header=header_row, sheet_name=sheet_to_read, engine='openpyxl')
    except Exception as e:
        print('Erro ao ler Excel:', e)
        return 1

    # Flatten MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [flatten_col(c).upper() for c in df.columns]
    else:
        df.columns = [str(c).upper() for c in df.columns]

    # Normalize column names
    colmap = {c: c.strip() for c in df.columns}
    df.rename(columns=colmap, inplace=True)

    # Find reference column
    ref_col = None
    for candidate in ['REFERENCIA','REFERÊNCIA','REFERENCI','REFERENCIA ']:
        if candidate in df.columns:
            ref_col = candidate
            break
    if not ref_col:
        # try common first column
        ref_col = df.columns[0]

    # identify month columns: look for any column with PREVISTO or REALIZADO in name
    month_cols = []  # list of (month_name, prev_col, real_col)
    cols = list(df.columns)
    for i, c in enumerate(cols):
        cname = str(c).upper()
        for m in MONTHS_PT:
            if m in cname:
                # try to find PREVISTO and REALIZADO nearby
                prev_col = None
                real_col = None
                # look at next 4 columns
                for j in range(i, min(i+6, len(cols))):
                    nc = str(cols[j]).upper()
                    if 'PREV' in nc:
                        prev_col = cols[j]
                    if 'REALIZ' in nc or 'REALIZADO' in nc:
                        real_col = cols[j]
                # fallback: if current column itself has PREV/REAL
                if prev_col is None and 'PREV' in cname:
                    prev_col = c
                if real_col is None and 'REALIZ' in cname:
                    real_col = c
                month_cols.append((m, prev_col, real_col))
                break

    # Deduplicate month_cols by month
    uniq = {}
    for m, p, r in month_cols:
        if m not in uniq:
            uniq[m] = (p, r)
        else:
            # fill missing
            pp, rr = uniq[m]
            uniq[m] = (pp or p, rr or r)

    rows = []
    for idx, row in df.iterrows():
        descricao = str(row.get(ref_col,'')).strip()
        if descricao == '' or descricao.upper().startswith('TOTAL'):
            continue
        # try to infer type_linha from surrounding column if exists
        tipo_linha = None
        for c in df.columns:
            if 'DESPESA' in str(c).upper() or 'RECEITA' in str(c).upper():
                tipo_linha = 'RECEITA' if 'RECEITA' in str(c).upper() else 'DESPESA'
                break
        for m, (prev_col, real_col) in uniq.items():
            ano_mes = f"{year}-{MONTHS_PT.index(m)+1:02d}" if year else f"{MONTHS_PT.index(m)+1:02d}"
            previsto = row.get(prev_col) if prev_col in df.columns else None
            realizado = row.get(real_col) if real_col in df.columns else None
            # normalize numeric
            try:
                previsto = float(previsto) if pd.notna(previsto) else None
            except Exception:
                previsto = None
            try:
                realizado = float(realizado) if pd.notna(realizado) else None
            except Exception:
                realizado = None

            if previsto is None and realizado is None:
                continue

            rows.append({
                'descricao': descricao,
                'tipo_linha': tipo_linha or '',
                'contad_ocai': '',
                'ano_mes': ano_mes,
                'previsto': previsto,
                'realizado': realizado
            })

    if not rows:
        print('Nenhum dado convertido — verifique o formato da planilha e o header detectado:', header_row)
        return 2

    out_df = pd.DataFrame(rows)
    out_df.to_csv(output_path, index=False, encoding='utf-8')
    print('CSV long gerado em', output_path)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
