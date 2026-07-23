#!/usr/bin/env python3
import re
import sys

# Ler o arquivo
with open('src/pages/ParametrosGerais.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remover todos os masks usando regex
# Pattern: , mask: '...' (qualquer coisa entre as aspas)
pattern = r',\s*mask:\s*["\']([^"\']*)["\']'
replacement = ''

new_content = re.sub(pattern, replacement, content)

# Salvar o arquivo modificado
with open('src/pages/ParametrosGerais.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

# Contar quantas substituições foram feitas
count = len(re.findall(pattern, content))
print(f"✅ Removidas {count} máscaras do arquivo ParametrosGerais.tsx")
