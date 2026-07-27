-- scripts/manutencao_tmo.sql
-- Gerado a partir de ManutencaoTipoTmoController.java
-- Uso: executar manualmente no MySQL (mysql CLI ou cliente)
-- Observações: ajuste valores conforme seu ambiente. Verifique se `codmo_tmo` é UNIQUE/PRIMARY KEY.

-- Exemplo de execução (mysql):
-- mysql -u usuario -p -h host nome_do_banco < scripts/manutencao_tmo.sql

START TRANSACTION;

-- =====================================================
-- 1) Visualizar registro atual (antes de alterar)
-- Substitua '01' pelo `codmo_tmo` que deseja inspecionar
-- =====================================================
SELECT * FROM tmo WHERE codmo_tmo = '01' LIMIT 1;

-- =====================================================
-- 2) TEMPLATE: INSERT (novo registro)
-- Ajuste as variáveis abaixo antes de executar
-- =====================================================
SET @modelo = 'EC140B PRIME';
SET @codmo = '01';
SET @descr = 'EXCAVADORA EXEMPLO';
SET @tempo = '2h';
SET @prcpub = 280.00;

INSERT INTO tmo (modelo_tmo, codmo_tmo, descr_tmo, tempo_tmo, prcpub_tmo)
VALUES (@modelo, @codmo, @descr, @tempo, @prcpub);

-- =====================================================
-- 3) TEMPLATE: UPDATE (atualizar registro existente)
-- Substitua @codmo_key pela chave do registro que deseja atualizar
-- =====================================================
ET @codmo_key = '01'; -- chave existente a ser atualizada
SET @modelo = 'EC140B PRIME';
SET @novoCodmo = '01'; -- novo código (pode ser igual)
SET @dSescr = 'EXCAVADORA ATUALIZADA';
SET @tempo = '3h';
SET @prcpub = 300.00;

UPDATE tmo
SET modelo_tmo = @modelo,
    codmo_tmo = @novoCodmo,
    descr_tmo = @descr,
    tempo_tmo = @tempo,
    prcpub_tmo = @prcpub
WHERE codmo_tmo = @codmo_key;

-- Mostrar registro após UPDATE
SELECT * FROM tmo WHERE codmo_tmo = @novoCodmo LIMIT 1;

-- =====================================================
-- 4) TEMPLATE: UPSERT (INSERT ou UPDATE se chave duplicada)
-- Atenção: requer que `codmo_tmo` seja UNIQUE/PRIMARY KEY
-- =====================================================
SET @modelo = 'EC140B PRIME';
SET @codmo = '01';
SET @descr = 'EXCAVADORA EXEMPLO';
SET @tempo = '2h';
SET @prcpub = 280.00;

INSERT INTO tmo (modelo_tmo, codmo_tmo, descr_tmo, tempo_tmo, prcpub_tmo)
VALUES (@modelo, @codmo, @descr, @tempo, @prcpub)
ON DUPLICATE KEY UPDATE
    modelo_tmo = VALUES(modelo_tmo),
    descr_tmo = VALUES(descr_tmo),
    tempo_tmo = VALUES(tempo_tmo),
    prcpub_tmo = VALUES(prcpub_tmo);

-- Mostrar registro após UPSERT
SELECT * FROM tmo WHERE codmo_tmo = @codmo LIMIT 1;

-- =====================================================
-- 5) Segurança: criar backup rápido de um registro para tabela de log/backup
-- (opcional) — descomente e ajuste se desejar
-- =====================================================
-- INSERT INTO tmo_backup (backup_ts, codmo_tmo, modelo_tmo, descr_tmo, tempo_tmo, prcpub_tmo)
-- SELECT NOW(), codmo_tmo, modelo_tmo, descr_tmo, tempo_tmo, prcpub_tmo FROM tmo WHERE codmo_tmo = '01';

COMMIT;

-- FIM
-- Antes de executar em produção: faça backup completo do banco.
