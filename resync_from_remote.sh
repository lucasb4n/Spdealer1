#!/usr/bin/env bash
set -euo pipefail

# resync_from_remote.sh
# Uso: execute na raiz do clone do repositório (Linux / macOS)
# Este script NÃO faz push nem cria backups — é para a primeira vez que o dev sincroniza.

repo_dir="$(pwd)"
echo "=== RESYNC FROM REMOTE (NO PUSH, NO BACKUP) ==="
echo "Repositório: ${repo_dir}"

echo "\n--- git status (resumo) ---"
git status --porcelain || true

read -r -p "ATENÇÃO: este comando irá sobrescrever o working tree local com origin/main. Continuar? [y/N] " answer
if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
  echo "Operação cancelada pelo usuário. Nenhuma alteração feita."
  exit 1
fi

echo "\nBuscando dados do remoto..."
git fetch --all --tags

# Garantir branch main local e trocar para ela
if git show-ref --verify --quiet refs/heads/main; then
  echo "Checkout para branch local 'main'..."
  git switch main 2>/dev/null || git checkout main
else
  echo "Criando branch 'main' a partir de origin/main..."
  git switch -c main origin/main 2>/dev/null || git checkout -b main origin/main
fi

echo "Resetando working tree para origin/main (hard)..."
git reset --hard origin/main

git fetch --prune

# Configurar core.excludesfile local apontando para git_excludes.txt do repo, se existir
if [[ -f "${repo_dir}/git_excludes.txt" ]]; then
  exfile="$(realpath "${repo_dir}/git_excludes.txt")"
  git config core.excludesfile "$exfile"
  echo "core.excludesfile configurado para: $exfile"
else
  echo "Arquivo git_excludes.txt não encontrado no repositório; pulando configuração de excludes."
fi

echo "\n--- Resultado final (git status) ---"
git status --porcelain || true

echo "\nRESYNC concluído. Nenhum push foi executado."

exit 0
