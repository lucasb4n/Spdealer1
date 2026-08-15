import pexpect
import sys
import hashlib
import os

war_file = "/home/lucas/desenvolvimento/seprocom/protesto/Protesto/boletos/target/boleto.war"
server = "root@192.168.10.70"
password = "k15720"

# Step 1: SCP to /tmp/
print("[1/3] SCP to /tmp/boleto.war ...")
p = pexpect.spawn(f'scp -o StrictHostKeyChecking=no "{war_file}" {server}:/tmp/boleto.war', timeout=300)
p.expect('[pP]assword:')
p.sendline(password)
p.expect(pexpect.EOF)
p.close()
print("  SCP done")

# Verify local hash
with open(war_file, 'rb') as f:
    local_hash = hashlib.sha256(f.read()).hexdigest()
print(f"  Local SHA256: {local_hash}")

# Step 2: SSH to get remote hash, then move
print("[2/3] Verifying and moving ...")
p = pexpect.spawn(f'ssh -o StrictHostKeyChecking=no {server}', timeout=60)
p.expect('[pP]assword:')
p.sendline(password)
p.expect('#')

p.sendline(f'sha256sum /tmp/boleto.war')
p.expect('#')
remote_output = p.before.strip()
remote_hash = remote_output.split()[0] if remote_output else "???"
print(f"  Remote SHA256: {remote_hash}")

if remote_hash == local_hash:
    print("  HASH MATCH - moving to webapps")
    p.sendline('mv -f /tmp/boleto.war /usr/local/tomcat10/webapps/boleto.war')
    p.expect('#')
    p.sendline('echo OK_MOVE')
    p.expect('OK_MOVE')
    print("  Move done")
else:
    print(f"  HASH MISMATCH! Local: {local_hash} Remote: {remote_hash}")
    # Check sizes
    p.sendline(f'wc -c /tmp/boleto.war')
    p.expect('#')
    print(f"  Remote size info: {p.before.strip()}")

p.sendline('exit')
p.expect(pexpect.EOF)
p.close()
