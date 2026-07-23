package br.com.spdealer.controller;

import br.com.spdealer.dto.PrecoSugeridoRequest;
import br.com.spdealer.dto.PrecoSugeridoResponse;
import br.com.spdealer.service.PrecoSugeridoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/produtos")
public class ProdutoController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PrecoSugeridoService precoSugeridoService;

    @PostMapping("/calcular-preco-sugerido")
    public ResponseEntity<PrecoSugeridoResponse> calcularPrecoSugerido(@RequestBody PrecoSugeridoRequest request) {
        try {
            PrecoSugeridoResponse response = precoSugeridoService.calcular(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            PrecoSugeridoResponse err = new PrecoSugeridoResponse();
            err.setSuccess(false);
            err.setMensagem("Erro ao calcular preço sugerido: " + e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    @GetMapping("/lookup")
    public ResponseEntity<Map<String, Object>> lookup(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String fab,
            @RequestParam(defaultValue = "1") Integer deposito,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        try {
            StringBuilder whereClause = new StringBuilder("WHERE 1=1");
            List<Object> params = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                whereClause.append(" AND (");
                whereClause.append(" LOWER(e.codprod_est) LIKE ?");
                whereClause.append(" OR LOWER(e.descr_est) LIKE ?");
                whereClause.append(" OR LOWER(e.referencia_est) LIKE ?");
                whereClause.append(")");
                String searchPattern = "%" + search.toLowerCase() + "%";
                params.add(searchPattern);
                params.add(searchPattern);
                params.add(searchPattern);
            }

            if (fab != null && !fab.isEmpty()) {
                whereClause.append(" AND e.fab_est = ?");
                params.add(fab);
            }

            String countSql = """
                SELECT COUNT(*) 
                FROM estoque e 
                """ + whereClause;
            int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

            String sql = """
                SELECT 
                    e.codprod_est AS codigo,
                    e.fab_est AS fab,
                    e.descr_est AS descricao,
                    e.referencia_est AS referencia,
                    e.unined_est AS un_medida,
                    e.peso_est AS peso,
                    e.catitem_est AS categoria,
                    e.codfis_est AS ncm,
                    COALESCE(k.qtde_kar, 0) AS estoque,
                    COALESCE(k.qtaloc_kar, 0) AS alocado,
                    COALESCE(k.qtde_kar, 0) - COALESCE(k.qtaloc_kar, 0) AS saldo,
                    COALESCE(k.precopub_kar, k.precorep_kar, k.precoavi_kar, k.ultprec_kar, 0) AS preco_pub,
                    COALESCE(k.precorep_kar, 0) AS preco_rep,
                    COALESCE(k.ultprec_kar, 0) AS ultimo_preco,
                    k.dtultent_kar AS dt_ult_entrada,
                    k.dtultsai_kar AS dt_ult_saida,
                    '' AS localizacao,
                    mg.descr_gru AS grupo_descricao
                FROM estoque e
                LEFT JOIN kardex k ON k.fab_kar = e.fab_est 
                    AND k.codprod_kar = e.codprod_est 
                    AND k.dep_kar = ?
                    AND k.registro_kar = '01'
                LEFT JOIN masgru mg ON mg.codigo_gru = e.catitem_est
                """ + " " + whereClause + " " + """
                ORDER BY e.descr_est ASC
                LIMIT ? OFFSET ?
                """;

            List<Object> queryParams = new ArrayList<>();
            queryParams.add(deposito);
            queryParams.addAll(params);
            queryParams.add(size);
            queryParams.add(page * size);

            List<Map<String, Object>> registros = jdbcTemplate.queryForList(sql, queryParams.toArray());

            List<Map<String, Object>> data = registros.stream()
                .map(this::formatarProduto)
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", data);
            response.put("pagination", Map.of(
                "total", total,
                "page", page,
                "size", size,
                "totalPages", (int) Math.ceil((double) total / size)
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erro ao buscar produtos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar produtos"
            ));
        }
    }

    @GetMapping("/{fab}/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorCodigo(
            @PathVariable String fab,
            @PathVariable String codigo,
            @RequestParam(defaultValue = "1") Integer deposito) {
        try {
            String sql = """
                SELECT 
                    e.codprod_est AS codigo,
                    e.fab_est AS fab,
                    e.descr_est AS descricao,
                    e.referencia_est AS referencia,
                    e.unined_est AS un_medida,
                    e.peso_est AS peso,
                    e.catitem_est AS categoria,
                    e.codfis_est AS ncm,
                    COALESCE(k.qtde_kar, 0) AS estoque,
                    COALESCE(k.qtaloc_kar, 0) AS alocado,
                    COALESCE(k.qtde_kar, 0) - COALESCE(k.qtaloc_kar, 0) AS saldo,
                    COALESCE(k.precopub_kar, k.precorep_kar, k.precoavi_kar, k.ultprec_kar, 0) AS preco_pub,
                    COALESCE(k.precorep_kar, 0) AS preco_rep,
                    COALESCE(k.ultprec_kar, 0) AS ultimo_preco,
                    k.dtultent_kar AS dt_ult_entrada,
                    k.dtultsai_kar AS dt_ult_saida,
                    '' AS localizacao,
                    mg.descr_gru AS grupo_descricao
                FROM estoque e
                LEFT JOIN kardex k ON k.fab_kar = e.fab_est 
                    AND k.codprod_kar = e.codprod_est 
                    AND k.dep_kar = ?
                    AND k.registro_kar = '01'
                LEFT JOIN masgru mg ON mg.codigo_gru = e.catitem_est
                WHERE e.fab_est = ? AND e.codprod_est = ?
                """;

            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, deposito, fab, codigo);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Produto não encontrado"
                ));
            }

            Map<String, Object> produto = formatarProduto(resultados.get(0));

            String precosSql = """
                SELECT 
                    mn.nivel_niv AS nivel,
                    mn.descr_niv AS descricao,
                    mn.perc_niv AS percentual
                FROM masniv mn
                ORDER BY mn.nivel_niv
                """;
            List<Map<String, Object>> precos = jdbcTemplate.queryForList(precosSql);
            produto.put("precos_nivel", precos);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", produto
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar produto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar produto"
            ));
        }
    }

    @GetMapping("/estoque")
    public ResponseEntity<Map<String, Object>> verificarEstoque(
            @RequestParam String fab,
            @RequestParam String codigo,
            @RequestParam(defaultValue = "1") Integer deposito) {
        try {
            String sql = """
                SELECT 
                    COALESCE(k.qtde_kar, 0) AS estoque,
                    COALESCE(k.qtaloc_kar, 0) AS alocado,
                    COALESCE(k.qtde_kar, 0) - COALESCE(k.qtaloc_kar, 0) AS saldo,
                    k.locackar_kar AS localizacao,
                    k.dtultent_kar AS dt_ult_entrada,
                    k.dtultsai_kar AS dt_ult_saida,
                    e.descr_est AS descricao
                FROM estoque e
                LEFT JOIN kardex k ON k.fab_kar = e.fab_est 
                    AND k.codprod_kar = e.codprod_est 
                    AND k.dep_kar = ?
                WHERE e.fab_est = ? AND e.codprod_est = ?
                """;

            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, deposito, fab, codigo);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Produto não encontrado"
                ));
            }

            Map<String, Object> estoque = resultados.get(0);
            
            BigDecimal saldo = new BigDecimal(estoque.get("saldo").toString());
            BigDecimal estoqueValue = new BigDecimal(estoque.get("estoque").toString());
            BigDecimal alocado = new BigDecimal(estoque.get("alocado").toString());
            
            String status;
            if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
                status = "SEM_ESTOQUE";
            } else if (saldo.compareTo(new BigDecimal("10")) < 0) {
                status = "ESTOQUE_BAIXO";
            } else {
                status = "DISPONIVEL";
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("fab", fab);
            result.put("codigo", codigo);
            result.put("descricao", estoque.get("descricao"));
            result.put("estoque", estoqueValue);
            result.put("alocado", alocado);
            result.put("saldo", saldo);
            result.put("localizacao", estoque.get("localizacao"));
            result.put("dt_ult_entrada", estoque.get("dt_ult_entrada"));
            result.put("dt_ult_saida", estoque.get("dt_ult_saida"));
            result.put("status", status);
            result.put("deposito", deposito);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("Erro ao verificar estoque: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao verificar estoque"
            ));
        }
    }

    private Map<String, Object> formatarProduto(Map<String, Object> prod) {
        Map<String, Object> formatted = new HashMap<>();
        
        formatted.put("codigo", prod.get("codigo"));
        formatted.put("fab", prod.get("fab"));
        formatted.put("descricao", prod.get("descricao"));
        formatted.put("referencia", prod.get("referencia"));
        formatted.put("un_medida", prod.get("un_medida"));
        formatted.put("peso", prod.get("peso"));
        formatted.put("categoria", prod.get("categoria"));
        formatted.put("ncm", prod.get("ncm"));
        formatted.put("cod_barras", prod.get("cod_barras"));
        
        BigDecimal estoque = toBigDecimal(prod.get("estoque"));
        BigDecimal alocado = toBigDecimal(prod.get("alocado"));
        BigDecimal saldo = toBigDecimal(prod.get("saldo"));
        
        formatted.put("estoque", estoque);
        formatted.put("alocado", alocado);
        formatted.put("saldo", saldo);
        
        formatted.put("preco_pub", toBigDecimal(prod.get("preco_pub")));
        formatted.put("preco_rep", toBigDecimal(prod.get("preco_rep")));
        formatted.put("ultimo_preco", toBigDecimal(prod.get("ultimo_preco")));
        
        formatted.put("dt_ult_entrada", prod.get("dt_ult_entrada"));
        formatted.put("dt_ult_saida", prod.get("dt_ult_saida"));
        formatted.put("localizacao", prod.get("localizacao"));
        formatted.put("grupo_descricao", prod.get("grupo_descricao"));
        
        String status;
        if (saldo.compareTo(BigDecimal.ZERO) <= 0) {
            status = "SEM_ESTOQUE";
        } else if (saldo.compareTo(new BigDecimal("10")) < 0) {
            status = "ESTOQUE_BAIXO";
        } else {
            status = "DISPONIVEL";
        }
        formatted.put("status", status);
        
        return formatted;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        try {
            return new BigDecimal(value.toString().replace(",", "."));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}
