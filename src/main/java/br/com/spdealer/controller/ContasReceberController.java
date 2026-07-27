package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import br.com.spdealer.util.DataDuplicadaUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Controller para manutenção de Contas a Receber
 * Utiliza a função genérica para campos de data duplicados
 */
@RestController
@RequestMapping("/api/receber")
public class ContasReceberController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Listar todos os documentos a receber (sempre usando campos principais com "i")
     */
    @GetMapping
        public ResponseEntity<List<Map<String, Object>>> listarDocumentos(
            @RequestParam(required = false) Integer codigoCliente,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dt,
            @RequestParam(required = false) Boolean somenteEmAberto,
            @RequestParam(required = false) String tipoData,
            @RequestParam(required = false) String dtInicio,
            @RequestParam(required = false) String dtFim) {
        try {
            StringBuilder sql = new StringBuilder("""
                SELECT 
                    r.receber_id,
                    r.filial_rec,
                    r.codigo_rec,
                    r.numdup_rec,
                    r.parcela_rec,
                    r.tipodoc_rec,
                    r.tpcob_rec,
                    r.cgccpf_rec,
                    r.dtmovi_rec,      -- Campo principal
                    r.dtemissi_rec,    -- Campo principal
                    r.dtvenci_rec,     -- Campo principal
                    r.dtpagi_rec,      -- Campo principal
                    r.banco_rec,
                    r.nossonumero_rec,
                    r.vlrdup_rec,
                    r.vlrdesc_rec,
                    r.vlracre_rec,
                    r.vlrpag_rec,
                    r.vlrsal_rec,
                    r.vlrir_rec,
                    r.vlriss_rec,
                    r.vlrpis_rec,
                    r.vlrcofins_rec,
                    r.vlrcsll_rec,
                    r.vlrinss_rec,
                    r.vlrdescob_rec,
                    r.vlrdev_rec,
                    r.obs_rec,
                    r.condic_rec,
                    r.status_rec,
                    r.dpto_rec,
                    c.nome_cli AS cliente_nome
                FROM receber r
                LEFT JOIN clientes c ON c.codigo_cli = r.codigo_rec AND c.cliforn_cli = 'C'
                WHERE 1=1
                """);

            if (codigoCliente != null) {
                sql.append(" AND r.codigo_rec = ").append(codigoCliente);
            }

            // mapear coluna de data com base em tipoData
            String dateColumn = "r.dtvenci_rec"; // padrão
            if (tipoData != null && !tipoData.trim().isEmpty()) {
                String td = tipoData.trim().toLowerCase();
                if (td.contains("emiss") || td.equals("emissao")) {
                    dateColumn = "r.dtemissi_rec";
                } else if (td.contains("mov") || td.equals("movimento")) {
                    dateColumn = "r.dtmovi_rec";
                } else if (td.contains("pag") || td.equals("pagamento")) {
                    dateColumn = "r.dtpagi_rec";
                } else {
                    dateColumn = "r.dtvenci_rec";
                }
            }

            // aplicar intervalo de datas quando informado
            if (dtInicio != null && !dtInicio.trim().isEmpty() && dtFim != null && !dtFim.trim().isEmpty()) {
                sql.append(" AND (").append(dateColumn).append(" BETWEEN '").append(dtInicio).append("' AND '").append(dtFim).append("')");
            } else if (dt != null && !dt.trim().isEmpty()) {
                if (dateColumn.equals("r.dtvenci_rec")) {
                    sql.append(" AND ((r.dtfluxo_rec = '").append(dt).append("' AND r.dtfluxo_rec IS NOT NULL) OR (r.dtfluxo_rec IS NULL AND r.dtvenci_rec = '").append(dt).append("'))");
                } else {
                    sql.append(" AND ").append(dateColumn).append(" = '").append(dt).append("'");
                }
            }

            // Nunca listar registros excluídos/cancelados (status_rec = 'E' ou 'C')
            sql.append(" AND (r.status_rec IS NULL OR r.status_rec = '')");

            // Mapear status do formulário: Todos, Vencidos, A Vencer, Pagos
            if (status != null && !status.trim().isEmpty()) {
                String st = status.trim().toLowerCase();
                switch (st) {
                    case "todos":
                        break;
                    case "vencidos":
                    case "vencido":
                        sql.append(" AND r.vlrsal_rec > 0 AND r.dtvenci_rec < CURDATE()");
                        break;
                    case "a vencer":
                    case "avencer":
                    case "a_vencer":
                        sql.append(" AND r.vlrsal_rec > 0 AND r.dtvenci_rec >= CURDATE()");
                        break;
                    case "pagos":
                    case "pago":
                        sql.append(" AND r.vlrsal_rec = 0");
                        break;
                    default:
                        sql.append(" AND r.status_rec = '").append(status).append("'");
                        break;
                }
            }

            sql.append(" ORDER BY r.dtvenci_rec DESC"); // Campo principal

            List<Map<String, Object>> documentos = jdbcTemplate.queryForList(sql.toString());
            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            System.err.println("Erro ao listar documentos a receber: " + e.getMessage());
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
                    receber_id,
                    filial_rec,
                    codigo_rec,
                    numdup_rec,
                    parcela_rec,
                    tipodoc_rec,
                    tpcob_rec,
                    cgccpf_rec,
                    dtmovi_rec,      -- Campo principal
                    dtemissi_rec,    -- Campo principal
                    dtvenci_rec,     -- Campo principal
                    dtpagi_rec,      -- Campo principal
                    banco_rec,
                    nossonumero_rec,
                    vlrdup_rec,
                    vlrdesc_rec,
                    vlracre_rec,
                    vlrpag_rec,
                    vlrsal_rec,
                    vlrir_rec,
                    vlriss_rec,
                    vlrpis_rec,
                    vlrcofins_rec,
                    vlrcsll_rec,
                    vlrinss_rec,
                    vlrdescob_rec,
                    vlrdev_rec,
                    obs_rec,
                    condic_rec,
                    status_rec
                FROM receber 
                WHERE receber_id = ?
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
            if (!dados.containsKey("codigo_rec") || dados.get("codigo_rec") == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Código do cliente é obrigatório"));
            }

            if (!dados.containsKey("numdup_rec") || dados.get("numdup_rec") == null) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Número do documento é obrigatório"));
            }

            // Preparar dados com valores padrão
            Map<String, Object> dadosCompletos = new HashMap<>(dados);
            dadosCompletos.putIfAbsent("filial_rec", "001");
            dadosCompletos.putIfAbsent("parcela_rec", "001");
            dadosCompletos.putIfAbsent("status_rec", "A");
            dadosCompletos.putIfAbsent("vlrpag_rec", 0);
            dadosCompletos.putIfAbsent("vlrdesc_rec", 0);
            dadosCompletos.putIfAbsent("vlracre_rec", 0);

            // Calcular saldo automaticamente
            double valorTotal = ((Number) dadosCompletos.getOrDefault("vlrdup_rec", 0)).doubleValue();
            double valorPago = ((Number) dadosCompletos.getOrDefault("vlrpag_rec", 0)).doubleValue();
            double desconto = ((Number) dadosCompletos.getOrDefault("vlrdesc_rec", 0)).doubleValue();
            double acrescimo = ((Number) dadosCompletos.getOrDefault("vlracre_rec", 0)).doubleValue();
            
            double saldo = Math.max(0, valorTotal + acrescimo - valorPago - desconto);
            dadosCompletos.put("vlrsal_rec", saldo);

            // Usar função genérica para inserir com datas duplicadas
            Object[] sqlResult = DataDuplicadaUtil.gerarInsertComDatasDuplicadas("receber", dadosCompletos, jdbcTemplate);
            
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
            if (dados.containsKey("vlrdup_rec") || dados.containsKey("vlrpag_rec") || 
                dados.containsKey("vlrdesc_rec") || dados.containsKey("vlracre_rec")) {
                
                double valorTotal = ((Number) dados.getOrDefault("vlrdup_rec", 0)).doubleValue();
                double valorPago = ((Number) dados.getOrDefault("vlrpag_rec", 0)).doubleValue();
                double desconto = ((Number) dados.getOrDefault("vlrdesc_rec", 0)).doubleValue();
                double acrescimo = ((Number) dados.getOrDefault("vlracre_rec", 0)).doubleValue();
                
                double saldo = Math.max(0, valorTotal + acrescimo - valorPago - desconto);
                dados.put("vlrsal_rec", saldo);
            }

            // Usar função genérica para atualizar com datas duplicadas
            Object[] sqlResult = DataDuplicadaUtil.gerarUpdateComDatasDuplicadas(
                "receber", 
                dados, 
                "receber_id = " + id,
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
            String sql = "DELETE FROM receber WHERE receber_id = ?";
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
            @RequestParam(required = false) Integer codigoCliente) {
        try {
            StringBuilder sql = new StringBuilder("""
                SELECT 
                    receber_id,
                    codigo_rec,
                    numdup_rec,
                    parcela_rec,
                    vlrdup_rec,
                    vlrsal_rec,
                    dtvenci_rec,    -- Campo principal
                    status_rec
                FROM receber 
                WHERE vlrsal_rec > 0 
                  AND status_rec = 'A'
                """);

            if (codigoCliente != null) {
                sql.append(" AND codigo_rec = ").append(codigoCliente);
            }


            sql.append(" ORDER BY dtvenci_rec"); // Campo principal

            List<Map<String, Object>> documentos = jdbcTemplate.queryForList(sql.toString());
            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            System.err.println("Erro ao listar documentos abertos: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Calcula o nível do cliente baseado no histórico de pagamentos
     * Diamante: 6 últimos vencimentos pagos em dia (tolerância 1 dia)
     * Ouro: 4 últimos vencimentos pagos em dia (tolerância 1 dia)
     * Prata: 2 últimos vencimentos pagos em dia (tolerância 1 dia)
     * Bronze: Não atende critérios acima
     * 
     * @return Map com codigo_cli e nivel
     */
    @GetMapping("/niveis-clientes")
    public ResponseEntity<List<Map<String, Object>>> calcularNiveisClientes() {
        try {
            String sql = """
                SELECT 
                    codigo_rec,
                    dtvenci_rec,
                    dtpagi_rec,
                    DATEDIFF(dtpagi_rec, dtvenci_rec) AS dias_atraso
                FROM receber
                WHERE dtpagi_rec IS NOT NULL
                  AND status_rec != 'E'
                ORDER BY codigo_rec, dtvenci_rec DESC
                """;
            
            List<Map<String, Object>> pagamentos = jdbcTemplate.queryForList(sql);
            
            // Agrupar por cliente e calcular nível
            Map<String, String> niveisMap = new HashMap<>();
            Map<String, String> tendenciasMap = new HashMap<>();
            Map<String, List<Map<String, Object>>> pagamentosPorCliente = new HashMap<>();
            
            // Agrupar pagamentos por cliente
            for (Map<String, Object> pag : pagamentos) {
                String codigoCliente = String.valueOf(pag.get("codigo_rec"));
                pagamentosPorCliente.computeIfAbsent(codigoCliente, k -> new ArrayList<>()).add(pag);
            }
            
            // Calcular nível e tendência para cada cliente
            for (Map.Entry<String, List<Map<String, Object>>> entry : pagamentosPorCliente.entrySet()) {
                String codigoCliente = entry.getKey();
                List<Map<String, Object>> pagsCliente = entry.getValue();
                
                // Pegar os últimos 6 pagamentos
                int limite = Math.min(6, pagsCliente.size());
                int pagosEmDia = 0;
                
                // Calcular média últimos 3 pagamentos
                int pagosEmDiaUltimos3 = 0;
                int pagosEmDia3Anteriores = 0;
                
                for (int i = 0; i < limite; i++) {
                    Object diasAtrasoObj = pagsCliente.get(i).get("dias_atraso");
                    if (diasAtrasoObj != null) {
                        int diasAtraso = ((Number) diasAtrasoObj).intValue();
                        // Tolerância de 1 dia
                        if (diasAtraso <= 1) {
                            pagosEmDia++;
                            
                            // Separar em grupos para tendência
                            if (i < 3) {
                                pagosEmDiaUltimos3++;
                            } else {
                                pagosEmDia3Anteriores++;
                            }
                        }
                    }
                }
                
                // Determinar nível
                String nivel = "Bronze";
                if (pagosEmDia >= 6) {
                    nivel = "Diamante";
                } else if (pagosEmDia >= 4) {
                    nivel = "Ouro";
                } else if (pagosEmDia >= 2) {
                    nivel = "Prata";
                }
                
                // Determinar tendência (comparar últimos 3 com 3 anteriores)
                String tendencia = "estavel";
                if (limite >= 6) {
                    double mediaUltimos3 = pagosEmDiaUltimos3 / 3.0;
                    double media3Anteriores = pagosEmDia3Anteriores / 3.0;
                    
                    if (mediaUltimos3 > media3Anteriores + 0.2) {
                        tendencia = "melhorando";
                    } else if (mediaUltimos3 < media3Anteriores - 0.2) {
                        tendencia = "piorando";
                    }
                } else if (limite >= 3) {
                    // Se tem menos de 6, usar apenas últimos 3 vs. histórico geral
                    double mediaUltimos3 = pagosEmDiaUltimos3 / 3.0;
                    if (mediaUltimos3 >= 0.8) {
                        tendencia = "melhorando";
                    } else if (mediaUltimos3 <= 0.4) {
                        tendencia = "piorando";
                    }
                }
                
                niveisMap.put(codigoCliente, nivel);
                tendenciasMap.put(codigoCliente, tendencia);
            }
            
            // Converter para lista de mapas
            List<Map<String, Object>> resultado = new ArrayList<>();
            for (Map.Entry<String, String> entry : niveisMap.entrySet()) {
                Map<String, Object> item = new HashMap<>();
                item.put("codigo_cli", entry.getKey());
                item.put("nivel", entry.getValue());
                item.put("tendencia", tendenciasMap.get(entry.getKey()));
                resultado.add(item);
            }
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("Erro ao calcular níveis de clientes: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(new ArrayList<>());
        }
    }
}
