#!/usr/bin/env python3
"""Aplicar mapping mascai->scopla (contad_ocai) em CSV long.

Uso:
  python scripts/apply_mapping.py --input database/PLANILHA_LONG_FORCE2.csv \
      --mapping scripts/mapping_mascai_scopla.csv \
      --output database/PLANILHA_LONG_MAPPED.csv \
      --report reports/mapping_report.txt

O script tenta localizar automaticamente a coluna que contém o código mascai
procurando por nomes comuns (mascai, mascai_code, codigo_mascai, operacao).
Se não encontrar, aborta mostrando as colunas disponíveis.

Ele preenche/atualiza a coluna `contad_ocai` usando o valor presente em
`mapping_mascai_scopla.csv` (coluna `contad_ocai`). Se `contad_ocai` estiver
vazia no mapping, a linha é considerada não mapeada.

Gera um relatório com contagens e lista de mascai não mapeados.
"""

import argparse
import os
import sys
import pandas as pd


def load_mapping(path):
    df = pd.read_csv(path, dtype=str).fillna("")
    # Normalize keys as strings without spaces
    mapping = {}
    for _, row in df.iterrows():
        key = row.get('mascai_code') or row.get('mascai') or row.get('codigo')
        if pd.isna(key) or str(key).strip() == "":
            continue
        key = str(key).strip()
        contad = row.get('contad_ocai', '') or row.get('scopla_code', '')
        contad = str(contad).strip()
        mapping[key] = contad
    return mapping


def detect_mascai_column(df):
    candidates = ['mascai', 'mascai_code', 'codigo_mascai', 'operacao', 'operacao_code', 'cod_mascai', 'codigo']
    cols = [c.lower() for c in df.columns]
    for cand in candidates:
        if cand in cols:
            # return original column name casing
            return df.columns[cols.index(cand)]
    return None


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

    df = pd.read_csv(args.input, dtype=str)
    df = df.fillna("")

    mascai_col = detect_mascai_column(df)
    if mascai_col is None:
        print("Nao foi possivel detectar coluna de mascai. Colunas disponiveis:")
        for c in df.columns:
            print(f" - {c}")
        print("Por favor, ajuste o arquivo CSV de entrada ou o mapping para incluir a coluna 'mascai' ou 'mascai_code'.")
        sys.exit(3)

    mapping = load_mapping(args.mapping)

    # Prepare contad_ocai column
    if 'contad_ocai' not in df.columns:
        df['contad_ocai'] = ""

    # Apply mapping
    filled = 0
    unmapped_values = set()
    mascai_values_in_file = set()
    for idx, row in df.iterrows():
        mascai_val = str(row.get(mascai_col, '')).strip()
        if mascai_val == "":
            continue
        mascai_values_in_file.add(mascai_val)
        contad = mapping.get(mascai_val, "")
        if contad:
            if not str(row.get('contad_ocai', '')).strip():
                df.at[idx, 'contad_ocai'] = contad
                filled += 1
        else:
            unmapped_values.add(mascai_val)

    # Save output
    out_dir = os.path.dirname(args.output)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir)
    df.to_csv(args.output, index=False)

    # Report
    rep_dir = os.path.dirname(args.report)
    if rep_dir and not os.path.exists(rep_dir):
        os.makedirs(rep_dir)
    with open(args.report, 'w', encoding='utf-8') as f:
        f.write(f"INPUT: {args.input}\n")
        f.write(f"MAPPING: {args.mapping}\n")
        f.write(f"OUTPUT: {args.output}\n")
        f.write('\n')
        f.write(f"Total linhas input: {len(df)}\n")
        f.write(f"Total mascai distintos no arquivo: {len(mascai_values_in_file)}\n")
        f.write(f"Total valores preenchidos em contad_ocai: {filled}\n")
        f.write(f"Total mascai sem mapping: {len(unmapped_values)}\n")
        f.write('\n')
        if unmapped_values:
            f.write("Mascai nao mapeados (amostra até 200):\n")
            for i, v in enumerate(sorted(unmapped_values)):
                if i >= 200:
                    f.write("... (sinalizado mais de 200)\n")
                    break
                f.write(f" - {v}\n")
            f.write('\n')
            # add sample rows
            f.write("Exemplos de linhas nao mapeadas (primeiras 20):\n")
            sample = df[df[mascai_col].isin(unmapped_values)].head(20)
            f.write(sample.to_csv(index=False))
        else:
            f.write("Todos os mascai encontrados foram mapeados.\n")

    print(f"OK: escrito {args.output} e relatorio {args.report}")


if __name__ == '__main__':
    main()
