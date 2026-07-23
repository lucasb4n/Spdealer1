-- Migration de exemplo para homologação (não executar sem revisão)
CREATE TABLE IF NOT EXISTS cliente_homologacao (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  email VARCHAR(150),
  telefone VARCHAR(50),
  id_fil INT NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Nota: incluir sempre filtro por id_fil nas queries de produção
