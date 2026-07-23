#!/bin/bash
set -e
TOMCAT_WEBAPPS=/usr/local/tomcat9/webapps
APP_DIR=$TOMCAT_WEBAPPS/spdealer
BACKUP_DIR=$TOMCAT_WEBAPPS/spdealer.bak.$(date +%s)
if [ -d "$APP_DIR" ]; then
  echo "Fazendo backup $APP_DIR -> $BACKUP_DIR"
  mv "$APP_DIR" "$BACKUP_DIR"
fi
mkdir -p "$APP_DIR/WEB-INF/lib"
mkdir -p "$APP_DIR/WEB-INF/classes"

echo "Copiando assets estáticos..."
cp -r /tmp/spdealer-deploy/static/* "$APP_DIR/" || true

echo "Copiando JAR..."
cp /tmp/spdealer-deploy/spdealer-1.0.0.jar "$APP_DIR/WEB-INF/lib/"

if [ -f /tmp/spdealer-deploy/application-prod.properties ]; then
  echo "Instalando application-prod.properties..."
  cp /tmp/spdealer-deploy/application-prod.properties "$APP_DIR/WEB-INF/classes/"
fi

if [ ! -f "$APP_DIR/WEB-INF/web.xml" ]; then
  cat > "$APP_DIR/WEB-INF/web.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee 
         http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">
    
    <display-name>SPDealer</display-name>
    <description>Sistema de CRM/ERP SEPROCOM</description>
    
    <!-- Spring Boot Servlet -->
    <servlet>
        <servlet-name>spdealer</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>classpath:application-prod.properties</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>
    
    <servlet-mapping>
        <servlet-name>spdealer</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>
    
    <welcome-file-list>
        <welcome-file>index.html</welcome-file>
    </welcome-file-list>
    
</web-app>
EOF
fi

chown -R tomcat:tomcat "$APP_DIR"
chmod -R 0755 "$APP_DIR"

echo "Reiniciando tomcat9.service..."
systemctl restart tomcat9.service
sleep 3

echo "---- tail logs (ultimas linhas) ----"
if [ -f /usr/local/tomcat9/logs/catalina.out ]; then tail -n 200 /usr/local/tomcat9/logs/catalina.out; elif [ -f /var/log/tomcat9/catalina.out ]; then tail -n 200 /var/log/tomcat9/catalina.out; fi

echo "---- http test (headers) ----"
curl -sS -I http://localhost/spdealer/ | head -n 20
