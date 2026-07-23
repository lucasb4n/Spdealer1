# Playwright E2E (scaffold)

Objetivo
- Integrar testes Playwright para navegar no sistema, validar resultados de consultas (AG-Grid) e testar ações como exportação de PDF.

Pré-requisitos
- Node.js (recomendado >= 16)
- Git Bash / PowerShell (no Windows usar PowerShell conforme instruções abaixo)
- Frontend e backend rodando localmente (ex.: `http://localhost:3000` frontend, `http://localhost:8080` backend)

Instalação e execução (PowerShell)
1. Abra PowerShell na raiz do projeto (`C:\Desenvolvimento\Seprocom\spdealer`).
2. Executar o script helper:

```powershell
.\playwright\run_playwright.ps1
```

Esse script executa `npx playwright install` para garantir browsers e então roda os testes.

Configuração
- `playwright/playwright.config.js` usa `process.env.BASE_URL` para alterar a base URL (padrão `http://localhost:3000`).
- Se a rota de relatórios for diferente, exporte a variável `REPORTS_PATH` antes de executar, por exemplo:

```powershell
$env:BASE_URL = 'http://localhost:3000';
$env:REPORTS_PATH = '/relatorios/financeiro';
.\playwright\run_playwright.ps1
```

Testes
- `playwright/tests/financeiro.spec.js` é um teste exemplo que:
  - navega até a página de relatórios financeiros
  - verifica se a AG-Grid está visível e tem linhas
  - se encontrar botão `Exportar PDF`, tenta baixar o PDF

Notas e dicas
- Recomendo iniciar o backend via `mvn spring-boot:run` e frontend (`npm start`) em terminais separados antes de executar os testes.
- Se o sistema exigir autenticação, adapte o teste para preencher o formulário de login (use `page.fill()` e `page.click()` antes de navegar para os relatórios).
- Para rodar em headless (ci), defina `BASE_URL` e adicione `--headed=false` ou ajuste `playwright.config.js`.
