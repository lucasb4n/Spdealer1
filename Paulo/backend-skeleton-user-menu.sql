-- Script exemplo para inserir/atualizar menu item e dar visibilidade para admin
START TRANSACTION;

SET @GROUP_ID = (SELECT id FROM menu_groups WHERE codigo = 'PARAM' LIMIT 1);
SET @ADMIN_USER_ID = (SELECT codigo_usu FROM users WHERE login_usu = 'admin' LIMIT 1);

-- Exemplo: garantir item Tipos de Fornecedores em Parâmetros->Geral
INSERT INTO menu_items (grupo_id, codigo, nome, rota, icone, ordem, ativo, parent_id, requer_permissao, permissao_codigo)
SELECT
  @GROUP_ID,
  'PARAM.TIPOS_FORNECEDORES',
  'Tipos de Fornecedores',
  '/parametros/tipos-fornecedores',
  'category',
  COALESCE((SELECT MAX(m.ordem) + 1 FROM menu_items m WHERE m.parent_id = (
      SELECT id FROM menu_items WHERE codigo = 'GERAL' AND grupo_id = @GROUP_ID
  )), 1),
  1,
  (SELECT id FROM menu_items WHERE codigo = 'GERAL' AND grupo_id = @GROUP_ID),
  1,
  NULL
WHERE NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.codigo = 'PARAM.TIPOS_FORNECEDORES');

-- Tornar visível para admin (inserir user_menu_config se necessário)
INSERT INTO user_menu_config (usuario_id, menu_item_id, visivel, ordem)
SELECT @ADMIN_USER_ID, mi.id, 1, mi.ordem
FROM menu_items mi
WHERE mi.codigo = 'PARAM.TIPOS_FORNECEDORES'
  AND NOT EXISTS (
    SELECT 1 FROM user_menu_config umc WHERE umc.usuario_id = @ADMIN_USER_ID AND umc.menu_item_id = mi.id
  );

COMMIT;
