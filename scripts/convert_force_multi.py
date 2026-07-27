import pandas as pd
from pathlib import Path
import sys

MONTHS_PT = ['JANEIRO','FEVEREIRO','MARÇO','MARCO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO']

def flatten_col(col):
    if isinstance(col, tuple):
        return ' '.join([str(x).strip() for x in col if x is not None and str(x).strip() and not str(x).startswith('Unnamed')])
    return str(col)

def detect_year(xlsx, sheet=None):
    import re
    import pandas as pd
    preview = pd.read_excel(xlsx, header=None, nrows=10, sheet_name=sheet if sheet else 0, engine='openpyxl')
    text = ' '.join(preview.fillna('').astype(str).values.flatten()).upper()
    m = re.search(r'\b(20\d{2})\b', text)
    return m.group(1) if m else ''


def main(xlsx, sheet, out):
    year = detect_year(xlsx, sheet)
    df = pd.read_excel(xlsx, header=[3,5], sheet_name=sheet, engine='openpyxl')
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [flatten_col(c).upper() for c in df.columns]
    else:
        df.columns = [str(c).upper() for c in df.columns]

    # detect reference column
    ref_col = None
    for candidate in ['REFERENCIA','REFERÊNCIA','REFERENCI']:
        if candidate in df.columns:
            ref_col = candidate
            break
    if not ref_col:
        ref_col = df.columns[0]

    # build month mapping by scanning columns
    cols = list(df.columns)
    uniq = {}
    for i, c in enumerate(cols):
        cname = str(c)
        for idx, m in enumerate(MONTHS_PT):
            if m in cname:
                # next columns often 'PREVISTO' and 'REALIZADO'
                prev = None
                real = None
                if i+1 < len(cols) and 'PREV' in str(cols[i+1]).upper():
                    prev = cols[i+1]
                if i+2 < len(cols) and 'REALIZ' in str(cols[i+2]).upper():
                    real = cols[i+2]
                # fallback search nearby
                for j in range(i, min(i+6, len(cols))):
                    nc = str(cols[j]).upper()
                    if 'PREV' in nc and prev is None:
                        prev = cols[j]
                    if 'REALIZ' in nc and real is None:
                        real = cols[j]
                uniq[m] = (prev, real)
                break

    rows = []
    for idx, row in df.iterrows():
        descricao = str(row.get(ref_col,'')).strip()
        if descricao == '' or descricao.upper().startswith('TOTAL'):
            continue
        for m, (prev_col, real_col) in uniq.items():
            previsto = row.get(prev_col) if prev_col in df.columns else None
            realizado = row.get(real_col) if real_col in df.columns else None
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
            ano = year if year else ''
            ano_mes = f"{ano}-{MONTHS_PT.index(m)+1:02d}" if ano else f"{MONTHS_PT.index(m)+1:02d}"
            rows.append({'descricao': descricao, 'tipo_linha': '', 'contad_ocai': '', 'ano_mes': ano_mes, 'previsto': previsto, 'realizado': realizado})

    if not rows:
        print('No rows produced')
        return 2
    out_df = pd.DataFrame(rows)
    out_df.to_csv(out, index=False, encoding='utf-8')
    print('Wrote', out)
    return 0

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print('Usage: convert_force_multi.py xlsx sheet outcsv')
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2], sys.argv[3]))
