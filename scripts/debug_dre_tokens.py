#!/usr/bin/env python3
import csv, re
f=open('reports/dre_mapped.tsv',encoding='utf-8',errors='replace')
reader=csv.DictReader(f,delimiter='\t')
print('fieldnames:', reader.fieldnames)
keys=set()
count=0
for r in reader:
    # try multiple possible keys for pla_nome due to encoding issues
    name = ''
    for k in ['pla_nome','pla_nome\ufeff',' pla_nome','pla_nome ']:
        if k in r and r[k]:
            name = r[k]
            break
    if not name:
        # fallback: try last column
        if reader.fieldnames:
            last = reader.fieldnames[-1]
            name = r.get(last,'')
    if not name:
        continue
    toks=[w for w in re.sub('[^0-9a-zA-Z\u00C0-\u017F]',' ',name).lower().strip().split() if len(w)>2]
    if toks:
        keys.update(toks)
    count+=1
    if count>200:
        break
print('sample tokens:', sorted(list(keys))[:60])
print('len tokens:', len(keys))
f.close()
