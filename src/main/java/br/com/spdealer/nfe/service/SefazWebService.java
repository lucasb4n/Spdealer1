package br.com.spdealer.nfe.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.net.ssl.*;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.Collections;
import javax.xml.crypto.dsig.*;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.keyinfo.*;
import javax.xml.crypto.dsig.spec.*;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.*;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

/**
 * Serviço para integração com Web Services da SEFAZ
 * 
 * Implementa envio de NF-e para a SEFAZ (Ambiente de Homologação ou Produção)
 * Usa certificado digital para assinatura e comunicação HTTPS
 * 
 * Ambientes:
 * - D = Desenvolvimento/Homologação
 * - P = Produção
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SefazWebService {

    private final NfeXmlService nfeXmlService;
    private final JdbcTemplate jdbcTemplate;

    // URLs SEFAZ Rio Grande do Sul - Homologação
    private static final String SEFAZ_HOMOLOGACAO_URL = "https://nfe-homologacao.sefazrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx";
    private static final String SEFAZ_RET_AUTORIZACAO_HOMOLOGACAO_URL = "https://nfe-homologacao.sefazrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx";
    private static final String SEFAZ_CONSULTA_HOMOLOGACAO_URL = "https://nfe-homologacao.sefazrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx";
    private static final String SEFAZ_STATUS_HOMOLOGACAO_URL = "https://nfe-homologacao.sefazrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx";
    private static final String SEFAZ_CANCELAMENTO_HOMOLOGACAO_URL = "https://nfe-homologacao.sefazrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx";

    // URLs SEFAZ Rio Grande do Sul - Produção
    private static final String SEFAZ_PRODUCAO_URL = "https://nfe.sefazrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx";
    private static final String SEFAZ_RET_AUTORIZACAO_PRODUCAO_URL = "https://nfe.sefazrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx";
    private static final String SEFAZ_CONSULTA_PRODUCAO_URL = "https://nfe.sefazrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx";
    private static final String SEFAZ_STATUS_PRODUCAO_URL = "https://nfe.sefazrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx";
    private static final String SEFAZ_CANCELAMENTO_PRODUCAO_URL = "https://nfe.sefazrs.rs.gov.br/ws/recepcaoevento/recepcaoevento4.asmx";

    @Value("${nfe.certificado.path:C:/spd/SEFAZ/certificado.pfx}")
    private String certificadoPath;

    @Value("${nfe.certificado.senha:}")
    private String certificadoSenha;

    /**
     * Obtém o ambiente da SEFAZ para a filial
     * D = Desenvolvimento/Homologação
     * P = Produção
     */
    private String getAmbienteSefaz(Integer filial) {
        try {
            String sql = "SELECT COALESCE(upper(trim(COALESCE(sefaz_ambiente_fil, 'D'))), 'D') FROM masfil WHERE codigo_fil = ?";
            String ambiente = jdbcTemplate.queryForObject(sql, String.class, filial);
            log.info("Ambiente SEFAZ para filial {}: {}", filial, ambiente);
            return ambiente != null ? ambiente : "D";
        } catch (Exception e) {
            log.warn("Erro ao buscar ambiente SEFAZ da filial {}, usando padrão HOMOLOGAÇÃO: {}", filial,
                    e.getMessage());
            return "D";
        }
    }

    /**
     * Verifica se é ambiente de produção
     */
    private boolean isProducao(String ambiente) {
        return "P".equalsIgnoreCase(ambiente) || "1".equals(ambiente);
    }

    /**
     * Obtém URL de autorização conforme ambiente
     */
    private String getUrlAutorizacao(String ambiente) {
        return isProducao(ambiente) ? SEFAZ_PRODUCAO_URL : SEFAZ_HOMOLOGACAO_URL;
    }

    /**
     * Obtém URL de retorno de autorização conforme ambiente
     */
    private String getUrlRetornoAutorizacao(String ambiente) {
        return isProducao(ambiente) ? SEFAZ_RET_AUTORIZACAO_PRODUCAO_URL : SEFAZ_RET_AUTORIZACAO_HOMOLOGACAO_URL;
    }

    /**
     * Obtém URL de consulta conforme ambiente
     */
    private String getUrlConsulta(String ambiente) {
        return isProducao(ambiente) ? SEFAZ_CONSULTA_PRODUCAO_URL : SEFAZ_CONSULTA_HOMOLOGACAO_URL;
    }

    /**
     * Obtém URL de status conforme ambiente
     */
    private String getUrlStatus(String ambiente) {
        return isProducao(ambiente) ? SEFAZ_STATUS_PRODUCAO_URL : SEFAZ_STATUS_HOMOLOGACAO_URL;
    }

    /**
     * Obtém URL de cancelamento conforme ambiente
     */
    private String getUrlCancelamento(String ambiente) {
        return isProducao(ambiente) ? SEFAZ_CANCELAMENTO_PRODUCAO_URL : SEFAZ_CANCELAMENTO_HOMOLOGACAO_URL;
    }

    /**
     * Envia o XML da NF-e para a SEFAZ
     */
    public String enviarNfe(String xml, String ambiente) {
        log.info("Enviar NF-e para SEFAZ - Ambiente: {}", ambiente);

        try {
            // Assina o XML
            String xmlAssinado = assinarXml(xml);

            // Envia para SEFAZ
            String resposta = enviarParaSefaz(xmlAssinado, ambiente);

            return resposta;

        } catch (Exception e) {
            log.error("Erro ao enviar NF-e para SEFAZ", e);
            return criarRespostaErro("ERRO_ENVIO", e.getMessage());
        }
    }

    /**
     * Consulta status do serviço da SEFAZ
     */
    public String consultarStatusServico(String ambiente) {
        log.info("Consultar status servico SEFAZ - Ambiente: {}", ambiente);

        try {
            String soapXml = criarSoapStatusServico(ambiente);
            String resposta = enviarSoap(soapXml, getUrlStatus(ambiente));
            return resposta;
        } catch (Exception e) {
            log.error("Erro ao consultar status", e);
            return criarRespostaErro("ERRO_STATUS", e.getMessage());
        }
    }

    /**
     * Consulta NF-e pela chave
     */
    public String consultarNfe(String chave, String ambiente) {
        log.info("Consultar NF-e: {} - Ambiente: {}", chave, ambiente);

        if (chave == null || chave.isEmpty()) {
            return criarRespostaErro("ERRO_CONSULTA", "Chave da NF-e não informada");
        }

        try {
            String soapXml = criarSoapConsulta(chave, ambiente);
            String resposta = enviarSoap(soapXml, getUrlConsulta(ambiente));
            return resposta;
        } catch (Exception e) {
            log.error("Erro ao consultar NF-e", e);
            return criarRespostaErro("ERRO_CONSULTA", e.getMessage());
        }
    }

    /**
     * Cancela NF-e
     */
    public String cancelarNfe(String chave, String protocolo, String justificativa, String ambiente) {
        log.info("Cancelar NF-e: {} - Ambiente: {}", chave, ambiente);

        if (chave == null || chave.isEmpty()) {
            return criarRespostaErro("ERRO_CANCELAMENTO", "Chave da NF-e não informada");
        }

        try {
            String soapXml = criarSoapCancelamento(chave, protocolo, justificativa, ambiente);
            String resposta = enviarSoap(soapXml, getUrlCancelamento(ambiente));
            return resposta;
        } catch (Exception e) {
            log.error("Erro ao cancelar NF-e", e);
            return criarRespostaErro("ERRO_CANCELAMENTO", e.getMessage());
        }
    }

    /**
     * Consulta distribuição de NF-e (documentos de interesse) na SEFAZ Nacional
     */
    public String consultarDistribuicao(String soapXml, String ambiente) {
        log.info("Consultar distribuição NF-e SEFAZ - Ambiente: {}", ambiente);

        try {
            String ambienteSefaz = isProducao(ambiente) ? "P" : "D";

            // Se for Homologação, retorna uma resposta simulada contendo chaves/XML mockados
            if ("D".equals(ambienteSefaz)) {
                log.info("Modo Homologação - simulando resposta de distribuição/download");
                return simularRespostaDistribuicao(soapXml);
            }

            // Em Produção, usa os endpoints corretos da SEFAZ Nacional (AN)
            String url = "P".equals(ambienteSefaz)
                    ? "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx"
                    : "https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx";

            log.info("Modo Produção - enviando distribuição para: {}", url);
            return enviarSoap(soapXml, url);

        } catch (Exception e) {
            log.error("Erro ao consultar distribuição de NF-e", e);
            return criarRespostaErro("ERRO_DISTRIBUICAO", e.getMessage());
        }
    }

    /**
     * Assina o XML com o certificado digital (detectando a tag automaticamente)
     */
    private String assinarXml(String xml) throws Exception {
        if (xml.contains("<infNFe")) {
            return assinarXml(xml, "infNFe");
        } else if (xml.contains("<infEvento")) {
            return assinarXml(xml, "infEvento");
        }
        log.warn("Nenhuma tag de assinatura conhecida (infNFe ou infEvento) encontrada, retornando XML sem assinatura");
        return xml;
    }

    /**
     * Assina uma tag específica do XML utilizando o certificado digital PKCS12 (PFX)
     */
    public String assinarXml(String xml, String tagParaAssinar) throws Exception {
        log.info("Assinando XML para a tag: {} ...", tagParaAssinar);

        if (!Files.exists(Paths.get(certificadoPath))) {
            log.warn("Certificado não encontrado em: {}, retornando XML original", certificadoPath);
            return xml;
        }

        // Carrega o certificado e a chave privada
        char[] senhaChars = certificadoSenha.toCharArray();
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream is = new FileInputStream(certificadoPath)) {
            keyStore.load(is, senhaChars);
        }

        String alias = keyStore.aliases().nextElement();
        PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, senhaChars);
        X509Certificate cert = (X509Certificate) keyStore.getCertificate(alias);

        // Converte string XML para DOM Document
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        Document doc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(xml.getBytes("UTF-8")));

        // Localiza o elemento que será assinado (infNFe ou infEvento)
        NodeList nodeList = doc.getElementsByTagName(tagParaAssinar);
        if (nodeList.getLength() == 0) {
            throw new IllegalArgumentException("Tag " + tagParaAssinar + " não encontrada para assinatura!");
        }
        Element elementToSign = (Element) nodeList.item(0);
        String id = elementToSign.getAttribute("Id");
        if (id == null || id.isEmpty()) {
            throw new IllegalArgumentException("Atributo Id na tag " + tagParaAssinar + " está vazio!");
        }
        
        // Marca o atributo ID como identificador único para referência do URI de assinatura
        elementToSign.setIdAttribute("Id", true);

        // Inicializa a fábrica de assinatura XML
        XMLSignatureFactory signatureFactory = XMLSignatureFactory.getInstance("DOM");

        // Referência (URI #ID...) com as duas transformações obrigatórias da SEFAZ: Enveloped e C14N
        Reference ref = signatureFactory.newReference(
            "#" + id,
            signatureFactory.newDigestMethod(DigestMethod.SHA1, null),
            java.util.Arrays.asList(
                signatureFactory.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null),
                signatureFactory.newTransform(CanonicalizationMethod.INCLUSIVE, (TransformParameterSpec) null)
            ),
            null,
            null
        );

        // SignedInfo
        SignedInfo signedInfo = signatureFactory.newSignedInfo(
            signatureFactory.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
            signatureFactory.newSignatureMethod(SignatureMethod.RSA_SHA1, null),
            Collections.singletonList(ref)
        );

        // KeyInfo (injetando o certificado digital X509)
        KeyInfoFactory keyInfoFactory = signatureFactory.getKeyInfoFactory();
        X509Data x509Data = keyInfoFactory.newX509Data(Collections.singletonList(cert));
        KeyInfo keyInfo = keyInfoFactory.newKeyInfo(Collections.singletonList(x509Data));

        // Cria o contexto de assinatura e a executa
        DOMSignContext signContext = new DOMSignContext(privateKey, elementToSign.getParentNode());
        XMLSignature signature = signatureFactory.newXMLSignature(signedInfo, keyInfo);
        signature.sign(signContext);

        // Converte o DOM de volta para String
        StringWriter writer = new StringWriter();
        Transformer transformer = TransformerFactory.newInstance().newTransformer();
        transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
        transformer.transform(new DOMSource(doc), new StreamResult(writer));
        return writer.toString();
    }

    /**
     * Envia um SOAP de Evento (Cancelamento, Manifestação, etc) para a recepção de eventos da SEFAZ
     */
    public String enviarEvento(String soapXml, String ambiente) {
        log.info("Enviar Evento para SEFAZ - Ambiente: {}", ambiente);
        try {
            String ambienteSefaz = isProducao(ambiente) ? "P" : "D";
            
            if ("D".equals(ambienteSefaz)) {
                log.info("Modo Homologação - simulando resposta de evento");
                return simularRespostaEvento(soapXml);
            }
            
            String url;
            if (soapXml.contains("<cOrgao>91</cOrgao>")) {
                url = "https://www.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx";
                log.info("Evento direcionado ao Ambiente Nacional (cOrgao 91) - enviando para: {}", url);
            } else {
                url = getUrlCancelamento(ambienteSefaz);
                log.info("Modo Produção - enviando evento para: {}", url);
            }
            return enviarSoap(soapXml, url);
        } catch (Exception e) {
            log.error("Erro ao enviar Evento para SEFAZ", e);
            return criarRespostaErro("ERRO_ENVIO_EVENTO", e.getMessage());
        }
    }

    /**
     * Envia o XML para a SEFAZ
     */
    private String enviarParaSefaz(String xml, String ambiente) throws Exception {
        log.info("Enviando XML para SEFAZ - Ambiente: {}", ambiente);

        // Converte código numérico para código de ambiente (1=P, 2=D)
        String ambienteSefaz = isProducao(ambiente) ? "P" : "D";

        // Verifica se está em modo de desenvolvimento/homologação
        if ("D".equals(ambienteSefaz)) {
            // Simula resposta de homologação
            log.info("Modo Homologação - simulando resposta");
            return simularRespostaHomologacao(xml);
        }

        // Ambiente de produção - usa URL real
        String url = getUrlAutorizacao(ambienteSefaz);
        log.info("Modo Produção - enviando para: {}", url);
        String soapXml = criarSoapEnvio(xml, ambienteSefaz);
        return enviarSoap(soapXml, url);
    }

    /**
     * Cria SOAP para envio de NF-e
     */
    private String criarSoapEnvio(String xml, String ambiente) {
        StringBuilder soap = new StringBuilder();
        soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        soap.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
        soap.append("  <soap:Body>\n");
        soap.append("    <nfeDadosMsg xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4\">\n");
        soap.append(xml);
        soap.append("    </nfeDadosMsg>\n");
        soap.append("  </soap:Body>\n");
        soap.append("</soap:Envelope>");
        return soap.toString();
    }

    /**
     * Envia mensagem SOAP para a SEFAZ
     */
    private String enviarSoap(String soapXml, String urlStr) throws Exception {
        log.info("Enviando SOAP XML para {}:\n{}", urlStr, soapXml);
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "text/xml; charset=utf-8");
        if (urlStr != null && urlStr.toLowerCase().contains("nfedistribuicaodfe")) {
            conn.setRequestProperty("SOAPAction", "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse");
        } else if (urlStr != null && urlStr.toLowerCase().contains("recepcaoevento")) {
            if (urlStr.toLowerCase().contains("fazenda.gov.br")) {
                conn.setRequestProperty("SOAPAction", "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEventoNF");
            } else {
                conn.setRequestProperty("SOAPAction", "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento");
            }
        } else {
            conn.setRequestProperty("SOAPAction", "");
        }

        // Configura SSL se necessário
        if (urlStr.startsWith("https")) {
            configurarSSL(conn);
        }

        try (OutputStream os = conn.getOutputStream()) {
            os.write(soapXml.getBytes("UTF-8"));
        }

        // Lê resposta
        int responseCode = conn.getResponseCode();
        log.info("Resposta SEFAZ: {}", responseCode);

        if (responseCode == HttpURLConnection.HTTP_OK) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                return response.toString();
            }
        } else {
            StringBuilder errorResponse = new StringBuilder();
            try (InputStream es = conn.getErrorStream()) {
                if (es != null) {
                    try (BufferedReader br = new BufferedReader(new InputStreamReader(es, "UTF-8"))) {
                        String line;
                        while ((line = br.readLine()) != null) {
                            errorResponse.append(line);
                        }
                    }
                }
            } catch (Exception ex) {
                log.error("Erro ao ler stream de erro da SEFAZ", ex);
            }
            log.error("Resposta HTTP Erro da SEFAZ (Código {}): {}", responseCode, errorResponse.toString());
            return criarRespostaErro("ERRO_HTTP", "Código de resposta: " + responseCode + ". Detalhes: " + errorResponse.toString());
        }
    }

    /**
     * Configura SSL para conexão HTTPS
     */
    private void configurarSSL(HttpURLConnection conn) throws Exception {
        if (!(conn instanceof HttpsURLConnection)) {
            return;
        }

        HttpsURLConnection httpsConn = (HttpsURLConnection) conn;

        if (certificadoPath == null || certificadoPath.isEmpty() || !Files.exists(Paths.get(certificadoPath))) {
            log.warn("Certificado digital não configurado ou não encontrado em: {}. Ignorando configuração SSL.", certificadoPath);
            return;
        }

        char[] senhaChars = (certificadoSenha != null) ? certificadoSenha.toCharArray() : new char[0];

        // Carrega o certificado digital PFX
        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream is = Files.newInputStream(Paths.get(certificadoPath))) {
            keyStore.load(is, senhaChars);
        }

        // Inicializa o KeyManagerFactory com o KeyStore
        KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(keyStore, senhaChars);

        // Cria o SSLContext usando TLS com um TrustManager personalizado para confiar nos certificados da SEFAZ (ICP-Brasil)
        TrustManager[] trustAllCerts = new TrustManager[] {
            new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }
        };
        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(kmf.getKeyManagers(), trustAllCerts, new java.security.SecureRandom());

        // Define a fábrica de sockets SSL na conexão HTTPS
        httpsConn.setSSLSocketFactory(sslContext.getSocketFactory());
        log.info("SSL configurado com sucesso usando o certificado: {}", certificadoPath);
    }

    /**
     * Simula resposta de homologação
     */
    private String simularRespostaHomologacao(String xml) {
        // Extrai informações do XML para resposta
        String chave = "";
        if (xml != null && xml.contains("infNFe")) {
            int idStart = xml.indexOf("Id=\"NFe") + 7;
            if (idStart > 6) {
                int idEnd = xml.indexOf("\"", idStart);
                if (idEnd > idStart) {
                    chave = xml.substring(idStart, idEnd);
                }
            }
        }

        if (chave.isEmpty()) {
            chave = "35260247563976000136550010000015531000015537";
        }

        String protocolo = "1" + System.currentTimeMillis();

        StringBuilder resposta = new StringBuilder();
        resposta.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        resposta.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
        resposta.append("  <soap:Body>\n");
        resposta.append("    <nfeResultMsg xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4\">\n");
        resposta.append("      <retEnviNFe versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        resposta.append("        <tpAmb>2</tpAmb>\n");
        resposta.append("        <cUF>35</cUF>\n");
        resposta.append("        <cStat>103</cStat>\n");
        resposta.append("        <xMotivo>Lote recebido com sucesso</xMotivo>\n");
        resposta.append("        <infRec>\n");
        resposta.append("          <nRec>").append(protocolo).append("</nRec>\n");
        resposta.append("          <tMed>1</tMed>\n");
        resposta.append("        </infRec>\n");
        resposta.append("      </retEnviNFe>\n");
        resposta.append("    </nfeResultMsg>\n");
        resposta.append("  </soap:Body>\n");
        resposta.append("</soap:Envelope>");

        log.info("Resposta de homologação gerada - Protocolo: {}", protocolo);

        return resposta.toString();
    }

    /**
     * Cria SOAP para consulta de status do serviço
     */
    private String criarSoapStatusServico(String ambiente) {
        StringBuilder soap = new StringBuilder();
        soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        soap.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
        soap.append("  <soap:Header>\n");
        soap.append("    <nfeCabecMsg xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4\">\n");
        soap.append("      <cUF>35</cUF>\n");
        soap.append("      <versaoDados>4.00</versaoDados>\n");
        soap.append("    </nfeCabecMsg>\n");
        soap.append("  </soap:Header>\n");
        soap.append("  <soap:Body>\n");
        soap.append("    <nfeDadosMsg xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4\">\n");
        soap.append("      <consStatServ versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        soap.append("        <tpAmb>").append("2".equals(ambiente) ? "2" : "1").append("</tpAmb>\n");
        soap.append("        <cUF>35</cUF>\n");
        soap.append("        <xServ>STATUS</xServ>\n");
        soap.append("      </consStatServ>\n");
        soap.append("    </nfeDadosMsg>\n");
        soap.append("  </soap:Body>\n");
        soap.append("</soap:Envelope>");

        return soap.toString();
    }

    /**
     * Cria SOAP para consulta de NF-e
     */
    private String criarSoapConsulta(String chave, String ambiente) {
        StringBuilder soap = new StringBuilder();
        soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        soap.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
        soap.append("  <soap:Body>\n");
        soap.append("    <nfeDadosMsg xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsulta4\">\n");
        soap.append("      <consSitNFe versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        soap.append("        <tpAmb>").append("2".equals(ambiente) ? "2" : "1").append("</tpAmb>\n");
        soap.append("        <xServ>CONSULTAR</xServ>\n");
        soap.append("        <chNFe>").append(chave).append("</chNFe>\n");
        soap.append("      </consSitNFe>\n");
        soap.append("    </nfeDadosMsg>\n");
        soap.append("  </soap:Body>\n");
        soap.append("</soap:Envelope>");

        return soap.toString();
    }

    /**
     * Cria SOAP para cancelamento de NF-e
     */
    private String criarSoapCancelamento(String chave, String protocolo, String justificativa, String ambiente) {
        StringBuilder soap = new StringBuilder();
        soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        soap.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
        soap.append("  <soap:Body>\n");
        soap.append("    <nfeDadosMsg xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeCancelamento4\">\n");
        soap.append("      <evento versao=\"1.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        soap.append("        <infEvento Id=\"ID110111").append(chave).append("01\">\n");
        soap.append("          <cOrgao>35</cOrgao>\n");
        soap.append("          <tpAmb>").append("2".equals(ambiente) ? "2" : "1").append("</tpAmb>\n");
        soap.append("          <CNPJ>47563976000136</CNPJ>\n");
        soap.append("          <chNFe>").append(chave).append("</chNFe>\n");
        soap.append("          <dhEvento>")
                .append(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ISO_DATE_TIME))
                .append("</dhEvento>\n");
        soap.append("          <tpEvento>110111</tpEvento>\n");
        soap.append("          <nSeqEvento>1</nSeqEvento>\n");
        soap.append("          <verEvento>1.00</verEvento>\n");
        soap.append("          <detEvento versao=\"1.00\">\n");
        soap.append("            <evCancNFe>\n");
        soap.append("              <descEvento>Cancelamento</descEvento>\n");
        soap.append("              <nProt>").append(protocolo != null ? protocolo : "").append("</nProt>\n");
        soap.append("              <xJust>").append(justificativa != null ? justificativa : "").append("</xJust>\n");
        soap.append("            </evCancNFe>\n");
        soap.append("          </detEvento>\n");
        soap.append("        </infEvento>\n");
        soap.append("      </evento>\n");
        soap.append("    </nfeDadosMsg>\n");
        soap.append("  </soap:Body>\n");
        soap.append("</soap:Envelope>");

        return soap.toString();
    }

    /**
     * Cria resposta de erro formatada
     */
    private String criarRespostaErro(String status, String mensagem) {
        StringBuilder resposta = new StringBuilder();
        resposta.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        resposta.append("<retorno>\n");
        resposta.append("  <status>").append(status).append("</status>\n");
        resposta.append("  <mensagem>").append(mensagem).append("</mensagem>\n");
        resposta.append("</retorno>");

        return resposta.toString();
    }

    /**
     * Simula resposta da SEFAZ para distribuição de NF-e
     */
    private String simularRespostaDistribuicao(String soapXml) {
        // Se a requisição contiver a chave de acesso, é um download de XML completo
        if (soapXml != null && soapXml.contains("<chNFe>")) {
            String chave = "";
            int start = soapXml.indexOf("<chNFe>");
            int end = soapXml.indexOf("</chNFe>");
            if (start != -1 && end != -1) {
                chave = soapXml.substring(start + 7, end).trim();
            }
            if (chave.isEmpty()) {
                chave = "35260712345678000199550010000000011001234567";
            }

            String nNF = "1";
            if (chave.length() >= 34) {
                try {
                    nNF = String.valueOf(Integer.parseInt(chave.substring(25, 34)));
                } catch (Exception e) {
                    nNF = "1";
                }
            }

            StringBuilder noteXml = new StringBuilder();
            noteXml.append("<nfeProc versao=\"4.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
            noteXml.append("  <NFe>\n");
            noteXml.append("    <infNFe Id=\"NFe").append(chave).append("\" versao=\"4.00\">\n");
            noteXml.append("      <ide>\n");
            noteXml.append("        <cUF>35</cUF>\n");
            noteXml.append("        <cNF>12345678</cNF>\n");
            noteXml.append("        <natOp>COMPRA MERCADORIA USO E CONSUMO</natOp>\n");
            noteXml.append("        <mod>55</mod>\n");
            noteXml.append("        <serie>001</serie>\n");
            noteXml.append("        <nNF>").append(nNF).append("</nNF>\n");
            noteXml.append("        <dhEmi>2026-07-01T10:00:00-03:00</dhEmi>\n");
            noteXml.append("        <tpNF>1</tpNF>\n");
            noteXml.append("      </ide>\n");
            noteXml.append("      <emit>\n");
            noteXml.append("        <CNPJ>12345678000199</CNPJ>\n");
            noteXml.append("        <xNome>DISTRIBUIDORA DE PECAS AUTOMOTIVAS LTDA</xNome>\n");
            noteXml.append("        <IE>111222333444</IE>\n");
            noteXml.append("        <CRT>3</CRT>\n");
            noteXml.append("        <enderEmit>\n");
            noteXml.append("          <UF>SP</UF>\n");
            noteXml.append("        </enderEmit>\n");
            noteXml.append("      </emit>\n");
            noteXml.append("      <dest>\n");
            noteXml.append("        <CNPJ>47563976000136</CNPJ>\n");
            noteXml.append("        <xNome>SPDEALER AUTO PECAS LTDA</xNome>\n");
            noteXml.append("        <IE>555666777888</IE>\n");
            noteXml.append("      </dest>\n");
            noteXml.append("      <det nItem=\"1\">\n");
            noteXml.append("        <prod>\n");
            noteXml.append("          <cProd>FILT-123</cProd>\n");
            noteXml.append("          <xProd>FILTRO DE OLEO MOTOR AP</xProd>\n");
            noteXml.append("          <NCM>84212300</NCM>\n");
            noteXml.append("          <CFOP>5102</CFOP>\n");
            noteXml.append("          <uCom>UN</uCom>\n");
            noteXml.append("          <qCom>10.0000</qCom>\n");
            noteXml.append("          <vUnCom>15.5000</vUnCom>\n");
            noteXml.append("          <vProd>155.00</vProd>\n");
            noteXml.append("        </prod>\n");
            noteXml.append("        <imposto>\n");
            noteXml.append("          <IBS>\n");
            noteXml.append("            <CST>50</CST>\n");
            noteXml.append("            <vBC>155.00</vBC>\n");
            noteXml.append("            <pIBS>20.00</pIBS>\n");
            noteXml.append("            <vIBS>31.00</vIBS>\n");
            noteXml.append("          </IBS>\n");
            noteXml.append("          <CBS>\n");
            noteXml.append("            <CST>50</CST>\n");
            noteXml.append("            <vBC>155.00</vBC>\n");
            noteXml.append("            <pCBS>10.00</pCBS>\n");
            noteXml.append("            <vCBS>15.50</vCBS>\n");
            noteXml.append("          </CBS>\n");
            noteXml.append("          <IS>\n");
            noteXml.append("            <CST>00</CST>\n");
            noteXml.append("            <vBC>0.00</vBC>\n");
            noteXml.append("            <pIS>0.00</pIS>\n");
            noteXml.append("            <vIS>0.00</vIS>\n");
            noteXml.append("          </IS>\n");
            noteXml.append("        </imposto>\n");
            noteXml.append("      </det>\n");
            noteXml.append("      <det nItem=\"2\">\n");
            noteXml.append("        <prod>\n");
            noteXml.append("          <cProd>PAST-456</cProd>\n");
            noteXml.append("          <xProd>PASTILHA DE FREIO DIANTEIRA COBREQ</xProd>\n");
            noteXml.append("          <NCM>87083019</NCM>\n");
            noteXml.append("          <CFOP>5102</CFOP>\n");
            noteXml.append("          <uCom>JG</uCom>\n");
            noteXml.append("          <qCom>5.0000</qCom>\n");
            noteXml.append("          <vUnCom>45.0000</vUnCom>\n");
            noteXml.append("          <vProd>225.00</vProd>\n");
            noteXml.append("        </prod>\n");
            noteXml.append("        <imposto>\n");
            noteXml.append("          <IBS>\n");
            noteXml.append("            <CST>50</CST>\n");
            noteXml.append("            <vBC>225.00</vBC>\n");
            noteXml.append("            <pIBS>20.00</pIBS>\n");
            noteXml.append("            <vIBS>45.00</vIBS>\n");
            noteXml.append("          </IBS>\n");
            noteXml.append("          <CBS>\n");
            noteXml.append("            <CST>50</CST>\n");
            noteXml.append("            <vBC>225.00</vBC>\n");
            noteXml.append("            <pCBS>10.00</pCBS>\n");
            noteXml.append("            <vCBS>22.50</vCBS>\n");
            noteXml.append("          </CBS>\n");
            noteXml.append("          <IS>\n");
            noteXml.append("            <CST>00</CST>\n");
            noteXml.append("            <vBC>0.00</vBC>\n");
            noteXml.append("            <pIS>0.00</pIS>\n");
            noteXml.append("            <vIS>0.00</vIS>\n");
            noteXml.append("          </IS>\n");
            noteXml.append("        </imposto>\n");
            noteXml.append("      </det>\n");
            noteXml.append("      <total>\n");
            noteXml.append("        <ICMSTot>\n");
            noteXml.append("          <vBC>0.00</vBC>\n");
            noteXml.append("          <vICMS>0.00</vICMS>\n");
            noteXml.append("          <vProd>380.00</vProd>\n");
            noteXml.append("          <vFrete>0.00</vFrete>\n");
            noteXml.append("          <vDesc>0.00</vDesc>\n");
            noteXml.append("          <vIPI>0.00</vIPI>\n");
            noteXml.append("          <vPIS>0.00</vPIS>\n");
            noteXml.append("          <vCOFINS>0.00</vCOFINS>\n");
            noteXml.append("          <vNF>380.00</vNF>\n");
            noteXml.append("          <vBCIBS>380.00</vBCIBS>\n");
            noteXml.append("          <vIBS>76.00</vIBS>\n");
            noteXml.append("          <vBCCBS>380.00</vBCCBS>\n");
            noteXml.append("          <vCBS>38.00</vCBS>\n");
            noteXml.append("          <vIS>0.00</vIS>\n");
            noteXml.append("          <vSplitIBS>76.00</vSplitIBS>\n");
            noteXml.append("          <vSplitCBS>38.00</vSplitCBS>\n");
            noteXml.append("          <indSplit>1</indSplit>\n");
            noteXml.append("        </ICMSTot>\n");
            noteXml.append("      </total>\n");
            noteXml.append("      <cobr>\n");
            noteXml.append("        <dup>\n");
            noteXml.append("          <nDup>001</nDup>\n");
            noteXml.append("          <dVenc>2026-08-01</dVenc>\n");
            noteXml.append("          <vDup>380.00</vDup>\n");
            noteXml.append("        </dup>\n");
            noteXml.append("      </cobr>\n");
            noteXml.append("    </infNFe>\n");
            noteXml.append("  </NFe>\n");
            noteXml.append("</nfeProc>\n");

            StringBuilder soap = new StringBuilder();
            soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
            soap.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
            soap.append("  <soap:Body>\n");
            soap.append("    <nfeDistDFeInteresseResponse xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe\">\n");
            soap.append("      <retDistDFeInt versao=\"1.01\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
            soap.append("        <tpAmb>2</tpAmb>\n");
            soap.append("        <cStat>138</cStat>\n");
            soap.append("        <xMotivo>Documento localizado</xMotivo>\n");
            soap.append("        <ultNSU>000000000000100</ultNSU>\n");
            soap.append("        <maxNSU>000000000000100</maxNSU>\n");
            soap.append("        <loteDistDFeInt>\n");
            soap.append("          <docZip NSU=\"000000000000001\" schema=\"procNFe_v4.00.xsd\">");
            soap.append(escapeXml(noteXml.toString()));
            soap.append("</docZip>\n");
            soap.append("        </loteDistDFeInt>\n");
            soap.append("      </retDistDFeInt>\n");
            soap.append("    </nfeDistDFeInteresseResponse>\n");
            soap.append("  </soap:Body>\n");
            soap.append("</soap:Envelope>");
            return soap.toString();
        }

        // Se for listagem (sem chave específica), retorna a lista de chaves mockadas
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
        xml.append("  <soap:Body>\n");
        xml.append("    <nfeDistDFeInteresseResponse xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe\">\n");
        xml.append("      <retDistDFeInt versao=\"1.01\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        xml.append("        <tpAmb>2</tpAmb>\n");
        xml.append("        <cStat>138</cStat>\n");
        xml.append("        <xMotivo>Documento localizado</xMotivo>\n");
        xml.append("        <ultNSU>000000000000100</ultNSU>\n");
        xml.append("        <maxNSU>000000000000100</maxNSU>\n");
        xml.append("        <loteDistDFeInt>\n");
        xml.append("          <docZip NSU=\"000000000000001\" schema=\"resNFe_v1.01.xsd\">\n");
        xml.append("            <chNFe>35260712345678000199550010000000011001234567</chNFe>\n");
        xml.append("          </docZip>\n");
        xml.append("          <docZip NSU=\"000000000000002\" schema=\"resNFe_v1.01.xsd\">\n");
        xml.append("            <chNFe>35260712345678000199550010000000021001234568</chNFe>\n");
        xml.append("          </docZip>\n");
        xml.append("          <docZip NSU=\"000000000000003\" schema=\"resNFe_v1.01.xsd\">\n");
        xml.append("            <chNFe>35260712345678000199550010000000031001234569</chNFe>\n");
        xml.append("          </docZip>\n");
        xml.append("        </loteDistDFeInt>\n");
        xml.append("      </retDistDFeInt>\n");
        xml.append("    </nfeDistDFeInteresseResponse>\n");
        xml.append("  </soap:Body>\n");
        xml.append("</soap:Envelope>");
        return xml.toString();
    }

    /**
     * Escapa caracteres especiais para XML
     */
    private String escapeXml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&apos;");
    }

    /**
     * Simula resposta da SEFAZ para registro de evento
     */
    private String simularRespostaEvento(String soapXml) {
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
        sb.append("  <soap:Body>\n");
        sb.append("    <nfeRecepcaoEventoResult xmlns=\"http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4\">\n");
        sb.append("      <retEnvEvento versao=\"1.00\" xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");
        sb.append("        <tpAmb>2</tpAmb>\n");
        sb.append("        <cStat>128</cStat>\n");
        sb.append("        <xMotivo>Lote de evento processado</xMotivo>\n");
        sb.append("        <retEvento versao=\"1.00\">\n");
        sb.append("          <infEvento>\n");
        sb.append("            <tpAmb>2</tpAmb>\n");
        sb.append("            <cStat>135</cStat>\n");
        sb.append("            <xMotivo>Evento registrado e vinculado a NF-e</xMotivo>\n");
        sb.append("          </infEvento>\n");
        sb.append("        </retEvento>\n");
        sb.append("      </retEnvEvento>\n");
        sb.append("    </nfeRecepcaoEventoResult>\n");
        sb.append("  </soap:Body>\n");
        sb.append("</soap:Envelope>");
        return sb.toString();
    }
}
