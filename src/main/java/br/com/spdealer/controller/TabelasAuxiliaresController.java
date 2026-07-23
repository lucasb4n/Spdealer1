package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Controller genérico para tabelas auxiliares/master do sistema
 * Centraliza o acesso às tabelas que começam com "mas" e outras auxiliares
 * Evita duplicação de código nos controllers específicos
 */
@RestController
@RequestMapping("/api/tabelas-auxiliares")
public class TabelasAuxiliaresController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Configuração das tabelas auxiliares disponíveis
     * Define estrutura: nome da tabela, campo código, campo descrição
     */
    private static final Map<String, Map<String, String>> TABELAS_CONFIG = new HashMap<String, Map<String, String>>() {{
        // Tabelas Master principais
        put("masdoc", Map.of("tabela", "masdoc", "codigo", "codigo_doc", "descricao", "descr_doc"));
        put("mascob", Map.of("tabela", "mascob", "codigo", "codigo_cob", "descricao", "descr_cob"));
        put("masdep", Map.of("tabela", "masdep", "codigo", "codigo_dep", "descricao", "descr_dep"));
        put("maspag", Map.of("tabela", "maspag", "codigo", "codigo_paga", "descricao", "descr_paga"));
        put("maspub", Map.of("tabela", "maspub", "codigo", "codigo_maspub", "descricao", "descr_pub"));
        put("mascobp", Map.of("tabela", "mascobp", "codigo", "codigo_cobp", "descricao", "descr_cobp"));
        put("masdocp", Map.of("tabela", "masdocp", "codigo", "codigo_docp", "descricao", "descr_docp"));
        put("masger", Map.of("tabela", "masger", "codigo", "NUMEMPR_GER", "descricao", "NOME_GER"));
        put("masusu", Map.of("tabela", "masusu", "codigo", "codigo_usu", "descricao", "nome_usu"));
        
        // Tabelas auxiliares específicas
        put("bancos", Map.of("tabela", "bancos", "codigo", "codigo_bco", "descricao", "nome_bco"));
        put("segmentos", Map.of("tabela", "segmentos", "codigo", "codigo_segmento", "descricao", "descricao_segmento"));
        
        // Outras tabelas Master do ERP
        put("mascai", Map.of("tabela", "mascai", "codigo", "operacao_ocai", "descricao", "descr_ocai"));
        put("mascfo", Map.of("tabela", "mascfo", "codigo", "codigo_cfo", "descricao", "titulo_cfo"));
        put("masdes", Map.of("tabela", "masdes", "codigo", "codigo_des", "descricao", "desc_des"));
        put("masent", Map.of("tabela", "masent", "codigo", "cod_ment", "descricao", "descr_ment"));
        put("masest", Map.of("tabela", "masest", "codigo", "codigo_uf", "descricao", "descricao_est"));
        put("fabric", Map.of("tabela", "fabric", "codigo", "fab_codigo", "descricao", "fab_descricao"));
        put("masfab", Map.of("tabela", "masfab", "codigo", "codigo_fab", "descricao", "descricao_fab"));
        put("masfil", Map.of("tabela", "masfil", "codigo", "codigo_fil", "descricao", "nome_fil"));
        put("masfor", Map.of("tabela", "masfor", "codigo", "tipo_for", "descricao", "descr_for"));
        put("masgru", Map.of("tabela", "masgru", "codigo", "codigo_gru", "descricao", "descr_gru"));
        put("masmon", Map.of("tabela", "masmon", "codigo", "codigo_mon", "descricao", "descr_mon"));
        put("masmov", Map.of("tabela", "masmov", "codigo", "codigo_mov", "descricao", "descricao_mov"));
        put("masnat", Map.of("tabela", "masnat", "codigo", "codigo_nat", "descricao", "descricao_nat"));
        put("masnbm", Map.of("tabela", "masnbm", "codigo", "codigo_nbm", "descricao", "descr_nbm"));
        put("masniv", Map.of("tabela", "masniv", "codigo", "nivel_niv", "descricao", "descr_niv"));
        put("masope", Map.of("tabela", "masope", "codigo", "codigo_ope", "descricao", "descr_ope"));
        put("masos", Map.of("tabela", "masos", "codigo", "codigo_os", "descricao", "descr_os"));
        put("masper", Map.of("tabela", "masper", "codigo", "codigo_mper", "descricao", "descr_mper"));
        put("masprg", Map.of("tabela", "masprg", "codigo", "codigo_prg", "descricao", "programa_prg"));
        put("masscoc", Map.of("tabela", "masscoc", "codigo", "criterio_scoc", "descricao", "ntop_scoc"));
        put("masscol", Map.of("tabela", "linha_scol", "codigo", "linha_scol", "descricao", "descr_scol"));
        put("massecao", Map.of("tabela", "massecao", "codigo", "codigo_sec", "descricao", "descricao_masec"));
        put("masser", Map.of("tabela", "masser", "codigo", "codigo_mser", "descricao", "descr_mser"));
        put("massit", Map.of("tabela", "massit", "codigo", "cod_sit", "descricao", "descr_sit"));
        put("mastip", Map.of("tabela", "mastip", "codigo", "codigo_tip", "descricao", "descr_tip"));
        put("mastrib", Map.of("tabela", "mastrib", "codigo", "codigo_trib", "descricao", "descr_trib"));
        put("masven", Map.of("tabela", "masven", "codigo", "cod_ven", "descricao", "nome_ven"));
        
        // Tabela específica 
        put("scodep", Map.of("tabela", "scodep", "codigo", "codigo_scd", "descricao", "descr_scd"));
    }};

    /**
     * Listar todas as tabelas auxiliares disponíveis
     */
    @GetMapping("/disponiveis")
    public ResponseEntity<Map<String, Object>> listarTabelasDisponiveis() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("tabelas", TABELAS_CONFIG.keySet());
            response.put("total", TABELAS_CONFIG.size());
            response.put("descricao", "Tabelas auxiliares disponíveis no sistema");
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erro ao listar tabelas disponíveis: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("erro", "Erro interno"));
        }
    }

    /**
     * Buscar tipos de documento (masdocp) com campo adicional abrev
     * Endpoint específico para o formulário de relatórios
     * @return Lista de tipos de documento
     */
    @GetMapping("/tipos-documento")
    public ResponseEntity<List<Map<String, Object>>> getTiposDocumento(
            @RequestParam(required = false) String abrev,
            @RequestParam(required = false) String tipo) {
        try {
            String sql;
            List<Object> params = new ArrayList<>();
            
            if ("FOLHA".equalsIgnoreCase(abrev)) {
                // Buscar de masdocp quando filtrar por FOLHA
                sql = """
                    SELECT 
                        codigo_docp as codigo,
                        descr_docp as descricao,
                        abrev_docp as abrev
                    FROM masdocp 
                    WHERE abrev_docp = ?
                    ORDER BY descr_docp
                    """;
                params.add("FOLHA");
            } else if ("pagar".equalsIgnoreCase(tipo)) {
                // Contas a Pagar: buscar TODOS de masdocp
                sql = """
                    SELECT 
                        codigo_docp as codigo,
                        descr_docp as descricao,
                        abrev_docp as abrev
                    FROM masdocp 
                    ORDER BY descr_docp
                    """;
            } else {
                // Contas a Receber: buscar de masdoc
                sql = """
                    SELECT 
                        codigo_doc as codigo,
                        descr_doc as descricao,
                        abrev_doc as abrev
                    FROM masdoc 
                    ORDER BY descr_doc
                    """;
            }

            List<Map<String, Object>> dados;
            if (params.isEmpty()) {
                dados = jdbcTemplate.queryForList(sql);
            } else {
                dados = jdbcTemplate.queryForList(sql, params.toArray());
            }
            
            return ResponseEntity.ok(dados);

        } catch (Exception e) {
            System.err.println("Erro ao buscar tipos de documento: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Buscar dados de uma tabela auxiliar específica
     * @param nomeTabela Nome da tabela (ex: masdoc, mascob, etc.)
     * @return Lista de registros da tabela
     */
    @GetMapping("/{nomeTabela}")
    public ResponseEntity<List<Map<String, Object>>> buscarDadosTabela(
            @PathVariable String nomeTabela,
            @RequestParam(required = false) String search) {
        return buscarDadosTabelaInternal(nomeTabela, search);
    }

    // Overload for internal callers (no search param)
    public ResponseEntity<List<Map<String, Object>>> buscarDadosTabela(String nomeTabela) {
        return buscarDadosTabelaInternal(nomeTabela, null);
    }

    private ResponseEntity<List<Map<String, Object>>> buscarDadosTabelaInternal(
            String nomeTabela, String search) {
        try {
            // Validar se a tabela existe na configuração
            if (!TABELAS_CONFIG.containsKey(nomeTabela.toLowerCase())) {
                return ResponseEntity.badRequest().body(null);
            }

            Map<String, String> config = TABELAS_CONFIG.get(nomeTabela.toLowerCase());
            
            String sql;
            List<Object> params = new ArrayList<>();
            
            if (search != null && !search.trim().isEmpty()) {
                sql = String.format("""
                    SELECT 
                        %s as codigo,
                        %s as descricao
                    FROM %s 
                    WHERE LOWER(%s) LIKE ?
                    ORDER BY %s
                    """,
                    config.get("codigo"),
                    config.get("descricao"),
                    config.get("tabela"),
                    config.get("descricao"),
                    config.get("descricao")
                );
                params.add("%" + search.trim().toLowerCase() + "%");
            } else {
                sql = String.format("""
                    SELECT 
                        %s as codigo,
                        %s as descricao
                    FROM %s 
                    ORDER BY %s
                    """,
                    config.get("codigo"),
                    config.get("descricao"),
                    config.get("tabela"),
                    config.get("descricao")
                );
            }

            List<Map<String, Object>> dados;
            if (params.isEmpty()) {
                dados = jdbcTemplate.queryForList(sql);
            } else {
                dados = jdbcTemplate.queryForList(sql, params.toArray());
            }
            return ResponseEntity.ok(dados);

        } catch (Exception e) {
            System.err.println("Erro ao buscar dados da tabela " + nomeTabela + ": " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Buscar registro específico por código
     * @param nomeTabela Nome da tabela
     * @param codigo Código do registro
     * @return Registro encontrado
     */
    @GetMapping("/{nomeTabela}/{codigo}")
    public ResponseEntity<Map<String, Object>> buscarPorCodigo(
            @PathVariable String nomeTabela, 
            @PathVariable String codigo) {
        try {
            // Validar se a tabela existe na configuração
            if (!TABELAS_CONFIG.containsKey(nomeTabela.toLowerCase())) {
                return ResponseEntity.badRequest().body(null);
            }

            Map<String, String> config = TABELAS_CONFIG.get(nomeTabela.toLowerCase());
            
            String sql = String.format("""
                SELECT 
                    %s as codigo,
                    %s as descricao
                FROM %s 
                WHERE %s = ?
                """, 
                config.get("codigo"), 
                config.get("descricao"), 
                config.get("tabela"),
                config.get("codigo")
            );

            List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, codigo);
            
            if (resultado.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(resultado.get(0));

        } catch (Exception e) {
            System.err.println("Erro ao buscar registro: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Buscar múltiplas tabelas de uma vez (útil para carregar combos)
     * @param tabelas Lista de nomes de tabelas separadas por vírgula
     * @return Map com dados de cada tabela solicitada
     */
    @GetMapping("/multiplas")
    public ResponseEntity<Map<String, Object>> buscarMultiplasTabelas(
            @RequestParam String tabelas) {
        try {
            String[] nomeTabelas = tabelas.split(",");
            Map<String, Object> resultado = new HashMap<>();

            for (String nomeTabela : nomeTabelas) {
                String tabela = nomeTabela.trim().toLowerCase();
                
                if (TABELAS_CONFIG.containsKey(tabela)) {
                    Map<String, String> config = TABELAS_CONFIG.get(tabela);
                    
                    String sql = String.format("""
                        SELECT 
                            %s as codigo,
                            %s as descricao
                        FROM %s 
                        ORDER BY %s
                        """, 
                        config.get("codigo"), 
                        config.get("descricao"), 
                        config.get("tabela"),
                        config.get("descricao")
                    );

                    List<Map<String, Object>> dados = jdbcTemplate.queryForList(sql);
                    resultado.put(tabela, dados);
                }
            }

            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            System.err.println("Erro ao buscar múltiplas tabelas: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("erro", "Erro interno"));
        }
    }

    /**
     * Endpoint específico para formulários que precisam de várias tabelas
     * Otimizado para carregar todos os dados necessários de uma vez
     */
    @GetMapping("/formulario-receber")
    public ResponseEntity<Map<String, Object>> carregarDadosFormularioReceber() {
        try {
            Map<String, Object> dados = new HashMap<>();

            // Tipos de documento
            dados.put("tiposDocumento", buscarDadosTabela("masdoc").getBody());
            
            // Tipos de cobrança
            dados.put("tiposCobranca", buscarDadosTabela("mascob").getBody());
            
            // Departamentos
            dados.put("departamentos", buscarDadosTabela("masdep").getBody());
            
            // Condições de pagamento
            dados.put("condicoesPagamento", buscarDadosTabela("maspag").getBody());
            
            // Bancos
            dados.put("bancos", buscarDadosTabela("bancos").getBody());

            return ResponseEntity.ok(dados);

        } catch (Exception e) {
            System.err.println("Erro ao carregar dados do formulário: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("erro", "Erro interno"));
        }
    }

    /**
     * Endpoint específico para formulários que precisam de várias tabelas (Contas a Pagar)
     */
    @GetMapping("/formulario-pagar")
    public ResponseEntity<Map<String, Object>> carregarDadosFormularioPagar() {
        try {
            Map<String, Object> dados = new HashMap<>();

            // Tipos de documento para pagar (tenta masdocp, senão usa masdoc)
            if (TABELAS_CONFIG.containsKey("masdocp")) {
                dados.put("tiposDocumento", buscarDadosTabela("masdocp").getBody());
            } else {
                dados.put("tiposDocumento", buscarDadosTabela("masdoc").getBody());
            }
            
            // Tipos de cobrança para pagar (tenta mascobp, senão usa mascob)
            if (TABELAS_CONFIG.containsKey("mascobp")) {
                dados.put("tiposCobranca", buscarDadosTabela("mascobp").getBody());
            } else {
                dados.put("tiposCobranca", buscarDadosTabela("mascob").getBody());
            }
            
            // Departamentos (mesmo para ambos)
            dados.put("departamentos", buscarDadosTabela("masdep").getBody());
            
            // Condições de pagamento (mesmo para ambos)
            dados.put("condicoesPagamento", buscarDadosTabela("maspag").getBody());
            
            // Bancos (mesmo para ambos)
            dados.put("bancos", buscarDadosTabela("bancos").getBody());

            return ResponseEntity.ok(dados);

        } catch (Exception e) {
            System.err.println("Erro ao carregar dados do formulário pagar: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("erro", "Erro interno"));
        }
    }

    /**
     * Endpoint para buscar dados de vendedores
     */
    @GetMapping("/vendedores")
    public ResponseEntity<List<Map<String, Object>>> listarVendedores() {
        return buscarDadosTabela("masven");
    }

    /**
     * Endpoint para buscar dados de filiais
     */
    @GetMapping("/filiais")
    public ResponseEntity<List<Map<String, Object>>> listarFiliais() {
        return buscarDadosTabela("masfil");
    }

    /**
     * Endpoint para buscar dados de empresas (masger)
     */
    @GetMapping("/empresas")
    public ResponseEntity<List<Map<String, Object>>> listarEmpresas() {
        return buscarDadosTabela("masger");
    }

    /**
     * Endpoint para buscar dados de grupos
     */
    @GetMapping("/grupos")
    public ResponseEntity<List<Map<String, Object>>> listarGrupos() {
        return buscarDadosTabela("masgru");
    }

    /**
     * Endpoint para buscar dados de naturezas
     */
    @GetMapping("/naturezas")
    public ResponseEntity<List<Map<String, Object>>> listarNaturezas() {
        return buscarDadosTabela("masnat");
    }
}