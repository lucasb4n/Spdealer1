$before = "docs/screenshots/dashboard_queries_before_update.tsv"
$after  = "docs/screenshots/dashboard_queries_after_update.tsv"
$outDir = "docs/screenshots/queries_run"
if (-Not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function RunAndSave($id, $side, $sqlRaw) {
    $idSafe = $id -replace '[^0-9A-Za-z_-]', '_'
    $sql = $sqlRaw -replace '\\n', "`n"
    # substituir placeholders '?' por '001' (filial default)
    $sql = $sql -replace '\?', "'001'"
    # Corrigir substituicoes que geraram prefixos incorretos: r.COALESCE(...) ou p.COALESCE(...)
    $sql = $sql -replace 'r\.COALESCE\(dtfluxo_rec, dtvenci_rec\)', 'COALESCE(r.dtfluxo_rec, r.dtvenci_rec)'
    $sql = $sql -replace 'COALESCE\(r\.dtfluxo_rec, r\.dtvenci_rec\)', 'COALESCE(r.dtfluxo_rec, r.dtvenci_rec)'
    $sql = $sql -replace 'p\.COALESCE\(dtfluxo_pag, dtvenci_pag\)', 'COALESCE(p.dtfluxo_pag, p.dtvenci_pag)'
    $sql = $sql -replace 'COALESCE\(p\.dtfluxo_pag, p\.dtvenci_pag\)', 'COALESCE(p.dtfluxo_pag, p.dtvenci_pag)'
    $tmp = Join-Path $outDir "tmp_${side}_${idSafe}.sql"
    $out = Join-Path $outDir "result_${side}_${idSafe}.tsv"
    $sql | Out-File -FilePath $tmp -Encoding utf8
    Try {
        Get-Content $tmp -Raw | mysql --default-character-set=utf8 -h 100.126.166.63 -u root -pk15720 erp --batch --skip-column-names > $out
        Write-Host "OK: $side $id -> $out"
    } Catch {
        Write-Host "FAILED: $side $id -> $_"
    }
}

# Process file lines (tab separated: id <tab> name <tab> sql)
function ProcessFile($path, $side) {
    if (-Not (Test-Path $path)) { Write-Host "File not found: $path"; return }
    $lines = Get-Content $path -Encoding utf8
    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $parts = $line -split "`t", 3
        # Ensure at least 3 parts
        if ($parts.Count -lt 3) { continue }
        $id = $parts[0].Trim()
        $sqlRaw = $parts[2]
        RunAndSave $id $side $sqlRaw
    }
}

ProcessFile $before "before"
ProcessFile $after  "after"

# Generate diffs per id
$beforeResults = Get-ChildItem $outDir -Filter "result_before_*.tsv"
foreach ($b in $beforeResults) {
    $id = $b.BaseName -replace '^result_before_',''
    $afterFile = Join-Path $outDir "result_after_${id}.tsv"
    $diffOut = Join-Path $outDir "diff_${id}.txt"
    if (Test-Path $afterFile) {
        Compare-Object (Get-Content $b.FullName -Encoding utf8) (Get-Content $afterFile -Encoding utf8) | Out-File $diffOut
        Write-Host "Diff saved: $diffOut"
    } else {
        Write-Host "No after result for id $id"
    }
}

Write-Host "Done"
