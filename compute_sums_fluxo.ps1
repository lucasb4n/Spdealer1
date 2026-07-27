$lines = Get-Content .\temp_fluxo_detalhes_20251215.tsv
$map = @{}
foreach ($line in $lines) {
  if ($line.Trim() -eq '') { continue }
  $cols = $line -split "`t"
  $orig = $cols[0]
  $valStr = $cols[4]
  if (-not $valStr) { $val = 0 } else { $val = [decimal]($valStr) }
  if (-not $map.ContainsKey($orig)) { $map[$orig] = 0 }
  $map[$orig] += $val
}
foreach ($k in $map.Keys) { Write-Output ("$k`t$([math]::round($map[$k],2))") }
