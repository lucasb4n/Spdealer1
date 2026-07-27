set -e
echo "Parando serviço spdealer.service (se existir)..."
systemctl stop spdealer.service || true

timestamp=$(date +%Y%m%d%H%M%S)
WEBAPPS="/usr/local/tomcat10/webapps"
WARNAME="spdealer.war"
WARFOLDER="spdealer"
REMOTE_TMP="/tmp/spdealer.war"

# Backup antigo
if [ -f "${WEBAPPS}/${WARNAME}" ]; then
  mv "${WEBAPPS}/${WARNAME}" "${WEBAPPS}/${WARNAME}.bak.${timestamp}"
  echo "WAR antigo movido para backup"
fi
if [ -d "${WEBAPPS}/${WARFOLDER}" ]; then
  mv "${WEBAPPS}/${WARFOLDER}" "${WEBAPPS}/${WARFOLDER}.bak.${timestamp}"
  echo "Exploded webapp movido para backup"
fi

echo "Movendo novo WAR para webapps..."
mv "${REMOTE_TMP}" "${WEBAPPS}/${WARNAME}"

echo "Definindo permissões (tentativa: tomcat:tomcat)..."
chown -R tomcat:tomcat "${WEBAPPS}/${WARNAME}" || true

echo "Iniciando serviço spdealer.service..."
systemctl start spdealer.service || { 
    echo "Falha ao iniciar spdealer.service, tentando iniciar Tomcat diretamente..."
    if [ -f /usr/local/tomcat10/bin/startup.sh ]; then
        /usr/local/tomcat10/bin/shutdown.sh 2>/dev/null || true
        sleep 2
        /usr/local/tomcat10/bin/startup.sh
    fi
}

echo "Aguardando 8 segundos para Tomcat explodir WAR..."
sleep 8

echo "Estado do Tomcat:"
if [ -f /usr/local/tomcat10/logs/catalina.out ]; then
    echo "--- Últimas 50 linhas de catalina.out ---"
    tail -n 50 /usr/local/tomcat10/logs/catalina.out
fi

echo "Deploy remoto concluído com sucesso"
exit 0
