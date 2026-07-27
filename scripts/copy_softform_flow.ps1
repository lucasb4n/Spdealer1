param(
    [string]$Src = 'H:\DISCO_D\Desenvolvimento\Seprocom\SoftForm\frontend\src\components',
    [string]$Dest = 'H:\DISCO_D\Desenvolvimento\Seprocom\spdealer\src\formbuilder\flow',
    [switch]$Cleanup
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Src)) {
    Write-Error "Source path not found: $Src"
    exit 2
}

if (-not (Test-Path -LiteralPath $Dest)) {
    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
}

$patterns = @(
    'ExpressionDesigner*',
    'FlowBlockPalette*',
    'FlowConditionalConnectionEditor*',
    'FlowConnectionEditor*',
    'FlowDetails*',
    'FlowDiagram*',
    'FlowParamEditor*',
    'FlowStepForm*',
    'FlowStepList*',
    'FlowSubflowEditor*'
)

$found = @()
foreach ($pat in $patterns) {
    $items = Get-ChildItem -Path (Join-Path $Src '*') -Recurse -Include $pat -File -ErrorAction SilentlyContinue
    if ($items) {
        $found += $items
        foreach ($it in $items) {
            Copy-Item -LiteralPath $it.FullName -Destination $Dest -Force
        }
    }
}

Write-Host 'COPIED_FLOW_FILES'
Write-Host ("FOUND=" + $found.Count)
Get-ChildItem -LiteralPath $Dest -File | Select-Object Name, Length | Format-Table -AutoSize

if ($Cleanup) {
    Write-Host 'CLEANUP_START'
    $allowedPrefixes = @(
        'ExpressionDesigner',
        'FlowBlockPalette',
        'FlowConditionalConnectionEditor',
        'FlowConnectionEditor',
        'FlowDetails',
        'FlowDiagram',
        'FlowParamEditor',
        'FlowStepForm',
        'FlowStepList',
        'FlowSubflowEditor',
        'FlowStudio',
        'README'
    )
    $files = Get-ChildItem -LiteralPath $Dest -File -ErrorAction SilentlyContinue
    foreach ($f in $files) {
        $name = $f.Name
        $isAllowed = $false
        foreach ($prefix in $allowedPrefixes) {
            if ($name.StartsWith($prefix)) { $isAllowed = $true; break }
        }
        if (-not $isAllowed) {
            Remove-Item -LiteralPath $f.FullName -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host 'CLEANUP_DONE'
    Get-ChildItem -LiteralPath $Dest -File | Select-Object Name, Length | Format-Table -AutoSize
}
