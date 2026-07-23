package br.com.spdealer.nfse.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import javax.xml.crypto.dsig.*;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.keyinfo.*;
import javax.xml.crypto.dsig.spec.*;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.*;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.w3c.dom.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NfseWebService {

    private static final String HOMOLOGACAO_URL = "https://homologacao.webiss.com.br/ws/nfse.asmx";
    private static final String SOAP_ACTION = "http://nfse.abrasf.org.br/RecepcionarLoteRpsSincrono";
    private static final String TOMADOR_EMAIL_HOMOLOG = "lucasdalevedove68@gmail.com";

    private final JdbcTemplate jdbcTemplate;

    private String obterEndpointUrl(Integer filial) {
        String endpointUrl = HOMOLOGACAO_URL;
        try {
            String sqlEnv = "SELECT sefaz_ambiente_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> rowsEnv = jdbcTemplate.queryForList(sqlEnv, filial);
            if (!rowsEnv.isEmpty()) {
                String envDb = str(rowsEnv.get(0).get("sefaz_ambiente_fil")).trim();
                if ("P".equalsIgnoreCase(envDb) || "1".equals(envDb)) {
                    endpointUrl = "https://cacoalro.webiss.com.br/ws/nfse.asmx";
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar sefaz_ambiente_fil de masfil, usando homologacao", e);
        }
        return endpointUrl;
    }

    public Map<String, Object> gerarNfse(Integer filial, Integer emissao, String tipo, String serie, Integer numero) {
        String tipoDb = tipo;
        if ("1".equals(tipo)) {
            tipoDb = "S";
        } else if ("2".equals(tipo)) {
            tipoDb = "E";
        }

        log.info("Gerando NFSe: filial={}, emissao={}, tipo={}->{}, serie={}, numero={}",
                filial, emissao, tipo, tipoDb, serie, numero);

        try {
            Map<String, Object> nota = buscarNotaCab(filial, emissao, tipoDb, serie, numero);
            List<Map<String, Object>> itens = buscarNotasDet(filial, emissao, tipoDb, serie, numero);
            Map<String, Object> empresa = buscarFilial(filial);

            // Complementa dados da filial com CodTribMunicipio_fil e CodigoCnae_fil da masfil
            try {
                String codigoFilStr = String.format("%03d", filial);
                String sqlMas = "SELECT CodTribMunicipio_fil, CodigoCnae_fil FROM masfil WHERE codigo_fil = ?";
                List<Map<String, Object>> rowsMas = jdbcTemplate.queryForList(sqlMas, codigoFilStr);
                if (rowsMas.isEmpty()) {
                    rowsMas = jdbcTemplate.queryForList(sqlMas, filial);
                }
                if (!rowsMas.isEmpty()) {
                    Map<String, Object> mas = rowsMas.get(0);
                    empresa.put("CodTribMunicipio_fil", mas.get("CodTribMunicipio_fil"));
                    empresa.put("CodigoCnae_fil", mas.get("CodigoCnae_fil"));
                }
            } catch (Exception e) {
                log.warn("Erro ao complementar dados com masfil", e);
            }

            String loteXml = gerarLoteRpsXml(nota, itens, empresa);
            loteXml = assinarRps(loteXml, filial);
            String soapXml = montarSoapEnvelope(loteXml);
            String endpointUrl = obterEndpointUrl(filial);
            String soapResponse = enviarSoap(soapXml, endpointUrl);

            Map<String, Object> resultado = parseRespostaWebIss(soapResponse);
            log.info("Resposta NFSe processada: {}", resultado);
            return resultado;

        } catch (Exception e) {
            log.error("Erro ao gerar NFSe", e);
            Map<String, Object> erro = new HashMap<>();
            erro.put("sucesso", false);
            erro.put("erro", e.getMessage());
            return erro;
        }
    }

    private Map<String, Object> buscarNotaCab(Integer filial, Integer emissao, String tipo, String serie, Integer numero) {
        log.info("Buscando notascab: filial={}, emissao={}, tipo={}, serie={}, numero={}",
                filial, emissao, tipo, serie, numero);

        String sql = "SELECT * FROM notascab WHERE filial_not = ? AND emissaoi_not = ? " +
                "AND tipo_not = ? AND serie_not = ? AND numero_not = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql,
                new Object[]{filial, emissao, tipo, serie, numero});
        if (rows.isEmpty()) {
            log.warn("Nota nao encontrada com filtro completo. Tentando sem serie...");
            rows = jdbcTemplate.queryForList(
                    "SELECT * FROM notascab WHERE filial_not = ? AND emissaoi_not = ? AND tipo_not = ? AND numero_not = ?",
                    new Object[]{filial, emissao, tipo, numero});
        }
        if (rows.isEmpty()) {
            throw new RuntimeException("Nota fiscal nao encontrada");
        }
        return rows.get(0);
    }

    private List<Map<String, Object>> buscarNotasDet(Integer filial, Integer emissao, String tipo, String serie, Integer numero) {
        String sql = "SELECT * FROM notasdet WHERE filial_not = ? AND emissaoi_not = ? " +
                "AND tipo_not = ? AND serie_not = ? AND numero_not = ? ORDER BY sequencia_not";
        return jdbcTemplate.queryForList(sql,
                new Object[]{filial, emissao, tipo, serie, numero});
    }

    private Map<String, Object> buscarFilial(Integer filial) {
        String sql = "SELECT * FROM filial WHERE id_fil = ?";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, new Object[]{filial});
        if (rows.isEmpty()) {
            String sql2 = "SELECT * FROM filial WHERE codigo_fil = ?";
            rows = jdbcTemplate.queryForList(sql2, new Object[]{filial});
        }
        if (rows.isEmpty()) {
            throw new RuntimeException("Filial nao encontrada");
        }
        return rows.get(0);
    }

    private String gerarLoteRpsXml(Map<String, Object> nota, List<Map<String, Object>> itens, Map<String, Object> empresa) {
        String dataStr = formatarDataEmissao(nota);

        String cnpjCpf = str(nota.get("cgccpf_not")).replaceAll("[^0-9]", "");
        String cnpjEmpresa = str(empresa.get("cnpj_fil")).replaceAll("[^0-9]", "");
        String inscMun = str(empresa.get("inscr_municipal_fil"));
        String codMun = str(empresa.get("codigo_municipio_fil"));
        if (codMun.isEmpty()) codMun = "3550308";
        String cnae = str(empresa.get("CodigoCnae_fil"));
        if (cnae.isEmpty()) {
            cnae = str(empresa.get("cnae_fil"));
        }
        String codTribMun = str(empresa.get("CodTribMunicipio_fil"));

        BigDecimal vlrTotal = dec(nota.get("vlrnot_not"));
        BigDecimal vlrIss = dec(nota.get("vlrist_not"));
        BigDecimal vlrLiquido = vlrTotal.subtract(vlrIss);
        BigDecimal aliquota = BigDecimal.ZERO;
        if (vlrTotal.compareTo(BigDecimal.ZERO) > 0) {
            aliquota = vlrIss.multiply(BigDecimal.valueOf(100))
                    .divide(vlrTotal, 4, RoundingMode.HALF_UP);
        }

        String discriminacao = itens.stream()
                .map(i -> {
                    StringBuilder sb = new StringBuilder();
                    if (i.get("descprod_not") != null) sb.append(i.get("descprod_not"));
                    if (i.get("quant_not") != null && i.get("valoruni_not") != null) {
                        sb.append(" (Qtd: ").append(i.get("quant_not"))
                                .append(" x R$ ").append(i.get("valoruni_not")).append(")");
                    }
                    return sb.toString();
                })
                .collect(Collectors.joining("; "));

        if (discriminacao.isEmpty()) {
            discriminacao = "PRESTACAO DE SERVICOS";
        }

        String endereco = str(nota.get("endereco_not"));
        String bairro = str(nota.get("bairro_not"));
        String estado = str(nota.get("estado_not"));
        String cep = str(nota.get("cep_not")).replaceAll("[^0-9]", "");

        String logradouro = endereco;
        String numero = "";
        if (endereco.matches(".*,\\s*\\d+.*")) {
            int idx = endereco.lastIndexOf(",");
            if (idx > 0) {
                logradouro = endereco.substring(0, idx).trim();
                numero = endereco.substring(idx + 1).trim();
            }
        }

        StringBuilder rpsBody = new StringBuilder();
        rpsBody.append("      <Rps>\n");
        rpsBody.append("        <InfDeclaracaoPrestacaoServico Id=\"Inf1\" xmlns=\"http://www.abrasf.org.br/nfse.xsd\">\n");
        rpsBody.append("          <Rps Id=\"Rps1\">\n");
        rpsBody.append("            <IdentificacaoRps>\n");
        rpsBody.append("              <Numero>").append(nota.get("numero_not")).append("</Numero>\n");
        rpsBody.append("              <Serie>U</Serie>\n");
        rpsBody.append("              <Tipo>1</Tipo>\n");
        rpsBody.append("            </IdentificacaoRps>\n");
        rpsBody.append("            <DataEmissao>").append(dataStr).append("</DataEmissao>\n");
        rpsBody.append("            <Status>1</Status>\n");
        rpsBody.append("          </Rps>\n");
        rpsBody.append("          <Competencia>").append(dataStr).append("</Competencia>\n");
        rpsBody.append("          <Servico>\n");
        rpsBody.append("            <Valores>\n");
        rpsBody.append("              <ValorServicos>").append(fmt2(vlrTotal)).append("</ValorServicos>\n");
        rpsBody.append("              <ValorDeducoes>0.00</ValorDeducoes>\n");
        rpsBody.append("              <ValorPis>0.00</ValorPis>\n");
        rpsBody.append("              <ValorCofins>0.00</ValorCofins>\n");
        rpsBody.append("              <ValorInss>0.00</ValorInss>\n");
        rpsBody.append("              <ValorIr>0.00</ValorIr>\n");
        rpsBody.append("              <ValorCsll>0.00</ValorCsll>\n");
        rpsBody.append("              <OutrasRetencoes>0.00</OutrasRetencoes>\n");
        rpsBody.append("              <ValorIss>").append(fmt2(vlrIss)).append("</ValorIss>\n");
        rpsBody.append("              <Aliquota>").append(fmt2(aliquota)).append("</Aliquota>\n");
        rpsBody.append("              <DescontoIncondicionado>0.00</DescontoIncondicionado>\n");
        rpsBody.append("              <DescontoCondicionado>0.00</DescontoCondicionado>\n");
        rpsBody.append("            </Valores>\n");
        rpsBody.append("            <IssRetido>2</IssRetido>\n");
        rpsBody.append("            <ItemListaServico>0101</ItemListaServico>\n");
        rpsBody.append("            <CodigoCnae>").append(padLeft(escapeXml(cnae), 7, '0')).append("</CodigoCnae>\n");
        rpsBody.append("            <CodigoTributacaoMunicipio>").append(padLeft(escapeXml(codTribMun), 9, '0')).append("</CodigoTributacaoMunicipio>\n");
        rpsBody.append("            <Discriminacao>").append(escapeXml(discriminacao)).append("</Discriminacao>\n");
        rpsBody.append("            <CodigoMunicipio>").append(codMun).append("</CodigoMunicipio>\n");
        rpsBody.append("            <CodigoPais>1058</CodigoPais>\n");
        rpsBody.append("            <ExigibilidadeISS>1</ExigibilidadeISS>\n");
        rpsBody.append("            <MunicipioIncidencia>").append(padLeft(codMun, 7, '0')).append("</MunicipioIncidencia>\n");
        rpsBody.append("          </Servico>\n");
        rpsBody.append("          <Prestador>\n");
        rpsBody.append("            <CpfCnpj>\n");
        rpsBody.append("              <Cnpj>").append(cnpjEmpresa).append("</Cnpj>\n");
        rpsBody.append("            </CpfCnpj>\n");
        rpsBody.append("            <InscricaoMunicipal>").append(escapeXml(inscMun)).append("</InscricaoMunicipal>\n");
        rpsBody.append("          </Prestador>\n");
        rpsBody.append("          <Tomador>\n");
        rpsBody.append("            <IdentificacaoTomador>\n");
        rpsBody.append("              <CpfCnpj>\n");
        if (cnpjCpf.length() <= 11) {
            rpsBody.append("                <Cpf>").append(cnpjCpf).append("</Cpf>\n");
        } else {
            rpsBody.append("                <Cnpj>").append(cnpjCpf).append("</Cnpj>\n");
        }
        rpsBody.append("              </CpfCnpj>\n");
        String imTomador = "";
        if (nota.containsKey("inscricaomunicipal_tomador")) {
            imTomador = str(nota.get("inscricaomunicipal_tomador"));
        } else if (nota.containsKey("im_tomador")) {
            imTomador = str(nota.get("im_tomador"));
        }
        if (!imTomador.trim().isEmpty()) {
            rpsBody.append("              <InscricaoMunicipal>").append(escapeXml(imTomador.trim())).append("</InscricaoMunicipal>\n");
        }
        rpsBody.append("            </IdentificacaoTomador>\n");
        rpsBody.append("            <RazaoSocial>").append(escapeXml(str(nota.get("nome_not")))).append("</RazaoSocial>\n");
        rpsBody.append("            <Endereco>\n");
        if (!logradouro.isEmpty()) {
            rpsBody.append("              <Endereco>").append(escapeXml(logradouro)).append("</Endereco>\n");
        }
        if (!numero.isEmpty()) {
            rpsBody.append("              <Numero>").append(escapeXml(numero)).append("</Numero>\n");
        }
        if (!bairro.isEmpty()) {
            rpsBody.append("              <Bairro>").append(escapeXml(bairro)).append("</Bairro>\n");
        }
        rpsBody.append("              <CodigoMunicipio>").append(codMun).append("</CodigoMunicipio>\n");
        if (!estado.isEmpty()) {
            rpsBody.append("              <Uf>").append(estado).append("</Uf>\n");
        }
        rpsBody.append("              <CodigoPais>1058</CodigoPais>\n");
        if (!cep.isEmpty()) {
            rpsBody.append("              <Cep>").append(cep).append("</Cep>\n");
        }
        rpsBody.append("            </Endereco>\n");
        String emailTomador = TOMADOR_EMAIL_HOMOLOG;
        if (!emailTomador.isEmpty()) {
            rpsBody.append("            <Contato>\n");
            rpsBody.append("              <Email>").append(escapeXml(emailTomador)).append("</Email>\n");
            rpsBody.append("            </Contato>\n");
        }
        rpsBody.append("          </Tomador>\n");
        String crt = str(empresa.get("crt_fil"));
        String optanteSimples = "2"; // 2 = Não
        String regimeEsp = "";

        if ("1".equals(crt) || "2".equals(crt)) {
            optanteSimples = "1"; // 1 = Sim
            regimeEsp = "6";      // 6 = ME/EPP do Simples Nacional
        } else if ("4".equals(crt)) {
            optanteSimples = "1"; // 1 = Sim
            regimeEsp = "5";      // 5 = MEI
        }

        if (!regimeEsp.isEmpty()) {
            rpsBody.append("          <RegimeEspecialTributacao>").append(regimeEsp).append("</RegimeEspecialTributacao>\n");
        }
        rpsBody.append("          <OptanteSimplesNacional>").append(optanteSimples).append("</OptanteSimplesNacional>\n");
        rpsBody.append("          <IncentivoFiscal>2</IncentivoFiscal>\n");

        rpsBody.append("        </InfDeclaracaoPrestacaoServico>\n");
        rpsBody.append("      </Rps>\n");

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<EnviarLoteRpsSincronoEnvio xmlns=\"http://www.abrasf.org.br/nfse.xsd\">\n");
        xml.append("  <LoteRps Id=\"Lote1\" versao=\"2.02\" xmlns=\"http://www.abrasf.org.br/nfse.xsd\">\n");
        xml.append("    <NumeroLote>1</NumeroLote>\n");
        xml.append("    <CpfCnpj>\n");
        xml.append("      <Cnpj>").append(cnpjEmpresa).append("</Cnpj>\n");
        xml.append("    </CpfCnpj>\n");
        xml.append("    <InscricaoMunicipal>").append(escapeXml(inscMun)).append("</InscricaoMunicipal>\n");
        xml.append("    <QuantidadeRps>1</QuantidadeRps>\n");
        xml.append("    <ListaRps>\n");
        xml.append(rpsBody);
        xml.append("    </ListaRps>\n");
        xml.append("  </LoteRps>\n");
        xml.append("</EnviarLoteRpsSincronoEnvio>\n");

        return xml.toString();
    }

    /**
     * Gera o XML da NFSe assinado digitalmente, sem enviar para WebISS.
     * Usado pelo endpoint /api/nfe/xml-assinado quando a série é 'U'.
     */
    public String gerarXmlNfseAssinado(Integer filial, Integer emissao, String tipo, String serie, Integer numero) {
        log.info("Gerando XML NFSe assinado: filial={}, emissao={}, tipo={}, serie={}, numero={}",
                filial, emissao, tipo, serie, numero);

        String tipoDb = tipo;
        if ("1".equals(tipo)) tipoDb = "S";
        else if ("2".equals(tipo)) tipoDb = "E";

        Map<String, Object> nota = buscarNotaCab(filial, emissao, tipoDb, serie, numero);
        List<Map<String, Object>> itens = buscarNotasDet(filial, emissao, tipoDb, serie, numero);
        Map<String, Object> empresa = buscarFilial(filial);

        String loteXml = gerarLoteRpsXml(nota, itens, empresa);
        String xmlAssinado = assinarRps(loteXml, filial);

        log.info("XML NFSe assinado gerado com sucesso para NFSe {}/{}", serie, numero);
        return xmlAssinado;
    }

    /**
     * Gera o XML da NFSe não assinado.
     * Usado pelo endpoint /api/nfe/xml quando a série é 'U'.
     */
    public String gerarXmlNfseNaoAssinado(Integer filial, Integer emissao, String tipo, String serie, Integer numero) {
        log.info("Gerando XML NFSe nao assinado: filial={}, emissao={}, tipo={}, serie={}, numero={}",
                filial, emissao, tipo, serie, numero);

        String tipoDb = tipo;
        if ("1".equals(tipo)) tipoDb = "S";
        else if ("2".equals(tipo)) tipoDb = "E";

        Map<String, Object> nota = buscarNotaCab(filial, emissao, tipoDb, serie, numero);
        List<Map<String, Object>> itens = buscarNotasDet(filial, emissao, tipoDb, serie, numero);
        Map<String, Object> empresa = buscarFilial(filial);

        return gerarLoteRpsXml(nota, itens, empresa);
    }

    /**
     * Envia um XML de Lote RPS pré-existente (gerado externamente ou via arquivo)
     * e o transmite para a prefeitura (WebISS), assinando-o caso não esteja assinado.
     */
    public Map<String, Object> enviarLoteRpsXml(String loteXml, Integer filial) {
        log.info("Enviando Lote RPS XML via monitor/arquivo para filial {}", filial);
        try {
            // Se o XML não contiver a tag de assinatura digital, assina antes de enviar
            if (!loteXml.contains("<Signature") && !loteXml.contains("<SignatureValue")) {
                loteXml = assinarRps(loteXml, filial);
            }

            String soapXml = montarSoapEnvelope(loteXml);
            String endpointUrl = obterEndpointUrl(filial);
            String soapResponse = enviarSoap(soapXml, endpointUrl);

            return parseRespostaWebIss(soapResponse);
        } catch (Exception e) {
            log.error("Erro ao enviar Lote RPS XML", e);
            Map<String, Object> erro = new HashMap<>();
            erro.put("sucesso", false);
            erro.put("erro", e.getMessage());
            return erro;
        }
    }

    private PrivateKey carregarPrivateKey(Integer filial) {
        try {
            String sql = "SELECT caminhocertificado_fil, senhacertificado_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, filial);
            if (rows.isEmpty()) {
                log.warn("masfil nao encontrada para filial {}", filial);
                return null;
            }
            Map<String, Object> row = rows.get(0);
            String certPath = str(row.get("caminhocertificado_fil")).trim();
            String certSenha = str(row.get("senhacertificado_fil")).trim();
            if (certPath.isEmpty()) {
                log.warn("caminhocertificado_fil nao configurado na masfil para filial {}", filial);
                return null;
            }
            log.info("Carregando certificado: {}", certPath);
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            try (InputStream is = Files.newInputStream(Paths.get(certPath))) {
                keyStore.load(is, certSenha.toCharArray());
            }
            String alias = keyStore.aliases().nextElement();
            return (PrivateKey) keyStore.getKey(alias, certSenha.toCharArray());
        } catch (Exception e) {
            log.error("Erro ao carregar certificado da filial {}", filial, e);
            return null;
        }
    }

    private X509Certificate carregarCertificado(Integer filial) {
        try {
            String sql = "SELECT caminhocertificado_fil, senhacertificado_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, filial);
            if (rows.isEmpty()) return null;
            Map<String, Object> row = rows.get(0);
            String certPath = str(row.get("caminhocertificado_fil")).trim();
            String certSenha = str(row.get("senhacertificado_fil")).trim();
            if (certPath.isEmpty()) return null;
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            try (InputStream is = Files.newInputStream(Paths.get(certPath))) {
                keyStore.load(is, certSenha.toCharArray());
            }
            String alias = keyStore.aliases().nextElement();
            return (X509Certificate) keyStore.getCertificate(alias);
        } catch (Exception e) {
            log.error("Erro ao carregar certificado X509 da filial {}", filial, e);
            return null;
        }
    }

    private String assinarRps(String xml, Integer filial) {
        PrivateKey privateKey = carregarPrivateKey(filial);
        X509Certificate cert = carregarCertificado(filial);
        if (privateKey == null || cert == null) {
            log.warn("Certificado nao disponivel, enviando RPS sem assinatura");
            return xml;
        }
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(true);
            Document doc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(xml.getBytes("UTF-8")));

            XMLSignatureFactory sigFactory = XMLSignatureFactory.getInstance("DOM");
            KeyInfoFactory kif = sigFactory.getKeyInfoFactory();
            List<Object> x509Content = new ArrayList<>();
            x509Content.add(cert);
            X509Data x509Data = kif.newX509Data(x509Content);
            KeyInfo keyInfo = kif.newKeyInfo(Collections.singletonList(x509Data));

            // 1. Assinatura do RPS (InfDeclaracaoPrestacaoServico Id=Inf1)
            Element rpsElement = null;
            NodeList infList = doc.getDocumentElement().getElementsByTagNameNS("http://www.abrasf.org.br/nfse.xsd", "InfDeclaracaoPrestacaoServico");
            for (int i = 0; i < infList.getLength(); i++) {
                Element el = (Element) infList.item(i);
                if ("Inf1".equals(el.getAttribute("Id"))) {
                    rpsElement = el;
                    break;
                }
            }

            if (rpsElement != null) {
                rpsElement.setIdAttribute("Id", true);
                Reference refRps = sigFactory.newReference(
                        "#Inf1",
                        sigFactory.newDigestMethod(DigestMethod.SHA1, null),
                        Arrays.asList(
                                sigFactory.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null),
                                sigFactory.newTransform(CanonicalizationMethod.INCLUSIVE, (TransformParameterSpec) null)
                        ),
                        null, null
                );
                SignedInfo signedInfoRps = sigFactory.newSignedInfo(
                        sigFactory.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
                        sigFactory.newSignatureMethod(SignatureMethod.RSA_SHA1, null),
                        Collections.singletonList(refRps)
                );
                DOMSignContext signContextRps = new DOMSignContext(privateKey, rpsElement.getParentNode());
                XMLSignature signatureRps = sigFactory.newXMLSignature(signedInfoRps, keyInfo);
                signatureRps.sign(signContextRps);

                // Limpa espacos e quebras de linha do RPS SignatureValue e X509Certificate no DOM
                Node parentRps = rpsElement.getParentNode();
                if (parentRps instanceof Element) {
                    NodeList sigValues = ((Element) parentRps).getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "SignatureValue");
                    if (sigValues.getLength() > 0) {
                        Node sv = sigValues.item(0);
                        sv.setTextContent(sv.getTextContent().replaceAll("\\s", ""));
                    }
                    NodeList certificates = ((Element) parentRps).getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "X509Certificate");
                    if (certificates.getLength() > 0) {
                        Node certNode = certificates.item(0);
                        certNode.setTextContent(certNode.getTextContent().replaceAll("\\s", ""));
                    }
                }
            }

            // 2. Assinatura do Lote (LoteRps Id=Lote1)
            Element loteElement = null;
            NodeList loteList = doc.getDocumentElement().getElementsByTagNameNS("http://www.abrasf.org.br/nfse.xsd", "LoteRps");
            for (int i = 0; i < loteList.getLength(); i++) {
                Element el = (Element) loteList.item(i);
                if ("Lote1".equals(el.getAttribute("Id"))) {
                    loteElement = el;
                    break;
                }
            }

            if (loteElement != null) {
                loteElement.setIdAttribute("Id", true);
                Reference refLote = sigFactory.newReference(
                        "#Lote1",
                        sigFactory.newDigestMethod(DigestMethod.SHA1, null),
                        Arrays.asList(
                                sigFactory.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null),
                                sigFactory.newTransform(CanonicalizationMethod.INCLUSIVE, (TransformParameterSpec) null)
                        ),
                        null, null
                );
                SignedInfo signedInfoLote = sigFactory.newSignedInfo(
                        sigFactory.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
                        sigFactory.newSignatureMethod(SignatureMethod.RSA_SHA1, null),
                        Collections.singletonList(refLote)
                );
                DOMSignContext signContextLote = new DOMSignContext(privateKey, doc.getDocumentElement());
                XMLSignature signatureLote = sigFactory.newXMLSignature(signedInfoLote, keyInfo);
                signatureLote.sign(signContextLote);

                // Limpa espacos e quebras de linha do Lote SignatureValue e X509Certificate no DOM
                Node parentLote = doc.getDocumentElement();
                if (parentLote instanceof Element) {
                    NodeList sigValues = ((Element) parentLote).getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "SignatureValue");
                    if (sigValues.getLength() > 0) {
                        Node sv = sigValues.item(sigValues.getLength() - 1);
                        sv.setTextContent(sv.getTextContent().replaceAll("\\s", ""));
                    }
                    NodeList certificates = ((Element) parentLote).getElementsByTagNameNS("http://www.w3.org/2000/09/xmldsig#", "X509Certificate");
                    if (certificates.getLength() > 0) {
                        Node certNode = certificates.item(certificates.getLength() - 1);
                        certNode.setTextContent(certNode.getTextContent().replaceAll("\\s", ""));
                    }
                }
            }

            StringWriter writer = new StringWriter();
            Transformer transformer = TransformerFactory.newInstance().newTransformer();
            transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
            transformer.transform(new DOMSource(doc), new StreamResult(writer));

            String xmlAssinado = writer.toString();
            xmlAssinado = limparEspacosAssinatura(xmlAssinado);

            log.info("RPS e Lote assinados com sucesso");
            return xmlAssinado;
        } catch (Exception e) {
            log.error("Erro ao assinar RPS e Lote", e);
            return xml;
        }
    }

    private String limparEspacosAssinatura(String xml) {
        // Remove quebras de linha, espacos e a entidade &#13; de dentro das tags de SignatureValue
        java.util.regex.Pattern patternSig = java.util.regex.Pattern.compile("(<SignatureValue>)(.*?)(</SignatureValue>)", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher matcherSig = patternSig.matcher(xml);
        StringBuffer sb = new StringBuffer();
        while (matcherSig.find()) {
            String cleaned = matcherSig.group(2).replaceAll("\\s", "").replace("&#13;", "");
            matcherSig.appendReplacement(sb, matcherSig.group(1) + cleaned + matcherSig.group(3));
        }
        matcherSig.appendTail(sb);
        xml = sb.toString();

        // Remove quebras de linha, espacos e a entidade &#13; de dentro das tags de X509Certificate
        java.util.regex.Pattern patternCert = java.util.regex.Pattern.compile("(<X509Certificate>)(.*?)(</X509Certificate>)", java.util.regex.Pattern.DOTALL);
        java.util.regex.Matcher matcherCert = patternCert.matcher(xml);
        sb = new StringBuffer();
        while (matcherCert.find()) {
            String cleaned = matcherCert.group(2).replaceAll("\\s", "").replace("&#13;", "");
            matcherCert.appendReplacement(sb, matcherCert.group(1) + cleaned + matcherCert.group(3));
        }
        matcherCert.appendTail(sb);
        xml = sb.toString();

        return xml;
    }

    private String formatarDataEmissao(Map<String, Object> nota) {
        Object emissaoObj = nota.get("emissaoi_not");
        if (emissaoObj == null) return LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        String dataStr = String.valueOf(emissaoObj);
        while (dataStr.length() < 8) dataStr = "0" + dataStr;
        try {
            int dia = Integer.parseInt(dataStr.substring(0, 2));
            int mes = Integer.parseInt(dataStr.substring(2, 4));
            int ano = Integer.parseInt(dataStr.substring(4, 8));
            return LocalDateTime.of(ano, mes, dia, 10, 0, 0).format(DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (Exception e) {
            return LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        }
    }

    private String montarSoapEnvelope(String rpsXml) {
        String cabecalhoXml = "<cabecalho versao=\"2.02\" xmlns=\"http://www.abrasf.org.br/nfse.xsd\">\n" +
                "  <versaoDados>2.02</versaoDados>\n" +
                "</cabecalho>";

        log.info("=== CABECALHO XML ===");
        log.info(cabecalhoXml);
        log.info("=== RPS XML COMPLETO ===");
        log.info(rpsXml);

        StringBuilder soap = new StringBuilder();
        soap.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        soap.append("<soap:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n");
        soap.append("  xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\"\n");
        soap.append("  xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n");
        soap.append("  <soap:Body>\n");
        soap.append("    <RecepcionarLoteRpsSincronoRequest xmlns=\"http://nfse.abrasf.org.br\">\n");
        soap.append("      <nfseCabecMsg xmlns=\"\">\n");
        soap.append("        <![CDATA[\n");
        soap.append("          ").append(cabecalhoXml).append("\n");
        soap.append("        ]]>\n");
        soap.append("      </nfseCabecMsg>\n");
        soap.append("      <nfseDadosMsg xmlns=\"\">\n");
        soap.append("        <![CDATA[\n");
        soap.append("          ").append(rpsXml).append("\n");
        soap.append("        ]]>\n");
        soap.append("      </nfseDadosMsg>\n");
        soap.append("    </RecepcionarLoteRpsSincronoRequest>\n");
        soap.append("  </soap:Body>\n");
        soap.append("</soap:Envelope>");

        log.info("=== SOAP ENVELOPE COMPLETO ===");
        log.info(soap.toString());

        return soap.toString();
    }

    private String enviarSoap(String soapXml, String endpointUrl) throws Exception {
        log.info("Enviando SOAP para WebISS: {}", endpointUrl);

        URL url = new URL(endpointUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();

        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "text/xml; charset=utf-8");
        conn.setRequestProperty("SOAPAction", SOAP_ACTION);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(soapXml.getBytes(StandardCharsets.UTF_8));
        }

        int responseCode = conn.getResponseCode();
        log.info("Resposta WebISS: {}", responseCode);

        if (responseCode == HttpURLConnection.HTTP_OK) {
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                String responseXml = response.toString();
                log.info("Resposta WebISS (primeiros 2000 chars): {}", responseXml.length() > 2000 ? responseXml.substring(0, 2000) : responseXml);
                return responseXml;
            }
        } else {
            StringBuilder errorResponse = new StringBuilder();
            try (InputStream es = conn.getErrorStream()) {
                if (es != null) {
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(es, StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = br.readLine()) != null) {
                            errorResponse.append(line);
                        }
                    }
                }
            }
            log.error("Erro HTTP {} da WebISS: {}", responseCode, errorResponse);
            throw new RuntimeException("Erro na comunicacao com WebISS: HTTP " +
                    responseCode + " - " + errorResponse);
        }
    }

    private Map<String, Object> parseRespostaWebIss(String soapResponse) {
        Map<String, Object> result = new HashMap<>();
        result.put("respostaXml", soapResponse);

        try {
            String outputXmlRaw = extractTag(soapResponse, "outputXML");
            if (outputXmlRaw == null) {
                result.put("sucesso", false);
                result.put("erro", "Resposta sem outputXML");
                return result;
            }

            String outputXml = tryDecodeBase64(outputXmlRaw);
            if (outputXml == null) {
                outputXml = unescapeXml(outputXmlRaw);
            }
            result.put("outputXml", outputXml);
            log.info("outputXml decodificado: {}", outputXml.length() > 1000 ? outputXml.substring(0, 1000) : outputXml);

            List<Map<String, String>> mensagens = extrairMensagensRetorno(outputXml);
            if (!mensagens.isEmpty()) {
                result.put("sucesso", false);
                result.put("mensagens", mensagens);
                String errosConcatenados = mensagens.stream()
                        .map(m -> m.get("codigo") + ": " + m.get("mensagem"))
                        .collect(Collectors.joining(" | "));
                result.put("erro", errosConcatenados);
                return result;
            }

            String protocolo = extractTag(outputXml, "Protocolo");
            String numeroLote = extractTag(outputXml, "NumeroLote");
            String dataRecebimento = extractTag(outputXml, "DataRecebimento");

            result.put("sucesso", true);
            result.put("protocolo", protocolo != null ? protocolo : "");
            result.put("numeroLote", numeroLote != null ? numeroLote : "");
            result.put("dataRecebimento", dataRecebimento != null ? dataRecebimento : "");

            if (protocolo != null) {
                result.put("mensagem", "Lote de RPS recebido com sucesso. Protocolo: " + protocolo);
            } else {
                result.put("mensagem", "Lote de RPS recebido com sucesso.");
            }

        } catch (Exception e) {
            log.error("Erro ao processar resposta da WebISS", e);
            result.put("sucesso", false);
            result.put("erro", "Erro ao processar resposta: " + e.getMessage());
        }

        return result;
    }

    private String extractTag(String xml, String tag) {
        String open = "<" + tag + ">";
        String close = "</" + tag + ">";
        int start = xml.indexOf(open);
        if (start < 0) {
            open = "<" + tag + " xmlns=\"\"";
            start = xml.indexOf(open);
            if (start < 0) {
                open = "<" + tag + " ";
                start = xml.indexOf(open);
            }
        }
        if (start >= 0) {
            start = xml.indexOf(">", start) + 1;
            int end = xml.indexOf(close, start);
            if (end > start) {
                return xml.substring(start, end).trim();
            }
        }
        return null;
    }

    private List<Map<String, String>> extrairMensagensRetorno(String xml) {
        List<Map<String, String>> mensagens = new ArrayList<>();
        String listaTag = "<ListaMensagemRetorno>";
        int listaStart = xml.indexOf(listaTag);
        if (listaStart < 0) return mensagens;

        String listaSection = xml.substring(listaStart);
        String msgTag = "<MensagemRetorno>";
        String msgClose = "</MensagemRetorno>";
        int pos = 0;
        while (true) {
            int start = listaSection.indexOf(msgTag, pos);
            if (start < 0) break;
            int end = listaSection.indexOf(msgClose, start);
            if (end < 0) break;
            String msgXml = listaSection.substring(start + msgTag.length(), end);

            Map<String, String> msg = new HashMap<>();
            msg.put("codigo", extractTag(msgXml, "Codigo"));
            msg.put("mensagem", extractTag(msgXml, "Mensagem"));
            msg.put("correcao", extractTag(msgXml, "Correcao"));
            mensagens.add(msg);

            pos = end + msgClose.length();
        }
        return mensagens;
    }

    private static String str(Object value) {
        return value != null ? value.toString() : "";
    }

    private static BigDecimal dec(Object value) {
        if (value == null) return BigDecimal.ZERO;
        return new BigDecimal(value.toString());
    }

    private static String fmt2(BigDecimal value) {
        if (value == null) return "0.00";
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private static String escapeXml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private static String tryDecodeBase64(String raw) {
        try {
            return new String(Base64.getDecoder().decode(raw), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    private static String unescapeXml(String raw) {
        if (raw == null) return "";
        return raw.replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&apos;", "'");
    }

    private static String padLeft(String s, int length, char padChar) {
        if (s == null) s = "";
        StringBuilder sb = new StringBuilder(length);
        for (int i = s.length(); i < length; i++) {
            sb.append(padChar);
        }
        sb.append(s);
        return sb.toString();
    }
}
