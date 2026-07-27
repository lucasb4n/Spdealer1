package br.com.spdealer.nfe.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

/**
 * Serviço para geração do XML da NF-e
 * Baseado na estrutura do PyNFe (https://github.com/TadaSoftware/PyNFe)
 * 
 * Este serviço gera o XML conforme o layout 4.00 da NF-e
 * 
 * Dados do emitente são lidos da tabela masger
 */
@Service
@Slf4j
public class NfeXmlService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Gera o XML completo da NF-e
     * 
     * @param filial  Código da filial
     * @param emissao Data de emissão no formato DDMMAAAA
     * @param tipo    Tipo da nota (E=Entrada, S=Saída)
     * @param serie   Série da nota
     * @param numero  Número da nota
     * @return XML da NF-e
     */
    public String gerarXmlNfe(Integer filial, Integer emissao, String tipo, String serie, Integer numero) {
        log.info("Gerando XML NF-e: filial={}, emissao={}, tipo={}, serie={}, numero={}",
                filial, emissao, tipo, serie, numero);

        // Busca os dados da nota usando JDBC direto
        StringBuilder sqlCab = new StringBuilder();
        sqlCab.append("SELECT * FROM notascab WHERE filial_not = ? AND emissaoi_not = ? ");
        sqlCab.append("AND tipo_not = ? AND serie_not = ? AND numero_not = ?");

        log.info("SQL: {}", sqlCab.toString());
        log.info("Params: filial={}, emissao={}, tipo={}, serie={}, numero={}", filial, emissao, tipo, serie, numero);

        // O parâmetro emissao já está no formato AAAAMMDD (ex: 20260106)
        // Não precisa converter
        Integer emissaoDb = emissao;
        log.info("Data para banco: {}", emissaoDb);

        List<Map<String, Object>> notasCab = jdbcTemplate.queryForList(
                sqlCab.toString(),
                new Object[] { filial, emissaoDb, tipo, serie, numero });

        if (notasCab.isEmpty()) {
            // Tenta sem filtro de série (pode estar com formato diferente)
            log.warn("Nenhuma nota encontrada com filtros exatos. Tentando sem série...");
            List<Map<String, Object>> notasSemSerie = jdbcTemplate.queryForList(
                    "SELECT * FROM notascab WHERE filial_not = ? AND emissaoi_not = ? AND tipo_not = ? AND numero_not = ?",
                    new Object[] { filial, emissaoDb, tipo, numero });
            if (!notasSemSerie.isEmpty()) {
                notasCab = notasSemSerie;
                log.info("Nota encontrada sem filtro de série");
            } else {
                throw new RuntimeException("Nota fiscal não encontrada no banco de dados. " +
                        "Verifique os parâmetros: filial=" + filial + ", emissao=" + emissao +
                        ", tipo=" + tipo + ", serie=" + serie + ", numero=" + numero);
            }
        }

        Map<String, Object> nota = notasCab.get(0);
        log.info("Nota encontrada: {}", nota);

        // Busca os itens da nota
        StringBuilder sqlDet = new StringBuilder();
        sqlDet.append("SELECT * FROM notasdet WHERE filial_not = ? AND emissaoi_not = ? ");
        sqlDet.append("AND tipo_not = ? AND serie_not = ? AND numero_not = ? ORDER BY sequencia_not");

        List<Map<String, Object>> itens = jdbcTemplate.queryForList(
                sqlDet.toString(),
                new Object[] { filial, emissaoDb, tipo, serie, numero });

        log.info("Itens encontrados: {}", itens.size());

        // Gera a chave da NF-e
        String chaveNfe = gerarChaveNfe(nota);

        // Gera o XML
        StringBuilder xml = new StringBuilder();

        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<NFe xmlns=\"http://www.portalfiscal.inf.br/nfe\">\n");

        // InfNFe
        xml.append("  <infNFe Id=\"NFe").append(chaveNfe).append("\" versao=\"4.00\">\n");

        // Ide
        String estado = getStringValue(nota, "estado_not");
        Integer numeroNota = getIntValue(nota, "numero_not");

        // Converte data do banco (AAAAMMDD) para formato XML (DDMMAAAA)
        Integer emissaoXml = converterDataParaXml(getIntValue(nota, "emissaoi_not"));
        Integer dtmoviXml = converterDataParaXml(getIntValue(nota, "dtmovi_not"));

        xml.append("    <ide>\n");
        xml.append("      <cUF>").append(getCodigoUF(estado)).append("</cUF>\n");
        xml.append("      <cNF>").append(String.format("%08d", numeroNota != null ? numeroNota % 100000000 : 0))
                .append("</cNF>\n");
        xml.append("      <natOp>").append(escapeXml(getNaturezaOperacao(nota))).append("</natOp>\n");
        xml.append("      <mod>55</mod>\n"); // 55 = NF-e
        xml.append("      <serie>").append(getStringValue(nota, "serie_not")).append("</serie>\n");
        xml.append("      <nNF>").append(numeroNota != null ? numeroNota : 0).append("</nNF>\n");
        xml.append("      <dhEmi>").append(formatarDataHoraNfe(emissaoXml)).append("</dhEmi>\n");
        xml.append("      <dhSaiEnt>").append(formatarDataHoraNfe(dtmoviXml)).append("</dhSaiEnt>\n");
        xml.append("      <tpNF>").append("S".equals(getStringValue(nota, "tipo_not")) ? "1" : "0").append("</tpNF>\n");
        xml.append("      <idDest>1</idDest>\n"); // 1=Operação interna
        xml.append("      <cMunFG>").append(getCodigoMunicipio(nota)).append("</cMunFG>\n");
        xml.append("      <tpImp>1</tpImp>\n"); // 1=Retrato
        xml.append("      <tpEmis>1</tpEmis>\n"); // 1=Normal
        xml.append("      <cDV>").append(chaveNfe.substring(43, 44)).append("</cDV>\n");
        xml.append("      <tpAmb>2</tpAmb>\n"); // 2=Homologação
        xml.append("      <finNFe>1</finNFe>\n"); // 1=NF-e normal
        xml.append("      <indFinal>1</indFinal>\n"); // 1=Consumidor final
        xml.append("      <indPres>1</indPres>\n"); // 1=Presencial
        xml.append("      <procEmi>0</procEmi>\n"); // 0=Applicativo
        xml.append("      <verProc>4.00</verProc>\n"); // Versão do processo
        xml.append("    </ide>\n");

        // Emit (Emissor)
        xml.append("    <emit>\n");
        xml.append("      <CNPJ>").append(getCnpjEmitente(nota)).append("</CNPJ>\n");
        xml.append("      <xNome>").append(escapeXml(getNomeEmitente(nota))).append("</xNome>\n");
        xml.append("      <xFant>").append(escapeXml(getNomeFantasiaEmitente(nota))).append("</xFant>\n");
        xml.append("      <enderEmit>\n");
        xml.append("        <xLgr>").append(escapeXml(getEnderecoEmitente(nota))).append("</xLgr>\n");
        xml.append("        <nro>").append("").append("</nro>\n");
        xml.append("        <xBairro>").append(escapeXml(getBairroEmitente(nota))).append("</xBairro>\n");
        xml.append("        <cMun>").append(getCodigoMunicipioIBGE(nota)).append("</cMun>\n");
        xml.append("        <xMun>").append(escapeXml(getCidadeEmitente(nota))).append("</xMun>\n");
        xml.append("        <UF>").append(getUFEmitente(nota)).append("</UF>\n");
        xml.append("        <CEP>").append(getCEPEmitente(nota)).append("</CEP>\n");
        xml.append("        <cPais>1058</cPais>\n");
        xml.append("        <xPais>BRASIL</xPais>\n");
        xml.append("        <fone>").append(getTelefoneEmitente(nota)).append("</fone>\n");
        xml.append("      </enderEmit>\n");
        xml.append("      <IE>").append(getIEEmitente(nota)).append("</IE>\n");
        xml.append("      <IM>").append(getInscricaoMunicipal(nota)).append("</IM>\n");
        xml.append("      <CNAE>").append(getCnae(nota)).append("</CNAE>\n");
        xml.append("      <CRT>").append(getCRT(nota)).append("</CRT>\n"); // 3=Regime normal
        xml.append("    </emit>\n");

        // Dest (Destinatário)
        String cgccpf = getStringValue(nota, "cgccpf_not");
        if (cgccpf != null && !cgccpf.isEmpty()) {
            xml.append("    <dest>\n");
            if (cgccpf.length() == 11) {
                xml.append("      <CPF>").append(cgccpf).append("</CPF>\n");
            } else {
                xml.append("      <CNPJ>").append(cgccpf).append("</CNPJ>\n");
            }
            xml.append("      <xNome>").append(escapeXml(getStringValue(nota, "nome_not"))).append("</xNome>\n");
            xml.append("      <enderDest>\n");
            xml.append("        <xLgr>").append(escapeXml(getStringValue(nota, "endereco_not"))).append("</xLgr>\n");
            xml.append("        <nro></nro>\n");
            xml.append("        <xBairro>").append(escapeXml(getStringValue(nota, "bairro_not")))
                    .append("</xBairro>\n");
            xml.append("        <cMun>").append(getCodigoMunicipioDest(nota)).append("</cMun>\n");
            xml.append("        <xMun>").append(escapeXml(getStringValue(nota, "cidade_not"))).append("</xMun>\n");
            xml.append("        <UF>").append(estado != null ? estado : "").append("</UF>\n");
            xml.append("        <CEP>").append(getStringValue(nota, "cep_not")).append("</CEP>\n");
            xml.append("        <cPais>1058</cPais>\n");
            xml.append("        <xPais>BRASIL</xPais>\n");
            xml.append("      </enderDest>\n");
            xml.append("      <indIEDest>1</indIEDest>\n"); // 1=Contribuinte ICP-Brasil
            xml.append("      <IE>").append(getIEDestinatario(nota)).append("</IE>\n");
            xml.append("      <email>").append(getEmailDestinatario(nota)).append("</email>\n");
            xml.append("    </dest>\n");
        }

        // Produtos
        int nItem = 1;
        for (Map<String, Object> item : itens) {
            xml.append("    <det nItem=\"").append(nItem).append("\">\n");
            xml.append("      <prod>\n");
            xml.append("        <cProd>").append(escapeXml(getStringValue(item, "produto_not"))).append("</cProd>\n");
            // cEAN - usa campo da tabela notasdet
            String cEAN = getStringValue(item, "codbarras_not");
            xml.append("        <cEAN>").append(cEAN.isEmpty() ? "SEM GTIN" : cEAN).append("</cEAN>\n");
            xml.append("        <xProd>").append(escapeXml(getStringValue(item, "descprod_not"))).append("</xProd>\n");
            // NCM
            String ncm = getStringValue(item, "codclassfiscal_not");
            xml.append("        <NCM>").append(ncm).append("</NCM>\n");
            // CEST
            xml.append("        <CEST>").append(getStringValue(item, "codcest_not")).append("</CEST>\n");
            // EXTIPI
            xml.append("        <EXTIPI>").append(getStringValue(item, "extipi_not")).append("</EXTIPI>\n");
            // CFOP
            xml.append("        <CFOP>")
                    .append(getStringValue(item, "codcfop_not") != null ? getStringValue(item, "codcfop_not") : "5101")
                    .append("</CFOP>\n");
            xml.append("        <uCom>")
                    .append(getStringValue(item, "unidade_not") != null ? getStringValue(item, "unidade_not") : "UN")
                    .append("</uCom>\n");
            xml.append("        <qCom>").append(formatarDecimal(getBigDecimalValue(item, "quant_not")))
                    .append("</qCom>\n");
            xml.append("        <vUnCom>").append(formatarDecimal4(getBigDecimalValue(item, "valoruni_not")))
                    .append("</vUnCom>\n");
            xml.append("        <vProd>").append(formatarDecimal2(getBigDecimalValue(item, "valortot_not")))
                    .append("</vProd>\n");
            xml.append("        <cEANTrib>").append(cEAN.isEmpty() ? "SEM GTIN" : cEAN).append("</cEANTrib>\n");
            xml.append("        <uTrib>")
                    .append(getStringValue(item, "unidade_not") != null ? getStringValue(item, "unidade_not") : "UN")
                    .append("</uTrib>\n");
            xml.append("        <qTrib>").append(formatarDecimal(getBigDecimalValue(item, "quant_not")))
                    .append("</qTrib>\n");
            xml.append("        <vUnTrib>").append(formatarDecimal4(getBigDecimalValue(item, "valoruni_not")))
                    .append("</vUnTrib>\n");
            xml.append("        <vFrete>").append(formatarDecimal2(getBigDecimalValue(item, "vlrfret_not")))
                    .append("</vFrete>\n");
            xml.append("        <vDesc>").append(formatarDecimal2(getBigDecimalValue(item, "desconto_not")))
                    .append("</vDesc>\n");
            xml.append("        <indTot>1</indTot>\n");
            xml.append("      </prod>\n");

            // Impostos
            xml.append("      <imposto>\n");
            xml.append("        <vTotTrib>").append(formatarDecimal2(calcularTotalTributos(item)))
                    .append("</vTotTrib>\n");

            // ICMS - usa CST das tabelas MASCFO/MASTRIB
            String cstIcms = getCSTICMS(item, nota);
            String origem = getOrigemMercadoria(item);

            xml.append("        <ICMS>\n");
            if ("1".equals(getCRT(nota))) {
                // Simples Nacional - usa ICMSSN500
                xml.append("          <ICMSSN500>\n");
                xml.append("            <orig>").append(origem).append("</orig>\n");
                xml.append("            <CSOSN>").append("500").append("</CSOSN>\n");
                xml.append("          </ICMSSN500>\n");
            } else {
                // Regime Normal - usa CST do CFOP
                xml.append("          <ICMS").append(cstIcms).append(">\n");
                xml.append("            <orig>").append(origem).append("</orig>\n");
                xml.append("            <CST>").append(cstIcms).append("</CST>\n");

                // Se CST é 00, 10, 20, 70 ou 90, inclui base e alíquota
                if ("00".equals(cstIcms) || "10".equals(cstIcms) || "20".equals(cstIcms) || "70".equals(cstIcms)
                        || "90".equals(cstIcms)) {
                    xml.append("            <modBC>").append("0").append("</modBC>\n");
                    xml.append("            <vBC>").append(formatarDecimal2(getBigDecimalValue(item, "baseicms_not")))
                            .append("</vBC>\n");
                    xml.append("            <pICMS>").append(formatarDecimal2(getBigDecimalValue(item, "aliqicms_not")))
                            .append("</pICMS>\n");
                    xml.append("            <vICMS>").append(formatarDecimal2(getBigDecimalValue(item, "vlricms_not")))
                            .append("</vICMS>\n");
                }
                xml.append("          </ICMS").append(cstIcms).append(">\n");
            }
            xml.append("        </ICMS>\n");

            // PIS - usa CST baseado na lógica COBOL
            String cstPis = getCSTPIS(item, nota);
            xml.append("        <PIS>\n");
            if (cstPis.isEmpty()) {
                // Serviço - usa PISNT por padrão
                xml.append("          <PISNT>\n");
                xml.append("            <CST>04</CST>\n");
                xml.append("          </PISNT>\n");
            } else if ("04".equals(cstPis) || "05".equals(cstPis) || "06".equals(cstPis) || "07".equals(cstPis)
                    || "08".equals(cstPis) || "09".equals(cstPis)) {
                // PISNT
                xml.append("          <PISNT>\n");
                xml.append("            <CST>").append(cstPis).append("</CST>\n");
                xml.append("          </PISNT>\n");
            } else if ("99".equals(cstPis)) {
                // PISOutr
                xml.append("          <PISOutr>\n");
                xml.append("            <CST>").append(cstPis).append("</CST>\n");
                xml.append("            <vBC>").append(formatarDecimal2(getBigDecimalValue(item, "valortot_not")))
                        .append("</vBC>\n");
                xml.append("            <pPIS>").append("0.0000").append("</pPIS>\n");
                xml.append("            <vPIS>").append(formatarDecimal2(getBigDecimalValue(item, "vlrpis_not")))
                        .append("</vPIS>\n");
                xml.append("          </PISOutr>\n");
            } else {
                // PISAliq
                xml.append("          <PISAliq>\n");
                xml.append("            <CST>").append(cstPis).append("</CST>\n");
                xml.append("            <vBC>").append(formatarDecimal2(getBigDecimalValue(item, "valortot_not")))
                        .append("</vBC>\n");
                xml.append("            <pPIS>").append("0").append("</pPIS>\n");
                xml.append("            <vPIS>").append(formatarDecimal2(getBigDecimalValue(item, "vlrpis_not")))
                        .append("</vPIS>\n");
                xml.append("          </PISAliq>\n");
            }
            xml.append("        </PIS>\n");

            // COFINS - usa CST baseado na lógica COBOL
            String cstCofins = getCSTCOFINS(item, nota);
            xml.append("        <COFINS>\n");
            if (cstCofins.isEmpty()) {
                // Serviço - usa COFINSNT por padrão
                xml.append("          <COFINSNT>\n");
                xml.append("            <CST>04</CST>\n");
                xml.append("          </COFINSNT>\n");
            } else if ("04".equals(cstCofins) || "05".equals(cstCofins) || "06".equals(cstCofins)
                    || "07".equals(cstCofins)
                    || "08".equals(cstCofins) || "09".equals(cstCofins)) {
                // COFINSNT
                xml.append("          <COFINSNT>\n");
                xml.append("            <CST>").append(cstCofins).append("</CST>\n");
                xml.append("          </COFINSNT>\n");
            } else if ("99".equals(cstCofins)) {
                // COFINSOutr
                xml.append("          <COFINSOutr>\n");
                xml.append("            <CST>").append(cstCofins).append("</CST>\n");
                xml.append("            <vBC>").append(formatarDecimal2(getBigDecimalValue(item, "valortot_not")))
                        .append("</vBC>\n");
                xml.append("            <pCOFINS>").append("0.0000").append("</pCOFINS>\n");
                xml.append("            <vCOFINS>").append(formatarDecimal2(getBigDecimalValue(item, "vlrcofins_not")))
                        .append("</vCOFINS>\n");
                xml.append("          </COFINSOutr>\n");
            } else {
                // COFINSAliq
                xml.append("          <COFINSAliq>\n");
                xml.append("            <CST>").append(cstCofins).append("</CST>\n");
                xml.append("            <vBC>").append(formatarDecimal2(getBigDecimalValue(item, "valortot_not")))
                        .append("</vBC>\n");
                xml.append("            <pCOFINS>").append("0").append("</pCOFINS>\n");
                xml.append("            <vCOFINS>").append(formatarDecimal2(getBigDecimalValue(item, "vlrcofins_not")))
                        .append("</vCOFINS>\n");
                xml.append("          </COFINSAliq>\n");
            }
            xml.append("        </COFINS>\n");

            xml.append("      </imposto>\n");
            xml.append("    </det>\n");
            nItem++;
        }

        // Totais
        xml.append("    <total>\n");
        xml.append("      <ICMSTot>\n");
        xml.append("        <vBC>").append(formatarDecimal2(calcularBaseIcms(itens))).append("</vBC>\n");
        xml.append("        <vICMS>").append(formatarDecimal2(calcularValorIcms(itens))).append("</vICMS>\n");
        xml.append("        <vICMSDeson>0</vICMSDeson>\n");
        xml.append("        <vBCST>0</vBCST>\n");
        xml.append("        <vST>0</vST>\n");
        xml.append("        <vProd>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrmerc_not")))
                .append("</vProd>\n");
        xml.append("        <vFrete>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrfret_not")))
                .append("</vFrete>\n");
        xml.append("        <vSeg>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrseg_not")))
                .append("</vSeg>\n");
        xml.append("        <vDesc>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrdesc_not")))
                .append("</vDesc>\n");
        xml.append("        <vII>0</vII>\n");
        xml.append("        <vIPI>0</vIPI>\n");
        xml.append("        <vPIS>").append(formatarDecimal2(calcularValorPis(itens))).append("</vPIS>\n");
        xml.append("        <vCOFINS>").append(formatarDecimal2(calcularValorCofins(itens))).append("</vCOFINS>\n");
        xml.append("        <vOutro>").append(formatarDecimal2(getBigDecimalValue(nota, "vlroutros_not")))
                .append("</vOutro>\n");
        xml.append("        <vNF>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrnot_not"))).append("</vNF>\n");
        xml.append("        <vTotTrib>").append(formatarDecimal2(calcularTotalTributosItens(itens)))
                .append("</vTotTrib>\n");
        xml.append("      </ICMSTot>\n");
        xml.append("    </total>\n");

        // Transportadora
        xml.append("    <transp>\n");
        xml.append("      <modFrete>").append(getModalidadeFrete(nota)).append("</modFrete>\n");
        xml.append(getInfoVolume(nota));
        xml.append("    </transp>\n");

        // Cobrança (opcional)
        String condpag = getStringValue(nota, "condpag_not");
        if (condpag != null && !condpag.isEmpty()) {
            xml.append("    <cobr>\n");
            xml.append("      <fat>\n");
            xml.append("        <nFat>").append(numeroNota != null ? numeroNota : 0).append("</nFat>\n");
            xml.append("        <vOrig>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrnot_not")))
                    .append("</vOrig>\n");
            xml.append("        <vDesc>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrdesc_not")))
                    .append("</vDesc>\n");
            BigDecimal vDescLiq = getBigDecimalValue(nota, "vlrdesc_not");
        xml.append("        <vLiq>").append(formatarDecimal2(
                    getBigDecimalValue(nota, "vlrnot_not").subtract(vDescLiq != null ? vDescLiq : BigDecimal.ZERO)))
                    .append("</vLiq>\n");
            xml.append("      </fat>\n");
            // Duplicatas
            xml.append(getDuplicatas(nota));
            xml.append("    </cobr>\n");
        }

        // Informações de pagamento
        xml.append(getInfoPagamento(nota));

        // Informações adicionais
        xml.append("    <infAdic>\n");
        xml.append("      <infCpl>").append(getInfoComplementar(nota)).append("</infCpl>\n");
        xml.append("    </infAdic>\n");

        xml.append("  </infNFe>\n");
        xml.append("</NFe>\n");

        log.info("XML NF-e gerado com sucesso. Chave: {}", chaveNfe);

        return xml.toString();
    }

    /**
     * Gera a chave de acesso da NF-e (44 dígitos)
     * Formato: UF(2) + AAMM(4) + CNPJ(14) + Modelo(2) + Série(3) + Número(9) + Tipo
     * Emissão(1) + Código Numérico(8) + DV(1)
     */
    private String gerarChaveNfe(Map<String, Object> nota) {
        StringBuilder chave = new StringBuilder();

        // Código da UF (ex: SP = 35)
        String estado = getStringValue(nota, "estado_not");
        chave.append(getCodigoUF(estado));

        // Ano e mês da emissão (AA/MM)
        // Data do banco está em AAAAMMDD, precisa extrair AAMM
        Integer emissao = getIntValue(nota, "emissaoi_not");
        if (emissao != null && emissao >= 10000000) {
            String emissaoStr = String.valueOf(emissao);
            // AAAAMM - pega os 6 primeiros dígitos
            chave.append(emissaoStr.substring(2, 6)); // AAMM
        } else {
            LocalDateTime now = LocalDateTime.now();
            chave.append(String.format("%02d%02d", now.getYear() % 100, now.getMonthValue()));
        }

        // CNPJ do emitente (14 dígitos)
        String cnpjEmitente = getCnpjEmitente(nota);
        try {
            chave.append(String.format("%014d", Long.parseLong(cnpjEmitente != null ? cnpjEmitente : "0")));
        } catch (NumberFormatException e) {
            chave.append("00000000000000");
        }

        // Modelo (55 = NF-e)
        chave.append("55");

        // Série (3 dígitos)
        String serie = getStringValue(nota, "serie_not");
        if (serie != null && !serie.isEmpty()) {
            try {
                chave.append(String.format("%03d", Integer.parseInt(serie)));
            } catch (NumberFormatException e) {
                chave.append("001");
            }
        } else {
            chave.append("001");
        }

        // Número da NF-e (9 dígitos)
        Integer numero = getIntValue(nota, "numero_not");
        chave.append(String.format("%09d", numero != null ? numero : 0));

        // Tipo de emissão (1 = Normal)
        chave.append("1");

        // Código numérico (8 dígitos) - generado aleatoriamente ou sequencial
        String codigoNumerico = String.format("%08d", numero != null ? numero % 100000000 : 0);
        chave.append(codigoNumerico);

        // Dígito verificador
        String baseChave = chave.toString();
        int dv = calcularDigitoVerificador(baseChave);
        chave.append(dv);

        return chave.toString();
    }

    /**
     * Calcula o dígito verificador da chave
     */
    private int calcularDigitoVerificador(String chave) {
        int[] pesos = { 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5,
                4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int soma = 0;

        for (int i = 0; i < chave.length(); i++) {
            int digito = Character.getNumericValue(chave.charAt(i));
            soma += digito * pesos[i];
        }

        int resto = soma % 11;
        int dv = 11 - resto;

        if (dv == 0 || dv == 1) {
            return 0;
        }
        return dv;
    }

    /**
     * Gera o hash SHA-1 para assinatura digital
     */
    public String gerarHashNfe(String xml) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(xml.getBytes("UTF-8"));
            return HexFormat.of().formatHex(hash).toUpperCase();
        } catch (Exception e) {
            log.error("Erro ao gerar hash NFe", e);
            return "";
        }
    }

    // Métodos auxiliares

    private String getCodigoUF(String uf) {
        if (uf == null)
            return "35"; // Default SP
        return switch (uf.toUpperCase()) {
            case "AC" -> "12";
            case "AL" -> "27";
            case "AP" -> "16";
            case "AM" -> "13";
            case "BA" -> "29";
            case "CE" -> "23";
            case "DF" -> "53";
            case "ES" -> "32";
            case "GO" -> "52";
            case "MA" -> "21";
            case "MT" -> "51";
            case "MS" -> "50";
            case "MG" -> "31";
            case "PA" -> "15";
            case "PB" -> "25";
            case "PR" -> "41";
            case "PE" -> "26";
            case "PI" -> "22";
            case "RJ" -> "33";
            case "RN" -> "24";
            case "RS" -> "43";
            case "RO" -> "11";
            case "RR" -> "14";
            case "SC" -> "42";
            case "SP" -> "35";
            case "SE" -> "28";
            case "TO" -> "17";
            default -> "35";
        };
    }

    private String getNaturezaOperacao(Map<String, Object> nota) {
        String tipo = getStringValue(nota, "tipo_not");
        if ("S".equals(tipo)) {
            return "VENDA DE MERCADORIAS";
        } else {
            return "COMPRA DE MERCADORIAS";
        }
    }

    private String formatarDataHoraNfe(Integer data) {
        if (data == null) {
            return LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME);
        }
        String dataStr = String.valueOf(data);
        while (dataStr.length() < 8)
            dataStr = "0" + dataStr;

        int dia = Integer.parseInt(dataStr.substring(0, 2));
        int mes = Integer.parseInt(dataStr.substring(2, 4));
        int ano = Integer.parseInt(dataStr.substring(4, 8));

        return String.format("%04d-%02d-%02dT00:00:00-03:00", ano, mes, dia);
    }

    private String getCnpjEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        // Busca CNPJ da tabela masfil
        try {
            String sql = "SELECT cnpj_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("cnpj_fil") != null) {
                return results.get(0).get("cnpj_fil").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar CNPJ da masfil: " + e.getMessage());
        }
        return "00000000000000"; // Placeholder
    }

    private String getNomeEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        // Busca nome da tabela masfil
        try {
            String sql = "SELECT nome_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("nome_fil") != null) {
                return results.get(0).get("nome_fil").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar nome da masfil: " + e.getMessage());
        }
        return "EMPRESA";
    }

    private String getNomeFantasiaEmitente(Map<String, Object> nota) {
        return getNomeEmitente(nota);
    }

    private String getTelefoneEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            String sql = "SELECT pref_fil, fone_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty()) {
                String pref = results.get(0).get("pref_fil") != null ? results.get(0).get("pref_fil").toString() : "";
                String fone = results.get(0).get("fone_fil") != null ? results.get(0).get("fone_fil").toString() : "";
                return (pref + fone).replaceAll("[^0-9]", "");
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar telefone: " + e.getMessage());
        }
        return "";
    }

    private String getInscricaoMunicipal(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            String sql = "SELECT INSCRMUN_GER FROM masger WHERE NUMEMPR_GER = LPAD(?, 3, '0')";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("INSCRMUN_GER") != null) {
                return results.get(0).get("INSCRMUN_GER").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar inscrição municipal: " + e.getMessage());
        }
        return "";
    }

    private String getCnae(Map<String, Object> nota) {
        // CNAE pode estar em outra tabela ou não existir
        return "";
    }

    private String getCRT(Map<String, Object> nota) {
        // CRT: 1=Simples Nacional, 2=Simples Nacional excedente, 3=Regime Normal
        // Default regime normal
        return "3";
    }

    private String getEnderecoEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            String sql = "SELECT endereco_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("endereco_fil") != null) {
                return results.get(0).get("endereco_fil").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar endereço: " + e.getMessage());
        }
        return "";
    }

    private String getBairroEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            String sql = "SELECT bairro_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("bairro_fil") != null) {
                return results.get(0).get("bairro_fil").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar bairro: " + e.getMessage());
        }
        return "";
    }

    private String getCidadeEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            String sql = "SELECT cidade_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("cidade_fil") != null) {
                return results.get(0).get("cidade_fil").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar cidade: " + e.getMessage());
        }
        return "";
    }

    private String getUFEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            String sql = "SELECT uf_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("uf_fil") != null) {
                return results.get(0).get("uf_fil").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar UF: " + e.getMessage());
        }
        return "";
    }

    private String getCEPEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            String sql = "SELECT cep_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("cep_fil") != null) {
                return results.get(0).get("cep_fil").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar CEP: " + e.getMessage());
        }
        return "";
    }

    private String getIEEmitente(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            String sql = "SELECT INSCRIC_GER FROM masger WHERE NUMEMPR_GER = LPAD(?, 3, '0')";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("INSCRIC_GER") != null) {
                return results.get(0).get("INSCRIC_GER").toString();
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar IE: " + e.getMessage());
        }
        return "";
    }

    private String getCodigoMunicipioIBGE(Map<String, Object> nota) {
        Integer filial = getIntValue(nota, "filial_not");
        try {
            // Primeiro tenta buscar da masfil
            String sql = "SELECT codcid_fil FROM masfil WHERE codigo_fil = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, filial);
            if (!results.isEmpty() && results.get(0).get("codcid_fil") != null) {
                Object value = results.get(0).get("codcid_fil");
                if (value != null) {
                    String codigo = value.toString();
                    // Remove zeros à esquerda se necessário
                    return String.valueOf(Integer.parseInt(codigo));
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar código IBGE da masfil: " + e.getMessage());
        }

        // Se não encontrou, busca pela tabela munic usando cidade e UF
        try {
            String cidade = getCidadeEmitente(nota).toUpperCase();
            String uf = getUFEmitente(nota).toUpperCase();
            if (!cidade.isEmpty() && !uf.isEmpty()) {
                String sql = "SELECT codigo_mun FROM munic WHERE UPPER(nome_mun) LIKE ? AND UPPER(sigla_mun) = ?";
                List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, "%" + cidade + "%", uf);
                if (!results.isEmpty() && results.get(0).get("codigo_mun") != null) {
                    String codigo = results.get(0).get("codigo_mun").toString();
                    // Remove zeros à esquerda
                    return String.valueOf(Integer.parseInt(codigo));
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar código IBGE da munic: " + e.getMessage());
        }

        return "";
    }

    private String getCodigoMunicipio(Map<String, Object> nota) {
        // Código IBGE do município - agora busca da masfil
        return getCodigoMunicipioIBGE(nota);
    }

    private String getCodigoMunicipioDest(Map<String, Object> nota) {
        return getCodigoMunicipio(nota);
    }

    private BigDecimal calcularBaseIcms(List<Map<String, Object>> itens) {
        return itens.stream()
                .map(item -> getBigDecimalValue(item, "baseicms_not"))
                .filter(n -> n != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcularValorIcms(List<Map<String, Object>> itens) {
        return itens.stream()
                .map(item -> getBigDecimalValue(item, "vlricms_not"))
                .filter(n -> n != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcularValorPis(List<Map<String, Object>> itens) {
        return itens.stream()
                .map(item -> getBigDecimalValue(item, "vlrpis_not"))
                .filter(n -> n != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calcularValorCofins(List<Map<String, Object>> itens) {
        return itens.stream()
                .map(item -> getBigDecimalValue(item, "vlrcofins_not"))
                .filter(n -> n != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String formatarDecimal(BigDecimal value) {
        if (value == null)
            return "0";
        return value.setScale(3, RoundingMode.HALF_UP).toString().replace(".", "");
    }

    private String formatarDecimal2(BigDecimal value) {
        if (value == null)
            return "0.00";
        return value.setScale(2, RoundingMode.HALF_UP).toString().replace(",", ".");
    }

    private String formatarDecimal4(BigDecimal value) {
        if (value == null)
            return "0.0000";
        return value.setScale(4, RoundingMode.HALF_UP).toString().replace(",", ".");
    }

    private String escapeXml(String text) {
        if (text == null)
            return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    /**
     * Converte data de DDMMAAAA para AAAAMMDD (formato do banco de dados)
     * Exemplo: 11122025 -> 20251211
     */
    private Integer converterDataParaBanco(Integer dataDDMMAAAA) {
        if (dataDDMMAAAA == null)
            return null;
        String dataStr = String.valueOf(dataDDMMAAAA);
        // Garante que tem 8 dígitos
        while (dataStr.length() < 8) {
            dataStr = "0" + dataStr;
        }
        // Formato: DDMMAAAA -> AAAAMMDD
        String dia = dataStr.substring(0, 2);
        String mes = dataStr.substring(2, 4);
        String ano = dataStr.substring(4, 8);
        return Integer.parseInt(ano + mes + dia);
    }

    /**
     * Converte data de AAAAMMDD para DDMMAAAA (formato do COBOL/legado)
     * Exemplo: 20251211 -> 11122025
     */
    private Integer converterDataParaXml(Integer dataAAAAMMDD) {
        if (dataAAAAMMDD == null)
            return null;
        String dataStr = String.valueOf(dataAAAAMMDD);
        // Garante que tem 8 dígitos
        while (dataStr.length() < 8) {
            dataStr = "0" + dataStr;
        }
        // Formato: AAAAMMDD -> DDMMAAAA
        String ano = dataStr.substring(0, 4);
        String mes = dataStr.substring(4, 6);
        String dia = dataStr.substring(6, 8);
        return Integer.parseInt(dia + mes + ano);
    }

    // Métodos de extração de valores seguros do Map

    private String getStringValue(Map<String, Object> map, String key) {
        if (map == null || key == null)
            return "";
        Object value = map.get(key);
        if (value == null)
            return "";
        return value.toString();
    }

    private Integer getIntValue(Map<String, Object> map, String key) {
        if (map == null || key == null)
            return null;
        Object value = map.get(key);
        if (value == null)
            return null;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal getBigDecimalValue(Map<String, Object> map, String key) {
        if (map == null || key == null)
            return null;
        Object value = map.get(key);
        if (value == null)
            return null;
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        if (value instanceof Number) {
            return new BigDecimal(value.toString());
        }
        try {
            return new BigDecimal(value.toString().replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // Métodos auxiliares para campos adicionais

    private String getIEDestinatario(Map<String, Object> nota) {
        return getStringValue(nota, "inscrest_not");
    }

    private String getEmailDestinatario(Map<String, Object> nota) {
        return getStringValue(nota, "email_not");
    }

    private String getCodigoBarras(Map<String, Object> item) {
        String codBarras = getStringValue(item, "codbarras_not");
        if (codBarras == null || codBarras.isEmpty()) {
            return "SEM GTIN";
        }
        return codBarras;
    }

    private BigDecimal calcularTotalTributos(Map<String, Object> item) {
        // Calcula aproximadamente os tributos baseado no valor do produto
        BigDecimal vProd = getBigDecimalValue(item, "valortot_not");
        if (vProd == null) {
            return BigDecimal.ZERO;
        }
        // Alíquota estimada deIBPT ~15% conforme XML do COBOL
        BigDecimal aliqTrib = new BigDecimal("0.15");
        return vProd.multiply(aliqTrib).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calcularTotalTributosItens(List<Map<String, Object>> itens) {
        return itens.stream()
                .map(this::calcularTotalTributos)
                .filter(n -> n != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String getModalidadeFrete(Map<String, Object> nota) {
        String transp = getStringValue(nota, "transp_not");
        if (transp == null || transp.isEmpty()) {
            return "9"; // 9=Sem transporte
        }
        // 0=Emitente, 1=Destinatário, 2=Terceiros, 3=Próprio emitente,
        // 4=Próprio destinatário, 5=Terceiros
        return "0";
    }

    private String getInfoVolume(Map<String, Object> nota) {
        // Verifica se tem informações de transporte
        String transp = getStringValue(nota, "transp_not");
        if (transp == null || transp.isEmpty()) {
            return "";
        }

        StringBuilder vol = new StringBuilder();
        vol.append("      <vol>\n");
        vol.append("        <qVol>").append(getStringValue(nota, "qtdvol_not")).append("</qVol>\n");
        vol.append("        <esp>").append(getStringValue(nota, "especie_not")).append("</esp>\n");
        vol.append("        <nVol>").append(getStringValue(nota, "numerovol_not")).append("</nVol>\n");
        vol.append("        <pesoL>").append(formatarDecimal3(getBigDecimalValue(nota, "pesoliq_not")))
                .append("</pesoL>\n");
        vol.append("      </vol>\n");
        return vol.toString();
    }

    private String formatarDecimal3(BigDecimal value) {
        if (value == null)
            return "0.000";
        return value.setScale(3, RoundingMode.HALF_UP).toString().replace(",", ".");
    }

    private String getDuplicatas(Map<String, Object> nota) {
        // Gera duplicatas baseadas na condição de pagamento
        StringBuilder dup = new StringBuilder();
        String condpag = getStringValue(nota, "condpag_not");

        if (condpag == null || condpag.isEmpty()) {
            return "";
        }

        // Por enquanto, gera uma duplicata com data de 30 dias
        Integer emissao = getIntValue(nota, "emissaoi_not");
        if (emissao != null) {
            String emissaoStr = String.valueOf(emissao);
            int ano, mes, dia;
            if (emissaoStr.length() >= 8) {
                ano = Integer.parseInt(emissaoStr.substring(0, 4));
                mes = Integer.parseInt(emissaoStr.substring(4, 6));
                dia = Integer.parseInt(emissaoStr.substring(6, 8));

                // Adiciona 30 dias
                LocalDateTime dataVenc = LocalDateTime.of(ano, mes, dia, 0, 0).plusDays(30);
                dup.append("      <dup>\n");
                dup.append("        <nDup>001</nDup>\n");
                dup.append("        <dVenc>").append(dataVenc.format(DateTimeFormatter.ISO_DATE)).append("</dVenc>\n");
                dup.append("        <vDup>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrnot_not")))
                        .append("</vDup>\n");
                dup.append("      </dup>\n");
            }
        }

        return dup.toString();
    }

    private String getInfoPagamento(Map<String, Object> nota) {
        StringBuilder pag = new StringBuilder();
        String condpag = getStringValue(nota, "condpag_not");

        if (condpag == null || condpag.isEmpty()) {
            return "";
        }

        // Determina forma de pagamento
        String tPag = getTipoPagamento(condpag);

        pag.append("    <pag>\n");
        pag.append("      <detPag>\n");
        pag.append("        <tPag>").append(tPag).append("</tPag>\n");
        pag.append("        <vPag>").append(formatarDecimal2(getBigDecimalValue(nota, "vlrnot_not")))
                .append("</vPag>\n");
        pag.append("      </detPag>\n");
        pag.append("    </pag>\n");

        return pag.toString();
    }

    private String getTipoPagamento(String condpag) {
        // 01=Dinheiro, 02=Cheque, 03=Cartão crédito, 04=Cartão débto
        // 05=Vale alimentação, 10=Vale refeição, 11=Vale presente
        // 15=Boleto, 16=Depósito, 17=Pagamento integrado
        try {
            int cond = Integer.parseInt(condpag);
            if (cond == 1)
                return "01"; // Dinheiro
            if (cond == 2)
                return "02"; // Cheque
            if (cond >= 3 && cond <= 5)
                return "03"; // Cartão
            if (cond >= 10 && cond <= 13)
                return "15"; // Boleto
        } catch (NumberFormatException e) {
            // ignore
        }
        return "01"; // Default dinheiro
    }

    private String getInfoComplementar(Map<String, Object> nota) {
        StringBuilder info = new StringBuilder();

        // Adiciona observação se houver
        String observacao = getStringValue(nota, "observacao_not");
        if (observacao != null && !observacao.isEmpty()) {
            info.append(observacao);
        }

        // Adiciona informações do dealer
        String depto = getStringValue(nota, "dpto_not");
        String vendedor = getStringValue(nota, "vendedor_not");

        if (!depto.isEmpty() || !vendedor.isEmpty()) {
            if (info.length() > 0) {
                info.append("; ");
            }
            info.append("Depto: ").append(depto);
            info.append(" Vendedor: ").append(vendedor);
        }

        return escapeXml(info.toString());
    }

    /**
     * Obtém dados fiscais do CFOP (MASCFO)
     */
    private Map<String, Object> getDadosCFOP(Map<String, Object> item) {
        String codFiscal = getStringValue(item, "codfiscal_not");
        if (codFiscal == null || codFiscal.isEmpty()) {
            return null;
        }
        try {
            String sql = "SELECT * FROM mascfo WHERE CODIGO_CFO = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, codFiscal);
            if (!results.isEmpty()) {
                return results.get(0);
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar CFOP: " + e.getMessage());
        }
        return null;
    }

    /**
     * Obtém dados de tributação (MASTRIB)
     */
    private Map<String, Object> getDadosTributacao(String codTributacao) {
        if (codTributacao == null || codTributacao.isEmpty()) {
            return null;
        }
        try {
            String sql = "SELECT * FROM mastrib WHERE CODIGO_TRIB = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, codTributacao);
            if (!results.isEmpty()) {
                return results.get(0);
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar tributação: " + e.getMessage());
        }
        return null;
    }

    /**
     * Obtém dados da operação (MASOPE)
     */
    private Map<String, Object> getDadosOperacao(Integer natureza) {
        if (natureza == null) {
            return null;
        }
        try {
            String sql = "SELECT * FROM masope WHERE CODIGO_OPE = ?";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, natureza);
            if (!results.isEmpty()) {
                return results.get(0);
            }
        } catch (Exception e) {
            log.warn("Erro ao buscar operação: " + e.getMessage());
        }
        return null;
    }

    /**
     * Determina o CST do ICMS baseado na lógica do COBOL
     */
    private String getCSTICMS(Map<String, Object> item, Map<String, Object> nota) {
        // Obtém o CFOP para buscar dados fiscais
        String codFiscal = getStringValue(item, "codfiscal_not");
        Map<String, Object> dadosCFOP = getDadosCFOP(item);

        // Obtém redução
        BigDecimal reducao = getBigDecimalValue(item, "reducao_not");

        // Se não tem redução, usa CSTICMS-CFO(2:2)
        // Se tem redução, usa CSTICMSRED-CFO(2:2)
        if (dadosCFOP != null) {
            if (reducao != null && reducao.compareTo(BigDecimal.ZERO) > 0) {
                Object cstRed = dadosCFOP.get("CSTICMSRED_CFO");
                if (cstRed != null) {
                    String cst = cstRed.toString();
                    if (cst.length() >= 2) {
                        return cst.substring(cst.length() - 2);
                    }
                    return cst;
                }
            } else {
                Object cst = dadosCFOP.get("CSTICMS_CFO");
                if (cst != null) {
                    String cstStr = cst.toString();
                    if (cstStr.length() >= 2) {
                        return cstStr.substring(cstStr.length() - 2);
                    }
                    return cstStr;
                }
            }
        }

        // Fallback: usa CST da nota
        String cstNot = getStringValue(item, "cst_not");
        if (cstNot != null && !cstNot.isEmpty()) {
            return cstNot.substring(Math.max(0, cstNot.length() - 2));
        }

        return "00"; // Default
    }

    /**
     * Determina a origem da mercadoria
     */
    private String getOrigemMercadoria(Map<String, Object> item) {
        // Verifica se é importação (FAB-NOT = 'I' ou similar)
        String fab = getStringValue(item, "fab_not");
        if ("I".equalsIgnoreCase(fab)) {
            return "1"; // Estrangeira importação direta
        }
        return "0"; // Nacional
    }

    /**
     * Determina se é serviço
     * FAB-NOT = 'S' = Serviços
     * TIPOPROD-NOT = 'SE' = Serviço
     */
    private boolean isServico(Map<String, Object> item) {
        String fab = getStringValue(item, "fab_not");
        String tipoProd = getStringValue(item, "tipoprod_not");
        return "S".equalsIgnoreCase(fab) || "SE".equalsIgnoreCase(tipoProd);
    }

    /**
     * Obtém CST do PIS baseado na operação
     */
    private String getCSTPIS(Map<String, Object> item, Map<String, Object> nota) {
        // Se é serviço, não tem PIS
        if (isServico(item)) {
            return ""; // Sem PIS para serviços
        }

        // Se é veículo (FAB-NOT = 'V') e tem ICMS-ST
        String fab = getStringValue(item, "fab_not");
        if ("V".equalsIgnoreCase(fab)) {
            BigDecimal icmsSt = getBigDecimalValue(item, "icmsst_not");
            if (icmsSt != null && icmsSt.compareTo(BigDecimal.ZERO) > 0) {
                return "99"; // Outras operações
            }
        }

        // Se não tem valor PIS, usa PISNT
        BigDecimal vlrPis = getBigDecimalValue(item, "vlrpis_not");
        if (vlrPis == null || vlrPis.compareTo(BigDecimal.ZERO) == 0) {
            return "04"; // Operação tributável sem alíquota
        }

        return "01";
    }

    /**
     * Obtém CST do COFINS baseado na operação
     */
    private String getCSTCOFINS(Map<String, Object> item, Map<String, Object> nota) {
        // Se é serviço, não tem COFINS
        if (isServico(item)) {
            return ""; // Sem COFINS para serviços
        }

        // Se é veículo (FAB-NOT = 'V') e tem ICMS-ST
        String fab = getStringValue(item, "fab_not");
        if ("V".equalsIgnoreCase(fab)) {
            BigDecimal icmsSt = getBigDecimalValue(item, "icmsst_not");
            if (icmsSt != null && icmsSt.compareTo(BigDecimal.ZERO) > 0) {
                return "99"; // Outras operações
            }
        }

        // Se não tem valor COFINS, usa COFINSNT
        BigDecimal vlrCofins = getBigDecimalValue(item, "vlrcofins_not");
        if (vlrCofins == null || vlrCofins.compareTo(BigDecimal.ZERO) == 0) {
            return "04"; // Operação tributável sem alíquota
        }

        return "01";
    }
}
