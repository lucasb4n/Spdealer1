#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análise de colunas vs placeholders no ClienteController.java
Verifica quais colunas listadas no INSERT não têm placeholders correspondentes
"""

# Lista de colunas do INSERT
colunas = [
    'cliforn_cli', 'codigo_cli', 'nome_cli', 'nomefan_cli', 'cgccpf_cli', 'tipopessoa_cli',
    'logra_cli', 'numero_cli', 'bairro_cli', 'cidade_cli', 'uf_cli', 'cep_cli', 'latitude_cli', 'longitude_cli',
    'fone1_cli', 'celular_cli', 'fone2_cli', 'email_cli', 'regiao_cli', 'etiquetas_cli', 'atualizado_cli',
    'inscmun_cli', 'inscest_cli', 'limcre_cli', 'datcad_cli',
    'naocontr_cli', 'deslmarg_cli', 'contr_cli', 'optsimples_cli', 'clivenda_cli', 'cliusado_cli', 'cliofic_cli',
    'clipecas_cli', 'clivip_cli', 'clicont_cli', 'clirevenda_cli', 'naommi_cli', 'tare_cli',
    'vendedor_cli', 'W_nome_ven', 'agepec_cli', 'vendedor1_cli', 'W_nome1_ven', 'ageser_cli',
    'vendedor2_cli', 'w_nome2_ven', 'agemaq_cli', 'vendedor3_cli', 'w_nome3_ven', 'ageloc_cli',
    'codativ1_cli', 'codativ2_cli', 'codativ3_cli', 'codativ4_cli',
    'ident_cli', 'civil_cli', 'prof_cli', 'pai_cli', 'mae_cli', 'orgemis_cli', 'natural_cli', 'sexo_cli', 'datanasc_cli',
    'conjuge_cli', 'dtnasconj_cli', 'cpfconj_cli', 'ideconj_cli'
]

# Número real de placeholders no VALUES
placeholders_count = 65

print("=" * 80)
print("📊 RELATÓRIO DE ANÁLISE: COLUNAS vs PLACEHOLDERS")
print("=" * 80)
print()
print(f"✓ Total de COLUNAS listadas no INSERT:    {len(colunas)}")
print(f"✓ Total de PLACEHOLDERS (?) no VALUES:   {placeholders_count}")
print()
print(f"❌ DIFERENÇA (ERRO): {len(colunas) - placeholders_count} colunas sem placeholders!")
print()
print("-" * 80)
print("📌 COLUNAS LISTADAS (posição na lista):")
print("-" * 80)

for i, col in enumerate(colunas, 1):
    marker = "✓" if i <= placeholders_count else "❌"
    print(f"  {marker:3} [{i:2}/67]  {col}")

print()
print("-" * 80)
print(f"❌ COLUNAS SEM PLACEHOLDERS (linhas {placeholders_count+1} a {len(colunas)}):")
print("-" * 80)

for i in range(placeholders_count, len(colunas)):
    print(f"  ❌ [{i+1:2}/67]  {colunas[i]}")

print()
print("=" * 80)
print("💡 SOLUÇÃO: Adicionar 2 placeholders ao VALUES ou remover 2 colunas do INSERT")
print("=" * 80)
