$paramPath = $args[0]
if ($paramPath) {
	$path = $paramPath
} else {
	# try to auto-locate common locations for the built bundle
	$candidates = @()
	try { $candidates = Get-ChildItem -Path .. -Recurse -Filter 'main.*.js' -File -ErrorAction SilentlyContinue } catch { }
	if ($candidates -and $candidates.Count -gt 0) {
		$path = $candidates[0].FullName
	} else {
		$path = Join-Path (Get-Location) 'main.9bc32235.js'
	}
}

if (-not (Test-Path $path)) { Write-Error "File not found: $path"; exit 1 }
$content = Get-Content -Raw $path -ErrorAction Stop
$found = New-Object System.Collections.Generic.List[string]

# simple checks
if ($content -match "/spdealer/api") { $found.Add("/spdealer/api") }
if ($content -match "/api/filiais") { $found.Add("/api/filiais") }

# find http(s) urls that include /api/

# Safer extraction without complex regex quoting issues
$patterns = @('/spdealer/api','/api/filiais','http://','https://','fetch("')
foreach ($pat in $patterns) {
	$start = 0
	while ($true) {
		$idx = $content.IndexOf($pat, $start, [System.StringComparison]::OrdinalIgnoreCase)
		if ($idx -lt 0) { break }
		if ($pat -eq 'fetch("') {
			# extract string inside fetch("...")
			$qstart = $idx + $pat.Length
			$qend = $content.IndexOf('"', $qstart)
			if ($qend -gt $qstart) {
				$val = $content.Substring($qstart, $qend - $qstart)
				$found.Add($val)
			}
			$start = $qend + 1
		} else {
			# extract up to next quote, space, comma or ) using manual scan
			$sub = $content.Substring($idx, [Math]::Min(240, $content.Length - $idx))
			$stopChars = @('"', "'", ' ', ',', ')', '(', '[', ']', '{', '}', '<', '>', ';', '|', "`t", "`n")
			$end = $sub.Length
			for ($i = 0; $i -lt $sub.Length; $i++) {
				if ($stopChars -contains $sub[$i]) { $end = $i; break }
			}
			$trim = $sub.Substring(0, $end)
			$found.Add($trim)
			$start = $idx + $pat.Length
		}
	}
}

$found = $found | Sort-Object -Unique
if ($found.Count -eq 0) { Write-Output "NO_MATCHES" } else { $found -join "`n" }
