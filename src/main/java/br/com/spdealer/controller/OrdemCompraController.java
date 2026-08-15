package br.com.spdealer.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import br.com.spdealer.util.SessionHelper;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/compras")
public class OrdemCompraController {

    @Autowired
    private JdbcTemplate jdbc;

    private static final Logger logger = LoggerFactory.getLogger(OrdemCompraController.class);

    private static final DateTimeFormatter DATE_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_LEGACY = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * Salva uma ordem de compra (cabeçalho + itens) em transação.
     */
    @PostMapping
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> create(HttpSession session, @RequestBody Map<String, Object> body) {
        try {
            String empre = safeTrim(body.get("empresa"));
            if (empre == null || empre.isEmpty()) {
                try {
                    empre = SessionHelper.getEmpresaFromSession(session);
                } catch (Exception e) {
                    empre = "001";
                }
            }
            String origem = safeTrim(body.get("origem"));
            if (origem == null || origem.isEmpty()) {
                origem = "N";
            }
            if (origem.length() > 1) {
                return ResponseEntity.badRequest().body(Map.of("error", "O campo Fornecedor (origem) aceita apenas N ou I."));
            }

            // Gera o próximo número da ordem (por empresa + origem)
            Integer next = jdbc.queryForObject(
                "SELECT COALESCE(MAX(CAST(nrordem_cpr AS UNSIGNED)), 0) + 1 FROM compras WHERE empre_cpr = ? AND origem_cpr = ? FOR UPDATE",
                Integer.class, empre, origem);
            String nrordem = String.format("%09d", next);

            String dtpedido = safeTrim(body.get("dtpedido"));
            String dtprev = safeTrim(body.get("dtprev"));
            String condpag = safeTrim(body.get("condpag"));
            String fornec = safeTrim(body.get("fornec"));
            String codcobranca = safeTrim(body.get("codcobranca"));
            String cliente = safeTrim(body.get("cliente"));
            String consultor = safeTrim(body.get("consultor"));
            String classe = safeTrim(body.get("classe"));
            String modelo = safeTrim(body.get("modelo"));
            String obsospe = safeTrim(body.get("obsospe"));
            String obs = safeTrim(body.get("obs"));
            String efetivado = safeTrim(body.get("efetivado"));
            String estoque = safeTrim(body.get("estoque"));
            String tipo = safeTrim(body.get("tipo"));

            if (dtpedido == null || dtpedido.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "A data de emissão é obrigatória."));
            }
            if (fornec == null || fornec.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "O código do fornecedor é obrigatório."));
            }
            if (fornec.length() > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "O código do fornecedor deve ter no máximo 5 dígitos."));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itens = (List<Map<String, Object>>) body.getOrDefault("itens", new ArrayList<Map<String, Object>>());
            if (itens.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Adicione ao menos um item à ordem de compra."));
            }

            BigDecimal total = BigDecimal.ZERO;
            List<Object[]> itensParams = new ArrayList<>();
            for (int i = 0; i < itens.size(); i++) {
                Map<String, Object> item = itens.get(i);
                String fab = safeTrim(item.get("fab"));
                String produto = safeTrim(item.get("produto"));
                String descr = safeTrim(item.get("descr"));
                BigDecimal qtde = toBigDecimal(item.get("qtde"));
                BigDecimal preco = toBigDecimal(item.get("preco"));
                String tipom = safeTrim(item.get("tipom"));
                String serie = safeTrim(item.get("serie"));

                if (produto == null || produto.isEmpty()) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Informe o código do produto na linha " + (i + 1) + "."));
                }
                if (qtde == null || qtde.signum() <= 0) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Informe a quantidade do produto na linha " + (i + 1) + "."));
                }
                if (preco == null || preco.signum() < 0) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Informe o valor unitário do produto na linha " + (i + 1) + "."));
                }

                BigDecimal vlrtot = (preco == null ? BigDecimal.ZERO : preco).multiply(qtde == null ? BigDecimal.ZERO : qtde).setScale(4, RoundingMode.HALF_UP);
                total = total.add(vlrtot);

                itensParams.add(new Object[] {
                    empre, origem, nrordem, fab, produto, descr, qtde, preco, vlrtot, tipom, serie
                });
            }

            String sqlHeader = "INSERT INTO compras (empre_cpr, origem_cpr, nrordem_cpr, fornec_cpr, dtpedido_cpr, dtpedidoi_cpr, " +
                               "dtprev_cpr, dtprevi_cpr, condpag_cpr, codcobranca_cpr, cliente_cpr, consultor_cpr, classe_cpr, " +
                               "modelo_cpr, obsospe_cpr, obs_cpr, efetivado_cpr, estoque_cpr, tipo_cpr, vlrtot_cpr, usuario_cpr) " +
                               "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            jdbc.update(sqlHeader,
                empre, origem, nrordem, fornec,
                toLegacyDate(dtpedido), toSqlDate(dtpedido),
                toLegacyDate(dtprev), toSqlDate(dtprev),
                trunc(condpag, 30), trunc(codcobranca, 3), trunc(cliente, 100), trunc(consultor, 50),
                trunc(classe, 20), trunc(modelo, 50), trunc(obsospe, 15), trunc(obs, 100),
                trunc(efetivado, 1), trunc(estoque, 1), trunc(tipo, 1),
                total.setScale(4, RoundingMode.HALF_UP), trunc(usuarioDaSessao(session), 30));

            String sqlItem = "INSERT INTO comprasm (empre_cprm, origem_cprm, nrordem_cprm, fab_cprm, produto_cprm, descr_cprm, " +
                             "qtde_cprm, preco_cprm, vlrtot_cprm, tipom_cprm, serie_cprm) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            for (Object[] params : itensParams) {
                jdbc.update(sqlItem, params);
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "nrordem", nrordem,
                "empre", empre,
                "origem", origem,
                "vlrtot", total.setScale(4, RoundingMode.HALF_UP).toPlainString()
            ));
        } catch (Exception e) {
            logger.error("Erro ao salvar ordem de compra", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao salvar ordem de compra: " + e.getMessage()));
        }
    }

    /**
     * F4 estrito de clientes/fornecedores: tipo=F (fornecedores) ou tipo=C (clientes),
     * retornando somente cliforn_cli = F ou C (sem A/vazios).
     */
    @GetMapping("/clientes")
    public ResponseEntity<?> listClientes(@RequestParam(required = false, defaultValue = "C") String tipo,
                                          @RequestParam(required = false) String search) {
        String cliforn = "F".equalsIgnoreCase(tipo) ? "F" : "C";
        StringBuilder sql = new StringBuilder(
            "SELECT TRIM(codigo_cli) AS codigo, TRIM(nome_cli) AS nome, TRIM(cgccpf_cli) AS documento " +
            "FROM clientes WHERE cliforn_cli = ? ");
        List<Object> params = new ArrayList<>();
        params.add(cliforn);
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (UPPER(nome_cli) LIKE ? OR CAST(codigo_cli AS CHAR) LIKE ?) ");
            String like = "%" + search.trim().toUpperCase() + "%";
            params.add(like);
            params.add(like);
        }
        sql.append("ORDER BY nome_cli");
        try {
            return ResponseEntity.ok(jdbc.queryForList(sql.toString(), params.toArray()));
        } catch (Exception e) {
            logger.error("Erro ao listar clientes/fornecedores", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao listar clientes/fornecedores: " + e.getMessage()));
        }
    }

    /**
     * Busca dados do produto: descrição (estoque) e estoque máximo/mínimo/atual e preço de reposição (kardex).
     */
    @GetMapping("/produto-info")
    public ResponseEntity<?> produtoInfo(HttpSession session,
                                         @RequestParam(required = false, defaultValue = "") String fab,
                                         @RequestParam(required = false, defaultValue = "") String codigo) {
        if (codigo == null || codigo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Código do produto é obrigatório."));
        }
        String dep = "000001";
        try {
            String depSession = SessionHelper.getDeposito6FromSession(session);
            if (depSession != null && !depSession.isEmpty()) {
                dep = depSession;
            }
        } catch (Exception e) {
            // mantém fallback
        }
        String sql = "SELECT TRIM(e.descr_est) AS descr, COALESCE(k.estmax_kar, 0) AS estmax_kar, " +
                     "COALESCE(k.estmin_kar, 0) AS estmin_kar, COALESCE(k.qtde_kar, 0) AS qtde_kar, " +
                     "COALESCE(k.precorep_kar, 0) AS precorep_kar " +
                     "FROM estoque e " +
                     "LEFT JOIN kardex k ON k.fab_kar = e.fab_est AND k.codprod_kar = e.codprod_est " +
                     "AND k.dep_kar = ? AND k.registro_kar = '01' " +
                     "WHERE e.codprod_est = ? AND e.fab_est = ?";
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(sql, dep, codigo.trim(), fab == null ? "" : fab.trim());
            if (rows.isEmpty()) {
                return ResponseEntity.ok(Map.of("descr", "", "estmax_kar", 0, "estmin_kar", 0, "qtde_kar", 0, "precorep_kar", 0));
            }
            return ResponseEntity.ok(rows.get(0));
        } catch (Exception e) {
            logger.error("Erro ao buscar dados do produto", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao buscar dados do produto: " + e.getMessage()));
        }
    }

    // ===================== HELPERS =====================

    private String safeTrim(Object value) {
        if (value == null) {
            return null;
        }
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? null : s;
    }

    private String trunc(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() > max ? value.substring(0, max) : value;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }
        try {
            String s = String.valueOf(value).trim();
            if (s.contains(",")) {
                s = s.replace(".", "").replace(",", ".");
            }
            if (s.isEmpty()) {
                return null;
            }
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer toLegacyDate(String ddMMyyyy) {
        if (ddMMyyyy == null || ddMMyyyy.trim().isEmpty()) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(ddMMyyyy.trim(), DATE_BR);
            return Integer.valueOf(date.format(DATE_LEGACY));
        } catch (Exception e) {
            return null;
        }
    }

    private java.sql.Date toSqlDate(String ddMMyyyy) {
        if (ddMMyyyy == null || ddMMyyyy.trim().isEmpty()) {
            return null;
        }
        try {
            return java.sql.Date.valueOf(LocalDate.parse(ddMMyyyy.trim(), DATE_BR));
        } catch (Exception e) {
            return null;
        }
    }

    private String usuarioDaSessao(HttpSession session) {
        try {
            Object user = session.getAttribute("username");
            return user == null ? null : String.valueOf(user);
        } catch (Exception e) {
            return null;
        }
    }
}