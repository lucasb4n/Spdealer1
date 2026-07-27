-- ============================================================
-- Tabela Temporária para Ajustes de Pagamento
-- Usada no fluxo de autorização multi-banco
-- ============================================================

-- Tabela para armazenar ajustes temporários de pagamento
CREATE TABLE IF NOT EXISTS pagar_ajustes_temp (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    pagar_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED NOT NULL,
    sessao_id VARCHAR(64) NOT NULL,
    
    -- Ajustes financeiros
    vlrmult DECIMAL(15,2) DEFAULT 0.00,      -- Multa
    vlrjuros DECIMAL(15,2) DEFAULT 0.00,     -- Juros
    vlrdesc DECIMAL(15,2) DEFAULT 0.00,      -- Desconto
    vlrpagamento DECIMAL(15,2),              -- Valor final a pagar
    
    -- Status do processamento
    status CHAR(1) DEFAULT 'P',  -- P=Pendente, A=Aprovado, E=Efetivado, C=Cancelado
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
    
    -- Índices
    INDEX idx_pagar_id (pagar_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_sessao_id (sessao_id),
    INDEX idx_status (status),
    
    -- Unique para evitar duplicação na mesma sessão
    UNIQUE KEY uk_pagar_sessao (pagar_id, sessao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela para log de autorizações
CREATE TABLE IF NOT EXISTS pagar_autorizacoes (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    pagar_id INT UNSIGNED NOT NULL,
    usuario_autorizacao INT UNSIGNED NOT NULL,
    banco_pag CHAR(3) NOT NULL,
    observacao VARCHAR(500),
    status_autorizacao CHAR(1) DEFAULT 'A',  -- A=Autorizado, C=Cancelado
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
    
    INDEX idx_pagar_id (pagar_id),
    INDEX idx_usuario (usuario_autorizacao),
    
    FOREIGN KEY (pagar_id) REFERENCES pagar(pagar_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Exemplos de Uso
-- ============================================================

-- Inserir ajuste temporário para um documento
INSERT INTO pagar_ajustes_temp (pagar_id, usuario_id, sessao_id, vlrmult, vlrjuros, vlrdesc, vlrpagamento)
VALUES (12345, 1, 'sess_abc123', 50.00, 25.00, 10.00, 15065.00)
ON DUPLICATE KEY UPDATE 
    vlrmult = VALUES(vlrmult),
    vlrjuros = VALUES(vlrjuros),
    vlrdesc = VALUES(vlrdesc),
    vlrpagamento = VALUES(vlrpagamento),
    updated_at = NOW();

-- Buscar ajustes de uma sessão
SELECT * FROM pagar_ajustes_temp WHERE sessao_id = 'sess_abc123';

-- Buscar ajustes de um documento específico
SELECT * FROM pagar_ajustes_temp WHERE pagar_id = 12345 ORDER BY created_at DESC LIMIT 1;

-- Atualizar status do ajuste após efetivação
UPDATE pagar_ajustes_temp SET status = 'E', updated_at = NOW() 
WHERE pagar_id = 12345 AND sessao_id = 'sess_abc123';

-- Registrar autorização
INSERT INTO pagar_autorizacoes (pagar_id, usuario_autorizacao, banco_pag, observacao)
VALUES (12345, 2, '001', 'Pagamento autorizado pelo Diretor');

-- Limpar ajustes antigos (mais de 24 horas)
DELETE FROM pagar_ajustes_temp WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) AND status = 'P';
