const http = require('http');

(async () => {
  const url = 'http://localhost:8080/api/menu-groups/1';
  const res = await fetch(url).then(r => r.json()).catch(e => { console.error('fetch error', e); process.exit(1); });
  const mergedMenuGroups = JSON.parse(JSON.stringify(res || []));

  const manutencaoChildrenBase = [
    { name: 'Mecânicos', path: '/servico/manutencao/mecanicos', rota: '/servico/manutencao/mecanicos' },
    // Rota de listagem para Tipo de T.M.O
    { name: 'Manutenção de Tipo de T.M.O', path: '/servico/manutencao/tipo-tmo', rota: '/servico/manutencao/tipo-tmo' },
    { name: 'Tempo de Mão-de-Obra', path: '/servico/manutencao/tempo-mdo', rota: '/servico/manutencao/tempo-mdo' },
  ];

  mergedMenuGroups.forEach((g) => {
    const groupTitle = ((g.name || g.label) || '').toString().toLowerCase();
    const isServicoGroup = ['serviço', 'servico', 'serviços', 'servicos'].includes(groupTitle);
    if (isServicoGroup) {
      g.items = g.items || [];
      const existsInGroup = g.items.some((it) => ((it.name || '').toString().toLowerCase() === 'manutenção' || (it.name || '').toString().toLowerCase() === 'manutencao'));
      if (!existsInGroup) {
        const baseId = -Date.now();
        const manutencaoItem = {
          id: baseId,
          parentId: null,
          codigo: 'SERVICO.MANUTENCAO',
          name: 'Manutenção',
          descricao: 'Manutenção',
          icon: 'fa-wrench',
          // apontar para a listagem de Tipo de T.M.O por padrão
          route: '/servico/manutencao/tipo-tmo',
          path: '/servico/manutencao/tipo-tmo',
          rota: '/servico/manutencao/tipo-tmo',
          ordem: 99,
          nivel: 1,
          active: true,
          filhos: manutencaoChildrenBase.map((c, i) => ({
            id: baseId - (i + 1),
            parentId: baseId,
            codigo: `SERVICO.MANUTENCAO.${i+1}`,
            name: c.name,
            descricao: c.name,
            path: c.path,
            rota: c.rota,
            route: c.path,
            ordem: i,
            nivel: 2,
            active: true,
            filhos: []
          }))
        };
        g.items.push(manutencaoItem);
      }
    }

    (g.items || []).forEach((it) => {
      const title = ((it.name || it.descricao) || '').toString().toLowerCase();
      if (['serviço', 'servico', 'serviços', 'servicos'].includes(title)) {
        it.filhos = it.filhos || [];
        const existsManut = it.filhos.some((f) => ((f.name || '').toString().toLowerCase() === 'manutenção' || (f.name || '').toString().toLowerCase() === 'manutencao'));
        if (!existsManut) {
          const baseId = -Date.now();
          const manutencaoItem = {
            id: baseId,
            parentId: it.id || null,
            name: 'Manutenção',
            descricao: 'Manutenção',
                    icon: 'fa-wrench',
                    path: '/servico/manutencao/tipo-tmo',
                    rota: '/servico/manutencao/tipo-tmo',
            ordem: 0,
            filhos: manutencaoChildrenBase.map((c, i) => ({
              id: baseId - (i + 1),
              parentId: baseId,
              name: c.name,
              descricao: c.name,
              path: c.path,
              rota: c.rota,
              ordem: i,
              filhos: []
            }))
          };
          it.filhos.push(manutencaoItem);
        }
      }
    });
  });

  console.log(JSON.stringify(mergedMenuGroups, null, 2));
})();
