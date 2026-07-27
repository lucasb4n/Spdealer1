import React, { useState } from 'react';

const MenuJsonImporter: React.FC = () => {
  const [jsonPreview, setJsonPreview] = useState('');
  const [tsModule, setTsModule] = useState('');
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const txt = String(reader.result || '');
        const obj = JSON.parse(txt);
        const pretty = JSON.stringify(obj, null, 2);
        setJsonPreview(pretty);
        const ts = `// Gerado a partir de JSON importado\nconst menuAdminForm = ${pretty};\nexport default menuAdminForm;\n`;
        setTsModule(ts);
      } catch (err: any) {
        setError('Erro ao parsear JSON: ' + (err.message || err));
      }
    };
    reader.readAsText(f, 'utf8');
  };

  const copyToClipboard = async () => {
    if (!tsModule) return;
    try {
      await navigator.clipboard.writeText(tsModule);
      alert('Conteúdo copiado para área de transferência. Cole no editor CODE do FormBuilder.');
    } catch (e) {
      setError('Falha ao copiar para clipboard.');
    }
  };

  const downloadTs = () => {
    if (!tsModule) return;
    const blob = new Blob([tsModule], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu-admin-form.form.ts';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif' }}>
      <h3>Importador JSON → TS (FormBuilder)</h3>
      <p>Selecione um arquivo JSON do formulário; o componente gera um módulo `.ts` pronto para importar ou colar no editor CODE do FormBuilder.</p>
      <input type="file" accept="application/json" onChange={handleFile} />
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

      {jsonPreview && (
        <div style={{ marginTop: 12 }}>
          <h4>Preview (JSON)</h4>
          <textarea readOnly value={jsonPreview} rows={12} style={{ width: '100%' }} />
        </div>
      )}

      {tsModule && (
        <div style={{ marginTop: 12 }}>
          <h4>Módulo TypeScript gerado</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyToClipboard}>Copiar para clipboard</button>
            <button onClick={downloadTs}>Baixar .ts</button>
          </div>
          <textarea readOnly value={tsModule} rows={12} style={{ width: '100%', marginTop: 8 }} />
        </div>
      )}
    </div>
  );
};

export default MenuJsonImporter;
