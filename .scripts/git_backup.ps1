$dt = (Get-Date).ToString('yyyyMMddHHmm')
$backup = "backup/visual-tests-$dt"
Write-Output "Creating backup branch: $backup"

# Create new backup branch from current HEAD
git checkout -b $backup

# Stage all changes and create a commit (allow empty to ensure a commit exists)
git add -A
git commit -m 'Backup completo testes visuais do projeto publicado OK!' --allow-empty

# Push branch to origin
git push -u origin $backup

# Create annotated tag and push
$tag = "backup-visual-tests-$dt"
git tag -a $tag -m 'Backup completo testes visuais do projeto publicado OK!'
git push origin $tag

Write-Output "Backup branch and tag pushed: $backup, $tag"