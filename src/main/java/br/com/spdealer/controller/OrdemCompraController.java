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

    /**
     * Lista peças faltantes da tabela pecfal com suporte a busca e filtro por período de datas (fab, codigo, nome, qtde).
     */
    @GetMapping("/pecas-faltantes")
    public ResponseEntity<?> listPecasFaltantes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dtInicial,
            @RequestParam(required = false) String dtFinal) {
        StringBuilder sql = new StringBuilder(
            "SELECT TRIM(FAL_FAB) AS fab, " +
            "TRIM(FAL_CODPROD) AS codigo, " +
            "TRIM(FAL_DESCR) AS nome, " +
            "COALESCE(FAL_QTDE, 0) AS qtde, " +
            "FAL_DATA AS data " +
            "FROM pecfal WHERE 1=1 "
        );
        List<Object> params = new ArrayList<>();

        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (UPPER(FAL_DESCR) LIKE ? OR UPPER(FAL_CODPROD) LIKE ? OR UPPER(FAL_FAB) LIKE ?) ");
            String like = "%" + search.trim().toUpperCase() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
        }

        if (dtInicial != null && !dtInicial.trim().isEmpty()) {
            java.sql.Date dIni = parseFlexibleDate(dtInicial);
            if (dIni != null) {
                sql.append("AND FAL_DATA >= ? ");
                params.add(dIni);
            }
        }

        if (dtFinal != null && !dtFinal.trim().isEmpty()) {
            java.sql.Date dFin = parseFlexibleDate(dtFinal);
            if (dFin != null) {
                sql.append("AND FAL_DATA <= ? ");
                params.add(dFin);
            }
        }

        sql.append("ORDER BY FAL_DATA DESC, FAL_CODPROD ");

        try {
            List<Map<String, Object>> rows = jdbc.queryForList(sql.toString(), params.toArray());
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            logger.error("Erro ao consultar pecfal", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao consultar peças faltantes: " + e.getMessage()));
        }
    }

    /**
     * Lista todas as ordens de compra com seus itens para a tela de manutenção.
     */
    @GetMapping("/ordens")
    public ResponseEntity<?> listOrdens(@RequestParam(required = false) String search) {
        StringBuilder sql = new StringBuilder(
            "SELECT TRIM(c.empre_cpr) AS empre, TRIM(c.origem_cpr) AS origem, TRIM(c.nrordem_cpr) AS nrordem, " +
            "TRIM(c.fornec_cpr) AS fornecCodigo, COALESCE(TRIM(cli.nome_cli), c.fornec_cpr) AS fornecedor, " +
            "c.dtpedidoi_cpr AS dtpedidoi, c.dtpedido_cpr AS dtpedido, " +
            "c.vlrtot_cpr AS valorTotal, " +
            "TRIM(c.consultor_cpr) AS consultor, COALESCE(TRIM(v.nome_ven), c.consultor_cpr) AS vendedor, " +
            "TRIM(c.tipo_cpr) AS tipo, TRIM(c.efetivado_cpr) AS efetivado " +
            "FROM compras c " +
            "LEFT JOIN clientes cli ON TRIM(cli.codigo_cli) = TRIM(c.fornec_cpr) " +
            "LEFT JOIN masven v ON CAST(v.cod_ven AS CHAR) = CAST(c.consultor_cpr AS CHAR) " +
            "WHERE 1=1 "
        );
        List<Object> params = new ArrayList<>();
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (UPPER(c.nrordem_cpr) LIKE ? OR UPPER(cli.nome_cli) LIKE ? OR UPPER(c.fornec_cpr) LIKE ?) ");
            String like = "%" + search.trim().toUpperCase() + "%";
            params.add(like);
            params.add(like);
            params.add(like);
        }
        sql.append("ORDER BY c.dtpedidoi_cpr DESC, c.nrordem_cpr DESC");
        try {
            List<Map<String, Object>> ordens = jdbc.queryForList(sql.toString(), params.toArray());
            for (Map<String, Object> o : ordens) {
                String emp = (String) o.get("empre");
                String orig = (String) o.get("origem");
                String nr = (String) o.get("nrordem");
                List<Map<String, Object>> itens = jdbc.queryForList(
                    "SELECT TRIM(fab_cprm) AS fab, TRIM(produto_cprm) AS codigo, TRIM(descr_cprm) AS nome, " +
                    "qtde_cprm AS qtde, preco_cprm AS preco, vlrtot_cprm AS vlrtot, TRIM(tipom_cprm) AS ospe, TRIM(serie_cprm) AS serie " +
                    "FROM comprasm WHERE empre_cprm = ? AND origem_cprm = ? AND nrordem_cprm = ? ORDER BY produto_cprm",
                    emp, orig, nr);
                o.put("itens", itens);
            }
            return ResponseEntity.ok(ordens);
        } catch (Exception e) {
            logger.error("Erro ao listar ordens de compra", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao listar ordens de compra: " + e.getMessage()));
        }
    }

    /**
     * Busca detalhes completos de uma ordem de compra para popular a edição.
     */
    @GetMapping("/detalhes")
    public ResponseEntity<?> getDetalhes(@RequestParam String empre,
                                         @RequestParam String origem,
                                         @RequestParam String nrordem) {
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT TRIM(c.empre_cpr) AS empre, TRIM(c.origem_cpr) AS origem, TRIM(c.nrordem_cpr) AS nrordem, " +
                "TRIM(c.fornec_cpr) AS fornecCodigo, COALESCE(TRIM(cli.nome_cli), c.fornec_cpr) AS fornecNome, " +
                "c.dtpedidoi_cpr AS dtpedidoi, c.dtpedido_cpr AS dtpedido, " +
                "c.dtprevi_cpr AS dtprevi, c.dtprev_cpr AS dtprev, " +
                "TRIM(c.condpag_cpr) AS condpag, TRIM(c.codcobranca_cpr) AS codcobranca, " +
                "TRIM(c.cliente_cpr) AS clienteCodigo, COALESCE(TRIM(cli2.nome_cli), c.cliente_cpr) AS clienteNome, " +
                "TRIM(c.consultor_cpr) AS consultor, TRIM(c.classe_cpr) AS classe, TRIM(c.modelo_cpr) AS modelo, " +
                "TRIM(c.obsospe_cpr) AS obsospe, TRIM(c.obs_cpr) AS obs, TRIM(c.efetivado_cpr) AS efetivado, " +
                "TRIM(c.estoque_cpr) AS estoque, TRIM(c.tipo_cpr) AS tipo, c.vlrtot_cpr AS vlrtot " +
                "FROM compras c " +
                "LEFT JOIN clientes cli ON TRIM(cli.codigo_cli) = TRIM(c.fornec_cpr) " +
                "LEFT JOIN clientes cli2 ON TRIM(cli2.codigo_cli) = TRIM(c.cliente_cpr) " +
                "WHERE c.empre_cpr = ? AND c.origem_cpr = ? AND c.nrordem_cpr = ?",
                empre, origem, nrordem);

            if (rows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Ordem de compra não encontrada."));
            }

            Map<String, Object> ordem = rows.get(0);
            List<Map<String, Object>> itens = jdbc.queryForList(
                "SELECT TRIM(fab_cprm) AS fab, TRIM(produto_cprm) AS codigo, TRIM(descr_cprm) AS nome, " +
                "qtde_cprm AS qtde, preco_cprm AS preco, vlrtot_cprm AS vlrtot, TRIM(tipom_cprm) AS ospe, TRIM(serie_cprm) AS serie " +
                "FROM comprasm WHERE empre_cprm = ? AND origem_cprm = ? AND nrordem_cprm = ? ORDER BY produto_cprm",
                empre, origem, nrordem);
            ordem.put("itens", itens);

            return ResponseEntity.ok(ordem);
        } catch (Exception e) {
            logger.error("Erro ao buscar detalhes da ordem de compra", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao buscar detalhes: " + e.getMessage()));
        }
    }

    /**
     * Atualiza uma ordem de compra existente.
     */
    @PutMapping("/atualizar")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> update(HttpSession session, @RequestBody Map<String, Object> body) {
        try {
            String empre = safeTrim(body.get("empre"));
            String origem = safeTrim(body.get("origem"));
            String nrordem = safeTrim(body.get("nrordem"));

            if (empre == null || origem == null || nrordem == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Empresa, Origem e Número são obrigatórios."));
            }

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

                BigDecimal vlrtot = (preco == null ? BigDecimal.ZERO : preco).multiply(qtde == null ? BigDecimal.ZERO : qtde).setScale(4, RoundingMode.HALF_UP);
                total = total.add(vlrtot);

                itensParams.add(new Object[] {
                    empre, origem, nrordem, fab, produto, descr, qtde, preco, vlrtot, tipom, serie
                });
            }

            String sqlUpdateHeader = "UPDATE compras SET fornec_cpr = ?, dtpedido_cpr = ?, dtpedidoi_cpr = ?, " +
                                     "dtprev_cpr = ?, dtprevi_cpr = ?, condpag_cpr = ?, codcobranca_cpr = ?, cliente_cpr = ?, " +
                                     "consultor_cpr = ?, classe_cpr = ?, modelo_cpr = ?, obsospe_cpr = ?, obs_cpr = ?, " +
                                     "efetivado_cpr = ?, estoque_cpr = ?, tipo_cpr = ?, vlrtot_cpr = ? " +
                                     "WHERE empre_cpr = ? AND origem_cpr = ? AND nrordem_cpr = ?";
            jdbc.update(sqlUpdateHeader,
                fornec, toLegacyDate(dtpedido), toSqlDate(dtpedido),
                toLegacyDate(dtprev), toSqlDate(dtprev),
                trunc(condpag, 30), trunc(codcobranca, 3), trunc(cliente, 100), trunc(consultor, 50),
                trunc(classe, 20), trunc(modelo, 50), trunc(obsospe, 15), trunc(obs, 100),
                trunc(efetivado, 1), trunc(estoque, 1), trunc(tipo, 1),
                total.setScale(4, RoundingMode.HALF_UP),
                empre, origem, nrordem);

            jdbc.update("DELETE FROM comprasm WHERE empre_cprm = ? AND origem_cprm = ? AND nrordem_cprm = ?", empre, origem, nrordem);

            String sqlItem = "INSERT INTO comprasm (empre_cprm, origem_cprm, nrordem_cprm, fab_cprm, produto_cprm, descr_cprm, " +
                             "qtde_cprm, preco_cprm, vlrtot_cprm, tipom_cprm, serie_cprm) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            for (Object[] params : itensParams) {
                jdbc.update(sqlItem, params);
            }

            return ResponseEntity.ok(Map.of("success", true, "nrordem", nrordem));
        } catch (Exception e) {
            logger.error("Erro ao atualizar ordem de compra", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao atualizar ordem de compra: " + e.getMessage()));
        }
    }

    /**
     * Exclui uma ordem de compra e seus itens vinculados.
     */
    @DeleteMapping("/excluir")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> delete(@RequestParam String empre,
                                    @RequestParam String origem,
                                    @RequestParam String nrordem) {
        try {
            jdbc.update("DELETE FROM comprasm WHERE empre_cprm = ? AND origem_cprm = ? AND nrordem_cprm = ?", empre, origem, nrordem);
            int rows = jdbc.update("DELETE FROM compras WHERE empre_cpr = ? AND origem_cpr = ? AND nrordem_cpr = ?", empre, origem, nrordem);
            if (rows == 0) {
                return ResponseEntity.status(404).body(Map.of("error", "Ordem de compra não localizada."));
            }
            return ResponseEntity.ok(Map.of("success", true, "message", "Ordem de compra excluída com sucesso."));
        } catch (Exception e) {
            logger.error("Erro ao excluir ordem de compra", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao excluir ordem de compra: " + e.getMessage()));
        }
    }

    private java.sql.Date parseFlexibleDate(String raw) {
        if (raw == null || raw.trim().isEmpty()) return null;
        String s = raw.trim();
        try {
            if (s.contains("-")) {
                return java.sql.Date.valueOf(LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE));
            }
            return java.sql.Date.valueOf(LocalDate.parse(s, DATE_BR));
        } catch (Exception e) {
            return null;
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