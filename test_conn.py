import mysql.connector

try:
    print("Testando 172.17.0.1 (Gateway Docker)...")
    conn = mysql.connector.connect(host='172.17.0.1', port=3306, user='root', password='k15720', database='spprot', connect_timeout=3)
    print("OK no 172.17.0.1")
    conn.close()
except Exception as e:
    print(f"Erro 172.17.0.1: {e}")

try:
    print("Testando 100.119.184.73 (Tailscale)...")
    conn = mysql.connector.connect(host='100.119.184.73', port=3306, user='root', password='k15720', database='spprot', connect_timeout=3)
    print("OK no 100.119.184.73")
    conn.close()
except Exception as e:
    print(f"Erro 100.119.184.73: {e}")
