-- scripts/manutencao_tmo_test_update.sql
-- UPDATE para testes com dados fictícios
-- ATENÇÃO: execute apenas em ambiente de teste.

START TRANSACTION;

-- Exibir antes
SELECT * FROM tmo WHERE codmo_tmo = 'TEST01' LIMIT 1;

-- UPDATE com dados falsos para teste
UPDATE tmo
SET modelo_tmo = 'TEST-MODEL-XYZ',
    codmo_tmo = 'TEST01',
    descr_tmo = 'Registro de teste - atualizar preco e tempo',
    tempo_tmo = '0.5h',
    prcpub_tmo = 1.23
WHERE codmo_tmo = 'TEST01';

-- Confirmar alteração
SELECT * FROM tmo WHERE codmo_tmo = 'TEST01' LIMIT 1;

COMMIT;

-- FIM
-- Observação: se o registro 'TEST01' não existir, nenhum registro será alterado.
-- Para inserir um registro de teste antes de executar, use:
-- INSERT INTO tmo (modelo_tmo, codmo_tmo, descr_tmo, tempo_tmo, prcpub_tmo) VALUES ('TEST-MODEL-XYZ','TEST01','Registro de teste - criado para update','0.5h',1.23);
