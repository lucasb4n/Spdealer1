package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class OrcamentoService {

    @Autowired
    private JdbcTemplate jdbc;

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final String FILIAL = "001";
    private static final String DEP_PADRAO = "001";
    private static final String REGISTRO_KAR = "01";

    public void processarPecfal(String numeroOrp, int seq, String fab, String codigo,
                                 String tipoOrp, BigDecimal qtSol, BigDecimal qtAloc,
                                 BigDecimal qtFalta, String motivo, String novoOrpp,
                                 Integer pedpen) {
        if (fab == null || codigo == null) return;

        if (qtAloc != null && qtAloc.compareTo(ZERO) > 0) {
            adjustKardexAllocation(DEP_PADRAO, fab, codigo, qtAloc);
        }

        removePecfal(numeroOrp, seq);

        boolean hasMotivo = motivo != null && !motivo.trim().isEmpty()
                            && !"0".equals(motivo.trim()) && !"".equals(motivo.trim());
        boolean hasQtFalta = qtFalta != null && qtFalta.compareTo(ZERO) > 0;
        boolean isNovo = novoOrpp != null && !novoOrpp.trim().isEmpty()
                         && !"0".equals(novoOrpp.trim());

        if (!hasMotivo && hasQtFalta && !isNovo && isPecfalGer()) {
            if ("P".equals(tipoOrp)) {
                generatePecfal(numeroOrp, seq, fab, codigo, qtFalta);
            } else if (pedpen != null && pedpen == 1) {
                generatePecfal(numeroOrp, seq, fab, codigo, qtFalta);
            }
        }
    }

    public void removerPecfalPorOrcamento(String numeroOrp) {
        jdbc.update("DELETE FROM pecfal WHERE FAL_PEDIDO = ?", numeroOrp);
    }

    public void reverterAlocacaoPorOrcamento(String numeroOrp, String dep) {
        List<Map<String, Object>> itens = jdbc.queryForList(
            "SELECT FAB_ORPP, CODIGO_ORPP, QTALOC_ORPP FROM orcampp WHERE NUMERO_ORPP = ?",
            numeroOrp);
        for (Map<String, Object> item : itens) {
            BigDecimal qtaloc = getBigDecimal(item, "QTALOC_ORPP");
            if (qtaloc != null && qtaloc.compareTo(ZERO) > 0) {
                String fab = getString(item, "FAB_ORPP");
                String codigo = getString(item, "CODIGO_ORPP");
                if (fab != null && codigo != null) {
                    adjustKardexAllocation(dep, fab, codigo, qtaloc.negate());
                }
            }
        }
    }

    public void removerPecfalPorItem(String numeroOrp, int seq) {
        removePecfal(numeroOrp, seq);
    }

    private void adjustKardexAllocation(String dep, String fab, String codigo, BigDecimal delta) {
        jdbc.update("UPDATE kardex SET QTALOC_KAR = GREATEST(COALESCE(QTALOC_KAR, 0) + ?, 0) " +
            "WHERE DEP_KAR = ? AND REGISTRO_KAR = ? AND FAB_KAR = ? AND CODPROD_KAR = ? " +
            "AND RESTO_KAR = ' '",
            delta, dep, REGISTRO_KAR, fab, codigo);
    }

    private void removePecfal(String numeroOrp, int seq) {
        jdbc.update("DELETE FROM pecfal WHERE FAL_PEDIDO = ? AND FAL_SEQUENCIA = ?",
            numeroOrp, String.format("%03d", seq));
    }

    private void generatePecfal(String numeroOrp, int seq, String fab, String codigo,
                                 BigDecimal qtde) {
        String seqP = String.format("%03d", seq);
        LocalDate hoje = LocalDate.now();
        String hora = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));

        List<Map<String, Object>> orc = jdbc.queryForList(
            "SELECT NOME_CLI FROM orcamp WHERE NUMERO_ORP = ?", numeroOrp);
        String nomeCli = orc.isEmpty() ? "" : getString(orc.get(0), "NOME_CLI");

        List<Map<String, Object>> prod = jdbc.queryForList(
            "SELECT DESCR_EST FROM estoque WHERE FAB_EST = ? AND CODPROD_EST = ?",
            fab, codigo);
        String descr = prod.isEmpty() ? "" : getString(prod.get(0), "DESCR_EST");

        jdbc.update(
            "INSERT INTO pecfal (FAL_FILIAL, FAL_DATA, FAL_HORA, FAL_FAB, FAL_CODPROD, " +
            "FAL_DESCR, FAL_PEDIDO, FAL_SEQUENCIA, FAL_QTDE, FAL_STATUS, FAL_NOME_CLI, " +
            "FAL_ORIGEM_CPR, FAL_SEQUENCIA_CPR, FAL_DEP) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            FILIAL, hoje, hora, fab, codigo, descr,
            numeroOrp, seqP, qtde, "A", nomeCli,
            "O", numeroOrp, DEP_PADRAO);
    }

    private boolean isPecfalGer() {
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT PECFAL_GER FROM parametros_gerais LIMIT 1");
            if (!rows.isEmpty()) {
                Object v = rows.get(0).get("PECFAL_GER");
                return v != null && ("S".equals(v.toString()) || "1".equals(v.toString()));
            }
        } catch (Exception ignored) {}
        return false;
    }

    private String getString(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }

    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v == null) return null;
        if (v instanceof BigDecimal) return (BigDecimal) v;
        if (v instanceof Number) return BigDecimal.valueOf(((Number) v).doubleValue());
        try { return new BigDecimal(v.toString().replace(",", ".")); } catch (Exception e) { return null; }
    }
}
