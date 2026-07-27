import React, { useEffect, useState } from 'react';

// Skeleton do formulário de administração de menu por usuário
// Uso: componente para o admin selecionar um usuário e marcar visibilidade/ordem

interface MenuGroup { id: number; nome: string }
interface MenuItem { id: number; grupo_id: number; nome: string; rota: string }
interface UserMenuConfig { menu_item_id: number; visivel: boolean; ordem: number }

export const MenuAdminForm: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | string | null>(null);
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [config, setConfig] = useState<Record<number, UserMenuConfig>>({});

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
  useEffect(() => { fetch('/api/menu/groups').then(r=>r.json()).then(setGroups); fetch('/api/menu/items').then(r=>r.json()).then(setItems); }, []);

  useEffect(() => {
    if (selectedUser) {
      fetch(`/api/admin/user-menu-config?usuarioId=${selectedUser}`).then(r=>r.json()).then((list: UserMenuConfig[]) => {
        const map: any = {};
        list.forEach(l => map[l.menu_item_id] = l);
        setConfig(map);
      });
    }
  }, [selectedUser]);

  const toggleVisivel = (itemId: number) => {
    setConfig(prev => ({ ...prev, [itemId]: { ...(prev[itemId]||{menu_item_id:itemId,visivel:false,ordem:0}), visivel: !(prev[itemId]?.visivel) } }));
  };

  const setOrdem = (itemId: number, ordem: number) => {
    setConfig(prev => ({ ...prev, [itemId]: { ...(prev[itemId]||{menu_item_id:itemId,visivel:false,ordem}), ordem } }));
  };

  const save = async () => {
    if (!selectedUser) return alert('Selecione um usuário');
    const payload = Object.values(config).map((c: any) => ({ ...c, usuario_id: selectedUser }));
    await fetch('/api/admin/user-menu-config', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    alert('Configuração salva');
  };

  const [duplicateTarget, setDuplicateTarget] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const handleDuplicateToUser = async () => {
    if (!selectedUser) return alert('Selecione o usuário de origem');
    if (!duplicateTarget) return alert('Selecione o usuário destino');
    if (duplicateTarget === selectedUser) return alert('Usuário destino deve ser diferente do usuário de origem');

    const confirm = window.confirm('Deseja realmente duplicar as configurações (menu + permissões) do usuário selecionado para o usuário destino? Isso sobrescreverá as configurações atuais do usuário destino.');
    if (!confirm) return;

    // 1) Duplicar user_menu_config
    const payloadMenu = Object.values(config).map((c: any) => ({ ...c, usuario_id: duplicateTarget }));
    setIsLoading(true);
    try {
      const respMenu = await fetch('/api/admin/user-menu-config', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payloadMenu) });
      if (!respMenu.ok) {
        const text = await respMenu.text();
        setToast({ type: 'error', text: 'Erro ao duplicar configurações de menu: ' + text });
        setIsLoading(false);
        return;
      }
    } catch (e) {
      setToast({ type: 'error', text: 'Erro ao conectar ao endpoint de menu: ' + String(e) });
      setIsLoading(false);
      return;
    }

    // 2) Duplicar permissões (se existir endpoint)
    try {
      const respPerm = await fetch(`/api/user-permissions/${selectedUser}`);
      if (respPerm.ok) {
        const perms = await respPerm.json();
        // PUT para o usuário destino
        const putResp = await fetch(`/api/user-permissions/${duplicateTarget}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(perms) });
        if (!putResp.ok) {
          const t = await putResp.text();
          console.warn('Permissões não foram duplicadas completamente: ' + t);
        }
      } else {
        console.debug('Nenhuma permissão encontrada para o usuário origem ou endpoint indisponível');
      }
    } catch (e) {
      console.debug('Erro ao duplicar permissões:', e);
    }

    // Registrar auditoria (tenta envios — falhas não bloqueiam)
    try {
      await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DUPLICATE_USER_MENU',
          fromUser: selectedUser,
          toUser: duplicateTarget,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      console.debug('Falha ao enviar audit log: ', e);
    }

    setIsLoading(false);
    setToast({ type: 'success', text: 'Duplicação concluída' });
  };

  return (
    <div>
      <h2>Administração de Menu por Usuário</h2>
      {/* Toast */}
      {toast ? (
        <div style={{ position: 'fixed', top: 16, right: 16, padding: 12, backgroundColor: toast.type === 'success' ? '#d4edda' : toast.type === 'error' ? '#f8d7da' : '#d1ecf1', border: '1px solid #ccc', borderRadius: 4 }}>
          {toast.text}
          <button style={{ marginLeft: 8 }} onClick={() => setToast(null)}>x</button>
        </div>
      ) : null}

      {/* Spinner simples */}
      {isLoading ? (
        <div style={{ position: 'fixed', top: 8, left: 8, padding: 8, background: '#fff', border: '1px solid #ccc' }}>Processando...</div>
      ) : null}
      <div>
        <label>Usuário</label>
        <select onChange={e => setSelectedUser(Number(e.target.value))}>
          <option value="">-- selecione --</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.login || u.nome}</option>)}
        </select>
      </div>

      {groups.map(g => (
        <div key={g.id} style={{ border: '1px solid #ddd', marginTop: 8, padding: 8 }}>
          <h4>{g.nome}</h4>
          <table>
            <thead><tr><th>Nome</th><th>Visível</th><th>Ordem</th></tr></thead>
            <tbody>
              {items.filter(i => i.grupo_id === g.id).map(i => (
                <tr key={i.id}>
                  <td>{i.nome}</td>
                  <td><input type="checkbox" checked={!!config[i.id]?.visivel} onChange={() => toggleVisivel(i.id)} /></td>
                  <td><input type="number" value={config[i.id]?.ordem ?? 0} onChange={(e)=>setOrdem(i.id, Number(e.target.value))} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div style={{ marginTop: 16 }}>
        <button onClick={save}>Salvar</button>
        {/* Duplicar configuração para outro usuário */}
        {selectedUser ? (
          <span style={{ marginLeft: 12 }}>
            <label style={{ marginRight: 6 }}>Duplicar para</label>
            <select value={duplicateTarget ?? ''} onChange={e => setDuplicateTarget(e.target.value ? Number(e.target.value) : null)}>
              <option value="">-- selecione usuário destino --</option>
              {users.filter(u => u.id !== selectedUser).map(u => (
                <option key={u.id} value={u.id}>{u.login || u.nome}</option>
              ))}
            </select>
            <button style={{ marginLeft: 8 }} onClick={handleDuplicateToUser}>Duplicar</button>
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default MenuAdminForm;
