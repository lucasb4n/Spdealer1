#!/bin/bash
set -e

echo "[1/5] Instalando Java 17 (OpenJDK)..."
zypper -n install java-17-openjdk java-17-openjdk-devel

echo "[2/5] Versao do java instalada"
/usr/bin/java -version 2>&1 | sed -n '1,5p' || true

echo "[3/5] Detectando JAVA_HOME"
JAVA_BIN=$(readlink -f $(which java) 2>/dev/null || echo /usr/bin/java)
JAVA_HOME=$(dirname $(dirname $JAVA_BIN))
echo "JAVA_BIN=$JAVA_BIN"
echo "JAVA_HOME=$JAVA_HOME"

echo "[4/5] Atualizando unit file spdealer.service com JAVA_HOME detectado"
cat > /etc/systemd/system/spdealer.service <<SERVICE
[Unit]
Description=SPDealer Application
After=network.target

[Service]
Type=simple
User=tomcat
Group=tomcat
WorkingDirectory=/opt/spdealer
Environment="JAVA_HOME=${JAVA_HOME}"
ExecStart=/usr/bin/java -Dserver.port=8081 -Dspring.profiles.active=prod -Dspring.config.location=/opt/spdealer/application-prod.properties -jar /opt/spdealer/spdealer-1.0.0.jar

ExecStop=/bin/kill -15 \$MAINPID
Restart=always
RestartSec=10
UMask=0007

StandardOutput=journal
StandardError=journal

TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl restart spdealer.service || true
sleep 3

echo "[5/5] Status e logs"
systemctl status spdealer.service --no-pager || true
journalctl -u spdealer.service -n 200 --no-pager || true

echo "Teste HTTP local (localhost:8081/spdealer/)"
curl -sS -I http://localhost:8081/spdealer/ || echo "curl failed"
