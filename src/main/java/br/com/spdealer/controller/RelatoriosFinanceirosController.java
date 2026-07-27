package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.spdealer.service.RelatoriosFinanceirosService;
import br.com.spdealer.service.HtmlPdfReportService;
import br.com.spdealer.service.RotinaPermissaoService;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.servlet.http.HttpSession;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.util.JRLoader;
import net.sf.jasperreports.engine.data.JRMapCollectionDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.HashMap;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import java.util.Date;
import java.util.Collection;
import br.com.spdealer.util.SessionHelper;

/**
 * Controller para Relatórios Financeiros
 * 
 * Endpoints:
 * - GET/POST /api/relatorios/financeiro → busca dados
 * - POST /api/relatorios/financeiro/export → exporta para PDF
 */
@RestController
@RequestMapping("/api/relatorios-jasper")
public class RelatoriosFinanceirosController {

    private static final Logger logger = LoggerFactory.getLogger(RelatoriosFinanceirosController.class);

    @Autowired
    private RelatoriosFinanceirosService relatoriosService;

    @Autowired
    private br.com.spdealer.service.RelatorioFinanceiroService relatorioFinanceiroService;

    @Autowired
    private HtmlPdfReportService htmlPdfReportService;

    @Autowired
    private RotinaPermissaoService rotinaPermissaoService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Busca dados para relatório financeiro (Receber, Pagar, Fluxo)
     */
    @PostMapping("/financeiro")
    public ResponseEntity<?> buscarRelatorioFinanceiro(
            @RequestBody Map<String, Object> filtros,
            HttpSession session) {
        try {
            Long usuarioId = null;
            try {
                usuarioId = SessionHelper.getUserIdFromSession(session);
            } catch (Exception e) {
                logger.warn("⚠️ [RelatoriosFinanceirosController] Falha ao obter usuário da sessão: {}", e.getMessage());
            }

            // Fallback: tentar obter do payload (filtros) enviado pelo frontend
            if (usuarioId == null && filtros != null) {
                Object uId = filtros.get("userId");
                if (uId == null) uId = filtros.get("user_id");
                if (uId != null) {
                    try {
                        if (uId instanceof Number) {
                            usuarioId = ((Number) uId).longValue();
                        } else {
                            usuarioId = Long.parseLong(String.valueOf(uId));
                        }
                        logger.info("🟢 [RelatoriosFinanceirosController] Usando User ID enviado pelo frontend como fallback: {}", usuarioId);
                    } catch (Exception ex) {
                        logger.warn("⚠️ [RelatoriosFinanceirosController] Falha ao parsear User ID do payload: {}", ex.getMessage());
                    }
                }
            }

            if (usuarioId == null) {
                return ResponseEntity.status(401).body(Map.of("erro", "Sessão expirada. Faça login novamente."));
            }
			
            String tipo = (String) filtros.get("tipo");
            // IDs de relatórios financeiros: 412 (Receber), 413 (Pagar), 422 (Fluxo)
            java.util.List<Long> financialRoutineIds = java.util.List.of(412L, 413L, 422L);
            
            boolean temAcessoQualquer = false;
            for (Long rId : financialRoutineIds) {
                if (rotinaPermissaoService.temPermissao(usuarioId, rId, "visualizar")) {
                    temAcessoQualquer = true;
                    break;
                }
            }
            
            if (!temAcessoQualquer) {
                return ResponseEntity.status(403).body(Map.of("erro", "Sem permissão para visualizar esta rotina de relatórios financeiros."));
            }
            logger.info("=== BUSCAR RELATÓRIO FINANCEIRO ===");
            logger.debug("Tipo: {}", filtros.get("tipo"));
            logger.debug("Filtros: {}", filtros);

            // Normalizar campo de data: aceitar tanto "tipoCampoData" (coluna) quanto "tipoDataFiltro" (palavra-chave)
            tipo = (String) filtros.get("tipo");
            normalizeTipoCampoData(filtros, tipo);

            List<Map<String, Object>> dados = switch(tipo.toLowerCase()) {
                case "receber" -> relatoriosService.buscarRelatorioReceber(filtros);
                case "pagar" -> relatoriosService.buscarRelatorioPagar(filtros);
                case "inventario" -> relatoriosService.buscarRelatorioInventario(filtros);
                case "fluxo" -> relatoriosService.buscarFluxoCaixa(filtros);
                default -> throw new IllegalArgumentException("Tipo de relatório inválido: " + tipo);
            };

            logger.info("{} registros encontrados for buscarRelatorioFinanceiro", dados.size());
            return ResponseEntity.ok(dados);

        } catch (Exception e) {
            logger.error("Erro ao buscar relatório: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(List.of(Map.of(
                "erro", e.getMessage()
            )));
        }
    }

    /**
     * Normaliza o parâmetro `tipoCampoData` (coluna) para `tipoDataFiltro` (vencimento/pagamento/emissao/cadastro/fluxo)
     */
    private void normalizeTipoCampoData(Map<String, Object> filtros, String tipo) {
        if (filtros == null) return;

        // Se já veio como tipoDataFiltro, não alterar
        Object existing = filtros.get("tipoDataFiltro");
        if (existing != null && existing instanceof String && !((String) existing).isEmpty()) return;

        Object raw = filtros.get("tipoCampoData");
        if (raw == null) return;

        String campo = String.valueOf(raw).toLowerCase();
        String mapped = null;

        if ("receber".equalsIgnoreCase(tipo)) {
            if (campo.contains("dtvenci") || campo.contains("venc")) mapped = "vencimento";
            else if (campo.contains("dtpagi") || campo.contains("pagi")) mapped = "pagamento";
            else if (campo.contains("dtemissi") || campo.contains("emiss")) mapped = "emissao";
            else if (campo.contains("dtmovi") || campo.contains("mov")) mapped = "cadastro";
            else if (campo.contains("dtfluxo")) mapped = "fluxo";
        } else if ("pagar".equalsIgnoreCase(tipo)) {
            if (campo.contains("dtvenci") || campo.contains("venc")) mapped = "vencimento";
            else if (campo.contains("dtpagi") || campo.contains("pagi")) mapped = "pagamento";
            else if (campo.contains("dtemissi") || campo.contains("emiss")) mapped = "emissao";
            else if (campo.contains("dtmovi") || campo.contains("mov")) mapped = "cadastro";
            else if (campo.contains("dtfluxo")) mapped = "fluxo";
        } else {
            // Fluxo ou outros: tentar deduzir
            if (campo.contains("venc")) mapped = "vencimento";
            else if (campo.contains("pagi")) mapped = "pagamento";
            else if (campo.contains("emiss")) mapped = "emissao";
            else if (campo.contains("mov")) mapped = "cadastro";
            else if (campo.contains("fluxo")) mapped = "fluxo";
        }

        if (mapped != null) {
            filtros.put("tipoDataFiltro", mapped);
        }

        // Remover o campo cru para evitar confusão
        filtros.remove("tipoCampoData");
    }

    /**
     * Exporta relatório para PDF via Jasper Reports
     * 
     * Carrega template .jrxml + dados e gera PDF
     */
    @PostMapping("/financeiro/export")
    public ResponseEntity<byte[]> exportarRelatorioParaPDF(@RequestBody Map<String, Object> params) {
        try {
            logger.info("=== EXPORTAR RELATÓRIO PARA PDF (UNIFICADO) ===");
            byte[] pdfBytes = relatorioFinanceiroService.gerarRelatorioPDF(params);
            
            String templateName = (String) params.getOrDefault("templateName", "Relatorio");
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", templateName + "_" + System.currentTimeMillis() + ".pdf");
            
            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            logger.error("❌ Erro fatal ao exportar PDF: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(("Erro ao exportar PDF: " + e.getMessage()).getBytes());
        }
    }

    private void compileTemplateIfNeeded(String templateName) {
        try {
            String jasperPath = "target/classes/reports/" + templateName + ".jasper";
            String jrxmlPath = "src/main/resources/reports/" + templateName + ".jrxml";
            Path jasperFile = Paths.get(jasperPath);
            Path jrxmlFile = Paths.get(jrxmlPath);
            if (!Files.exists(jasperFile) && Files.exists(jrxmlFile)) {
                JasperCompileManager.compileReportToFile(jrxmlFile.toString(), jasperFile.toString());
            }
        } catch (Exception e) {
            logger.warn("Erro ao compilar template: {}", e.getMessage());
        }
    }

    @PostMapping("/pagar/export")
    public ResponseEntity<byte[]> exportarRelatorioContasPagarPDF(@RequestBody Map<String, Object> params) {
        try {
            logger.info("=== EXPORTAR RELATÓRIO CONTAS A PAGAR (JASPER V2) ===");
            
            // 1. Carregar e Compilar Relatório V2 (Principal)
            JasperReport jasperReport = getCompiledReport("ContasPagarReport_v2");
            
            Map<String, Object> parametrosJasper = new HashMap<>();
            
            // 1.a Formatar Datas para o Período (DD/MM/AAAA)
            String datainiRaw = (String) params.getOrDefault("dataFiltroInicial", "");
            String datafimRaw = (String) params.getOrDefault("dataFiltroFinal", "");
            parametrosJasper.put("DATA_INICIAL", formatToBrazilianDate(datainiRaw));
            parametrosJasper.put("DATA_FINAL", formatToBrazilianDate(datafimRaw));

            // 1.b Buscar Dados da Filial (Nome e CNPJ reais com Máscara)
            try {
                String filialId = (String) params.getOrDefault("id_fil", "001");
                Map<String, Object> emp = jdbcTemplate.queryForMap("SELECT nome_fil, cnpj_fil FROM filial WHERE codigo_fil = ? LIMIT 1", filialId);
                
                String nomeFilial = String.valueOf(emp.getOrDefault("nome_fil", "SPDealer"));
                String cnpjFilial = String.valueOf(emp.getOrDefault("cnpj_fil", "00000000000100"));
                
                parametrosJasper.put("EMPRESA_NOME", nomeFilial);
                parametrosJasper.put("EMPRESA_CNPJ", formatCNPJ(cnpjFilial));
            } catch (Exception e) {
                try {
                    Map<String, Object> emp = jdbcTemplate.queryForMap("SELECT nome_fil, cnpj_fil FROM filial LIMIT 1");
                    parametrosJasper.put("EMPRESA_NOME", String.valueOf(emp.getOrDefault("nome_fil", "SPDealer")));
                    parametrosJasper.put("EMPRESA_CNPJ", formatCNPJ(String.valueOf(emp.getOrDefault("cnpj_fil", "00000000000100"))));
                } catch (Exception e2) {
                    parametrosJasper.put("EMPRESA_NOME", "SPDealer");
                    parametrosJasper.put("EMPRESA_CNPJ", "00.000.000/0001-00");
                }
            }

            // 1.c Montar String de Filtros Selecionados
            StringBuilder filtrosTxt = new StringBuilder();
            String cobranca = (String) params.getOrDefault("tipoCobrancaLabel", params.getOrDefault("tipoCobranca", ""));
            if (!cobranca.isEmpty() && !"Todos".equalsIgnoreCase(cobranca)) {
                filtrosTxt.append(" | Tipo.Cobr: ").append(cobranca);
            }
            
            Object docsObj = params.get("tiposDocumentoLabels"); 
            if (docsObj instanceof java.util.Collection) {
                String docs = String.join(", ", (java.util.Collection<String>) docsObj);
                if (!docs.isEmpty()) filtrosTxt.append(" | Tipo de Doc: ").append(docs);
            } else if (params.get("tipoDocumento") != null && !String.valueOf(params.get("tipoDocumento")).isEmpty()) {
                filtrosTxt.append(" | Tipo de Doc: ").append(params.get("tipoDocumento"));
            }
            
            parametrosJasper.put("FILTRO_COBRANCA", filtrosTxt.toString());
            parametrosJasper.put("USUARIO", params.getOrDefault("usuario", "Admin"));
            parametrosJasper.put("TITULO_RELATORIO", getTituloRelatorio("pagar"));
            
            // 2. Carregar Cabeçalho
            try {
                JasperReport header = getCompiledReport("templates/cabecalho_landscape");
                parametrosJasper.put("SUBREPORT_HEADER", header);
                parametrosJasper.put("SUBREPORT_DIR", "reports/templates/"); 
            } catch (Exception e) {
                logger.warn("⚠️ Falha ao carregar sub-relatório para V2: {}", e.getMessage());
            }

            // 3. Buscar dados
            List<Map<String, Object>> dados = relatoriosService.buscarRelatorioPagar(params);
            
            // 4. Normalização de Campos
            for (Map<String, Object> rec : dados) {
                rec.put("nome_forn", rec.get("nome_for"));
                rec.put("documento_pag", rec.getOrDefault("cgccpf_pag_formatted", rec.get("documento_pag")));
                rec.put("numpag_pag", String.valueOf(rec.getOrDefault("numdup_pag", "")));
                
                // Mapear Descrições Diretas (tpcob e tipodoc) para T.COB e T.DOC
                rec.put("descr_tpag", rec.getOrDefault("tpcob_pag", ""));
                rec.put("descr_doc", rec.getOrDefault("tipodoc_pag", ""));

                rec.put("dtvenc_pag", toSqlDate(rec.get("dtvenci_pag")));
                rec.put("dtmovi_pag", formatNullableDate(rec.get("dtmovi_pag")));
                rec.put("dtpagi_pag", formatNullableDate(rec.get("dtpagi_pag")));

                rec.put("vlrdup_pag", toBigDecimal(rec.get("vlrdup_pag")));
                rec.put("vlrpag_pag", toBigDecimal(rec.get("vlrpag_pag")));
                rec.put("vlrsal_pag", toBigDecimal(rec.get("vlrsal_pag")));
                rec.put("codigo_pag", toBigDecimal(rec.get("codigo_pag")));
            }

            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource((Collection) dados);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametrosJasper, dataSource);
            
            byte[] pdfBytes = JasperExportManager.exportReportToPdf(jasperPrint);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "contasapagar_v2_" + System.currentTimeMillis() + ".pdf");
            
            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            logger.error("❌ ERRO FATAL na exportação Pagar V2: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(("Erro: " + e.getMessage()).getBytes());
        }
    }

    @PostMapping("/receber/export")
    public ResponseEntity<byte[]> exportarRelatorioContasReceberPDF(@RequestBody Map<String, Object> params) {
        try {
            logger.info("=== EXPORTAR RELATÓRIO CONTAS A RECEBER (JASPER V2) ===");
            
            // 1. Carregar e Compilar Relatório Principal V2
            JasperReport jasperReport = getCompiledReport("ContasReceberReport_v2");
            
            Map<String, Object> parametrosJasper = new HashMap<>();
            
            // 1.a Formatar Datas para o Período (DD/MM/AAAA)
            String datainiRaw = (String) params.getOrDefault("dataFiltroInicial", "");
            String datafimRaw = (String) params.getOrDefault("dataFiltroFinal", "");
            parametrosJasper.put("DATA_INICIAL", formatToBrazilianDate(datainiRaw));
            parametrosJasper.put("DATA_FINAL", formatToBrazilianDate(datafimRaw));

            // 1.b Buscar Dados da Filial
            try {
                String filialId = (String) params.getOrDefault("id_fil", "001");
                Map<String, Object> emp = jdbcTemplate.queryForMap("SELECT nome_fil, cnpj_fil FROM filial WHERE codigo_fil = ? LIMIT 1", filialId);
                parametrosJasper.put("EMPRESA_NOME", emp.getOrDefault("nome_fil", "SPDealer"));
                parametrosJasper.put("EMPRESA_CNPJ", emp.getOrDefault("cnpj_fil", "00.000.000/0001-00"));
            } catch (Exception e) {
                try {
                    Map<String, Object> emp = jdbcTemplate.queryForMap("SELECT nome_fil, cnpj_fil FROM filial LIMIT 1");
                    parametrosJasper.put("EMPRESA_NOME", emp.getOrDefault("nome_fil", "SPDealer"));
                    parametrosJasper.put("EMPRESA_CNPJ", emp.getOrDefault("cnpj_fil", "00.000.000/0001-00"));
                } catch (Exception e2) {
                    parametrosJasper.put("EMPRESA_NOME", "SPDealer");
                    parametrosJasper.put("EMPRESA_CNPJ", "00.000.000/0001-00");
                }
            }

            // 1.c Montar String de Filtros
            StringBuilder filtrosTxt = new StringBuilder();
            String cobranca = (String) params.getOrDefault("tipoCobrancaLabel", params.getOrDefault("tipoCobranca", ""));
            if (!cobranca.isEmpty() && !"Todos".equalsIgnoreCase(cobranca)) {
                filtrosTxt.append(" | Tipo.Cobr: ").append(cobranca);
            }
            
            Object docsObj = params.get("tiposDocumentoLabels"); 
            if (docsObj instanceof java.util.Collection) {
                String docs = String.join(", ", (java.util.Collection<String>) docsObj);
                if (!docs.isEmpty()) filtrosTxt.append(" | Tipo de Doc: ").append(docs);
            }
            
            parametrosJasper.put("FILTRO_COBRANCA", filtrosTxt.toString());
            parametrosJasper.put("USUARIO", params.getOrDefault("usuario", "Admin"));
            parametrosJasper.put("TITULO_RELATORIO", "RELATÓRIO DE CONTAS A RECEBER");
            
            // 2. Carregar Cabeçalho Dinâmico
            try {
                JasperReport header = getCompiledReport("templates/cabecalho_landscape");
                parametrosJasper.put("SUBREPORT_HEADER", header);
                parametrosJasper.put("SUBREPORT_DIR", "reports/templates/"); 
            } catch (Exception e) {
                logger.warn("⚠️ Falha ao carregar sub-relatório para Receber: {}", e.getMessage());
            }

            // 3. Buscar dados
            List<Map<String, Object>> dados = relatoriosService.buscarRelatorioReceber(params);
            
            // 4. Normalização de Campos
            for (Map<String, Object> rec : dados) {
                // Mapear campos para o Jasper
                rec.put("descr_tpag", rec.getOrDefault("tpcob_rec", ""));
                rec.put("descr_doc", rec.getOrDefault("tipodoc_rec", ""));
                rec.put("cgccpf_rec", rec.getOrDefault("cgccpf_rec_formatted", rec.get("cgccpf_rec")));
                
                rec.put("dtvenci_rec", toSqlDate(rec.get("dtvenci_rec")));
                rec.put("vlrdup_rec", toBigDecimal(rec.get("vlrdup_rec")));
                rec.put("vlrsal_rec", toBigDecimal(rec.get("vlrsal_rec")));
                rec.put("codigo_rec", toBigDecimal(rec.get("codigo_rec")));
            }

            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource((Collection) dados);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parametrosJasper, dataSource);
            
            byte[] pdfBytes = JasperExportManager.exportReportToPdf(jasperPrint);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "contasareceber_" + System.currentTimeMillis() + ".pdf");
            
            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            logger.error("❌ ERRO FATAL na exportação Contas a Receber: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(("Erro: " + e.getMessage()).getBytes());
        }
    }

    private String formatCNPJ(String cnpj) {
        if (cnpj == null) return "00.000.000/0001-00";
        // Limpar tudo que não for dígito
        cnpj = cnpj.replaceAll("\\D", "");
        if (cnpj.length() != 14) return cnpj;
        
        return String.format("%s.%s.%s/%s-%s",
            cnpj.substring(0, 2),
            cnpj.substring(2, 5),
            cnpj.substring(5, 8),
            cnpj.substring(8, 12),
            cnpj.substring(12, 14)
        );
    }

    private String formatToBrazilianDate(String ymd) {
        if (ymd == null || ymd.length() < 10) return ymd;
        try {
            String clean = ymd.substring(0, 10);
            String[] parts = clean.split("-");
            if (parts.length == 3) return parts[2] + "/" + parts[1] + "/" + parts[0];
        } catch (Exception e) {}
        return ymd;
    }

    private JasperReport getCompiledReport(String name) throws JRException, java.io.IOException {
        // Tentar carregar o .jasper já compilado
        ClassPathResource jasperRes = new ClassPathResource("reports/" + name + ".jasper");
        if (jasperRes.exists()) {
            try {
                return (JasperReport) JRLoader.loadObject(jasperRes.getInputStream());
            } catch (Exception e) {
                logger.warn("⚠️ Falha ao deserializar .jasper de {}, compilando o .jrxml em memória: {}", name, e.getMessage());
            }
        }
        
        // Se não existir ou falhar ao carregar o .jasper, carregar o .jrxml e compilar em memória
        ClassPathResource jrxmlRes = new ClassPathResource("reports/" + name + ".jrxml");
        if (!jrxmlRes.exists()) {
            throw new java.io.FileNotFoundException("Template não encontrado: reports/" + name + " (jrxml ou jasper)");
        }
        
        logger.info("🛠️ Compilando template Jasper em memória: {}", name);
        return JasperCompileManager.compileReport(jrxmlRes.getInputStream());
    }

    private String getTituloRelatorio(String tipo) {
        if (tipo == null) return "Relatório Financeiro";
        return switch (tipo.toLowerCase()) {
            case "receber" -> "Relatório de Contas a Receber";
            case "pagar" -> "Relatório de Contas a Pagar";
            case "fluxo" -> "Fluxo de Caixa";
            case "inventario" -> "Inventário de Estoque";
            default -> "Relatório Financeiro";
        };
    }

    private java.sql.Date toSqlDate(Object val) {
        if (val == null) return null;
        if (val instanceof java.sql.Date d) return d;
        if (val instanceof java.util.Date ud) return new java.sql.Date(ud.getTime());
        if (val instanceof Number n) {
            // Tratar formato yyyyMMdd (ex: 20250401) vindo do banco como número
            long l = n.longValue();
            if (l > 19000000 && l < 21000000) {
                try {
                    String s = String.valueOf(l);
                    java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyyMMdd");
                    return new java.sql.Date(sdf.parse(s).getTime());
                } catch (Exception e) { return null; }
            }
        }
        if (val instanceof String s && !s.trim().isEmpty()) {
            try { 
                String clean = s.trim().replace("-", "").replace("/", "");
                if (clean.length() == 8) {
                   java.text.SimpleDateFormat sdf = clean.contains("/") ? new java.text.SimpleDateFormat("ddMMyyyy") : new java.text.SimpleDateFormat("yyyyMMdd");
                   // Heurística simples: se começa com 20, assumimos yyyyMMdd
                   if (clean.startsWith("20")) sdf = new java.text.SimpleDateFormat("yyyyMMdd");
                   else sdf = new java.text.SimpleDateFormat("ddMMyyyy");
                   return new java.sql.Date(sdf.parse(clean).getTime());
                }
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd");
                if (s.contains("/")) sdf = new java.text.SimpleDateFormat("dd/MM/yyyy");
                return new java.sql.Date(sdf.parse(s.trim()).getTime());
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private Double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number n) return n.doubleValue();
        if (val instanceof String s && !s.trim().isEmpty()) {
            try { return Double.parseDouble(s.trim().replace(",", ".")); } catch (Exception e) {}
        }
        return 0.0;
    }

    private Integer toInteger(Object val) {
        if (val == null) return null;
        if (val instanceof Integer i) return i;
        if (val instanceof Number n) return n.intValue();
        if (val instanceof String s && !s.trim().isEmpty()) {
            try { return Integer.parseInt(s.trim()); } catch (Exception e) {}
        }
        return null;
    }

    private java.math.BigDecimal toBigDecimal(Object val) {
        if (val == null) return java.math.BigDecimal.ZERO;
        if (val instanceof java.math.BigDecimal b) return b;
        if (val instanceof Number n) return java.math.BigDecimal.valueOf(n.doubleValue());
        if (val instanceof String s && !s.trim().isEmpty()) {
            try { return new java.math.BigDecimal(s.trim().replace(",", ".")); } catch (Exception e) {}
        }
        return java.math.BigDecimal.ZERO;
    }

    private String formatNullableDate(Object val) {
        if (val == null) return "";
        if (val instanceof String s) return s;
        try {
            java.sql.Date d = toSqlDate(val);
            if (d != null) {
                return new java.text.SimpleDateFormat("dd/MM/yyyy").format(d);
            }
        } catch (Exception e) {}
        return String.valueOf(val);
    }
}
