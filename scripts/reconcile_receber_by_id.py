#!/usr/bin/env python3
import json
import csv
from pathlib import Path

TSV = Path('docs/screenshots/receber_20251201_20251217_corrected_utf8.tsv')
JSON = Path('docs/screenshots/fluxo_api_20251217.json')
OUT = Path('docs/screenshots/reconcile_receber_by_id.txt')

def read_tsv_ids(path):
    if not path.exists():
        return set()
    with path.open(encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        rows = list(reader)
    if len(rows) < 2:
        return set()
    header = rows[0]
    # handle BOM in header
    header = [h.lstrip('\ufeff') for h in header]
    try:
        idx = header.index('receber_id')
    except ValueError:
        return set()
    ids = {r[idx].strip() for r in rows[1:] if r and r[idx].strip()}
    return ids

def read_json_ids(path):
    if not path.exists():
        return set()
    d = json.loads(path.read_text(encoding='utf-8'))
    rec = d.get('receber', []) if isinstance(d, dict) else []
    ids = {str(item.get('receber_id')) for item in rec if 'receber_id' in item}
    return ids

if __name__ == '__main__':
    t_ids = read_tsv_ids(TSV)
    j_ids = read_json_ids(JSON)
    only_in_tsv = sorted(t_ids - j_ids)
    only_in_json = sorted(j_ids - t_ids)
    OUT.write_text('\n'.join([
        f'TSV ids count: {len(t_ids)}',
        f'JSON ids count: {len(j_ids)}',
        '--- Only in TSV ---',
        *only_in_tsv,
        '--- Only in JSON ---',
        *only_in_json
    ]), encoding='utf-8')
    print('Wrote', OUT)
