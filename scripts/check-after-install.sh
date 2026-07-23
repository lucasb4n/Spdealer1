#!/bin/bash

set -euo pipefail

echo "== java -version =="
java -version || true

echo "\n== which java =="
which java || true

echo "\n== update-alternatives display java =="
update-alternatives --display java || true

echo "\n== systemctl daemon-reload & status =="
systemctl daemon-reload || true
systemctl status spdealer.service --no-pager -l || true

echo "\n== journalctl (last 200) =="
journalctl -u spdealer.service -n 200 --no-pager || true

echo "\n== ss listening =="
ss -ltnp | head -n 50 || true

echo "\n== curl health =="
curl -sS -m 5 http://127.0.0.1:8081/actuator/health || true

exit 0
