# ============================================================================
# BACKUP AUTOMÁTICO DO DATABASE DASHBOARD
# ============================================================================
# Script para fazer backup das tabelas críticas do dashboard
# Protege contra corrupção causada por atualizações incorretas do DashboardBuilder
#
# Uso:
#   .\backup_dashboard.ps1                    # Executar backup imediatamente
#   .\backup_dashboard.ps1 -Schedule          # Agendar para executar a cada 30 min
#   .\backup_dashboard.ps1 -Restore           # Restaurar do último backup
#
# ============================================================================

param(
    [switch]$Schedule,
    [switch]$Restore,
    [int]$IntervalMinutes = 30
)

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

$dbHost = "100.126.166.63"
$dbUser = "root"
$dbPass = "k15720"
$dbName = "erp"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupScript = Join-Path $scriptDir "backup_dashboard_database.sql"
$logDir = Join-Path $scriptDir "logs"
$restoreLogFile = Join-Path $logDir "restore_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Criar diretório de logs se não existir
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# ============================================================================
# FUNÇÕES
# ============================================================================

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMsg = "[$timestamp] [$Level] $Message"
    Write-Host $logMsg
}

function Execute-Backup {
    Write-Log "Iniciando backup das tabelas do dashboard..."
    
    try {
        # Verificar se arquivo de script existe
        if (!(Test-Path $backupScript)) {
            Write-Log "❌ Arquivo de backup não encontrado: $backupScript" "ERROR"
            return $false
        }
        
        # Executar backup
        Write-Log "Executando: mysql -h $dbHost -u $dbUser -p*** $dbName < $backupScript"
        
        $process = Start-Process -FilePath "mysql" `
            -ArgumentList @(
                "-h", $dbHost,
                "-u", $dbUser,
                "-p$dbPass",
                $dbName
            ) `
            -RedirectStandardInput $backupScript `
            -RedirectStandardOutput "stdout.txt" `
            -RedirectStandardError "stderr.txt" `
            -NoNewWindow `
            -PassThru `
            -ErrorAction Stop
        
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            Write-Log "✅ Backup concluído com sucesso!" "SUCCESS"
            
            # Ler e exibir resultado
            $output = Get-Content "stdout.txt" -Raw
            Write-Log $output "DEBUG"
            
            return $true
        } else {
            $error = Get-Content "stderr.txt" -Raw
            Write-Log "❌ Erro ao executar backup: $error" "ERROR"
            return $false
        }
        
    } catch {
        Write-Log "❌ Exceção durante backup: $_" "ERROR"
        return $false
    }
}

function Execute-Restore {
    Write-Log "Iniciando restauração do backup..." "WARNING"
    Write-Log "⚠️  AVISO: Esta operação SOBRESCREVERÁ os dados atuais!" "WARNING"
    
    $confirm = Read-Host "Digite 'SIM' para confirmar a restauração"
    
    if ($confirm -ne "SIM") {
        Write-Log "Restauração cancelada pelo usuário" "INFO"
        return $false
    }
    
    try {
        # Criar comando SQL para restauração
        $restoreSql = @"
CALL erp_backup.restore_dashboard_widgets_from_backup();
"@
        
        Write-Log "Executando restauração..."
        
        $process = Start-Process -FilePath "mysql" `
            -ArgumentList @(
                "-h", $dbHost,
                "-u", $dbUser,
                "-p$dbPass",
                $dbName,
                "-e", $restoreSql
            ) `
            -RedirectStandardOutput "restore_stdout.txt" `
            -RedirectStandardError "restore_stderr.txt" `
            -NoNewWindow `
            -PassThru `
            -ErrorAction Stop
        
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            Write-Log "✅ Restauração concluída com sucesso!" "SUCCESS"
            
            $output = Get-Content "restore_stdout.txt" -Raw
            Write-Log $output "INFO"
            
            # Salvar log
            $output | Add-Content $restoreLogFile
            
            return $true
        } else {
            $error = Get-Content "restore_stderr.txt" -Raw
            Write-Log "❌ Erro ao restaurar: $error" "ERROR"
            return $false
        }
        
    } catch {
        Write-Log "❌ Exceção durante restauração: $_" "ERROR"
        return $false
    }
}

function Schedule-BackupTask {
    Write-Log "Agendando backup automático a cada $IntervalMinutes minutos..."
    
    try {
        # Criar tarefa agendada
        $taskName = "SPDealer-Dashboard-AutoBackup"
        $taskPath = "\SPDealer\"
        
        # Remover tarefa antiga se existir
        $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($existingTask) {
            Write-Log "Removendo tarefa agendada anterior..." "INFO"
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        }
        
        # Criar ação
        $action = New-ScheduledTaskAction `
            -Execute "powershell.exe" `
            -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
        
        # Criar gatilho (a cada 30 minutos)
        $trigger = New-ScheduledTaskTrigger `
            -Once `
            -At (Get-Date).AddMinutes(1) `
            -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
            -RepetitionDuration (New-TimeSpan -Days 36500)  # ~100 anos
        
        # Criar settings
        $settings = New-ScheduledTaskSettingsSet `
            -AllowStartIfOnBatteries `
            -DontStopIfGoingOnBatteries `
            -StartWhenAvailable `
            -RunOnlyIfNetworkAvailable
        
        # Registrar tarefa
        Register-ScheduledTask `
            -TaskName $taskName `
            -Action $action `
            -Trigger $trigger `
            -Settings $settings `
            -RunLevel Highest `
            -ErrorAction Stop | Out-Null
        
        Write-Log "✅ Backup agendado com sucesso!" "SUCCESS"
        Write-Log "   Tarefa: $taskName" "INFO"
        Write-Log "   Intervalo: $IntervalMinutes minutos" "INFO"
        Write-Log "   Próxima execução: $(($trigger.StartBoundary | Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))" "INFO"
        
        return $true
        
    } catch {
        Write-Log "❌ Erro ao agendar tarefa: $_" "ERROR"
        return $false
    }
}

# ============================================================================
# MAIN
# ============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║         BACKUP AUTOMÁTICO - DASHBOARD DATABASE            ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

if ($Restore) {
    # Modo RESTAURAÇÃO
    Execute-Restore
} elseif ($Schedule) {
    # Modo AGENDAMENTO
    Schedule-BackupTask
} else {
    # Modo BACKUP IMEDIATO
    $success = Execute-Backup
    
    if ($success) {
        Write-Log ""
        Write-Log "✅ BACKUP CONCLUÍDO COM SUCESSO!"
        Write-Log "   Próximas execuções podem ser agendadas com: .\backup_dashboard.ps1 -Schedule"
        Write-Log ""
    } else {
        Write-Log "❌ FALHA NO BACKUP - Verifique os logs acima"
        exit 1
    }
}
