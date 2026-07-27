-- Migration: Adiciona programa e item de menu para Admin Menu Builder
START TRANSACTION;

-- 1) Inserir program (se já existir, atualiza)
INSERT INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo, created_at, updated_at)
VALUES ('ADMIN.MENU_BUILDER', 'Menu Builder - Administração do Menu', 'M', '/admin/menu-builder', 'fa-cogs', 4, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE descricao = VALUES(descricao), rota = VALUES(rota), icone = VALUES(icone), ordem = VALUES(ordem), ativo = VALUES(ativo), updated_at = NOW();

-- Recupera id do program (opcional)
SET @program_codigo = 'ADMIN.MENU_BUILDER';
SELECT id INTO @program_id FROM programs WHERE codigo = @program_codigo LIMIT 1;

-- 2) Inserir menu_item para o program (usa menu_group_id = 12 por padrão)
INSERT INTO menu_items (nome, rota, icone, ordem, ativo, permissao_codigo, menu_group_id, parent_id, created_at, updated_at)
VALUES ('Menu Builder', '/admin/menu-builder', 'fa-cogs', 10, 1, 'ADMIN.MENU_BUILDER', 12, NULL, NOW(), NOW())
ON DUPLICATE KEY UPDATE rota = VALUES(rota), icone = VALUES(icone), ordem = VALUES(ordem), ativo = VALUES(ativo), permissao_codigo = VALUES(permissao_codigo), updated_at = NOW();

-- Recupera id do menu_item recém-criado
SET @menu_item_id = LAST_INSERT_ID();

-- 3) Garantir visibilidade para o usuário admin (usuário id = 1 por padrão)
INSERT INTO user_menu_config (usuario_id, menu_item_id, visivel, ordem, created_at, updated_at)
VALUES (1, @menu_item_id, TRUE, 10, NOW(), NOW())
ON DUPLICATE KEY UPDATE visivel = VALUES(visivel), ordem = VALUES(ordem), updated_at = NOW();

COMMIT;
