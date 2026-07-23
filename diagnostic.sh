#!/bin/bash

echo "=== Diagnostic Report ==="
echo ""

echo "1. Backend Service Status:"
if pgrep -f "java.*spdealer.*jar" > /dev/null; then
    echo "✅ Java backend is running"
    ps aux | grep "java.*spdealer" | grep -v grep | awk '{print "   PID: " $2 ", Memory: " $6 "KB"}'
else
    echo "❌ Java backend is NOT running"
fi

echo ""
echo "2. Frontend Service Status:"
if pgrep -f "npm.*start\|react-scripts" > /dev/null; then
    echo "✅ React frontend is running"
    ps aux | grep "npm\|node" | grep -v grep | head -2 | awk '{print "   PID: " $2}'
else
    echo "❌ React frontend is NOT running"
fi

echo ""
echo "3. Port Status:"
echo "   Port 8080 (Backend):"
netstat -tlnp 2>/dev/null | grep 8080 || echo "   Not listening on port 8080"

echo "   Port 3000 (Frontend):"
netstat -tlnp 2>/dev/null | grep 3000 || echo "   Not listening on port 3000"

echo ""
echo "4. Database Connectivity Test:"
mysql -h localhost -u root -p -e "SELECT @@version;" 2>/dev/null && echo "✅ MariaDB is accessible" || echo "❌ MariaDB connection failed"

echo ""
echo "5. Recent Backend Log (last 20 lines):"
tail -20 backend.log 2>/dev/null || echo "No backend.log found"

echo "Done."
