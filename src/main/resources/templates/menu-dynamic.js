// menu-dynamic.js
// Carrega menu dinâmico do endpoint /api/menu e renderiza na sidebar

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/menu')
        .then(response => response.json())
        .then(data => {
            renderMenu(data);
        })
        .catch(err => {
            console.error('Erro ao carregar menu dinâmico:', err);
        });
});

function renderMenu(menu) {
    const sidebar = document.querySelector('.sidebar nav');
    if (!sidebar || !menu.groups) return;
    sidebar.innerHTML = '';
    const seenGroups = new Set();
    menu.groups.forEach(group => {
        if (!group.visible) return;
        // normalize group name to remove accentuation and case differences to avoid visual duplicates
        const rawName = (group.groupName || '').trim();
        const normalizedName = rawName.normalize ? rawName.normalize('NFD').replace(/\p{Diacritic}/u, '') : rawName.replace(/[\u0300-\u036f]/g, '');
        const keyName = normalizedName.toLowerCase();
        const groupKey = keyName + '::' + (group.route || '');
        if (seenGroups.has(groupKey)) return; // evita duplicação visual quando o mesmo grupo aparece mais de uma vez
        seenGroups.add(groupKey);
        const groupDiv = document.createElement('div');
        groupDiv.className = 'menu-group';
        // Se o grupo tiver uma rota (ex: criado como item por engano), torne o cabeçalho clicável
        const groupHref = group.route || `#${group.groupName}`;
        groupDiv.innerHTML = `
            <a class="nav-link" href="${groupHref}">
                <i class="${group.groupIcon || 'fas fa-folder'}"></i> ${group.groupName}
            </a>
        `;
        // Itens do grupo
        if (group.items && group.items.length > 0) {
            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'ps-3 menu-group-items';
            group.items.forEach(item => {
                if (!item.visible) return;
                itemsDiv.innerHTML += `
                    <a class="nav-link" href="${item.route || '#'}">
                        <i class="${item.itemIcon || 'fas fa-file'}"></i> ${item.itemName}
                    </a>
                `;
            });
            groupDiv.appendChild(itemsDiv);
        }
        sidebar.appendChild(groupDiv);
    });
    // Adiciona logout fixo somente se não existir já no template
    if (!document.querySelector('.sidebar .mt-auto') && !sidebar.querySelector('a.nav-link[href="/logout"]')) {
        sidebar.innerHTML += `<hr style="border-color: #34495e;"><a class="nav-link" href="/logout"><i class="fas fa-sign-out-alt"></i> Sair</a>`;
    }
}
