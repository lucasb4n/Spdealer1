-- V20260411_03__expand_permissions_system.sql
-- Expande o sistema de permissões para suportar: Visível, Editar, Excluir, Visualizar.

START TRANSACTION;

-- 1) Adicionar colunas na tabela de permissões de grupo
ALTER TABLE user_group_permissions 
ADD COLUMN IF NOT EXISTS visualizar TINYINT(1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS incluir_editar TINYINT(1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS excluir TINYINT(1) DEFAULT 1,
ADD COLUMN IF NOT EXISTS visivel TINYINT(1) DEFAULT 1;

-- 2) Garantir que a tabela de permissões individuais existe e tem a mesma estrutura
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT(20) NOT NULL,
    program_id INT(10) UNSIGNED NOT NULL,
    visualizar TINYINT(1) DEFAULT 1,
    incluir_editar TINYINT(1) DEFAULT 1,
    excluir TINYINT(1) DEFAULT 1,
    visivel TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_program (usuario_id, program_id)
);

COMMIT;
