-- V20260411_01__add_visual_management_routines.sql
-- Adiciona rotas de Monitor de NFe, Orçamentos e NFSe
-- Reestruturado: Peças -> Vendas -> (Orçamentos, NFSe)

START TRANSACTION;

-- 1) Garantir Grupos de Menu (Mantendo Comercial/Fiscal se precisar depois, mas o foco é Peças)
INSERT INTO menu_groups (id, codigo, nome, icone, ordem, ativo, created_at, updated_at)
VALUES 
  (16, 'COMERCIAL', 'Comercial', 'fa-shopping-cart', 1, 1, NOW(), NOW()),
  (17, 'FISCAL', 'Fiscal', 'fa-file-invoice-dollar', 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();

-- 2) Criar o Agrupador "Vendas" dentro do grupo "Peças" (ID 2)
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, ativo, requer_permissao, created_at, updated_at)
VALUES (1600, 2, 'CAT.VENDAS', 'Vendas', '/vendas/geral', 'fa-cart-plus', 4, NULL, 1, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE menu_group_id=2, updated_at=NOW();

-- 3) Inserir Programas (Cadastro de Permissões)
INSERT INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo, created_at, updated_at)
VALUES 
  ('VENDAS.ORCAMENTO', 'Gestão de Orçamentos e Pedidos', 'M', '/vendas/orcamento', 'fa-file-alt', 1, 1, NOW(), NOW()),
  ('FISCAL.MONITOR_NFE', 'Monitor de Notas Fiscais Eletrônicas', 'M', '/nfe/monitor', 'fa-broadcast-tower', 1, 1, NOW(), NOW()),
  ('FISCAL.MONITOR_NFSE', 'Monitor de Notas de Serviço (Gerencial)', 'M', '/gerencial/nfse', 'fa-city', 2, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();

-- 4) Inserir/Atualizar Itens de Menu filhos de "Vendas"
-- Orçamentos / Pedidos
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, requer_permissao, created_at, updated_at)
VALUES (1601, 2, 'MENU.ORCAMENTO', 'Orçamentos / Pedidos', '/vendas/orcamento', 'fa-file-signature', 1, 1600, 'VENDAS.ORCAMENTO', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE menu_group_id=2, parent_id=1600, nome=VALUES(nome), updated_at=NOW();

-- NFSe (Nota Fiscal de Serviço)
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, requer_permissao, created_at, updated_at)
VALUES (1702, 2, 'MENU.NFSE', 'NFSe (Nota Fiscal de Serviço)', '/gerencial/nfse', 'fa-building', 2, 1600, 'FISCAL.MONITOR_NFSE', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE menu_group_id=2, parent_id=1600, nome=VALUES(nome), updated_at=NOW();

-- Monitor NFe (Deixamos no menu Fiscal para conveniência)
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, requer_permissao, created_at, updated_at)
VALUES (1701, 17, 'MENU.MONITOR_NFE', 'Monitor de NF-e', '/nfe/monitor', 'fa-desktop', 1, NULL, 'FISCAL.MONITOR_NFE', 1, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at=NOW();

-- 5) Vincular Permissões ao Grupo Administradores (ID 1)
SET @prog_orc = (SELECT id FROM programs WHERE codigo = 'VENDAS.ORCAMENTO' LIMIT 1);
SET @prog_nfe = (SELECT id FROM programs WHERE codigo = 'FISCAL.MONITOR_NFE' LIMIT 1);
SET @prog_nfse = (SELECT id FROM programs WHERE codigo = 'FISCAL.MONITOR_NFSE' LIMIT 1);

INSERT INTO user_group_permissions (group_id, program_id, permitido, created_at, updated_at)
VALUES 
  (1, @prog_orc, 1, NOW(), NOW()),
  (1, @prog_nfe, 1, NOW(), NOW()),
  (1, @prog_nfse, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE permitido=1, updated_at=NOW();

-- 6) Configurar Menu Visível para o Usuário Admin (ID 1)
INSERT INTO user_menu_config (usuario_id, menu_item_id, visivel, ordem, created_at, updated_at)
VALUES 
  (1, 1600, 1, 4, NOW(), NOW()),
  (1, 1601, 1, 1, NOW(), NOW()),
  (1, 1701, 1, 2, NOW(), NOW()),
  (1, 1702, 1, 3, NOW(), NOW())
ON DUPLICATE KEY UPDATE visivel=1, updated_at=NOW();

COMMIT;
