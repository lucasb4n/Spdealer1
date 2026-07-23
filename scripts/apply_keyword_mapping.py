#!/usr/bin/env python3
import csv
import unicodedata
from collections import Counter, defaultdict

def norm(s):
    if s is None:
        return ''
    s = s.lower().strip()
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
    return s

def tokens(s):
    return [w for w in ''.join(c if c.isalnum() else ' ' for c in s).split() if len(w) > 2]

def build_keyword_index(dre_path):
    index = defaultdict(Counter)
    with open(dre_path, newline='', encoding='utf-8', errors='replace') as f:
        import csv
        r = csv.DictReader(f, delimiter='\t')
        for row in r:
            cont = row.get('contad_ocai','').strip()
            name = row.get('pla_nome','').strip()
            if not cont or not name:
                continue
            for t in tokens(name):
                index[t][cont] += 1
    return index

def main():
    dre_path='reports/dre_mapped.tsv'
    plan_in='database/PLANILHA_LONG_MAPPED.csv'
    plan_out='database/PLANILHA_LONG_AUTO_MAPPED_KEYWORD.csv'
    sug_out='reports/mapping_suggestions_keyword.csv'

    index = build_keyword_index(dre_path)

    applied = []
    suggestions = []

    with open(plan_in, newline='', encoding='utf-8', errors='replace') as fin, \
         open(plan_out, 'w', newline='', encoding='utf-8') as fout:
        reader = csv.DictReader(fin)
        writer = csv.DictWriter(fout, fieldnames=reader.fieldnames)
        writer.writeheader()
        for r in reader:
            desc = r.get('descricao','').strip()
            cont = r.get('contad_ocai','').strip()
            if cont:
                writer.writerow(r); continue
            tks = tokens(desc)
            counter = Counter()
            for t in tks:
                if t in index:
                    counter.update(index[t])
            if counter:
                # choose most common cont
                cont_sug, cnt = counter.most_common(1)[0]
                r['contad_ocai'] = cont_sug
                writer.writerow(r)
                applied.append((desc, cont_sug, cnt))
                suggestions.append({'descricao':desc,'contad_ocai':cont_sug,'score':cnt})
            else:
                writer.writerow(r)
                suggestions.append({'descricao':desc,'contad_ocai':'','score':0})

    with open(sug_out,'w',newline='',encoding='utf-8') as sf:
        fn=['descricao','contad_ocai','score']
        w=csv.DictWriter(sf,fieldnames=fn)
        w.writeheader()
        for s in suggestions:
            w.writerow(s)

    print(f"Keyword applied: {len(applied)} -> {plan_out}; suggestions: {sug_out}")

if __name__=='__main__':
    main()
