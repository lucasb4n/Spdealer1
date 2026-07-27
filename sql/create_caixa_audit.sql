-- Tabela para auditoria de alterações em caixa/bancos
-- Registra todas as alterações em movimentos de caixa para fins de auditoria
CREATE TABLE IF NOT EXISTS caixa_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  seq_cai_ref BIGINT NOT NULL COMMENT 'Referência ao seq_cai do registro alterado',
  operacao VARCHAR(32) NOT NULL COMMENT 'Tipo de operação: INSERT, UPDATE, DELETE',
  usuario VARCHAR(100) COMMENT 'Usuário que realizou a alteração',
  details TEXT COMMENT 'Detalhes da alteração (campos old->new)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora da alteração'
);

-- Índices para performance em consultas de auditoria
CREATE INDEX idx_caixa_audit_seq ON caixa_audit(seq_cai_ref);
CREATE INDEX idx_caixa_audit_data ON caixa_audit(created_at);
CREATE INDEX idx_caixa_audit_usuario ON caixa_audit(usuario);
