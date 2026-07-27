package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class DocumentoReceberService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * MÉTODO 1: Buscar documentos a RECEBER de um cliente
     * 
     * SQL:
     * SELECT codigo_rec, documento_rec, parcela_rec, dtvenci_rec,
     *        vlr_rec, vlrmulta_rec, vlrjuros_rec,
     *        (vlr_rec + vlrmulta_rec + vlrjuros_rec) as vlrtot_rec,
     *        vlrsal_rec, status_rec
     * FROM receber
     * WHERE cliente_rec = ?
     *   AND filial_rec = ?
     *   AND status_rec IN (?, ?)
     * ORDER BY dtvenci_rec ASC
     * 
     * @param clienteId Código do cliente
     * @param filial    ID da filial do usuário
     * @param status    Array de status (ex: ["P", "A"])
     * @return Lista de mapas com documentos
     */
    public List<Map<String, Object>> buscarDocumentosPorCliente(
            String clienteId,
            Integer filial,
            String[] status
    ) {
        try {
            String sql = """
                    SELECT 
                        codigo_rec,
                        numdup_rec,
                        parcela_rec,
                        dtvenci_rec,
                        vlrdup_rec,
                        vlrmulta_rec,
                        vlracre_rec,
                        (vlrdup_rec + COALESCE(vlrmulta_rec, 0) + COALESCE(vlracre_rec, 0) - COALESCE(r.vlrdesc_rec, 0)) as vlrtot_rec,
                        vlrsal_rec,
                        status_rec,
                        filial_rec
                    FROM receber r
                    WHERE cliente_rec = ?
                      AND filial_rec = ?
                      AND status_rec IN (?, ?)
                    ORDER BY dtvenci_rec ASC
                """;

            List<Map<String, Object>> documentos = jdbcTemplate.queryForList(
                sql,
                clienteId,
                filial,
                status[0],
                status.length > 1 ? status[1] : "X"  // X = status que não existe
            );

            log.info("Encontrados {} documentos a receber para cliente {}", 
                documentos.size(), clienteId);

            return documentos;

        } catch (Exception e) {
            log.error("Erro ao buscar documentos a receber", e);
            throw new RuntimeException("Erro ao buscar documentos: " + e.getMessage());
        }
    }

    /**
     * MÉTODO 2: Marcar documentos como PAGOS
     * 
     * UPDATE receber
     * SET dtpagi_rec = '2025/11/08',
     *     dtpag_rec = '08/11/2025',
     *     cxbco_rec = ?,
     *     opercai_rec = ?,
     *     seqcai_rec = ?,
     *     vlrsal_rec = 0,
     *     status_rec = 'P'
     * WHERE codigo_rec IN (1, 2, 3, 4)
     *   AND filial_rec = ?
     * 
     * @param documentoIds IDs dos documentos
     * @param movimentoId  ID do movimento
     * @param data         Data em formato YYYY-MM-DD
     * @param filial       ID da filial
     * @return Número de linhas atualizadas
     */
    @Transactional
    public int marcarComoPago(
            List<Long> documentoIds,
            Long movimentoId,
            String data,
            String cxbco,
            Integer opercai,
            Integer seqcai,
            Integer filial
    ) {
        try {
            // Converter data: 2025-11-08 → 2025/11/08 e 08/11/2025
            String dataAAAAMMDD = data;  // 2025/11/08 (já vem assim)
            String dataDDMMAAAA = converterDataLegado(data);  // 08/11/2025

            // Buscar valores totais dos documentos selecionados
            String placeholders = String.join(",",
                documentoIds.stream().map(id -> "?").toArray(String[]::new)
            );

                        String selSql = String.format("""
                                SELECT codigo_rec, (vlrdup_rec + COALESCE(vlrmulta_rec,0) + COALESCE(vlracre_rec,0) - COALESCE(vlrdesc_rec,0)) as vlrtot_rec
                                FROM receber r
                                WHERE codigo_rec IN (%s)
                                    AND filial_rec = ?
                                """, placeholders);

            // Montar parâmetros para select
            Object[] selParams = new Object[documentoIds.size() + 1];
            int pidx = 0;
            for (Long id : documentoIds) selParams[pidx++] = id;
            selParams[pidx] = filial;

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(selSql, selParams);

            if (rows.size() != documentoIds.size()) {
                log.error("Quantidade de documentos encontrada ({}) difere da solicitada ({})", rows.size(), documentoIds.size());
                throw new RuntimeException("Não foi possível localizar todos os documentos para baixa");
            }

            // Atualizar documento por documento (garantir vlrpag individual)
            String updSql = """
                UPDATE receber
                SET dtpagi_rec = ?,
                    dtpag_rec = ?,
                    cxbco_rec = ?,
                    opercai_rec = ?,
                    seqcai_rec = ?,
                    vlrpag_rec = ?,
                    vlrsal_rec = ?
                WHERE codigo_rec = ?
                """;

            int totalUpdated = 0;
            for (Map<String, Object> r : rows) {
                Long codigo = ((Number) r.get("codigo_rec")).longValue();
                Number vlrTotNum = (Number) r.get("vlrtot_rec");
                double vlrTot = vlrTotNum != null ? vlrTotNum.doubleValue() : 0.0;

                // Consideramos baixa total do documento (vlrpag = vlrtot, vlrsal = 0)
                Object[] updParams = new Object[] {
                    dataAAAAMMDD,
                    dataDDMMAAAA,
                    cxbco,
                    opercai,
                    seqcai,
                    vlrTot,
                    0,
                    codigo
                };

                int u = jdbcTemplate.update(updSql, updParams);
                totalUpdated += u;
            }

            if (totalUpdated != documentoIds.size()) {
                log.error("Somente {} de {} documentos atualizados - forçando rollback", totalUpdated, documentoIds.size());
                throw new RuntimeException("Não foi possível gravar todos os documentos");
            }

            log.info("Marcados {} documentos como pagos (movimento {})", totalUpdated, movimentoId);

            return totalUpdated;

        } catch (Exception e) {
            log.error("Erro ao marcar documentos como pagos", e);
            throw new RuntimeException("Erro ao processar baixa: " + e.getMessage());
        }
    }

    /**
     * Helper: Converter data de YYYY-MM-DD para DD/MM/YYYY
     */
    private String converterDataLegado(String data) {
        // 2025-11-08 → 08/11/2025
        String[] partes = data.split("-");
        // Retornar no formato legado DDMMAAAA (ex: 08112025) para compatibilidade
        return partes[2] + partes[1] + partes[0];
    }

    /**
     * Estorna vinculação de documentos que foram baixados por um lançamento de caixa.
     *
     * Define cxbco_rec, opercai_rec, seqcai_rec, dtpagi_rec como NULL,
     * zera vlrpag_rec e restaura vlrsal_rec para vlrdup_rec.
     * Registra log de auditoria para cada documento desvinculado.
     *
     * @param cxbco   código do caixa (cxbco)
     * @param opercai operação do caixa
     * @param seqcai  sequência do caixa
     * @param dtpagi  data de pagamento (YYYY-MM-DD)
     * @param filial  filial (opcional)
     * @param filialLog filial para log de auditoria
     * @param usuarioLog usuário para log de auditoria
     * @return número de linhas afetadas
     */
    @Transactional
    public int estornarPorLancamento(String cxbco, Integer opercai, Integer seqcai, String dtpagi, Integer filial, String filialLog, String usuarioLog) {
        try {
            // Primeiro, buscar os documentos que serão afetados para gerar o log
            String sqlSelect = """
                SELECT r.codigo_rec, r.documento_rec, r.parcela_rec, r.cliente_rec, r.vlrpag_rec,
                       c.nome_cli
                FROM receber r
                LEFT JOIN clientes c ON r.cliente_rec = c.codigo_cli
                WHERE r.cxbco_rec = ?
                  AND r.opercai_rec = ?
                  AND r.seqcai_rec = ?
                  AND r.dtpagi_rec = ?
            """;
            Object[] paramsSelect;
            if (filial != null) {
                sqlSelect += " AND r.filial_rec = ?";
                paramsSelect = new Object[]{cxbco, opercai, seqcai, dtpagi, filial};
            } else {
                paramsSelect = new Object[]{cxbco, opercai, seqcai, dtpagi};
            }
            List<Map<String, Object>> docs = jdbcTemplate.queryForList(sqlSelect, paramsSelect);

            // Inserir log para cada documento desvinculado
            for (Map<String, Object> doc : docs) {
                String nomeCliente = doc.get("nome_cli") != null ? doc.get("nome_cli").toString() : "";
                Long codigoDoc = doc.get("codigo_rec") != null ? ((Number) doc.get("codigo_rec")).longValue() : 0L;
                String documento = doc.get("documento_rec") != null ? doc.get("documento_rec").toString() : "";
                String parcela = doc.get("parcela_rec") != null ? doc.get("parcela_rec").toString() : "";
                
                String historicoLog = String.format(
                    "Baixa do Cliente %s Documento %s Parcela %s removida",
                    nomeCliente,
                    documento,
                    parcela
                );
                insertLogAuditoriaBaixa(filialLog, usuarioLog, "02", historicoLog, seqcai != null ? seqcai.longValue() : 0L);
            }

            // Converter data para formato SQL/date (já vem YYYY-MM-DD) e formato legado se necessário
            String sql = """
                UPDATE receber
                SET cxbco_rec = NULL,
                    opercai_rec = NULL,
                    seqcai_rec = NULL,
                    dtpagi_rec = NULL,
                    vlrpag_rec = NULL,
                    vlrsal_rec = vlrdup_rec
                WHERE cxbco_rec = ?
                  AND opercai_rec = ?
                  AND seqcai_rec = ?
                  AND dtpagi_rec = ?
            """;

            // Se filial informado, adicionar filtro
            Object[] params;
            if (filial != null) {
                sql += " AND filial_rec = ?";
                params = new Object[]{cxbco, opercai, seqcai, dtpagi, filial};
            } else {
                params = new Object[]{cxbco, opercai, seqcai, dtpagi};
            }

            int updated = jdbcTemplate.update(sql, params);
            log.info("Estornado {} documentos em receber para lancamento cxbco={}, opercai={}, seqcai={}, dtpagi={}", updated, cxbco, opercai, seqcai, dtpagi);
            return updated;
        } catch (Exception e) {
            log.error("Erro ao estornar documentos receber", e);
            throw new RuntimeException(e);
        }
    }

    /**
     * Insere log de auditoria para remoção de baixa de documento
     */
    private void insertLogAuditoriaBaixa(String filialLog, String usuarioLog, String operLog, String historicoLog, Long seqCaiRef) {
        try {
            String sql = "INSERT INTO log (filial_log, chave_log, usuario_log, programa_log, oper_log, histor_log) VALUES (?, NOW(), ?, ?, ?, ?)";
            jdbcTemplate.update(sql, filialLog, usuarioLog, "CAI001", operLog, historicoLog);
            log.info("[DocumentoReceberService] Log baixa removida inserido: oper={}, historico={}", operLog, historicoLog);
        } catch (Exception e) {
            log.error("[DocumentoReceberService] Erro ao inserir log auditoria: {}", e.getMessage());
        }
    }
}
