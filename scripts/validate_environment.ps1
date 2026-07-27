# Validação do Ambiente de Produção
$ErrorActionPreference = "Stop"

# Funções de validação
function Test-JavaVersion {
	try {
		$javaVersion = java -version 2>&1
		Write-Host "Java instalado:" -ForegroundColor Green
		Write-Host $javaVersion
		return $true
	}
	catch {
		Write-Host "ERRO: Java não encontrado" -ForegroundColor Red
		return $false
	}
}

function Test-MariaDB {
	try {
		$mysqlVersion = mysql --version
		Write-Host "MariaDB instalado:" -ForegroundColor Green
		Write-Host $mysqlVersion
		return $true
	}
	catch {
		Write-Host "ERRO: MariaDB não encontrado" -ForegroundColor Red
		return $false
	}
}

function Test-DatabaseConnection {
	param (
		[string]$database = "spdealer"
	)
    
	try {
		$result = mysql -e "SELECT VERSION();" $database
		Write-Host "Conexão com banco de dados ok" -ForegroundColor Green
		return $true
	}
	catch {
		Write-Host "ERRO: Não foi possível conectar ao banco de dados" -ForegroundColor Red
		return $false
	}
}

function Test-BackupPath {
	param (
		[string]$path = "/backup/spdealer"
	)
    
	if (Test-Path $path) {
		Write-Host "Diretório de backup existe:" -ForegroundColor Green
		Write-Host $path
		return $true
	}
	else {
		Write-Host "ERRO: Diretório de backup não encontrado:" -ForegroundColor Red
		Write-Host $path
		return $false
	}
}