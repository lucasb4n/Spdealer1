Set-Location 'C:\Desenvolvimento\Seprocom\spdealer'
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Branch: $branch"

# Stage all changes (including untracked)
git add -A

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$msg = "backup: progresso consulta-caixa $ts"

# Try commit
$commitOutput = & git commit -m $msg 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "Commit succeeded"
  Write-Host $commitOutput
} else {
  Write-Host "Commit: no changes or commit failed"
  Write-Host $commitOutput
}

# Push current branch to origin
Write-Host "Pushing to origin/$branch ..."
$pushOutput = & git push origin $branch 2>&1
Write-Host $pushOutput
