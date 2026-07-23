#!/usr/bin/env python3
import csv
import unicodedata

def norm(s):
    if s is None:
        return ''
    s = s.lower().strip()
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
    return s

def words(s):
    return [w for w in ''.join(c if c.isalnum() else ' ' for c in s).split() if len(w) > 1]

def jaccard(a,b):
    sa=set(a); sb=set(b)
    if not sa and not sb:
        return 0.0
    inter = sa & sb
    uni = sa | sb
    return len(inter)/len(uni)

def load_dre(path):
    rows=[]
    with open(path, newline='', encoding='utf-8', errors='replace') as f:
        import csv
        r = csv.DictReader(f, delimiter='\t')
        for row in r:
            rows.append(row)
    return rows

def build_maps(rows):
    by_pla = {}
    by_descr = {}
    for r in rows:
        cont = r.get('contad_ocai','').strip()
        if not cont:
            continue
        pn = r.get('pla_nome','').strip()
        d = r.get('descr_ocai','').strip()
        if pn:
            by_pla[norm(pn)] = cont
        if d:
            by_descr[norm(d)] = cont
    return by_pla, by_descr

def main():
    dre_path='reports/dre_mapped.tsv'
    plan_in='database/PLANILHA_LONG_MAPPED.csv'
    plan_out='database/PLANILHA_LONG_AUTO_MAPPED_FORCED.csv'
    sug_out='reports/mapping_suggestions_forced.csv'
    threshold = 0.15

    dre = load_dre(dre_path)
    by_pla, by_descr = build_maps(dre)

    applied=[]
    suggestions=[]

    with open(plan_in, newline='', encoding='utf-8', errors='replace') as fin, \
         open(plan_out, 'w', newline='', encoding='utf-8') as fout:
        import csv
        reader = csv.DictReader(fin)
        writer = csv.DictWriter(fout, fieldnames=reader.fieldnames)
        writer.writeheader()
        for r in reader:
            desc = r.get('descricao','').strip()
            cont = r.get('contad_ocai','').strip()
            if cont:
                writer.writerow(r); continue
            ndesc = norm(desc)
            best_cont=''
            best_score=0.0
            best_k=''
            # check pla_nome keys
            for k,v in by_pla.items():
                sc = jaccard(words(ndesc), words(k))
                if sc > best_score:
                    best_score = sc; best_cont=v; best_k=k
            # check mascai descr
            for k,v in by_descr.items():
                sc = jaccard(words(ndesc), words(k))
                if sc > best_score:
                    best_score = sc; best_cont=v; best_k=k

            if best_score >= threshold and best_cont:
                r['contad_ocai'] = best_cont
                writer.writerow(r)
                applied.append((desc,best_cont,best_score,best_k))
                suggestions.append({'descricao':desc,'contad_ocai':best_cont,'confidence':best_score,'matched':best_k})
            else:
                writer.writerow(r)
                suggestions.append({'descricao':desc,'contad_ocai':'','confidence':best_score,'matched':best_k})

    with open(sug_out,'w',newline='',encoding='utf-8') as sf:
        import csv
        fn=['descricao','contad_ocai','confidence','matched']
        w=csv.DictWriter(sf,fieldnames=fn)
        w.writeheader()
        for s in suggestions:
            w.writerow(s)

    print(f"Forced applied: {len(applied)} -> {plan_out}; suggestions: {sug_out}")

if __name__=='__main__':
    main()
