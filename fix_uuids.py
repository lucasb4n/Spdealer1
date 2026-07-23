#!/usr/bin/env python3
"""
Script para gerar UUIDs válidos em arquivos JRXML
Substitui UUIDs inválidos por UUIDs válidos em formato UUID
"""

import re
import uuid
from pathlib import Path

# Arquivos a corrigir
jrxml_files = [
    "src/main/resources/reports/ContasReceberReport.jrxml",
    "src/main/resources/reports/ContasPagarReport.jrxml",
    "src/main/resources/reports/FluxoCaixaReport_v2.jrxml"
]

# Mapeamento de UUIDs - mantém consistência se o mesmo ID aparecer várias vezes
uuid_mapping = {}

def generate_uuid_for_id(invalid_id):
    """Gera UUID válido consistente para um ID inválido"""
    if invalid_id not in uuid_mapping:
        uuid_mapping[invalid_id] = str(uuid.uuid4())
    return uuid_mapping[invalid_id]

def fix_jrxml_file(filepath):
    """Corrige todos os UUIDs inválidos em um arquivo JRXML"""
    path = Path(filepath)
    
    if not path.exists():
        print(f"❌ Arquivo não encontrado: {filepath}")
        return False
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Regex para encontrar UUIDs inválidos
        # Válido: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        # Inválido: title-1, date-filter-1, header-cod, etc.
        invalid_uuid_pattern = r'uuid="(?![0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")[^"]*"'
        
        matches = re.finditer(invalid_uuid_pattern, content, re.IGNORECASE)
        
        replacements_count = 0
        for match in matches:
            invalid_uuid_str = match.group(0)  # uuid="title-1"
            invalid_id = match.group(0)[6:-1]  # extrai "title-1"
            
            valid_uuid = generate_uuid_for_id(invalid_id)
            new_uuid_str = f'uuid="{valid_uuid}"'
            
            content = content.replace(invalid_uuid_str, new_uuid_str, 1)
            replacements_count += 1
            print(f"  Substituindo: {invalid_uuid_str} → {new_uuid_str}")
        
        # Escrever arquivo corrigido
        if content != original_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ {path.name}: {replacements_count} UUIDs corrigidos")
            return True
        else:
            print(f"ℹ️  {path.name}: Nenhuma mudança necessária")
            return False
            
    except Exception as e:
        print(f"❌ Erro processando {filepath}: {e}")
        return False

def main():
    print("=" * 70)
    print("🔧 CORRIGINDO UUIDs INVÁLIDOS EM ARQUIVOS JRXML")
    print("=" * 70)
    
    base_path = Path.cwd()
    total_fixed = 0
    
    for jrxml_file in jrxml_files:
        full_path = base_path / jrxml_file
        print(f"\nProcessando: {jrxml_file}")
        if fix_jrxml_file(full_path):
            total_fixed += 1
    
    print("\n" + "=" * 70)
    print(f"📊 RESUMO: {total_fixed}/{len(jrxml_files)} arquivos foram corrigidos")
    print("=" * 70)
    
    # Exibir mapeamento de UUIDs
    if uuid_mapping:
        print("\n📋 MAPEAMENTO DE UUIDs GERADOS:")
        for invalid_id, valid_uuid in sorted(uuid_mapping.items()):
            print(f"  {invalid_id:30} → {valid_uuid}")

if __name__ == "__main__":
    main()
