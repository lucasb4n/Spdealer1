-- ============================================================
-- Script para criar Menu Peças com submódulos e Monitor NFe
-- Execute no banco de dados erp_des (MariaDB - localhost)
-- ============================================================

-- 1. Criar grupo "Peças" (se não existir)
INSERT INTO menu_groups (nome, icone, ordem, ativo, created_at, updated_at)
SELECT 'Peças', 'fa-box', 30, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM menu_groups WHERE nome = 'Peças');

-- Obter ID do grupo Peças
SET @pecas_group_id = (SELECT id FROM menu_groups WHERE nome = 'Peças' LIMIT 1);

-- 2. Criar item "Peças" (filho do grupo) - parent_id = NULL
INSERT INTO menu_items (nome, rota, icone, ordem, ativo, created_at, updated_at, group_id, permissao_codigo, requer_permissao, parent_id)
SELECT 'Peças', '/pecas', 'fa-box-open', 1, true, NOW(), NOW(), @pecas_group_id, 'PECAS.VISUALIZAR', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE nome = 'Peças' AND group_id = @pecas_group_id AND parent_id IS NULL);

-- Obter ID do item Peças
SET @pecas_item_id = (SELECT id FROM menu_items WHERE nome = 'Peças' AND group_id = @pecas_group_id AND parent_id IS NULL LIMIT 1);

-- 3. Criar item "Compras" (filho de Peças) - parent_id = @pecas_item_id
INSERT INTO menu_items (nome, rota, icone, ordem, ativo, created_at, updated_at, group_id, permissao_codigo, requer_permissao, parent_id)
SELECT 'Compras', '/pecas/compras', 'fa-shopping-cart', 2, true, NOW(), NOW(), @pecas_group_id, 'PECAS.COMPRAS.VISUALIZAR', true, @pecas_item_id
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE nome = 'Compras' AND group_id = @pecas_group_id AND parent_id = @pecas_item_id);

-- Obter ID do item Compras
SET @compras_item_id = (SELECT id FROM menu_items WHERE nome = 'Compras' AND group_id = @pecas_group_id AND parent_id = @pecas_item_id LIMIT 1);

-- 4. Criar item "Ordem de Compra" (filho de Compras) - parent_id = @compras_item_id
INSERT INTO menu_items (nome, rota, icone, ordem, ativo, created_at, updated_at, group_id, permissao_codigo, requer_permissao, parent_id)
SELECT 'Ordem de Compra', '/pecas/compras/ordem-compra', 'fa-file-alt', 1, true, NOW(), NOW(), @pecas_group_id, 'PECAS.COMPRAS.ORDEM', true, @compras_item_id
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE nome = 'Ordem de Compra' AND group_id = @pecas_group_id AND parent_id = @compras_item_id);

-- 5. Criar item "Entrada de Mercadorias" (filho de Compras) - parent_id = @compras_item_id
INSERT INTO menu_items (nome, rota, icone, ordem, ativo, created_at, updated_at, group_id, permissao_codigo, requer_permissao, parent_id)
SELECT 'Entrada de Mercadorias', '/pecas/compras/entrada-mercadorias', 'fa-truck-loading', 2, true, NOW(), NOW(), @pecas_group_id, 'PECAS.COMPRAS.ENTRADA', true, @compras_item_id
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE nome = 'Entrada de Mercadorias' AND group_id = @pecas_group_id AND parent_id = @compras_item_id);

-- 6. Criar item "Monitor NFe" (filho de Compras) - parent_id = @compras_item_id - ITEM PRINCIPAL
INSERT INTO menu_items (nome, rota, icone, ordem, ativo, created_at, updated_at, group_id, permissao_codigo, requer_permissao, parent_id)
SELECT 'Monitor NFe', '/nfe/monitor', 'fa-file-invoice', 3, true, NOW(), NOW(), @pecas_group_id, 'NFE.MONITOR', true, @compras_item_id
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE nome = 'Monitor NFe' AND group_id = @pecas_group_id AND parent_id = @compras_item_id);

-- ============================================================
-- Criar programa para permissão do Monitor NFe
-- ============================================================
INSERT INTO programs (codigo, descricao, modulo, created_at, updated_at)
SELECT 'NFE.MONITOR', 'Monitor de NFe - Visualização e Gerenciamento', 'NFE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM programs WHERE codigo = 'NFE.MONITOR');

-- ============================================================
-- Verificar estrutura criada
-- ============================================================
SELECT 
    mg.nome AS Grupo,
    mi.nome AS Item,
    mi.rota AS Rota,
    mi.ordem AS Ordem,
    mi.parent_id AS ParentId
FROM menu_groups mg
LEFT JOIN menu_items mi ON mi.group_id = mg.id
WHERE mg.nome = 'Peças'
ORDER BY mi.ordem;
