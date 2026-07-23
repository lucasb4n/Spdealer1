#!/usr/bin/env python3
import json
import csv
from pathlib import Path

TSV_PATH = Path("docs/screenshots/receber_20251217.tsv")
JSON_PATH = Path("docs/screenshots/fluxo_api_20251217.json")
OUT_PATH = Path("docs/screenshots/missing_in_fluxo_20251217.txt")

def read_tsv(path):
    if not path.exists():
        return []
    with path.open(encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        rows = list(reader)
    if not rows:
        return []
    header = rows[0]
    data = [dict(zip(header, r)) for r in rows[1:]]
    return data

def read_json(path):
    if not path.exists():
        return {}
    with path.open(encoding='utf-8') as f:
        return json.load(f)

def key_for_row(row):
    # Try to build a matching key from common columns
    # Prefer documento_rec + cliente_rec + vlrsal_rec
    doc = row.get('documento_rec') or row.get('documento') or ''
    cli = row.get('cliente_rec') or row.get('cliente') or ''
    val = row.get('vlrsal_rec') or row.get('vlrorig_rec') or row.get('valor') or ''
    return f"{doc}|{cli}|{val}"

def main():
    tsv = read_tsv(TSV_PATH)
    data_json = read_json(JSON_PATH)

    # Extract receber list from JSON if structured
    receber_json = []
    if isinstance(data_json, dict):
        # common keys: 'receber', 'detalhes', 'items' etc.
        for k in ('receber', 'recebimentos', 'entries', 'items', 'detalhes'):
            if k in data_json and isinstance(data_json[k], list):
                receber_json = data_json[k]
                break
        # fallback: if top-level list
        if not receber_json:
            for v in data_json.values():
                if isinstance(v, list) and v and isinstance(v[0], dict):
                    receber_json = v
                    break
    elif isinstance(data_json, list):
        receber_json = data_json

    t_keys = {key_for_row(r): r for r in tsv}
    j_keys = {key_for_row(r): r for r in receber_json}

    missing = []
    for k, r in t_keys.items():
        if k not in j_keys:
            missing.append(r)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open('w', encoding='utf-8') as out:
        out.write(f"TSV rows: {len(tsv)}\n")
        out.write(f"JSON receber rows: {len(receber_json)}\n")
        out.write("--- Missing in fluxo API (present in receber TSV) ---\n")
        for r in missing:
            out.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"Done. TSV rows={len(tsv)}; JSON receber rows={len(receber_json)}; missing={len(missing)}")
    print(f"Report: {OUT_PATH}")

if __name__ == '__main__':
    main()
