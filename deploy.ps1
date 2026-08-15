#!/usr/bin/env bash
# =============================================================================
# Deploy Script para SPDealer
# Servidor: 192.168.10.70
# Destino: /usr/local/tomcat10/webapps
# Usuário: root
# WAR: spdealer.war
# Backup: spdealer.war.bak.YYYYMMDDHHMMSS
# Execução no terminal: ./deploy.ps1
# =============================================================================

python3 - "$@" << 'PYEOF'
import os
import sys
import glob
import shutil
import subprocess
import datetime
import time

try:
    import paramiko
except ImportError:
    print("Instalando dependencia paramiko...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko"])
    import paramiko

# Configurações do Deploy
REMOTE_HOST = "192.168.10.70"
REMOTE_PORT = 22
REMOTE_USER = "root"
REMOTE_PASSWORDS = ["k15720", "senhak15720"]
REMOTE_WEBAPPS = "/usr/local/tomcat10/webapps"
WAR_TARGET_NAME = "spdealer.war"
SERVICE_NAME = "spdealer.service"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__)) if __file__ != '<stdin>' else os.getcwd()

print("==================================================")
print("             DEPLOY SPDEALER                      ")
print(f" Servidor:  {REMOTE_HOST}")
print(f" Destino:   {REMOTE_WEBAPPS}")
print(f" Usuário:   {REMOTE_USER}")
print(f" Arquivo:   {WAR_TARGET_NAME}")
print("==================================================")

# 1. PASSO 1: Localizar / Compilar WAR
target_dir = os.path.join(SCRIPT_DIR, "target")
war_files = glob.glob(os.path.join(target_dir, "spdealer*.war"))
war_files = [f for f in war_files if not f.endswith(".original") and not f.endswith("-exec.war")]

if not war_files or "--rebuild" in sys.argv or "-r" in sys.argv:
    print("\n[PASSO 1] Compilando projeto com Maven...")
    
    # Configurar JDK 17 se disponível
    env = os.environ.copy()
    jdk17_path = "/home/lucas/.local/tools/jdk-17.0.12+7"
    if os.path.isdir(jdk17_path):
        env["JAVA_HOME"] = jdk17_path
        env["PATH"] = f"{jdk17_path}/bin:" + env.get("PATH", "")
    
    mvn_cmd = "mvn package -DskipTests -Pprod"
    res = subprocess.run(mvn_cmd, shell=True, cwd=SCRIPT_DIR, env=env)
    if res.returncode != 0:
        print("❌ Erro na compilação Maven. Deploy abortado.")
        sys.exit(res.returncode)
    
    war_files = glob.glob(os.path.join(target_dir, "spdealer*.war"))
    war_files = [f for f in war_files if not f.endswith(".original") and not f.endswith("-exec.war")]

if not war_files:
    print("❌ Nenhum arquivo WAR encontrado na pasta target.")
    sys.exit(1)

# Escolher o WAR mais recente
war_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
local_war_source = war_files[0]
print(f"✓ WAR local localizado: {local_war_source}")

# Prepara nome final do WAR
local_war_final = os.path.join(target_dir, WAR_TARGET_NAME)
if local_war_source != local_war_final:
    shutil.copy2(local_war_source, local_war_final)

war_size_mb = os.path.getsize(local_war_final) / (1024 * 1024)
print(f"✓ Tamanho do WAR: {war_size_mb:.2f} MB")

# 2. PASSO 2: Conexão SSH / SFTP com o servidor remoto
print("\n[PASSO 2] Conectando ao servidor remoto (192.168.10.70)...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

connected = False
for pw in REMOTE_PASSWORDS:
    try:
        ssh.connect(REMOTE_HOST, port=REMOTE_PORT, username=REMOTE_USER, password=pw, timeout=10)
        connected = True
        print(f"✓ Conexão SSH estabelecida com sucesso com usuário {REMOTE_USER}.")
        break
    except Exception:
        continue

if not connected:
    print(f"❌ Falha ao autenticar via SSH em {REMOTE_HOST} com o usuário {REMOTE_USER}.")
    sys.exit(1)

# 3. PASSO 3: Upload do WAR via SFTP para pasta temporária
timestamp_str = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
remote_tmp_war = f"/tmp/{WAR_TARGET_NAME}.tmp.{timestamp_str}"

print(f"\n[PASSO 3] Enviando {WAR_TARGET_NAME} para {remote_tmp_war}...")
sftp = ssh.open_sftp()
sftp.put(local_war_final, remote_tmp_war)
sftp.close()
print("✓ Envio concluído com sucesso.")

# 4. PASSO 4: Deploy no Tomcat remoto (Backup do antigo, limpeza, movimentação e restart)
print("\n[PASSO 4] Executando comandos de deploy no Tomcat remoto...")

remote_bash_commands = f"""set -e
echo "1. Parando serviço {SERVICE_NAME}..."
systemctl stop {SERVICE_NAME} 2>/dev/null || true
sleep 3

WEBAPPS="{REMOTE_WEBAPPS}"
WARNAME="{WAR_TARGET_NAME}"
TIMESTAMP="{timestamp_str}"
BACKUP_NAME="$WARNAME.bak.$TIMESTAMP"

if [ -f "$WEBAPPS/$WARNAME" ]; then
    echo "2. Criando backup do WAR antigo -> $BACKUP_NAME"
    mv "$WEBAPPS/$WARNAME" "$WEBAPPS/$BACKUP_NAME"
    echo "✓ Backup criado com sucesso: $BACKUP_NAME"
else
    echo "2. WAR anterior não encontrado em $WEBAPPS/$WARNAME (primeiro deploy?)"
fi

echo "3. Removendo contexto descompactado anterior..."
rm -rf "$WEBAPPS/spdealer"

echo "4. Limpando diretórios temporários do Tomcat (temp e work)..."
rm -rf /usr/local/tomcat10/temp/* /usr/local/tomcat10/work/*

echo "5. Posicionando o novo WAR em $WEBAPPS/$WARNAME..."
mv "{remote_tmp_war}" "$WEBAPPS/$WARNAME"
chown tomcat:tomcat "$WEBAPPS/$WARNAME" 2>/dev/null || true

echo "6. Iniciando serviço {SERVICE_NAME}..."
systemctl start {SERVICE_NAME} || {{
    echo "Aviso: systemctl start falhou, iniciando via startup.sh..."
    /usr/local/tomcat10/bin/startup.sh 2>/dev/null || true
}}

echo "7. Aguardando Tomcat inicializar (8 segundos)..."
sleep 8

echo "--------------------------------------------------"
echo "Últimas linhas do log do Tomcat (catalina.out):"
echo "--------------------------------------------------"
if [ -f /usr/local/tomcat10/logs/catalina.out ]; then
    tail -n 30 /usr/local/tomcat10/logs/catalina.out
fi
"""

stdin, stdout, stderr = ssh.exec_command(f"bash -c '{remote_bash_commands}'")
out_text = stdout.read().decode('utf-8', errors='replace')
err_text = stderr.read().decode('utf-8', errors='replace')
exit_code = stdout.channel.recv_exit_status()

print(out_text)
if err_text and exit_code != 0:
    print(f"Avisos/Erros: {err_text}")

ssh.close()

if exit_code == 0:
    PUBLIC_URL = "https://spdealer.seprocom.com.br/spdealer/"
    print("\n==================================================")
    print("      DEPLOY CONCLUÍDO COM SUCESSO!               ")
    print(f" URL Pública:  {PUBLIC_URL}")
    print(f" URL Interna:  http://{REMOTE_HOST}:5070/spdealer/")
    print(f" Backup gerado: {WAR_TARGET_NAME}.bak.{timestamp_str}")
    print("==================================================")
else:
    print(f"\n❌ O deploy finalizou com código de erro {exit_code}.")
    sys.exit(exit_code)

PYEOF
