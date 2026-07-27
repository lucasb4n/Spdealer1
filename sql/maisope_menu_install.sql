-- =====================================================
-- SCRIPT DE INSTALAÇÃO: Cadastro de Operações (MAS004)
-- Tabela: masope
-- Data: 04 de abril de 2026
-- =====================================================

-- =====================================================
-- 1. PROGRAM (Programas/Rotinas)
-- =====================================================
-- Criar programa para Natureza da Operação (MAS004)
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.NATUREZAOPERACAO', 'Cadastro Natureza de Operação (CFOP)', 'P', '/cadastros/operacoes', 'fa fa-tags', 85, 1);

-- Criar programa para Departamentos (MAS005) - Exemplo de referência
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.DEPARTAMENTOS', 'Cadastro Departamentos/Centro de Custos', 'P', '/parametros/departamentos', 'fa fa-building', 80, 1);

-- =====================================================
-- 2. MENU ITEMS (Itens de Menu dentro do grupo)
-- =====================================================
-- Vincular MAS004 ao grupo Parametros (id=12)
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS004', 'Natureza da Operação', 'Cadastro Natureza de Operação (CFOP)', '/cadastros/operacoes', 'fa fa-tags', 85, 1, 1, 'CADASTRAR.NATUREZAOPERACAO', 12);

-- Atualizar MAS005 para vincular ao programa
UPDATE menu_items SET permissao_codigo = 'CADASTRAR.DEPARTAMENTOS', requer_permissao = 1 WHERE codigo = 'DEPARTAMENTOS';

-- =====================================================
-- 3. USER GROUP PERMISSIONS (Permissões do Grupo)
-- =====================================================
-- Dar permissão ao grupo Administradores (id=1) para NATUREZAOPERACAO
REPLACE INTO user_group_permissions (group_id, program_id, permitido)
VALUES (1, (SELECT id FROM programs WHERE codigo = 'CADASTRAR.NATUREZAOPERACAO'), 1);

-- Dar permissão ao grupo Administradores (id=1) para DEPARTAMENTOS
REPLACE INTO user_group_permissions (group_id, program_id, permitido)
VALUES (1, (SELECT id FROM programs WHERE codigo = 'CADASTRAR.DEPARTAMENTOS'), 1);

-- =====================================================
-- 4. USER MENU CONFIG (Configuração de Menu por Usuário)
-- =====================================================
-- Tornar visível para usuário admin (codigo_usu=1)
REPLACE INTO user_menu_config (usuario_id, menu_item_id, visivel, ordem)
VALUES (1, (SELECT id FROM menu_items WHERE codigo = 'MAS004'), 1, 85);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Verificar programas criados
SELECT '=== PROGRAMAS ===' AS '';
SELECT id, codigo, descricao, tipo, rota FROM programs WHERE codigo IN ('CADASTRAR.NATUREZAOPERACAO', 'CADASTRAR.DEPARTAMENTOS');

-- Verificar itens de menu
SELECT '=== MENU ITEMS ===' AS '';
SELECT mi.id, mi.codigo, mi.nome, mi.rota, mi.permissao_codigo, mg.nome as grupo
FROM menu_items mi
JOIN menu_groups mg ON mi.menu_group_id = mg.id
WHERE mi.codigo IN ('MAS004', 'DEPARTAMENTOS');

-- Verificar permissões do grupo
SELECT '=== PERMISSÕES DO GRUPO ADMIN ===' AS '';
SELECT ugp.id, ugp.group_id, ugp.program_id, ugp.permitido, p.codigo as programa
FROM user_group_permissions ugp
JOIN programs p ON ugp.program_id = p.id
WHERE ugp.group_id = 1 AND p.codigo IN ('CADASTRAR.NATUREZAOPERACAO', 'CADASTRAR.DEPARTAMENTOS');

-- Verificar configuração de menu do admin
SELECT '=== MENU DO ADMIN ===' AS '';
SELECT umc.id, umc.usuario_id, umc.menu_item_id, umc.visivel, umc.ordem, mi.codigo, mi.nome
FROM user_menu_config umc
JOIN menu_items mi ON umc.menu_item_id = mi.id
WHERE umc.usuario_id = 1 AND mi.codigo IN ('MAS004', 'DEPARTAMENTOS');

-- =====================================================
-- COMANDOS INDIVIDUAIS (para executar separadamente)
-- =====================================================

-- -- Criar programa:
-- mysql -u root -pk15720 erp -e "REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo) VALUES ('CADASTRAR.NATUREZAOPERACAO', 'Cadastro Natureza de Operação (CFOP)', 'P', '/cadastros/operacoes', 'fa fa-tags', 85, 1);"

-- -- Criar item de menu:
-- mysql -u root -pk15720 erp -e "REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id) VALUES ('MAS004', 'Natureza da Operação', 'Cadastro Natureza de Operação (CFOP)', '/cadastros/operacoes', 'fa fa-tags', 85, 1, 1, 'CADASTRAR.NATUREZAOPERACAO', 12);"

-- -- Dar permissão ao grupo:
-- mysql -u root -pk15720 erp -e "REPLACE INTO user_group_permissions (group_id, program_id, permitido) VALUES (1, (SELECT id FROM programs WHERE codigo = 'CADASTRAR.NATUREZAOPERACAO'), 1);"

-- -- Configurar menu do usuário:
-- mysql -u root -pk15720 erp -e "REPLACE INTO user_menu_config (usuario_id, menu_item_id, visivel, ordem) VALUES (1, (SELECT id FROM menu_items WHERE codigo = 'MAS004'), 1, 85);"
