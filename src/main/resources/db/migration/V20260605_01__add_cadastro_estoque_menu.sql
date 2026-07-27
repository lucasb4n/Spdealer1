-- V20260605_01__add_cadastro_estoque_menu.sql
-- Adiciona "Cadastro de Estoque" como filho do menu Peças (ID 1703, pai=2)
-- Compatível com Flyway e execução manual

START TRANSACTION;

-- 1) Programa de permissão
INSERT INTO programs (codigo, descricao, tipo, rota, ativo, created_at, updated_at)
SELECT 'PECAS.ESTOQUE', 'Cadastro de Estoque', 'M', '/pecas/cadastro-estoque', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE codigo = 'PECAS.ESTOQUE');

-- 2) Item de menu (filho do item Peças cujo parent_id IS NULL AND menu_group_id = 2)
-- Usa ON DUPLICATE KEY para corrigir rota caso já exista (id=1703)
SET @pecas_parent_id = (SELECT id FROM menu_items WHERE nome = 'Peças' AND menu_group_id = 2 AND parent_id IS NULL LIMIT 1);
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, requer_permissao, created_at, updated_at)
VALUES (1703, 2, 'PECAS.ESTOQUE', 'Cadastro de Estoque', '/pecas/cadastro-estoque', 'fa-warehouse', 3, @pecas_parent_id, 'PECAS.ESTOQUE', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE rota='/pecas/cadastro-estoque', nome='Cadastro de Estoque', icone='fa-warehouse', updated_at=NOW();

-- 3) Visibilidade para admin
INSERT INTO user_menu_config (usuario_id, menu_item_id, visivel, created_at, updated_at)
SELECT 1, 1703, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_menu_config WHERE usuario_id = 1 AND menu_item_id = 1703);

-- 4) Permissão para grupo Administradores
INSERT INTO user_group_permissions (group_id, program_id, permitido, created_at, updated_at)
SELECT 1, id, 1, NOW(), NOW()
FROM programs
WHERE codigo = 'PECAS.ESTOQUE'
AND NOT EXISTS (SELECT 1 FROM user_group_permissions WHERE group_id = 1 AND program_id = (SELECT id FROM programs WHERE codigo = 'PECAS.ESTOQUE'));

COMMIT;
