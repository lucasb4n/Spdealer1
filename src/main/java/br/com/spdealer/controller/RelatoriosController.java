package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import br.com.spdealer.service.RelatoriosFinanceirosService;
import br.com.spdealer.service.RelatorioFinanceiroService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

/**
 * Controller para operações CRUD/updates rápidos relacionados a relatórios (fluxo, receber, pagar)
 * Expõe endpoints usados pelo frontend (ex: atualizar banco, departamento, etc.).
 */
@RestController
@RequestMapping("/api/relatorios")
public class RelatoriosController {

    private static final Logger logger = LoggerFactory.getLogger(RelatoriosController.class);

    @Autowired
    private RelatoriosFinanceirosService relatoriosService;

    @Autowired
    private RelatorioFinanceiroService relatorioFinanceiroService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Busca dados para relatório financeiro
     */
    @PostMapping("/financeiro")
    public ResponseEntity<List<Map<String, Object>>> buscarRelatorioFinanceiro(
            @RequestBody FiltroRelatorioDTO filtros) {
        
        try {
            // Debug logs
            System.out.println("=== RELATORIO FINANCEIRO REQUEST ===");
            System.out.println("Tipo: " + filtros.getTipo());
            System.out.println("Tipo Data: " + filtros.getTipoDataFiltro());
            System.out.println("Data Inicial: " + filtros.getDataFiltroInicial());
            System.out.println("Data Final: " + filtros.getDataFiltroFinal());
            System.out.println("Só em Aberto: " + filtros.isSoEmAberto());
            System.out.println("Tipos Documento (array): " + filtros.getTiposDocumento());
            System.out.println("=====================================");
            
            List<Map<String, Object>> dados;
            
            if ("receber".equals(filtros.getTipo())) {
                dados = relatorioFinanceiroService.buscarContasReceber(
                    filtros.getTipoDataFiltro(),
                    filtros.getDataFiltroInicial(),
                    filtros.getDataFiltroFinal(),
                    filtros.getPessoaTipo(),
                    filtros.getTipoCobranca(),
                    filtros.getTipoDocumento(),
                    filtros.getTiposDocumento(), // Array de tipos de documento
                    filtros.getDepartamento(),
                    filtros.getCentroCusto(),
                    filtros.getFaixaAtraso(),
                    filtros.isSoEmAberto(),
                    filtros.isSoPagos()
                );
            } else if ("pagar".equals(filtros.getTipo())) {
                dados = relatorioFinanceiroService.buscarContasPagar(
                    filtros.getTipoDataFiltro(),
                    filtros.getDataFiltroInicial(),
                    filtros.getDataFiltroFinal(),
                    filtros.getPessoaTipo(),
                    filtros.getTipoCobranca(),
                    filtros.getTipoDocumento(),
                    filtros.getTiposDocumento(), // Array de tipos de documento
                    filtros.getDepartamento(),
                    filtros.getCentroCusto(),
                    filtros.getFaixaAtraso(),
                    filtros.isSoEmAberto(),
                    filtros.isSoPagos()
                );
            } else {
                // Para fluxo de caixa, buscar tanto receber quanto pagar
                List<Map<String, Object>> receber = relatorioFinanceiroService.buscarContasReceber(
                    filtros.getTipoDataFiltro(), filtros.getDataFiltroInicial(),
                    filtros.getDataFiltroFinal(), filtros.getPessoaTipo(),
                    filtros.getTipoCobranca(), filtros.getTipoDocumento(),
                    filtros.getTiposDocumento(), // Array de tipos de documento
                    filtros.getDepartamento(), filtros.getCentroCusto(),
                    filtros.getFaixaAtraso(), filtros.isSoEmAberto(), filtros.isSoPagos()
                );
                
                List<Map<String, Object>> pagar = relatorioFinanceiroService.buscarContasPagar(
                    filtros.getTipoDataFiltro(), filtros.getDataFiltroInicial(),
                    filtros.getDataFiltroFinal(), filtros.getPessoaTipo(),
                    filtros.getTipoCobranca(), filtros.getTipoDocumento(),
                    filtros.getTiposDocumento(), // Array de tipos de documento
                    filtros.getDepartamento(), filtros.getCentroCusto(),
                    filtros.getFaixaAtraso(), filtros.isSoEmAberto(), filtros.isSoPagos()
                );
                
                // Combinar os dados
                // Usar método de fluxo do serviço singular
                Map<String, Object> filtrosMap = new HashMap<>();
                filtrosMap.put("dataFiltroInicial", filtros.getDataFiltroInicial());
                filtrosMap.put("dataFiltroFinal", filtros.getDataFiltroFinal());
                filtrosMap.put("soEmAberto", filtros.isSoEmAberto());
                dados = relatorioFinanceiroService.buscarFluxoCaixa(filtrosMap);
            }
            
            return ResponseEntity.ok(dados);
            
        } catch (Exception e) {
            System.err.println("❌ ERRO ao buscar relatório financeiro:");
            System.err.println("Mensagem: " + e.getMessage());
            e.printStackTrace();
            
            // Retornar erro 400 com mensagem descritiva
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Exporta relatório para PDF via Jasper
     */
    @PostMapping("/financeiro/export")
    public ResponseEntity<byte[]> exportarRelatorioFinanceiro(
            @RequestBody FiltroRelatorioDTO filtros) {
        
        try {
            System.out.println("=== PDF EXPORT REQUEST ===");
            System.out.println("Tipo: " + filtros.getTipo());
            System.out.println("Data Inicial: " + filtros.getDataFiltroInicial());
            System.out.println("Data Final: " + filtros.getDataFiltroFinal());
            System.out.println("==========================");
            
            byte[] pdfBytes = relatorioFinanceiroService.gerarRelatorioPDF(filtros);
            
            System.out.println("✅ PDF gerado com sucesso: " + pdfBytes.length + " bytes");
            
            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=relatorio.pdf")
                .body(pdfBytes);
                
        } catch (Exception e) {
            System.err.println("❌ ERRO ao gerar PDF:");
            System.err.println("Mensagem: " + e.getMessage());
            System.err.println("Classe: " + e.getClass().getName());
            e.printStackTrace();
            
            // Log detalhado da stack trace
            StringBuilder sb = new StringBuilder();
            for (StackTraceElement ste : e.getStackTrace()) {
                sb.append(ste.toString()).append("\n");
            }
            System.err.println("Stack Trace:\n" + sb.toString());
            
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Busca opções para filtros
     */
    @GetMapping("/opcoes-filtro")
    public ResponseEntity<Map<String, Object>> buscarOpcoesFiltro() {
        try {
            Map<String, Object> opcoes = relatorioFinanceiroService.buscarOpcoesFiltro();
            return ResponseEntity.ok(opcoes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Busca fluxo de caixa agrupado por data (NOVO - com subtotais por mês)
     */
    @PostMapping("/fluxo-caixa-com-subtotais")
    public ResponseEntity<List<Map<String, Object>>> buscarFluxoCaixaComSubtotais(
            @RequestBody Map<String, Object> filtros) {
        try {
            System.out.println("=== FLUXO CAIXA COM SUBTOTAIS ===");
            System.out.println("Filtros: " + filtros);
            
            List<Map<String, Object>> dados = relatorioFinanceiroService.buscarFluxoCaixa(filtros);
            
            System.out.println("✅ Total de registros (incluindo subtotais): " + dados.size());
            return ResponseEntity.ok(dados);
        } catch (Exception e) {
            System.err.println("❌ Erro ao buscar fluxo com subtotais:");
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                List.of(Map.of("erro", "Erro ao buscar fluxo de caixa: " + e.getMessage()))
            );
        }
    }

    /**
     * Busca detalhes da data no fluxo de caixa (títulos que compõem o dia)
     */
    @GetMapping("/fluxo-caixa-detalhes/{data}")
    public ResponseEntity<Map<String, Object>> buscarDetalhesFluxoDia(
            @PathVariable String data,
            @RequestParam(required = false, defaultValue = "true") boolean soEmAberto) {
        try {
            System.out.println("=== DETALHES FLUXO CAIXA ===");
            System.out.println("Data: " + data);
            
            Map<String, Object> detalhes = relatorioFinanceiroService.buscarDetalhesFluxoDia(data, soEmAberto);
            
            return ResponseEntity.ok(detalhes);
        } catch (Exception e) {
            System.err.println("❌ Erro ao buscar detalhes:");
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(
                Map.of("erro", "Erro ao buscar detalhes: " + e.getMessage())
            );
        }
    }

    /**
     * Busca fluxo de caixa agrupado por data (ANTIGO)
     */
    @PostMapping("/fluxo-caixa-agrupado")
    public ResponseEntity<List<Map<String, Object>>> buscarFluxoCaixaAgrupado(
            @RequestBody FiltroFluxoCaixaDTO filtros) {
        try {
            System.out.println("=== FLUXO CAIXA AGRUPADO ===");
            System.out.println("Dias Futuros: " + filtros.getDiasFuturos());
            System.out.println("Só em Aberto: " + filtros.isSoEmAberto());
            
            List<Map<String, Object>> dados = relatorioFinanceiroService.buscarFluxoCaixaAgrupado(
                filtros.getDiasFuturos(),
                filtros.isSoEmAberto()
            );
            
            System.out.println("✅ Total de dias retornados: " + dados.size());
            return ResponseEntity.ok(dados);
        } catch (Exception e) {
            System.err.println("❌ Erro ao buscar fluxo agrupado:");
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Busca lista de departamentos para populate dropdowns
     */
    @GetMapping("/departamentos")
    public ResponseEntity<List<Map<String, Object>>> listarDepartamentos() {
        try {
            System.out.println("=== LISTAR DEPARTAMENTOS ===");
            List<Map<String, Object>> departamentos = relatorioFinanceiroService.buscarDepartamentos();
            System.out.println("✅ Departamentos encontrados: " + departamentos.size());
            return ResponseEntity.ok(departamentos);
        } catch (Exception e) {
            System.err.println("❌ Erro ao buscar departamentos:");
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * GET /api/relatorios/bancos
     * Lista todos os bancos para dropdown na coluna Banco editável
     */
    @GetMapping("/bancos")
    public ResponseEntity<?> listarBancos() {
        try {
            System.out.println("=== LISTAR BANCOS ===");
            List<Map<String, Object>> bancos = relatorioFinanceiroService.listarBancos();
            System.out.println("✅ Bancos encontrados: " + bancos.size());
            return ResponseEntity.ok(bancos);
        } catch (Exception e) {
            System.err.println("❌ Erro ao listar bancos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Erro ao listar bancos",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Consulta Caixa e Bancos
     * Endpoint: GET /api/relatorios/consulta-caixa
     * Params: dataInicial, dataFinal, centroCusto, operacao, mascai, cliente_cai, banco
     */
    @GetMapping("/consulta-caixa")
    public ResponseEntity<List<Map<String, Object>>> consultaCaixa(
            @RequestParam(value = "dataInicial", required = false) String dataInicial,
            @RequestParam(value = "dataFinal", required = false) String dataFinal,
            @RequestParam(value = "centroCusto", required = false) String centroCusto,
            @RequestParam(value = "operacao", required = false) String operacao,
            @RequestParam(value = "mascai", required = false) String mascai,
            @RequestParam(value = "cliente_cai", required = false) String clienteCai,
            @RequestParam(value = "banco", required = false) String banco,
            @RequestParam(value = "tipoData", defaultValue = "caixa") String tipoData,
            HttpSession session
    ) {
        try {
            logger.info("[CONSULTA-CAIXA] Iniciando busca com filtros: dataini={}, datafim={}, banco={}, operacao={}, tipoData={}", dataInicial, dataFinal, banco, operacao, tipoData);
            
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT c.filial_cai, c.codbanco_cai AS banco_cai, c.codbanco_cai, c.seq_cai, ");
            sql.append("COALESCE(b.nomefan_bco, b.nome_bco, '') AS nome_cai, ");
            sql.append("c.dtmovi_cai, c.dpto_cai, ");
            sql.append("COALESCE(d.descr_dep, c.dpto_cai) AS descr_dpto, ");
            sql.append("COALESCE((SELECT descr_ope FROM masope WHERE codigo_ope = c.oper_cai), c.oper_cai) AS oper_cai, ");
            sql.append("c.dc_cai, c.valor_cai, c.histor_cai, c.tipocai_cai ");
            sql.append("FROM caixa c ");
            sql.append("LEFT JOIN masdep d ON c.dpto_cai = d.codigo_dep ");
            
            String empresa = "001";
            if (session != null) {
                Object empAttr = session.getAttribute("empresa_ger");
                if (empAttr == null) empAttr = session.getAttribute("empresa");
                if (empAttr != null) empresa = empAttr.toString();
            }

            sql.append("LEFT JOIN bancos b ON TRIM(c.codbanco_cai) = TRIM(b.codigo_bco) AND b.empresa_ger = ? ");
            sql.append("WHERE 1=1 ");

            List<Object> params = new ArrayList<>();
            params.add(empresa);

            // Filtro de Datas conforme tipoData:
            // "caixa"       → c.dtmovi_cai (padrão, comportamento atual)
            // "pagamento"   → receber.dtpagi_rec (C) / pagar.dtpagi_pag (D)
            // "competencia" → receber.dtmovi_rec (C) / pagar.dtvenci_pag (D)
            if (dataInicial != null && !dataInicial.isEmpty() && dataFinal != null && !dataFinal.isEmpty()) {
                if ("pagamento".equals(tipoData)) {
                    sql.append(" AND ((c.dc_cai = 'C' AND EXISTS (SELECT 1 FROM receber r WHERE r.cxbco_rec = c.codbco_cai AND r.seqcai_rec = c.seq_cai AND r.dtpagi_rec BETWEEN ? AND ?))");
                    sql.append(" OR (c.dc_cai = 'D' AND EXISTS (SELECT 1 FROM pagar p WHERE p.cxbco_pag = c.codbco_cai AND p.seqcai_pag = c.seq_cai AND p.dtpagi_pag BETWEEN ? AND ?)))");
                    params.add(java.sql.Date.valueOf(dataInicial));
                    params.add(java.sql.Date.valueOf(dataFinal));
                    params.add(java.sql.Date.valueOf(dataInicial));
                    params.add(java.sql.Date.valueOf(dataFinal));
                } else if ("competencia".equals(tipoData)) {
                    sql.append(" AND ((c.dc_cai = 'C' AND EXISTS (SELECT 1 FROM receber r WHERE r.cxbco_rec = c.codbco_cai AND r.seqcai_rec = c.seq_cai AND r.dtmovi_rec BETWEEN ? AND ?))");
                    sql.append(" OR (c.dc_cai = 'D' AND EXISTS (SELECT 1 FROM pagar p WHERE p.cxbco_pag = c.codbco_cai AND p.seqcai_pag = c.seq_cai AND p.dtvenci_pag BETWEEN ? AND ?)))");
                    params.add(java.sql.Date.valueOf(dataInicial));
                    params.add(java.sql.Date.valueOf(dataFinal));
                    params.add(java.sql.Date.valueOf(dataInicial));
                    params.add(java.sql.Date.valueOf(dataFinal));
                } else {
                    // "caixa" (default) — filtro original por c.dtmovi_cai
                    String dtIni = dataInicial.replaceAll("(\\d{4})-(\\d{2})-(\\d{2})", "$1$2$3");
                    String dtFim = dataFinal.replaceAll("(\\d{4})-(\\d{2})-(\\d{2})", "$1$2$3");
                    sql.append(" AND CAST(REPLACE(c.dtmovi_cai, '-', '') AS UNSIGNED) >= ?");
                    sql.append(" AND CAST(REPLACE(c.dtmovi_cai, '-', '') AS UNSIGNED) <= ?");
                    params.add(Integer.valueOf(dtIni));
                    params.add(Integer.valueOf(dtFim));
                }
            } else if (dataInicial != null && !dataInicial.isEmpty()) {
                // Apenas dataInicial
                if ("pagamento".equals(tipoData)) {
                    sql.append(" AND ((c.dc_cai = 'C' AND EXISTS (SELECT 1 FROM receber r WHERE r.cxbco_rec = c.codbco_cai AND r.seqcai_rec = c.seq_cai AND r.dtpagi_rec >= ?))");
                    sql.append(" OR (c.dc_cai = 'D' AND EXISTS (SELECT 1 FROM pagar p WHERE p.cxbco_pag = c.codbco_cai AND p.seqcai_pag = c.seq_cai AND p.dtpagi_pag >= ?)))");
                    params.add(java.sql.Date.valueOf(dataInicial));
                    params.add(java.sql.Date.valueOf(dataInicial));
                } else if ("competencia".equals(tipoData)) {
                    sql.append(" AND ((c.dc_cai = 'C' AND EXISTS (SELECT 1 FROM receber r WHERE r.cxbco_rec = c.codbco_cai AND r.seqcai_rec = c.seq_cai AND r.dtmovi_rec >= ?))");
                    sql.append(" OR (c.dc_cai = 'D' AND EXISTS (SELECT 1 FROM pagar p WHERE p.cxbco_pag = c.codbco_cai AND p.seqcai_pag = c.seq_cai AND p.dtvenci_pag >= ?)))");
                    params.add(java.sql.Date.valueOf(dataInicial));
                    params.add(java.sql.Date.valueOf(dataInicial));
                } else {
                    String dtIni = dataInicial.replaceAll("(\\d{4})-(\\d{2})-(\\d{2})", "$1$2$3");
                    sql.append(" AND CAST(REPLACE(c.dtmovi_cai, '-', '') AS UNSIGNED) >= ?");
                    params.add(Integer.valueOf(dtIni));
                }
            } else if (dataFinal != null && !dataFinal.isEmpty()) {
                // Apenas dataFinal
                if ("pagamento".equals(tipoData)) {
                    sql.append(" AND ((c.dc_cai = 'C' AND EXISTS (SELECT 1 FROM receber r WHERE r.cxbco_rec = c.codbco_cai AND r.seqcai_rec = c.seq_cai AND r.dtpagi_rec <= ?))");
                    sql.append(" OR (c.dc_cai = 'D' AND EXISTS (SELECT 1 FROM pagar p WHERE p.cxbco_pag = c.codbco_cai AND p.seqcai_pag = c.seq_cai AND p.dtpagi_pag <= ?)))");
                    params.add(java.sql.Date.valueOf(dataFinal));
                    params.add(java.sql.Date.valueOf(dataFinal));
                } else if ("competencia".equals(tipoData)) {
                    sql.append(" AND ((c.dc_cai = 'C' AND EXISTS (SELECT 1 FROM receber r WHERE r.cxbco_rec = c.codbco_cai AND r.seqcai_rec = c.seq_cai AND r.dtmovi_rec <= ?))");
                    sql.append(" OR (c.dc_cai = 'D' AND EXISTS (SELECT 1 FROM pagar p WHERE p.cxbco_pag = c.codbco_cai AND p.seqcai_pag = c.seq_cai AND p.dtvenci_pag <= ?)))");
                    params.add(java.sql.Date.valueOf(dataFinal));
                    params.add(java.sql.Date.valueOf(dataFinal));
                } else {
                    String dtFim = dataFinal.replaceAll("(\\d{4})-(\\d{2})-(\\d{2})", "$1$2$3");
                    sql.append(" AND CAST(REPLACE(c.dtmovi_cai, '-', '') AS UNSIGNED) <= ?");
                    params.add(Integer.valueOf(dtFim));
                }
            }
            if (centroCusto != null && !centroCusto.isEmpty()) {
                sql.append(" AND c.dpto_cai = ?");
                params.add(centroCusto);
            }
            // Operação: Busca exata como no backup de 07/04
            if (operacao != null && !operacao.isEmpty()) {
                sql.append(" AND c.oper_cai = ?");
                params.add(operacao);
            }
            if (mascai != null && !mascai.isEmpty()) {
                sql.append(" AND c.mascai = ?");
                params.add(mascai);
            }

            if (clienteCai != null && !clienteCai.isEmpty()) {
                sql.append(" AND c.codbanco_cai = ?");
                params.add(clienteCai);
            } else if (banco != null && !banco.isEmpty()) {
                sql.append(" AND (b.nomefan_bco = ? OR b.nome_bco = ? OR c.codbanco_cai = ?)");
                params.add(banco);
                params.add(banco);
                params.add(banco);
            }

            sql.append(" ORDER BY c.dtmovi_cai DESC, c.filial_cai, c.seq_cai");

            List<Map<String, Object>> rows = jdbcTemplate.query(sql.toString(), params.toArray(), (rs, rowNum) -> {
                Map<String, Object> m = new HashMap<>();
                m.put("filial_cai", rs.getString("filial_cai"));
                m.put("banco_cai", rs.getString("banco_cai"));
                m.put("codbanco_cai", rs.getString("codbanco_cai"));
                m.put("seq_cai", rs.getString("seq_cai"));
                m.put("nome_cai", rs.getString("nome_cai"));
                m.put("dtmovi_cai", rs.getString("dtmovi_cai"));
                m.put("dpto_cai", rs.getString("dpto_cai"));
                m.put("descr_dpto", rs.getString("descr_dpto"));
                m.put("oper_cai", rs.getString("oper_cai"));
                m.put("dc_cai", rs.getString("dc_cai"));
                m.put("valor_cai", rs.getBigDecimal("valor_cai"));
                m.put("histor_cai", rs.getString("histor_cai"));
                m.put("tipocai_cai", rs.getString("tipocai_cai"));
                return m;
            });

            logger.info("[CONSULTA-CAIXA] Concluída. {} registros encontrados.", rows.size());

            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * PUT /api/relatorios/receber/{id}/banco
     * Atualiza o banco de um documento em receber
     */
    @PutMapping("/receber/{id}/banco")
    public ResponseEntity<?> atualizarBancoReceber(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String novoBanco = body.get("banco_rec");
            if (novoBanco == null || novoBanco.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Campo banco_rec é obrigatório"
                ));
            }
            
            System.out.println("=== ATUALIZAR BANCO RECEBER ===");
            System.out.println("ID: " + id);
            System.out.println("Novo Banco: " + novoBanco);
            
            boolean atualizado = relatorioFinanceiroService.atualizarBancoReceber(id, novoBanco);
            
            if (atualizado) {
                System.out.println("✅ Banco atualizado com sucesso");
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Banco atualizado com sucesso"
                ));
            } else {
                System.err.println("❌ Registro não encontrado: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ ERRO ao atualizar banco em receber: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Erro ao atualizar banco",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * PUT /api/relatorios/pagar/{id}/banco
     * Atualiza o banco de um documento em pagar
     */
    @PutMapping("/pagar/{id}/banco")
    public ResponseEntity<?> atualizarBancoPagar(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String novoBanco = body.get("banco_pag");
            if (novoBanco == null || novoBanco.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Campo banco_pag é obrigatório"
                ));
            }
            
            System.out.println("=== ATUALIZAR BANCO PAGAR ===");
            System.out.println("ID: " + id);
            System.out.println("Novo Banco: " + novoBanco);
            
            boolean atualizado = relatorioFinanceiroService.atualizarBancoPagar(id, novoBanco);
            
            if (atualizado) {
                System.out.println("✅ Banco atualizado com sucesso");
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Banco atualizado com sucesso"
                ));
            } else {
                System.err.println("❌ Registro não encontrado: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ ERRO ao atualizar banco em pagar: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Erro ao atualizar banco",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * Atualiza o departamento de um registro (Receber ou Pagar)
     */
    @PutMapping("/{tipo}/{codigo}/departamento")
    public ResponseEntity<Map<String, Object>> atualizarDepartamento(
            @PathVariable String tipo,
            @PathVariable String codigo,
            @RequestParam String novoDepartamento) {
        
        try {
            Map<String, Object> resultado = relatorioFinanceiroService.atualizarDepartamento(
                tipo, codigo, novoDepartamento
            );
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            Map<String, Object> erro = new java.util.HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(erro);
        }
    }

    /**
     * Atualiza o banco (codigo_bco) de um registro (Receber ou Pagar)
     */
    @PutMapping("/{tipo}/{codigo}/banco")
    public ResponseEntity<Map<String, Object>> atualizarBanco(
            @PathVariable String tipo,
            @PathVariable String codigo,
            @RequestParam String novoCodigoBco) {
        try {
            Map<String, Object> resultado = relatorioFinanceiroService.atualizarBanco(
                tipo, codigo, novoCodigoBco
            );
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            Map<String, Object> erro = new java.util.HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(erro);
        }
    }

    /**
     * Atualiza o tipo de cobrança de um registro (Receber ou Pagar)
     */
    @PutMapping("/{tipo}/{codigo}/tipo-cobranca")
    public ResponseEntity<Map<String, Object>> atualizarTipoCobranca(
            @PathVariable String tipo,
            @PathVariable String codigo,
            @RequestParam String novoTipoCobranca) {
        
        try {
            Map<String, Object> resultado = relatorioFinanceiroService.atualizarTipoCobranca(
                tipo, codigo, novoTipoCobranca
            );
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            Map<String, Object> erro = new java.util.HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(erro);
        }
    }

    /**
     * Autoriza um pagamento (atualiza conflu_pag = 'S', codcobescr_pag = usuário e banco_pag = código do banco)
     */
    @PostMapping("/pagar/{codigoPag}/autorizar")
    public ResponseEntity<Map<String, Object>> autorizarPagamento(
            @PathVariable Integer codigoPag,
            @RequestBody Map<String, Object> dados,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        try {
            System.out.println("=== AUTORIZAR PAGAMENTO ===");
            System.out.println("Código Pagar: " + codigoPag);
            System.out.println("conflu_pag: " + dados.get("conflu_pag"));
            System.out.println("banco_pag: " + dados.get("banco_pag"));
            
            String confluPag = (String) dados.get("conflu_pag");
            String bancoPag = (String) dados.get("banco_pag");
            String usuario = "SISTEMA"; // Default se não tiver login
            
            // Tentar extrair usuário do JWT token (simplificado)
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                usuario = "USER"; // Em produção, decodificar JWT
            }
            
            // Chamar serviço para atualizar
            relatorioFinanceiroService.autorizarPagamento(codigoPag, confluPag, bancoPag, usuario);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Pagamento autorizado com sucesso",
                "codigo_pag", codigoPag,
                "conflu_pag", confluPag,
                "banco_pag", bancoPag,
                "autorizado_por", usuario
            ));
            
        } catch (Exception e) {
            System.err.println("Erro ao autorizar pagamento: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Erro ao autorizar pagamento: " + e.getMessage()
            ));
        }
    }

    /**
     * DTO para filtros do relatório
     */
    public static class FiltroRelatorioDTO {
        private String tipo;
        private String tipoDataFiltro;
        private String dataFiltroInicial;
        private String dataFiltroFinal;
        private String pessoaTipo;
        private String tipoCobranca;
        private String tipoDocumento;
        private java.util.List<String> tiposDocumento; // Múltiplos tipos de documento
        private String departamento;
        private String centroCusto;
        private String faixaAtraso;
        private boolean soEmAberto;
        private boolean soPagos;

        // Getters e Setters
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }

        public String getTipoDataFiltro() { return tipoDataFiltro; }
        public void setTipoDataFiltro(String tipoDataFiltro) { this.tipoDataFiltro = tipoDataFiltro; }

        public String getDataFiltroInicial() { return dataFiltroInicial; }
        public void setDataFiltroInicial(String dataFiltroInicial) { this.dataFiltroInicial = dataFiltroInicial; }

        public String getDataFiltroFinal() { return dataFiltroFinal; }
        public void setDataFiltroFinal(String dataFiltroFinal) { this.dataFiltroFinal = dataFiltroFinal; }

        public String getPessoaTipo() { return pessoaTipo; }
        public void setPessoaTipo(String pessoaTipo) { this.pessoaTipo = pessoaTipo; }

        public String getTipoCobranca() { return tipoCobranca; }
        public void setTipoCobranca(String tipoCobranca) { this.tipoCobranca = tipoCobranca; }

        public String getTipoDocumento() { return tipoDocumento; }
        public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }

        public java.util.List<String> getTiposDocumento() { return tiposDocumento; }
        public void setTiposDocumento(java.util.List<String> tiposDocumento) { this.tiposDocumento = tiposDocumento; }

        public String getDepartamento() { return departamento; }
        public void setDepartamento(String departamento) { this.departamento = departamento; }

        public String getCentroCusto() { return centroCusto; }
        public void setCentroCusto(String centroCusto) { this.centroCusto = centroCusto; }

        public String getFaixaAtraso() { return faixaAtraso; }
        public void setFaixaAtraso(String faixaAtraso) { this.faixaAtraso = faixaAtraso; }

        public boolean isSoEmAberto() { return soEmAberto; }
        public void setSoEmAberto(boolean soEmAberto) { this.soEmAberto = soEmAberto; }

        public boolean isSoPagos() { return soPagos; }
        public void setSoPagos(boolean soPagos) { this.soPagos = soPagos; }
    }

    /**
     * Busca previsões de receitas por operação
     * @param scodepCodigo Filtro opcional de centro de custo (ex: 121 para LEANDRO)
     */
    @GetMapping("/previsao-receitas")
    public ResponseEntity<List<Map<String, Object>>> buscarPrevisaoReceitas(
            @RequestParam(value = "scodep_codigo", required = false) Integer scodepCodigo) {
        try {
            String sql;
            List<Map<String, Object>> result;
            
            if (scodepCodigo != null) {
                sql = "SELECT id, filial_ocai, operacao_ocai, descr_ocai, data_previsao, " +
                      "periodo_tipo, periodo_descr, valor_realizado, quantidade_realizado, " +
                      "valor_previsto, valor_ajuste_manual, desvio_valor, percentual_desvio, " +
                      "scodep_codigo, atualizado_em FROM previsao_receitas_por_operacao " +
                      "WHERE filial_ocai = '001' AND scodep_codigo = ? " +
                      "ORDER BY data_previsao DESC, operacao_ocai";
                result = jdbcTemplate.queryForList(sql, scodepCodigo);
            } else {
                sql = "SELECT id, filial_ocai, operacao_ocai, descr_ocai, data_previsao, " +
                      "periodo_tipo, periodo_descr, valor_realizado, quantidade_realizado, " +
                      "valor_previsto, valor_ajuste_manual, desvio_valor, percentual_desvio, " +
                      "scodep_codigo, atualizado_em FROM previsao_receitas_por_operacao " +
                      "WHERE filial_ocai = '001' ORDER BY data_previsao DESC, operacao_ocai";
                result = jdbcTemplate.queryForList(sql);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Erro ao buscar previsão de receitas", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Busca previsões de despesas por operação
     * @param scodepCodigo Filtro opcional de centro de custo (ex: 121 para LEANDRO)
     */
    @GetMapping("/previsao-despesas")
    public ResponseEntity<List<Map<String, Object>>> buscarPrevisaoDespesas(
            @RequestParam(value = "scodep_codigo", required = false) Integer scodepCodigo) {
        try {
            String sql;
            List<Map<String, Object>> result;
            
            if (scodepCodigo != null) {
                sql = "SELECT id, filial_ocai, operacao_ocai, descr_ocai, data_previsao, " +
                      "periodo_tipo, periodo_descr, valor_realizado, quantidade_realizado, " +
                      "valor_previsto, valor_ajuste_manual, desvio_valor, percentual_desvio, " +
                      "scodep_codigo, atualizado_em FROM previsao_despesas_por_operacao " +
                      "WHERE filial_ocai = '001' AND scodep_codigo = ? " +
                      "ORDER BY data_previsao DESC, operacao_ocai";
                result = jdbcTemplate.queryForList(sql, scodepCodigo);
            } else {
                sql = "SELECT id, filial_ocai, operacao_ocai, descr_ocai, data_previsao, " +
                      "periodo_tipo, periodo_descr, valor_realizado, quantidade_realizado, " +
                      "valor_previsto, valor_ajuste_manual, desvio_valor, percentual_desvio, " +
                      "scodep_codigo, atualizado_em FROM previsao_despesas_por_operacao " +
                      "WHERE filial_ocai = '001' ORDER BY data_previsao DESC, operacao_ocai";
                result = jdbcTemplate.queryForList(sql);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Erro ao buscar previsão de despesas", e);
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * DTO para filtros do fluxo de caixa agrupado
     */
    public static class FiltroFluxoCaixaDTO {
        private int diasFuturos = 30;
        private boolean soEmAberto = true;

        public int getDiasFuturos() { return diasFuturos; }
        public void setDiasFuturos(int diasFuturos) { this.diasFuturos = diasFuturos; }

        public boolean isSoEmAberto() { return soEmAberto; }
        public void setSoEmAberto(boolean soEmAberto) { this.soEmAberto = soEmAberto; }
    }
}