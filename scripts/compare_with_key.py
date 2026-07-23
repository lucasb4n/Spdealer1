#!/usr/bin/env python3
import json
import csv
import sys
from pathlib import Path

if len(sys.argv) < 4:
    print("Usage: compare_with_key.py <tsv_path> <json_path> <key>")
    sys.exit(1)

TSV_PATH = Path(sys.argv[1])
JSON_PATH = Path(sys.argv[2])
KEY = sys.argv[3]
OUT_PATH = TSV_PATH.parent / (TSV_PATH.stem + f'.missing_{KEY}.txt')


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
    doc = row.get('documento_rec') or row.get('documento') or row.get('documento_pag') or ''
    cli = row.get('cliente_rec') or row.get('cliente') or row.get('fornecedor_pag') or ''
    val = row.get('vlrsal_rec') or row.get('vlrorig_rec') or row.get('vlrsal_pag') or row.get('vlrorig_pag') or ''
    return f"{doc}|{cli}|{val}"


def main():
    tsv = read_tsv(TSV_PATH)
    data_json = read_json(JSON_PATH)
    list_json = data_json.get(KEY, []) if isinstance(data_json, dict) else []

    t_keys = {key_for_row(r): r for r in tsv}
    j_keys = {key_for_row(r): r for r in list_json if isinstance(r, dict)}

    missing = [r for k, r in t_keys.items() if k not in j_keys]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open('w', encoding='utf-8') as out:
        out.write(f"TSV rows: {len(tsv)}\n")
        out.write(f"JSON {KEY} rows: {len(list_json)}\n")
        out.write("--- Missing in JSON (present in TSV) ---\n")
        for r in missing:
            out.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"Done. TSV rows={len(tsv)}; JSON {KEY} rows={len(list_json)}; missing={len(missing)}")
    print(f"Report: {OUT_PATH}")

if __name__ == '__main__':
    main()
