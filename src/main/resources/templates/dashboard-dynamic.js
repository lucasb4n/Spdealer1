/* global Chart */
// dashboard-dynamic.js
// Carrega dados do dashboard dinâmico do endpoint /api/dashboard e renderiza na área central

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/dashboard')
        .then(response => response.json())
        .then(data => {
            renderDashboard(data);
        })
        .catch(err => {
            console.error('Erro ao carregar dashboard dinâmico:', err);
        });
});

function renderDashboard(data) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    mainContent.innerHTML = `
        <div class="row mb-4">
            <div class="col">
                <h1 class="h3">Dashboard</h1>
                <p class="text-muted">Bem-vindo de volta, <span>${data.usuario}</span>!</p>
            </div>
            <div class="col-auto">
                <span class="text-muted">Cargo: ${data.cargo}</span>
            </div>
        </div>
        <div class="row mb-4">
            <div class="col-md-3"><div class="card kpi-card"><div class="card-body text-center"><i class="fas fa-users fa-2x mb-3"></i><h4>${data.totalClientes}</h4><p class="mb-0">Total de Clientes</p></div></div></div>
            <div class="col-md-3"><div class="card kpi-card success"><div class="card-body text-center"><i class="fas fa-arrow-down fa-2x mb-3"></i><h4>${data.contasReceber}</h4><p class="mb-0">Contas a Receber</p></div></div></div>
            <div class="col-md-3"><div class="card kpi-card warning"><div class="card-body text-center"><i class="fas fa-arrow-up fa-2x mb-3"></i><h4>${data.contasPagar}</h4><p class="mb-0">Contas a Pagar</p></div></div></div>
            <div class="col-md-3"><div class="card kpi-card info"><div class="card-body text-center"><i class="fas fa-cash-register fa-2x mb-3"></i><h4>${data.saldoCaixa}</h4><p class="mb-0">Saldo em Caixa</p></div></div></div>
        </div>
        <div class="row">
            <div class="col-md-8"><div class="card"><div class="card-header"><i class="fas fa-chart-line"></i> Vendas Mensais</div><div class="card-body"><div class="chart-container"><canvas id="vendasChart"></canvas></div></div></div></div>
            <div class="col-md-4"><div class="card"><div class="card-header"><i class="fas fa-chart-pie"></i> Status das Contas</div><div class="card-body"><div class="chart-container"><canvas id="statusChart"></canvas></div></div></div></div>
        </div>
        <div class="row mt-4"><div class="col-md-12"><div class="card"><div class="card-header"><i class="fas fa-clock"></i> Atividades Recentes</div><div class="card-body"><div class="list-group list-group-flush">${data.atividadesRecentes.map(a => `<div class="list-group-item"><strong>${a.tipo === 'cliente' ? 'Novo cliente cadastrado:' : a.tipo === 'recebimento' ? 'Conta recebida:' : a.tipo === 'venda' ? 'Nova venda:' : 'Conta vencida:'}</strong> ${a.nome || a.cliente || a.veiculo || ''} ${a.valor ? '- ' + a.valor : ''} <span class="text-muted">${a.tempo}</span></div>`).join('')}</div></div></div></div></div>
    `;
    renderCharts(data);
}

function renderCharts(data) {
    // Gráfico de Vendas Mensais
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js não está carregado, pulando renderização dos gráficos.');
        return;
    }

    const vendasCtx = document.getElementById('vendasChart').getContext('2d');
    new Chart(vendasCtx, {
        type: 'line',
        data: {
            labels: data.meses,
            datasets: [{
                label: 'Vendas (R$)',
                data: data.vendasMes,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    // Gráfico de Status das Contas
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Em Aberto', 'Pagas', 'Vencidas'],
            datasets: [{
                data: data.statusContas,
                backgroundColor: ['#f39c12', '#27ae60', '#e74c3c'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
