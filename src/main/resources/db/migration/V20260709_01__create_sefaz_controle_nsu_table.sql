-- Script de migração manual para persistência de NSU (SEFAZ)
-- Executar no banco de dados MariaDB 'erp'

CREATE TABLE IF NOT EXISTS sefaz_controle_nsu (
    cnpj VARCHAR(14) NOT NULL,
    ultimo_nsu VARCHAR(15) NOT NULL DEFAULT '0',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inicializa o último NSU conhecido da empresa para iniciar a consulta
INSERT INTO sefaz_controle_nsu (cnpj, ultimo_nsu) 
VALUES ('47563976000136', '000000000009395') 
ON DUPLICATE KEY UPDATE ultimo_nsu = '000000000009395';
