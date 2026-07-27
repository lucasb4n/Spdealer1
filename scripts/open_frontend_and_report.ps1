$urls = @('http://localhost:3000','http://localhost:5173','http://localhost:3001')
$found = $null
foreach ($u in $urls) {
    try {
        Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null
        Write-Host "OPENING:$u"
        Start-Process $u
        $found = $u
        break
    } catch {}
}
if (-not $found) { Write-Host "NO_FRONTEND_UP" }
