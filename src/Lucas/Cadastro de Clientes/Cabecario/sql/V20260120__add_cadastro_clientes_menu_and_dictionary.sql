-- Migration: adiciona menu e colunas de dictionary para Cadastro de Clientes (homologação)

-- 1) Menu group / item
INSERT INTO menu_groups (id, name, label, sort_order)
SELECT 200, 'parametros', 'Parâmetros', 10
WHERE NOT EXISTS (SELECT 1 FROM menu_groups WHERE id = 200);

INSERT INTO menu_items (id, group_id, subgroup_id, label, program_code, path, render_mode, sort_order, visible)
SELECT 2000, 200, NULL, 'Cadastro de Clientes', 'CAD_CLIENTES', '/parametros/cadastro-clientes', 'drawer', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE program_code = 'CAD_CLIENTES');

-- 2) Dictionary columns (exemplo mínimo)
INSERT INTO dictionary_columns (table_name, column_name, alias, aba, form_visible, is_checkbox, ord, properties)
VALUES
('clientes','codigo_cli','Código','Clientes',1,0,1,'{}'),
('clientes','documento_cli','Documento','Clientes',1,0,2,'{"mask":"document"}'),
('clientes','nome_razao','Nome/Razão social','Clientes',1,0,3,'{}')
ON DUPLICATE KEY UPDATE alias=VALUES(alias), form_visible=VALUES(form_visible);

-- 3) Recomendo validar via GET /api/dictionary/columns/clientes e via frontend
