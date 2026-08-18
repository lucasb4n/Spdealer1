import os
import sys
import glob
import shutil
import hashlib
import time
import subprocess
import paramiko

print("==================================================")
print("     🚀 DEPLOY SPDEALER -> PRODUÇÃO (192.168.10.70)")
print("==================================================")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REMOTE_HOST = "192.168.10.70"
REMOTE_USER = "root"
REMOTE_PASS = "k15720"
REMOTE_WEBAPPS = "/usr/local/tomcat10/webapps"
WAR_NAME = "spdealer.war"
PUBLIC_URL = "https://spdealer.seprocom.com.br"

# Setup JDK 17 environment
env = os.environ.copy()
jdk17_path = "/home/lucas/.local/tools/jdk-17.0.12+7"
if os.path.isdir(jdk17_path):
    env["JAVA_HOME"] = jdk17_path
    env["PATH"] = f"{jdk17_path}/bin:" + env.get("PATH", "")
    print(f"✓ Usando JAVA_HOME: {jdk17_path}")

env["PUBLIC_URL"] = "/spdealer/"
env["REACT_APP_API_BASE_URL"] = PUBLIC_URL
env["REACT_APP_API_URL"] = f"{PUBLIC_URL}/api"

# 1. Frontend Build
print("\n[1/5] Compilando Frontend React...")
res = subprocess.run("npm run build", shell=True, cwd=SCRIPT_DIR, env=env)
if res.returncode != 0:
    print("❌ Erro ao compilar Frontend React")
    sys.exit(1)
print("✓ Frontend compilado com sucesso")

# 2. Copiar assets para static resources
print("\n[2/5] Copiando static assets para src/main/resources/static...")
static_dir = os.path.join(SCRIPT_DIR, "src", "main", "resources", "static")
os.makedirs(static_dir, exist_ok=True)
build_dir = os.path.join(SCRIPT_DIR, "build")

for item in os.listdir(static_dir):
    item_path = os.path.join(static_dir, item)
    if os.path.isdir(item_path):
        shutil.rmtree(item_path)
    else:
        os.remove(item_path)

for item in os.listdir(build_dir):
    s = os.path.join(build_dir, item)
    d = os.path.join(static_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)
print("✓ Static assets copiados")

# 3. Backend Maven Build
print("\n[3/5] Compilando Backend Maven (JDK 17)...")
res = subprocess.run("mvn package -DskipTests", shell=True, cwd=SCRIPT_DIR, env=env)
if res.returncode != 0:
    print("❌ Erro ao compilar Backend Maven")
    sys.exit(1)

target_dir = os.path.join(SCRIPT_DIR, "target")
war_files = glob.glob(os.path.join(target_dir, "*.war"))
war_files = [f for f in war_files if not f.endswith(".original") and not f.endswith("-exec.war")]

if not war_files:
    print("❌ Nenhum WAR encontrado em target/")
    sys.exit(1)

war_files.sort(key=os.path.getmtime, reverse=True)
local_war = war_files[0]
print(f"✓ WAR compilado: {local_war}")

with open(local_war, "rb") as f:
    local_hash = hashlib.sha256(f.read()).hexdigest()
local_size_mb = os.path.getsize(local_war) / (1024 * 1024)
print(f"  Tamanho: {local_size_mb:.2f} MB | SHA256: {local_hash[:16]}...")

# 4. Envio SFTP e Deploy Remoto via Paramiko
print(f"\n[4/5] Conectando via SSH ao servidor {REMOTE_HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(REMOTE_HOST, username=REMOTE_USER, password=REMOTE_PASS, timeout=30)
print("✓ Conexão SSH estabelecida")

def run_remote(cmd):
    print(f"  [REMOTO] Executando: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    return out, err

# Parar serviço spdealer
print("  Parando spdealer.service...")
run_remote("systemctl stop spdealer.service || true")

# Backup WAR anterior
timestamp = time.strftime("%Y%m%d%H%M%S")
target_remote_war = f"{REMOTE_WEBAPPS}/{WAR_NAME}"
target_remote_folder = f"{REMOTE_WEBAPPS}/spdealer"

run_remote(f"[ -f {target_remote_war} ] && mv -f {target_remote_war} {target_remote_war}.bak.{timestamp} || true")
run_remote(f"[ -d {target_remote_folder} ] && rm -rf {target_remote_folder} || true")

# Upload via SFTP para /tmp/spdealer.war
print("  Enviando WAR via SFTP para /tmp/spdealer.war...")
sftp = ssh.open_sftp()
sftp.put(local_war, "/tmp/spdealer.war")
sftp.close()

# Verificar hash remoto
out, _ = run_remote("sha256sum /tmp/spdealer.war")
remote_hash = out.split()[0] if out else ""
print(f"  Remote SHA256: {remote_hash[:16]}...")

if remote_hash != local_hash:
    print("❌ HASH MISMATCH! O arquivo enviado difere do arquivo local.")
    sys.exit(1)

print("✓ HASH validado com sucesso!")

# Mover WAR para webapps e ajustar permissões
run_remote(f"mv -f /tmp/spdealer.war {target_remote_war}")
run_remote(f"chown tomcat:tomcat {target_remote_war}")

# Reiniciar serviço
print("  Iniciando spdealer.service...")
run_remote("systemctl start spdealer.service")

print("  Aguardando 10 segundos para inicialização do Tomcat...")
time.sleep(10)

# 5. Verificação de Status
print("\n[5/5] Verificando status da aplicação...")
out, _ = run_remote("systemctl status spdealer.service --no-pager -l | head -n 25")
print(out)

print("==================================================")
print("🚀 DEPLOY CONCLUÍDO COM SUCESSO!")
print(f"🌐 URL Pública: {PUBLIC_URL}/spdealer/")
print("==================================================")

ssh.close()
