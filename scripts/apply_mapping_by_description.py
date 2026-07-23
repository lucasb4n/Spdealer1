#!/usr/bin/env python3
"""Aplicar mapping por `descricao` presente na planilha DRE.

Uso:
  py -3 scripts/apply_mapping_by_description.py --input database/PLANILHA_LONG_FORCE2.csv \
      --mapping scripts/mapping_descr_dre_scopla.csv \
      --output database/PLANILHA_LONG_MAPPED.csv \
      --report reports/mapping_descr_report.txt

O mapping CSV deve ter colunas: `descricao` e `contad_ocai`.
Match é feito em lowercase e com strip, correspondência exata.
Gera relatório com descrições não mapeadas e salva o CSV com coluna `contad_ocai` preenchida.
"""

import argparse
import os
import sys
import pandas as pd


def load_mapping(path):
    df = pd.read_csv(path, dtype=str).fillna("")
    mapping = {}
    for _, row in df.iterrows():
        desc = (row.get('descricao') or '').strip()
        if not desc:
            continue
        key = desc.lower()
        mapping[key] = (row.get('contad_ocai') or '').strip()
    return mapping


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--input', required=True)
    p.add_argument('--mapping', required=True)
    p.add_argument('--output', required=True)
    p.add_argument('--report', required=True)
    args = p.parse_args()

    if not os.path.exists(args.input):
        print(f"Arquivo de entrada nao encontrado: {args.input}")
        sys.exit(2)
    if not os.path.exists(args.mapping):
        print(f"Arquivo de mapping nao encontrado: {args.mapping}")
        sys.exit(2)

    df = pd.read_csv(args.input, dtype=str).fillna("")
    if 'descricao' not in df.columns:
        print("Arquivo de entrada nao contem coluna 'descricao'. Abortar.")
        print("Colunas disponiveis:")
        for c in df.columns:
            print(f" - {c}")
        sys.exit(3)

    mapping = load_mapping(args.mapping)

    if 'contad_ocai' not in df.columns:
        df['contad_ocai'] = ""

    filled = 0
    unmapped = set()
    for idx, row in df.iterrows():
        desc = str(row.get('descricao','')).strip()
        if not desc:
            continue
        key = desc.lower()
        contad = mapping.get(key, '')
        if contad:
            if not str(row.get('contad_ocai','')).strip():
                df.at[idx, 'contad_ocai'] = contad
                filled += 1
        else:
            unmapped.add(desc)

    out_dir = os.path.dirname(args.output)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir)
    df.to_csv(args.output, index=False)

    rep_dir = os.path.dirname(args.report)
    if rep_dir and not os.path.exists(rep_dir):
        os.makedirs(rep_dir)
    with open(args.report, 'w', encoding='utf-8') as f:
        f.write(f"INPUT: {args.input}\n")
        f.write(f"MAPPING: {args.mapping}\n")
        f.write(f"OUTPUT: {args.output}\n\n")
        f.write(f"Total linhas: {len(df)}\n")
        f.write(f"Total valores preenchidos: {filled}\n")
        f.write(f"Descricoes unicas sem mapping: {len(unmapped)}\n\n")

        if unmapped:
            f.write("Descricoes nao mapeadas (amostra 200):\n")
            for i, v in enumerate(sorted(unmapped)):
                if i >= 200:
                    f.write("...\n")
                    break
                f.write(f" - {v}\n")
    print(f"OK: escrito {args.output} e relatorio {args.report}")


if __name__ == '__main__':
    main()
