param(
  [string]$Dest = 'H:\DISCO_D\Desenvolvimento\Seprocom\spdealer\src\formbuilder\flow'
)

$ErrorActionPreference = 'Stop'
$files = @(
  'FlowDiagram.js',
  'FlowBlockPalette.js',
  'FlowDetails.js',
  'FlowStepForm.js',
  'FlowStepList.js',
  'FlowConnectionEditor.js',
  'FlowConditionalConnectionEditor.js',
  'FlowSubflowEditor.js',
  'FlowParamEditor.js',
  'ExpressionDesigner.js'
)

foreach ($f in $files) {
  $p = Join-Path $Dest $f
  if (Test-Path -LiteralPath $p) {
    Remove-Item -LiteralPath $p -Force
  }
}

Write-Host 'FLOW_JS_REMOVED'