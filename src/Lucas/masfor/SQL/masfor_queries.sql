-- ========================================
-- SQL Queries para Tipos de Fornecedores
-- Tabela: masfor
-- Data: 17 de janeiro de 2026
-- ========================================

-- ====== VERIFICAR/CRIAR ESTRUTURA ======
-- Se a tabela masfor não possui coluna id_fil, adicionar:
-- ALTER TABLE masfor ADD COLUMN id_fil INT DEFAULT 1 AFTER tipo_for;
-- ALTER TABLE masfor ADD FOREIGN KEY (id_fil) REFERENCES masfil(codigo_fil);

-- ====== SELECT (Listar por filial) ======
-- Query com FILTRO OBRIGATÓRIO por id_fil
SELECT tipo_for, descr_for 
FROM masfor 
WHERE id_fil = ?
ORDER BY tipo_for;

-- ====== SELECT (Detalhes) ======
SELECT tipo_for, descr_for 
FROM masfor 
WHERE tipo_for = ? AND id_fil = ?;

-- ====== INSERT (Criar) ======
-- Validar ANTES: duplicidade (tipo_for, id_fil)
INSERT INTO masfor (tipo_for, descr_for, id_fil)
VALUES (?, ?, ?);

-- ====== UPDATE (Atualizar) ======
-- Validar ANTES: tipo_for existe na filial
UPDATE masfor 
SET descr_for = ?
WHERE tipo_for = ? AND id_fil = ?;

-- ====== DELETE (Deletar) ======
-- Validar ANTES: tipo_for existe na filial
DELETE FROM masfor 
WHERE tipo_for = ? AND id_fil = ?;

-- ====== VALIDAÇÃO (Duplicidade) ======
-- Verificar se tipo_for já existe para a filial
SELECT COUNT(*) 
FROM masfor 
WHERE tipo_for = ? AND id_fil = ?;

-- ====== ÍNDICES (Performance) ======
-- Criar índices para melhor performance
-- CREATE INDEX idx_masfor_id_fil ON masfor(id_fil);
-- CREATE UNIQUE INDEX idx_masfor_tipo_fil ON masfor(tipo_for, id_fil);

-- ====== EXEMPLO DE DADOS ======
-- Inserir tipos de fornecedores de exemplo:
-- INSERT INTO masfor (tipo_for, descr_for, id_fil) VALUES ('FOR001', 'Distribuidor Autorizado', 1);
-- INSERT INTO masfor (tipo_for, descr_for, id_fil) VALUES ('FOR002', 'Representante', 1);
-- INSERT INTO masfor (tipo_for, descr_for, id_fil) VALUES ('FOR003', 'Fornecedor Direto', 1);
