-- Script de backup + UPDATE para cliente codigo_cli = 2309
-- INSTRUÇÕES:
-- 1) Edite os valores em @novo_nome e @novo_cgc conforme desejado.
-- 2) Revise o SELECT de verificação antes de COMMIT.
-- 3) Execute em ambiente de homologação antes de produção.

SET @codigo_cli = '2309';
-- Preencha os novos valores abaixo (ou deixe vazio para manter o valor atual)
SET @novo_nome = 'NOVO_NOME_AQUI';
SET @novo_cgc  = 'NOVO_CGC_AQUI';

-- Inicia transação
START TRANSACTION;

-- Cria tabela de backup (estrutura) somente se não existir
CREATE TABLE IF NOT EXISTS clientes_backup AS
SELECT * FROM clientes WHERE 0;

-- Insere o registro atual na tabela de backup
INSERT INTO clientes_backup
SELECT * FROM clientes WHERE codigo_cli = @codigo_cli;

-- Opcional: trave e mostre a linha atual para revisão
SELECT * FROM clientes WHERE codigo_cli = @codigo_cli FOR UPDATE;

-- Atualiza somente os campos fornecidos (mantém valores atuais quando variável vazia)
UPDATE clientes
SET
  nome_cli = CASE WHEN TRIM(@novo_nome) = '' THEN nome_cli ELSE @novo_nome END,
  cgccpf_cli = CASE WHEN TRIM(@novo_cgc) = '' THEN cgccpf_cli ELSE @novo_cgc END
WHERE codigo_cli = @codigo_cli;

-- Verifique o resultado antes de confirmar
SELECT * FROM clientes WHERE codigo_cli = @codigo_cli;

-- Se estiver OK, finalize a transação
COMMIT;

-- Se algo estiver errado: execute ROLLBACK (antes do COMMIT)
-- ROLLBACK;

-- Observações:
-- - Este script cria uma cópia do(s) registro(s) afetado(s) em 'clientes_backup'.
-- - 'clientes_backup' criada por este script não copiará índices/chaves; é apenas para backup rápido.
-- - Recomendo testar em homologação e revisar o SELECT de verificação antes de executar COMMIT.
