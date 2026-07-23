# Script de Validação dos Dados
$ErrorActionPreference = "Stop"

function Test-TableData {
	param (
		[string]$table,
		[string]$query = "SELECT COUNT(*) FROM $table"
	)
    
	try {
		$count = mysql -N -e "$query" spdealer
		Write-Host "Tabela $table: $count registros" -ForegroundColor Green
		return $true
	}
	catch {
		Write-Host "ERRO ao verificar tabela $table" -ForegroundColor Red
		Write-Host $_.Exception.Message
		return $false
	}
}

function Test-Procedures {
	try {
		$procedures = mysql -N -e "SHOW PROCEDURE STATUS WHERE Db = 'spdealer'" spdealer
		Write-Host "Procedures encontradas:" -ForegroundColor Green
		Write-Host $procedures
		return $true
	}
	catch {
		Write-Host "ERRO ao verificar procedures" -ForegroundColor Red
		Write-Host $_.Exception.Message
		return $false
	}
}

function Test-ScoreCalculation {
	try {
		mysql -e "CALL calcular_score_clientes()" spdealer
		$scoreCount = mysql -N -e "SELECT COUNT(*) FROM cliente_score" spdealer
		Write-Host "Score calculado para $scoreCount clientes" -ForegroundColor Green
		return $true
	}
	catch {
		Write-Host "ERRO ao calcular score de clientes" -ForegroundColor Red
		Write-Host $_.Exception.Message
		return $false
	}
}

# Executar validações
Write-Host "=== Iniciando validação dos dados ===" -ForegroundColor Cyan

$allChecksOk = $true

Write-Host "`n1. Verificando tabelas principais..." -ForegroundColor Yellow
$tables = @("usuarios", "menus", "usuarios_permissoes", "dashboard_config", "cliente_score")
foreach ($table in $tables) {
	if (-not (Test-TableData $table)) { $allChecksOk = $false }
}