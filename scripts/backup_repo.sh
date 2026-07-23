#!/usr/bin/env bash
ts=$(date +%Y%m%d-%H%M%S)
branch="backup/$ts"
tag="backup-$ts"

echo "Iniciando backup completo: $ts"

if [ ! -d .git ]; then
  echo "Erro: este diretório não parece ser um repositório git."
  exit 1
fi

changes=$(git status --porcelain)
if [ -n "$changes" ]; then
  echo "Há mudanças não comitadas — criando commit automático."
  git add -A
  git commit -m "backup: auto-commit $ts"
else
  echo "Sem mudanças não comitadas."
fi

echo "Criando branch $branch"
git checkout -b "$branch"

echo "Criando tag $tag"
git tag -a "$tag" -m "Full backup $ts"

mkdir -p backups
zipfile="backups/spdealer-backup-$ts.zip"

if [ "$1" = "--exclude-node" ]; then
  echo "Gerando arquivo ZIP excluindo node_modules..."
  zip -r "$zipfile" . -x "node_modules/*"
else
  echo "Gerando arquivo ZIP com todo o repositório (inclui .git)."
  zip -r "$zipfile" .
fi

echo "Backup criado: $zipfile"
echo "Branch local: $branch"; echo "Tag local: $tag"
echo "Para enviar para o remoto: git push origin $branch && git push origin $tag"
