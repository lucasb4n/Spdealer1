#!/usr/bin/env python3
import json, csv
from pathlib import Path
p_tsv = Path('docs/screenshots/receber_20251201_20251217_corrected_utf8.tsv')
p_json = Path('docs/screenshots/fluxo_api_20251217.json')

def print_tsv(n=10):
    if not p_tsv.exists():
        print('TSV missing')
        return
    with p_tsv.open(encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        rows = list(reader)
    if not rows:
        print('TSV empty')
        return
    header = rows[0]
    print('TSV header:', header)
    for r in rows[1:1+n]:
        print(dict(zip(header, r)))

def print_json():
    if not p_json.exists():
        print('JSON missing')
        return
    d = json.loads(p_json.read_text(encoding='utf-8'))
    receber = d.get('receber')
    print('\nJSON receber (count=', len(receber) if isinstance(receber,list) else 'none',')')
    if isinstance(receber, list):
        for item in receber:
            print(item)

if __name__ == '__main__':
    print_tsv(10)
    print_json()
