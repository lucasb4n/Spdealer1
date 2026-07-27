-- V20260707_01__add_entrada_mercadoria_menu.sql
-- Adiciona "Entrada de Mercadoria" como filho do menu Compras (Peças)
-- Compatível com Flyway e execução manual

START TRANSACTION;

-- 1) Programa de permissão
INSERT INTO programs (codigo, descricao, tipo, rota, ativo, created_at, updated_at)
SELECT 'PECAS.COMPRAS.ENTRADA', 'Entrada de Mercadoria', 'M', '/pecas/compras/entrada-mercadoria', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE codigo = 'PECAS.COMPRAS.ENTRADA');

-- 2) Encontrar o item pai (Compras) - item do grupo Peças (menu_group_id = 2)
SET @compras_parent_id = (SELECT id FROM menu_items WHERE nome = 'Compras' AND menu_group_id = 2 LIMIT 1);

-- 3) Item de menu (filho de Compras)
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, requer_permissao, created_at, updated_at)
VALUES (1704, 2, 'PECAS.COMPRAS.ENTRADA', 'Entrada de Mercadoria', '/pecas/compras/entrada-mercadoria', 'fa-truck-loading', 4, @compras_parent_id, 'PECAS.COMPRAS.ENTRADA', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE rota='/pecas/compras/entrada-mercadoria', nome='Entrada de Mercadoria', icone='fa-truck-loading', updated_at=NOW();

-- 4) Visibilidade para admin (usuário ID 1)
INSERT INTO user_menu_config (usuario_id, menu_item_id, visivel, created_at, updated_at)
SELECT 1, 1704, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_menu_config WHERE usuario_id = 1 AND menu_item_id = 1704);

-- 5) Permissão para grupo Administradores (group_id = 1)
INSERT INTO user_group_permissions (group_id, program_id, permitido, created_at, updated_at)
SELECT 1, id, 1, NOW(), NOW()
FROM programs
WHERE codigo = 'PECAS.COMPRAS.ENTRADA'
AND NOT EXISTS (SELECT 1 FROM user_group_permissions WHERE group_id = 1 AND program_id = (SELECT id FROM programs WHERE codigo = 'PECAS.COMPRAS.ENTRADA'));

COMMIT;
