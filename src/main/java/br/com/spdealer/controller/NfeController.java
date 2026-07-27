package br.com.spdealer.controller;

import br.com.spdealer.nfe.model.NotaCab;
import br.com.spdealer.nfe.model.NotaDet;
import br.com.spdealer.nfe.repository.NotaCabRepository;
import br.com.spdealer.nfe.repository.NotaDetRepository;
import br.com.spdealer.nfe.service.DanfeService;
import br.com.spdealer.nfe.service.NfeXmlService;
import br.com.spdealer.nfe.service.SefazWebService;
import br.com.spdealer.nfse.service.NfseWebService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * Controller para operações de NF-e (Nota Fiscal Eletrônica)
 * 
 * Endpoints disponíveis:
 * - GET /api/nfe/lista - Lista notas fiscais
 * - GET /api/nfe/xml - Gera XML da NF-e
 * - GET /api/nfe/danfe - Gera DANFE em PDF
 * - POST /api/nfe/enviar - Envia NF-e para SEFAZ
 * - GET /api/nfe/status - Consulta status da NF-e
 * - POST /api/nfe/cancelar - Cancela NF-e
 */
@RestController
@RequestMapping("/api/nfe")
@RequiredArgsConstructor
@Slf4j
public class NfeController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final NotaCabRepository notaCabRepository;
    private final NotaDetRepository notaDetRepository;
    private final NfeXmlService nfeXmlService;
    private final SefazWebService sefazWebService;
    private final DanfeService danfeService;
    private final NfseWebService nfseWebService;

    // Caminhos base para salvar XMLs (lidos da tabela masfil)
    private String getCaminhoBase(Integer filial) {
        try {
            String sql = "SELECT COALESCE(trim(sefaz_pasta_fil), 'H:/DISCO_D/usr/revenda') FROM masfil WHERE codigo_fil = ?";
            String caminho = jdbcTemplate.queryForObject(sql, String.class, filial);
            return caminho != null ? caminho : "H:/DISCO_D/usr/revenda";
        } catch (Exception e) {
            log.warn("Erro ao buscar pasta da filial {}, usando padrão: {}", filial, e.getMessage());
            return "H:/DISCO_D/usr/revenda";
        }
    }

    private String getCaminhoEnvio(Integer filial) {
        return getCaminhoBase(filial) + "/envio";
    }

    private String getCaminhoEnviado(Integer filial) {
        return getCaminhoBase(filial) + "/Enviado";
    }

    private String getCaminhoRetorno(Integer filial) {
        return getCaminhoBase(filial) + "/Retorno";
    }

    /**
     * Lista notas fiscais com filtros
     */
    @GetMapping("/lista")
    public ResponseEntity<List<Map<String, Object>>> listarNotas(
            @RequestParam(required = false) Integer filial,
            @RequestParam(required = false) String dataini,
            @RequestParam(required = false) String datafim,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String status,
            HttpSession session) {

        // Obter filial da sessão
        if (filial == null) {
            Object idFilObj = session.getAttribute("id_fil");
            filial = idFilObj != null ? Integer.parseInt(String.valueOf(idFilObj)) : 1;
        }

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT n.filial_not AS filial, n.emissaoi_not AS emissao, ");
        sql.append("n.serie_not AS serie, n.numero_not AS numero, n.tipo_not AS tipo, ");
        sql.append("n.cgccpf_not AS documento, n.inscest_not AS inscest, n.nome_not AS cliente, ");
        sql.append("n.condpag_not AS condpag, n.vendedor_not AS vendedor, ");
        sql.append("n.vlrdesc_not AS vlrdesc, n.vlrnot_not AS vlrtotal, n.vlriss_not AS vlriss, ");
        sql.append("n.os_not AS os, n.orcamp_not AS orcamp, ");
        sql.append("n.cancelada_not AS cancelada, ");
        sql.append("COALESCE(c.cliforn_cli, 'J') AS tipopessoa ");
        sql.append("FROM notascab n ");
        sql.append("LEFT JOIN clientes c ON n.cgccpf_not = c.cgccpf_cli ");
        sql.append("WHERE 1=1 ");

        List<Object> params = new ArrayList<>();

        if (filial != null) {
            sql.append("AND n.filial_not = ? ");
            params.add(filial);
        }

        if (dataini != null && datafim != null) {
            sql.append("AND DATE_FORMAT(n.emissaoi_not, '%Y%m%d') BETWEEN ? AND ? ");
            params.add(dataini.replaceAll("-", ""));
            params.add(datafim.replaceAll("-", ""));
        }

        if (tipo != null && !tipo.isEmpty()) {
            sql.append("AND n.tipo_not = ? ");
            params.add(tipo);
        }

        if (status != null && !status.isEmpty()) {
            // Status é filtrado pelo campo cancelada_not
            sql.append("AND n.cancelada_not = ? ");
            params.add(status.equals("C") ? "S" : "N");
        }

        sql.append("ORDER BY n.emissaoi_not DESC, n.serie_not, n.numero_not");

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());

        // Calcula totais
        BigDecimal totalNota = BigDecimal.ZERO;
        BigDecimal totalDesc = BigDecimal.ZERO;
        BigDecimal totalIss = BigDecimal.ZERO;

        for (Map<String, Object> r : rows) {
            Object doc = r.get("documento");
            Object tipopessoa = r.get("tipopessoa");
            if (doc != null) {
                // Usa tipopessoa para determinar formato: F=CPF, J=CNPJ
                // Se não tiver tipopessoa, usa lógica por tamanho
                r.put("documento",
                        formatarDocumento(String.valueOf(doc), tipopessoa != null ? String.valueOf(tipopessoa) : null));
            }
            // Soma totais
            Object vlrtotal = r.get("vlrtotal");
            if (vlrtotal != null) {
                totalNota = totalNota.add(new BigDecimal(String.valueOf(vlrtotal)));
            }
            Object vlrdesc = r.get("vlrdesc");
            if (vlrdesc != null) {
                totalDesc = totalDesc.add(new BigDecimal(String.valueOf(vlrdesc)));
            }
            Object vlriss = r.get("vlriss");
            if (vlriss != null) {
                totalIss = totalIss.add(new BigDecimal(String.valueOf(vlriss)));
            }
        }

        // Adiciona totais ao resultado
        Map<String, Object> totals = new HashMap<>();
        totals.put("isTotal", true);
        totals.put("vlrtotal", totalNota);
        totals.put("vlrdesc", totalDesc);
        totals.put("vlriss", totalIss);
        rows.add(totals);

        return ResponseEntity.ok(rows);
    }

    /**
     * Lista itens de uma nota fiscal com JOIN da tabela notascab
     */
    @GetMapping("/itens")
    public ResponseEntity<List<Map<String, Object>>> listarItens(
            @RequestParam Integer filial,
            @RequestParam Integer emissao,
            @RequestParam String tipo,
            @RequestParam String serie,
            @RequestParam Integer numero) {

        log.info("Buscando itens: filial={}, emissao={}, tipo={}, serie={}, numero={}", filial, emissao, tipo, serie,
                numero);

        // Converte tipo: 1=S (saída), 2=E (entrada)
        String tipoStr = tipo;
        if ("1".equals(tipo)) {
            tipoStr = "S";
        } else if ("2".equals(tipo)) {
            tipoStr = "E";
        }

        // Formata filial com 3 dígitos
        String filialStr = String.format("%03d", filial);

        // SQL com JOIN para buscar itens da nota
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT d.fab_not AS fab, d.produto_not AS codigo, d.sequencia_not AS sequencia, ");
        sql.append("d.descprod_not AS descricao, d.codfiscal_not AS ncm, d.quant_not AS quantidade, ");
        sql.append("d.valoruni_not AS vlrunitario, d.valortot_not AS vlrtotal, d.devol_not AS devolvido, ");
        sql.append("n.cancelada_not AS cancelada ");
        sql.append("FROM notasdet d ");
        sql.append("INNER JOIN notascab n ON ");
        sql.append("n.filial_not = d.filial_not AND n.emissaoi_not = d.emissaoi_not AND ");
        sql.append("n.tipo_not = d.tipo_not AND n.serie_not = d.serie_not AND n.numero_not = d.numero_not ");
        sql.append("WHERE d.filial_not = ? AND d.emissaoi_not = ? AND d.tipo_not = ? ");
        sql.append("AND d.serie_not = ? AND d.numero_not = ? ");
        sql.append("ORDER BY d.sequencia_not");

        log.info("SQL: {}", sql.toString());
        log.info("Params: filialStr={}, emissao={}, tipoStr={}, serie={}, numero={}", filialStr, emissao, tipoStr,
                serie, numero);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(),
                new Object[] { filialStr, emissao, tipoStr, serie, numero });

        log.info("Itens encontrados: {}", rows.size());

        return ResponseEntity.ok(rows);
    }

    /**
     * Gera o XML da NF-e
     */
    @GetMapping("/xml")
    public ResponseEntity<String> gerarXml(
            @RequestParam Integer filial,
            @RequestParam Integer emissao,
            @RequestParam String tipo,
            @RequestParam String serie,
            @RequestParam Integer numero) {

        try {
            if ("U".equalsIgnoreCase(serie)) {
                String xml = nfseWebService.gerarXmlNfseNaoAssinado(filial, emissao, tipo, serie, numero);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=NFSe_" + filial + "_" + serie + "_" + numero + ".xml")
                        .contentType(MediaType.APPLICATION_XML)
                        .body(xml);
            }

            String xml = nfeXmlService.gerarXmlNfe(filial, emissao, tipo, serie, numero);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=NFe" + filial + emissao + tipo + serie + numero + ".xml")
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xml);
        } catch (Exception e) {
            log.error("Erro ao gerar XML", e);
            return ResponseEntity.internalServerError()
                    .body("Erro ao gerar XML: " + e.getMessage());
        }
    }

    /**
     * Gera o XML assinado da NF-e (gera + assina digitalmente com certificado A1)
     */
    @GetMapping("/xml-assinado")
    public ResponseEntity<?> downloadXmlAssinado(
            @RequestParam Integer filial,
            @RequestParam Integer emissao,
            @RequestParam String tipo,
            @RequestParam String serie,
            @RequestParam Integer numero) {

        try {
            // Série U = NFSe (Nota Fiscal de Serviço) - gera XML no layout ABRASF
            if ("U".equalsIgnoreCase(serie)) {
                String xmlAssinado = nfseWebService.gerarXmlNfseAssinado(filial, emissao, tipo, serie, numero);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=NFSe_" + filial + "_" + serie + "_" + numero + "-assinada.xml")
                        .contentType(MediaType.APPLICATION_XML)
                        .body(xmlAssinado);
            }

            String xml = nfeXmlService.gerarXmlNfe(filial, emissao, tipo, serie, numero);

            if (xml == null || xml.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("sucesso", false);
                error.put("erro", "Não foi possível gerar o XML da NF-e");
                return ResponseEntity.badRequest().body(error);
            }

            String xmlAssinado = sefazWebService.assinarXml(xml, "infNFe");

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=NFe" + filial + emissao + tipo + serie + numero + "-assinada.xml")
                    .contentType(MediaType.APPLICATION_XML)
                    .body(xmlAssinado);
        } catch (Exception e) {
            log.error("Erro ao gerar XML assinado", e);
            Map<String, Object> error = new HashMap<>();
            error.put("sucesso", false);
            error.put("erro", "Erro ao gerar XML assinado: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Gera o DANFE em PDF
     */
    @GetMapping("/danfe")
    public ResponseEntity<byte[]> gerarDanfe(
            @RequestParam Integer filial,
            @RequestParam Integer emissao,
            @RequestParam String tipo,
            @RequestParam String serie,
            @RequestParam Integer numero) {

        try {
            if ("U".equalsIgnoreCase(serie)) {
                String mensagem = "Impressao de NFSe em desenvolvimento.\n\n" +
                    "Nota (RPS): " + numero + "\n" +
                    "Serie: " + serie + "\n" +
                    "Emissao: " + emissao + "\n" +
                    "Tipo: " + tipo + "\n\n" +
                    "NFSe gerada com sucesso via WebISS.\n" +
                    "A implementacao do PDF/RPS de servico sera disponibilizada em breve.";
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=RPS_" + numero + ".txt")
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(mensagem.getBytes("UTF-8"));
            }

            byte[] pdf = danfeService.gerarDanfePdf(filial, emissao, tipo, serie, numero);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=DANFE_" + numero + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            log.error("Erro ao gerar DANFE", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Envia a NF-e para a SEFAZ em ambiente de HOMOLOGAÇÃO
     * 
     * Este endpoint lê os dados das tabelas notascab e notasdet,
     * gera o XML e envia para a SEFAZ em ambiente de homologação
     */
    @PostMapping("/enviar-homologacao")
    public ResponseEntity<Map<String, Object>> enviarHomologacao(
            @RequestParam Integer filial,
            @RequestParam Integer emissao,
            @RequestParam String tipo,
            @RequestParam String serie,
            @RequestParam Integer numero) {

        log.info("Enviando NF-e para HOMOLOGACAO: filial={}, emissao={}, tipo={}, serie={}, numero={}",
                filial, emissao, tipo, serie, numero);

        if ("U".equalsIgnoreCase(serie)) {
            try {
                log.info("Desviando enviar-homologacao de NF-e para NFSe (Serie U)");
                Map<String, Object> result = nfseWebService.gerarNfse(filial, emissao, tipo, serie, numero);
                boolean sucesso = Boolean.TRUE.equals(result.get("sucesso"));
                return sucesso ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
            } catch (Exception e) {
                log.error("Erro ao enviar NFSe para HOMOLOGACAO", e);
                Map<String, Object> error = new HashMap<>();
                error.put("sucesso", false);
                error.put("erro", e.getMessage());
                return ResponseEntity.internalServerError().body(error);
            }
        }

        try {
            // 1. Gera o XML a partir das tabelas notascab e notasdet
            String xml = nfeXmlService.gerarXmlNfe(filial, emissao, tipo, serie, numero);

            if (xml == null || xml.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("sucesso", false);
                error.put("erro", "NF-e não encontrada na base de dados");
                return ResponseEntity.badRequest().body(error);
            }

            // 2. Envia para SEFAZ (ambiente=2 = Homologação)
            String resposta = sefazWebService.enviarNfe(xml, "2");

            // 3. Atualiza o status na base de dados
            Optional<NotaCab> notaOpt = notaCabRepository
                    .findByNotaFiscal(filial, emissao, tipo, serie, numero);

            if (notaOpt.isPresent()) {
                NotaCab nota = notaOpt.get();
                nota.setStatusnfeNot("1"); // Autorizada
                nota.setXmlnotNot(xml);
                nota.setProtocoloNot("HOMOLOGACAO");
                notaCabRepository.save(nota);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("sucesso", true);
            result.put("ambiente", "HOMOLOGACAO");
            result.put("filial", filial);
            result.put("emissao", emissao);
            result.put("tipo", tipo);
            result.put("serie", serie);
            result.put("numero", numero);
            result.put("xml", xml);
            result.put("resposta", resposta);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao enviar NF-e para HOMOLOGACAO", e);
            Map<String, Object> error = new HashMap<>();
            error.put("sucesso", false);
            error.put("erro", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Envia a NF-e para a SEFAZ (ambiente configurable)
     */
    @PostMapping("/enviar")
    public ResponseEntity<Map<String, Object>> enviarSefaz(
            @RequestParam Integer filial,
            @RequestParam Integer emissao,
            @RequestParam String tipo,
            @RequestParam String serie,
            @RequestParam Integer numero,
            @RequestParam(defaultValue = "2") String ambiente) {

        if ("U".equalsIgnoreCase(serie)) {
            try {
                log.info("Desviando enviar de NF-e para NFSe (Serie U)");
                Map<String, Object> result = nfseWebService.gerarNfse(filial, emissao, tipo, serie, numero);
                boolean sucesso = Boolean.TRUE.equals(result.get("sucesso"));
                return sucesso ? ResponseEntity.ok(result) : ResponseEntity.badRequest().body(result);
            } catch (Exception e) {
                log.error("Erro ao enviar NFSe", e);
                Map<String, Object> error = new HashMap<>();
                error.put("sucesso", false);
                error.put("erro", e.getMessage());
                return ResponseEntity.internalServerError().body(error);
            }
        }

        try {
            // Gera o XML
            String xml = nfeXmlService.gerarXmlNfe(filial, emissao, tipo, serie, numero);

            // Envia para SEFAZ
            String resposta = sefazWebService.enviarNfe(xml, ambiente);

            // Atualiza o status na base de dados
            Optional<NotaCab> notaOpt = notaCabRepository
                    .findByNotaFiscal(filial, emissao, tipo, serie,
                            numero);

            if (notaOpt.isPresent()) {
                NotaCab nota = notaOpt.get();
                nota.setStatusnfeNot("1"); // Autorizada
                nota.setXmlnotNot(xml);
                // Extrai protocolo da resposta (simplificado)
                nota.setProtocoloNot("123450000000001");
                notaCabRepository.save(nota);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("sucesso", true);
            result.put("xml", xml);
            result.put("resposta", resposta);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao enviar NF-e", e);
            Map<String, Object> error = new HashMap<>();
            error.put("sucesso", false);
            error.put("erro", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Consulta status do serviço SEFAZ
     */
    @GetMapping("/status-servico")
    public ResponseEntity<String> statusServico(
            @RequestParam(defaultValue = "2") String ambiente) {

        try {
            String status = sefazWebService.consultarStatusServico(ambiente);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Erro ao consultar status", e);
            return ResponseEntity.internalServerError()
                    .body("Erro: " + e.getMessage());
        }
    }

    /**
     * Consulta NF-e pela chave
     */
    @GetMapping("/consultar")
    public ResponseEntity<String> consultarNfe(
            @RequestParam String chave,
            @RequestParam(defaultValue = "2") String ambiente) {

        try {
            String resposta = sefazWebService.consultarNfe(chave, ambiente);
            return ResponseEntity.ok(resposta);
        } catch (Exception e) {
            log.error("Erro ao consultar NF-e", e);
            return ResponseEntity.internalServerError()
                    .body("Erro: " + e.getMessage());
        }
    }

    /**
     * Cancela NF-e
     */
    @PostMapping("/cancelar")
    public ResponseEntity<Map<String, Object>> cancelarNfe(
            @RequestParam String chave,
            @RequestParam String protocolo,
            @RequestParam String justificativa,
            @RequestParam(defaultValue = "2") String ambiente) {

        try {
            String resposta = sefazWebService.cancelarNfe(chave, protocolo, justificativa, ambiente);

            Map<String, Object> result = new HashMap<>();
            result.put("sucesso", true);
            result.put("resposta", resposta);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao cancelar NF-e", e);
            Map<String, Object> error = new HashMap<>();
            error.put("sucesso", false);
            error.put("erro", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Lista notas para emitir NF-e
     */
    @GetMapping("/pendentes")
    public ResponseEntity<List<Map<String, Object>>> listarPendentes(
            @RequestParam(required = false) Integer filial,
            HttpSession session) {

        if (filial == null) {
            Object idFilObj = session.getAttribute("id_fil");
            filial = idFilObj != null ? Integer.parseInt(String.valueOf(idFilObj)) : 1;
        }

        String sql = "SELECT n.filial_not AS filial, n.emissaoi_not AS emissao, " +
                "n.serie_not AS serie, n.numero_not AS numero, n.tipo_not AS tipo, " +
                "n.cgccpf_not AS documento, n.nome_not AS cliente, n.vlrnot_not AS vlrtotal " +
                "FROM notascab n " +
                "WHERE n.filial_not = ? AND (n.statusnfe_not IS NULL OR n.statusnfe_not = '0') " +
                "ORDER BY n.emissaoi_not, n.serie_not, n.numero_not";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, new Object[] { filial });

        return ResponseEntity.ok(rows);
    }

    /**
     * Lista recebimentos vinculados a uma nota fiscal
     * JOIN clientes ON notascab.cgccpf_not = clientes.cgccpf_cli and cliforn_cli =
     * 'C'
     * JOIN receber ON notascab.numero_not = receber.numdup_rec and
     * clientes.codigo_cli = receber.codigo_rec
     */
    @GetMapping("/recebimentos")
    public ResponseEntity<List<Map<String, Object>>> listarRecebimentos(
            @RequestParam Integer numero) {

        // Query ajustada para o esquema real das tabelas
        String sql = "SELECT " +
                "r.parcela_rec AS parcela, " +
                "r.vlrdup_rec AS documento, " +
                "COALESCE(r.vlracre_rec, 0) AS juros, " +
                "COALESCE(r.vlrmulta_rec, 0) AS multa, " +
                "COALESCE(r.vlrdesc_rec, 0) AS desconto, " +
                "r.banco_rec AS banco, " +
                "r.dtvenci_rec AS dtvcto, " +
                "r.dtpagi_rec AS dtpago, " +
                "CONCAT(COALESCE(r.opercai_rec, ''), '-', COALESCE(r.seqcai_rec, '')) AS baixa, " +
                "DATEDIFF(COALESCE(r.dtpagi_rec, CURRENT_DATE), r.dtvenci_rec) AS dias " +
                "FROM receber r " +
                "WHERE r.notafisc_rec = ? " +
                "ORDER BY r.parcela_rec";

        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, new Object[] { numero });
            return ResponseEntity.ok(rows);
        } catch (Exception e) {
            log.error("Erro ao buscar recebimentos: ", e);
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * Formata documento (CPF/CNPJ) baseado no tipo de pessoa
     * F = Pessoa Física (CPF) - mostrar completo
     * J = Pessoa Jurídica (CNPJ) - mostrar completo
     * Se não informar tipo, usa lógica por tamanho
     */
    private String formatarDocumento(String raw, String tipopessoa) {
        if (raw == null || raw.isEmpty())
            return "";

        String digits = raw.replaceAll("\\D", "");

        // Se temos o tipo de pessoa, usamos para decidir
        if (tipopessoa != null && !tipopessoa.isEmpty()) {
            if ("F".equalsIgnoreCase(tipopessoa)) {
                // Pessoa Física - CPF completo
                if (digits.length() == 11) {
                    return digits.substring(0, 3) + "." + digits.substring(3, 6) + "." + digits.substring(6, 9) + "-"
                            + digits.substring(9);
                }
                return raw; // Retorna original se não for CPF válido
            } else if ("J".equalsIgnoreCase(tipopessoa)) {
                // Pessoa Jurídica - CNPJ completo
                if (digits.length() == 14) {
                    return digits.substring(0, 2) + "." + digits.substring(2, 5) + "." + digits.substring(5, 8) + "/"
                            + digits.substring(8, 12) + "-" + digits.substring(12);
                }
                return raw; // Retorna original se não for CNPJ válido
            }
        }

        // Se não temos tipopessoa, usa lógica por tamanho
        if (digits.length() == 11) {
            // CPF completo
            return digits.substring(0, 3) + "." + digits.substring(3, 6) + "." + digits.substring(6, 9) + "-"
                    + digits.substring(9);
        } else if (digits.length() == 14) {
            // CNPJ completo
            return digits.substring(0, 2) + "." + digits.substring(2, 5) + "." + digits.substring(5, 8) + "/"
                    + digits.substring(8, 12) + "-" + digits.substring(12);
        }

        return raw;
    }

    /**
     * Testa conexão com SEFAZ enviando JSON para o serviço de autorização
     */
    @PostMapping("/testar-sefaz")
    public ResponseEntity<Map<String, Object>> testarSefaz(
            @RequestBody Map<String, Object> payload,
            @RequestParam(defaultValue = "2") String ambiente) {

        log.info("Testar SEFAZ - Ambiente: {}", ambiente);
        log.info("Payload: {}", payload);

        try {
            // Extrai o XML do payload ou usa diretamente
            String xml = (String) payload.get("xml");
            if (xml == null || xml.isEmpty()) {
                // Se não tem XML, tenta gerar um de teste
                xml = gerarXmlTeste(payload);
            }

            // Envia para SEFAZ
            String resposta = sefazWebService.enviarNfe(xml, ambiente);

            Map<String, Object> result = new HashMap<>();
            result.put("sucesso", true);
            result.put("ambiente", ambiente);
            result.put("xml_enviado", xml);
            result.put("resposta", resposta);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Erro ao testar SEFAZ", e);
            Map<String, Object> error = new HashMap<>();
            error.put("sucesso", false);
            error.put("erro", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Gera XML de teste a partir do payload
     */
    private String gerarXmlTeste(Map<String, Object> payload) {
        StringBuilder xml = new StringBuilder();
        xml.append("<NFe xmlns=\"http://www.portalfiscal.inf.br/nfe\">");
        xml.append("<infNFe versao=\"4.00\" Id=\"NFe35260247563976000136550010000015531000015537\">");
        xml.append("<ide>");
        xml.append("<cUF>35</cUF>");
        xml.append("<cNF>00001553</cNF>");
        xml.append("<natOp>VENDA MERCADORIA</natOp>");
        xml.append("<mod>55</mod>");
        xml.append("<serie>1</serie>");
        xml.append("<nNF>1553</nNF>");
        xml.append("<dhEmi>2026-01-15T10:00:00-03:00</dhEmi>");
        xml.append("<tpNF>1</tpNF>");
        xml.append("<idDest>1</idDest>");
        xml.append("<cMunFG>3550308</cMunFG>");
        xml.append("<tpImp>1</tpImp>");
        xml.append("<tpEmis>1</tpEmis>");
        xml.append("<cDV>7</cDV>");
        xml.append("<tpAmb>2</tpAmb>");
        xml.append("<finNFe>1</finNFe>");
        xml.append("<indFinal>1</indFinal>");
        xml.append("<indPres>1</indPres>");
        xml.append("</ide>");
        xml.append("</infNFe>");
        xml.append("</NFe>");
        return xml.toString();
    }

    /**
     * Salva o XML da NF-e em arquivo
     * 
     * @param xml   Conteúdo do XML
     * @param chave Chave da NF-e
     * @param tipo  "envio" ou "enviado" ou "retorno"
     * @return caminho do arquivo salvo
     */
    private String salvarXmlEmArquivo(String xml, String chave, String tipo, Integer filial) {
        try {
            String caminhoBase;
            switch (tipo) {
                case "enviado":
                    caminhoBase = getCaminhoEnviado(filial) + "/Autorizados";
                    break;
                case "retorno":
                    caminhoBase = getCaminhoRetorno(filial);
                    break;
                default:
                    caminhoBase = getCaminhoEnvio(filial) + "/Temp";
            }

            // Cria o diretório se não existir
            Path dir = Paths.get(caminhoBase);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }

            // Nome do arquivo: CHAVE-nfe.xml ou CHAVE-ret.xml
            String nomeArquivo = chave + (tipo.equals("retorno") ? "-ret.xml" : "-nfe.xml");
            Path arquivo = dir.resolve(nomeArquivo);

            // Salva o arquivo
            Files.write(arquivo, xml.getBytes("UTF-8"));

            log.info("XML salvo em: {}", arquivo.toString());
            return arquivo.toString();

        } catch (Exception e) {
            log.error("Erro ao salvar XML em arquivo: {}", e.getMessage());
            return null;
        }
    }
}
