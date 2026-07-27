SELECT m.codigo, m.nome, m.rota, c.visivel 
FROM menu_items m 
LEFT JOIN user_menu_config c ON m.id = c.menu_item_id AND c.usuario_id = 1 
WHERE m.codigo IN ('MAS003', 'MAS014', 'MAS024', 'MAS027')
ORDER BY m.ordem;
