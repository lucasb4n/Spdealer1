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
public class DocumentoPagarService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * MÉTODO 1: Buscar documentos a PAGAR de um fornecedor
     * 
     * SQL:
     * SELECT codigo_pag, documento_pag, parcela_pag, dtvenci_pag,
     *        vlr_pag, vlrmulta_pag, vlrjuros_pag,
     *        (vlr_pag + vlrmulta_pag + vlrjuros_pag) as vlrtot_pag,
     *        vlrsal_pag, status_pag
     * FROM pagar
     * WHERE fornecedor_pag = ?
     *   AND filial_pag = ?
     *   AND status_pag IN (?, ?)
     * ORDER BY dtvenci_pag ASC
     * 
     * @param fornecedorId Código do fornecedor
     * @param filial       ID da filial do usuário
     * @param status       Array de status (ex: ["P", "A"])
     * @return Lista de mapas com documentos
     */
    public List<Map<String, Object>> buscarDocumentosPorFornecedor(
            String fornecedorId,
            Integer filial,
            String[] status
    ) {
        try {
            String sql = """
                SELECT 
                    codigo_pag,
                    documento_pag,
                    parcela_pag,
                    dtvenci_pag,
                    vlr_pag,
                    vlrmulta_pag,
                    vlrjuros_pag,
                    (vlr_pag + COALESCE(vlrmulta_pag, 0) + COALESCE(vlrjuros_pag, 0)) as vlrtot_pag,
                    vlrsal_pag,
                    status_pag,
                    filial_pag
                FROM pagar
                WHERE fornecedor_pag = ?
                  AND filial_pag = ?
                  AND status_pag IN (?, ?)
                ORDER BY dtvenci_pag ASC
                """;

            List<Map<String, Object>> documentos = jdbcTemplate.queryForList(
                sql,
                fornecedorId,
                filial,
                status[0],
                status.length > 1 ? status[1] : "X"
            );

            log.info("Encontrados {} documentos a pagar para fornecedor {}", 
                documentos.size(), fornecedorId);

            return documentos;

        } catch (Exception e) {
            log.error("Erro ao buscar documentos a pagar", e);
            throw new RuntimeException("Erro ao buscar documentos: " + e.getMessage());
        }
    }

    /**
     * MÉTODO 2: Marcar documentos como PAGOS
     * 
     * UPDATE pagar
     * SET dtpagi_pag = '2025/11/08',
     *     dtpag_pag = '08/11/2025',
     *     cxbco_pag = ?,
     *     opercai_pag = ?,
     *     seqcai_pag = ?,
     *     vlrsal_pag = 0,
     *     status_pag = 'P'
     * WHERE codigo_pag IN (1, 2, 3, 4)
     *   AND filial_pag = ?
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
                SELECT codigo_pag, (COALESCE(vlr_pag,0) + COALESCE(vlrmulta_pag,0) + COALESCE(vlrjuros_pag,0) - COALESCE(vlrdesc_pag,0)) as vlrtot_pag
                FROM pagar
                WHERE codigo_pag IN (%s)
                  AND filial_pag = ?
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
                UPDATE pagar
                SET dtpagi_pag = ?,
                    dtpag_pag = ?,
                    cxbco_pag = ?,
                    opercai_pag = ?,
                    seqcai_pag = ?,
                    vlrpag_pag = ?,
                    vlrsal_pag = ?
                WHERE codigo_pag = ?
                """;

            int totalUpdated = 0;
            for (Map<String, Object> r : rows) {
                Long codigo = ((Number) r.get("codigo_pag")).longValue();
                Number vlrTotNum = (Number) r.get("vlrtot_pag");
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
     * Estorna vinculação de documentos pagos vinculados a um lançamento de caixa.
     * Define cxbco_pag, opercai_pag, seqcai_pag, dtpagi_pag como NULL,
     * zera vlrpag_pag e restaura vlrsal_pag para vlrdup_pag.
     * Registra log de auditoria para cada documento desvinculado.
     *
     * @param cxbco   código do caixa
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
                SELECT p.codigo_pag, p.documento_pag, p.parcela_pag, p.fornecedor_pag, p.vlrpag_pag,
                       f.nome_for
                FROM pagar p
                LEFT JOIN fornecedores f ON p.fornecedor_pag = f.codigo_for
                WHERE p.cxbco_pag = ?
                  AND p.opercai_pag = ?
                  AND p.seqcai_pag = ?
                  AND p.dtpagi_pag = ?
            """;
            Object[] paramsSelect;
            if (filial != null) {
                sqlSelect += " AND p.filial_pag = ?";
                paramsSelect = new Object[]{cxbco, opercai, seqcai, dtpagi, filial};
            } else {
                paramsSelect = new Object[]{cxbco, opercai, seqcai, dtpagi};
            }
            List<Map<String, Object>> docs = jdbcTemplate.queryForList(sqlSelect, paramsSelect);

            // Inserir log para cada documento desvinculado
            for (Map<String, Object> doc : docs) {
                String nomeFornecedor = doc.get("nome_for") != null ? doc.get("nome_for").toString() : "";
                Long codigoDoc = doc.get("codigo_pag") != null ? ((Number) doc.get("codigo_pag")).longValue() : 0L;
                String documento = doc.get("documento_pag") != null ? doc.get("documento_pag").toString() : "";
                String parcela = doc.get("parcela_pag") != null ? doc.get("parcela_pag").toString() : "";
                
                String historicoLog = String.format(
                    "Baixa do Fornecedor %s Documento %s Parcela %s removida",
                    nomeFornecedor,
                    documento,
                    parcela
                );
                insertLogAuditoriaBaixa(filialLog, usuarioLog, "02", historicoLog, seqcai != null ? seqcai.longValue() : 0L);
            }

            String sql = """
                UPDATE pagar
                SET cxbco_pag = NULL,
                    opercai_pag = NULL,
                    seqcai_pag = NULL,
                    dtpagi_pag = NULL,
                    vlrpag_pag = NULL,
                    vlrsal_pag = vlrdup_pag
                WHERE cxbco_pag = ?
                  AND opercai_pag = ?
                  AND seqcai_pag = ?
                  AND dtpagi_pag = ?
            """;

            Object[] params;
            if (filial != null) {
                sql += " AND filial_pag = ?";
                params = new Object[]{cxbco, opercai, seqcai, dtpagi, filial};
            } else {
                params = new Object[]{cxbco, opercai, seqcai, dtpagi};
            }

            int updated = jdbcTemplate.update(sql, params);
            log.info("Estornado {} documentos em pagar para lancamento cxbco={}, opercai={}, seqcai={}, dtpagi={}", updated, cxbco, opercai, seqcai, dtpagi);
            return updated;
        } catch (Exception e) {
            log.error("Erro ao estornar documentos pagar", e);
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
            log.info("[DocumentoPagarService] Log baixa removida inserido: oper={}, historico={}", operLog, historicoLog);
        } catch (Exception e) {
            log.error("[DocumentoPagarService] Erro ao inserir log auditoria: {}", e.getMessage());
        }
    }
}
