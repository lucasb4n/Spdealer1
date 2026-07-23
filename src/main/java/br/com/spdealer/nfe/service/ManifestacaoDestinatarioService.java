package br.com.spdealer.nfe.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Serviço para Manifestação do Destinatário e download de NF-e de fornecedores
 * 
 * Fluxo:
 * 1. Consulta NFeDistribuicaoDFe para encontrar NF-e emitidas contra nossa empresa
 * 2. Realiza Manifestação do Destinatário (Confirmação da Operação)
 * 3. Baixa o XML completo após manifestação
 * 4. Armazena em xmlnotacab, xmlnotadet, xmlpagar
 * 
 * Usa JDBC direto com nomes de colunas reais do banco de dados SpDealer
 */
@Service
@Slf4j
public class ManifestacaoDestinatarioService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private SefazWebService sefazWebService;

    /**
     * Tipos de manifestação
     */
    public static final String MANIFESTACAO_CONFIRMAR = "210200"; // Confirmação da Operação
    public static final String MANIFESTACAO_DESCONHECIDO = "210220"; // Desconhecida
    public static final String MANIFESTACAO_NAO_REALIZADA = "210240"; // Não Realizada

    /**
     * Consulta NF-e distribuídas pela SEFAZ para nosso CNPJ
     */
    public List<String> consultarNfeDistribuidas(String cnpj, String ambiente) {
        log.info("Consultando NF-e distribuídas para CNPJ: {}, ambiente: {}", cnpj, ambiente);

        List<String> chavesNfe = new ArrayList<>();

        try {
            String tpAmb = ("P".equalsIgnoreCase(ambiente) || "1".equals(ambiente)) ? "1" : "2";
            String ultimoNsu = "000000000000000";
            try {
                String resNsu = jdbcTemplate.queryForObject(
                    "SELECT ultimo_nsu FROM sefaz_controle_nsu WHERE cnpj = ?",
                    String.class, cnpj);
                if (resNsu != null && !resNsu.trim().isEmpty()) {
                    ultimoNsu = String.format("%015d", Long.parseLong(resNsu.trim()));
                }
            } catch (Exception e) {
                // Tabela sefaz_controle_nsu opcional, prossegue com 000000000000000
            }

            StringBuilder soap = new StringBuilder();
            soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            soap.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:nfe=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe\">\n");
            soap.append("  <soap:Header/>\n");
            soap.append("  <soap:Body>\n");
            soap.append("    <nfe:nfeDistDFeInteresse>\n");
            soap.append("      <nfe:nfeDadosMsg>\n");
            soap.append("        <distDFeInt versao=\"1.01\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
            soap.append("          <tpAmb>").append(tpAmb).append("</tpAmb>\n");
            soap.append("          <cUFAutor>35</cUFAutor>\n");
            soap.append("          <CNPJ>").append(cnpj).append("</CNPJ>\n");
            soap.append("          <distNSU>\n");
            soap.append("            <ultNSU>").append(ultimoNsu).append("</ultNSU>\n");
            soap.append("          </distNSU>\n");
            soap.append("        </distDFeInt>\n");
            soap.append("      </nfe:nfeDadosMsg>\n");
            soap.append("    </nfe:nfeDistDFeInteresse>\n");
            soap.append("  </soap:Body>\n");
            soap.append("</soap:Envelope>");

            String resposta = sefazWebService.consultarDistribuicao(soap.toString(), ambiente);
            atualizarNsu(resposta, cnpj);
            chavesNfe = parsearChavesNfe(resposta);

            log.info("Encontradas {} NF-e distribuídas", chavesNfe.size());

        } catch (Exception e) {
            log.error("Erro ao consultar NF-e distribuídas", e);
        }

        return chavesNfe;
    }

    /**
     * Realiza a Manifestação do Destinatário
     */
    public String realizarManifestacao(String chaveNFe, String cnpj, String ambiente, String tipoManifestacao) {
        log.info("Realizando manifestação {} para NF-e: {}", tipoManifestacao, chaveNFe);

        try {
            String tpAmb = ("P".equalsIgnoreCase(ambiente) || "1".equals(ambiente)) ? "1" : "2";
            String descEvento = obterDescricaoManifestacao(tipoManifestacao);
            
            // ID do Evento: ID + tpEvento + chNFe + nSeqEvento (padronizado com 2 dígitos: 01)
            String idEvento = "ID" + tipoManifestacao + chaveNFe + "01";
            
            // Data do evento no formato padrão SEFAZ (ex: 2026-07-09T19:30:00-03:00)
            String dhEvento = java.time.OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX"));

            // Constrói o XML do evento a ser assinado digitalmente
            StringBuilder eventXml = new StringBuilder();
            eventXml.append("<evento xmlns=\"http://www.portalfiscal.inf.br/nfe\" versao=\"1.00\">\n");
            eventXml.append("  <infEvento Id=\"").append(idEvento).append("\">\n");
            eventXml.append("    <cOrgao>91</cOrgao>\n"); // 91 = Ambiente Nacional RFB
            eventXml.append("    <tpAmb>").append(tpAmb).append("</tpAmb>\n");
            eventXml.append("    <CNPJ>").append(cnpj).append("</CNPJ>\n");
            eventXml.append("    <chNFe>").append(chaveNFe).append("</chNFe>\n");
            eventXml.append("    <dhEvento>").append(dhEvento).append("</dhEvento>\n");
            eventXml.append("    <tpEvento>").append(tipoManifestacao).append("</tpEvento>\n");
            eventXml.append("    <nSeqEvento>1</nSeqEvento>\n");
            eventXml.append("    <verEvento>1.00</verEvento>\n");
            eventXml.append("    <detEvento versao=\"1.00\">\n");
            eventXml.append("      <descEvento>").append(descEvento).append("</descEvento>\n");
            eventXml.append("    </detEvento>\n");
            eventXml.append("  </infEvento>\n");
            eventXml.append("</evento>");

            // Assina digitalmente o XML do evento
            String eventXmlAssinado = sefazWebService.assinarXml(eventXml.toString(), "infEvento");

            // Envelopa o XML assinado em um lote <envEvento> diretamente sob nfeDadosMsg na NFe v4.00
            StringBuilder soap = new StringBuilder();
            soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            soap.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
            soap.append("  <soap:Body>\n");
            soap.append("    <nfeDadosMsg xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4\">\n");
            soap.append("      <envEvento xmlns=\"http://www.portalfiscal.inf.br/nfe\" versao=\"1.00\">\n");
            soap.append("        <idLote>1</idLote>\n");
            soap.append(eventXmlAssinado);
            soap.append("      </envEvento>\n");
            soap.append("    </nfeDadosMsg>\n");
            soap.append("  </soap:Body>\n");
            soap.append("</soap:Envelope>");

            // Envia o SOAP usando o endpoint de recepção de eventos correto
            String resposta = sefazWebService.enviarEvento(soap.toString(), ambiente);
            log.info("Resposta do registro de evento da SEFAZ: {}", resposta);
            return parsearProtocoloManifestacao(resposta);

        } catch (Exception e) {
            log.error("Erro ao realizar manifestação", e);
            return null;
        }
    }

    private String obterDescricaoManifestacao(String tipo) {
        if ("210200".equals(tipo)) return "Confirma\u00e7\u00e3o da Opera\u00e7\u00e3o";
        if ("210210".equals(tipo)) return "Ci\u00eancia da Opera\u00e7\u00e3o";
        if ("210220".equals(tipo)) return "Desconhecimento da Opera\u00e7\u00e3o";
        if ("210240".equals(tipo)) return "Opera\u00e7\u00e3o n\u00e3o Realizada";
        return "Ci\u00eancia da Opera\u00e7\u00e3o";
    }

    /**
     * Baixa e armazena o XML completo da NF-e
     */
    public void baixarXmlCompleto(String chaveNFe, String ambiente) {
        log.info("Baixando XML completo para NF-e: {}", chaveNFe);

        try {
            String cnpj = "";
            try {
                cnpj = jdbcTemplate.queryForObject("SELECT COALESCE(trim(cnpj_fil), '') FROM masfil LIMIT 1", String.class);
                if (cnpj != null) {
                    cnpj = cnpj.replaceAll("\\D", "");
                }
            } catch (Exception e) {
                log.error("Erro ao obter CNPJ da empresa para download de XML", e);
            }

            // Realiza a Ciência da Operação (tpEvento: 210210) automática antes do download para liberar o XML completo na SEFAZ
            log.info("Executando Ciência da Operação (210210) para autorizar download da chave: {}", chaveNFe);
            realizarManifestacao(chaveNFe, cnpj, ambiente, "210210");
            try { Thread.sleep(1000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }

            String tpAmb = ("P".equalsIgnoreCase(ambiente) || "1".equals(ambiente)) ? "1" : "2";
            StringBuilder soap = new StringBuilder();
            soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            soap.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:nfe=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe\">\n");
            soap.append("  <soap:Header/>\n");
            soap.append("  <soap:Body>\n");
            soap.append("    <nfe:nfeDistDFeInteresse>\n");
            soap.append("      <nfe:nfeDadosMsg>\n");
            soap.append("        <distDFeInt versao=\"1.01\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
            soap.append("          <tpAmb>").append(tpAmb).append("</tpAmb>\n");
            soap.append("          <cUFAutor>35</cUFAutor>\n");
            soap.append("          <CNPJ>").append(cnpj).append("</CNPJ>\n");
            soap.append("          <consChNFe>\n");
            soap.append("            <chNFe>").append(chaveNFe).append("</chNFe>\n");
            soap.append("          </consChNFe>\n");
            soap.append("        </distDFeInt>\n");
            soap.append("      </nfe:nfeDadosMsg>\n");
            soap.append("    </nfe:nfeDistDFeInteresse>\n");
            soap.append("  </soap:Body>\n");
            soap.append("</soap:Envelope>");

            String resposta = sefazWebService.consultarDistribuicao(soap.toString(), ambiente);
            String xmlCompleto = parsearXmlCompleto(resposta);

            if (xmlCompleto != null && !xmlCompleto.isEmpty()) {
                salvarDadosNfe(chaveNFe, xmlCompleto);
                log.info("XML salvo com sucesso para NF-e: {}", chaveNFe);
            } else {
                log.warn("XML não encontrado para NF-e: {}", chaveNFe);
            }

        } catch (Exception e) {
            log.error("Erro ao baixar XML completo", e);
        }
    }

    /**
     * Processa e salva os dados da NF-e no banco usando JDBC direto
     */
    private void salvarDadosNfe(String chaveNFe, String xmlCompleto) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(xmlCompleto.getBytes("UTF-8")));

            NodeList infNFeList = doc.getElementsByTagName("infNFe");
            if (infNFeList.getLength() == 0)
                return;

            Element infNFe = (Element) infNFeList.item(0);
            String chave = infNFe.getAttribute("Id").replace("NFe", "");

            // Remove registros antigos para evitar erros de chave primária duplicada (Duplicate Entry)
            jdbcTemplate.update("DELETE FROM xmlnotadet WHERE Id = ?", chave);
            jdbcTemplate.update("DELETE FROM xmlpagar WHERE Id = ?", chave);
            jdbcTemplate.update("DELETE FROM xmlnotacab WHERE Id = ?", chave);

            // Extrai emitente (fornecedor)
            String CNPJe = "";
            String xNomee = "";
            String IEe = "";
            String CRT = "";
            String UFe = "";
            
            NodeList emitList = doc.getElementsByTagName("emit");
            if (emitList.getLength() > 0) {
                Element emit = (Element) emitList.item(0);
                CNPJe = getElementText(emit, "CNPJ");
                xNomee = getElementText(emit, "xNome");
                IEe = getElementText(emit, "IE");
                CRT = getElementText(emit, "CRT");

                NodeList enderEmitList = doc.getElementsByTagName("enderEmit");
                if (enderEmitList.getLength() > 0) {
                    Element enderEmit = (Element) enderEmitList.item(0);
                    UFe = getElementText(enderEmit, "UF");
                }
            }

            // Extrai destinatário
            String CNPJd = "";
            String xNomed = "";
            String IEd = "";
            
            NodeList destList = doc.getElementsByTagName("dest");
            if (destList.getLength() > 0) {
                Element dest = (Element) destList.item(0);
                CNPJd = getElementText(dest, "CNPJ");
                xNomed = getElementText(dest, "xNome");
                IEd = getElementText(dest, "IE");
            }

            // Extrai identificação
            String versao = "";
            String cUF = "";
            String cNF = "";
            String natOp = "";
            String indPag = "";
            String mod = "";
            String serie = "";
            Integer nNF = null;
            String tpNF = "";
            String dhEmi = "";
            LocalDate dtmovi = null;
            
            NodeList ideList = doc.getElementsByTagName("ide");
            if (ideList.getLength() > 0) {
                Element ide = (Element) ideList.item(0);
                versao = getElementText(ide, "versao");
                cUF = getElementText(ide, "cUF");
                cNF = getElementText(ide, "cNF");
                natOp = getElementText(ide, "natOp");
                indPag = getElementText(ide, "indPag");
                mod = getElementText(ide, "mod");
                serie = getElementText(ide, "serie");
                String numNFe = getElementText(ide, "nNF");
                if (numNFe != null && !numNFe.isEmpty()) {
                    try { nNF = Integer.parseInt(numNFe); } catch (Exception e) { }                
                }
                tpNF = getElementText(ide, "tpNF");
                dhEmi = getElementText(ide, "dhEmi");
                if (dhEmi != null && dhEmi.length() >= 10) {
                    try { dtmovi = LocalDate.parse(dhEmi.substring(0, 10)); } catch (Exception e) { }                
                }
            }

            // Extrai totais
            BigDecimal vBC = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vBC"));
            BigDecimal vICMS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vICMS"));
            BigDecimal vProd = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vProd"));
            BigDecimal vNF = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vNF"));
            BigDecimal vFrete = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vFrete"));
            BigDecimal vDesc = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vDesc"));
            BigDecimal vIPI = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vIPI"));
            BigDecimal vPIS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vPIS"));
            BigDecimal vCOFINS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vCOFINS"));

            // Totais da Reforma Tributária
            BigDecimal vBCIBS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vBCIBS"));
            BigDecimal vIBS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vIBS"));
            BigDecimal vBCCBS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vBCCBS"));
            BigDecimal vCBS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vCBS"));
            BigDecimal vIS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vIS"));
            BigDecimal vSplitIBS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vSplitIBS"));
            BigDecimal vSplitCBS = parseDecimal(getElementTextByTag(doc, "ICMSTot", "vSplitCBS"));
            String indSplit = getElementTextByTag(doc, "ICMSTot", "indSplit");
            if (indSplit == null || indSplit.trim().isEmpty()) {
                indSplit = "0";
            } else {
                indSplit = indSplit.trim();
            }

            // Insere no banco - xmlnotacab
            String sqlCab = "INSERT INTO xmlnotacab (" +
                    "Id, versao, cUF, cNF, natOp, indPag, `mod`, serie, nNF, dhEmi, " +
                    "tpNF, CNPJe, xNomee, IEe, CRT, UFe, CNPJd, xNomed, IEd, " +
                    "vBC, vICMS, vProd, vFrete, vDesc, vIPI, vPIS, vCOFINS, vNF, status, dtmovi, " +
                    "vBCIBS, vIBS, vBCCBS, vCBS, vIS, vSplitIBS, vSplitCBS, indSplit" +
                    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            jdbcTemplate.update(sqlCab,
                    chave, versao, cUF, cNF, natOp, indPag, mod, serie, nNF, dhEmi,
                    tpNF, CNPJe, xNomee, IEe, CRT, UFe, CNPJd, xNomed, IEd,
                    vBC, vICMS, vProd, vFrete, vDesc, vIPI, vPIS, vCOFINS, vNF, "1", dtmovi,
                    vBCIBS, vIBS, vBCCBS, vCBS, vIS, vSplitIBS, vSplitCBS, indSplit);

            // Processa itens - xmlnotadet
            NodeList detList = doc.getElementsByTagName("det");
            for (int i = 0; i < detList.getLength(); i++) {
                Element det = (Element) detList.item(i);
                String nItemAttr = det.getAttribute("nItem");
                int nItem = 1;
                try { nItem = Integer.parseInt(nItemAttr); } catch (Exception e) { nItem = i + 1; }

                String cProd = getElementTextByTag(det, "prod", "cProd");
                String xProd = getElementTextByTag(det, "prod", "xProd");
                String NCM = getElementTextByTag(det, "prod", "NCM");
                String CFOP = getElementTextByTag(det, "prod", "CFOP");
                String uCom = getElementTextByTag(det, "prod", "uCom");
                BigDecimal qCom = parseDecimal(getElementTextByTag(det, "prod", "qCom"));
                BigDecimal vUnCom = parseDecimal(getElementTextByTag(det, "prod", "vUnCom"));
                BigDecimal vProdItem = parseDecimal(getElementTextByTag(det, "prod", "vProd"));

                // Calcula fator de conversão padrão (1:1) se uCom disponível
                BigDecimal fatorConversao = BigDecimal.ONE;

                // Extração tributos da Reforma Tributária por item
                String CSTIBS = getElementTextByTag(det, "IBS", "CST");
                BigDecimal vBCIBS_item = parseDecimal(getElementTextByTag(det, "IBS", "vBC"));
                BigDecimal pIBS_item = parseDecimal(getElementTextByTag(det, "IBS", "pIBS"));
                BigDecimal vIBS_item = parseDecimal(getElementTextByTag(det, "IBS", "vIBS"));

                String CSTCBS = getElementTextByTag(det, "CBS", "CST");
                BigDecimal vBCCBS_item = parseDecimal(getElementTextByTag(det, "CBS", "vBC"));
                BigDecimal pCBS_item = parseDecimal(getElementTextByTag(det, "CBS", "pCBS"));
                BigDecimal vCBS_item = parseDecimal(getElementTextByTag(det, "CBS", "vCBS"));

                String CSTIS = getElementTextByTag(det, "IS", "CST");
                BigDecimal vBCIS_item = parseDecimal(getElementTextByTag(det, "IS", "vBC"));
                BigDecimal pIS_item = parseDecimal(getElementTextByTag(det, "IS", "pIS"));
                BigDecimal vIS_item = parseDecimal(getElementTextByTag(det, "IS", "vIS"));

                String sqlDet = "INSERT INTO xmlnotadet (" +
                        "Id, nItem, cProd, xProd, NCM, CFOP, uCom, qCom, vUnCom, vProd, fator_conversao, " +
                        "CSTIBS, vBCIBS, pIBS, vIBS, CSTCBS, vBCCBS, pCBS, vCBS, CSTIS, vBCIS, pIS, vIS" +
                        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                jdbcTemplate.update(sqlDet,
                        chave, nItem, cProd, xProd, NCM, CFOP, uCom, qCom, vUnCom, vProdItem, fatorConversao,
                        CSTIBS, vBCIBS_item, pIBS_item, vIBS_item, CSTCBS, vBCCBS_item, pCBS_item, vCBS_item, CSTIS, vBCIS_item, pIS_item, vIS_item);
            }

            // Processa duplicatas - xmlpagar
            NodeList dupList = doc.getElementsByTagName("dup");
            for (int i = 0; i < dupList.getLength(); i++) {
                Element dup = (Element) dupList.item(i);
                
                String nDup = getElementText(dup, "nDup");
                String dVencStr = getElementText(dup, "dVenc");
                LocalDate dVenc = null;
                try { if (dVencStr != null && dVencStr.length() >= 10) dVenc = LocalDate.parse(dVencStr.substring(0, 10)); } catch (Exception e) { }
                BigDecimal vDup = parseDecimal(getElementText(dup, "vDup"));

                // Lógica de Retenção Proporcional do Split Payment
                BigDecimal vRetencaoIBS = BigDecimal.ZERO;
                BigDecimal vRetencaoCBS = BigDecimal.ZERO;
                BigDecimal vLiquidoFornecedor = vDup;

                if ("1".equals(indSplit) && vNF != null && vNF.compareTo(BigDecimal.ZERO) > 0 && vDup != null) {
                    BigDecimal fatorParcela = vDup.divide(vNF, 6, java.math.RoundingMode.HALF_UP);
                    if (vSplitIBS != null) {
                        vRetencaoIBS = vSplitIBS.multiply(fatorParcela).setScale(2, java.math.RoundingMode.HALF_UP);
                    }
                    if (vSplitCBS != null) {
                        vRetencaoCBS = vSplitCBS.multiply(fatorParcela).setScale(2, java.math.RoundingMode.HALF_UP);
                    }
                    vLiquidoFornecedor = vDup.subtract(vRetencaoIBS.add(vRetencaoCBS));
                }

                String sqlDup = "INSERT INTO xmlpagar (" +
                        "Id, parc, nDup, dVenc, vDup, vRetencaoIBS, vRetencaoCBS, vLiquidoFornecedor" +
                        ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

                jdbcTemplate.update(sqlDup,
                        chave, i + 1, nDup, dVenc, vDup, vRetencaoIBS, vRetencaoCBS, vLiquidoFornecedor);
            }

            log.info("NF-e {} processada com sucesso: {} itens, {} duplicatas", 
                    chave, detList.getLength(), dupList.getLength());

        } catch (Exception e) {
            log.error("Erro ao salvar dados da NF-e", e);
        }
    }

    private void atualizarNsu(String resposta, String cnpj) {
        if (resposta == null || resposta.isEmpty()) return;
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(resposta.getBytes("UTF-8")));

            String ultNsu = "";
            NodeList ultNsuList = doc.getElementsByTagName("ultNSU");
            if (ultNsuList.getLength() > 0) {
                ultNsu = ultNsuList.item(0).getTextContent();
            }

            if (ultNsu != null && !ultNsu.trim().isEmpty() && !ultNsu.equals("000000000000000")) {
                ultNsu = ultNsu.trim();
                log.info("Atualizando ultimo_nsu para: {}", ultNsu);
                String sql = "INSERT INTO sefaz_controle_nsu (cnpj, ultimo_nsu) VALUES (?, ?) " +
                             "ON DUPLICATE KEY UPDATE ultimo_nsu = ?, atualizado_em = CURRENT_TIMESTAMP";
                jdbcTemplate.update(sql, cnpj, ultNsu, ultNsu);
            }
        } catch (Exception e) {
            log.error("Erro ao atualizar NSU no banco de dados", e);
        }
    }

    private List<String> parsearChavesNfe(String resposta) {
        List<String> chaves = new ArrayList<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(resposta.getBytes("UTF-8")));

            NodeList zipList = doc.getElementsByTagName("docZip");
            if (zipList.getLength() > 0) {
                for (int i = 0; i < zipList.getLength(); i++) {
                    String content = zipList.item(i).getTextContent();
                    if (content != null) {
                        content = content.trim();
                        if (content.matches("\\d{44}")) {
                            chaves.add(content);
                            continue;
                        }
                        String xml = "";
                        if (content.startsWith("<")) {
                            xml = content;
                        } else if (!content.isEmpty()) {
                            try {
                                byte[] decoded = java.util.Base64.getDecoder().decode(content);
                                try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(decoded);
                                     java.util.zip.GZIPInputStream gzis = new java.util.zip.GZIPInputStream(bais);
                                     java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
                                    byte[] buffer = new byte[1024];
                                    int len;
                                    while ((len = gzis.read(buffer)) > 0) {
                                        baos.write(buffer, 0, len);
                                    }
                                    xml = baos.toString("UTF-8");
                                }
                            } catch (Exception ex) {
                                log.warn("Erro ao descompactar docZip, tentando tratar como chave: {}", ex.getMessage());
                                if (content.length() == 44) {
                                    xml = "";
                                    chaves.add(content);
                                }
                            }
                        }
                        if (xml != null && !xml.isEmpty()) {
                            String chave = extrairChaveAcesso(xml);
                            if (chave != null && !chave.isEmpty()) {
                                chaves.add(chave);
                            }
                        }
                    }
                }
            }

            NodeList chaveList = doc.getElementsByTagName("chNFe");
            for (int i = 0; i < chaveList.getLength(); i++) {
                String chave = chaveList.item(i).getTextContent();
                if (chave != null && !chave.isEmpty() && !chaves.contains(chave)) {
                    chaves.add(chave);
                }
            }
        } catch (Exception e) {
            log.error("Erro ao parsear chaves", e);
        }
        return chaves;
    }

    private String parsearProtocoloManifestacao(String resposta) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(resposta.getBytes("UTF-8")));

            NodeList protList = doc.getElementsByTagName("nProt");
            if (protList.getLength() > 0) {
                return protList.item(0).getTextContent();
            }
        } catch (Exception e) {
            log.error("Erro ao parsear protocolo", e);
        }
        return "";
    }

    private String parsearXmlCompleto(String resposta) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(resposta.getBytes("UTF-8")));

            NodeList zipList = doc.getElementsByTagName("docZip");
            if (zipList.getLength() > 0) {
                String content = zipList.item(0).getTextContent();
                if (content != null) {
                    content = content.trim();
                    if (content.startsWith("<")) {
                        return content;
                    } else if (!content.isEmpty()) {
                        byte[] decoded = java.util.Base64.getDecoder().decode(content);
                        try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(decoded);
                             java.util.zip.GZIPInputStream gzis = new java.util.zip.GZIPInputStream(bais);
                             java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
                            byte[] buffer = new byte[1024];
                            int len;
                            while ((len = gzis.read(buffer)) > 0) {
                                baos.write(buffer, 0, len);
                            }
                            return baos.toString("UTF-8");
                        }
                    }
                }
            }

            NodeList xmlList = doc.getElementsByTagName("nfeProc");
            if (xmlList.getLength() > 0) {
                return nodeToString(xmlList.item(0));
            }
            
            NodeList nfeList = doc.getElementsByTagName("NFe");
            if (nfeList.getLength() > 0) {
                return nodeToString(nfeList.item(0));
            }
        } catch (Exception e) {
            log.error("Erro ao parsear XML completo", e);
        }
        return "";
    }

    private String getElementText(Element parent, String tagName) {
        NodeList nodeList = parent.getElementsByTagName(tagName);
        if (nodeList.getLength() > 0) {
            return nodeList.item(0).getTextContent();
        }
        return "";
    }

    private String getElementTextByTag(org.w3c.dom.Document doc, String parentTag, String tagName) {
        NodeList parentList = doc.getElementsByTagName(parentTag);
        if (parentList.getLength() > 0) {
            Element parent = (Element) parentList.item(0);
            return getElementText(parent, tagName);
        }
        return "";
    }

    private String getElementTextByTag(Element parent, String parentTag, String tagName) {
        NodeList parentList = parent.getElementsByTagName(parentTag);
        if (parentList.getLength() > 0) {
            Element child = (Element) parentList.item(0);
            return getElementText(child, tagName);
        }
        return "";
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.isEmpty())
            return null;
        try {
            return new BigDecimal(value.replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String nodeToString(org.w3c.dom.Node node) {
        try {
            java.io.StringWriter writer = new java.io.StringWriter();
            javax.xml.transform.Transformer transformer = javax.xml.transform.TransformerFactory.newInstance().newTransformer();
            transformer.setOutputProperty(javax.xml.transform.OutputKeys.OMIT_XML_DECLARATION, "yes");
            transformer.setOutputProperty(javax.xml.transform.OutputKeys.INDENT, "no");
            transformer.transform(new javax.xml.transform.dom.DOMSource(node), new javax.xml.transform.stream.StreamResult(writer));
            return writer.toString();
        } catch (Exception e) {
            log.error("Erro ao converter XML Node para String", e);
            return "";
        }
    }

    private String extrairChaveAcesso(String xml) {
        if (xml == null || xml.isEmpty()) return "";
        try {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("<chNFe>([^<]+)</chNFe>");
            java.util.regex.Matcher matcher = pattern.matcher(xml);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
            
            java.util.regex.Pattern patternId = java.util.regex.Pattern.compile("infNFe\\s+Id=\"NFe(\\d{44})\"");
            java.util.regex.Matcher matcherId = patternId.matcher(xml);
            if (matcherId.find()) {
                return matcherId.group(1).trim();
            }
        } catch (Exception e) {
            log.error("Erro ao extrair chave de acesso do XML", e);
        }
        return "";
    }
}
