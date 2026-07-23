package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class VendaPerdidaService {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private OrcamentoService orcamentoService;

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final String FILIAL = "001";
    private static final String DEP_PADRAO = "001";
    private static final String REGISTRO_KAR = "01";

    private String p(String numero) {
        if (numero == null) return null;
        return String.format("%08d", Integer.parseInt(numero));
    }

    private String pf(Integer numero) {
        if (numero == null) return null;
        return String.format("%08d", numero);
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

    @Transactional(rollbackFor = Exception.class)
    public void processarPerdaItem(String numeroOrp, int seq, String motivo, Integer filial) {
        String filialP = filial != null ? String.format("%03d", filial) : FILIAL;
        String numeroP = pf(Integer.parseInt(numeroOrp));

        Map<String, Object> item = readOrcampp(numeroP, seq);
        if (item == null) return;

        Map<String, Object> header = readOrcamp(numeroP, filialP);
        if (header == null) return;

        String fab = getString(item, "FAB_ORPP");
        String codigo = getString(item, "CODIGO_ORPP");
        String tipoOrp = getString(header, "TIPO_ORP");

        Map<String, Object> kardex = readKardex(DEP_PADRAO, fab, codigo);

        BigDecimal precustoKar = ZERO;
        BigDecimal precogarKar = ZERO;

        if (kardex != null) {
            precustoKar = val(getBigDecimal(kardex, "PRECUSTO_KAR"));
            precogarKar = val(getBigDecimal(kardex, "PRECOGAR_KAR"));
        }

        if ("P".equals(tipoOrp)) {
            BigDecimal qtaloc = val(getBigDecimal(item, "QTALOC_ORPP"));
            if (qtaloc.compareTo(ZERO) > 0 && motivo != null && !motivo.trim().isEmpty()) {
                adjustKardexAllocation(DEP_PADRAO, fab, codigo, qtaloc.negate());
                jdbc.update("UPDATE orcampp SET QTALOC_ORPP = 0, ALOCADO_ORPP = ' ' " +
                    "WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ?", numeroP, String.format("%08d", seq));
            }
        }

        if (!"P".equals(tipoOrp) && kardex == null) {
            precustoKar = ZERO;
            precogarKar = ZERO;
        }

        String vendedor = getString(item, "VENDEDOR_ORPP");
        if (vendedor == null || vendedor.trim().isEmpty()) {
            vendedor = getString(header, "VENDEDOR_ORP");
        }
        String depto = getString(header, "DPPECAS_ORP");
        if (depto == null || depto.trim().isEmpty()) depto = DEP_PADRAO;

        String datahr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String tipocli = getString(header, "TIPOCLI_ORP");
        if (tipocli == null) tipocli = "F";
        String cgccpf = getString(header, "CGCCPF_CLI");
        String modelo = getString(item, "MODELO_ORPP");
        String descr = getString(item, "DESCR_ORPP");
        BigDecimal qtfalta = val(getBigDecimal(item, "QTFALTA_ORPP"));
        BigDecimal precopub = val(getBigDecimal(item, "PRECOPUB_ORPP"));

        String motivoAtual = getString(item, "MOTIVO_ORPP");
        if (motivoAtual == null) motivoAtual = "";

        boolean motivoChanged = motivoAtual.trim().isEmpty() || !motivoAtual.trim().equals(motivo);

        if (motivoChanged) {
            deleteVenpderPorItem(numeroP, fab, codigo, depto, vendedor);
        }

        jdbc.update("UPDATE orcampp SET MOTIVO_ORPP = ?, QTPERD_ORPP = COALESCE(QTREC_ORPP, 0), " +
            "CODIGO_MPER = ?, FECHADO_ORPP = 2 WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ?",
            motivo, motivo, numeroP, String.format("%08d", seq));

        boolean venpderExiste = checkVenpderExiste(datahr, vendedor, depto, numeroP, fab, codigo);
        if (!venpderExiste) {
            BigDecimal remcusto = calcularRemcusto(precustoKar);
            insertVenpder(
                DEP_PADRAO, datahr, vendedor, depto, "  ", numeroP, fab, codigo,
                descr, tipocli, cgccpf, qtfalta, precustoKar, precopub, precogarKar,
                codigo, motivo, modelo, remcusto, seq
            );
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void reverterPerdaItem(String numeroOrp, int seq, Integer filial) {
        String filialP = filial != null ? String.format("%03d", filial) : FILIAL;
        String numeroP = pf(Integer.parseInt(numeroOrp));

        Map<String, Object> item = readOrcampp(numeroP, seq);
        if (item == null) return;

        String fab = getString(item, "FAB_ORPP");
        String codigo = getString(item, "CODIGO_ORPP");

        String motivoAtual = getString(item, "MOTIVO_ORPP");
        if (motivoAtual != null && !motivoAtual.trim().isEmpty()) {
            String vendedor = getString(item, "VENDEDOR_ORPP");
            String depto = DEP_PADRAO;
            deleteVenpderPorItem(numeroP, fab, codigo, depto, vendedor);
        }

        Map<String, Object> kardex = readKardexTemporizador(DEP_PADRAO, fab, codigo);

        if (kardex != null) {
            BigDecimal qtdeKar = val(getBigDecimal(kardex, "QTDE_KAR"));
            BigDecimal qtalocKar = val(getBigDecimal(kardex, "QTALOC_KAR"));
            BigDecimal qtsol = val(getBigDecimal(item, "QTSOL_ORPP"));
            BigDecimal qtdev = val(getBigDecimal(item, "QTDEV_ORPP"));
            BigDecimal qtalocOrpp = val(getBigDecimal(item, "QTALOC_ORPP"));

            BigDecimal disponivel = qtdeKar.subtract(qtalocKar);

            BigDecimal newQtalocKar;
            BigDecimal newQtalocOrpp;
            BigDecimal newQtfalta;

            if (qtsol.compareTo(disponivel.add(qtalocOrpp)) <= 0) {
                newQtalocKar = qtalocKar.add(qtsol.subtract(qtdev).subtract(qtalocOrpp));
                newQtalocOrpp = qtsol.subtract(qtdev);
                newQtfalta = ZERO;
                jdbc.update("UPDATE orcampp SET MOTIVO_ORPP = NULL, QTPERD_ORPP = 0, " +
                    "CODIGO_MPER = NULL, QTFALTA_ORPP = 0, ALOCADO_ORPP = 'S', " +
                    "FECHADO_ORPP = 0 WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ?",
                    numeroP, String.format("%08d", seq));
            } else {
                BigDecimal wkQtde = disponivel.add(qtalocOrpp).subtract(qtsol).add(qtdev).abs();
                newQtalocKar = qtalocKar.add(qtsol.subtract(wkQtde));
                newQtalocOrpp = qtsol.subtract(wkQtde);
                newQtfalta = wkQtde;

                if (newQtalocOrpp.compareTo(ZERO) == 0) {
                    jdbc.update("UPDATE orcampp SET MOTIVO_ORPP = NULL, QTPERD_ORPP = 0, " +
                        "CODIGO_MPER = NULL, QTFALTA_ORPP = ?, ALOCADO_ORPP = ' ', " +
                        "FECHADO_ORPP = 0 WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ?",
                        newQtfalta, numeroP, String.format("%08d", seq));
                } else {
                    jdbc.update("UPDATE orcampp SET MOTIVO_ORPP = NULL, QTPERD_ORPP = 0, " +
                        "CODIGO_MPER = NULL, QTFALTA_ORPP = ?, QTALOC_ORPP = ?, ALOCADO_ORPP = 'S', " +
                        "FECHADO_ORPP = 0 WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ?",
                        newQtfalta, newQtalocOrpp, numeroP, String.format("%08d", seq));
                }

                if (newQtfalta.compareTo(ZERO) > 0) {
                    String novoOrpp = getString(item, "NOVO_ORPP");
                    if (novoOrpp == null || novoOrpp.trim().equals("0")) {
                        orcamentoService.removerPecfalPorItem(numeroP, seq);
                        orcamentoService.processarPecfal(
                            numeroP, seq, fab, codigo, "P",
                            null, null, newQtfalta, null, novoOrpp, null
                        );
                    }
                }
            }

            jdbc.update("UPDATE kardex SET QTALOC_KAR = ? WHERE FAB_KAR = ? AND CODPROD_KAR = ? AND DEP_KAR = ?",
                newQtalocKar, fab, codigo, DEP_PADRAO);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public int processarPerdaOrcamento(Integer numero, Integer filial, String motivo) {
        String filialP = filial != null ? String.format("%03d", filial) : FILIAL;
        String numeroP = pf(numero);

        List<Map<String, Object>> itens = jdbc.queryForList(
            "SELECT REQUIS_ORPP, FAB_ORPP, CODIGO_ORPP FROM orcampp " +
            "WHERE NUMERO_ORPP = ? AND (FECHADO_ORPP IS NULL OR FECHADO_ORPP = 0)",
            numeroP);

        int totalItens = itens.size();
        int itensProcessados = 0;

        for (Map<String, Object> item : itens) {
            int seq = Integer.parseInt(getString(item, "REQUIS_ORPP").trim());
            processarPerdaItem(numeroP, seq, motivo, filial);
            itensProcessados++;
        }

        int qtdPerda = itens.size();
        if (qtdPerda > 0) {
            boolean todosPerdidos = jdbc.queryForObject(
                "SELECT COUNT(*) FROM orcampp WHERE NUMERO_ORPP = ? AND " +
                "(FECHADO_ORPP IS NULL OR FECHADO_ORPP < 2)", Integer.class, numeroP) == 0;

            if (todosPerdidos) {
                jdbc.update("UPDATE orcamp SET FECHADO_ORP = 2, TIPO_ORP = 'O', NOTA_ORP = ? " +
                    "WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?",
                    numeroP, numeroP, filialP);
            } else {
                String notaAtual = jdbc.queryForObject(
                    "SELECT NOTA_ORP FROM orcamp WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?",
                    String.class, numeroP, filialP);
                if (notaAtual != null && notaAtual.trim().equals(numeroP)) {
                    jdbc.update("UPDATE orcamp SET FECHADO_ORP = 0, NOTA_ORP = NULL " +
                        "WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?", numeroP, filialP);
                } else {
                    jdbc.update("UPDATE orcamp SET FECHADO_ORP = 0 " +
                        "WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?", numeroP, filialP);
                }
            }
        }

        return qtdPerda;
    }

    @Transactional(rollbackFor = Exception.class)
    public int reverterPerdaOrcamento(Integer numero, Integer filial) {
        String filialP = filial != null ? String.format("%03d", filial) : FILIAL;
        String numeroP = pf(numero);

        List<Map<String, Object>> itens = jdbc.queryForList(
            "SELECT REQUIS_ORPP FROM orcampp WHERE NUMERO_ORPP = ? AND FECHADO_ORPP = 2",
            numeroP);

        for (Map<String, Object> item : itens) {
            int seq = Integer.parseInt(getString(item, "REQUIS_ORPP").trim());
            reverterPerdaItem(numeroP, seq, filial);
        }

        jdbc.update("UPDATE orcamp SET FECHADO_ORP = 0 WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?",
            numeroP, filialP);

        return itens.size();
    }

    private Map<String, Object> readOrcampp(String numeroOrp, int seq) {
        String seqP = String.format("%08d", seq);
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT * FROM orcampp WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ?",
            numeroOrp, seqP);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> readOrcamp(String numeroP, String filialP) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT * FROM orcamp WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?",
            numeroP, filialP);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> readKardex(String dep, String fab, String codigo) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT * FROM kardex WHERE DEP_KAR = ? AND REGISTRO_KAR = ? " +
            "AND FAB_KAR = ? AND CODPROD_KAR = ? AND RESTO_KAR = ' '",
            dep, REGISTRO_KAR, fab, codigo);
        return rows.isEmpty() ? null : rows.get(0);
    }

    private Map<String, Object> readKardexTemporizador(String dep, String fab, String codigo) {
        return readKardex(dep, fab, codigo);
    }

    private void adjustKardexAllocation(String dep, String fab, String codigo, BigDecimal delta) {
        jdbc.update("UPDATE kardex SET QTALOC_KAR = GREATEST(COALESCE(QTALOC_KAR, 0) + ?, 0) " +
            "WHERE DEP_KAR = ? AND REGISTRO_KAR = ? AND FAB_KAR = ? AND CODPROD_KAR = ? " +
            "AND RESTO_KAR = ' '",
            delta, dep, REGISTRO_KAR, fab, codigo);
    }

    private void deleteVenpderPorItem(String numeroOrp, String fab, String codigo,
                                       String depto, String vendedor) {
        jdbc.update("DELETE FROM vendper WHERE OS_PER = ? AND FAB_PER = ? AND PRODUTO_PER = ?",
            numeroOrp, fab, codigo);
    }

    private boolean checkVenpderExiste(String datahr, String vendedor, String depto,
                                        String numeroOrp, String fab, String codigo) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM vendper WHERE DATAHR_PER = ? AND VENDEDOR_PER = ? " +
            "AND DEPTO_PER = ? AND OS_PER = ? AND FAB_PER = ? AND PRODUTO_PER = ?",
            Integer.class, datahr, vendedor, depto, numeroOrp, fab, codigo);
        return count != null && count > 0;
    }

    private void insertVenpder(String dep, String datahr, String vendedor, String depto,
                                String tiposer, String os, String fab, String produto,
                                String descr, String tipopessoa, String cgccpf,
                                BigDecimal qtnatend, BigDecimal precusto, BigDecimal precopub,
                                BigDecimal precogar, String item, String motivo,
                                String modelo, BigDecimal remcusto, int seq) {
        jdbc.update(
            "INSERT INTO vendper (DEP_PER, DATAHR_PER, VENDEDOR_PER, DEPTO_PER, TIPOSER_PER, " +
            "OS_PER, FAB_PER, PRODUTO_PER, DESCR_PER, TIPOPESSOA_PER, CGCCPF_PER, " +
            "QTNATEND_PER, PRECUSTO_PER, PRECOPUB_PER, PRECOGAR_PER, REMCUSTO_PER, " +
            "ITEM_PER, MOTIVO_PER, MODELO_PER, SEQ_PER) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            dep, datahr, vendedor, depto, tiposer, os, fab, produto,
            descr, tipopessoa, cgccpf,
            qtnatend, precusto, precopub, precogar, remcusto,
            item, motivo, modelo, String.format("%03d", seq));
    }

    private BigDecimal calcularRemcusto(BigDecimal precusto) {
        if (precusto == null || precusto.compareTo(ZERO) <= 0) return ZERO;
        return precusto.multiply(new BigDecimal("1.15")).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal val(BigDecimal v) {
        return v != null ? v : ZERO;
    }
}
