import React, { useEffect, useState } from 'react';

// Formulário de administração de menu por usuário
interface MenuGroup { id: number; nome: string }
interface MenuItem { id: number; grupo_id: number; nome: string; rota: string }
interface UserMenuConfig { menu_item_id: number; visivel: boolean; ordem: number }

export const MenuAdminForm: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | string | null>(null);
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [config, setConfig] = useState<Record<number, UserMenuConfig>>({});
  const [duplicateTarget, setDuplicateTarget] = useState<number | null>(null);

  useEffect(() => {
    // Tenta carregar usuários do endpoint administrativo; se falhar, carrega da tabela auxiliar masusu
    const load = async () => {
      try {
        const resp = await fetch('/api/admin/users');
        if (resp.ok) {
          const data = await resp.json();
          setUsers(data);
          return;
        }
      } catch (e) {
        console.debug('api/admin/users não disponível, tentando masusu');
      }

      try {
        const resp2 = await fetch('/api/tabelas-auxiliares/masusu');
        if (resp2.ok) {
          const list = await resp2.json();
          // mapear para shape { id, login, nome }
          const mapped = list.map((x: any) => ({ id: x.codigo, login: x.codigo, nome: x.descricao }));
          setUsers(mapped);
          return;
        }
      } catch (e) {
        console.error('Erro ao carregar masusu:', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    fetch('/api/menu/groups').then(r => r.json()).then(setGroups).catch(e => console.debug(e));
    fetch('/api/menu/items').then(r => r.json()).then(setItems).catch(e => console.debug(e));
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetch(`/api/admin/user-menu-config?usuarioId=${selectedUser}`)
        .then(r => r.json())
        .then((list: UserMenuConfig[]) => {
          const map: any = {};
          if (Array.isArray(list)) {
            list.forEach(l => map[l.menu_item_id] = l);
          }
          setConfig(map);
        })
        .catch(e => console.debug(e));
    }
  }, [selectedUser]);

  const toggleVisivel = (itemId: number) => {
    setConfig(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { menu_item_id: itemId, visivel: false, ordem: 0 }),
        visivel: !(prev[itemId]?.visivel)
      }
    }));
  };

  const handleOrdemChange = (itemId: number, ordemVal: number) => {
    setConfig(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { menu_item_id: itemId, visivel: true, ordem: 0 }),
        ordem: ordemVal
      }
    }));
  };

  const save = async () => {
    if (!selectedUser) return alert('Selecione um usuário');
    const itemsArray = Object.values(config);
    try {
      const resp = await fetch('/api/admin/user-menu-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: selectedUser, items: itemsArray })
      });
      if (resp.ok) {
        alert('Configurações salvas com sucesso');
      } else {
        alert('Falha ao salvar permissões de menu');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar permissões');
    }
  };

  const handleDuplicateToUser = async () => {
    if (!selectedUser || !duplicateTarget) return alert('Selecione os usuários de origem e destino');
    try {
      const resp = await fetch('/api/admin/user-menu-config/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUserId: selectedUser, targetUserId: duplicateTarget })
      });
      if (resp.ok) {
        alert('Configurações duplicadas com sucesso!');
      } else {
        alert('Erro ao duplicar configurações');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao duplicar');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Administração de Menu por Usuário</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8, fontWeight: 'bold' }}>Selecione o Usuário:</label>
        <select
          value={selectedUser ?? ''}
          onChange={e => setSelectedUser(e.target.value ? e.target.value : null)}
          style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="">-- Selecione --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.login || u.nome} ({u.nome})</option>
          ))}
        </select>
      </div>

      {groups.map(g => {
        const groupItems = items.filter(i => i.grupo_id === g.id);
        if (!groupItems.length) return null;
        return (
          <div key={g.id} style={{ marginBottom: 20, border: '1px solid #e2e8f0', borderRadius: 6, padding: 12 }}>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: 4 }}>{g.nome}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Item</th>
                  <th style={{ padding: 8 }}>Rota</th>
                  <th style={{ padding: 8, width: 80 }}>Visível</th>
                  <th style={{ padding: 8, width: 100 }}>Ordem</th>
                </tr>
              </thead>
              <tbody>
                {groupItems.map(item => {
                  const cfg = config[item.id] || { visivel: true, ordem: 0 };
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: 8 }}>{item.nome}</td>
                      <td style={{ padding: 8, color: '#64748b', fontSize: '0.9em' }}>{item.rota}</td>
                      <td style={{ padding: 8 }}>
                        <input
                          type="checkbox"
                          checked={!!cfg.visivel}
                          onChange={() => toggleVisivel(item.id)}
                        />
                      </td>
                      <td style={{ padding: 8 }}>
                        <input
                          type="number"
                          value={cfg.ordem || 0}
                          onChange={e => handleOrdemChange(item.id, parseInt(e.target.value) || 0)}
                          style={{ width: 60, padding: 4 }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={save}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Salvar Permissões
        </button>
        {selectedUser ? (
          <span style={{ marginLeft: 12 }}>
            <label style={{ marginRight: 6 }}>Duplicar para:</label>
            <select
              value={duplicateTarget ?? ''}
              onChange={e => setDuplicateTarget(e.target.value ? Number(e.target.value) : null)}
              style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="">-- Selecione usuário destino --</option>
              {users.filter(u => u.id !== selectedUser).map(u => (
                <option key={u.id} value={u.id}>{u.login || u.nome}</option>
              ))}
            </select>
            <button
              style={{ marginLeft: 8, padding: '6px 12px', cursor: 'pointer' }}
              onClick={handleDuplicateToUser}
            >
              Duplicar
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default MenuAdminForm;
