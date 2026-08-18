package br.com.spdealer.service;

import lombok.extern.slf4j.Slf4j;
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
@Slf4j
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

        // Se tipoOrp não vier como "P", checar o TIPO_ORP diretamente no cabeçalho do orçamento/pedido (orcamp)
        String tipoOrpEfetivo = tipoOrp;
        if (!"P".equalsIgnoreCase(tipoOrpEfetivo)) {
            try {
                String numPadded = formatNumPadded(numeroOrp);
                List<Map<String, Object>> rows = jdbc.queryForList(
                    "SELECT TIPO_ORP FROM orcamp WHERE NUMERO_ORP = ? OR NUMERO_ORP = ?",
                    numPadded, numeroOrp);
                if (!rows.isEmpty()) {
                    String t = getString(rows.get(0), "TIPO_ORP");
                    if (t != null && !t.trim().isEmpty()) {
                        tipoOrpEfetivo = t.trim();
                    }
                }
            } catch (Exception ignored) {}
        }

        boolean hasMotivo = motivo != null && !motivo.trim().isEmpty()
                            && !"0".equals(motivo.trim()) && !"".equals(motivo.trim());
        boolean isNovo = novoOrpp != null && !novoOrpp.trim().isEmpty()
                         && !"0".equals(novoOrpp.trim());

        // Consultar o Kardex para verificar quantidade em estoque (QTDE_KAR e QTALOC_KAR)
        BigDecimal qtdeKar = null;
        BigDecimal qtalocKar = ZERO;
        try {
            List<Map<String, Object>> karRows = jdbc.queryForList(
                "SELECT COALESCE(QTDE_KAR, 0) AS QTDE_KAR, COALESCE(QTALOC_KAR, 0) AS QTALOC_KAR " +
                "FROM kardex WHERE FAB_KAR = ? AND CODPROD_KAR = ? AND (DEP_KAR = ? OR DEP_KAR = 1 OR DEP_KAR = '1' OR DEP_KAR = '001') LIMIT 1",
                fab, codigo, DEP_PADRAO);
            if (!karRows.isEmpty()) {
                qtdeKar = getBigDecimal(karRows.get(0), "QTDE_KAR");
                BigDecimal aloc = getBigDecimal(karRows.get(0), "QTALOC_KAR");
                if (aloc != null) qtalocKar = aloc;
            }
        } catch (Exception ignored) {}

        // Fallback para a quantidade pedida (qtSol)
        BigDecimal qtSolEfetiva = qtSol;
        if (qtSolEfetiva == null || qtSolEfetiva.compareTo(ZERO) <= 0) {
            if (qtAloc != null && qtAloc.compareTo(ZERO) > 0) qtSolEfetiva = qtAloc;
            else if (qtFalta != null && qtFalta.compareTo(ZERO) > 0) qtSolEfetiva = qtFalta;
        }

        // Calcular estoque disponível (qtde_kar - qtaloc_kar)
        BigDecimal disponivel = ZERO;
        if (qtdeKar != null && qtdeKar.compareTo(ZERO) > 0) {
            disponivel = qtdeKar.subtract(qtalocKar);
            if (disponivel.compareTo(ZERO) < 0) disponivel = ZERO;
        }

        // Caso a quantidade de uma peça pedida no pedido seja maior que o estoque, a diferença vai para pecfal
        BigDecimal qtFaltaEfetiva = ZERO;
        if (qtSolEfetiva != null && qtSolEfetiva.compareTo(ZERO) > 0) {
            if (qtdeKar == null || qtdeKar.compareTo(ZERO) <= 0) {
                // Sem estoque no Kardex (0 ou null): falta total pedida
                qtFaltaEfetiva = qtSolEfetiva;
            } else if (qtSolEfetiva.compareTo(disponivel) > 0) {
                // Quantidade pedida maior que a disponível no estoque: diferença vai para pecfal
                qtFaltaEfetiva = qtSolEfetiva.subtract(disponivel);
            }
        } else if (qtFalta != null && qtFalta.compareTo(ZERO) > 0) {
            qtFaltaEfetiva = qtFalta;
        }

        boolean hasQtFalta = qtFaltaEfetiva != null && qtFaltaEfetiva.compareTo(ZERO) > 0;

        if (!hasMotivo && hasQtFalta && !isNovo && isPecfalGer()) {
            if ("P".equalsIgnoreCase(tipoOrpEfetivo)) {
                generatePecfal(numeroOrp, seq, fab, codigo, qtFaltaEfetiva);
            } else if (pedpen != null && pedpen == 1) {
                generatePecfal(numeroOrp, seq, fab, codigo, qtFaltaEfetiva);
            }
        }
    }

    public void removerPecfalPorOrcamento(String numeroOrp) {
        String numPadded = formatNumPadded(numeroOrp);
        jdbc.update("DELETE FROM pecfal WHERE FAL_PEDIDO = ? OR FAL_PEDIDO = ?", numeroOrp, numPadded);
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
        String numPadded = formatNumPadded(numeroOrp);
        jdbc.update("DELETE FROM pecfal WHERE (FAL_PEDIDO = ? OR FAL_PEDIDO = ?) AND FAL_SEQUENCIA = ?",
            numeroOrp, numPadded, String.format("%03d", seq));
    }

    private void generatePecfal(String numeroOrp, int seq, String fab, String codigo,
                                 BigDecimal qtde) {
        String numPadded = formatNumPadded(numeroOrp);
        String seqP = String.format("%03d", seq);
        LocalDate hoje = LocalDate.now();
        String hora = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HHmmss"));

        List<Map<String, Object>> orc = jdbc.queryForList(
            "SELECT o.NOME_CLI, o.VENDEDOR_ORP, v.NOME_VEN " +
            "FROM orcamp o " +
            "LEFT JOIN masven v ON CAST(v.COD_VEN AS CHAR) = CAST(o.VENDEDOR_ORP AS CHAR) " +
            "WHERE o.NUMERO_ORP = ? OR o.NUMERO_ORP = ?", numPadded, numeroOrp);

        String nomeCli = "";
        String nomeSol = "";
        if (!orc.isEmpty()) {
            Map<String, Object> row = orc.get(0);
            nomeCli = getString(row, "NOME_CLI");
            if (nomeCli == null) nomeCli = "";
            nomeSol = getString(row, "NOME_VEN");
            if (nomeSol == null || nomeSol.trim().isEmpty()) {
                nomeSol = getString(row, "VENDEDOR_ORP");
            }
            if (nomeSol == null) nomeSol = "";
        }

        List<Map<String, Object>> prod = jdbc.queryForList(
            "SELECT DESCR_EST FROM estoque WHERE FAB_EST = ? AND CODPROD_EST = ?",
            fab, codigo);
        String descr = prod.isEmpty() ? "" : getString(prod.get(0), "DESCR_EST");

        java.sql.Date sqlDate = java.sql.Date.valueOf(hoje);

        try {
            jdbc.update(
                "INSERT INTO pecfal (FAL_FILIAL, FAL_DATA, FAL_HORA, FAL_FAB, FAL_CODPROD, " +
                "FAL_DESCR, FAL_PEDIDO, FAL_SEQUENCIA, FAL_QTDE, FAL_STATUS, FAL_NOME_CLI, FAL_NOME_SOL, " +
                "FAL_ORIGEM_CPR, FAL_SEQUENCIA_CPR, FAL_DEP) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                FILIAL, sqlDate, hora, fab, codigo, descr,
                numPadded, seqP, qtde, "A", nomeCli, nomeSol,
                "O", numPadded, DEP_PADRAO);
        } catch (Exception e1) {
            log.warn("Erro ao inserir em pecfal completo, executando fallback 1: {}", e1.getMessage());
            try {
                jdbc.update(
                    "INSERT INTO pecfal (FAL_FILIAL, FAL_DATA, FAL_HORA, FAL_FAB, FAL_CODPROD, " +
                    "FAL_DESCR, FAL_PEDIDO, FAL_SEQUENCIA, FAL_QTDE, FAL_STATUS, FAL_NOME_CLI, FAL_NOME_SOL) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    FILIAL, sqlDate, hora, fab, codigo, descr,
                    numPadded, seqP, qtde, "A", nomeCli, nomeSol);
            } catch (Exception e2) {
                log.warn("Erro no fallback 1 de pecfal, executando fallback essencial: {}", e2.getMessage());
                jdbc.update(
                    "INSERT INTO pecfal (FAL_FILIAL, FAL_DATA, FAL_FAB, FAL_CODPROD, " +
                    "FAL_DESCR, FAL_PEDIDO, FAL_QTDE) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    FILIAL, sqlDate, fab, codigo, descr,
                    numPadded, qtde);
            }
        }
    }

    private String formatNumPadded(String numeroOrp) {
        if (numeroOrp == null) return "";
        String digits = numeroOrp.replaceAll("\\D", "");
        if (digits.isEmpty()) return numeroOrp;
        try {
            return String.format("%08d", Integer.parseInt(digits));
        } catch (Exception e) {
            return numeroOrp;
        }
    }

    private boolean isPecfalGer() {
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT PECFAL_GER FROM parametros_gerais LIMIT 1");
            if (!rows.isEmpty()) {
                Object v = rows.get(0).get("PECFAL_GER");
                if (v == null) v = rows.get(0).get("pecfal_ger");
                if (v != null) {
                    String s = v.toString().trim();
                    return "S".equalsIgnoreCase(s) || "1".equals(s) || "TRUE".equalsIgnoreCase(s);
                }
            }
        } catch (Exception ignored) {}
        return true;
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
