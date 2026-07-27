#!/usr/bin/env python3
import csv
import unicodedata
from collections import defaultdict

def norm(s):
    if s is None:
        return ''
    s = s.lower().strip()
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
    return s

def load_dre_mapped(path):
    mappings = []
    with open(path, newline='', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for r in reader:
            mappings.append(r)
    return mappings

def build_map(mappings):
    by_pla_nome = {}
    by_descr = {}
    for r in mappings:
        cont = r.get('contad_ocai','').strip()
        pla_nome = r.get('pla_nome','').strip()
        descr = r.get('descr_ocai','').strip()
        if cont:
            if pla_nome:
                by_pla_nome[norm(pla_nome)] = cont
            if descr:
                by_descr[norm(descr)] = cont
    return by_pla_nome, by_descr

def words(s):
    return [w for w in s.split() if len(w) > 2]

def score_match(src, target):
    # src, target normalized
    if not src or not target:
        return 0.0
    if src == target:
        return 1.0
    if src.startswith(target) or target.startswith(src):
        return 0.9
    sset = set(words(src))
    tset = set(words(target))
    if not sset or not tset:
        return 0.0
    inter = sset & tset
    frac = len(inter) / max(len(tset), 1)
    if frac >= 0.6:
        return 0.8
    if frac >= 0.4:
        return 0.65
    return 0.0

def main():
    dre_path = 'reports/dre_mapped.tsv'
    planilha_in = 'database/PLANILHA_LONG_MAPPED.csv'
    planilha_out = 'database/PLANILHA_LONG_AUTO_MAPPED.csv'
    suggestions_out = 'reports/mapping_suggestions.csv'
    mapping_auto = 'scripts/mapping_descr_dre_scopla_auto.csv'

    dre = load_dre_mapped(dre_path)
    by_pla_nome, by_descr = build_map(dre)

    applied = []
    suggestions = []

    with open(planilha_in, newline='', encoding='utf-8', errors='replace') as fin, \
         open(planilha_out, 'w', newline='', encoding='utf-8') as fout:
        reader = csv.DictReader(fin)
        fieldnames = reader.fieldnames
        writer = csv.DictWriter(fout, fieldnames=fieldnames)
        writer.writeheader()
        for r in reader:
            desc = r.get('descricao','').strip()
            cont = r.get('contad_ocai','').strip()
            if cont:
                writer.writerow(r)
                continue
            ndesc = norm(desc)
            best = ('', '', 0.0, '')
            # exact match to pla_nome
            s = by_pla_nome.get(ndesc)
            if s:
                best = (s, 'pla_nome', 1.0, desc)
            # exact match to mascai descr
            if best[2] < 1.0:
                s2 = by_descr.get(ndesc)
                if s2:
                    best = (s2, 'mascai_descr', 1.0, desc)
            # fuzzy match against pla_nome keys
            if best[2] < 1.0:
                for k,v in by_pla_nome.items():
                    sc = score_match(ndesc, k)
                    if sc > best[2]:
                        best = (v, 'pla_nome', sc, k)
            # fuzzy match against mascai descr
            if best[2] < 0.8:
                for k,v in by_descr.items():
                    sc = score_match(ndesc, k)
                    if sc > best[2]:
                        best = (v, 'mascai_descr', sc, k)

            if best[2] >= 0.8:
                # apply
                r['contad_ocai'] = best[0]
                writer.writerow(r)
                applied.append((desc, best[0], best[1], best[2], best[3]))
                suggestions.append({'descricao': desc, 'contad_ocai': best[0], 'source': best[1], 'confidence': best[2], 'matched': best[3]})
            else:
                writer.writerow(r)
                suggestions.append({'descricao': desc, 'contad_ocai': '', 'source': '', 'confidence': 0.0, 'matched': best[3]})

    # write suggestions csv
    with open(suggestions_out, 'w', newline='', encoding='utf-8') as sf:
        fn = ['descricao','contad_ocai','source','confidence','matched']
        w = csv.DictWriter(sf, fieldnames=fn)
        w.writeheader()
        for s in suggestions:
            w.writerow(s)

    # write mapping_auto file for applied entries
    with open(mapping_auto, 'w', newline='', encoding='utf-8') as ma:
        w = csv.writer(ma)
        w.writerow(['descricao','contad_ocai','source','confidence','matched'])
        for a in applied:
            w.writerow(a)

    print(f"Applied mappings: {len(applied)}; suggestions written to {suggestions_out}; updated CSV: {planilha_out}")

if __name__ == '__main__':
    main()
