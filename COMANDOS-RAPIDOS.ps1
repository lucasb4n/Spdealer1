# ⚡ COMANDOS RÁPIDOS - Copy & Paste

**Objetivo**: Ter à mão os comandos mais usados para não perder tempo

---

## 🔧 VERIFICAR STATUS RÁPIDO

### ✅ Backend está rodando?
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) { Write-Host "✅ Backend OK on :8080" } else { Write-Host "❌ Backend DOWN" }
```

### ✅ Frontend está rodando?
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) { Write-Host "✅ Frontend OK on :3000" } else { Write-Host "❌ Frontend DOWN" }
```

### ✅ Componentes existem?
```powershell
ls src/components/Grade* src/components/Form* 2>$null | % { Write-Host "✅ $_" }
```

### ✅ Build status?
```powershell
ls target/spdealer-*.jar 2>$null | % { Write-Host "✅ Build exists: $_" }
```

---

## 🚀 INICIAR AMBIENTE

### Iniciar Backend
```powershell
# Terminal 1
cd h:\DISCO_D\Desenvolvimento\Seprocom\spdealer
java -jar target\spdealer-1.0.0.jar --server.port=8080
```

### Iniciar Frontend
```powershell
# Terminal 2
cd h:\DISCO_D\Desenvolvimento\Seprocom\spdealer
npm start
```

### Iniciar Ambos (via script)
```powershell
# Terminal 1
.\start_system.ps1
# Escolha opção 2 (Desenvolvimento)
```

---

## 📦 BUILD & COMPILE

### Build Backend (Maven)
```powershell
# Terminal
cd h:\DISCO_D\Desenvolvimento\Seprocom\spdealer
mvn clean package -DskipTests
```

### Build Frontend (React)
```powershell
# Terminal
cd h:\DISCO_D\Desenvolvimento\Seprocom\spdealer
npm run build
```

### Rebuild após mudanças
```powershell
# Backend
taskkill /F /IM java.exe ; Start-Sleep -Seconds 2
mvn clean package -DskipTests -q
java -jar target\spdealer-1.0.0.jar --server.port=8080

# Frontend (automático com npm start)
# Apenas save arquivo .tsx que hot-reload funciona
```

---

## 🧪 TESTES RÁPIDOS

### Testar Endpoint Caixa
```powershell
$uri = "http://localhost:8080/api/v1/caixa/movimentos"
$response = Invoke-WebRequest -Uri $uri -ErrorAction SilentlyContinue
$response.StatusCode
$response.Content | ConvertFrom-Json
```

### Testar Endpoint Bancos
```powershell
$uri = "http://localhost:8080/api/v1/caixa/bancos"
$response = Invoke-WebRequest -Uri $uri -ErrorAction SilentlyContinue
$response.Content | ConvertFrom-Json
```

### Abrir Frontend
```powershell
Start-Process "http://localhost:3000"
```

### Abrir Backend Health Check
```powershell
Start-Process "http://localhost:8080/api/health"
```

---

## 💾 GIT COMMANDS

### Ver status
```powershell
git status
```

### Adicionar changes
```powershell
git add .
```

### Commit
```powershell
git commit -m "Add GradeMovimentosCaixa + FormularioMovimentoCaixa components"
```

### Push
```powershell
git push origin main
```

### Ver logs
```powershell
git log --oneline -10
```

---

## 🗄️ DATABASE COMMANDS

### Conectar ao MariaDB
```powershell
mysql -h 100.126.166.63 -u root -pk15720 erp
```

### Ver TASK-201
```powershell
mysql -h 100.126.166.63 -u root -pk15720 erp -e "SELECT task_id, title, current_stage_id, estimated_hours FROM task_management WHERE task_id = 'TASK-201-PIVOT-CAIXA';"
```

### Ver Caixa movimentos
```powershell
mysql -h 100.126.166.63 -u root -pk15720 erp -e "SELECT COUNT(*) as total FROM caixa;"
```

### Ver Bancos
```powershell
mysql -h 100.126.166.63 -u root -pk15720 erp -e "SELECT codigo_bco, nomefan_bco FROM bancos LIMIT 5;"
```

### Atualizar TASK status para In Progress
```powershell
mysql -h 100.126.166.63 -u root -pk15720 erp -e "UPDATE task_management SET current_stage_id = 3, started_at = NOW() WHERE task_id = 'TASK-201-PIVOT-CAIXA';"
```

### Atualizar TASK para Done
```powershell
mysql -h 100.126.166.63 -u root -pk15720 erp -e "UPDATE task_management SET current_stage_id = 5, completed_at = NOW() WHERE task_id = 'TASK-201-PIVOT-CAIXA';"
```

---

## 📊 DESENVOLVIMENTO

### Abrir arquivo em VS Code
```powershell
code "h:\DISCO_D\Desenvolvimento\Seprocom\spdealer\src\components\GradeMovimentosCaixa.tsx"
```

### Abrir DevTools no Chrome
```
F12 (em qualquer página)
```

### Limpar cache npm
```powershell
npm cache clean --force
```

### Reinstalar dependências
```powershell
rm -r node_modules package-lock.json
npm install
```

### Executar linter (ESLint)
```powershell
npx eslint src/ --ext .tsx,.ts
```

### Executar prettier (format)
```powershell
npx prettier --write src/
```

---

## 🧩 ARQUIVOS PRINCIPAIS

### Ver componente Grade
```powershell
cat src/components/GradeMovimentosCaixa.tsx | Select-Object -First 50
```

### Ver componente Form
```powershell
cat src/components/FormularioMovimentoCaixa.tsx | Select-Object -First 50
```

### Ver página CaixaBancos
```powershell
cat src/pages/CaixaBancos.tsx
```

### Listar todos components
```powershell
ls src/components/*.tsx | % { $_.Name }
```

---

## 📋 DOCUMENTAÇÃO

### Ver todos os guides criados
```powershell
ls *.md | grep -E "(GUIA|RESUMO|INDICE|CHECKLIST|ANALISE)" | % { "📖 " + $_.Name }
```

### Abrir índice de documentação
```powershell
cat INDICE-DOCUMENTACAO-08NOV.md | Select-Object -First 30
```

### Abrir guia testes
```powershell
cat GUIA-TESTES-RESPONSIVIDADE.md | Select-Object -First 50
```

### Abrir guia integração
```powershell
cat GUIA-INTEGRACAO-CAIXA-BANCOS.md | Select-Object -First 50
```

---

## 🔍 TROUBLESHOOTING

### Limpar tudo e reconstruir
```powershell
# Backend
taskkill /F /IM java.exe 2>$null
cd h:\DISCO_D\Desenvolvimento\Seprocom\spdealer
git clean -fd
mvn clean package -DskipTests

# Frontend
rm -r node_modules build .cache
npm install
npm run build

# Reiniciar
java -jar target\spdealer-1.0.0.jar --server.port=8080
npm start
```

### Ver últimos erros build
```powershell
# Maven
mvn clean package -DskipTests 2>&1 | Select-Object -Last 50

# npm
npm run build 2>&1 | Select-Object -Last 50
```

### Verificar portas em uso
```powershell
netstat -ano | Select-String ":8080"  # Backend
netstat -ano | Select-String ":3000"  # Frontend
netstat -ano | Select-String ":3306"  # MySQL
```

---

## 📝 QUICK COPY-PASTE SESSIONS

### Session 1: Build Fresh Start (5 min)
```powershell
cd h:\DISCO_D\Desenvolvimento\Seprocom\spdealer
taskkill /F /IM java.exe 2>$null
mvn clean package -DskipTests
java -jar target\spdealer-1.0.0.jar --server.port=8080
# Wait for "Started DashboardApplication"
```

### Session 2: Start Frontend (2 min)
```powershell
cd h:\DISCO_D\Desenvolvimento\Seprocom\spdealer
npm start
# Wait for "webpack compiled"
```

### Session 3: Quick Test (1 min)
```powershell
$backend = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -ErrorAction SilentlyContinue
$frontend = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
Write-Host "Backend: $(if($backend.StatusCode -eq 200) {'✅'} else {'❌'})"
Write-Host "Frontend: $(if($frontend.StatusCode -eq 200) {'✅'} else {'❌'})"
```

### Session 4: Check Components (1 min)
```powershell
$files = @(
  "src/components/GradeMovimentosCaixa.tsx",
  "src/components/FormularioMovimentoCaixa.tsx"
)
$files | % { 
  if (Test-Path $_) { 
    Write-Host "✅ $_" 
  } else { 
    Write-Host "❌ $_ NOT FOUND" 
  } 
}
```

---

## 🎯 ATALHOS TECLADO

| Ação | Tecla |
|------|-------|
| Abrir DevTools | F12 |
| Toggle Device Toolbar | Ctrl+Shift+M |
| Abrir Console | Ctrl+Shift+I |
| Refresh página | F5 / Ctrl+R |
| Hard refresh | Ctrl+Shift+R |
| Aumentar zoom | Ctrl++ |
| Diminuir zoom | Ctrl+- |
| Reset zoom | Ctrl+0 |

---

## 📌 PRÓXIMOS PASSOS

```
👉 Item 4: Testes (15-20 min)
   └─ Usar: GUIA-TESTES-RESPONSIVIDADE.md

👉 Item 5: Integração (30-45 min)
   └─ Usar: GUIA-INTEGRACAO-CAIXA-BANCOS.md

👉 Item 6-8: Fluxo + Deploy (2-3h)
   └─ Usar: Análise + Componentes
```

---

**Criado**: 08 NOV 2025  
**Objetivo**: Acelerar próximas ações  
**Uso**: Copy & Paste comandos conforme necessário
