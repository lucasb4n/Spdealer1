package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final Logger logger = LoggerFactory.getLogger(ClienteController.class);


    // Busca avançada de clientes com filtros (retorna campos esperados pelo frontend)
    @GetMapping
        public List<Map<String, Object>> listarClientes(
            @RequestParam(defaultValue = "C") String cliforn_cli,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String tipopessoa,
            @RequestParam(name = "tipofor", required = false) Integer tipofor,
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) String uf,
            @RequestParam(name = "status", required = false) String status) {
        try {
            logger.debug("listarClientes called with cliforn_cli={}, search={}, tipopessoa={}, tipofor={}, cidade={}, uf={}, status={}", cliforn_cli, search, tipopessoa, tipofor, cidade, uf, status);
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT codigo_cli, cgccpf_cli AS cpf_cnpj_cli, nome_cli, nomefan_cli, cidade_cli, uf_cli, fone_cli AS telefone_cli, celular_cli, inscest_cli, email_cli, datcadi_cli, datalt_cli, datanasc_cli, tipopessoa_cli, tipofor_cli, ativoinativo_cli, cliforn_cli FROM clientes WHERE 1=1 ");

            List<Object> paramsList = new java.util.ArrayList<>();
            if ("C".equalsIgnoreCase(cliforn_cli)) {
                sql.append("AND (UPPER(cliforn_cli) = 'C' OR UPPER(cliforn_cli) = 'A' OR cliforn_cli IS NULL OR cliforn_cli = '') ");
            } else if ("F".equalsIgnoreCase(cliforn_cli)) {
                sql.append("AND (UPPER(cliforn_cli) = 'F' OR UPPER(cliforn_cli) = 'A' OR cliforn_cli IS NULL OR cliforn_cli = '') ");
            } else if (cliforn_cli != null && !cliforn_cli.trim().isEmpty() && !"ALL".equalsIgnoreCase(cliforn_cli)) {
                sql.append("AND cliforn_cli = ? ");
                paramsList.add(cliforn_cli);
            }

            if (search != null && !search.trim().isEmpty()) {
                sql.append("AND (nome_cli LIKE ? OR nomefan_cli LIKE ? OR cgccpf_cli LIKE ? OR CAST(codigo_cli AS CHAR) LIKE ?) ");
                String searchPattern = "%" + search.trim() + "%";
                paramsList.add(searchPattern);
                paramsList.add(searchPattern);
                paramsList.add(searchPattern);
                paramsList.add(searchPattern);
            }
            if (tipopessoa != null && !tipopessoa.trim().isEmpty()) {
                sql.append("AND tipopessoa_cli = ? ");
                paramsList.add(tipopessoa);
            }
            if (cidade != null && !cidade.trim().isEmpty()) {
                sql.append("AND cidade_cli LIKE ? ");
                paramsList.add("%" + cidade.trim() + "%");
            }
            if (uf != null && !uf.trim().isEmpty()) {
                sql.append("AND uf_cli = ? ");
                paramsList.add(uf.trim());
            }
            if (tipofor != null) {
                sql.append("AND tipofor_cli = ? ");
                paramsList.add(tipofor);
            }
            if (status != null && !status.trim().isEmpty()) {
                if ("ativo".equalsIgnoreCase(status) || "a".equalsIgnoreCase(status)) {
                    sql.append("AND (UPPER(ativoinativo_cli) = 'A' OR ativoinativo_cli IS NULL OR ativoinativo_cli = '') ");
                } else if ("inativo".equalsIgnoreCase(status) || "i".equalsIgnoreCase(status)) {
                    sql.append("AND UPPER(ativoinativo_cli) = 'I' ");
                }
            }
            sql.append("ORDER BY nome_cli ASC LIMIT 5000");

            Object[] params = paramsList.toArray();
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params);
            // Aplicar máscara em cpf/cnpj antes de retornar ao frontend
            for (Map<String, Object> row : rows) {
                Object val = row.get("cpf_cnpj_cli");
                if (val == null) val = row.get("cgccpf_cli");
                Object tipo = row.get("tipopessoa_cli");
                row.put("cpf_cnpj_cli", maskCpfCnpj(val, tipo));
            }
            return rows;
        } catch (Exception e) {
            logger.error("Erro ao listar clientes: {}", e.getMessage(), e);
            return java.util.Collections.emptyList();
        }
    }

        // Busca cliente por ID (apenas números para evitar conflito com outras rotas como /total)
        @GetMapping("/{id:\\d+}")
        public Map<String, Object> buscarClientePorId(@PathVariable("id") Long id,
            @RequestParam(required = false) String cliforn_cli) {
        try {
            logger.debug("buscarClientePorId id={} cliforn_cli={}", id, cliforn_cli);
            // Return full row so frontend receives all possible fields used by the form
            String sql = "SELECT * FROM clientes WHERE codigo_cli = ?";
            Map<String, Object> map = jdbcTemplate.queryForMap(sql, id);

            // Add common aliases expected by frontend for compatibility
            if (map.containsKey("cgccpf_cli") && (map.get("cpf_cnpj_cli") == null || map.get("cpf_cnpj_cli").toString().trim().isEmpty())) {
                map.put("cpf_cnpj_cli", maskCpfCnpj(map.get("cgccpf_cli"), map.get("tipopessoa_cli")));
            } else if (map.containsKey("cpf_cnpj_cli")) {
                map.put("cpf_cnpj_cli", maskCpfCnpj(map.get("cpf_cnpj_cli"), map.get("tipopessoa_cli")));
            }

            // phone fallback: prefer fone1_cli -> fone_cli -> celular_cli
            Object tel = map.get("telefone_cli");
            boolean telEmpty = (tel == null) || (tel instanceof String && ((String) tel).trim().isEmpty());
            if (telEmpty) {
                if (map.get("fone1_cli") != null && !map.get("fone1_cli").toString().trim().isEmpty()) {
                    map.put("telefone_cli", map.get("fone1_cli"));
                } else if (map.get("fone_cli") != null && !map.get("fone_cli").toString().trim().isEmpty()) {
                    map.put("telefone_cli", map.get("fone_cli"));
                } else if (map.get("celular_cli") != null && !map.get("celular_cli").toString().trim().isEmpty()) {
                    map.put("telefone_cli", map.get("celular_cli"));
                }
            }

            logger.debug("buscarClientePorId result for id={}: {}", id, map);
            return map;
        } catch (Exception e) {
            logger.error("Erro ao buscar cliente: {}", e.getMessage(), e);
            return java.util.Collections.emptyMap();
        }
    }

    // Verifica se CNPJ existe
    @GetMapping("/verificar-cnpj")
    public Map<String, Object> verificarCnpjExistente(@RequestParam String cgccpf_cli, @RequestParam String cliforn_cli) {
        logger.debug("verificarCnpjExistente cgccpf_cli={} cliforn_cli={}", cgccpf_cli, cliforn_cli);
        // Normalizar documento recebido (remover pontos, barras e traços)
        cgccpf_cli = digitsOnly(cgccpf_cli);
        String sql = "SELECT COUNT(*) FROM clientes WHERE cgccpf_cli = ? AND tipopessoa_cli = 'J' AND cliforn_cli = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, cgccpf_cli, cliforn_cli);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("exists", count != null && count > 0);
        response.put("count", count);
        return response;
    }

    // Busca cliente por CNPJ
    @GetMapping("/buscar-por-cnpj")
    public Map<String, Object> buscarPorCnpj(@RequestParam String cgccpf_cli, @RequestParam String cliforn_cli) {
        logger.debug("buscarPorCnpj cgccpf_cli={} cliforn_cli={}", cgccpf_cli, cliforn_cli);
        // Normalizar documento recebido (remover pontos, barras e traços)
        cgccpf_cli = digitsOnly(cgccpf_cli);
        String sql = "SELECT codigo_cli, nome_cli, nomefan_cli, cgccpf_cli, tipopessoa_cli, cidade_cli, uf_cli, email_cli, fone_cli, cliforn_cli FROM clientes WHERE cgccpf_cli = ? AND tipopessoa_cli = 'J' AND cliforn_cli = ? LIMIT 1";
        try {
            Map<String, Object> map = jdbcTemplate.queryForMap(sql, cgccpf_cli, cliforn_cli);
            // Expor cpf/cnpj com máscara para o frontend
            if (map.containsKey("cgccpf_cli")) {
                map.put("cpf_cnpj_cli", maskCpfCnpj(map.get("cgccpf_cli"), map.get("tipopessoa_cli")));
            }
            logger.debug("buscarPorCnpj result: {}", map);
            return map;
        } catch (Exception e) {
            logger.error("Erro em buscarPorCnpj: {}", e.getMessage(), e);
            return java.util.Collections.emptyMap();
        }
    }

    // Calcula limite disponível
    @GetMapping("/{id}/limite-disponivel")
    public Map<String, Object> calcularLimiteDisponivel(@PathVariable("id") Long codigoCliente) {
        logger.debug("calcularLimiteDisponivel codigoCliente={}", codigoCliente);
        String sqlLimite = "SELECT limcre_cli FROM clientes WHERE cliforn_cli = 'C' AND codigo_cli = ?";
        Double limiteCredito = jdbcTemplate.queryForObject(sqlLimite, Double.class, codigoCliente);
        if (limiteCredito == null) limiteCredito = 0.0;
        String sqlSaldo = "SELECT COALESCE(SUM(vlrsal_rec), 0) as saldo_pendente FROM receber WHERE codigo_rec = ? AND vlrsal_rec > 0 AND (status_rec IS NULL OR status_rec = '')";
        Double saldoPendente = jdbcTemplate.queryForObject(sqlSaldo, Double.class, codigoCliente);
        if (saldoPendente == null) saldoPendente = 0.0;
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("limite_credito", limiteCredito);
        response.put("saldo_pendente", saldoPendente);
        response.put("limite_disponivel", limiteCredito - saldoPendente);
        logger.debug("calcularLimiteDisponivel result for {}: {}", codigoCliente, response);
        return response;
    }

    // Busca frota de veículos por CPF/CNPJ
    @GetMapping("/frota")
    public List<Map<String, Object>> getFrotaByCgccpf(@RequestParam String cgccpf) {
        logger.info("[ClienteController] getFrotaByCgccpf solicitado para: {}", cgccpf);
        String cleanCgccpf = digitsOnly(cgccpf);
        logger.info("[ClienteController] CNPJ limpo para busca: {}", cleanCgccpf);
        String sql = "SELECT fro_modelo, fro_chassi FROM frota WHERE fro_cliente = ? ORDER BY fro_modelo";
        List<Map<String, Object>> frota = jdbcTemplate.queryForList(sql, cleanCgccpf);
        logger.info("[ClienteController] Veículos encontrados: {}", frota.size());
        return frota;
    }

    // NOTE: endpoint /{id}/last-movement moved to a dedicated controller to avoid mapping ambiguities.

    @PostConstruct
    public void init() {
        logger.info("ClienteController initialized and ready (class present)");
    }

    // Endpoint de saúde
    @GetMapping("/health")
    public Map<String, String> health() {
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("status", "OK");
        response.put("service", "ClienteController");
        return response;
    }

    // Teste simples de conexão
    @GetMapping("/test-db")
    public Map<String, Object> testDatabase() {
        String sql = "SELECT COUNT(*) as total FROM clientes";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("total_clientes", count);
        response.put("status", "Database connected");
        return response;
    }

    // Retorna o total de clientes ou fornecedores conforme filtro cliforn_cli
    @GetMapping(path = {"/total", "/count"})
    public Map<String, Object> totalClientes(@RequestParam(defaultValue = "C") String cliforn_cli,
                                             @RequestParam(name = "tipofor", required = false) Integer tipofor,
                                             @RequestParam(name = "status", required = false) String status) {
        logger.info("totalClientes called with cliforn_cli={} tipofor={} status={}", cliforn_cli, tipofor, status);
        try {
            StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM clientes WHERE cliforn_cli = ?");
            java.util.List<Object> params = new java.util.ArrayList<>();
            params.add(cliforn_cli);
            if (tipofor != null) {
                sql.append(" AND tipofor_cli = ?");
                params.add(tipofor);
            }
            if (status != null && !status.trim().isEmpty()) {
                if ("ativo".equalsIgnoreCase(status) || "a".equalsIgnoreCase(status)) {
                    sql.append(" AND UPPER(ativoinativo_cli) = 'A'");
                } else if ("inativo".equalsIgnoreCase(status)) {
                    sql.append(" AND (ativoinativo_cli IS NULL OR ativoinativo_cli = '')");
                }
            }
            Integer count = jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
            java.util.Map<String, Object> res = new java.util.HashMap<>();
            res.put("total", count != null ? count : 0);
            res.put("cliforn_cli", cliforn_cli);
            if (tipofor != null) res.put("tipofor", tipofor);
            if (status != null && !status.trim().isEmpty()) res.put("status", status);
            return res;
        } catch (Exception e) {
            logger.error("Erro ao obter total de clientes/fornecedores: {}", e.getMessage(), e);
            java.util.Map<String, Object> res = new java.util.HashMap<>();
            res.put("total", 0);
            res.put("erro", e.getMessage());
            return res;
        }
    }

    // Alterna o status ativo/inativo de um cliente/fornecedor
    @PatchMapping(path = "/{id:\\d+}/toggle-ativo")
    public ResponseEntity<Map<String, Object>> toggleAtivo(@PathVariable("id") Long id,
                                                           @RequestParam(defaultValue = "true") boolean activate,
                                                           @RequestParam(defaultValue = "F") String cliforn_cli) {
        return this.doToggleAtivo(id, activate, cliforn_cli);
    }
    
    // TEMP: permitir testes rápidos via navegador com query params
    // Atenção: este endpoint altera estado (update) e deve ser removido após testes.
    @GetMapping(path = "/{id:\\d+}/simple-update")
    public ResponseEntity<Map<String, Object>> simpleUpdateGet(@PathVariable("id") Long id,
                                                               @RequestParam(name = "nome_cli", required = false) String nome_cli,
                                                               @RequestParam(name = "cgccpf_cli", required = false) String cgccpf_cli,
                                                               @RequestParam(defaultValue = "C") String cliforn_cli) {
        logger.warn("[SIMPLE-UPDATE-GET] Temporario usado para testes via browser. id={} nome_cli={} cgccpf_cli={}", id, nome_cli, cgccpf_cli);
        java.util.Map<String, Object> payload = new java.util.HashMap<>();
        if (nome_cli != null) payload.put("nome_cli", nome_cli);
        if (cgccpf_cli != null) payload.put("cgccpf_cli", cgccpf_cli);
        return simpleUpdate(id, payload, cliforn_cli);
    }

    // Also accept POST for environments where PATCH may be rejected (dev proxies, servers)
    @PostMapping(path = "/{id:\\d+}/toggle-ativo")
    public ResponseEntity<Map<String, Object>> toggleAtivoPost(@PathVariable("id") Long id,
                                                               @RequestParam(defaultValue = "true") boolean activate,
                                                               @RequestParam(defaultValue = "F") String cliforn_cli) {
        logger.info("toggleAtivoPost forwarding to doToggleAtivo for id={} activate={} cliforn_cli={}", id, activate, cliforn_cli);
        return this.doToggleAtivo(id, activate, cliforn_cli);
    }

    private ResponseEntity<Map<String, Object>> doToggleAtivo(Long id, boolean activate, String cliforn_cli) {
        logger.info("doToggleAtivo called for id={} activate={} cliforn_cli={}", id, activate, cliforn_cli);
        try {
            String newVal = activate ? "A" : ""; // 'A' para ativo, '' (vazio) para inativo (consistente com outros filtros)
            String sql = "UPDATE clientes SET ativoinativo_cli = ? WHERE cliforn_cli = ? AND codigo_cli = ?";
            int rows = jdbcTemplate.update(sql, newVal, cliforn_cli, id);
            Map<String, Object> res = new java.util.HashMap<>();
            res.put("rowsAffected", rows);
            res.put("codigo_cli", id);
            res.put("cliforn_cli", cliforn_cli);
            res.put("status", activate ? "Ativo" : "Inativo");
            logger.info("doToggleAtivo result rowsAffected={}", rows);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            logger.error("Erro ao alternar status: {}", e.getMessage(), e);
            Map<String, Object> err = new java.util.HashMap<>();
            err.put("erro", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    // Lista clientes com movimento
    @GetMapping("/com-movimento")
    public List<Map<String, Object>> listarClientesComMovimento() {
        String sql = "SELECT c.codigo_cli, c.tipopessoa_cli, c.cgccpf_cli, c.nome_cli, c.nomefan_cli, c.cidade_cli, c.uf_cli, c.fone_cli, c.celular_cli, c.email_cli, c.datcadi_cli, c.datalt_cli, c.datanasc_cli, c.cliforn_cli, MAX(r.dtmovi_rec) AS ultimo_movimento, DATEDIFF(CURDATE(), MAX(r.dtmovi_rec)) AS dias_sem_movimento FROM clientes c LEFT JOIN receber r ON r.codigo_rec = c.codigo_cli AND r.status_rec != 'E' WHERE c.cliforn_cli = 'C' GROUP BY c.codigo_cli, c.tipopessoa_cli, c.cgccpf_cli, c.nome_cli, c.nomefan_cli, c.cidade_cli, c.uf_cli, c.fone_cli, c.celular_cli, c.email_cli, c.datcadi_cli, c.datalt_cli, c.datanasc_cli, c.cliforn_cli ORDER BY c.nome_cli ASC";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> row : rows) {
            if (row.containsKey("cgccpf_cli")) {
                row.put("cpf_cnpj_cli", maskCpfCnpj(row.get("cgccpf_cli"), row.get("tipopessoa_cli")));
            }
        }
        return rows;
    }

    // Verifica se um cliente pode ser excluído (não possui lançamentos vinculados em contas a receber)
    @GetMapping("/{id:\\d+}/can-delete")
    public ResponseEntity<Map<String, Object>> verificarExclusaoCliente(@PathVariable Long id) {
        Map<String, Object> response = new java.util.HashMap<>();
        try {
            Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM receber WHERE codigo_rec = ?", Integer.class, id);
            boolean canDelete = total == null || total == 0;
            response.put("canDelete", canDelete);
            response.put("totalLancamentos", total != null ? total : 0);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erro ao verificar exclusão para cliente {}: {}", id, e.getMessage(), e);
            response.put("canDelete", false);
            response.put("erro", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // Exclui um cliente (apenas se não houver lançamentos vinculados)
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Map<String, Object>> excluirCliente(@PathVariable Long id) {
        Map<String, Object> response = new java.util.HashMap<>();
        try {
            Integer totalLancamentos = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM receber WHERE codigo_rec = ?", Integer.class, id);
            if (totalLancamentos != null && totalLancamentos > 0) {
                response.put("sucesso", false);
                response.put("canDelete", false);
                response.put("erro", "Cliente possui lançamentos em contas a receber e não pode ser excluído");
                return ResponseEntity.ok(response);
            }
            List<Map<String, Object>> cliente = jdbcTemplate.queryForList(
                "SELECT nome_cli, nomefan_cli FROM clientes WHERE cliforn_cli = 'C' AND codigo_cli = ?", id);
            if (cliente.isEmpty()) {
                response.put("sucesso", false);
                response.put("canDelete", false);
                response.put("erro", "Cliente não encontrado");
                return ResponseEntity.ok(response);
            }
            insertClientesAudit(String.valueOf(id), "DELETE", cliente, 1);
            int rows = jdbcTemplate.update("DELETE FROM clientes WHERE cliforn_cli = 'C' AND codigo_cli = ?", id);
            response.put("sucesso", rows > 0);
            response.put("canDelete", true);
            response.put("rowsAffected", rows);
            if (rows > 0) {
                response.put("mensagem", "Cliente excluído com sucesso");
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Erro ao excluir cliente {}: {}", id, e.getMessage(), e);
            response.put("sucesso", false);
            response.put("canDelete", false);
            response.put("erro", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // Análise financeira resumida (pode ser expandida depois)
    @GetMapping("/{codigoCliente}/analise-financeira")
    public Map<String, Object> getAnaliseFinanceira(@PathVariable String codigoCliente) {
        java.util.Map<String, Object> response = new java.util.HashMap<>();

        try {
            // 1) Dados básicos do cliente
            try {
                String sqlCliente = "SELECT codigo_cli, nomefan_cli, limcre_cli, datbloq_cli, motbloq_cli, datlib_cli, motlib_cli, tipopessoa_cli FROM clientes WHERE codigo_cli = ? AND cliforn_cli = 'C'";
                Map<String, Object> cliente = jdbcTemplate.queryForMap(sqlCliente, codigoCliente);
                response.put("codigo_cli", cliente.get("codigo_cli"));
                response.put("fantasia_cli", cliente.get("nomefan_cli"));
                response.put("limcre_cli", cliente.get("limcre_cli") != null ? cliente.get("limcre_cli") : 0);
                response.put("datbloq_cli", cliente.get("datbloq_cli"));
                response.put("motbloq_cli", cliente.get("motbloq_cli"));
                response.put("datlib_cli", cliente.get("datlib_cli"));
                response.put("motlib_cli", cliente.get("motlib_cli"));
            } catch (Exception e) {
                logger.debug("analise-financeira: cliente não encontrado ou campos ausentes para {}: {}", codigoCliente, e.getMessage());
                // não interrompe — continuamos com valores padrão
            }

            // 2) Última compra (se existir)
            try {
                    String sqlUltima = "SELECT dtemissi_rec AS ultima_compra, vlrnota_rec AS valor_ultima_compra, vlrdup_rec AS VlrPar, dtpagi_rec AS DtPag, vlrpag_rec AS VlrPago, vlracre_rec AS Juros, vlrmulta_rec AS Multa, vlrsal_rec AS VlrSaldo FROM receber WHERE codigo_rec = ? AND (status_rec IS NULL OR status_rec = '') ORDER BY dtemissi_rec DESC LIMIT 1";
                    Map<String, Object> ultima = jdbcTemplate.queryForMap(sqlUltima, codigoCliente);
                    response.put("ultima_compra", ultima.get("ultima_compra"));
                    response.put("valor_ultima_compra", ultima.get("valor_ultima_compra") != null ? ultima.get("valor_ultima_compra") : 0);
                    response.put("VlrPar", ultima.get("VlrPar"));
                    response.put("DtPag", ultima.get("DtPag"));
                    response.put("VlrPago", ultima.get("VlrPago"));
                    response.put("Juros", ultima.get("Juros"));
                    response.put("Multa", ultima.get("Multa"));
                    response.put("VlrSaldo", ultima.get("VlrSaldo"));
            } catch (Exception e) {
                logger.debug("analise-financeira: sem ultima compra para {}: {}", codigoCliente, e.getMessage());
            }

            // 3) Total em aberto
            try {
                Double totalEmAberto = jdbcTemplate.queryForObject("SELECT COALESCE(SUM(vlrsal_rec),0) FROM receber WHERE codigo_rec = ? AND vlrsal_rec > 0 AND (status_rec IS NULL OR status_rec = '')", Double.class, codigoCliente);
                response.put("total_em_aberto", totalEmAberto != null ? totalEmAberto : 0);
            } catch (Exception e) {
                logger.debug("analise-financeira: erro calculando total em aberto para {}: {}", codigoCliente, e.getMessage());
                response.put("total_em_aberto", 0);
            }

            // 4) Limite disponível (limite - em aberto)
            try {
                Double limcre = 0.0;
                try {
                    limcre = jdbcTemplate.queryForObject("SELECT COALESCE(limcre_cli,0) FROM clientes WHERE codigo_cli = ?", Double.class, codigoCliente);
                } catch (Exception ex) {
                    limcre = 0.0;
                }
                Double totalEmAberto = (Double) response.getOrDefault("total_em_aberto", 0.0);
                response.put("limite_disponivel", limcre - totalEmAberto);
            } catch (Exception e) {
                response.put("limite_disponivel", 0);
            }

            // 5) Movimentos por condição (agregado)
            try {
                String sqlMov = "SELECT COALESCE(condic_rec, 'N/A') AS condicao, COUNT(*) AS quantidade, COALESCE(SUM(vlrsal_rec),0) AS total_valor FROM receber WHERE codigo_rec = ? AND (status_rec IS NULL OR status_rec = '') AND vlrsal_rec > 0 GROUP BY condic_rec";
                List<Map<String, Object>> movimentos = jdbcTemplate.queryForList(sqlMov, codigoCliente);
                response.put("movimentos", movimentos);
            } catch (Exception e) {
                logger.debug("analise-financeira: erro carregando movimentos para {}: {}", codigoCliente, e.getMessage());
                response.put("movimentos", java.util.Collections.emptyList());
            }

            // 6) Pagamentos em dia - últimos 6 (tenta computar, mas é tolerante a esquemas de dados diversos)
                try {
                String sqlPagos = "SELECT SUM(CASE WHEN dtpag_rec IS NOT NULL AND dtpag_rec <= dtvenci_rec THEN 1 ELSE 0 END) as pagos_em_dia FROM (SELECT dtpag_rec, dtvenci_rec FROM receber WHERE codigo_rec = ? AND (status_rec IS NULL OR status_rec = '') ORDER BY dtemissi_rec DESC LIMIT 6) t";
                Integer pagos = jdbcTemplate.queryForObject(sqlPagos, Integer.class, codigoCliente);
                response.put("pagamentos_em_dia_ultimos_6", pagos != null ? pagos : 0);
            } catch (Exception e) {
                logger.debug("analise-financeira: não foi possível calcular pagamentos em dia para {}: {}", codigoCliente, e.getMessage());
                response.put("pagamentos_em_dia_ultimos_6", 0);
            }

            // 7) Determinar nível/tendência básico (regra simples)
            try {
                int pagos = ((Number) response.getOrDefault("pagamentos_em_dia_ultimos_6", 0)).intValue();
                String nivel = "Bronze";
                if (pagos >= 6) nivel = "Diamante";
                else if (pagos >= 4) nivel = "Ouro";
                else if (pagos >= 2) nivel = "Prata";
                response.put("nivel", nivel);
                response.put("tendencia", "estavel");
            } catch (Exception e) {
                response.put("nivel", "Bronze");
                response.put("tendencia", "estavel");
            }

        } catch (Exception e) {
            logger.error("Erro no endpoint analise-financeira para cliente {}: {}", codigoCliente, e.getMessage(), e);
            // Em caso de erro geral, voltar com payload mínimo para evitar 500
        }

        return response;
    }

    // Criar novo cliente (POST)
    @PostMapping
    public ResponseEntity<Map<String, Object>> criarCliente(@RequestBody Map<String, Object> payload) {
        logger.info("========================================");
        logger.info("criarCliente called with payload keys: {}", payload.keySet());
        logger.info("Payload (full): {}", payload);
        logger.info("========================================");
        
        try {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            
            // Extração de campos do payload
            // Aceitar aliases comuns para o identificador (codigo, id) para compatibilidade com frontend
            Object codigoRaw = getPayloadValue(payload, "codigo_cli");
            if (codigoRaw == null) codigoRaw = getPayloadValue(payload, "codigo");
            if (codigoRaw == null) codigoRaw = getPayloadValue(payload, "id");
            String codigo_cli = codigoRaw != null ? codigoRaw.toString() : null;
            String nome_cli = getPayloadValue(payload, "nome_cli") != null ? getPayloadValue(payload, "nome_cli").toString() : null;
            String cgccpf_cli = getPayloadValue(payload, "cgccpf_cli") != null ? getPayloadValue(payload, "cgccpf_cli").toString() : null;
            // Normalizar documento: remover pontos, barras, traços antes de persistir
            cgccpf_cli = digitsOnly(cgccpf_cli);
            String tipopessoa_cli = getPayloadValue(payload, "tipopessoa_cli") != null ? getPayloadValue(payload, "tipopessoa_cli").toString() : "J";
            tipopessoa_cli = normalizeTipoPessoa(tipopessoa_cli);
            
            // Determinar cliforn_cli com base no payload ou no tipo de cadastro
            // Prioridade: valor explícito em payload (ex.: cliforn_cli='F') -> respeitar e normalizar.
            // Caso contrário, usar tipo_cadastro ('fornecedor' => 'F', padrão 'C').
            String cliforn_cli_valor = "C"; // padrão: cliente
            // Pre-declare tipo_cadastro para uso no log abaixo
            String tipo_cadastro = getPayloadValue(payload, "tipo_cadastro") != null ? getPayloadValue(payload, "tipo_cadastro").toString().toLowerCase() : "cliente";
            Object clifornRawObj = getPayloadValue(payload, "cliforn_cli");
            if (clifornRawObj != null) {
                String clifornRaw = clifornRawObj.toString().trim();
                if (clifornRaw.equalsIgnoreCase("F") || clifornRaw.equalsIgnoreCase("FORNECEDOR") || clifornRaw.equalsIgnoreCase("FOR")) {
                    cliforn_cli_valor = "F";
                } else {
                    cliforn_cli_valor = "C";
                }
            } else {
                if ("fornecedor".equals(tipo_cadastro)) {
                    cliforn_cli_valor = "F";
                }
            }
            logger.info("Tipo de cadastro: {} → cliforn_cli={}", tipo_cadastro, cliforn_cli_valor);
            
            // Processar data de cadastro: garantir formato CHAR(8) YYYYMMDD
            String datcad_cli = null;
            datcad_cli = normalizeToYYYYMMDD(getPayloadValue(payload, "datcad_cli"));
            if (datcad_cli == null) {
                java.time.LocalDate today = java.time.LocalDate.now();
                datcad_cli = today.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            }
            
            // CAMPOS ABA ENDEREÇO (15 campos)
            String logra_cli = truncateString(getPayloadValue(payload, "logra_cli"), 100);
            String numero_cli = truncateString(getPayloadValue(payload, "numero_cli"), 10);
            String bairro_cli = truncateString(getPayloadValue(payload, "bairro_cli"), 50);
            String cidade_cli = truncateString(getPayloadValue(payload, "cidade_cli"), 50);
            String uf_cli = truncateString(getPayloadValue(payload, "uf_cli"), 2);
            String cep_cli = digitsOnly(getPayloadValue(payload, "cep_cli") != null ? getPayloadValue(payload, "cep_cli").toString() : null);
            cep_cli = truncateString(cep_cli, 8);
            String latitude_cli = parseCoordinate(getPayloadValue(payload, "latitude_cli"));
            String longitude_cli = parseCoordinate(getPayloadValue(payload, "longitude_cli"));
            // Telefones: armazenar somente o número (sem prefixo) com máximo de 9 caracteres (ajuste DB)
            String fone1_cli = truncateString(getPayloadValue(payload, "fone1_cli"), 9);
            String celular_cli = truncateString(getPayloadValue(payload, "celular_cli"), 9);
            String fone2_cli = truncateString(getPayloadValue(payload, "fone2_cli"), 9);

            // Extrair prefixos (2 primeiros dígitos) e ajustar campos
            String pref1_cli = null;
            String prefcel_cli = null;
            String pref_cli = null;
            String fone_principal_cli = null; // novo campo derivado de fone2_cli

            try {
                // fone1_cli -> pref1_cli + fone1_cli (restante)
                if (fone1_cli != null) {
                    String raw = fone1_cli.replaceAll("\\D", "");
                    if (raw.length() > 2) {
                        pref1_cli = raw.substring(0, 2);
                        fone1_cli = raw.substring(2);
                    } else {
                        pref1_cli = raw;
                        fone1_cli = raw;
                    }
                    fone1_cli = truncateString(fone1_cli, 9);
                }

                // celular_cli -> prefcel_cli + celular_cli (restante)
                if (celular_cli != null) {
                    String raw = celular_cli.replaceAll("\\D", "");
                    if (raw.length() > 2) {
                        prefcel_cli = raw.substring(0, 2);
                        celular_cli = raw.substring(2);
                    } else {
                        prefcel_cli = raw;
                        celular_cli = raw;
                    }
                    celular_cli = truncateString(celular_cli, 9);
                }

                // fone2_cli -> pref_cli + fone_principal_cli (restante)
                if (fone2_cli != null) {
                    String raw = fone2_cli.replaceAll("\\D", "");
                    if (raw.length() > 2) {
                        pref_cli = raw.substring(0, 2);
                        fone_principal_cli = raw.substring(2);
                    } else {
                        pref_cli = raw;
                        fone_principal_cli = raw;
                    }
                    fone_principal_cli = truncateString(fone_principal_cli, 9);
                }
            } catch (Exception e) {
                logger.debug("Erro ao extrair prefixos telefones: {}", e.getMessage());
            }
            // Garantir que os prefixos não excedam 2 caracteres
            pref1_cli = truncateString(pref1_cli, 2);
            prefcel_cli = truncateString(prefcel_cli, 2);
            pref_cli = truncateString(pref_cli, 2);
            String regiao_cli = truncateString(getPayloadValue(payload, "regiao_cli"), 3);
            Boolean etiquetas_cli = toBoolean(getPayloadValue(payload, "etiquetas_cli"));
            String email_cli = truncateString(getPayloadValue(payload, "email_cli"), 100);
            // Campos da aba Cobrança
            String condpag_cli = truncateString(getPayloadValue(payload, "condpag_cli"), 3);
            String codbco_cli = truncateString(getPayloadValue(payload, "codbco_cli"), 3);
            String prefcob_cli = truncateString(getPayloadValue(payload, "prefcob_cli"), 3);
            String fonecob_cli = truncateString(getPayloadValue(payload, "fonecob_cli"), 9);
            String ramalcob_cli = truncateString(getPayloadValue(payload, "ramalcob_cli"), 4);
            String numctada_cli = truncateString(getPayloadValue(payload, "numctada_cli"), 14);

            // CAMPOS ABA COBRANÇA — endereço de cobrança e condições (colunas existentes na tabela clientes)
            String logra1_cli = truncateString(getPayloadValue(payload, "logra1_cli"), 100);
            String bairro1_cli = truncateString(getPayloadValue(payload, "bairro1_cli"), 50);
            String cidade1_cli = truncateString(getPayloadValue(payload, "cidade1_cli"), 50);
            String uf1_cli = truncateString(getPayloadValue(payload, "uf1_cli"), 2);
            String cep1_cli = digitsOnly(getPayloadValue(payload, "cep1_cli") != null ? getPayloadValue(payload, "cep1_cli").toString() : null);
            cep1_cli = truncateString(cep1_cli, 8);
            String datalt_cli = toISODate(getPayloadValue(payload, "datalt_cli"));
            String tipcob_cli = truncateString(getPayloadValue(payload, "tipcob_cli"), 2);
            String vcto_cli = truncateString(getPayloadValue(payload, "vcto_cli"), 2);
            String contatos_cli = truncateString(getPayloadValue(payload, "contatos_cli"), 20);
            String comissao_cli = parseDecimal(getPayloadValue(payload, "comissao_cli"));
            String comissaoavi_cli = parseDecimal(getPayloadValue(payload, "comissaoavi_cli"));
            String despesa_cli = parseDecimal(getPayloadValue(payload, "despesa_cli"));
            String trib_cli = truncateString(getPayloadValue(payload, "trib_cli"), 2);
            String cargamedia_cli = parseDecimal(getPayloadValue(payload, "cargamedia_cli"));
            Boolean issret_cli = toBoolean(getPayloadValue(payload, "issret_cli"));
            // `atualizado_cli` é um checkbox no frontend: deve ser salvo como 1 (verdadeiro) ou 0 (falso)
            Integer atualizado_cli = null;
            try {
                Object atualizadoRaw = getPayloadValue(payload, "atualizado_cli");
                Boolean atualizadoBool = toBoolean(atualizadoRaw);
                if (atualizadoBool != null) {
                    atualizado_cli = atualizadoBool ? 1 : 0;
                } else if (atualizadoRaw != null) {
                    // Caso legacy: se vier como data/texto, não tentar inferir; gravar 0 por segurança
                    atualizado_cli = 0;
                } else {
                    atualizado_cli = 0;
                }
            } catch (Exception e) {
                logger.debug("Erro ao parsear atualizado_cli: {}", e.getMessage());
                atualizado_cli = 0;
            }
            
            // Campos adicionais (TRUNCADOS para limites)
            String nomefan_cli = truncateString(getPayloadValue(payload, "nomefan_cli"), 50);
            if (nomefan_cli == null || nomefan_cli.trim().isEmpty()) {
                nomefan_cli = nome_cli;
            }
            String inscmun_cli = truncateString(getPayloadValue(payload, "inscmun_cli"), 20);
            String inscest_cli = truncateString(getPayloadValue(payload, "inscest_cli"), 20);
            
            // Campos checkbox ABA Jurídica
            Boolean naocontr_cli = toBoolean(getPayloadValue(payload, "naocontr_cli"));
            Boolean deslmarg_cli = toBoolean(getPayloadValue(payload, "deslmarg_cli"));
            Boolean contr_cli = toBoolean(getPayloadValue(payload, "contr_cli"));
            Boolean clivenda_cli = toBoolean(getPayloadValue(payload, "clivenda_cli"));
            Boolean cliusado_cli = toBoolean(getPayloadValue(payload, "cliusado_cli"));
            Boolean cliofic_cli = toBoolean(getPayloadValue(payload, "cliofic_cli"));
            Boolean clipecas_cli = toBoolean(getPayloadValue(payload, "clipecas_cli"));
            Boolean clivip_cli = toBoolean(getPayloadValue(payload, "clivip_cli"));
            Boolean clicont_cli = toBoolean(getPayloadValue(payload, "clicont_cli"));
            Boolean revenda_cli = toBoolean(getPayloadValue(payload, "revenda_cli"));
            Boolean naommi_cli = toBoolean(getPayloadValue(payload, "naommi_cli"));
            Boolean tare_cli = toBoolean(getPayloadValue(payload, "tare_cli"));
            
            // Campos Consultores/Vendedores - Mapeados para colunas reais
            String cons_pecas_cod_ven = truncateString(getPayloadValue(payload, "cons_pecas_cod_ven"), 10);
            String agepec_cli = truncateString(getPayloadValue(payload, "agepec_cli"), 2);
            String cons_servi_cod_ven = truncateString(getPayloadValue(payload, "cons_servi_cod_ven"), 10);
            String ageser_cli = truncateString(getPayloadValue(payload, "ageser_cli"), 2);
            String cons_vend_cod_ven = truncateString(getPayloadValue(payload, "cons_vend_cod_ven"), 10);
            String agemaq_cli = truncateString(getPayloadValue(payload, "agemaq_cli"), 2);
            String cons_loca_cod_ven = truncateString(getPayloadValue(payload, "cons_loca_cod_ven"), 10);
            String ageloc_cli = truncateString(getPayloadValue(payload, "ageloc_cli"), 2);
            
            // Código de Atividades
            String codativ1_cli = truncateString(getPayloadValue(payload, "codativ1_cli"), 5);
            String codativ2_cli = truncateString(getPayloadValue(payload, "codativ2_cli"), 5);
            String codativ3_cli = truncateString(getPayloadValue(payload, "codativ3_cli"), 5);
            String codativ4_cli = truncateString(getPayloadValue(payload, "codativ4_cli"), 5);
            
            // CAMPOS ABA FÍSICA (14 campos)
            String ident_cli = truncateString(getPayloadValue(payload, "ident_cli"), 20);
            String civil_cli = truncateString(getPayloadValue(payload, "civil_cli"), 15);
            String prof_cli = truncateString(getPayloadValue(payload, "prof_cli"), 20);
            String pai_cli = truncateString(getPayloadValue(payload, "pai_cli"), 50);
            String mae_cli = truncateString(getPayloadValue(payload, "mae_cli"), 50);
            String orgemis_cli = truncateString(getPayloadValue(payload, "orgemis_cli"), 6);
            String natural_cli = truncateString(getPayloadValue(payload, "natural_cli"), 20);
            String sexo_cli = truncateString(getPayloadValue(payload, "sexo_cli"), 1);
            // Coluna datanasc_cli é DATE: normalizar para YYYY-MM-DD
            String datanasc_cli = toISODate(truncateString(getPayloadValue(payload, "datanasc_cli"), 10));
            String conjuge_cli = truncateString(getPayloadValue(payload, "conjuge_cli"), 50);
            // dtnasconj_cli é decimal(8,0): manter YYYYMMDD numérico
            String dtnasconj_cli = normalizeToYYYYMMDD(truncateString(getPayloadValue(payload, "dtnasconj_cli"), 10));
            String cpfconj_cli = digitsOnly(truncateString(getPayloadValue(payload, "cpfconj_cli"), 11));
            String ideconj_cli = truncateString(getPayloadValue(payload, "ideconj_cli"), 11);
            
            Double limcre_cli = 0.0;
            try {
                limcre_cli = getPayloadValue(payload, "limcre_cli") != null ? Double.parseDouble(getPayloadValue(payload, "limcre_cli").toString()) : 0.0;
            } catch (Exception e) {
                logger.debug("Erro ao converter limcre_cli: {}", e.getMessage());
            }

            // CAMPOS ABA CRÉDITO (aliases do frontend resolvidos em getPayloadValue)
            String percdesc_cli = parseDecimal(getPayloadValue(payload, "percdesc_cli"));
            Boolean fatliq_cli = toBoolean(getPayloadValue(payload, "fatliq_cli"));
            Boolean nfeavista_cli = toBoolean(getPayloadValue(payload, "nfeavista_cli"));
            
            // Determinar se este payload é uma tentativa de UPDATE (codigo_cli fornecido e existe)
            boolean isUpdate = false;
            if (codigo_cli != null && !codigo_cli.trim().isEmpty()) {
                try {
                    String sqlCheckExist = "SELECT COUNT(*) FROM clientes WHERE codigo_cli = ? AND cliforn_cli = ?";
                    Integer existsCodigo = jdbcTemplate.queryForObject(sqlCheckExist, Integer.class, codigo_cli, cliforn_cli_valor);
                    if (existsCodigo != null && existsCodigo > 0) {
                        isUpdate = true;
                    }
                } catch (Exception e) {
                    logger.debug("Erro ao verificar existencia para validacao parcial: {}", e.getMessage());
                }
            }

            // Validação mínima: somente obrigatórias para criação (não para atualização parcial)
            if (!isUpdate) {
                if (nome_cli == null || nome_cli.trim().isEmpty()) {
                    response.put("erro", "Nome do cliente é obrigatório");
                    return ResponseEntity.badRequest().body(response);
                }
                if (cgccpf_cli == null || cgccpf_cli.trim().isEmpty()) {
                    response.put("erro", "CNPJ/CPF é obrigatório");
                    return ResponseEntity.badRequest().body(response);
                }
            }
            
            // Verifica se CNPJ/CPF já existe — somente quando o campo foi fornecido
            if (cgccpf_cli != null && !cgccpf_cli.trim().isEmpty()) {
                try {
                    Integer countExisting = null;
                    if (codigo_cli != null && !codigo_cli.trim().isEmpty()) {
                        String sqlVerificaCodigo = "SELECT COUNT(*) FROM clientes WHERE cgccpf_cli = ? AND cliforn_cli = ? AND codigo_cli != ?";
                        logger.info("Executing SELECT verify CNPJ existence (exclude same codigo): {} params=[{}, {}, {}]", sqlVerificaCodigo, cgccpf_cli, cliforn_cli_valor, codigo_cli);
                        countExisting = jdbcTemplate.queryForObject(sqlVerificaCodigo, Integer.class, cgccpf_cli, cliforn_cli_valor, codigo_cli);
                    } else {
                        String sqlVerifica = "SELECT COUNT(*) FROM clientes WHERE cgccpf_cli = ? AND cliforn_cli = ?";
                        logger.info("Executing SELECT verify CNPJ existence: {} params=[{}, {}]", sqlVerifica, cgccpf_cli, cliforn_cli_valor);
                        countExisting = jdbcTemplate.queryForObject(sqlVerifica, Integer.class, cgccpf_cli, cliforn_cli_valor);
                    }
                    logger.info("✅ SELECT EXISTS result: countExisting={}", countExisting);
                    if (countExisting != null && countExisting > 0) {
                        logger.warn("❌ CNPJ/CPF JÁ EXISTE: {}", cgccpf_cli);
                        response.put("erro", "CNPJ/CPF já cadastrado para esta filial");
                        return ResponseEntity.badRequest().body(response);
                    }
                } catch (Exception e) {
                    logger.error("❌ ERRO no SELECT EXISTS: {}", e.getMessage(), e);
                    throw e;
                }
            }
            
            // Gera código automático se não fornecido
            if (codigo_cli == null || codigo_cli.trim().isEmpty()) {
                String sqlMaxId = "SELECT COALESCE(MAX(CAST(codigo_cli AS UNSIGNED)), 0) + 1 FROM clientes WHERE cliforn_cli = ?";
                logger.info("Executing SELECT next codigo_cli: {} params=[{}]", sqlMaxId, cliforn_cli_valor);
                Long nextId = jdbcTemplate.queryForObject(sqlMaxId, Long.class, cliforn_cli_valor);
                codigo_cli = nextId != null ? nextId.toString() : "1";
            }

            // Se o codigo_cli já existe, executar UPDATE (upsert behavior)
            try {
                String sqlCheckCodigo = "SELECT COUNT(*) FROM clientes WHERE codigo_cli = ? AND cliforn_cli = ?";
                Integer existsCodigo = jdbcTemplate.queryForObject(sqlCheckCodigo, Integer.class, codigo_cli, cliforn_cli_valor);
                if (existsCodigo != null && existsCodigo > 0) {
                    logger.info("Codigo {} já existe — executando UPDATE em vez de INSERT", codigo_cli);
                    String updateSql = "UPDATE clientes SET " +
                            "nome_cli = ?, nomefan_cli = ?, cgccpf_cli = ?, tipopessoa_cli = ?, " +
                            "logra_cli = ?, numero_cli = ?, bairro_cli = ?, cidade_cli = ?, uf_cli = ?, cep_cli = ?, latitude_cli = ?, longitude_cli = ?, " +
                            "fone1_cli = ?, celular_cli = ?, email_cli = ?, regiao_cli = ?, etiquetas_cli = ?, atualizado_cli = ?, " +
                            "inscmun_cli = ?, inscest_cli = ?, limcre_cli = ?, datcad_cli = ?, " +
                            "naocontr_cli = ?, deslmarg_cli = ?, contr_cli = ?, clivenda_cli = ?, cliusado_cli = ?, cliofic_cli = ?, " +
                            "clipecas_cli = ?, clivip_cli = ?, clicont_cli = ?, revenda_cli = ?, naommi_cli = ?, tare_cli = ?, " +
                            "cons_pecas_cod_ven = ?, agepec_cli = ?, cons_servi_cod_ven = ?, ageser_cli = ?, " +
                            "cons_vend_cod_ven = ?, agemaq_cli = ?, cons_loca_cod_ven = ?, ageloc_cli = ?, " +
                            "codativ1_cli = ?, codativ2_cli = ?, codativ3_cli = ?, codativ4_cli = ?, " +
                                "ident_cli = ?, civil_cli = ?, prof_cli = ?, pai_cli = ?, mae_cli = ?, orgemis_cli = ?, natural_cli = ?, sexo_cli = ?, datanasc_cli = ?, " +
                                    "conjuge_cli = ?, dtnasconj_cli = ?, cpfconj_cli = ?, ideconj_cli = ?, condpag_cli = ?, codbco_cli = ?, prefcob_cli = ?, fonecob_cli = ?, ramalcob_cli = ?, numctada_cli = ?, " +
                                    "logra1_cli = ?, bairro1_cli = ?, cidade1_cli = ?, uf1_cli = ?, cep1_cli = ?, datalt_cli = ?, tipcob_cli = ?, vcto_cli = ?, contatos_cli = ?, " +
                                    "comissao_cli = ?, comissaoavi_cli = ?, despesa_cli = ?, trib_cli = ?, cargamedia_cli = ?, issret_cli = ?, percdesc_cli = ?, fatliq_cli = ?, nfeavista_cli = ? " +
                            "WHERE cliforn_cli = ? AND codigo_cli = ?";

                    Object[] updateParams = new Object[] {
                            nome_cli, nomefan_cli, cgccpf_cli, tipopessoa_cli,
                            logra_cli, numero_cli, bairro_cli, cidade_cli, uf_cli, cep_cli, latitude_cli, longitude_cli,
                            fone1_cli, celular_cli, email_cli, regiao_cli, etiquetas_cli, atualizado_cli,
                            inscmun_cli, inscest_cli, limcre_cli, datcad_cli,
                            naocontr_cli, deslmarg_cli, contr_cli, clivenda_cli, cliusado_cli, cliofic_cli,
                            clipecas_cli, clivip_cli, clicont_cli, revenda_cli, naommi_cli, tare_cli,
                            cons_pecas_cod_ven, agepec_cli, cons_servi_cod_ven, ageser_cli,
                            cons_vend_cod_ven, agemaq_cli, cons_loca_cod_ven, ageloc_cli,
                            codativ1_cli, codativ2_cli, codativ3_cli, codativ4_cli,
                                ident_cli, civil_cli, prof_cli, pai_cli, mae_cli, orgemis_cli, natural_cli, sexo_cli, datanasc_cli,
                                    conjuge_cli, dtnasconj_cli, cpfconj_cli, ideconj_cli, condpag_cli, codbco_cli, prefcob_cli, fonecob_cli, ramalcob_cli, numctada_cli,
                                    logra1_cli, bairro1_cli, cidade1_cli, uf1_cli, cep1_cli, datalt_cli, tipcob_cli, vcto_cli, contatos_cli,
                                    comissao_cli, comissaoavi_cli, despesa_cli, trib_cli, cargamedia_cli, issret_cli, percdesc_cli, fatliq_cli, nfeavista_cli,
                                    cliforn_cli_valor, codigo_cli
                    };

                    int rows = jdbcTemplate.update(updateSql, updateParams);
                    logger.info("[UPDATE CLIENTE] rowsAffected={}", rows);
                    // Gravar auditoria no DB
                    try {
                        insertClientesAudit(codigo_cli, "UPDATE", java.util.Arrays.toString(updateParams), rows);
                    } catch (Exception e) {
                        logger.debug("Falha ao gravar audit update: {}", e.getMessage());
                    }
                    if (rows > 0) {
                        response.put("sucesso", true);
                        response.put("mensagem", "Cliente atualizado com sucesso");
                        response.put("codigo_cli", codigo_cli);
                        return ResponseEntity.ok(response);
                    } else {
                        response.put("erro", "Falha ao atualizar cliente no banco de dados");
                        return ResponseEntity.status(500).body(response);
                    }
                }
            } catch (Exception e) {
                logger.error("Erro ao verificar/executar UPDATE por codigo_cli: {}", e.getMessage(), e);
                throw e;
            }
            
            // SQL de inserção - ajustado para prefixos telefônicos e fone_cli
                String columns = "cliforn_cli, codigo_cli, nome_cli, nomefan_cli, cgccpf_cli, tipopessoa_cli, " +
                    "logra_cli, numero_cli, bairro_cli, cidade_cli, uf_cli, cep_cli, latitude_cli, longitude_cli, " +
                    "pref1_cli, fone1_cli, prefcel_cli, celular_cli, pref_cli, fone_cli, email_cli, regiao_cli, etiquetas_cli, atualizado_cli, " +
                    "inscmun_cli, inscest_cli, limcre_cli, datcad_cli, " +
                    "naocontr_cli, deslmarg_cli, contr_cli, clivenda_cli, cliusado_cli, cliofic_cli, " +
                    "clipecas_cli, clivip_cli, clicont_cli, revenda_cli, naommi_cli, tare_cli, " +
                    "cons_pecas_cod_ven, agepec_cli, cons_servi_cod_ven, ageser_cli, " +
                    "cons_vend_cod_ven, agemaq_cli, cons_loca_cod_ven, ageloc_cli, " +
                    "codativ1_cli, codativ2_cli, codativ3_cli, codativ4_cli, " +
                    "ident_cli, civil_cli, prof_cli, pai_cli, mae_cli, orgemis_cli, natural_cli, sexo_cli, datanasc_cli, " +
                    "conjuge_cli, dtnasconj_cli, cpfconj_cli, ideconj_cli, condpag_cli, codbco_cli, prefcob_cli, fonecob_cli, ramalcob_cli, numctada_cli, " +
                    "logra1_cli, bairro1_cli, cidade1_cli, uf1_cli, cep1_cli, datalt_cli, tipcob_cli, vcto_cli, contatos_cli, " +
                    "comissao_cli, comissaoavi_cli, despesa_cli, trib_cli, cargamedia_cli, issret_cli, percdesc_cli, fatliq_cli, nfeavista_cli";

                Object[] params = new Object[] {
                    cliforn_cli_valor, codigo_cli, nome_cli, nomefan_cli, cgccpf_cli, tipopessoa_cli,
                    logra_cli, numero_cli, bairro_cli, cidade_cli, uf_cli, cep_cli, latitude_cli, longitude_cli,
                    pref1_cli, fone1_cli, prefcel_cli, celular_cli, pref_cli, fone_principal_cli, email_cli, regiao_cli, etiquetas_cli, atualizado_cli,
                    inscmun_cli, inscest_cli, limcre_cli, datcad_cli,
                    naocontr_cli, deslmarg_cli, contr_cli, clivenda_cli, cliusado_cli, cliofic_cli,
                    clipecas_cli, clivip_cli, clicont_cli, revenda_cli, naommi_cli, tare_cli,
                    cons_pecas_cod_ven, agepec_cli, cons_servi_cod_ven, ageser_cli,
                    cons_vend_cod_ven, agemaq_cli, cons_loca_cod_ven, ageloc_cli,
                    codativ1_cli, codativ2_cli, codativ3_cli, codativ4_cli,
                    ident_cli, civil_cli, prof_cli, pai_cli, mae_cli, orgemis_cli, natural_cli, sexo_cli, datanasc_cli,
                    conjuge_cli, dtnasconj_cli, cpfconj_cli, ideconj_cli, condpag_cli, codbco_cli, prefcob_cli, fonecob_cli, ramalcob_cli, numctada_cli,
                    logra1_cli, bairro1_cli, cidade1_cli, uf1_cli, cep1_cli, datalt_cli, tipcob_cli, vcto_cli, contatos_cli,
                    comissao_cli, comissaoavi_cli, despesa_cli, trib_cli, cargamedia_cli, issret_cli, percdesc_cli, fatliq_cli, nfeavista_cli
                };

                // Construir SQL dinamicamente com placeholders que batem com params.length
                String placeholders = String.join(", ", java.util.Collections.nCopies(params.length, "?"));
                String sql = "INSERT INTO clientes (" + columns + ") VALUES (" + placeholders + ")";

                // Contar placeholders na SQL
                int placeholderCount = 0;
                for (int i = 0; i < sql.length(); i++) {
                    if (sql.charAt(i) == '?') placeholderCount++;
                }
                
                logger.info("========================================");
                logger.info("[INSERT CLIENTE] SQL ANALYSIS:");
                logger.info("  Placeholders in SQL: {}", placeholderCount);
                logger.info("  Parameters array length: {}", params.length);
                logger.info("  Match: {}", (placeholderCount == params.length ? "✓ OK" : "✗ MISMATCH"));
                logger.info("========================================");

                // Se houver mismatch entre placeholders e params, reconstruir a parte VALUES
                if (placeholderCount != params.length) {
                    logger.warn("Placeholder count ({}) != params length ({}). Reconstruindo VALUES para evitar SQLException.", placeholderCount, params.length);
                    String placeholdersRebuilt = String.join(", ", java.util.Collections.nCopies(params.length, "?"));
                    int idx = sql.indexOf("VALUES");
                    if (idx > -1) {
                        sql = sql.substring(0, idx) + "VALUES (" + placeholdersRebuilt + ")";
                        placeholderCount = params.length;
                        logger.info("[INSERT CLIENTE] SQL rebuilt with {} placeholders.", placeholderCount);
                    } else {
                        logger.warn("Não foi possível localizar 'VALUES' na SQL para reconstruir placeholders.");
                    }
                }
                
                // Log detalhado dos parâmetros
                for (int i = 0; i < params.length; i++) {
                    Object val = params[i];
                    String valStr = val != null ? val.toString() : "NULL";
                    if (valStr.length() > 50) valStr = valStr.substring(0, 50) + "...";
                    logger.info("  Param[{}]: {} ({})", i, valStr, val != null ? val.getClass().getSimpleName() : "null");
                }
                
                logger.info("SQL INSERT (first 500 chars): {}", sql.length() > 500 ? sql.substring(0, 500) + "..." : sql);
                logger.info("========================================");

                int rowsAffected = 0;
                try {
                    rowsAffected = jdbcTemplate.update(sql, params);
                    logger.info("[INSERT SUCCESS] {} row(s) affected", rowsAffected);
                    // Gravar auditoria no DB
                    try {
                        insertClientesAudit(codigo_cli, "INSERT", java.util.Arrays.toString(params), rowsAffected);
                    } catch (Exception e) {
                        logger.debug("Falha ao gravar audit insert: {}", e.getMessage());
                    }
                } catch (Exception ex) {
                    logger.error("========================================");
                    logger.error("[INSERT FAILED] Exception type: {}", ex.getClass().getSimpleName());
                    logger.error("[INSERT FAILED] Message: {}", ex.getMessage());
                    logger.error("[INSERT FAILED] Placeholders: {}, Params: {}", placeholderCount, params.length);
                    logger.error("========================================");
                    throw ex;
                }
            
            if (rowsAffected > 0) {
                response.put("sucesso", true);
                response.put("mensagem", "Cliente criado com sucesso");
                response.put("codigo_cli", codigo_cli);
                logger.info("Cliente criado com sucesso: codigo_cli={}, nome_cli={}", codigo_cli, nome_cli);
                return ResponseEntity.ok(response);
            } else {
                response.put("erro", "Falha ao inserir cliente no banco de dados");
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Erro ao criar cliente: {}", e.getMessage(), e);
            java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("erro", "Erro ao criar cliente: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // Atualizar cliente por ID (aceita PUT e PATCH do frontend)
    @PutMapping("/{id:\\d+}")
    public ResponseEntity<Map<String, Object>> atualizarClientePut(@PathVariable("id") Long id,
                                                                    @RequestBody Map<String, Object> payload) {
        // Garantir que o payload contenha o codigo_cli para que a lógica de upsert faça UPDATE
        payload.put("codigo_cli", id.toString());
        ResponseEntity<Map<String, Object>> res = criarCliente(payload);
        try {
            logger.info("[SAVE CLIENT] PUT id={} status={} body={}", id, res.getStatusCodeValue(), res.getBody());
        } catch (Exception e) {
            logger.debug("Erro ao logar resultado do PUT para id={}: {}", id, e.getMessage());
        }
        return res;
    }

    @PatchMapping("/{id:\\d+}")
    public ResponseEntity<Map<String, Object>> atualizarClientePatch(@PathVariable("id") Long id,
                                                                      @RequestBody Map<String, Object> payload) {
        payload.put("codigo_cli", id.toString());
        ResponseEntity<Map<String, Object>> res = criarCliente(payload);
        try {
            logger.info("[SAVE CLIENT] PATCH id={} status={} body={}", id, res.getStatusCodeValue(), res.getBody());
        } catch (Exception e) {
            logger.debug("Erro ao logar resultado do PATCH para id={}: {}", id, e.getMessage());
        }
        return res;
    }

    // Endpoint simples de atualização — atualiza apenas nome e documento (não altera codigo)
    @PostMapping("/{id:\\d+}/simple-update")
    public ResponseEntity<Map<String, Object>> simpleUpdate(@PathVariable("id") Long id,
                                                            @RequestBody Map<String, Object> payload,
                                                            @RequestParam(defaultValue = "C") String cliforn_cli) {
        try {
            logger.info("[SIMPLE-UPDATE] called for id={} cliforn_cli={} payloadKeys={}", id, cliforn_cli, payload != null ? payload.keySet() : null);
            String nome = payload.get("nome_cli") != null ? payload.get("nome_cli").toString() : null;
            String doc = payload.get("cgccpf_cli") != null ? digitsOnly(payload.get("cgccpf_cli").toString()) : null;
            if (nome == null && doc == null) {
                Map<String, Object> err = new java.util.HashMap<>();
                err.put("erro", "Nenhum campo para atualizar");
                return ResponseEntity.badRequest().body(err);
            }
            java.util.List<Object> params = new java.util.ArrayList<>();
            StringBuilder sql = new StringBuilder("UPDATE clientes SET ");
            java.util.List<String> sets = new java.util.ArrayList<>();
            if (nome != null) { sets.add("nome_cli = ?"); params.add(nome); }
            if (doc != null) { sets.add("cgccpf_cli = ?"); params.add(doc); }
            if (sets.isEmpty()) {
                Map<String, Object> err = new java.util.HashMap<>();
                err.put("erro", "Nada para atualizar");
                return ResponseEntity.badRequest().body(err);
            }
            sql.append(String.join(", ", sets));
            sql.append(" WHERE cliforn_cli = ? AND codigo_cli = ?");
            params.add(cliforn_cli);
            params.add(id);
            int rows = jdbcTemplate.update(sql.toString(), params.toArray());
            Map<String, Object> res = new java.util.HashMap<>();
            res.put("rowsAffected", rows);
            res.put("codigo_cli", id);
            logger.info("[SIMPLE-UPDATE] result rowsAffected={} id={} cliforn_cli={}", rows, id, cliforn_cli);
            try {
                insertClientesAudit(String.valueOf(id), "SIMPLE_UPDATE", payload, rows);
            } catch (Exception e) {
                logger.debug("Falha ao gravar audit simple-update: {}", e.getMessage());
            }
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            logger.error("[SIMPLE-UPDATE] Exception for id={}", id, e);
            Map<String, Object> err = new java.util.HashMap<>();
            err.put("erro", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    // Método auxiliar para normalizar nomes de campo (converte hífen para sublinhado)
    private String normalizeFieldName(String fieldName) {
        if (fieldName == null) return null;
        return fieldName.replace("-", "_");
    }

    // Método auxiliar para obter valor do payload com normalização de nome
    private Object getPayloadValue(Map<String, Object> payload, String fieldName) {
        // Tenta com o nome original
        if (payload.containsKey(fieldName)) {
            return payload.get(fieldName);
        }
        // Tenta com hífen em vez de sublinhado
        String withHyphen = fieldName.replace("_", "-");
        if (payload.containsKey(withHyphen)) {
            return payload.get(withHyphen);
        }
        // Aliases do frontend (camelCase/hífen) para nomes de coluna reais
        String alias = resolveAlias(fieldName);
        if (alias != null) {
            if (payload.containsKey(alias)) {
                return payload.get(alias);
            }
            String aliasHyphen = alias.replace("_", "-");
            if (payload.containsKey(aliasHyphen)) {
                return payload.get(aliasHyphen);
            }
        }
        // Verifica mapas aninhados comuns (ex.: endereco, cobranca, credito)
        String[] nestedKeys = new String[] {"endereco", "endereço", "address", "cobranca", "cobrança", "credito", "billing"};
        for (String nk : nestedKeys) {
            if (payload.containsKey(nk) && payload.get(nk) instanceof Map) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> nested = (Map<String, Object>) payload.get(nk);
                    if (nested.containsKey(fieldName)) return nested.get(fieldName);
                    if (nested.containsKey(withHyphen)) return nested.get(withHyphen);
                } catch (Exception e) {
                    logger.debug("Erro ao ler campo '{}' de map aninhado '{}': {}", fieldName, nk, e.getMessage());
                }
            }
        }

        return null;
    }

    // Mapeia nomes de campos usados pelo frontend (camelCase/hífen) para colunas reais do banco
    private String resolveAlias(String columnName) {
        switch (columnName) {
        case "limcre_cli": return "limiteCredito";
        case "condpag_cli": return "condPag";
        case "percdesc_cli": return "desconto";
        case "fatliq_cli": return "faturarLiquido";
        case "nfeavista_cli": return "naNfeAvista";
        case "revenda_cli": return "clirevenda-cli";
        case "cons_pecas_cod_ven": return "vendedor-cli";
        case "cons_servi_cod_ven": return "vendedor1-cli";
        case "cons_vend_cod_ven": return "vendedor2-cli";
        case "cons_loca_cod_ven": return "vendedor3-cli";
        default: return null;
        }
    }

    // Normaliza tipopessoa para a convenção do ERP: 'J' (jurídica/CNPJ) ou 'F' (física/CPF).
    // Aceita valores legados do frontend ('c'=CNPJ, 'f'=CPF), maiúsculas/minúsculas e textos.
    private String normalizeTipoPessoa(String value) {
        if (value == null) return "J";
        String v = value.trim().toUpperCase();
        if (v.equals("J") || v.equals("CNPJ") || v.equals("PJ") || v.equals("C")) return "J";
        if (v.equals("F") || v.equals("CPF") || v.equals("PF")) return "F";
        return v.length() == 1 ? v : "J";
    }

    // Converte data (DD/MM/YYYY, YYYY-MM-DD ou YYYYMMDD) para YYYY-MM-DD (formato DATE do MariaDB)
    private String toISODate(Object value) {
        if (value == null) return null;
        String s = value.toString().trim();
        if (s.isEmpty()) return null;
        if (s.contains("/")) {
            String[] parts = s.split("/");
            if (parts.length == 3 && parts[2].length() == 4) {
                return parts[2] + "-" + parts[1] + "-" + parts[0];
            }
            return null;
        }
        String digits = s.replaceAll("\\D", "");
        if (digits.length() == 8 && s.matches("\\d{8}")) {
            return digits.substring(0, 4) + "-" + digits.substring(4, 6) + "-" + digits.substring(6, 8);
        }
        if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return s;
        }
        return null;
    }

    // Converte valor de coordenada para número com 6 casas decimais (colunas decimal(10,6))
    private String parseCoordinate(Object value) {
        if (value == null) return null;
        try {
            String s = value.toString().trim().replace(",", ".");
            if (s.isEmpty()) return null;
            double d = Double.parseDouble(s);
            return String.format("%.6f", d);
        } catch (Exception e) {
            logger.debug("parseCoordinate error for value {}: {}", value, e.getMessage());
            return null;
        }
    }

    // Converte valores monetários/percentuais para número com 2 casas decimais
    private String parseDecimal(Object value) {
        if (value == null) return null;
        try {
            String s = value.toString().trim().replace(",", ".");
            if (s.isEmpty()) return null;
            double d = Double.parseDouble(s);
            return String.format("%.2f", d);
        } catch (Exception e) {
            logger.debug("parseDecimal error for value {}: {}", value, e.getMessage());
            return null;
        }
    }

    // Método auxiliar para truncar strings com segurança
    private Boolean toBoolean(Object value) {
        if (value == null) return null;
        if (value instanceof Boolean) return (Boolean) value;
        try {
            String s = value.toString().trim().toLowerCase();
            if (s.equals("1") || s.equals("true") || s.equals("yes") || s.equals("y")) return true;
            if (s.equals("0") || s.equals("false") || s.equals("no") || s.equals("n")) return false;
        } catch (Exception e) {
            logger.debug("toBoolean parse error for value {}: {}", value, e.getMessage());
        }
        return null;
    }

    private String truncateString(Object value, int maxLength) {
        if (value == null) return null;
        String str = value.toString();
        if (str.length() <= maxLength) return str;
        logger.debug("Truncando string de {} para {} caracteres", str.length(), maxLength);
        return str.substring(0, maxLength);
    }
    
    // Método auxiliar para truncar strings com valor padrão
    private String truncateString(Object value, int maxLength, String defaultValue) {
        String result = truncateString(value, maxLength);
        return (result == null || result.trim().isEmpty()) ? defaultValue : result;
    }

    // Converte data de DD/MM/YYYY para YYYY-MM-DD
    private String convertDateFormat(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        try {
            logger.info("🔍 CONVERTENDO DATA: entrada='{}' (length={})", dateStr, dateStr.length());
            // Esperado: DD/MM/YYYY (exemplo: 22/04/2006)
            if (dateStr.contains("/")) {
                String[] parts = dateStr.split("/");
                logger.info("   Split result: {} partes", parts.length);
                if (parts.length == 3) {
                    String day = parts[0];
                    String month = parts[1];
                    String year = parts[2];
                    String result = year + "-" + month + "-" + day;
                    logger.info("   ✅ Convertido: {}/{}/{} → {}", day, month, year, result);
                    // Retorna: YYYY-MM-DD
                    return result;
                }
            }
            // Se não estiver no formato DD/MM/YYYY, retorna como está
            logger.info("   ⚠️  Não contém '/' ou não tem 3 partes. Retornando original.");
            return dateStr;
        } catch (Exception e) {
            logger.warn("   ❌ ERRO ao converter data '{}': {}", dateStr, e.getMessage());
            return dateStr;
        }
    }

    // Normaliza valores diversos para o formato CHAR(8) YYYYMMDD.
    // Aceita entradas em formatos: "YYYY-MM-DD", "DD/MM/YYYY", "YYYYMMDD" ou timestamp; retorna null se não puder normalizar.
    private String normalizeToYYYYMMDD(Object value) {
        if (value == null) return null;
        try {
            String s = value.toString().trim();
            if (s.isEmpty()) return null;
            // Se já estiver no formato sem separadores e tiver >=8 dígitos, usar os primeiros 8
            String digits = s.replaceAll("\\D", "");
            if (digits.length() >= 8) {
                // Preferir YYYYMMDD quando possível: se entrada foi YYYY-MM-DD ou YYYYMMDD
                if ((s.contains("-") && s.length() >= 10) || (!s.contains("/") && s.length() >= 8 && s.charAt(4) == '0')) {
                    return digits.substring(0, 8);
                }
                // Se for DDMMYYYY (vindo de DD/MM/YYYY), converter para YYYYMMDD
                if (s.contains("/") && digits.length() == 8) {
                    String d = digits.substring(0,2);
                    String m = digits.substring(2,4);
                    String y = digits.substring(4,8);
                    return y + m + d;
                }
                return digits.substring(0, 8);
            }
            return null;
        } catch (Exception e) {
            logger.debug("normalizeToYYYYMMDD error for value {}: {}", value, e.getMessage());
            return null;
        }
    }

    // Remove qualquer caractere não numérico de um documento (CPF/CNPJ)
    private String digitsOnly(String value) {
        if (value == null) return null;
        try {
            String s = value.toString();
            String digits = s.replaceAll("\\D", "");
            return digits.isEmpty() ? null : digits;
        } catch (Exception e) {
            logger.debug("digitsOnly error for value {}: {}", value, e.getMessage());
            return value;
        }
    }

    // Retorna o documento formatado (máscara) para exibição: CPF (xxx.xxx.xxx-xx) ou CNPJ (xx.xxx.xxx/xxxx-xx)
    private String maskCpfCnpj(Object value, Object tipoPessoa) {
        if (value == null) return null;
        try {
            String digits = digitsOnly(value.toString());
            if (digits == null) return null;
            
            String tipo = tipoPessoa != null ? tipoPessoa.toString().toUpperCase() : "";
            
            // Se tipo for F ou se tiver 11 dígitos e tipo for omitido
            if ("F".equals(tipo) || (tipo.isEmpty() && digits.length() == 11)) {
                if (digits.length() >= 11) {
                    return String.format("%s.%s.%s-%s", digits.substring(0,3), digits.substring(3,6), digits.substring(6,9), digits.substring(9,11));
                }
                return digits; // CPF incompleto
            } 
            // Se tipo for J ou se tiver 14 dígitos e tipo for omitido
            else if ("J".equals(tipo) || (tipo.isEmpty() && digits.length() == 14)) {
                if (digits.length() >= 14) {
                    return String.format("%s.%s.%s/%s-%s", digits.substring(0,2), digits.substring(2,5), digits.substring(5,8), digits.substring(8,12), digits.substring(12,14));
                }
                return digits; // CNPJ incompleto
            } else {
                // Fallback por tamanho se o tipo não for F nem J
                if (digits.length() == 11) {
                    return String.format("%s.%s.%s-%s", digits.substring(0,3), digits.substring(3,6), digits.substring(6,9), digits.substring(9,11));
                } else if (digits.length() == 14) {
                    return String.format("%s.%s.%s/%s-%s", digits.substring(0,2), digits.substring(2,5), digits.substring(5,8), digits.substring(8,12), digits.substring(12,14));
                }
                return digits;
            }
        } catch (Exception e) {
            logger.debug("maskCpfCnpj error for value {}: {}", value, e.getMessage());
            return value.toString();
        }
    }

    // Insere registro de auditoria na tabela clientes_audit
    private void insertClientesAudit(String codigo_cli, String operacao, Object detalhesObj, int rowsAffected) {
        try {
            String detalhes;
            try {
                detalhes = new ObjectMapper().writeValueAsString(detalhesObj);
            } catch (Exception ex) {
                detalhes = String.valueOf(detalhesObj);
            }
            String sql = "INSERT INTO clientes_audit (codigo_cli, operacao, detalhes, rows_affected, executed_at) VALUES (?, ?, ?, ?, NOW())";
            jdbcTemplate.update(sql, codigo_cli, operacao, detalhes, rowsAffected);
        } catch (Exception e) {
            logger.warn("Falha ao gravar clientes_audit: {}", e.getMessage());
        }
    }

    // ⭐ DIAGNÓSTICO: Retorna estrutura da tabela clientes para análise de tipos
    @GetMapping("/schema")
    public ResponseEntity<Map<String, Object>> obterSchemaTabela() {
        try {
            logger.info("ℹ️  SCHEMA REQUEST: Consultando estrutura da tabela clientes...");
            
            String sql = "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='clientes' AND TABLE_SCHEMA='erp' ORDER BY ORDINAL_POSITION";
            
            List<Map<String, Object>> colunas = jdbcTemplate.queryForList(sql);
            
            logger.info("✅ Schema consultado com sucesso: {} colunas encontradas", colunas.size());
            
            Map<String, Object> resultado = new java.util.LinkedHashMap<>();
            resultado.put("total_colunas", colunas.size());
            resultado.put("colunas", colunas);
            resultado.put("timestamp", new java.util.Date());
            
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            logger.error("❌ ERRO ao consultar schema: {}", e.getMessage(), e);
            Map<String, Object> erro = new java.util.LinkedHashMap<>();
            erro.put("erro", e.getMessage());
            erro.put("tipo", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(erro);
        }
    }

    // ⭐ LOOKUP endpoint for orçamento/pedido customer search
    @GetMapping("/lookup")
    public ResponseEntity<Map<String, Object>> lookup(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        try {
            StringBuilder whereClause = new StringBuilder("WHERE cliforn_cli = 'C'");
            List<Object> params = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                whereClause.append(" AND (");
                whereClause.append(" CAST(codigo_cli AS VARCHAR) LIKE ?");
                whereClause.append(" OR nome_cli LIKE ?");
                whereClause.append(" OR cgccpf_cli LIKE ?");
                whereClause.append(")");
                params.add("%" + search + "%");
                params.add("%" + search + "%");
                params.add("%" + search + "%");
            }

            String countSql = "SELECT COUNT(*) FROM clientes " + whereClause;
            int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

            String sql = """
                SELECT 
                    codigo_cli as codigo,
                    cliforn_cli as tipo,
                    nome_cli as nome,
                    cgccpf_cli as cgccpf,
                    inscest_cli as inscest,
                    logra_cli as endereco,
                    numero_cli as numero,
                    bairro_cli as bairro,
                    cidade_cli as cidade,
                    uf_cli as uf,
                    cep_cli as cep,
                    pref1_cli as prefone,
                    fone1_cli as fone,
                    contat1_cli as contato,
                    email_cli as email,
                    condpag_cli as codpag,
                    vend_cli as vend
                FROM clientes
                """ + whereClause + """
                ORDER BY nome_cli
                LIMIT ? OFFSET ?
                """;

            List<Object> queryParams = new ArrayList<>(params);
            queryParams.add(size);
            queryParams.add(page * size);

            List<Map<String, Object>> registros = jdbcTemplate.queryForList(sql, queryParams.toArray());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", registros);
            response.put("pagination", Map.of(
                "total", total,
                "page", page,
                "size", size,
                "totalPages", (int) Math.ceil((double) total / size)
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Erro ao buscar clientes: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar clientes"
            ));
        }
    }
}

