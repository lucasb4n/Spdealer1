#!/bin/bash
# quick-nginx-diagnose.sh
set -euo pipefail
OUTDIR="/tmp/nginx-perf-$(date +%Y%m%d%H%M%S)"
mkdir -p "$OUTDIR"
echo "Output dir: $OUTDIR"

echo "== Host info ==" > "$OUTDIR/01-host.txt"
uname -a >> "$OUTDIR/01-host.txt"
cat /etc/os-release >> "$OUTDIR/01-host.txt"
uptime >> "$OUTDIR/01-host.txt"
whoami >> "$OUTDIR/01-host.txt"

echo "== CPU/Mem/Load ==" > "$OUTDIR/02-system.txt"
# snapshot
top -b -n1 | head -n 40 >> "$OUTDIR/02-system.txt" 2>&1
vmstat 1 5 >> "$OUTDIR/02-system.txt" 2>&1
free -m >> "$OUTDIR/02-system.txt" 2>&1
cat /proc/loadavg >> "$OUTDIR/02-system.txt"

echo "== Disk / I/O ==" > "$OUTDIR/03-disk.txt"
df -hT >> "$OUTDIR/03-disk.txt" 2>&1
df -i >> "$OUTDIR/03-disk.txt" 2>&1
# iostat if available
if command -v iostat >/dev/null 2>&1; then
  iostat -xz 1 3 >> "$OUTDIR/03-disk.txt" 2>&1
else
  echo "iostat not available" >> "$OUTDIR/03-disk.txt"
fi
echo "Swappiness / swap" >> "$OUTDIR/03-disk.txt"
cat /proc/sys/vm/swappiness >> "$OUTDIR/03-disk.txt"
swapon --show >> "$OUTDIR/03-disk.txt" 2>&1 || true

echo "== Network sockets and connections ==" > "$OUTDIR/04-network.txt"
ss -tunap | head -n 200 >> "$OUTDIR/04-network.txt" 2>&1 || netstat -tunap | head -n 200 >> "$OUTDIR/04-network.txt" 2>&1 || true
ss -s >> "$OUTDIR/04-network.txt" 2>&1
# check connections to backend
echo "Connections to backend 192.168.10.70:8081" >> "$OUTDIR/04-network.txt"
ss -tn dst 192.168.10.70:8081 >> "$OUTDIR/04-network.txt" 2>&1 || true

echo "== NGINX status and config ==" > "$OUTDIR/05-nginx.txt"
systemctl status nginx --no-pager >> "$OUTDIR/05-nginx.txt" 2>&1 || true
nginx -V 2>&1 | sed -n '1,200p' >> "$OUTDIR/05-nginx.txt" 2>&1 || true
# collect main conf and relevant includes
if [ -f /etc/nginx/nginx.conf ]; then
  echo "---- /etc/nginx/nginx.conf ----" >> "$OUTDIR/05-nginx.txt"
  sed -n '1,200p' /etc/nginx/nginx.conf >> "$OUTDIR/05-nginx.txt" 2>&1 || true
fi
grep -R "worker_processes\|worker_connections\|keepalive_timeout\|proxy_pass\|upstream" /etc/nginx -n --color=never 2>/dev/null | sed -n '1,200p' >> "$OUTDIR/05-nginx.txt" || true

echo "== NGINX logs (last 500 lines) ==" > "$OUTDIR/06-nginx-logs.txt"
tail -n 500 /var/log/nginx/error.log >> "$OUTDIR/06-nginx-logs.txt" 2>&1 || echo "no error.log" >> "$OUTDIR/06-nginx-logs.txt"
tail -n 500 /var/log/nginx/access.log >> "$OUTDIR/06-nginx-logs.txt" 2>&1 || echo "no access.log" >> "$OUTDIR/06-nginx-logs.txt"

echo "== Socket process (Node/pm2/systemd) ==" > "$OUTDIR/07-socket.txt"
# try pm2
if command -v pm2 >/dev/null 2>&1; then
  pm2 status >> "$OUTDIR/07-socket.txt" 2>&1 || true
fi
ps aux | egrep 'node|socket|socket.io|pm2' | head -n 50 >> "$OUTDIR/07-socket.txt" 2>&1 || true
# guess common systemd service names
systemctl list-units --type=service | egrep 'socket|node|ws|socketio|pm2' -n --color=never >> "$OUTDIR/07-socket.txt" 2>&1 || true

# try to capture socket logs (common paths)
for f in /var/log/*.log /var/log/*/*.log /opt/*/logs/*.log /home/*/logs/*.log; do
  if [ -f "$f" ]; then
    echo "---- $f (tail 200) ----" >> "$OUTDIR/07-socket.txt"
    tail -n 200 "$f" >> "$OUTDIR/07-socket.txt" 2>&1 || true
  fi
done

echo "== Backend latency checks from NGINX host ==" > "$OUTDIR/08-backend-latency.txt"
# curl timing to backend (through upstream and direct)
curl -sS -o /dev/null -w "time_namelookup:%{time_namelookup} time_connect:%{time_connect} time_appconnect:%{time_appconnect} time_pretransfer:%{time_pretransfer} time_starttransfer:%{time_starttransfer} time_total:%{time_total}\n" http://192.168.10.70:8081/spdealer/ >> "$OUTDIR/08-backend-latency.txt" 2>&1 || echo "curl to backend failed" >> "$OUTDIR/08-backend-latency.txt"
curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" http://127.0.0.1:8081/spdealer/ >> "$OUTDIR/08-backend-latency.txt" 2>&1 || true

echo "== Quick HTTP test via NGINX ==" > "$OUTDIR/09-vhost.txt"
curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" http://localhost/spdealer/ >> "$OUTDIR/09-vhost.txt" 2>&1 || true
curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" http://127.0.0.1/spdealer/ >> "$OUTDIR/09-vhost.txt" 2>&1 || true

echo "== Top CPU and memory processes ==" > "$OUTDIR/10-top-procs.txt"
ps axo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -n 30 >> "$OUTDIR/10-top-procs.txt" 2>&1 || true

echo "== Journal (last 500 lines for nginx and socket services) ==" > "$OUTDIR/11-journal.txt"
journalctl -u nginx -n 500 --no-pager >> "$OUTDIR/11-journal.txt" 2>&1 || true
# try common socket service names
journalctl -n 500 --no-pager | egrep -i 'socket|ws|node|pm2|nginx' | tail -n 500 >> "$OUTDIR/11-journal.txt" 2>&1 || true

echo "== Done. Archive ==" 
tar -czf "$OUTDIR.tar.gz" -C "$(dirname "$OUTDIR")" "$(basename "$OUTDIR")" || true
echo "Archive: $OUTDIR.tar.gz"
echo "Files written to $OUTDIR and archived at $OUTDIR.tar.gz"