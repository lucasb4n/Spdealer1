#!/usr/bin/env python3
import json
from pathlib import Path
p = Path('docs/screenshots/fluxo_api_20251217.json')
if not p.exists():
    print('file missing')
    raise SystemExit(1)

data = json.loads(p.read_text(encoding='utf-8'))
print('top type:', type(data))
if isinstance(data, dict):
    for k,v in data.items():
        t = type(v)
        if isinstance(v, list):
            print(k, 'list len=', len(v))
        elif isinstance(v, dict):
            print(k, 'dict keys=', list(v.keys()))
        else:
            print(k, t)
else:
    print('list len=', len(data))
    if data and isinstance(data[0], dict):
        print('sample keys:', list(data[0].keys()))
