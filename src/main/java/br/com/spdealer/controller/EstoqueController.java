package br.com.spdealer.controller;

import br.com.spdealer.util.SessionHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private static final Logger log = LoggerFactory.getLogger(EstoqueController.class);

    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @GetMapping("/categorias")
    public ResponseEntity<?> buscarCategorias(@RequestParam(required = false) String search) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT DISTINCT TRIM(fab_est) AS fab_est FROM estoque WHERE fab_est IS NOT NULL AND fab_est <> ''\n");
            MapSqlParameterSource params = new MapSqlParameterSource();
            if (search != null && !search.isBlank()) {
                sql.append(" AND LOWER(fab_est) LIKE :q\n");
                params.addValue("q", "%" + search.trim().toLowerCase() + "%");
            }
            sql.append("ORDER BY fab_est ASC LIMIT 50");
            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);
            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao buscar categorias de estoque: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/produtos-por-categoria")
    public ResponseEntity<?> buscarProdutosPorCategoria(
            @RequestParam(required = false) String fab,
            @RequestParam(required = false) String search) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT TRIM(codprod_est) AS codprod_est, TRIM(descr_est) AS descr_est FROM estoque WHERE 1=1\n");
            MapSqlParameterSource params = new MapSqlParameterSource();
            if (fab != null && !fab.isBlank()) {
                sql.append(" AND fab_est = :fab\n");
                params.addValue("fab", fab.trim());
            }
            if (search != null && !search.isBlank()) {
                sql.append(" AND (LOWER(descr_est) LIKE :q OR LOWER(codprod_est) LIKE :q)\n");
                params.addValue("q", "%" + search.trim().toLowerCase() + "%");
            }
            sql.append("ORDER BY codprod_est ASC LIMIT 50");
            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);
            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao buscar produtos por categoria: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/descricao-produto")
    public ResponseEntity<?> buscarDescricaoProduto(
            @RequestParam(required = false) String fab,
            @RequestParam String codprod) {
        try {
            if (codprod == null || codprod.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "codprod e obrigatorio"));
            }
            String sql;
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("codprod", codprod.trim());
            if (fab != null && !fab.isBlank()) {
                sql = "SELECT TRIM(descr_est) AS descr_est FROM estoque WHERE fab_est = :fab AND codprod_est = :codprod LIMIT 1";
                params.addValue("fab", fab.trim());
            } else {
                sql = "SELECT TRIM(descr_est) AS descr_est FROM estoque WHERE codprod_est = :codprod LIMIT 1";
            }
            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql, params);
            if (rows == null || rows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Produto não encontrado"));
            }
            return ResponseEntity.ok(rows.get(0));
        } catch (Exception e) {
            log.error("Erro ao buscar descricao produto: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/estoque/consulta
     * filtros:
     *  - fab (string) -> quando informado retorna itens apenas daquele fab; quando ausente retorna todos
     *  - codprod (string) -> opcional, usado junto com fab (se informado sem fab aplica filtro no produto também)
     *  - somenteComSaldo (boolean) -> se true, filtra saldo > 0
     *  - semMovimentoDias (int) -> número de dias (ex: 15,30,60,90,120,180,999) para 'sem movimento' (>=)
     *  - limit (int) -> limite de linhas
     *  - filial (string) -> parâmetro de debug; se ausente, usa SessionHelper.getIdFilFromSession(session)
     */
    @GetMapping("/consulta")
        public ResponseEntity<?> consulta(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String fab,
            @RequestParam(required = false) String codprod,
            @RequestParam(required = false) String grupo,
            @RequestParam(required = false) Boolean somenteComSaldo,
            @RequestParam(required = false) Integer semMovimentoDias,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String deposito,
            HttpSession session
    ) {
        StringBuilder sql = new StringBuilder();
        MapSqlParameterSource params = new MapSqlParameterSource();
        try {
            // Estoque é por depósito (dep_karm). O parâmetro opcional `deposito` pode ser usado para filtrar;
            // Se não for informado, tentar recuperar o depósito da sessão (propagado no login).
            if (limit == null || limit <= 0) limit = 100;

            sql.append("SELECT\n");
            sql.append("       e.fab_est      AS categoria,\n");
            sql.append("       e.codprod_est  AS produto,\n");
            sql.append("       e.descr_est    AS descricao,\n");
            sql.append("       COALESCE(f.fab_descricao, e.grfuncao_est, e.fab_est) AS fab_descricao,\n");
            sql.append("       e.unined_est   AS un_medida,\n");
            sql.append("       e.peso_est     AS peso,\n");
            sql.append("       e.catitem_est  AS catitem_est,\n");
            sql.append("       CONCAT(LPAD(e.catitem_est,3,'0'), ' - ', COALESCE(mg.descr_gru, '')) AS grupo,\n");
            sql.append("\n");
            sql.append("       e.referencia_est AS referencia_est,\n");
            sql.append("       e.codfis_est AS codfis_est,\n");
            sql.append("       k.dtultent_kar AS dtultent_kar,\n");
            sql.append("       k.dtultsai_kar AS dtultsai_kar,\n");
            sql.append("\n");
            sql.append("       COALESCE(k.qtde_kar, 0)   AS estoque,\n");
            sql.append("       COALESCE(k.qtaloc_kar, 0) AS alocado,\n");
            sql.append("\n");
            sql.append("       COALESCE(k.qtde_kar, 0) - COALESCE(k.qtaloc_kar, 0) AS saldo,\n");
            sql.append("\n");
            // precusto_kar é o custo unitário — expor como custo_uni para o frontend
            sql.append("       COALESCE(k.precusto_kar, 0) AS custo_uni,\n");
            sql.append("\n");
            sql.append("       COALESCE(\n");
            sql.append("           k.precusto_kar *\n");
            sql.append("           (COALESCE(k.qtde_kar, 0) - COALESCE(k.qtaloc_kar, 0)),\n");
            sql.append("           0\n");
            sql.append("       ) AS custo_total,\n");
            sql.append("\n");
            // Preço público — usar colunas presentes em `kardex`: prefira `precopub_kar`, depois `precorep_kar`, `precoavi_kar` ou `ultprec_kar`
            sql.append("       COALESCE(k.precopub_kar, k.precorep_kar, k.precoavi_kar, k.ultprec_kar, 0) AS preco_pub,\n");
            sql.append("\n");
            sql.append("       CASE\n");
            sql.append("           WHEN k.dtultsai_kar IS NOT NULL AND k.dtultsai_kar <> 0 THEN\n");
            sql.append("               DATEDIFF(\n");
            sql.append("                   CURDATE(),\n");
            sql.append("                   STR_TO_DATE(LPAD(k.dtultsai_kar, 8, '0'), '%d%m%Y')\n");
            sql.append("               )\n");
            sql.append("           WHEN k.dtultent_kar IS NOT NULL AND k.dtultent_kar <> 0 THEN\n");
            sql.append("               DATEDIFF(\n");
            sql.append("                   CURDATE(),\n");
            sql.append("                   STR_TO_DATE(LPAD(k.dtultent_kar, 8, '0'), '%d%m%Y')\n");
            sql.append("               )\n");
            sql.append("           ELSE 0\n");
            sql.append("       END AS DMS\n");
            sql.append("\n");
            sql.append("FROM estoque e\n");
            sql.append("INNER JOIN kardex k\n");
            sql.append("       ON k.dep_kar = LPAD(:deposito, 6, '0')\n");
            sql.append("      AND k.registro_kar = '01'\n");
            sql.append("      AND e.fab_est      = k.fab_kar\n");
            sql.append("      AND e.codprod_est  = k.codprod_kar\n");
            sql.append("\n");
            sql.append("LEFT JOIN masgru mg\n");
            sql.append("       ON e.catitem_est = mg.codigo_gru\n");
            sql.append("LEFT JOIN fabric f\n");
            sql.append("       ON e.fab_est = f.fab_codigo\n");
            sql.append("\n");
            sql.append("WHERE 1=1\n");

            // Se o cliente não informou `deposito` na querystring, tentar recuperar da sessão
            String depositoToUse = deposito;
            if ((depositoToUse == null || depositoToUse.isBlank())) {
                try {
                    String depFromSession = SessionHelper.getDeposito6FromSession(session);
                    if (depFromSession != null && !depFromSession.isBlank()) {
                        depositoToUse = depFromSession;
                    }
                } catch (Exception ex) {
                    // Não falhar por falta de depósito em sessão; trataremos como sem filtro
                }
            }



            if (depositoToUse != null && !depositoToUse.isBlank()) {
                // store deposit value (without leading zeros) and pass padded value to SQL via LPAD
                params.addValue("deposito", depositoToUse.trim());
            } else {
                // default deposit 1 -> LPAD('1',6,'0') in SQL
                params.addValue("deposito", "1");
            }

            if (search != null && !search.isBlank()) {
                sql.append(" AND LOWER(e.descr_est) LIKE :search\n");
                params.addValue("search", "%" + search.trim().toLowerCase() + "%");
            }

            if (fab != null && !fab.isBlank()) {
                sql.append(" AND e.fab_est = :fab\n");
                params.addValue("fab", fab);
            }

            if (codprod != null && !codprod.isBlank()) {
                sql.append(" AND e.codprod_est = :codprod\n");
                params.addValue("codprod", codprod);
            }

            // Filtrar por grupo quando informado. Aceita código (ex: '1' ou '001') ou string concatenada '001 - Nome'
            if (grupo != null && !grupo.isBlank()) {
                if (grupo.contains(" - ")) {
                    sql.append(" AND CONCAT(LPAD(e.catitem_est,3,'0'), ' - ', COALESCE(mg.descr_gru, '')) = :grupo\n");
                    params.addValue("grupo", grupo);
                } else {
                    // compara tanto o código puro quanto a versão preenchida com zeros
                    sql.append(" AND (e.catitem_est = :grupo OR LPAD(e.catitem_est,3,'0') = LPAD(:grupo,3,'0'))\n");
                    params.addValue("grupo", grupo);
                }
            }

            if (Boolean.TRUE.equals(somenteComSaldo)) {
                sql.append(" AND (COALESCE(k.qtde_kar,0) - COALESCE(k.qtaloc_kar,0)) > 0\n");
            }

            if (semMovimentoDias != null && semMovimentoDias > 0) {
                LocalDate cutoff = LocalDate.now().minusDays(semMovimentoDias);
                // comparar a data convertida de DDMMAAAA para DATE
                sql.append(" AND ( (k.dtultsai_kar IS NOT NULL AND k.dtultsai_kar <> 0 AND STR_TO_DATE(LPAD(k.dtultsai_kar,8,'0'), '%d%m%Y') < :cutoff) OR (k.dtultent_kar IS NOT NULL AND k.dtultent_kar <> 0 AND STR_TO_DATE(LPAD(k.dtultent_kar,8,'0'), '%d%m%Y') < :cutoff) )\n");
                params.addValue("cutoff", cutoff.toString());
            }

            // filtros adicionais aplicados abaixo
            if (fab != null && !fab.isBlank()) {
                sql.append(" AND e.fab_est = :fab\n");
                params.addValue("fab", fab);
            }

            if (codprod != null && !codprod.isBlank()) {
                sql.append(" AND e.codprod_est = :codprod\n");
                params.addValue("codprod", codprod);
            }

            if (Boolean.TRUE.equals(somenteComSaldo)) {
                sql.append(" AND (COALESCE(k.qtde_kar,0) - COALESCE(k.qtaloc_kar,0)) > 0\n");
            }

            if (semMovimentoDias != null && semMovimentoDias > 0) {
                LocalDate cutoff = LocalDate.now().minusDays(semMovimentoDias);
                sql.append(" AND ( (k.dtultsai_kar IS NOT NULL AND k.dtultsai_kar <> 0 AND STR_TO_DATE(LPAD(k.dtultsai_kar,8,'0'), '%d%m%Y') < STR_TO_DATE(:cutoff, '%Y-%m-%d')) OR (k.dtultent_kar IS NOT NULL AND k.dtultent_kar <> 0 AND STR_TO_DATE(LPAD(k.dtultent_kar,8,'0'), '%d%m%Y') < STR_TO_DATE(:cutoff, '%Y-%m-%d')) )\n");
                params.addValue("cutoff", cutoff.toString());
            }

            // Order and apply limit in SQL to let the database handle large sets efficiently
            sql.append("ORDER BY e.descr_est ASC LIMIT :limit");

            // pass limit as parameter to the query
            params.addValue("limit", limit);

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);

            if (rows == null || rows.isEmpty()) {
                return ResponseEntity.ok(Map.of("error", "Registro não encontrado"));
            }

            return ResponseEntity.ok(rows);

        } catch (Exception e) {
            try {
                log.error("Erro ao executar consulta estoque: {}", e.getMessage(), e);
                log.error("SQL: {}", sql.toString());
                // attempt to include params - may be null
                // params is in scope; include its values if available
            } catch (Exception ex) {
                // ignore logging problems
            }
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            try { err.put("sql", sql.toString()); } catch (Exception ex) {}
            try { err.put("params", params == null ? null : params.getValues()); } catch (Exception ex) {}
            return ResponseEntity.status(500).body(err);
        }
    }

    @GetMapping("/consulta/resumo")
    public ResponseEntity<?> consultaResumo(
            @RequestParam(required = false) String deposito,
            HttpSession session
    ) {
        try {
            String depositoToUse = deposito;
            if (depositoToUse == null || depositoToUse.isBlank()) {
                try {
                    String depFromSession = SessionHelper.getDeposito6FromSession(session);
                    if (depFromSession != null && !depFromSession.isBlank()) {
                        depositoToUse = depFromSession;
                    }
                } catch (Exception ex) {
                    // Ignore
                }
            }
            if (depositoToUse == null || depositoToUse.isBlank()) {
                depositoToUse = "1";
            }

            String sql = "SELECT\n" +
                         "  COUNT(*) AS totalProdutos,\n" +
                         "  SUM(COALESCE(qtde_kar, 0)) AS comEstoque,\n" +
                          "  SUM(COALESCE(qtaloc_kar, 0)) AS itensSolicitados,\n" +
                         "  SUM(COALESCE(precopub_kar * (COALESCE(qtde_kar, 0) - COALESCE(qtaloc_kar, 0)), 0)) AS valorEstoque\n" +
                         "FROM kardex\n" +
                         "WHERE dep_kar = LPAD(:deposito, 6, '0')\n" +
                         "  AND registro_kar = '01'";

            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("deposito", depositoToUse.trim());

            Map<String, Object> result = namedParameterJdbcTemplate.queryForMap(sql, params);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao carregar resumo da consulta de estoque: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    /**
     * GET /api/estoque/kardexm-movimentos
     * Retorna movimentos kardexm para um produto com filtros de data e tipo de movimento
     * Parametros:
     *  - fab (string) obrigatorio - fabricante/categoria
     *  - codprod (string) obrigatorio - codigo do produto
     *  - dataInicial (string) YYYY-MM-DD - data inicial do filtro (default: -30 dias)
     *  - dataFinal (string) YYYY-MM-DD - data final do filtro (default: hoje)
     *  - tipos (string) - tipos de movimento separados por virgula (E,S,A). Default: E,S,A
     */
    @GetMapping("/kardexm-movimentos")
    public ResponseEntity<?> kardexmMovimentos(
            @RequestParam String fab,
            @RequestParam String codprod,
            @RequestParam(required = false) String dataInicial,
            @RequestParam(required = false) String dataFinal,
            @RequestParam(required = false) String tipos,
            HttpSession session
    ) {
        try {
            if (fab == null || fab.isBlank() || codprod == null || codprod.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "fab e codprod sao obrigatorios"));
            }

            // default date range: -30 days to today
            if (dataInicial == null || dataInicial.isBlank()) {
                dataInicial = LocalDate.now().minusDays(30).toString();
            }
            if (dataFinal == null || dataFinal.isBlank()) {
                dataFinal = LocalDate.now().toString();
            }

            // default tipos: E,S,A
            if (tipos == null || tipos.isBlank()) {
                tipos = "E,S,A";
            }
            String[] tipoArray = tipos.split(",");
            // build placeholders for IN clause
            StringBuilder tipoPlaceholders = new StringBuilder();
            MapSqlParameterSource params = new MapSqlParameterSource();
            int idx = 0;
            for (String t : tipoArray) {
                String trimmed = t.trim();
                if (!trimmed.isEmpty()) {
                    if (tipoPlaceholders.length() > 0) tipoPlaceholders.append(",");
                    String key = "tipo" + idx;
                    tipoPlaceholders.append(":").append(key);
                    params.addValue(key, trimmed);
                    idx++;
                }
            }

            StringBuilder sql = new StringBuilder();
            sql.append("SELECT\n");
            sql.append("       km.tipomov_karm AS tpMov,\n");
            sql.append("       km.serie_karm AS serie,\n");
            sql.append("       km.nronota_karm AS nroNFe,\n");
            sql.append("       km.dtatual_karm AS dtEmissao,\n");
            sql.append("       km.cpfcgc_karm AS documento,\n");
            sql.append("       km.codigo_karm AS codClifor,\n");
            sql.append("       CASE\n");
            sql.append("           WHEN km.tipomov_karm = 'A' THEN 'AJUSTE'\n");
            sql.append("           WHEN km.tipomov_karm = 'S' THEN COALESCE(c.nome_cli, 'CLIENTE N/AO ENCONTRADO')\n");
            sql.append("           WHEN km.tipomov_karm = 'E' THEN COALESCE(f.nome_cli, 'FORNECEDOR N/AO ENCONTRADO')\n");
            sql.append("           ELSE ''\n");
            sql.append("       END AS clienteFornecedor,\n");
            sql.append("       CASE\n");
            sql.append("           WHEN km.tipomov_karm = 'S' THEN COALESCE(km.qtde_karm, 0) * -1\n");
            sql.append("           ELSE COALESCE(km.qtde_karm, 0)\n");
            sql.append("       END AS quantidade,\n");
            sql.append("       COALESCE(km.precusto_karm, 0) AS prCusto,\n");
            sql.append("       COALESCE(km.precsaid_karm, 0) AS prSaida\n");
            sql.append("\n");
            sql.append("FROM kardexm km\n");
            sql.append("LEFT JOIN clientes c\n");
            sql.append("       ON km.codigo_karm = c.codigo_cli\n");
            sql.append("      AND c.cliforn_cli = 'C'\n");
            sql.append("LEFT JOIN clientes f\n");
            sql.append("       ON km.codigo_karm = f.codigo_cli\n");
            sql.append("      AND f.cliforn_cli = 'F'\n");
            sql.append("\n");
            sql.append("WHERE km.fab_karm = :fab\n");
            sql.append("  AND km.codprod_karm = :codprod\n");
            sql.append("  AND km.dtatual_karm >= :dataInicial\n");
            sql.append("  AND km.dtatual_karm <= :dataFinal\n");
            sql.append("  AND km.tipomov_karm IN (").append(tipoPlaceholders).append(")\n");
            sql.append("ORDER BY km.dtatual_karm DESC, km.hratual_karm DESC\n");

            params.addValue("fab", fab);
            params.addValue("codprod", codprod);
            params.addValue("dataInicial", dataInicial);
            params.addValue("dataFinal", dataFinal);

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);

            return ResponseEntity.ok(rows != null ? rows : List.of());

        } catch (Exception e) {
            log.error("Erro ao consultar kardexm: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    /**
     * GET /api/estoque/produtos
     * Busca produtos do estoque (codprod + descricao) para autocomplete/typeahead
     * Parâmetros:
     *  - search (string) -> termo parcial para buscar em código ou descrição
     *  - fab (string) -> fabricante / categoria opcional (filtrar por e.fab_est)
     *  - limit (int) -> número máximo de resultados
     *  - deposito (string) -> opcional (não usado para essa listagem simples)
     */
    @GetMapping("/produtos")
    public ResponseEntity<?> produtos(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String fab,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String deposito,
            HttpSession session
    ) {
        try {
            if (limit == null || limit <= 0) limit = 50;

            StringBuilder sql = new StringBuilder();
            sql.append("SELECT e.codprod_est AS codigo, e.descr_est AS descricao, e.fab_est AS fab FROM estoque e WHERE 1=1\n");

            MapSqlParameterSource params = new MapSqlParameterSource();

            if (fab != null && !fab.isBlank()) {
                sql.append(" AND e.fab_est = :fab\n");
                params.addValue("fab", fab);
            }

            if (search != null && !search.isBlank()) {
                // buscar contendo (case-insensitive)
                sql.append(" AND (LOWER(e.codprod_est) LIKE :q OR LOWER(e.descr_est) LIKE :q)\n");
                params.addValue("q", "%" + search.trim().toLowerCase() + "%");
            }

            sql.append("ORDER BY e.descr_est ASC");

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);
            if (rows != null && rows.size() > limit) rows = rows.subList(0, limit);

            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/estoque/cadastro
     * Retorna lista de produtos do estoque com locação do kardex para o grid "Cadastro de Estoque"
     */
    @GetMapping("/cadastro")
    public ResponseEntity<?> cadastro(HttpSession session) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT\n");
            sql.append("       e.codprod_est AS codigo,\n");
            sql.append("       e.fab_est AS categoria,\n");
            sql.append("       COALESCE(mg.descr_gru, e.catitem_est) AS grupo,\n");
            sql.append("       COALESCE(f.fab_descricao, e.grfuncao_est, e.fab_est) AS fab_descricao,\n");
            sql.append("       e.descr_est AS descricao,\n");
            sql.append("       k.locac_kar AS locacao,\n");
            sql.append("       (COALESCE(k.qtde_kar, 0) - COALESCE(k.qtaloc_kar, 0)) AS saldo,\n");
            sql.append("       COALESCE(k.precopub_kar, k.precorep_kar, k.precoavi_kar, k.ultprec_kar, 0) AS preco_pub,\n");
            sql.append("       COALESCE(k.estmin_kar, 0) AS estmin_kar\n");
            sql.append("FROM estoque e\n");
            sql.append("LEFT JOIN kardex k ON k.fab_kar = e.fab_est AND k.codprod_kar = e.codprod_est\n");
            sql.append("LEFT JOIN masgru mg ON e.catitem_est = mg.codigo_gru\n");
            sql.append("LEFT JOIN fabric f\n");
            sql.append("       ON e.grfuncao_est = f.fab_codigo\n");
            sql.append("ORDER BY e.descr_est ASC\n");

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(
                sql.toString(), new MapSqlParameterSource()
            );

            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao listar cadastro estoque: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/estoque/cadastro/{fab}/{codprod}
     * Exclui um produto do estoque
     */
    @DeleteMapping("/cadastro/{fab}/{codprod}")
    public ResponseEntity<?> excluirProduto(
            @PathVariable String fab,
            @PathVariable String codprod,
            HttpSession session
    ) {
        try {
            boolean skipCheck = (fab == null || fab.trim().isEmpty() || "_".equals(fab) || codprod == null || codprod.trim().isEmpty() || "_".equals(codprod));

            if (!skipCheck) {
                Integer idFil = SessionHelper.getIdFilFromSession(session);
                String depKarm = String.format("%06d", idFil);

                // Verificar se existem lançamentos no Kardex Mensal (kardexm)
                String checkSql = "SELECT COUNT(*) FROM kardexm WHERE dep_karm = :dep AND fab_karm = :fab AND codprod_karm = :codprod";
                MapSqlParameterSource checkParams = new MapSqlParameterSource();
                checkParams.addValue("dep", depKarm);
                checkParams.addValue("fab", fab.trim());
                checkParams.addValue("codprod", codprod.trim());

                Integer count = namedParameterJdbcTemplate.queryForObject(checkSql, checkParams, Integer.class);
                if (count != null && count > 0) {
                    return ResponseEntity.status(400).body(Map.of("error", "Não é possível excluir o produto pois existem lançamentos de movimentação (Kardex Mensal) para ele."));
                }
            }

            boolean emptyFab = (fab == null || fab.trim().isEmpty() || "_".equals(fab));
            boolean emptyCodprod = (codprod == null || codprod.trim().isEmpty() || "_".equals(codprod));

            // Deleta da tabela estoque
            StringBuilder sqlBuilder = new StringBuilder("DELETE FROM estoque WHERE ");
            MapSqlParameterSource params = new MapSqlParameterSource();

            if (emptyFab) {
                sqlBuilder.append("(fab_est IS NULL OR TRIM(fab_est) = '')");
            } else {
                sqlBuilder.append("fab_est = :fab");
                params.addValue("fab", fab.trim());
            }

            sqlBuilder.append(" AND ");

            if (emptyCodprod) {
                sqlBuilder.append("(codprod_est IS NULL OR TRIM(codprod_est) = '')");
            } else {
                sqlBuilder.append("codprod_est = :codprod");
                params.addValue("codprod", codprod.trim());
            }

            int affected = namedParameterJdbcTemplate.update(sqlBuilder.toString(), params);

            // Deleta também da tabela kardex correspondente
            try {
                StringBuilder sqlKardexBuilder = new StringBuilder("DELETE FROM kardex WHERE ");
                if (emptyFab) {
                    sqlKardexBuilder.append("(fab_kar IS NULL OR TRIM(fab_kar) = '')");
                } else {
                    sqlKardexBuilder.append("fab_kar = :fab");
                }
                sqlKardexBuilder.append(" AND ");
                if (emptyCodprod) {
                    sqlKardexBuilder.append("(codprod_kar IS NULL OR TRIM(codprod_kar) = '')");
                } else {
                    sqlKardexBuilder.append("codprod_kar = :codprod");
                }
                namedParameterJdbcTemplate.update(sqlKardexBuilder.toString(), params);
            } catch (Exception ke) {
                log.warn("Falha não crítica ao limpar tabela kardex para o produto excluído: {}", ke.getMessage());
            }

            if (affected > 0) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Produto excluído com sucesso"));
            }
            return ResponseEntity.status(404).body(Map.of("error", "Produto não encontrado"));
        } catch (Exception e) {
            log.error("Erro ao excluir produto: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/estoque/cadastro
     * Cria um novo produto nas tabelas estoque e kardex
     * Body: { deposito_est, fab_est, codprod_est, locac_kar, descr_est, referencia_est, codfis_est, codtribicms_est, ipi_est }
     */
    @PostMapping("/cadastro")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> criarProduto(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            String depositoEst = (String) body.getOrDefault("deposito_est", "");
            String fabEst = (String) body.get("fab_est");
            String codprodEst = (String) body.get("codprod_est");
            String locacKar = (String) body.getOrDefault("locac_kar", "");
            String descrEst = (String) body.getOrDefault("descr_est", "");
            String referenciaEst = (String) body.getOrDefault("referencia_est", "");
            String codfisEst = (String) body.getOrDefault("codfis_est", "");
            String codtribicmsEst = (String) body.getOrDefault("codtribicms_est", "");
            String ipiEstStr = (String) body.getOrDefault("ipi_est", "0");
            String grupofabEst = (String) body.getOrDefault("grupofab_est", "");
            String eanEst = (String) body.getOrDefault("ean_est", "");
            String siglaEst = (String) body.getOrDefault("sigla_est", "");
            String catitemEst = (String) body.getOrDefault("catitem_est", "");
            String unimedEst = (String) body.getOrDefault("unimed_est", "");
            String pesoEstStr = (String) body.getOrDefault("peso_est", "0");
            String naturezaEst = (String) body.getOrDefault("natureza_est", "");
            String tipofreqKar = (String) body.getOrDefault("tipofreq_kar", "");
            String codescKar = (String) body.getOrDefault("codesc_kar", "N");
            String modmaquiEst = (String) body.getOrDefault("modmaqui_est", "");
            String grfuncaoEst = (String) body.getOrDefault("grfuncao_est", "");
            String estiniEst = (String) body.getOrDefault("estini_est", "N");
            String procedenciaEst = (String) body.getOrDefault("procedencia_est", "");
            String anpEst = (String) body.getOrDefault("anp_est", "");
            String descranpEst = (String) body.getOrDefault("descranp_est", "");
            String reservaEst = (String) body.getOrDefault("reserva_est", "");

            // Itens Correspondentes
            String fabcorrEst1 = (String) body.getOrDefault("fabcorr_est1", "");
            String mascorrEst1 = (String) body.getOrDefault("mascorr_est1", "");
            String fabcorrEst2 = (String) body.getOrDefault("fabcorr_est2", "");
            String mascorrEst2 = (String) body.getOrDefault("mascorr_est2", "");
            String fabcorrEst3 = (String) body.getOrDefault("fabcorr_est3", "");
            String mascorrEst3 = (String) body.getOrDefault("mascorr_est3", "");
            String fabcorrEst4 = (String) body.getOrDefault("fabcorr_est4", "");
            String mascorrEst4 = (String) body.getOrDefault("mascorr_est4", "");

            String nascorrEst1 = getMascara(fabcorrEst1, mascorrEst1);
            String nascorrEst2 = getMascara(fabcorrEst2, mascorrEst2);
            String nascorrEst3 = getMascara(fabcorrEst3, mascorrEst3);
            String nascorrEst4 = getMascara(fabcorrEst4, mascorrEst4);

            if (fabEst == null || fabEst.isBlank() || codprodEst == null || codprodEst.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "campos fab_est e codprod_est sao obrigatorios"));
            }

            // 1) INSERT na tabela estoque
            String sqlEstoque = "INSERT INTO estoque " +
                                "(fab_est, codprod_est, descr_est, referencia_est, codfis_est, codtribicms_est, ipi_est, " +
                                "grupofab_est, ean_est, sigla_est, catitem_est, unined_est, peso_est, natureza_est, modmaqui_est, grfuncao_est, estini_est, " +
                                "procedencia_est, anp_est, reserva_est, " +
                                "fabcorr_est1, nascorr_est1, itemcorr_est1, " +
                                "fabcorr_est2, nascorr_est2, itemcorr_est2, " +
                                "fabcorr_est3, nascorr_est3, itemcorr_est3, " +
                                "fabcorr_est4, nascorr_est4, itemcorr_est4) " +
                                "VALUES (:fab_est, :codprod_est, :descr_est, :referencia_est, :codfis_est, :codtribicms_est, :ipi_est, " +
                                ":grupofab_est, :ean_est, :sigla_est, :catitem_est, :unined_est, :peso_est, :natureza_est, :modmaqui_est, :grfuncao_est, :estini_est, " +
                                ":procedencia_est, :anp_est, :reserva_est, " +
                                ":fabcorr_est1, :nascorr_est1, :itemcorr_est1, " +
                                ":fabcorr_est2, :nascorr_est2, :itemcorr_est2, " +
                                ":fabcorr_est3, :nascorr_est3, :itemcorr_est3, " +
                                ":fabcorr_est4, :nascorr_est4, :itemcorr_est4)";
            MapSqlParameterSource paramsEstoque = new MapSqlParameterSource();
            paramsEstoque.addValue("fab_est", fabEst.trim());
            paramsEstoque.addValue("codprod_est", codprodEst.trim());
            paramsEstoque.addValue("descr_est", descrEst.trim());
            paramsEstoque.addValue("referencia_est", referenciaEst.trim());
            paramsEstoque.addValue("codfis_est", codfisEst.trim());
            paramsEstoque.addValue("codtribicms_est", codtribicmsEst.trim());
            try {
                paramsEstoque.addValue("ipi_est", new java.math.BigDecimal(ipiEstStr));
            } catch (Exception e) {
                paramsEstoque.addValue("ipi_est", java.math.BigDecimal.ZERO);
            }
            paramsEstoque.addValue("grupofab_est", grupofabEst.trim());
            paramsEstoque.addValue("ean_est", eanEst.trim());
            paramsEstoque.addValue("sigla_est", siglaEst.trim());
            paramsEstoque.addValue("catitem_est", catitemEst.trim());
            paramsEstoque.addValue("unined_est", unimedEst.trim());
            try {
                paramsEstoque.addValue("peso_est", new java.math.BigDecimal(pesoEstStr));
            } catch (Exception e) {
                paramsEstoque.addValue("peso_est", java.math.BigDecimal.ZERO);
            }
            paramsEstoque.addValue("natureza_est", naturezaEst.trim());
            paramsEstoque.addValue("modmaqui_est", modmaquiEst.trim());
            paramsEstoque.addValue("grfuncao_est", grfuncaoEst.trim());
            paramsEstoque.addValue("estini_est", estiniEst.trim());
            paramsEstoque.addValue("procedencia_est", procedenciaEst.trim());
            paramsEstoque.addValue("anp_est", anpEst.trim());
            try {
                paramsEstoque.addValue("reserva_est", new java.math.BigDecimal(reservaEst));
            } catch (Exception e) {
                paramsEstoque.addValue("reserva_est", java.math.BigDecimal.ZERO);
            }

            // params correspondentes
            paramsEstoque.addValue("fabcorr_est1", fabcorrEst1.trim());
            paramsEstoque.addValue("nascorr_est1", nascorrEst1.trim());
            paramsEstoque.addValue("itemcorr_est1", mascorrEst1.trim());
            paramsEstoque.addValue("fabcorr_est2", fabcorrEst2.trim());
            paramsEstoque.addValue("nascorr_est2", nascorrEst2.trim());
            paramsEstoque.addValue("itemcorr_est2", mascorrEst2.trim());
            paramsEstoque.addValue("fabcorr_est3", fabcorrEst3.trim());
            paramsEstoque.addValue("nascorr_est3", nascorrEst3.trim());
            paramsEstoque.addValue("itemcorr_est3", mascorrEst3.trim());
            paramsEstoque.addValue("fabcorr_est4", fabcorrEst4.trim());
            paramsEstoque.addValue("nascorr_est4", nascorrEst4.trim());
            paramsEstoque.addValue("itemcorr_est4", mascorrEst4.trim());

            namedParameterJdbcTemplate.update(sqlEstoque, paramsEstoque);

            // 2) INSERT na tabela kardex
            // dep_kar: tentar da sessao, fallback '000001'
            String depKar = "000001";
            try {
                String depFromSession = SessionHelper.getDeposito6FromSession(session);
                if (depFromSession != null && !depFromSession.isBlank()) {
                    depKar = depFromSession;
                }
            } catch (Exception ignored) {}

            String precorepKar = (String) body.getOrDefault("precorep_kar", "");
            String precopubKar = (String) body.getOrDefault("precopub_kar", "");
            String precogarKar = (String) body.getOrDefault("precogar_kar", "");
            String percsugKar = (String) body.getOrDefault("percsug_kar", "");
            String precodolKar = (String) body.getOrDefault("precodol_kar", "");
            String precustoKar = (String) body.getOrDefault("precusto_kar", "");
            String codpcoKar = (String) body.getOrDefault("codpco_kar", "N");
            String tabelaKar = (String) body.getOrDefault("tabela_kar", "N");
            String estminKar = (String) body.getOrDefault("estmin_kar", "");
            String estmaxKar = (String) body.getOrDefault("estmax_kar", "");
            String estmindKar = (String) body.getOrDefault("estmind_kar", "");
            String sqlKardex = "INSERT INTO kardex (fab_kar, codprod_kar, locac_kar, dep_kar, registro_kar, tipofreq_kar, codesc_kar, " +
                                "precorep_kar, precopub_kar, precogar_kar, percsug_kar, precodol_kar, precusto_kar, " +
                                "codpco_kar, tabela_kar, estmin_kar, estmax_kar, estmind_kar) " +
                                "VALUES (:fab_kar, :codprod_kar, :locac_kar, :dep_kar, :registro_kar, :tipofreq_kar, :codesc_kar, " +
                                ":precorep_kar, :precopub_kar, :precogar_kar, :percsug_kar, :precodol_kar, :precusto_kar, " +
                                ":codpco_kar, :tabela_kar, :estmin_kar, :estmax_kar, :estmind_kar)";
            MapSqlParameterSource paramsKardex = new MapSqlParameterSource();
            paramsKardex.addValue("fab_kar", fabEst.trim());
            paramsKardex.addValue("codprod_kar", codprodEst.trim());
            paramsKardex.addValue("locac_kar", locacKar.trim());
            paramsKardex.addValue("dep_kar", depKar);
            paramsKardex.addValue("registro_kar", "01");
            paramsKardex.addValue("tipofreq_kar", tipofreqKar.trim());
            paramsKardex.addValue("codesc_kar", codescKar.trim());
            paramsKardex.addValue("precorep_kar", parseDecimal(precorepKar));
            paramsKardex.addValue("precopub_kar", parseDecimal(precopubKar));
            paramsKardex.addValue("precogar_kar", parseDecimal(precogarKar));
            paramsKardex.addValue("percsug_kar", parseDecimal(percsugKar));
            paramsKardex.addValue("precodol_kar", parseDecimal(precodolKar));
            paramsKardex.addValue("precusto_kar", parseDecimal(precustoKar));
            paramsKardex.addValue("codpco_kar", codpcoKar.trim());
            paramsKardex.addValue("tabela_kar", tabelaKar.trim());
            paramsKardex.addValue("estmin_kar", parseDecimal(estminKar));
            paramsKardex.addValue("estmax_kar", parseDecimal(estmaxKar));
            paramsKardex.addValue("estmind_kar", parseDecimal(estmindKar));
            namedParameterJdbcTemplate.update(sqlKardex, paramsKardex);

            return ResponseEntity.ok(Map.of("success", true, "message", "Produto criado com sucesso"));
        } catch (Exception e) {
            log.error("Erro ao criar produto: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/estoque/cadastro/{fab}/{codprod}
     * Retorna os dados completos de um produto para edicao
     */
    @GetMapping("/cadastro/{fab}/{codprod}")
    public ResponseEntity<?> getProduto(
            @PathVariable String fab,
            @PathVariable String codprod) {
        try {
            String sql = "SELECT e.*, " +
                         "TRIM(e.fabcorr_est1) AS fabcorr_est1, TRIM(e.itemcorr_est1) AS mascorr_est1, " +
                         "TRIM(e.fabcorr_est2) AS fabcorr_est2, TRIM(e.itemcorr_est2) AS mascorr_est2, " +
                         "TRIM(e.fabcorr_est3) AS fabcorr_est3, TRIM(e.itemcorr_est3) AS mascorr_est3, " +
                         "TRIM(e.fabcorr_est4) AS fabcorr_est4, TRIM(e.itemcorr_est4) AS mascorr_est4, " +
                         "(SELECT TRIM(descr_est) FROM estoque WHERE (TRIM(e.fabcorr_est1) = '' OR fab_est = e.fabcorr_est1) AND codprod_est = e.itemcorr_est1 LIMIT 1) AS desccorr_est1, " +
                         "(SELECT TRIM(descr_est) FROM estoque WHERE (TRIM(e.fabcorr_est2) = '' OR fab_est = e.fabcorr_est2) AND codprod_est = e.itemcorr_est2 LIMIT 1) AS desccorr_est2, " +
                         "(SELECT TRIM(descr_est) FROM estoque WHERE (TRIM(e.fabcorr_est3) = '' OR fab_est = e.fabcorr_est3) AND codprod_est = e.itemcorr_est3 LIMIT 1) AS desccorr_est3, " +
                         "(SELECT TRIM(descr_est) FROM estoque WHERE (TRIM(e.fabcorr_est4) = '' OR fab_est = e.fabcorr_est4) AND codprod_est = e.itemcorr_est4 LIMIT 1) AS desccorr_est4, " +
                          "k.locac_kar, k.tipofreq_kar, k.codesc_kar, k.dep_kar, " +
                           "k.precorep_kar, k.precopub_kar, k.precogar_kar, k.percsug_kar, k.precodol_kar, k.precusto_kar, " +
                          "k.codpco_kar, k.tabela_kar, k.estmin_kar, k.estmax_kar, k.estmind_kar " +
                         "FROM estoque e " +
                         "LEFT JOIN kardex k ON k.fab_kar = e.fab_est AND k.codprod_kar = e.codprod_est " +
                         "WHERE e.fab_est = :fab AND e.codprod_est = :codprod LIMIT 1";
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("fab", fab);
            params.addValue("codprod", codprod);
            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql, params);
            if (rows == null || rows.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Produto não encontrado"));
            }
            return ResponseEntity.ok(rows.get(0));
        } catch (Exception e) {
            log.error("Erro ao buscar produto: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PUT /api/estoque/cadastro/{fab}/{codprod}
     * Atualiza um produto existente
     */
    @PutMapping("/cadastro/{fab}/{codprod}")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<?> atualizarProduto(
            @PathVariable String fab,
            @PathVariable String codprod,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            String depositoEst = (String) body.getOrDefault("deposito_est", "");
            String descrEst = (String) body.getOrDefault("descr_est", "");
            String referenciaEst = (String) body.getOrDefault("referencia_est", "");
            String codfisEst = (String) body.getOrDefault("codfis_est", "");
            String codtribicmsEst = (String) body.getOrDefault("codtribicms_est", "");
            String ipiEstStr = (String) body.getOrDefault("ipi_est", "0");
            String grupofabEst = (String) body.getOrDefault("grupofab_est", "");
            String eanEst = (String) body.getOrDefault("ean_est", "");
            String siglaEst = (String) body.getOrDefault("sigla_est", "");
            String catitemEst = (String) body.getOrDefault("catitem_est", "");
            String unimedEst = (String) body.getOrDefault("unimed_est", "");
            String pesoEstStr = (String) body.getOrDefault("peso_est", "0");
            String naturezaEst = (String) body.getOrDefault("natureza_est", "");
            String tipofreqKar = (String) body.getOrDefault("tipofreq_kar", "");
            String codescKar = (String) body.getOrDefault("codesc_kar", "N");
            String modmaquiEst = (String) body.getOrDefault("modmaqui_est", "");
            String grfuncaoEst = (String) body.getOrDefault("grfuncao_est", "");
            String estiniEst = (String) body.getOrDefault("estini_est", "N");
            String procedenciaEst = (String) body.getOrDefault("procedencia_est", "");
            String anpEst = (String) body.getOrDefault("anp_est", "");
            String descranpEst = (String) body.getOrDefault("descranp_est", "");
            String locacKar = (String) body.getOrDefault("locac_kar", "");
            String reservaEst = (String) body.getOrDefault("reserva_est", "");

            // Preço
            String precorepKar = (String) body.getOrDefault("precorep_kar", "");
            String precopubKar = (String) body.getOrDefault("precopub_kar", "");
            String precogarKar = (String) body.getOrDefault("precogar_kar", "");
            String percsugKar = (String) body.getOrDefault("percsug_kar", "");
            String precodolKar = (String) body.getOrDefault("precodol_kar", "");
            String precustoKar = (String) body.getOrDefault("precusto_kar", "");
            String codpcoKar = (String) body.getOrDefault("codpco_kar", "N");
            String tabelaKar = (String) body.getOrDefault("tabela_kar", "N");
            String estminKar = (String) body.getOrDefault("estmin_kar", "");
            String estmaxKar = (String) body.getOrDefault("estmax_kar", "");
            String estmindKar = (String) body.getOrDefault("estmind_kar", "");

            // Itens Correspondentes
            String fabcorrEst1 = (String) body.getOrDefault("fabcorr_est1", "");
            String mascorrEst1 = (String) body.getOrDefault("mascorr_est1", "");
            String fabcorrEst2 = (String) body.getOrDefault("fabcorr_est2", "");
            String mascorrEst2 = (String) body.getOrDefault("mascorr_est2", "");
            String fabcorrEst3 = (String) body.getOrDefault("fabcorr_est3", "");
            String mascorrEst3 = (String) body.getOrDefault("mascorr_est3", "");
            String fabcorrEst4 = (String) body.getOrDefault("fabcorr_est4", "");
            String mascorrEst4 = (String) body.getOrDefault("mascorr_est4", "");

            String nascorrEst1 = getMascara(fabcorrEst1, mascorrEst1);
            String nascorrEst2 = getMascara(fabcorrEst2, mascorrEst2);
            String nascorrEst3 = getMascara(fabcorrEst3, mascorrEst3);
            String nascorrEst4 = getMascara(fabcorrEst4, mascorrEst4);

            String sqlEstoque = "UPDATE estoque SET " +
                                "descr_est = :descr_est, referencia_est = :referencia_est, " +
                                "codfis_est = :codfis_est, codtribicms_est = :codtribicms_est, ipi_est = :ipi_est, " +
                                "grupofab_est = :grupofab_est, ean_est = :ean_est, sigla_est = :sigla_est, " +
                                "catitem_est = :catitem_est, unined_est = :unined_est, peso_est = :peso_est, " +
                                "natureza_est = :natureza_est, modmaqui_est = :modmaqui_est, grfuncao_est = :grfuncao_est, " +
                                "estini_est = :estini_est, procedencia_est = :procedencia_est, anp_est = :anp_est, reserva_est = :reserva_est, " +
                                "fabcorr_est1 = :fabcorr_est1, nascorr_est1 = :nascorr_est1, itemcorr_est1 = :itemcorr_est1, " +
                                "fabcorr_est2 = :fabcorr_est2, nascorr_est2 = :nascorr_est2, itemcorr_est2 = :itemcorr_est2, " +
                                "fabcorr_est3 = :fabcorr_est3, nascorr_est3 = :nascorr_est3, itemcorr_est3 = :itemcorr_est3, " +
                                "fabcorr_est4 = :fabcorr_est4, nascorr_est4 = :nascorr_est4, itemcorr_est4 = :itemcorr_est4 " +
                                "WHERE fab_est = :fab_est AND codprod_est = :codprod_est";
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("fab_est", fab.trim());
            params.addValue("codprod_est", codprod.trim());
            params.addValue("descr_est", descrEst.trim());
            params.addValue("referencia_est", referenciaEst.trim());
            params.addValue("codfis_est", codfisEst.trim());
            params.addValue("codtribicms_est", codtribicmsEst.trim());
            try {
                params.addValue("ipi_est", new java.math.BigDecimal(ipiEstStr));
            } catch (Exception e) {
                params.addValue("ipi_est", java.math.BigDecimal.ZERO);
            }
            params.addValue("grupofab_est", grupofabEst.trim());
            params.addValue("ean_est", eanEst.trim());
            params.addValue("sigla_est", siglaEst.trim());
            params.addValue("catitem_est", catitemEst.trim());
            params.addValue("unined_est", unimedEst.trim());
            try {
                params.addValue("peso_est", new java.math.BigDecimal(pesoEstStr));
            } catch (Exception e) {
                params.addValue("peso_est", java.math.BigDecimal.ZERO);
            }
            params.addValue("natureza_est", naturezaEst.trim());
            params.addValue("modmaqui_est", modmaquiEst.trim());
            params.addValue("grfuncao_est", grfuncaoEst.trim());
            params.addValue("estini_est", estiniEst.trim());
            params.addValue("procedencia_est", procedenciaEst.trim());
            params.addValue("anp_est", anpEst.trim());
            try {
                params.addValue("reserva_est", new java.math.BigDecimal(reservaEst));
            } catch (Exception e) {
                params.addValue("reserva_est", java.math.BigDecimal.ZERO);
            }

            // params correspondentes
            params.addValue("fabcorr_est1", fabcorrEst1.trim());
            params.addValue("nascorr_est1", nascorrEst1.trim());
            params.addValue("itemcorr_est1", mascorrEst1.trim());
            params.addValue("fabcorr_est2", fabcorrEst2.trim());
            params.addValue("nascorr_est2", nascorrEst2.trim());
            params.addValue("itemcorr_est2", mascorrEst2.trim());
            params.addValue("fabcorr_est3", fabcorrEst3.trim());
            params.addValue("nascorr_est3", nascorrEst3.trim());
            params.addValue("itemcorr_est3", mascorrEst3.trim());
            params.addValue("fabcorr_est4", fabcorrEst4.trim());
            params.addValue("nascorr_est4", nascorrEst4.trim());
            params.addValue("itemcorr_est4", mascorrEst4.trim());
            namedParameterJdbcTemplate.update(sqlEstoque, params);

            // Update kardex
            String depKar = "000001";
            try {
                String depFromSession = SessionHelper.getDeposito6FromSession(session);
                if (depFromSession != null && !depFromSession.isBlank()) {
                    depKar = depFromSession;
                }
            } catch (Exception ignored) {}

            String sqlKardex = "UPDATE kardex SET locac_kar = :locac_kar, tipofreq_kar = :tipofreq_kar, codesc_kar = :codesc_kar, " +
                                "precorep_kar = :precorep_kar, precopub_kar = :precopub_kar, precogar_kar = :precogar_kar, " +
                                "percsug_kar = :percsug_kar, precodol_kar = :precodol_kar, precusto_kar = :precusto_kar, " +
                                "codpco_kar = :codpco_kar, tabela_kar = :tabela_kar, " +
                                "estmin_kar = :estmin_kar, estmax_kar = :estmax_kar, estmind_kar = :estmind_kar " +
                                "WHERE fab_kar = :fab_kar AND codprod_kar = :codprod_kar AND dep_kar = :dep_kar";
            MapSqlParameterSource paramsKardex = new MapSqlParameterSource();
            paramsKardex.addValue("fab_kar", fab.trim());
            paramsKardex.addValue("codprod_kar", codprod.trim());
            paramsKardex.addValue("locac_kar", locacKar.trim());
            paramsKardex.addValue("dep_kar", depKar);
            paramsKardex.addValue("tipofreq_kar", tipofreqKar.trim());
            paramsKardex.addValue("codesc_kar", codescKar.trim());
            paramsKardex.addValue("precorep_kar", parseDecimal(precorepKar));
            paramsKardex.addValue("precopub_kar", parseDecimal(precopubKar));
            paramsKardex.addValue("precogar_kar", parseDecimal(precogarKar));
            paramsKardex.addValue("percsug_kar", parseDecimal(percsugKar));
            paramsKardex.addValue("precodol_kar", parseDecimal(precodolKar));
            paramsKardex.addValue("precusto_kar", parseDecimal(precustoKar));
            paramsKardex.addValue("codpco_kar", codpcoKar.trim());
            paramsKardex.addValue("tabela_kar", tabelaKar.trim());
            paramsKardex.addValue("estmin_kar", parseDecimal(estminKar));
            paramsKardex.addValue("estmax_kar", parseDecimal(estmaxKar));
            paramsKardex.addValue("estmind_kar", parseDecimal(estmindKar));
            int updated = namedParameterJdbcTemplate.update(sqlKardex, paramsKardex);
            if (updated == 0) {
                // Insert into kardex if not exists
                String sqlKardexInsert = "INSERT INTO kardex (fab_kar, codprod_kar, locac_kar, dep_kar, registro_kar, tipofreq_kar, codesc_kar, " +
                                         "precorep_kar, precopub_kar, precogar_kar, percsug_kar, precodol_kar, precusto_kar, " +
                                         "codpco_kar, tabela_kar, estmin_kar, estmax_kar, estmind_kar) " +
                                         "VALUES (:fab_kar, :codprod_kar, :locac_kar, :dep_kar, '01', :tipofreq_kar, :codesc_kar, " +
                                         ":precorep_kar, :precopub_kar, :precogar_kar, :percsug_kar, :precodol_kar, :precusto_kar, " +
                                         ":codpco_kar, :tabela_kar, :estmin_kar, :estmax_kar, :estmind_kar)";
                namedParameterJdbcTemplate.update(sqlKardexInsert, paramsKardex);
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Produto atualizado com sucesso"));
        } catch (Exception e) {
            log.error("Erro ao atualizar produto: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // util local: parseDecimal
    private static BigDecimal parseDecimal(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try { return new BigDecimal(value.trim()); } catch (Exception e) { return null; }
    }

    // util local: leftPad
    private static String leftPad(String value, int size, char ch) {
        if (value == null) value = "";
        if (value.length() >= size) return value;
        StringBuilder sb = new StringBuilder(size);
        for (int i = value.length(); i < size; i++) sb.append(ch);
        sb.append(value);
        return sb.toString();
    }

    /**
     * POST /api/estoque/inventario
     * Recebe payload { dateInv: 'YYYY-MM-DD', rows: [ { ...rowData } ] }
     * Persiste em lote na tabela `invent` mapeando campos conforme regras do cliente.
     */
    @org.springframework.web.bind.annotation.PostMapping("/inventario")
    public ResponseEntity<?> inventario(@org.springframework.web.bind.annotation.RequestBody java.util.Map<String, Object> payload, HttpSession session) {
        try {
            Object dateObj = payload.get("dateInv");
            if (dateObj == null) return ResponseEntity.badRequest().body(Map.of("error", "dateInv is required"));
            java.time.LocalDate dateInv;
            try {
                dateInv = java.time.LocalDate.parse(String.valueOf(dateObj));
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid dateInv format, expected YYYY-MM-DD"));
            }

            Object rowsObj = payload.get("rows");
            if (!(rowsObj instanceof java.util.List)) return ResponseEntity.badRequest().body(Map.of("error", "rows must be an array"));
            java.util.List<?> rows = (java.util.List<?>) rowsObj;
            if (rows.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "rows empty"));

            // recuperar empresa e filial da sessão
            String empresa = SessionHelper.getEmpresaFromSession(session); // ex: '001'
            Integer idFil = SessionHelper.getIdFilFromSession(session);
            String filialStr = idFil != null ? String.format("%03d", idFil) : null;

            // Detectar se colunas opcionais existem na tabela invent (dsm_inv, unimed_inv)
            boolean hasDsm = false;
            boolean hasUnimed = false;
            try {
                Integer c1 = namedParameterJdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invent' AND COLUMN_NAME = 'dsm_inv'",
                        new MapSqlParameterSource(), Integer.class);
                hasDsm = c1 != null && c1 > 0;
            } catch (Exception ex) {
                hasDsm = false;
            }
            try {
                Integer c2 = namedParameterJdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invent' AND COLUMN_NAME = 'unimed_inv'",
                        new MapSqlParameterSource(), Integer.class);
                hasUnimed = c2 != null && c2 > 0;
            } catch (Exception ex) {
                hasUnimed = false;
            }

            // Montar INSERT dinamicamente incluindo colunas opcionais somente quando presentes
            StringBuilder insertSb = new StringBuilder();
            insertSb.append("INSERT INTO invent (data_inv, unitario_inv, mascara_inv, item_inv, empre_inv, dep_inv, grupo_inv, fab_inv, produto_inv, nomeprod_inv, qtde_inv, natureza_inv");
            if (hasUnimed) insertSb.append(", unimed_inv");
            if (hasDsm) insertSb.append(", dsm_inv");
            insertSb.append(") VALUES (:data_inv, :unitario_inv, :mascara_inv, :item_inv, :empre_inv, :dep_inv, :grupo_inv, :fab_inv, :produto_inv, :nomeprod_inv, :qtde_inv, :natureza_inv");
            if (hasUnimed) insertSb.append(", :unimed_inv");
            if (hasDsm) insertSb.append(", :dsm_inv");
            insertSb.append(")");
            String insertSql = insertSb.toString();

            java.util.List<MapSqlParameterSource> batch = new java.util.ArrayList<>();
            int skippedFabNull = 0;
            for (Object o : rows) {
                if (!(o instanceof java.util.Map)) continue;
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> r = (java.util.Map<String, Object>) o;

                // determinar fab (priorizar fab_est, depois fab, depois categoria)
                Object fabObj = null;
                if (r.containsKey("fab_est")) fabObj = r.get("fab_est");
                if ((fabObj == null || String.valueOf(fabObj).trim().isEmpty()) && r.containsKey("fab")) fabObj = r.get("fab");
                if ((fabObj == null || String.valueOf(fabObj).trim().isEmpty()) && r.containsKey("categoria")) fabObj = r.get("categoria");
                if ((fabObj == null || String.valueOf(fabObj).trim().isEmpty()) && r.containsKey("categoria_est")) fabObj = r.get("categoria_est");
                String fabVal = fabObj == null ? null : String.valueOf(fabObj).trim();
                if (fabVal == null || fabVal.isEmpty()) {
                    // ignorar registros sem fab conforme instrução do usuário
                    skippedFabNull++;
                    continue;
                }

                MapSqlParameterSource p = new MapSqlParameterSource();
                p.addValue("data_inv", dateInv.toString());
                // unitario_inv = custo_uni
                p.addValue("unitario_inv", r.getOrDefault("custo_uni", 0));
                p.addValue("mascara_inv", 4);
                // item_inv = referencia_est (fallbacks)
                Object itemRef = r.get("referencia_est");
                if (itemRef == null) itemRef = r.get("referencia");
                if (itemRef == null) itemRef = r.get("ref");
                p.addValue("item_inv", itemRef == null ? null : String.valueOf(itemRef));
                p.addValue("empre_inv", empresa);
                // dep_inv = filial da sessão (conforme instrução do usuário)
                p.addValue("dep_inv", filialStr);
                p.addValue("grupo_inv", r.getOrDefault("catitem_est", r.getOrDefault("catitem_est", r.get("grupo"))));
                p.addValue("fab_inv", fabVal);
                p.addValue("produto_inv", r.getOrDefault("codprod_est", r.getOrDefault("produto", r.get("produto"))));
                p.addValue("nomeprod_inv", r.getOrDefault("descr_est", r.getOrDefault("descricao", r.get("descricao"))));
                p.addValue("qtde_inv", r.getOrDefault("saldo", r.getOrDefault("saldo", 0)));

                // natureza_inv: prefer payload 'natureza_est' or 'natureza'; se ausente, tentar buscar em estoque.codprod_est
                Object naturezaObj = r.get("natureza_est");
                if (naturezaObj == null) naturezaObj = r.get("natureza");
                if (naturezaObj == null) {
                    try {
                        Object prodCode = r.getOrDefault("codprod_est", r.get("produto"));
                        if (prodCode != null) {
                            String sqlNat = "SELECT natureza_est FROM estoque WHERE codprod_est = :cod LIMIT 1";
                            MapSqlParameterSource natParams = new MapSqlParameterSource();
                            natParams.addValue("cod", String.valueOf(prodCode));
                            try {
                                String nat = namedParameterJdbcTemplate.queryForObject(sqlNat, natParams, String.class);
                                naturezaObj = nat;
                            } catch (Exception ex) {
                                naturezaObj = null;
                            }
                        }
                    } catch (Exception ex) {
                        naturezaObj = null;
                    }
                }
                p.addValue("natureza_inv", naturezaObj);

                // unimed_inv: se coluna existe, prefer payload 'unined_est' (ou 'unimed_est') ou buscar em estoque
                if (hasUnimed) {
                    Object unimedObj = null;
                    // checar possíveis nomes no payload (corrigir typo 'unined_est')
                    if (r.containsKey("unined_est")) unimedObj = r.get("unined_est");
                    if (unimedObj == null && r.containsKey("unimed_est")) unimedObj = r.get("unimed_est");

                    if (unimedObj == null) {
                        try {
                            Object prodCode = r.getOrDefault("codprod_est", r.get("produto"));
                            if (prodCode != null) {
                                // tentar primeiro coluna 'unined_est' (corrigida), depois 'unimed_est'
                                String sqlUni1 = "SELECT unined_est FROM estoque WHERE codprod_est = :cod LIMIT 1";
                                MapSqlParameterSource uniParams = new MapSqlParameterSource();
                                uniParams.addValue("cod", String.valueOf(prodCode));
                                try {
                                    String uni = namedParameterJdbcTemplate.queryForObject(sqlUni1, uniParams, String.class);
                                    unimedObj = uni;
                                } catch (Exception ex1) {
                                    try {
                                        String sqlUni2 = "SELECT unimed_est FROM estoque WHERE codprod_est = :cod LIMIT 1";
                                        String uni2 = namedParameterJdbcTemplate.queryForObject(sqlUni2, uniParams, String.class);
                                        unimedObj = uni2;
                                    } catch (Exception ex2) {
                                        unimedObj = null;
                                    }
                                }
                            }
                        } catch (Exception ex) {
                            unimedObj = null;
                        }
                    }
                    p.addValue("unimed_inv", unimedObj);
                }

                // dsm_inv: se coluna existe, usar DMS/dms/dsm do payload quando possível (inteiro)
                if (hasDsm) {
                    Object dmsObj = r.get("DMS");
                    if (dmsObj == null) dmsObj = r.get("dms");
                    if (dmsObj == null) dmsObj = r.get("dsm");
                    if (dmsObj == null) {
                        p.addValue("dsm_inv", null);
                    } else {
                        try {
                            p.addValue("dsm_inv", Integer.valueOf(String.valueOf(dmsObj)));
                        } catch (Exception ex) {
                            p.addValue("dsm_inv", null);
                        }
                    }
                }

                batch.add(p);
            }

            // Antes de inserir, remover registros existentes para a mesma data (e filial se disponível)
            try {
                String deleteSql;
                MapSqlParameterSource delParams = new MapSqlParameterSource();
                delParams.addValue("data_inv", dateInv.toString());
                if (filialStr != null && !filialStr.isBlank()) {
                    deleteSql = "DELETE FROM invent WHERE data_inv = :data_inv AND dep_inv = :dep_inv";
                    delParams.addValue("dep_inv", filialStr);
                } else {
                    deleteSql = "DELETE FROM invent WHERE data_inv = :data_inv";
                }
                int deleted = namedParameterJdbcTemplate.update(deleteSql, delParams);
                log.info("Inventario: removidos {} registros existentes para data {} dep {}", deleted, dateInv, filialStr);
            } catch (Exception ex) {
                log.warn("Falha ao limpar inventario existente antes do insert: {}", ex.getMessage());
            }

            if (batch.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "No valid rows to insert"));

            MapSqlParameterSource[] arr = batch.toArray(new MapSqlParameterSource[0]);
            int[] results = namedParameterJdbcTemplate.batchUpdate(insertSql, arr);

            int inserted = 0;
            for (int v : results) if (v > 0) inserted += v;

            // retornar também quantos registros foram pulados por falta de fab
            return ResponseEntity.ok(Map.of("inserted", inserted, "skippedFabNull", skippedFabNull));
        } catch (Exception e) {
            log.error("Erro ao gravar inventario: {}", e.getMessage(), e);
            try {
                java.io.StringWriter sw = new java.io.StringWriter();
                e.printStackTrace(new java.io.PrintWriter(sw));
                String trace = sw.toString();
                Map<String,Object> body = new HashMap<>();
                body.put("error", e.getMessage());
                body.put("trace", trace);
                return ResponseEntity.status(500).body(body);
            } catch (Exception ex2) {
                return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
            }
        }
    }

    private String getMascara(String fab, String codprod) {
        if (fab == null || fab.isBlank() || codprod == null || codprod.isBlank()) return "";
        try {
            String sql = "SELECT TRIM(mascara_est) FROM estoque WHERE fab_est = :fab AND codprod_est = :cod LIMIT 1";
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("fab", fab.trim());
            params.addValue("cod", codprod.trim());
            String mask = namedParameterJdbcTemplate.queryForObject(sql, params, String.class);
            return mask != null ? mask.trim() : "4";
        } catch (Exception e) {
            return "4";
        }
    }

}

