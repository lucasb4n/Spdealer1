(async () => {
  const base = 'http://localhost:8080';
  const endpoints = [
    ['REPARO','/api/refatorado/reparo'],
    ['MASFAB','/api/tabelas-auxiliares/masfab'],
    ['TMO','/api/servico/manutencao/tipo-tmo'],
    ['ESTOQUE','/api/estoque/produtos?fab=8&limit=20']
  ];

  for (const [label, path] of endpoints) {
    try {
      const url = base + path;
      const res = await fetch(url);
      const text = await res.text();
      console.log('---' + label + '---');
      console.log(text);
    } catch (e) {
      console.error('ERROR fetching', label, e && e.message ? e.message : e);
    }
  }
})();
