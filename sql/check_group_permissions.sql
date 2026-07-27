SELECT p.codigo, p.descricao, g.permitido
FROM programs p
INNER JOIN user_group_permissions g ON p.id = g.program_id
WHERE g.group_id = 1 
AND p.codigo IN ('CADASTRAR.GRUPOITENS', 'CADASTRAR.NATUREZAITENS', 'CADASTRAR.TIPOSOS', 'CADASTRAR.NIVEISPRECO');
