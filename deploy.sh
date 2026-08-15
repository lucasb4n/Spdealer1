#!/bin/bash
set -e

user="${SUDO_USER:-$USER}"
echo "Usuário: $user"

deploy_server() {
    server="${1:-192.168.10.70}"
    deploy_path="${2:-/usr/local/tomcat10/webapps}"
    username="${3:-root}"
    password="${4:-k15720}"
    war_file="${5:-target/spdealer-1.0.0.war}"
    
    echo "=== Deploying to $server ==="
    echo " Deploy path: $deploy_path"
    echo " Username: $username"
    echo " WAR file: $war_file"
    echo "========================================\n"
    
    # Check if WAR exists
    if [ ! -f "$war_file" ]; then
        echo "WAR file not found: $war_file"
        exit 1
    fi
    
    war_size=$(du -h "$war_file" | cut -f1)
    echo " WAR size: $war_size"
    
    # Create SSH directory if needed
    mkdir -p ~/.ssh
    
    # Use sshpass for password-based SSH
    sshpass -p "$password" ssh -o StrictHostKeyChecking=no "$username@$server" "\
        sudo mkdir -p $deploy_path && 
        sudo systemctl stop spdealer.service 2>/dev/null || echo "Serviço não está rodando" && 
        sudo mv -f $deploy_path/spdealer.war $deploy_path/spdealer.war.backup 2>/dev/null || echo "Backup não existia" && 
        sudo mv /tmp/spdealer-1.0.0.war $deploy_path/spdealer.war && 
        sudo chown tomcat:tomcat $deploy_path/spdealer.war && 
        sudo systemctl start spdealer.service && 
        echo 'Deploy concluído com sucesso'
    " || {
        echo "❌ Erro no deploy para $server"
        exit 1
    }
    
    # Send WAR file via SCP
    echo "Enviando WAR para servidor..."
    sshpass -p "$password" scp -o StrictHostKeyChecking=no "$war_file" "$username@$server:/tmp/" || {
        echo "❌ Erro ao enviar WAR via SCP"
        exit 1
    }
    
    echo "✅ Deploy concluído para $server"
    echo "========================================\n"
}

# Execute deployment
if [ $# -eq 0 ]; then
    echo "Executando deploy padrão..."
    deploy_server
elif [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Uso: $0 [servidor host] [deploy path] [username] [password] [war file]"
    echo "Parâmetros padrão:"
    echo "  Servidor: 192.168.10.70"
    echo "  Deploy path: /usr/local/tomcat10/webapps"
    echo "  Username: root"
    echo "  Password: k15720"
    echo "  WAR file: target/spdealer-1.0.0.war"
    echo "\nExemplo: $0 192.168.10.70 /usr/local/tomcat10/webapps root k15720 target/spdealer-1.0.0.war"
else
    deploy_server "$1" "$2" "$3" "$4" "$5"
fi
