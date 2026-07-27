-- V20260411_02__add_nfe_saida_shortcut.sql
-- Adiciona atalho do relatório NFe de Saídas Emitidas em Peças -> Vendas

START TRANSACTION;

-- 1) Criar o Atalho para NFe de Saídas Emitidas em Peças -> Vendas
-- Usamos o ID 1602 para ficar logo abaixo da NFSe (1702/1600)
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, requer_permissao, created_at, updated_at)
VALUES (1602, 2, 'REL.NFE_SAIDA', 'Nfe de Saídas Emitidas', '/financeiro/nfe_Saida', 'fa-file-export', 3, 1600, 'FINANCEIRO.NFE_SAIDA', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE menu_group_id=2, parent_id=1600, ordem=3, updated_at=NOW();

-- 2) Garantir visibilidade para o admin (ID 1)
INSERT INTO user_menu_config (usuario_id, menu_item_id, visivel, ordem, created_at, updated_at)
VALUES (1, 1602, 1, 3, NOW(), NOW())
ON DUPLICATE KEY UPDATE visivel=1, updated_at=NOW();

-- 3) Garantir permissão para o grupo Administradores (ID 1)
INSERT INTO programs (codigo, descricao, tipo, rota, ativo, created_at, updated_at)
VALUES ('FINANCEIRO.NFE_SAIDA', 'Relatório de NFe de Saídas Emitidas', 'R', '/financeiro/nfe_Saida', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();

SET @prog_id = (SELECT id FROM programs WHERE codigo = 'FINANCEIRO.NFE_SAIDA' LIMIT 1);
INSERT INTO user_group_permissions (group_id, program_id, permitido, created_at, updated_at)
VALUES (1, @prog_id, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE permitido=1, updated_at=NOW();

COMMIT;
