-- V20260119_02__menu_structure_params_tools.sql
-- Ajusta estrutura do menu: torna 'Geral' um grupo, adiciona 'Configurações', organiza 'Ferramentas' e filhos
-- RODAR EM HOMOLOGAÇÃO ANTES DE PROD

START TRANSACTION;

-- 1) Tornar `Geral` (id=33) não clicável (sem rota)
UPDATE menu_items SET rota = NULL, updated_at = NOW() WHERE id = 33;

-- 2) Garantir que `Cadastro de Usuários` (34) e `Cadastro de Grupos` (35) são filhos de `Geral`
UPDATE menu_items SET parent_id = 33, menu_group_id = 12, updated_at = NOW() WHERE id IN (34,35);

-- 3) Inserir/atualizar `Configurações` como filho de `Geral` (id sugerido 3440)
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, created_at, updated_at)
VALUES (3440, 12, 'PARAM.CONFIGS', 'Configurações', '/parametros/geral', 'fa-cog', 3, 33, NULL, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE rota=VALUES(rota), nome=VALUES(nome), parent_id=VALUES(parent_id), updated_at=NOW();

-- 4) Garantir `Ferramentas` (id=47) permanece como categoria (sem rota clicável)
UPDATE menu_items SET rota = NULL, updated_at = NOW() WHERE id = 47;

-- 5) Mover/ajustar filhos para `Ferramentas` (parent_id = 47)
UPDATE menu_items SET parent_id = 47, menu_group_id = 12, updated_at = NOW() WHERE id IN (48,49,50,51,3437);

-- 6) Atualizar rotas específicas
UPDATE menu_items SET rota = '/ferramentas/menu-builder', nome='Menu Builder', updated_at = NOW() WHERE id = 3437;
UPDATE menu_items SET rota = '/ferramentas/flow-builder-editor', nome='Flow Form', updated_at = NOW() WHERE id = 50;

-- 7) Inserir Report Builder e Dicionário sob Ferramentas (ids sugeridos 3441,3442)
INSERT INTO menu_items (id, menu_group_id, codigo, nome, rota, icone, ordem, parent_id, permissao_codigo, ativo, created_at, updated_at)
VALUES
  (3441, 12, 'PARAM.REPORT_BUILDER', 'Report Builder', '/ferramentas/Report-builder-editor', 'fa-file-alt', 5, 47, NULL, 1, NOW(), NOW()),
  (3442, 12, 'PARAM.DICIONARIO', 'Dicionário', '/ferramentas/Dicionario', 'fa-book', 6, 47, NULL, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE rota=VALUES(rota), nome=VALUES(nome), parent_id=VALUES(parent_id), updated_at=NOW();

COMMIT;

-- Após aplicar, valide com:
-- SELECT id,nome,rota,parent_id,menu_group_id,ativo FROM menu_items WHERE menu_group_id=12 ORDER BY parent_id,ordem;
