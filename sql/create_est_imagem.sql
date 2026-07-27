-- ============================================================
-- Script: create_est_imagem.sql
-- Descricao: Cria a tabela est_imagem para armazenar fotos dos
--            produtos do estoque (multiplas fotos por produto)
-- Executar manualmente no banco de dados ERP.
-- ============================================================

CREATE TABLE IF NOT EXISTS est_imagem (
    id           INT            AUTO_INCREMENT PRIMARY KEY,
    fab_est      CHAR(1)        NOT NULL,
    codprod_est  VARCHAR(30)    NOT NULL,
    imagem       LONGBLOB,
    nome_arquivo VARCHAR(255),
    data_inclusao DATETIME      DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_est_imagem_produto (fab_est, codprod_est)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
