Set-Location 'C:\Desenvolvimento\Seprocom\spdealer'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$br = "backup/consulta-caixa-$ts"
Write-Host "Branch: $br"

git fetch origin --prune
$status = git status --porcelain
if ($status -ne '') {
  Write-Host "Uncommitted changes detected. Committing..."
  git add -A
  git commit -m "backup: progresso consulta-caixa $ts" | Out-Null
} else {
  Write-Host "No local changes to commit"
}

try {
  git checkout -b $br
} catch {
  Write-Host "Branch already exists locally, checking out $br"
  git checkout $br
}

git push -u origin $br
Write-Host "Backup push complete: $br"
