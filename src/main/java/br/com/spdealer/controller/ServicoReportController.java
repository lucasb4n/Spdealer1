package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/relatorios/servico")
public class ServicoReportController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/por-tipo/tipos")
    public List<Map<String, Object>> tiposServico() {
        try {
            String sql = "SELECT tipo_ttmo AS id_tmo, descr_ttmo AS descr_tmo FROM tipotmo ORDER BY descr_ttmo";
            return jdbcTemplate.queryForList(sql);
        } catch (Exception ex) {
            ex.printStackTrace();
            return java.util.Collections.emptyList();
        }
    }

    @GetMapping("/por-tipo")
    public List<Map<String, Object>> buscarPorTipo(
            @RequestParam(required = false) String dataini,
            @RequestParam(required = false) String datafim,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String tipos)
    {
        StringBuilder sql = new StringBuilder();
        java.util.List<Object> params = new java.util.ArrayList<>();
        
        // Processar múltiplos tipos (separados por vírgula) ou tipo único
        String tiposParam = tipos;
        if (tiposParam == null && tipo != null && !tipo.isEmpty()) {
            tiposParam = tipo;
        }
        
        boolean temFiltroTipo = tiposParam != null && !tiposParam.isEmpty();
        java.util.List<String> tiposDescricoes = new java.util.ArrayList<>();
        
        if (temFiltroTipo) {
            String[] listaTipos = tiposParam.split(",");
            if (listaTipos.length > 0) {
                for (String t : listaTipos) {
                    String trimmed = t.trim();
                    if (!trimmed.isEmpty()) {
                        try {
                            String descrFromTmo = jdbcTemplate.queryForObject("SELECT descr_ttmo FROM tipotmo WHERE tipo_ttmo = ?", new Object[]{trimmed}, String.class);
                            if (descrFromTmo != null && !descrFromTmo.isEmpty()) {
                                tiposDescricoes.add(descrFromTmo.trim().toLowerCase());
                            } else {
                                tiposDescricoes.add(trimmed.toLowerCase());
                            }
                        } catch (Exception ignored) {
                            tiposDescricoes.add(trimmed.toLowerCase());
                        }
                    }
                }
            }
        }
        
        if (temFiltroTipo && !tiposDescricoes.isEmpty()) {
            // Query com JOINs para calcular valores filtrados efficientemente
            StringBuilder likeConditions = new StringBuilder();
            for (int i = 0; i < tiposDescricoes.size(); i++) {
                if (i > 0) likeConditions.append(" OR ");
                likeConditions.append("LOWER(TRIM(cdt_f.descr_cdt)) LIKE ?");
            }
            
            sql.append("SELECT o.numero_ser AS nro_os, o.tiposer_ser AS tipo, o.dtemi_ser AS data_ini, o.dtfat_ser AS data_fim, o.cliente_ser AS documento, ");
            sql.append("CASE WHEN c.cliforn_cli = 'c' AND c.tipopessoa_cli = o.tipocli_ser AND c.cgccpf_cli = o.cliente_ser THEN c.nome_cli ELSE NULL END AS nome, ");
            sql.append("o.codmod_ser AS modelo, o.totser_ser AS valor_ser, o.totpec_ser AS valor_pec, o.totger_ser AS total, ");
            sql.append("o.descpec_ser AS descpec_ser, o.descser_ser AS descser_ser, ");
            sql.append("COALESCE(SUM(COALESCE(cdt_f.prcpub_cdt,0) * COALESCE(cdt_f.cobrar_cdt,0) - COALESCE(cdt_f.desconto_cdt,0)),0) AS valor_ser_filtrado, ");
            sql.append("0 AS valor_pec_filtrado, ");
            sql.append("COALESCE(SUM(COALESCE(cdt_f.prcpub_cdt,0) * COALESCE(cdt_f.cobrar_cdt,0) - COALESCE(cdt_f.desconto_cdt,0)),0) AS total_filtrado ");
            sql.append("FROM ordemser o ");
            sql.append("LEFT JOIN clientes c ON (c.cgccpf_cli = o.cliente_ser AND c.tipopessoa_cli = o.tipocli_ser AND c.cliforn_cli = 'c') ");
            sql.append("JOIN cdt cdt_f ON cdt_f.os_cdt = o.numero_ser AND (").append(likeConditions).append(") ");
            sql.append("WHERE 1=1 ");
            
            // Adicionar parâmetros LIKE
            for (String descr : tiposDescricoes) {
                params.add("%" + descr + "%");
            }
            
            // Filtros de data
            if (dataini != null && !dataini.isEmpty()) {
                sql.append(" AND o.dtemi_ser >= ?");
                params.add(dataini);
            }
            if (datafim != null && !datafim.isEmpty()) {
                sql.append(" AND o.dtfat_ser <= ?");
                params.add(datafim);
            }
            
            sql.append(" GROUP BY o.numero_ser, o.tiposer_ser, o.dtemi_ser, o.dtfat_ser, o.cliente_ser, c.nome_cli, o.codmod_ser, o.totser_ser, o.totpec_ser, o.totger_ser, o.descpec_ser, o.descser_ser ");
        } else {
            // Query original sem filtro de tipo
            sql.append("SELECT o.numero_ser AS nro_os, o.tiposer_ser AS tipo, o.dtemi_ser AS data_ini, o.dtfat_ser AS data_fim, o.cliente_ser AS documento, ");
            sql.append("CASE WHEN c.cliforn_cli = 'c' AND c.tipopessoa_cli = o.tipocli_ser AND c.cgccpf_cli = o.cliente_ser THEN c.nome_cli ELSE NULL END AS nome, ");
            sql.append("o.codmod_ser AS modelo, o.totser_ser AS valor_ser, o.totpec_ser AS valor_pec, o.totger_ser AS total, ");
            sql.append("o.descpec_ser AS descpec_ser, o.descser_ser AS descser_ser ");
            sql.append("FROM ordemser o LEFT JOIN clientes c ON (c.cgccpf_cli = o.cliente_ser AND c.tipopessoa_cli = o.tipocli_ser AND c.cliforn_cli = 'c') ");
            sql.append("WHERE 1=1 ");
            
            if (dataini != null && !dataini.isEmpty()) {
                sql.append(" AND o.dtemi_ser >= ?");
                params.add(dataini);
            }
            if (datafim != null && !datafim.isEmpty()) {
                sql.append(" AND o.dtfat_ser <= ?");
                params.add(datafim);
            }
        }
        
        sql.append(" ORDER BY o.dtemi_ser DESC");
        
        // Log SQL para depuração
        System.out.println("[ServicoReportController] SQL built: " + sql.toString() + " params:" + params);
        
        try {
            if (params.isEmpty()) {
                return jdbcTemplate.queryForList(sql.toString());
            } else {
                return jdbcTemplate.queryForList(sql.toString(), params.toArray());
            }
        } catch (Exception ex) {
            System.err.println("Erro ao executar query Servico por tipo: " + sql.toString() + " params:" + params);
            ex.printStackTrace();
            return java.util.Collections.emptyList();
        }
    }

    @GetMapping("/por-tipo/{numeroSer}/detalhe")
    public List<Map<String, Object>> detalhe(@PathVariable("numeroSer") String numeroSer) {
        String sql = "SELECT cdt.descr_cdt AS servico, cdt.datamo_cdt AS data_ini, cdt.datafim_cdt AS data_fim, cdt.tpreal_cdt AS tempo, " +
            "(COALESCE(cdt.prcpub_cdt,0) * COALESCE(cdt.cobrar_cdt,0) - COALESCE(cdt.desconto_cdt,0)) AS valor " +
            "FROM cdt WHERE cdt.os_cdt = ? ORDER BY cdt.datamo_cdt";
        return jdbcTemplate.queryForList(sql, numeroSer);
    }

    @GetMapping("/schema")
    public List<Map<String, Object>> schema() {
        try {
            List<Map<String, Object>> cols = jdbcTemplate.queryForList("SHOW COLUMNS FROM ordemser");
            return cols;
        } catch (Exception ex) {
            ex.printStackTrace();
            return java.util.Collections.emptyList();
        }
    }

    @GetMapping("/count")
    public Map<String, Object> count() {
        try {
            Integer c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ordemser", Integer.class);
            return java.util.Collections.singletonMap("count", c);
        } catch (Exception ex) {
            ex.printStackTrace();
            return java.util.Collections.singletonMap("count", 0);
        }
    }

    @GetMapping("/por-tipo/sample")
    public List<Map<String, Object>> sampleOrdemser() {
        try {
            String sql = "SELECT tiposer_ser, numero_ser, dtemi_ser, dtfat_ser, totger_ser FROM ordemser LIMIT 20";
            System.out.println("[ServicoReportController] SAMPLE SQL: " + sql);
            return jdbcTemplate.queryForList(sql);
        } catch (Exception ex) {
            ex.printStackTrace();
            return java.util.Collections.emptyList();
        }
    }

    @GetMapping("/por-tipo/distinct-cdt")
    public List<Map<String, Object>> distinctCdt(@RequestParam(required = false) String like) {
        try {
            if (like != null && !like.isEmpty()) {
                String sql = "SELECT DISTINCT descr_cdt FROM cdt WHERE LOWER(TRIM(descr_cdt)) LIKE ? LIMIT 200";
                return jdbcTemplate.queryForList(sql, "%" + like.trim().toLowerCase() + "%");
            } else {
                String sql = "SELECT DISTINCT descr_cdt FROM cdt LIMIT 200";
                return jdbcTemplate.queryForList(sql);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
            return java.util.Collections.emptyList();
        }
    }

    @GetMapping("/por-tipo/tipos-ser")
    public List<Map<String, Object>> tiposServicoPorCod() {
        try {
            String sql = "SELECT DISTINCT tiposer_ser AS id_tmo, tiposer_ser AS descr_tmo FROM ordemser ORDER BY tiposer_ser";
            return jdbcTemplate.queryForList(sql);
        } catch (Exception ex) {
            ex.printStackTrace();
            return java.util.Collections.emptyList();
        }
    }

    @GetMapping("/por-tipo/{numeroSer}/verifica")
    public Map<String, Object> verificaDiferenca(@PathVariable("numeroSer") String numeroSer) {
        try {
            // Buscar campos principais da OS
            String sqlOs = "SELECT numero_ser, totser_ser, totpec_ser, totger_ser, descser_ser, descpec_ser FROM ordemser WHERE numero_ser = ?";
            Map<String, Object> os = jdbcTemplate.queryForMap(sqlOs, numeroSer);

            // Somar valores do detalhe (cdt)
            String sqlSum = "SELECT COUNT(*) AS linhas, COALESCE(SUM(prcpub_cdt),0) AS soma_prcpub FROM cdt WHERE os_cdt = ?";
            Map<String, Object> sum = jdbcTemplate.queryForMap(sqlSum, numeroSer);

            // Listar itens do detalhe
            String sqlItens = "SELECT descr_cdt AS servico, prcpub_cdt AS valor, datamo_cdt AS data_ini, datafim_cdt AS data_fim FROM cdt WHERE os_cdt = ? ORDER BY datamo_cdt";
            List<Map<String, Object>> itens = jdbcTemplate.queryForList(sqlItens, numeroSer);

            // Calcular diferença: totser_ser - descser_ser (valor serviço líquido) vs soma dos itens
            Number totser = os.get("totser_ser") instanceof Number ? (Number) os.get("totser_ser") : 0;
            Number descser = os.get("descser_ser") instanceof Number ? (Number) os.get("descser_ser") : 0;
            double valorServicoLiquido = totser.doubleValue() - descser.doubleValue();
            Number somaPrcpub = sum.get("soma_prcpub") instanceof Number ? (Number) sum.get("soma_prcpub") : 0;
            double somaItens = somaPrcpub.doubleValue();
            double diferenca = valorServicoLiquido - somaItens;

            java.util.Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("os", os);
            resp.put("soma", sum);
            resp.put("itens", itens);
            resp.put("valorServicoLiquido", valorServicoLiquido);
            resp.put("somaItens", somaItens);
            resp.put("diferenca", diferenca);
            return resp;
        } catch (Exception ex) {
            ex.printStackTrace();
            return java.util.Collections.singletonMap("error", "Erro ao verificar OS: " + ex.getMessage());
        }
    }

    @GetMapping("/por-tipo/{numeroSer}/detalhe-full")
    public List<Map<String, Object>> detalheFull(@PathVariable("numeroSer") String numeroSer) {
        String sql = "SELECT * FROM cdt WHERE os_cdt = ? ORDER BY datamo_cdt";
        return jdbcTemplate.queryForList(sql, numeroSer);
    }
}