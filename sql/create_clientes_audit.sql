-- Tabela para auditoria de alterações em clientes
CREATE TABLE IF NOT EXISTS clientes_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo_cli VARCHAR(50),
  operacao VARCHAR(32),
  detalhes TEXT,
  rows_affected INT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
