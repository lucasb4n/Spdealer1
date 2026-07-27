package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import br.com.spdealer.util.DataDuplicadaUtil;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import jakarta.servlet.http.HttpSession;
import br.com.spdealer.util.SessionHelper;

/**
 * Controller para manutenção de Contas a Pagar
 * Utiliza a função genérica para campos de data duplicados
 */
@RestController
@RequestMapping("/api/pagar")
public class ContasPagarController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Listar todos os documentos a pagar (sempre usando campos principais com "i")
     */
    @GetMapping
        public ResponseEntity<List<Map<String, Object>>> listarDocumentos(
            @RequestParam(required = false) Integer codigoFornecedor,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dt,
            @RequestParam(required = false) Boolean somenteEmAberto,
            @RequestParam(required = false) String tipoData,
            @RequestParam(required = false) String dtInicio,
            @RequestParam(required = false) String dtFim) {
        try {
            StringBuilder sql = new StringBuilder("""
                SELECT 
                    p.pagar_id,
                    p.filial_pag,
                    p.codigo_pag,
                    p.numdup_pag,
                    p.parcela_pag,
                    p.tipodoc_pag,
                    p.tpcob_pag,
                    CASE WHEN p.tipopessoa_pag = 'F' THEN 
                        CONCAT(SUBSTRING(LPAD(p.cgccpf_pag,11,'0'),1,3),'.',SUBSTRING(LPAD(p.cgccpf_pag,11,'0'),4,3),'.',SUBSTRING(LPAD(p.cgccpf_pag,11,'0'),7,3),'-',SUBSTRING(LPAD(p.cgccpf_pag,11,'0'),10,2))
                    WHEN p.tipopessoa_pag = 'J' THEN
                        CONCAT(SUBSTRING(LPAD(p.cgccpf_pag,14,'0'),1,2),'.',SUBSTRING(LPAD(p.cgccpf_pag,14,'0'),3,3),'.',SUBSTRING(LPAD(p.cgccpf_pag,14,'0'),6,3),'/',SUBSTRING(LPAD(p.cgccpf_pag,14,'0'),9,4),'-',SUBSTRING(LPAD(p.cgccpf_pag,14,'0'),13,2))
                    ELSE p.cgccpf_pag END AS cgccpf_pag,
                    p.dtmovi_pag,      -- Campo principal
                    p.dtemissi_pag,    -- Campo principal
                    p.dtvenci_pag,     -- Campo principal
                    p.dtpagi_pag,      -- Campo principal
                    p.banco_pag,
                    p.vlrdup_pag,
                    p.vlrdesc_pag,
                    p.vlracre_pag,
                    p.vlrpag_pag,
                    p.vlrsal_pag,
                    p.vlrir_pag,
                    p.vlriss_pag,
                    p.vlrpis_pag,
                    p.vlrcofins_pag,
                    p.vlrcsll_pag,
                    p.vlritbis_pag,
                    p.vlrdev_pag,      -- Valor devolvido
                    p.observa_pag AS obs_pag,
                    p.observabai_pag AS condic_pag,
                    p.status_pag,
                    p.dpto_pag,
                    p.notaent_pag,
                    f.nome_cli AS fornecedor_nome
                FROM pagar p
                LEFT JOIN clientes f ON f.cliforn_cli = 'F' AND f.codigo_cli = p.codigo_pag
                WHERE (p.status_pag IS NULL OR p.status_pag = '')
                """);

            if (codigoFornecedor != null) {
                sql.append(" AND codigo_pag = ").append(codigoFornecedor);
            }

            // Parâmetros de data personalizados
            // tipoData: emissao | movimento | vencimento | pagamento (ou em portugues)
            // dtInicio / dtFim: intervalo (YYYY-MM-DD)
            // Mantemos compatibilidade com o parâmetro legado `dt` (single-date)
            
            // mapear coluna de data com base em tipoData
            String dateColumn = "p.dtvenci_pag"; // padrão
            if (tipoData != null && !tipoData.trim().isEmpty()) {
                String td = tipoData.trim().toLowerCase();
                if (td.contains("emiss") || td.equals("emissao")) {
                    dateColumn = "p.dtemissi_pag";
                } else if (td.contains("mov") || td.equals("movimento")) {
                    dateColumn = "p.dtmovi_pag";
                } else if (td.contains("pag") || td.equals("pagamento")) {
                    dateColumn = "p.dtpagi_pag";
                } else {
                    // default para vencimento
                    dateColumn = "p.dtvenci_pag";
                }
            }

            // aplicar intervalo de datas quando informado
            if (dtInicio != null && !dtInicio.trim().isEmpty() && dtFim != null && !dtFim.trim().isEmpty()) {
                sql.append(" AND (").append(dateColumn).append(" BETWEEN '").append(dtInicio).append("' AND '").append(dtFim).append("')");
            } else if (dt != null && !dt.trim().isEmpty()) {
                // comportamento legado: para vencimento preferir dtfluxo quando presente
                if (dateColumn.equals("p.dtvenci_pag")) {
                    sql.append(" AND ((p.dtfluxo_pag = '").append(dt).append("' AND p.dtfluxo_pag IS NOT NULL) OR (p.dtfluxo_pag IS NULL AND p.dtvenci_pag = '").append(dt).append("'))");
                } else {
                    sql.append(" AND ").append(dateColumn).append(" = '").append(dt).append("'");
                }
            }

            // Mapear e aplicar filtro de status/periodo enviado pelo formulário
            // O campo `status` pode ser: Todos, Vencidos, A Vencer, Pagos, ou um código direto.
            if (status != null && !status.trim().isEmpty()) {
                String st = status.trim().toLowerCase();
                switch (st) {
                    case "todos":
                        // não filtrar por status;
                        break;
                    case "vencidos":
                    case "vencido":
                        // somente com saldo pendente e vencidos
                        sql.append(" AND vlrsal_pag > 0 AND p.dtvenci_pag < CURDATE()");
                        break;
                    case "a vencer":
                    case "avencer":
                    case "a_vencer":
                        // a vencer: saldo pendente e vencimento a partir de hoje
                        sql.append(" AND vlrsal_pag > 0 AND p.dtvenci_pag >= CURDATE()");
                        break;
                    case "pagos":
                    case "pago":
                        // pagos: saldo zerado
                        sql.append(" AND vlrsal_pag = 0");
                        break;
                    default:
                        // interpretar como código de status já existente no banco
                        sql.append(" AND status_pag = '").append(status).append("'");
                        break;
                }
            } else {
                // se nenhum status informado, não aplicamos filtro de saldo por padrão
            }

            sql.append(" ORDER BY dtvenci_pag DESC"); // Campo principal

            // Debug: log SQL quando filtrado por fornecedor para investigar inconsistencias
            System.out.println("[ContasPagarController] SQL final: " + sql.toString());

            List<Map<String, Object>> documentos = jdbcTemplate.queryForList(sql.toString());
            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            System.err.println("Erro ao listar documentos a pagar: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Buscar documento por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable Integer id) {
        try {
            String sql = """
                SELECT 
                    pagar_id,
                    filial_pag,
                    codigo_pag,
                    numdup_pag,
                    parcela_pag,
                    tipodoc_pag,
                    tpcob_pag,
                    cgccpf_pag,
                    dtmovi_pag,      -- Campo principal
                    dtemissi_pag,    -- Campo principal
                    dtvenci_pag,     -- Campo principal
                    dtpagi_pag,      -- Campo principal
                    banco_pag,
                    vlrdup_pag,
                    vlrdesc_pag,
                    vlracre_pag,
                    vlrpag_pag,
                    vlrsal_pag,
                    vlrir_pag,
                    vlriss_pag,
                    vlrpis_pag,
                    vlrcofins_pag,
                    vlrcsll_pag,
                    vlritbis_pag,
                    vlrdev_pag,        -- Valor devolvido
                    observa_pag AS obs_pag,
                    observabai_pag AS condic_pag,
                    status_pag,
                    dpto_pag
                FROM pagar 
                WHERE pagar_id = ?
                """;

            List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sql, id);
            
            if (resultado.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(resultado.get(0));

        } catch (Exception e) {
            System.err.println("Erro ao buscar documento: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Criar novo documento usando função genérica para datas duplicadas
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> criarDocumento(@RequestBody Map<String, Object> dados) {
        try {
            // Validações básicas
            if (!dados.containsKey("codigo_pag") || dados.get("codigo_pag") == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Código do fornecedor é obrigatório"));
            }

            if (!dados.containsKey("numdup_pag") || dados.get("numdup_pag") == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Número do documento é obrigatório"));
            }

            // Preparar dados com valores padrão
            Map<String, Object> dadosCompletos = new HashMap<>(dados);
            dadosCompletos.putIfAbsent("filial_pag", "001");
            dadosCompletos.putIfAbsent("parcela_pag", "001");
            dadosCompletos.putIfAbsent("status_pag", "A");
            dadosCompletos.putIfAbsent("vlrpag_pag", 0);
            dadosCompletos.putIfAbsent("vlrdesc_pag", 0);
            dadosCompletos.putIfAbsent("vlracre_pag", 0);

            // Calcular saldo automaticamente
            double valorTotal = ((Number) dadosCompletos.getOrDefault("vlrdup_pag", 0)).doubleValue();
            double valorPago = ((Number) dadosCompletos.getOrDefault("vlrpag_pag", 0)).doubleValue();
            double desconto = ((Number) dadosCompletos.getOrDefault("vlrdesc_pag", 0)).doubleValue();
            double acrescimo = ((Number) dadosCompletos.getOrDefault("vlracre_pag", 0)).doubleValue();
            
            double saldo = Math.max(0, valorTotal + acrescimo - valorPago - desconto);
            dadosCompletos.put("vlrsal_pag", saldo);

            // Usar função genérica para inserir com datas duplicadas
            Object[] sqlResult = DataDuplicadaUtil.gerarInsertComDatasDuplicadas("pagar", dadosCompletos, jdbcTemplate);
            
            int rowsAffected = jdbcTemplate.update((String) sqlResult[0], (Object[]) sqlResult[1]);

            if (rowsAffected > 0) {
                Map<String, Object> response = new HashMap<>();
                response.put("sucesso", true);
                response.put("mensagem", "Documento criado com sucesso");
                response.put("dados", dadosCompletos);
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(500).body(Map.of("erro", "Erro ao inserir documento"));
            }

        } catch (Exception e) {
            System.err.println("Erro ao criar documento: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("erro", "Erro interno ao criar documento");
            errorResponse.put("mensagem", e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Atualizar documento usando função genérica para datas duplicadas
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> atualizarDocumento(
            @PathVariable Integer id, 
            @RequestBody Map<String, Object> dados) {
        try {
            // Recalcular saldo se valores foram alterados
            if (dados.containsKey("vlrdup_pag") || dados.containsKey("vlrpag_pag") || 
                dados.containsKey("vlrdesc_pag") || dados.containsKey("vlracre_pag")) {
                
                double valorTotal = ((Number) dados.getOrDefault("vlrdup_pag", 0)).doubleValue();
                double valorPago = ((Number) dados.getOrDefault("vlrpag_pag", 0)).doubleValue();
                double desconto = ((Number) dados.getOrDefault("vlrdesc_pag", 0)).doubleValue();
                double acrescimo = ((Number) dados.getOrDefault("vlracre_pag", 0)).doubleValue();
                
                double saldo = Math.max(0, valorTotal + acrescimo - valorPago - desconto);
                dados.put("vlrsal_pag", saldo);
            }

            // Usar função genérica para atualizar com datas duplicadas
            Object[] sqlResult = DataDuplicadaUtil.gerarUpdateComDatasDuplicadas(
                "pagar", 
                dados, 
                "pagar_id = " + id,
                jdbcTemplate
            );

            int rowsAffected = jdbcTemplate.update((String) sqlResult[0], (Object[]) sqlResult[1]);

            if (rowsAffected > 0) {
                Map<String, Object> response = new HashMap<>();
                response.put("sucesso", true);
                response.put("mensagem", "Documento atualizado com sucesso");
                response.put("registros_afetados", rowsAffected);
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            System.err.println("Erro ao atualizar documento: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("erro", "Erro interno ao atualizar documento");
            errorResponse.put("mensagem", e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Excluir documento
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> excluirDocumento(@PathVariable Integer id) {
        try {
            String sql = "DELETE FROM pagar WHERE pagar_id = ?";
            int rowsAffected = jdbcTemplate.update(sql, id);

            Map<String, Object> response = new HashMap<>();
            if (rowsAffected > 0) {
                response.put("sucesso", true);
                response.put("mensagem", "Documento excluído com sucesso");
                return ResponseEntity.ok(response);
            } else {
                response.put("erro", "Documento não encontrado");
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            System.err.println("Erro ao excluir documento: " + e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("erro", "Erro interno ao excluir documento");
            errorResponse.put("mensagem", e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Listar documentos em aberto (para seleção no caixa)
     */
    @GetMapping("/abertos")
    public ResponseEntity<List<Map<String, Object>>> listarDocumentosAbertos(
            @RequestParam(required = false) Integer codigoFornecedor) {
        try {
            StringBuilder sql = new StringBuilder("""
                SELECT 
                    pagar_id,
                    codigo_pag,
                    numdup_pag,
                    parcela_pag,
                    vlrdup_pag,
                    vlrsal_pag,
                    dtvenci_pag,    -- Campo principal
                    status_pag
                FROM pagar 
                WHERE vlrsal_pag > 0 
                  AND status_pag = 'A'
                """);

            if (codigoFornecedor != null) {
                sql.append(" AND codigo_pag = ").append(codigoFornecedor);
            }

            sql.append(" ORDER BY dtvenci_pag"); // Campo principal

            List<Map<String, Object>> documentos = jdbcTemplate.queryForList(sql.toString());
            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            System.err.println("Erro ao listar documentos abertos: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * PATCH /api/pagar/{id}/departamento
     * Atualiza o departamento (dpto_pag) de um documento em contas a pagar
     * Usado por: PagarListPage.tsx para edição inline de coluna
     */
    @PatchMapping("/{id}/departamento")
    public ResponseEntity<Map<String, Object>> atualizarDepartamento(
            @PathVariable Integer id,
            @RequestBody Map<String, String> dados,
            HttpSession session) {
        try {
            String novoDpto = dados.get("dpto_pag");
            
            // Validação: departamento é obrigatório
            if (novoDpto == null || novoDpto.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "sucesso", false,
                    "erro", "Departamento é obrigatório"
                ));
            }

            System.out.println("=== ATUALIZAR DEPARTAMENTO PAGAR ===");
            System.out.println("ID: " + id);
            System.out.println("Novo Departamento: " + novoDpto);

            // Recuperar filial da sessão (OBRIGATÓRIO)
            Integer idFil;
            try {
                idFil = SessionHelper.getIdFilFromSession(session);
            } catch (IllegalStateException ex) {
                System.err.println("Filial nao encontrada na sessao: " + ex.getMessage());
                return ResponseEntity.status(401).body(Map.of(
                    "sucesso", false,
                    "erro", "Filial nao encontrada na sessao"
                ));
            }

            // Atualizar dpto_pag e filial_dep para garantir rastreabilidade por filial
            String sql = "UPDATE pagar SET dpto_pag = ?, filial_dep = ? WHERE pagar_id = ?";
            int rowsAffected = jdbcTemplate.update(sql, novoDpto, idFil, id);

            if (rowsAffected > 0) {
                System.out.println("✅ Departamento atualizado com sucesso");
                Map<String, Object> response = new HashMap<>();
                response.put("sucesso", true);
                response.put("mensagem", "Departamento atualizado com sucesso");
                response.put("dpto_pag", novoDpto);
                return ResponseEntity.ok(response);
            } else {
                System.out.println("❌ Nenhuma linha atualizada - ID não encontrado");
                return ResponseEntity.status(404).body(Map.of(
                    "sucesso", false,
                    "erro", "Documento não encontrado"
                ));
            }

        } catch (Exception e) {
            System.err.println("❌ Erro ao atualizar departamento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "sucesso", false,
                "erro", "Erro ao atualizar: " + e.getMessage()
            ));
        }
    }

    /**
     * Atualizar data de fluxo de caixa (dtfluxo_pag) para um documento
     * Endpoint: PATCH /api/pagar/{id}/dtfluxo
     */
    @PatchMapping("/{id}/dtfluxo")
    public ResponseEntity<Map<String, Object>> atualizarDataFluxo(
            @PathVariable Integer id,
            @RequestBody Map<String, String> dados) {
        try {
            // Validar entrada
            if (!dados.containsKey("dtfluxo_pag")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "sucesso", false,
                    "erro", "Campo 'dtfluxo_pag' é obrigatório"
                ));
            }

            String novaDataFluxo = dados.get("dtfluxo_pag");
            
            // A data pode ser null (remover fluxo alternativo) ou uma data válida (YYYY-MM-DD)
            System.out.println("=== ATUALIZAR DATA FLUXO ===");
            System.out.println("ID: " + id);
            System.out.println("Nova Data Fluxo: " + novaDataFluxo);

            // Atualizar na tabela pagar
            String sql = "UPDATE pagar SET dtfluxo_pag = ? WHERE pagar_id = ?";
            int rowsAffected;
            
            if (novaDataFluxo == null || novaDataFluxo.isEmpty()) {
                // Remover data fluxo (SET NULL)
                rowsAffected = jdbcTemplate.update("UPDATE pagar SET dtfluxo_pag = NULL WHERE pagar_id = ?", id);
            } else {
                // Atualizar com nova data (YYYY-MM-DD format)
                rowsAffected = jdbcTemplate.update(sql, novaDataFluxo, id);
            }

            if (rowsAffected > 0) {
                System.out.println("✅ Data de fluxo atualizada com sucesso");
                Map<String, Object> response = new HashMap<>();
                response.put("sucesso", true);
                response.put("mensagem", "Data de fluxo atualizada com sucesso");
                response.put("pagar_id", id);
                response.put("dtfluxo_pag", novaDataFluxo);
                return ResponseEntity.ok(response);
            } else {
                System.out.println("❌ Nenhuma linha atualizada - ID não encontrado");
                return ResponseEntity.status(404).body(Map.of(
                    "sucesso", false,
                    "erro", "Documento não encontrado"
                ));
            }

        } catch (Exception e) {
            System.err.println("❌ Erro ao atualizar data de fluxo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "sucesso", false,
                "erro", "Erro ao atualizar: " + e.getMessage()
            ));
        }
    }

    /**
     * PATCH /api/pagar/{id}/autorizacao
     * Atualiza o campo ap_pag (autorizacao) do documento
     * Aceita payload { "ap_pag": "S" } ou { "ap_pag": "N" }
     */
    @PatchMapping("/{id}/autorizacao")
    public ResponseEntity<Map<String, Object>> atualizarAutorizacao(
            @PathVariable Integer id,
            @RequestBody Map<String, String> dados) {
        try {
            if (!dados.containsKey("ap_pag")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "sucesso", false,
                    "erro", "Campo 'ap_pag' é obrigatório"
                ));
            }

            String ap = dados.get("ap_pag");
            if (ap == null) ap = "";

            // Normalizar: aceitar 'Sim'/'Não' ou 'S'/'N'
            String val;
            if ("Sim".equalsIgnoreCase(ap) || "S".equalsIgnoreCase(ap)) {
                val = "S";
            } else {
                val = "N";
            }

            String sql = "UPDATE pagar SET ap_pag = ? WHERE pagar_id = ?";
            int rowsAffected = jdbcTemplate.update(sql, val, id);

            if (rowsAffected > 0) {
                Map<String, Object> response = new HashMap<>();
                response.put("sucesso", true);
                response.put("mensagem", "Autorizacao atualizada com sucesso");
                response.put("ap_pag", val);
                response.put("pagar_id", id);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(404).body(Map.of(
                    "sucesso", false,
                    "erro", "Documento nao encontrado"
                ));
            }

        } catch (Exception e) {
            System.err.println("❌ Erro ao atualizar autorizacao: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "sucesso", false,
                "erro", "Erro ao atualizar: " + e.getMessage()
            ));
        }
    }
}
