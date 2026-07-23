#!/bin/bash
set -e
# Assume files already in /opt/spdealer
mkdir -p /opt/spdealer
cp -r /tmp/spdealer-deploy/* /opt/spdealer/
chown -R tomcat:tomcat /opt/spdealer || true

cat > /etc/systemd/system/spdealer.service <<'SERVICE'
[Unit]
Description=SPDealer Application
After=network.target

[Service]
# keep simple type (jar runs in foreground) but adopt tomcat-like environment
Type=simple
User=tomcat
Group=tomcat
WorkingDirectory=/opt/spdealer
Environment="JAVA_HOME=/usr/lib64/jvm/java-17-openjdk"
ExecStart=/usr/lib64/jvm/java-17-openjdk/bin/java \
  -Dserver.port=8081 \
  -Dspring.profiles.active=prod \
  -Dspring.config.location=/opt/spdealer/application-prod.properties \
  -jar /opt/spdealer/spdealer-1.0.0.jar
 

ExecStop=/bin/kill -15 $MAINPID
Restart=always
RestartSec=10
UMask=0007

# log to journal (consistent with tomcat service)
StandardOutput=journal
StandardError=journal

TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable spdealer.service || true
systemctl restart spdealer.service
sleep 3

systemctl status spdealer.service --no-pager || true

if [ -f /opt/tomcat/logs/spdealer.log ]; then
  tail -n 200 /opt/tomcat/logs/spdealer.log || true
else
  journalctl -u spdealer.service -n 200 --no-pager || true
fi

curl -sS -I http://localhost:8081/spdealer/ || echo 'curl failed'
