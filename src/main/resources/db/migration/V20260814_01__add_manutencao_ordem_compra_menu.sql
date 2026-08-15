-- V20260814_01__add_manutencao_ordem_compra_menu.sql
-- Adiciona "Manutenção de ordem de compra" como filho do menu Compras (Peças)
-- Compatível com Flyway e execução manual

START TRANSACTION;

-- 1) Programa de permissão
INSERT INTO programs (codigo, descricao, tipo, rota, ativo, created_at, updated_at)
SELECT 'PECAS.COMPRAS.MANUTENCAO_ORDEM', 'Manutenção de Ordem de Compra', 'M', '/pecas/compras/manutencao-ordem-compra', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE codigo = 'PECAS.COMPRAS.MANUTENCAO_ORDEM');

-- 2) Encontrar o item pai (Compras) - item do grupo Peças (menu_group_id = 2)
SET @compras_parent_id = (SELECT id FROM menu_items WHERE nome = 'Compras' AND menu_group_id = 2 LIMIT 1);

-- 3) Item de menu (filho de Compras)
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, requer_permissao, created_at, updated_at)
VALUES (1705, 2, 'PECAS.COMPRAS.MANUTENCAO_ORDEM', 'Manutenção de ordem de compra', '/pecas/compras/manutencao-ordem-compra', 'fa-file-signature', 5, @compras_parent_id, 'PECAS.COMPRAS.MANUTENCAO_ORDEM', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE rota='/pecas/compras/manutencao-ordem-compra', nome='Manutenção de ordem de compra', icone='fa-file-signature', updated_at=NOW();

-- 4) Visibilidade para admin (usuário ID 1)
INSERT INTO user_menu_config (usuario_id, menu_item_id, visivel, created_at, updated_at)
SELECT 1, 1705, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_menu_config WHERE usuario_id = 1 AND menu_item_id = 1705);

-- 5) Permissão para grupo Administradores (group_id = 1)
INSERT INTO user_group_permissions (group_id, program_id, permitido, created_at, updated_at)
SELECT 1, id, 1, NOW(), NOW()
FROM programs
WHERE codigo = 'PECAS.COMPRAS.MANUTENCAO_ORDEM'
AND NOT EXISTS (SELECT 1 FROM user_group_permissions WHERE group_id = 1 AND program_id = (SELECT id FROM programs WHERE codigo = 'PECAS.COMPRAS.MANUTENCAO_ORDEM'));

COMMIT;
