#!/bin/bash
set -e

# create logs dir and permissions
mkdir -p /opt/tomcat/logs
chown -R tomcat:tomcat /opt/tomcat || true
chmod 755 /opt/tomcat/logs || true

# write systemd unit
cat > /etc/systemd/system/spdealer.service <<'SERVICE'
[Unit]
Description=SPDealer Application
After=network.target

[Service]
Type=simple
User=tomcat
Group=tomcat
WorkingDirectory=/opt/spdealer
Environment="JAVA_HOME=/usr/lib64/jvm/java-17-openjdk"
ExecStart=${JAVA_HOME}/bin/java \
    -Dserver.port=8081 \
    -Dspring.profiles.active=prod \
    -Dspring.config.location=/opt/spdealer/application-prod.properties \
    -jar /opt/spdealer/spdealer-1.0.0.jar

ExecStop=/bin/kill -15 $MAINPID
Restart=always
RestartSec=10
UMask=0007

# logs to journal
StandardOutput=journal
StandardError=journal

TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
SERVICE

# reload and restart
systemctl daemon-reload
systemctl enable spdealer.service || true
systemctl restart spdealer.service
sleep 3

# status and logs
systemctl status spdealer.service --no-pager || true
journalctl -u spdealer.service -n 200 --no-pager || true

# HTTP test
curl -sS -I http://localhost:8081/spdealer/ || echo 'curl failed'
