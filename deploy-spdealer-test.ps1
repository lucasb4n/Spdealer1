#!/usr/bin/env bash
# =============================================================================
# Script de Deploy de TESTE para SPDealer
# WAR: spdealer_test.war
# Servidor: 192.168.10.70
# Destino: /usr/local/tomcat10/webapps/spdealer_test.war
# Usuário: root
# URL de Teste: http://192.168.10.70:5070/spdealer_test/
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

# Configurações do Deploy de Teste
REMOTE_HOST = "192.168.10.70"
REMOTE_PORT = 22
REMOTE_USER = "root"
REMOTE_PASSWORDS = ["k15720", "senhak15720"]
REMOTE_WEBAPPS = "/usr/local/tomcat10/webapps"
WAR_TARGET_NAME = "spdealer_test.war"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__)) if __file__ != '<stdin>' else os.getcwd()

print("==================================================")
print("        DEPLOY SPDEALER - AMBIENTE DE TESTE       ")
print(f" Servidor:  {REMOTE_HOST}")
print(f" Destino:   {REMOTE_WEBAPPS}/{WAR_TARGET_NAME}")
print(f" Usuário:   {REMOTE_USER}")
print(f" Banco DB:  192.168.10.70:3306 (Perfil TESTE)")
print("==================================================")

# 1. PASSO 1: Compilar projeto com perfil TESTE
print("\n[PASSO 1] Compilando projeto com Maven (Perfil TESTE)...")

# Garantir JDK 17 se disponível
env = os.environ.copy()
jdk17_path = "/home/lucas/.local/tools/jdk-17.0.12+7"
if os.path.isdir(jdk17_path):
    env["JAVA_HOME"] = jdk17_path
    env["PATH"] = f"{jdk17_path}/bin:" + env.get("PATH", "")

# Temporariamente garantir spring.profiles.active=teste em application.properties durante o build
app_props_path = os.path.join(SCRIPT_DIR, "src", "main", "resources", "application.properties")
app_props_bak = app_props_path + ".bak_deploy_test"

try:
    if os.path.exists(app_props_path):
        shutil.copy2(app_props_path, app_props_bak)
        with open(app_props_path, "r", encoding="utf-8") as f:
            content = f.read()
        # Modificar a linha do profile ativo para teste e datasource para 192.168.10.70
        new_content = []
        for line in content.splitlines():
            if line.startswith("spring.profiles.active="):
                new_content.append("spring.profiles.active=teste")
            elif line.startswith("spring.datasource.url="):
                new_content.append("spring.datasource.url=jdbc:mariadb://192.168.10.70:3306/erp?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC&sslMode=DISABLED")
            else:
                new_content.append(line)
        with open(app_props_path, "w", encoding="utf-8") as f:
            f.write("\n".join(new_content) + "\n")

    mvn_cmd = "mvn clean package -DskipTests -Dspring.profiles.active=teste"
    print(f"Executando: {mvn_cmd}")
    res = subprocess.run(mvn_cmd, shell=True, cwd=SCRIPT_DIR, env=env)
    if res.returncode != 0:
        print("❌ Erro na compilação Maven. Deploy de teste abortado.")
        sys.exit(res.returncode)

finally:
    # Restaurar application.properties original
    if os.path.exists(app_props_bak):
        shutil.move(app_props_bak, app_props_path)

target_dir = os.path.join(SCRIPT_DIR, "target")
war_files = glob.glob(os.path.join(target_dir, "spdealer*.war"))
war_files = [f for f in war_files if not f.endswith(".original") and not f.endswith("-exec.war")]

if not war_files:
    print("❌ Nenhum arquivo WAR encontrado na pasta target.")
    sys.exit(1)

war_files.sort(key=lambda x: os.path.getmtime(x), reverse=True)
local_war_source = war_files[0]

local_war_final = os.path.join(target_dir, WAR_TARGET_NAME)
shutil.copy2(local_war_source, local_war_final)

war_size_mb = os.path.getsize(local_war_final) / (1024 * 1024)
print(f"✓ WAR de TESTE gerado: {local_war_final} ({war_size_mb:.2f} MB)")

# 2. PASSO 2: Conexão SSH / SFTP com o servidor remoto
print(f"\n[PASSO 2] Conectando ao servidor remoto ({REMOTE_HOST})...")
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
    print(f"❌ Falha ao autenticar via SSH em {REMOTE_HOST}.")
    sys.exit(1)

# 3. PASSO 3: Upload do spdealer_test.war para pasta temporária
timestamp_str = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
remote_tmp_war = f"/tmp/{WAR_TARGET_NAME}.tmp.{timestamp_str}"

print(f"\n[PASSO 3] Enviando {WAR_TARGET_NAME} para {remote_tmp_war}...")
sftp = ssh.open_sftp()
sftp.put(local_war_final, remote_tmp_war)
sftp.close()
print("✓ Envio concluído com sucesso.")

# 4. PASSO 4: Deploy isolado do spdealer_test.war no Tomcat
print("\n[PASSO 4] Atualizando o contexto /spdealer_test no Tomcat...")

remote_bash_commands = f"""set -e
WEBAPPS="{REMOTE_WEBAPPS}"
WARNAME="{WAR_TARGET_NAME}"
TIMESTAMP="{timestamp_str}"
BACKUP_NAME="$WARNAME.bak.$TIMESTAMP"

if [ -f "$WEBAPPS/$WARNAME" ]; then
    echo "1. Criando backup do WAR de teste antigo -> $BACKUP_NAME"
    mv "$WEBAPPS/$WARNAME" "$WEBAPPS/$BACKUP_NAME"
else
    echo "1. Nenhum WAR de teste anterior encontrado."
fi

echo "2. Removendo contexto descompactado anterior (/spdealer_test)..."
rm -rf "$WEBAPPS/spdealer_test"

echo "3. Posicionando o novo WAR em $WEBAPPS/$WARNAME..."
mv "{remote_tmp_war}" "$WEBAPPS/$WARNAME"
chown tomcat:tomcat "$WEBAPPS/$WARNAME" 2>/dev/null || true

echo "4. Aguardando Tomcat detectar e descompactar o novo WAR (10 segundos)..."
sleep 10

echo "--------------------------------------------------"
echo "Últimas linhas do log do Tomcat (catalina.out):"
echo "--------------------------------------------------"
if [ -f /usr/local/tomcat10/logs/catalina.out ]; then
    tail -n 40 /usr/local/tomcat10/logs/catalina.out
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
    TEST_URL = f"http://{REMOTE_HOST}:5070/spdealer_test/"
    print("\n==================================================")
    print("      DEPLOY DE TESTE CONCLUÍDO COM SUCESSO!     ")
    print(f" URL de Teste: {TEST_URL}")
    print(f" WAR Remoto:   {REMOTE_WEBAPPS}/{WAR_TARGET_NAME}")
    print(f" Banco DB:     192.168.10.70:3306")
    print(" Produção (spdealer.war): INTACTA / NÃO ALTERADA")
    print("==================================================")
else:
    print(f"\n❌ O deploy de teste finalizou com código de erro {exit_code}.")
    sys.exit(exit_code)

PYEOF
