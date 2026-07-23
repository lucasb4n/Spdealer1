// dashboard-config.js
// Builder visual para dashboard: drag-and-drop, preview e geração de JSON

const previewArea = document.getElementById('preview-area');
const jsonArea = document.getElementById('json-area');
const widgetList = document.getElementById('widget-list');
let dashboardConfig = [];
let selectedWidgetIdx = null;

widgetList.querySelectorAll('.widget-card').forEach(card => {
    card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('widget-type', card.dataset.type);
    });
});

previewArea.addEventListener('dragover', e => {
    e.preventDefault();
    previewArea.style.background = '#eaf6ff';
});
previewArea.addEventListener('dragleave', e => {
    previewArea.style.background = '#fff';
});
previewArea.addEventListener('drop', e => {
    e.preventDefault();
    previewArea.style.background = '#fff';
    const type = e.dataTransfer.getData('widget-type');
    addWidget(type);
});

function addWidget(type) {
    const idx = dashboardConfig.length;
    let widget = { type, id: Date.now(), dataSource: '' };
    switch(type) {
        case 'card':
            widget.title = 'Novo Card';
            widget.value = '123';
            break;
        case 'chart':
            widget.title = 'Gráfico';
            widget.data = [10,20,30];
            break;
        case 'kpi':
            widget.title = 'KPI';
            widget.value = 'R$ 1.000,00';
            break;
        case 'list':
            widget.title = 'Lista';
            widget.items = ['Item 1','Item 2'];
            break;
    }
    dashboardConfig.push(widget);
    renderPreview();
    renderJSON();
}

function renderPreview() {
    previewArea.innerHTML = '';
    dashboardConfig.forEach((w, i) => {
        let el = document.createElement('div');
        el.className = 'widget-card';
        el.innerHTML = `<strong>${w.title}</strong> <span class='badge bg-info'>${w.type}</span> <button class='btn btn-sm btn-danger float-end' onclick='removeWidget(${i})'>Remover</button> <button class='btn btn-sm btn-primary float-end me-2' onclick='selectWidget(${i})'>Configurar Dados</button>`;
        previewArea.appendChild(el);
    });
    if (dashboardConfig.length === 0) {
        previewArea.innerHTML = '<span class="text-muted">Arraste widgets aqui para montar seu dashboard</span>';
    }
    renderWidgetDataConfig();
}

function renderJSON() {
    jsonArea.textContent = JSON.stringify(dashboardConfig, null, 2);
}

window.selectWidget = function(idx) {
    selectedWidgetIdx = idx;
    renderWidgetDataConfig();
}

function renderWidgetDataConfig() {
    const area = document.getElementById('widget-data-config');
    area.innerHTML = '';
    if (selectedWidgetIdx === null || dashboardConfig.length === 0) {
        area.innerHTML = '<span class="text-muted">Selecione um widget para configurar os dados.</span>';
        return;
    }
    const widget = dashboardConfig[selectedWidgetIdx];
    area.innerHTML = `<div class='mb-2'><strong>Configurar dados para: ${widget.title}</strong></div>
        <label>Fonte de Dados:</label>
        <select class='form-select mb-2' id='data-source-select'>
            <option value='clientes'>Clientes</option>
            <option value='receber'>Contas a Receber</option>
            <option value='pagar'>Contas a Pagar</option>
            <option value='caixa'>Caixa</option>
            <option value='vendas'>Vendas</option>
            <option value='leads'>Leads</option>
        </select>
        <button class='btn btn-sm btn-success' id='btn-save-data'>Salvar Fonte</button>`;
    document.getElementById('data-source-select').value = widget.dataSource || '';
    document.getElementById('btn-save-data').onclick = function() {
        widget.dataSource = document.getElementById('data-source-select').value;
        renderJSON();
        alert('Fonte de dados salva para o widget!');
    };
}

window.removeWidget = function(idx) {
    dashboardConfig.splice(idx,1);
    renderPreview();
    renderJSON();
}

document.getElementById('btn-save').addEventListener('click', function() {
    alert('Configuração salva! (mock)\n\nJSON gerado:\n' + JSON.stringify(dashboardConfig, null, 2));
    // TODO: Enviar para backend via POST
});
