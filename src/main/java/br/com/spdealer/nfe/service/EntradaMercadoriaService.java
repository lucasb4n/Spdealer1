package br.com.spdealer.nfe.service;

import br.com.spdealer.nfe.model.XmlNotaDet;
import br.com.spdealer.nfe.repository.XmlNotaDetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EntradaMercadoriaService {

    private final JdbcTemplate jdbcTemplate;
    private final XmlNotaDetRepository xmlNotaDetRepository;
    private final ManifestacaoDestinatarioService manifestacaoService;

    public Map<String, Object> processarUploadXml(String xmlConteudo) {
        Map<String, Object> resultado = new HashMap<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            org.w3c.dom.Document doc = builder.parse(new java.io.ByteArrayInputStream(xmlConteudo.getBytes("UTF-8")));

            NodeList infNFeList = doc.getElementsByTagName("infNFe");
            if (infNFeList.getLength() == 0) {
                resultado.put("error", "XML inválido: tag infNFe não encontrada");
                return resultado;
            }

            Element infNFe = (Element) infNFeList.item(0);
            String chave = infNFe.getAttribute("Id").replace("NFe", "");

            // Verifica se já existe no banco
            String countSql = "SELECT COUNT(*) FROM xmlnotacab WHERE Id = ?";
            Integer count = jdbcTemplate.queryForObject(countSql, Integer.class, chave);
            if (count != null && count > 0) {
                resultado.put("existente", true);
                resultado.put("chave", chave);
                resultado.put("itens", listarItens(chave));
                return resultado;
            }

            // Extrai dados para salvar
            Map<String, Object> cabecalho = extrairCabecalho(doc, chave);
            List<Map<String, Object>> itens = extrairItens(doc, chave);
            List<Map<String, Object>> duplicatas = extrairDuplicatas(doc, chave);

            salvarCabecalho(cabecalho);
            salvarItens(itens);
            salvarDuplicatas(duplicatas);

            resultado.put("existente", false);
            resultado.put("chave", chave);
            resultado.put("cabecalho", cabecalho);
            resultado.put("itens", itens);
            resultado.put("duplicatas", duplicatas);

            log.info("XML NF-e {} processado: {} itens, {} duplicatas", chave, itens.size(), duplicatas.size());
        } catch (Exception e) {
            log.error("Erro ao processar upload XML", e);
            resultado.put("error", "Erro ao processar XML: " + e.getMessage());
        }
        return resultado;
    }

    public List<XmlNotaDet> listarItens(String chaveNfe) {
        String sqlItens = "SELECT * FROM xmlnotadet WHERE Id = ?";
        List<XmlNotaDet> itens = jdbcTemplate.query(sqlItens, (rs, rowNum) -> {
            XmlNotaDet item = new XmlNotaDet();
            item.setId(rs.getString("Id"));
            item.setNItem(rs.getInt("nItem"));
            item.setCProd(rs.getString("cProd"));
            item.setCEAN(rs.getString("cEAN"));
            item.setXProd(rs.getString("xProd"));
            item.setCFOP(rs.getString("CFOP"));
            item.setUCom(rs.getString("uCom"));
            item.setQCom(rs.getBigDecimal("qCom"));
            item.setVUnCom(rs.getBigDecimal("vUnCom"));
            item.setVProd(rs.getBigDecimal("vProd"));
            item.setFabEst(rs.getString("fab_est"));
            item.setCodprodEst(rs.getString("codprod_est"));
            item.setFatorConversao(rs.getBigDecimal("fator_conversao"));
            return item;
        }, chaveNfe);

        if (itens != null) {
            for (XmlNotaDet item : itens) {
                if (item.getFabEst() != null && item.getCodprodEst() != null) {
                    try {
                        String sql = "SELECT descr_est FROM estoque WHERE fab_est = ? AND codprod_est = ?";
                        List<String> descricoes = jdbcTemplate.queryForList(sql, String.class, item.getFabEst(), item.getCodprodEst());
                        if (!descricoes.isEmpty()) {
                            item.setDescricaoProduto(descricoes.get(0));
                        }
                    } catch (Exception e) {
                        log.warn("Erro ao buscar descricao do produto do estoque: fab={}, cod={}", item.getFabEst(), item.getCodprodEst(), e);
                    }
                }
            }
        }
        return itens;
    }

    public void atualizarDePara(String chaveNfe, Integer nItem, String fabEst, String codprodEst, BigDecimal fatorConversao) {
        String sql = "UPDATE xmlnotadet SET fab_est = ?, codprod_est = ?, fator_conversao = ? WHERE Id = ? AND nItem = ?";
        jdbcTemplate.update(sql, fabEst, codprodEst, fatorConversao, chaveNfe, nItem);
    }

    public Map<String, Object> confirmarEntrada(String chaveNfe) {
        Map<String, Object> resultado = new HashMap<>();
        try {
            List<Map<String, Object>> itens = jdbcTemplate.queryForList(
                    "SELECT * FROM xmlnotadet WHERE Id = ?", chaveNfe);

            for (Map<String, Object> item : itens) {
                String fabEst = (String) item.get("fab_est");
                String codprodEst = (String) item.get("codprod_est");
                if (fabEst == null || fabEst.isBlank() || codprodEst == null || codprodEst.isBlank()) {
                    resultado.put("error", "Existem itens sem vínculo de produto");
                    resultado.put("item", item.get("nItem"));
                    return resultado;
                }
            }

            jdbcTemplate.update("UPDATE xmlnotacab SET status = '2' WHERE Id = ?", chaveNfe);

            resultado.put("success", true);
            resultado.put("message", "Entrada confirmada - " + itens.size() + " itens processados");

            Map<String, Object> cab = jdbcTemplate.queryForMap(
                    "SELECT * FROM xmlnotacab WHERE Id = ?", chaveNfe);

            Integer nNF = null;
            if (cab.get("nNF") != null) {
                nNF = Integer.valueOf(cab.get("nNF").toString());
            }
            String serie = (String) cab.get("serie");
            String CNPJe = (String) cab.get("CNPJe");
            String xNomee = (String) cab.get("xNomee");

            resultado.put("notaFiscal", nNF);
            resultado.put("serie", serie);
            resultado.put("fornecedorCnpj", CNPJe);
            resultado.put("fornecedorNome", xNomee);
            resultado.put("itens", itens.size());

        } catch (Exception e) {
            log.error("Erro ao confirmar entrada", e);
            resultado.put("error", "Erro ao confirmar entrada: " + e.getMessage());
        }
        return resultado;
    }

    public Map<String, Object> listarDisponiveis() {
        Map<String, Object> resultado = new HashMap<>();
        try {
            String cnpj = jdbcTemplate.queryForObject(
                    "SELECT CGC_GER FROM masger LIMIT 1", String.class);
            if (cnpj == null || cnpj.isBlank()) {
                resultado.put("error", "CNPJ da empresa não encontrado em masger");
                return resultado;
            }
            cnpj = cnpj.replaceAll("\\D", "");
            log.info("CNPJ da empresa: {}", cnpj);

            String ambiente = "D";
            try {
                String amb = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(upper(trim(COALESCE(sefaz_ambiente_fil, 'D'))), 'D') FROM masfil LIMIT 1",
                        String.class);
                if (amb != null) ambiente = amb;
            } catch (Exception e) {
                log.warn("Usando ambiente D (homologação) como padrão devido a erro na tabela masfil: " + e.getMessage());
            }

            List<String> chaves = manifestacaoService.consultarNfeDistribuidas(cnpj, ambiente);

            // Carrega em uma única consulta as notas locais pendentes dos últimos 90 dias (status != '2' e status != '3')
            Map<String, Map<String, Object>> notasLocaisMap = new HashMap<>();
            try {
                List<Map<String, Object>> locais = jdbcTemplate.queryForList(
                        "SELECT Id, xNomee, nNF, serie, dhEmi, vNF, status FROM xmlnotacab " +
                        "WHERE status NOT IN ('2', '3') AND dtmovi >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)");
                if (locais != null) {
                    for (Map<String, Object> local : locais) {
                        String id = (String) local.get("Id");
                        if (id != null) {
                            notasLocaisMap.put(id, local);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Erro ao carregar notas locais pendentes: " + e.getMessage());
            }

            // Combina chaves mantendo a ordem e sem duplicatas
            Set<String> todasChaves = new LinkedHashSet<>();
            if (chaves != null) {
                todasChaves.addAll(chaves);
            }
            todasChaves.addAll(notasLocaisMap.keySet());

            List<Map<String, Object>> lista = new ArrayList<>();
            for (String chave : todasChaves) {
                Map<String, Object> item = new HashMap<>();
                item.put("chave", chave);

                // Tenta obter os dados da nota do mapa local pré-carregado
                Map<String, Object> existente = notasLocaisMap.get(chave);
                
                // Se não estiver no mapa local, faz consulta direta (caso de chaves recém-retornadas pela SEFAZ)
                if (existente == null) {
                    try {
                        existente = jdbcTemplate.queryForMap(
                                "SELECT xNomee, nNF, serie, dhEmi, vNF, status FROM xmlnotacab WHERE Id = ?", chave);
                    } catch (Exception e) {}
                }

                if (existente != null && !existente.isEmpty()) {
                    item.put("baixada", true);
                    item.put("fornecedor", existente.get("xNomee"));
                    item.put("nNF", existente.get("nNF"));
                    item.put("serie", existente.get("serie"));
                    item.put("dhEmi", existente.get("dhEmi"));
                    item.put("vNF", existente.get("vNF"));
                    String status = existente.get("status") != null ? existente.get("status").toString() : "1";
                    item.put("status", status);
                } else {
                    item.put("baixada", false);
                    item.put("status", "0");
                }
                lista.add(item);
            }

            resultado.put("disponiveis", lista);
            resultado.put("cnpj", cnpj);
            resultado.put("ambiente", ambiente);
            resultado.put("quantidade", lista.size());

        } catch (Exception e) {
            log.error("Erro ao listar NF-es disponíveis", e);
            resultado.put("error", "Erro ao consultar SEFAZ: " + e.getMessage());
        }
        return resultado;
    }

    public Map<String, Object> desconhecerNfe(String chaveNfe) {
        Map<String, Object> resultado = new HashMap<>();
        try {
            String cnpj = jdbcTemplate.queryForObject(
                    "SELECT CGC_GER FROM masger LIMIT 1", String.class);
            if (cnpj != null) {
                cnpj = cnpj.replaceAll("\\D", "");
            }
            String ambiente = "D";
            try {
                String amb = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(upper(trim(COALESCE(sefaz_ambiente_fil, 'D'))), 'D') FROM masfil LIMIT 1",
                        String.class);
                if (amb != null) ambiente = amb;
            } catch (Exception e) {}

            log.info("Registrando Desconhecimento da Operação (210220) para chave: {} no CNPJ: {}", chaveNfe, cnpj);
            String protocolo = manifestacaoService.realizarManifestacao(chaveNfe, cnpj, ambiente, "210220");
            
            try {
                Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM xmlnotacab WHERE Id = ?", Integer.class, chaveNfe);
                if (count != null && count > 0) {
                    jdbcTemplate.update("UPDATE xmlnotacab SET status = '3' WHERE Id = ?", chaveNfe);
                } else {
                    jdbcTemplate.update("INSERT INTO xmlnotacab (Id, CNPJd, status, dhEmi, dtmovi) VALUES (?, ?, '3', ?, ?)", 
                        chaveNfe, cnpj, java.time.LocalDateTime.now().toString(), java.time.LocalDate.now());
                }
                log.info("Status da NF-e {} atualizado para 3 (Desconhecida) no banco local", chaveNfe);
            } catch (Exception dbEx) {
                log.warn("Erro ao atualizar status da nota desconhecida no banco: " + dbEx.getMessage());
            }

            resultado.put("success", true);
            resultado.put("protocolo", protocolo);
        } catch (Exception e) {
            log.error("Erro ao registrar desconhecimento", e);
            resultado.put("error", "Erro ao registrar desconhecimento: " + e.getMessage());
        }
        return resultado;
    }

    public Map<String, Object> baixarEProcessar(String chaveNfe) {
        Map<String, Object> resultado = new HashMap<>();
        try {
            String ambiente = "D";
            try {
                String amb = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(upper(trim(COALESCE(sefaz_ambiente_fil, 'D'))), 'D') FROM masfil LIMIT 1",
                        String.class);
                if (amb != null) ambiente = amb;
            } catch (Exception e) {}

            manifestacaoService.baixarXmlCompleto(chaveNfe, ambiente);

            Map<String, Object> cabecalho = jdbcTemplate.queryForMap(
                    "SELECT * FROM xmlnotacab WHERE Id = ?", chaveNfe);

            List<XmlNotaDet> itens = listarItens(chaveNfe);

            resultado.put("chave", chaveNfe);
            resultado.put("cabecalho", cabecalho);
            resultado.put("itens", itens);

            log.info("NF-e {} processada: {} itens", chaveNfe, itens.size());
        } catch (Exception e) {
            log.error("Erro ao baixar e processar NF-e", e);
            resultado.put("error", "Erro ao baixar NF-e: " + e.getMessage());
        }
        return resultado;
    }

    private Map<String, Object> extrairCabecalho(org.w3c.dom.Document doc, String chave) {
        Map<String, Object> cab = new HashMap<>();
        cab.put("Id", chave);

        NodeList ideList = doc.getElementsByTagName("ide");
        if (ideList.getLength() > 0) {
            Element ide = (Element) ideList.item(0);
            cab.put("versao", doc.getDocumentElement().getAttribute("versao"));
            cab.put("cUF", getText(ide, "cUF"));
            cab.put("cNF", getText(ide, "cNF"));
            cab.put("natOp", getText(ide, "natOp"));
            cab.put("indPag", getText(ide, "indPag"));
            cab.put("mod", getText(ide, "mod"));
            cab.put("serie", getText(ide, "serie"));
            cab.put("nNF", parseInt(getText(ide, "nNF")));
            cab.put("dhEmi", getText(ide, "dhEmi"));
            cab.put("tpNF", getText(ide, "tpNF"));
        }

        NodeList emitList = doc.getElementsByTagName("emit");
        if (emitList.getLength() > 0) {
            Element emit = (Element) emitList.item(0);
            cab.put("CNPJe", getText(emit, "CNPJ"));
            cab.put("xNomee", getText(emit, "xNome"));
            cab.put("IEe", getText(emit, "IE"));
            cab.put("CRT", getText(emit, "CRT"));
            NodeList enderEmit = emit.getElementsByTagName("enderEmit");
            if (enderEmit.getLength() > 0) {
                cab.put("UFe", getText((Element) enderEmit.item(0), "UF"));
            }
        }

        NodeList destList = doc.getElementsByTagName("dest");
        if (destList.getLength() > 0) {
            Element dest = (Element) destList.item(0);
            cab.put("CNPJd", getText(dest, "CNPJ"));
            cab.put("xNomed", getText(dest, "xNome"));
            cab.put("IEd", getText(dest, "IE"));
        }

        Element icmsTot = (Element) doc.getElementsByTagName("ICMSTot").item(0);
        if (icmsTot != null) {
            cab.put("vBC", parseDecimal(getText(icmsTot, "vBC")));
            cab.put("vICMS", parseDecimal(getText(icmsTot, "vICMS")));
            cab.put("vProd", parseDecimal(getText(icmsTot, "vProd")));
            cab.put("vNF", parseDecimal(getText(icmsTot, "vNF")));
            cab.put("vFrete", parseDecimal(getText(icmsTot, "vFrete")));
            cab.put("vDesc", parseDecimal(getText(icmsTot, "vDesc")));
            cab.put("vIPI", parseDecimal(getText(icmsTot, "vIPI")));
            cab.put("vPIS", parseDecimal(getText(icmsTot, "vPIS")));
            cab.put("vCOFINS", parseDecimal(getText(icmsTot, "vCOFINS")));
        }

        return cab;
    }

    private List<Map<String, Object>> extrairItens(org.w3c.dom.Document doc, String chave) {
        List<Map<String, Object>> itens = new ArrayList<>();
        NodeList detList = doc.getElementsByTagName("det");
        for (int i = 0; i < detList.getLength(); i++) {
            Element det = (Element) detList.item(i);
            Map<String, Object> item = new HashMap<>();
            item.put("Id", chave);
            item.put("nItem", parseInt(det.getAttribute("nItem")));
            item.put("cProd", getTextByTag(det, "prod", "cProd"));
            item.put("xProd", getTextByTag(det, "prod", "xProd"));
            item.put("NCM", getTextByTag(det, "prod", "NCM"));
            item.put("CFOP", getTextByTag(det, "prod", "CFOP"));
            item.put("uCom", getTextByTag(det, "prod", "uCom"));
            item.put("qCom", parseDecimal(getTextByTag(det, "prod", "qCom")));
            item.put("vUnCom", parseDecimal(getTextByTag(det, "prod", "vUnCom")));
            item.put("vProd", parseDecimal(getTextByTag(det, "prod", "vProd")));
            item.put("fator_conversao", BigDecimal.ONE);
            itens.add(item);
        }
        return itens;
    }

    private List<Map<String, Object>> extrairDuplicatas(org.w3c.dom.Document doc, String chave) {
        List<Map<String, Object>> duplicatas = new ArrayList<>();
        NodeList dupList = doc.getElementsByTagName("dup");
        for (int i = 0; i < dupList.getLength(); i++) {
            Element dup = (Element) dupList.item(i);
            Map<String, Object> dupMap = new HashMap<>();
            dupMap.put("Id", chave);
            dupMap.put("parc", i + 1);
            dupMap.put("nDup", getText(dup, "nDup"));
            String dVencStr = getText(dup, "dVenc");
            if (dVencStr != null && dVencStr.length() >= 10) {
                try { dupMap.put("dVenc", LocalDate.parse(dVencStr.substring(0, 10))); } catch (Exception e) {}
            }
            dupMap.put("vDup", parseDecimal(getText(dup, "vDup")));
            duplicatas.add(dupMap);
        }
        return duplicatas;
    }

    private void salvarCabecalho(Map<String, Object> cab) {
        String sql = "INSERT INTO xmlnotacab (" +
                "Id, versao, cUF, cNF, natOp, indPag, mod, serie, nNF, dhEmi, " +
                "tpNF, CNPJe, xNomee, IEe, CRT, UFe, CNPJd, xNomed, IEd, " +
                "vBC, vICMS, vProd, vFrete, vDesc, vIPI, vPIS, vCOFINS, vNF, status, dtmovi" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        LocalDate dtmovi = null;
        String dhEmi = (String) cab.get("dhEmi");
        if (dhEmi != null && dhEmi.length() >= 10) {
            try { dtmovi = LocalDate.parse(dhEmi.substring(0, 10)); } catch (Exception e) {}
        }

        jdbcTemplate.update(sql,
                cab.get("Id"), cab.get("versao"), cab.get("cUF"), cab.get("cNF"),
                cab.get("natOp"), cab.get("indPag"), cab.get("mod"), cab.get("serie"),
                cab.get("nNF"), cab.get("dhEmi"), cab.get("tpNF"),
                cab.get("CNPJe"), cab.get("xNomee"), cab.get("IEe"), cab.get("CRT"),
                cab.get("UFe"), cab.get("CNPJd"), cab.get("xNomed"), cab.get("IEd"),
                cab.get("vBC"), cab.get("vICMS"), cab.get("vProd"),
                cab.get("vFrete"), cab.get("vDesc"), cab.get("vIPI"),
                cab.get("vPIS"), cab.get("vCOFINS"), cab.get("vNF"),
                "1", dtmovi);
    }

    private void salvarItens(List<Map<String, Object>> itens) {
        String sql = "INSERT INTO xmlnotadet (" +
                "Id, nItem, cProd, xProd, NCM, CFOP, uCom, qCom, vUnCom, vProd, fator_conversao" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        for (Map<String, Object> item : itens) {
            jdbcTemplate.update(sql,
                    item.get("Id"), item.get("nItem"), item.get("cProd"), item.get("xProd"),
                    item.get("NCM"), item.get("CFOP"), item.get("uCom"),
                    item.get("qCom"), item.get("vUnCom"), item.get("vProd"),
                    item.get("fator_conversao"));
        }
    }

    private void salvarDuplicatas(List<Map<String, Object>> duplicatas) {
        String sql = "INSERT INTO xmlpagar (Id, parc, nDup, dVenc, vDup) VALUES (?, ?, ?, ?, ?)";
        for (Map<String, Object> dup : duplicatas) {
            jdbcTemplate.update(sql,
                    dup.get("Id"), dup.get("parc"), dup.get("nDup"),
                    dup.get("dVenc"), dup.get("vDup"));
        }
    }

    private String getText(Element parent, String tagName) {
        NodeList list = parent.getElementsByTagName(tagName);
        return list.getLength() > 0 ? list.item(0).getTextContent() : "";
    }

    private String getTextByTag(Element parent, String parentTag, String tagName) {
        NodeList parentList = parent.getElementsByTagName(parentTag);
        if (parentList.getLength() > 0) {
            return getText((Element) parentList.item(0), tagName);
        }
        return "";
    }

    private Integer parseInt(String value) {
        if (value == null || value.isBlank()) return null;
        try { return Integer.parseInt(value); } catch (Exception e) { return null; }
    }

    private BigDecimal parseDecimal(String value) {
        if (value == null || value.isBlank()) return null;
        try { return new BigDecimal(value.replace(",", ".")); } catch (Exception e) { return null; }
    }
}
