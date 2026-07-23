-- =====================================================
-- SCRIPT DE INSTALAÇÃO: Todos os Cadastros MAS (Menu.IMP)
-- Data: 04 de abril de 2026
-- =====================================================

-- =====================================================
-- PARAMETROS GERAIS
-- =====================================================

-- MAS001 - Códigos de Tributação
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('PARAM.TRIBUTACAO', 'Códigos de Tributação', 'P', '/parametros/tributacao', 'fa fa-percent', 10, 1);

-- MAS002 - Condições de Pagamento
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('PARAM.CONDICOESPAGAMENTO', 'Condições de Pagamento', 'P', '/parametros/condicoes-pagamento', 'fa fa-payment', 20, 1);

-- MAS003 - Grupo de Itens
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.GRUPOITENS', 'Grupo de Itens', 'P', '/cadastros/grupo-itens', 'fa fa-folder', 30, 1);

-- MAS004 - Natureza da Operação (CFOP) - JÁ CADASTRADO
-- MAS005 - Departamentos/Centro de Custos - JÁ CADASTRADO

-- MAS008 - Parâmetros Gerais (existe página)
-- MAS009 - Cadastro de Bancos
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.BANCOS', 'Cadastro de Bancos', 'P', '/cadastros/bancos', 'fa fa-bank', 40, 1);

-- MAS011 - Cadastro de Moedas
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.MOEDAS', 'Cadastro de Moedas', 'P', '/cadastros/moedas', 'fa fa-money', 50, 1);

-- MAS012 - Cotação de Moedas
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.COTACAOMOEDAS', 'Cotação de Moedas', 'P', '/cadastros/cotacao-moedas', 'fa fa-line-chart', 55, 1);

-- MAS013 - Cadastro Objetivos para Venda
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.OBJETIVOSVENDA', 'Cadastro Objetivos para Venda', 'P', '/cadastros/objetivos-venda', 'fa fa-bullseye', 60, 1);

-- MAS014 - Cadastro de Natureza de Itens
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.NATUREZAITENS', 'Cadastro de Natureza de Itens', 'P', '/cadastros/natureza-itens', 'fa fa-tag', 65, 1);

-- MAS015 - Cadastro Públicos/Atividades
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.PUBLICOS', 'Cadastro Públicos/Atividades', 'P', '/cadastros/publicos', 'fa fa-users', 70, 1);

-- MAS016 - Grupo de Desconto
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.GRUPODESCONTO', 'Grupo de Desconto', 'P', '/cadastros/grupo-desconto', 'fa fa-percent', 75, 1);

-- MAS021 - Cadastro Tipos de Fornecedores (existe página)
-- MAS022 - Cadastro de Operações de Caixa
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.OPERACOESCAIXA', 'Cadastro de Operações de Caixa', 'P', '/cadastros/operacoes-caixa', 'fa fa-cash-register', 80, 1);

-- MAS023 - Cadastro de Categoria de Itens
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.CATEGORIAITENS', 'Cadastro de Categoria de Itens', 'P', '/cadastros/categoria-itens', 'fa fa-sitemap', 85, 1);

-- MAS024 - Cadastro de Tipos de O.S.
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.TIPOSOS', 'Cadastro de Tipos de O.S.', 'P', '/cadastros/tipos-os', 'fa fa-wrench', 90, 1);

-- MAS025 - Cadastro Tipo Docto. Receber
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.TIPODOCTORECEBER', 'Cadastro Tipo Docto. Receber', 'P', '/cadastros/tipo-docto-receber', 'fa fa-file-invoice', 95, 1);

-- MAS026 - Cadastro Tipo Cobrança Receber
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.TIPOCOBRANCARECEBER', 'Cadastro Tipo Cobrança Receber', 'P', '/cadastros/tipo-cobranca-receber', 'fa fa-hand-holding-usd', 100, 1);

-- MAS027 - Cadastro de Niveis de Preço
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.NIVEISPRECO', 'Cadastro de Niveis de Preço', 'P', '/cadastros/niveis-preco', 'fa fa-tags', 105, 1);

-- MAS028 - Cadastro Situação de Veículos
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.SITUACAOVEICULOS', 'Cadastro Situação de Veículos', 'P', '/cadastros/situacao-veiculos', 'fa fa-car', 110, 1);

-- MAS029 - Cadastro Tipo Docto. Pagar
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.TIPODOCTOPAGAR', 'Cadastro Tipo Docto. Pagar', 'P', '/cadastros/tipo-docto-pagar', 'fa fa-file-invoice-dollar', 115, 1);

-- MAS030 - Cadastro Tipo Cobrança Pagar
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.TIPOCOBRANCAPAGAR', 'Cadastro Tipo Cobrança Pagar', 'P', '/cadastros/tipo-cobranca-pagar', 'fa fa-money-bill', 120, 1);

-- MAS032 - Cadastro Motivos Venda Perdida
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.MOTIVOSVENDAPERDIDA', 'Cadastro Motivos Venda Perdida', 'P', '/cadastros/motivos-venda-perdida', 'fa fa-thumbs-down', 125, 1);

-- MAS033 - Cadastro Rateio Despesas
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.RATEIODESPESAS', 'Cadastro Rateio Despesas', 'P', '/cadastros/rateio-despesas', 'fa fa-calculator', 130, 1);

-- MAS036 - Cadastro de Codigos NBM
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.CODIGOSNBM', 'Cadastro de Codigos NBM', 'P', '/cadastros/codigos-nbm', 'fa fa-barcode', 135, 1);

-- MAS037 - Cadastro de CFOP
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.CFOP', 'Cadastro de CFOP', 'P', '/cadastros/cfop', 'fa fa-file-code', 140, 1);

-- MAS042 - Cadastro de Municipios
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.MUNICIPIOS', 'Cadastro de Municipios', 'P', '/cadastros/municipios', 'fa fa-map-marker', 145, 1);

-- MAS043 - Cadastro de Tipo de Entrada
REPLACE INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo)
VALUES ('CADASTRAR.TIPOENTRADA', 'Cadastro de Tipo de Entrada', 'P', '/cadastros/tipo-entrada', 'fa fa-sign-in-alt', 150, 1);

-- =====================================================
-- MENU ITEMS - Grupo Parametros (menu_group_id = 12)
-- =====================================================

-- MAS001
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS001', 'Códigos de Tributação', 'Códigos de Tributação', '/parametros/tributacao', 'fa fa-percent', 10, 1, 1, 'PARAM.TRIBUTACAO', 12);

-- MAS002
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS002', 'Condições de Pagamento', 'Condições de Pagamento', '/parametros/condicoes-pagamento', 'fa fa-payment', 20, 1, 1, 'PARAM.CONDICOESPAGAMENTO', 12);

-- MAS003
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS003', 'Grupo de Itens', 'Grupo de Itens', '/cadastros/grupo-itens', 'fa fa-folder', 30, 1, 1, 'CADASTRAR.GRUPOITENS', 12);

-- MAS004 - JÁ CADASTRADO
-- MAS005 - JÁ CADASTRADO

-- MAS009
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS009', 'Cadastro de Bancos', 'Cadastro de Bancos', '/cadastros/bancos', 'fa fa-bank', 40, 1, 1, 'CADASTRAR.BANCOS', 12);

-- MAS011
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS011', 'Cadastro de Moedas', 'Cadastro de Moedas', '/cadastros/moedas', 'fa fa-money', 50, 1, 1, 'CADASTRAR.MOEDAS', 12);

-- MAS012
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS012', 'Cotação de Moedas', 'Cotação de Moedas', '/cadastros/cotacao-moedas', 'fa fa-line-chart', 55, 1, 1, 'CADASTRAR.COTACAOMOEDAS', 12);

-- MAS013
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS013', 'Cadastro Objetivos para Venda', 'Cadastro Objetivos para Venda', '/cadastros/objetivos-venda', 'fa fa-bullseye', 60, 1, 1, 'CADASTRAR.OBJETIVOSVENDA', 12);

-- MAS014
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS014', 'Cadastro de Natureza de Itens', 'Cadastro de Natureza de Itens', '/cadastros/natureza-itens', 'fa fa-tag', 65, 1, 1, 'CADASTRAR.NATUREZAITENS', 12);

-- MAS015
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS015', 'Cadastro Públicos/Atividades', 'Cadastro Públicos/Atividades', '/cadastros/publicos', 'fa fa-users', 70, 1, 1, 'CADASTRAR.PUBLICOS', 12);

-- MAS016
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS016', 'Grupo de Desconto', 'Grupo de Desconto', '/cadastros/grupo-desconto', 'fa fa-percent', 75, 1, 1, 'CADASTRAR.GRUPODESCONTO', 12);

-- MAS021 - já existe (TIPOS_FORNECEDORES)

-- MAS022
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS022', 'Cadastro de Operações de Caixa', 'Cadastro de Operações de Caixa', '/cadastros/operacoes-caixa', 'fa fa-cash-register', 80, 1, 1, 'CADASTRAR.OPERACOESCAIXA', 12);

-- MAS023
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS023', 'Cadastro de Categoria de Itens', 'Cadastro de Categoria de Itens', '/cadastros/categoria-itens', 'fa fa-sitemap', 85, 1, 1, 'CADASTRAR.CATEGORIAITENS', 12);

-- MAS024
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS024', 'Cadastro de Tipos de O.S.', 'Cadastro de Tipos de O.S.', '/cadastros/tipos-os', 'fa fa-wrench', 90, 1, 1, 'CADASTRAR.TIPOSOS', 12);

-- MAS025
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS025', 'Cadastro Tipo Docto. Receber', 'Cadastro Tipo Docto. Receber', '/cadastros/tipo-docto-receber', 'fa fa-file-invoice', 95, 1, 1, 'CADASTRAR.TIPODOCTORECEBER', 12);

-- MAS026
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS026', 'Cadastro Tipo Cobrança Receber', 'Cadastro Tipo Cobrança Receber', '/cadastros/tipo-cobranca-receber', 'fa fa-hand-holding-usd', 100, 1, 1, 'CADASTRAR.TIPOCOBRANCARECEBER', 12);

-- MAS027
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS027', 'Cadastro de Niveis de Preço', 'Cadastro de Niveis de Preço', '/cadastros/niveis-preco', 'fa fa-tags', 105, 1, 1, 'CADASTRAR.NIVEISPRECO', 12);

-- MAS028
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS028', 'Cadastro Situação de Veículos', 'Cadastro Situação de Veículos', '/cadastros/situacao-veiculos', 'fa fa-car', 110, 1, 1, 'CADASTRAR.SITUACAOVEICULOS', 12);

-- MAS029
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS029', 'Cadastro Tipo Docto. Pagar', 'Cadastro Tipo Docto. Pagar', '/cadastros/tipo-docto-pagar', 'fa fa-file-invoice-dollar', 115, 1, 1, 'CADASTRAR.TIPODOCTOPAGAR', 12);

-- MAS030
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS030', 'Cadastro Tipo Cobrança Pagar', 'Cadastro Tipo Cobrança Pagar', '/cadastros/tipo-cobranca-pagar', 'fa fa-money-bill', 120, 1, 1, 'CADASTRAR.TIPOCOBRANCAPAGAR', 12);

-- MAS032
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS032', 'Cadastro Motivos Venda Perdida', 'Cadastro Motivos Venda Perdida', '/cadastros/motivos-venda-perdida', 'fa fa-thumbs-down', 125, 1, 1, 'CADASTRAR.MOTIVOSVENDAPERDIDA', 12);

-- MAS033
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS033', 'Cadastro Rateio Despesas', 'Cadastro Rateio Despesas', '/cadastros/rateio-despesas', 'fa fa-calculator', 130, 1, 1, 'CADASTRAR.RATEIODESPESAS', 12);

-- MAS036
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS036', 'Cadastro de Codigos NBM', 'Cadastro de Codigos NBM', '/cadastros/codigos-nbm', 'fa fa-barcode', 135, 1, 1, 'CADASTRAR.CODIGOSNBM', 12);

-- MAS037
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS037', 'Cadastro de CFOP', 'Cadastro de CFOP', '/cadastros/cfop', 'fa fa-file-code', 140, 1, 1, 'CADASTRAR.CFOP', 12);

-- MAS042
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS042', 'Cadastro de Municipios', 'Cadastro de Municipios', '/cadastros/municipios', 'fa fa-map-marker', 145, 1, 1, 'CADASTRAR.MUNICIPIOS', 12);

-- MAS043
REPLACE INTO menu_items (codigo, nome, descricao, rota, icone, ordem, ativo, requer_permissao, permissao_codigo, menu_group_id)
VALUES ('MAS043', 'Cadastro de Tipo de Entrada', 'Cadastro de Tipo de Entrada', '/cadastros/tipo-entrada', 'fa fa-sign-in-alt', 150, 1, 1, 'CADASTRAR.TIPOENTRADA', 12);

-- =====================================================
-- USER GROUP PERMISSIONS - Administradores (group_id = 1)
-- =====================================================

-- Dar permissão para todos os programas ao grupo Administradores
INSERT IGNORE INTO user_group_permissions (group_id, program_id, permitido)
SELECT 1, id, 1 FROM programs WHERE codigo LIKE 'PARAM.%' OR codigo LIKE 'CADASTRAR.%';

-- =====================================================
-- USER MENU CONFIG - Admin (usuario_id = 1)
-- =====================================================

-- Tornar visível para admin
INSERT IGNORE INTO user_menu_config (usuario_id, menu_item_id, visivel, ordem)
SELECT 1, id, 1, ordem FROM menu_items WHERE codigo LIKE 'MAS%';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT '=== PROGRAMAS CADASTRADOS ===' AS '';
SELECT id, codigo, descricao, rota FROM programs WHERE codigo LIKE 'PARAM.%' OR codigo LIKE 'CADASTRAR.%' ORDER BY ordem;

SELECT '=== MENU ITEMS CADASTRADOS ===' AS '';
SELECT id, codigo, nome, rota, permissao_codigo FROM menu_items WHERE codigo LIKE 'MAS%' ORDER BY ordem;

SELECT '=== TOTAL DE PERMISSÕES ===' AS '';
SELECT COUNT(*) as total FROM user_group_permissions WHERE group_id = 1;

SELECT '=== TOTAL DE MENU CONFIG ===' AS '';
SELECT COUNT(*) as total FROM user_menu_config WHERE usuario_id = 1;
