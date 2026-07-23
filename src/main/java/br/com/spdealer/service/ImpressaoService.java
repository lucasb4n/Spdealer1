package br.com.spdealer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRMapCollectionDataSource;
import net.sf.jasperreports.engine.util.JRLoader;
import net.sf.jasperreports.engine.export.JRPdfExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImpressaoService {

    private static final String REPORT_PATH = "reports/OrcamentoPedidoReport.jasper";
    private static final String LOGO_PATH = "reports/logo.jpg";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private InputStream loadLogo() {
        try {
            Resource logoResource = new ClassPathResource(LOGO_PATH);
            return logoResource.getInputStream();
        } catch (Exception e) {
            log.warn("Logo nao encontrado em {}, continuando sem logo", LOGO_PATH);
            return null;
        }
    }

    public byte[] gerarPdfOrcamentoPedido(Map<String, Object> orcamento, List<Map<String, Object>> itens) {
        try {
            Resource resource = new ClassPathResource(REPORT_PATH);
            InputStream reportStream = resource.getInputStream();
            
            JasperReport jasperReport = (JasperReport) JRLoader.loadObject(reportStream);
            
            Map<String, Object> parameters = new HashMap<>();
            String empNome = orcamento.get("_EMPRESA_NOME") != null ? orcamento.get("_EMPRESA_NOME").toString() : "";
            if (empNome.trim().isEmpty() || "SPDealer".equals(empNome)) {
                empNome = "L&S PEÇAS E SERVIÇOS";
            }
            parameters.put("EMPRESA_NOME", empNome);
            parameters.put("EMPRESA_CNPJ", orcamento.get("_EMPRESA_CNPJ") != null && !orcamento.get("_EMPRESA_CNPJ").toString().isEmpty() ? 
                orcamento.get("_EMPRESA_CNPJ").toString() : "47563976000136");
            parameters.put("EMPRESA_ENDERECO", "");
            parameters.put("EMPRESA_FONE", "");
            parameters.put("EMPRESA_EMAIL", "");
            parameters.put("USUARIO", orcamento.get("_USUARIO") != null ? orcamento.get("_USUARIO").toString() : "SISTEMA");
            parameters.put("LOGO", loadLogo());

            // Parâmetros para o subrelatório de cabeçalho
            String tipoOrp = orcamento.get("TIPO_ORP") != null ? orcamento.get("TIPO_ORP").toString() : "O";
            String tipoDescricao = "O".equals(tipoOrp) ? "ORÇAMENTO DE PEÇAS" : "PEDIDO DE PEÇAS";
            parameters.put("TITULO_RELATORIO", tipoDescricao);

            Object dtemiVal = orcamento.get("DTEMI_ORP");
            String dataStr = "";
            if (dtemiVal != null) {
                if (dtemiVal instanceof java.sql.Date) {
                    dataStr = new java.text.SimpleDateFormat("dd/MM/yyyy").format((java.sql.Date) dtemiVal);
                } else if (dtemiVal instanceof java.time.LocalDate) {
                    dataStr = ((java.time.LocalDate) dtemiVal).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                } else {
                    dataStr = String.valueOf(dtemiVal);
                }
            }
            parameters.put("DATA_INICIAL", dataStr);
            parameters.put("DATA_FINAL", dataStr);
            
            List<Map<String, Object>> dataList = new ArrayList<>();
            Map<String, Object> firstRow = new HashMap<>();
            
            firstRow.put("NUMERO_ORP", orcamento.get("NUMERO_ORP") != null ? 
                new BigDecimal(orcamento.get("NUMERO_ORP").toString()) : BigDecimal.ZERO);
            firstRow.put("FILIAL_ORP", orcamento.get("FILIAL_ORP") != null ? 
                new BigDecimal(orcamento.get("FILIAL_ORP").toString()) : BigDecimal.ZERO);
            
            Object dtemi = orcamento.get("DTEMI_ORP");
            if (dtemi instanceof Date) {
                firstRow.put("DTEMI_ORP", dtemi);
            } else if (dtemi instanceof LocalDate) {
                firstRow.put("DTEMI_ORP", Date.valueOf((LocalDate) dtemi));
            } else if (dtemi instanceof String) {
                firstRow.put("DTEMI_ORP", Date.valueOf(LocalDate.parse((String) dtemi, DATE_FORMAT)));
            } else {
                firstRow.put("DTEMI_ORP", new Date(System.currentTimeMillis()));
            }
            
            firstRow.put("TIPO_ORP", tipoOrp);
            firstRow.put("TIPO_DESCRICAO", "O".equals(tipoOrp) ? "Orçamento" : "P".equals(tipoOrp) ? "Pedido" : "Orçamento");
            
            firstRow.put("CODIGO_CLIENTE", orcamento.get("CODCLI_ORP") != null ? 
                orcamento.get("CODCLI_ORP").toString() : "");
            firstRow.put("CGCCPF_CLI", orcamento.get("CGCCPF_CLI") != null ? 
                orcamento.get("CGCCPF_CLI").toString() : "");
            firstRow.put("NOME_ORP", orcamento.get("NOME_ORP") != null ? 
                orcamento.get("NOME_ORP").toString() : "");
            firstRow.put("LOGRA_ORP", orcamento.get("LOGRA_ORP") != null ? 
                orcamento.get("LOGRA_ORP").toString() : "");
            firstRow.put("BAIRRO_ORP", orcamento.get("BAIRRO_ORP") != null ? 
                orcamento.get("BAIRRO_ORP").toString() : "");
            firstRow.put("CIDADE_ORP", orcamento.get("CIDADE_ORP") != null ? 
                orcamento.get("CIDADE_ORP").toString() : "");
            firstRow.put("UF_ORP", orcamento.get("UF_ORP") != null ? 
                orcamento.get("UF_ORP").toString() : "");
            firstRow.put("CEP_ORP", orcamento.get("CEP_ORP") != null ? 
                orcamento.get("CEP_ORP").toString() : "");
            firstRow.put("FONE_ORP", orcamento.get("FONE_ORP") != null ? 
                orcamento.get("FONE_ORP").toString() : "");
            firstRow.put("PREF_FONE", orcamento.get("PREF_ORP") != null ? 
                orcamento.get("PREF_ORP").toString() : "");
            firstRow.put("CONTATO_ORP", orcamento.get("CONTATO_ORP") != null ? 
                orcamento.get("CONTATO_ORP").toString() : "");
            firstRow.put("CONDPAG_DESCR", orcamento.get("DESCR_PAG") != null ? 
                orcamento.get("DESCR_PAG").toString() : "");
            firstRow.put("VENDEDOR_ORP", orcamento.get("VENDEDOR_ORP") != null ? 
                new BigDecimal(orcamento.get("VENDEDOR_ORP").toString()) : BigDecimal.ZERO);
            firstRow.put("VENDEDOR_NOME", orcamento.get("NOME_VEN") != null ? 
                orcamento.get("NOME_VEN").toString() : "");
            firstRow.put("OBS_ORP", orcamento.get("OBS_ORP") != null ? 
                orcamento.get("OBS_ORP").toString() : "");
            
            firstRow.put("TOTAL_PECAS", orcamento.get("TOTPEC_ORP") != null ? 
                new BigDecimal(orcamento.get("TOTPEC_ORP").toString()) : BigDecimal.ZERO);
            firstRow.put("TOTAL_SERVICOS", orcamento.get("TOTSER_ORP") != null ? 
                new BigDecimal(orcamento.get("TOTSER_ORP").toString()) : BigDecimal.ZERO);
            firstRow.put("VLR_ICMS_ST", orcamento.get("VLR_ICMS_ST") != null ? 
                new BigDecimal(orcamento.get("VLR_ICMS_ST").toString()) : BigDecimal.ZERO);
            firstRow.put("VLR_FRETE", orcamento.get("VLR_FRETE_ORP") != null ? 
                new BigDecimal(orcamento.get("VLR_FRETE_ORP").toString()) : BigDecimal.ZERO);
            firstRow.put("VLR_DIVERSOS", orcamento.get("VLR_DIVERSOS_ORP") != null ? 
                new BigDecimal(orcamento.get("VLR_DIVERSOS_ORP").toString()) : BigDecimal.ZERO);
            firstRow.put("VLR_DESCONTO", orcamento.get("VLR_DESCPEC_ORP") != null ? 
                new BigDecimal(orcamento.get("VLR_DESCPEC_ORP").toString()) : BigDecimal.ZERO);
            firstRow.put("TOTAL_LIQUIDO", orcamento.get("VLR_TOTAL_ORP") != null ? 
                new BigDecimal(orcamento.get("VLR_TOTAL_ORP").toString()) : BigDecimal.ZERO);
            
            for (Map<String, Object> item : itens) {
                Map<String, Object> itemData = new HashMap<>(firstRow);
                
                itemData.put("CODIGO_ITEM", item.get("CODIGO_ORPP") != null ? 
                    item.get("CODIGO_ORPP").toString() : "");
                itemData.put("DESCRICAO_ITEM", item.get("DESCR_ORPP") != null ? 
                    item.get("DESCR_ORPP").toString() : "");
                
                Object qtde = item.get("QTREC_ORPP");
                if (qtde instanceof BigDecimal) {
                    itemData.put("QTDE_ITEM", qtde);
                } else if (qtde != null) {
                    itemData.put("QTDE_ITEM", new BigDecimal(qtde.toString()));
                } else {
                    itemData.put("QTDE_ITEM", BigDecimal.ZERO);
                }
                
                Object preco = item.get("PRECOPUB_ORPP");
                if (preco instanceof BigDecimal) {
                    itemData.put("PRECO_UNIT", preco);
                } else if (preco != null) {
                    itemData.put("PRECO_UNIT", new BigDecimal(preco.toString()));
                } else {
                    itemData.put("PRECO_UNIT", BigDecimal.ZERO);
                }
                
                Object total = item.get("PRECOTOT_ORPP");
                if (total instanceof BigDecimal) {
                    itemData.put("PRECO_TOTAL", total);
                } else if (total != null) {
                    itemData.put("PRECO_TOTAL", new BigDecimal(total.toString()));
                } else {
                    itemData.put("PRECO_TOTAL", BigDecimal.ZERO);
                }
                
                itemData.put("PRAZO_ENTREGA", item.get("PRAZOENTR_ORPP") != null ? 
                    item.get("PRAZOENTR_ORPP").toString() : "");
                itemData.put("QTFALTA_ITEM", BigDecimal.ZERO);
                itemData.put("LOCALIZACAO", item.get("LOCACKAR_ORPP") != null ? 
                    item.get("LOCACKAR_ORPP").toString() : "");
                itemData.put("ATENDIDO", "S");
                
                Object vlrDesc = item.get("VLRDESC_ORPP");
                if (vlrDesc instanceof BigDecimal) {
                    itemData.put("VLR_DESC", vlrDesc);
                } else if (vlrDesc != null) {
                    itemData.put("VLR_DESC", new BigDecimal(vlrDesc.toString()));
                } else {
                    itemData.put("VLR_DESC", BigDecimal.ZERO);
                }
                
                Object totalLiq = item.get("PRECOTOT_ORPP");
                Object vlrDescLiq = item.get("VLRDESC_ORPP");
                BigDecimal vlrLiq = BigDecimal.ZERO;
                if (totalLiq instanceof BigDecimal) {
                    vlrLiq = (BigDecimal) totalLiq;
                } else if (totalLiq != null) {
                    vlrLiq = new BigDecimal(totalLiq.toString());
                }
                if (vlrDescLiq instanceof BigDecimal) {
                    vlrLiq = vlrLiq.subtract((BigDecimal) vlrDescLiq);
                } else if (vlrDescLiq != null) {
                    vlrLiq = vlrLiq.subtract(new BigDecimal(vlrDescLiq.toString()));
                }
                itemData.put("VLR_LIQUIDO", vlrLiq);
                
                dataList.add(itemData);
            }
            
            if (dataList.isEmpty()) {
                dataList.add(new HashMap<>(firstRow));
            }
            
            @SuppressWarnings("rawtypes")
            Collection dataCollection = dataList;
            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(dataCollection);
            
            JasperPrint jasperPrint = JasperFillManager.fillReport(
                jasperReport, 
                parameters, 
                dataSource
            );
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JRPdfExporter exporter = new JRPdfExporter();
            exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
            exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
            exporter.exportReport();
            
            return outputStream.toByteArray();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF do orçamento/pedido", e);
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }
    
    public byte[] gerarPdfNotaFiscal(Map<String, Object> notascab, List<Map<String, Object>> notasdet) {
        try {
            Resource resource = new ClassPathResource(REPORT_PATH);
            InputStream reportStream = resource.getInputStream();
            
            JasperReport jasperReport = (JasperReport) JRLoader.loadObject(reportStream);
            
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("EMPRESA_NOME", "SPDealer - Sistema de Gestao");
            parameters.put("EMPRESA_CNPJ", "00.000.000/0000-00");
            parameters.put("USUARIO", "SISTEMA");
            parameters.put("LOGO", loadLogo());
            
            List<Map<String, Object>> dataList = new ArrayList<>();
            Map<String, Object> firstRow = new HashMap<>();
            
            firstRow.put("NUMERO_ORP", notascab.get("NUMERO_NOT") != null ? 
                new BigDecimal(notascab.get("NUMERO_NOT").toString()) : BigDecimal.ZERO);
            firstRow.put("FILIAL_ORP", notascab.get("FILIAL_NOT") != null ? 
                new BigDecimal(notascab.get("FILIAL_NOT").toString()) : BigDecimal.ZERO);
            
            Object dtemi = notascab.get("EMISSAO_NOT");
            if (dtemi instanceof Date) {
                firstRow.put("DTEMI_ORP", dtemi);
            } else if (dtemi instanceof LocalDate) {
                firstRow.put("DTEMI_ORP", Date.valueOf((LocalDate) dtemi));
            } else if (dtemi instanceof Integer) {
                String dateStr = dtemi.toString();
                if (dateStr.length() == 8) {
                    String year = dateStr.substring(0, 4);
                    String month = dateStr.substring(4, 6);
                    String day = dateStr.substring(6, 8);
                    firstRow.put("DTEMI_ORP", Date.valueOf(LocalDate.parse(year + "-" + month + "-" + day)));
                } else {
                    firstRow.put("DTEMI_ORP", new Date(System.currentTimeMillis()));
                }
            } else {
                firstRow.put("DTEMI_ORP", new Date(System.currentTimeMillis()));
            }
            
            firstRow.put("TIPO_ORP", "NF");
            firstRow.put("TIPO_DESCRICAO", "Nota Fiscal");
            
            firstRow.put("CGCCPF_CLI", notascab.get("CGCCPF_NOT") != null ? 
                notascab.get("CGCCPF_NOT").toString() : "");
            firstRow.put("NOME_ORP", notascab.get("NOME_NOT") != null ? 
                notascab.get("NOME_NOT").toString() : "");
            firstRow.put("LOGRA_ORP", notascab.get("ENDER_NOT") != null ? 
                notascab.get("ENDER_NOT").toString() : "");
            firstRow.put("BAIRRO_ORP", "");
            firstRow.put("CIDADE_ORP", notascab.get("CIDADE_NOT") != null ? 
                notascab.get("CIDADE_NOT").toString() : "");
            firstRow.put("UF_ORP", notascab.get("UF_NOT") != null ? 
                notascab.get("UF_NOT").toString() : "");
            firstRow.put("CEP_ORP", notascab.get("CEP_NOT") != null ? 
                notascab.get("CEP_NOT").toString() : "");
            
            firstRow.put("CONDPAG_DESCR", notascab.get("CONDPAG_NOT") != null ? 
                notascab.get("CONDPAG_NOT").toString() : "");
            firstRow.put("VENDEDOR_ORP", notascab.get("VENDEDOR_NOT") != null ? 
                new BigDecimal(notascab.get("VENDEDOR_NOT").toString()) : BigDecimal.ZERO);
            firstRow.put("OBS_ORP", notascab.get("OBSERVACAO_NOT") != null ? 
                notascab.get("OBSERVACAO_NOT").toString() : "");
            
            firstRow.put("TOTAL_PECAS", notascab.get("VLRMERC_NOT") != null ? 
                new BigDecimal(notascab.get("VLRMERC_NOT").toString()) : BigDecimal.ZERO);
            firstRow.put("TOTAL_SERVICOS", BigDecimal.ZERO);
            firstRow.put("VLR_ICMS_ST", BigDecimal.ZERO);
            firstRow.put("VLR_FRETE", notascab.get("FRETE_NOT") != null ? 
                new BigDecimal(notascab.get("FRETE_NOT").toString()) : BigDecimal.ZERO);
            firstRow.put("VLR_DIVERSOS", notascab.get("VLROUTRAS_NOT") != null ? 
                new BigDecimal(notascab.get("VLROUTRAS_NOT").toString()) : BigDecimal.ZERO);
            firstRow.put("VLR_DESCONTO", notascab.get("VLRDESC_NOT") != null ? 
                new BigDecimal(notascab.get("VLRDESC_NOT").toString()) : BigDecimal.ZERO);
            firstRow.put("TOTAL_LIQUIDO", notascab.get("VLRNOT_NOT") != null ? 
                new BigDecimal(notascab.get("VLRNOT_NOT").toString()) : BigDecimal.ZERO);
            
            firstRow.put("NUMERO_NF", notascab.get("NUMERO_NOT") != null ? 
                notascab.get("NUMERO_NOT").toString() : "");
            firstRow.put("SERIE_NF", notascab.get("SERIE_NOT") != null ? 
                notascab.get("SERIE_NOT").toString() : "");
            firstRow.put("NATUREZA_NF", notascab.get("NATUREZA_NOT") != null ? 
                notascab.get("NATUREZA_NOT").toString() : "");
            
            for (Map<String, Object> item : notasdet) {
                Map<String, Object> itemData = new HashMap<>(firstRow);
                
                itemData.put("CODIGO_ITEM", item.get("PRODUTO_NOT") != null ? 
                    item.get("PRODUTO_NOT").toString() : "");
                itemData.put("DESCRICAO_ITEM", item.get("DESCRICAO_NOT") != null ? 
                    item.get("DESCRICAO_NOT").toString() : "");
                
                Object qtde = item.get("QTDE_NOT");
                if (qtde instanceof BigDecimal) {
                    itemData.put("QTDE_ITEM", qtde);
                } else if (qtde != null) {
                    itemData.put("QTDE_ITEM", new BigDecimal(qtde.toString()));
                } else {
                    itemData.put("QTDE_ITEM", BigDecimal.ZERO);
                }
                
                Object preco = item.get("PRECOUNIT_NOT");
                if (preco instanceof BigDecimal) {
                    itemData.put("PRECO_UNIT", preco);
                } else if (preco != null) {
                    itemData.put("PRECO_UNIT", new BigDecimal(preco.toString()));
                } else {
                    itemData.put("PRECO_UNIT", BigDecimal.ZERO);
                }
                
                Object total = item.get("VALORTOTAL_NOT");
                if (total instanceof BigDecimal) {
                    itemData.put("PRECO_TOTAL", total);
                } else if (total != null) {
                    itemData.put("PRECO_TOTAL", new BigDecimal(total.toString()));
                } else {
                    itemData.put("PRECO_TOTAL", BigDecimal.ZERO);
                }
                
                itemData.put("PRAZO_ENTREGA", "");
                itemData.put("QTFALTA_ITEM", BigDecimal.ZERO);
                itemData.put("LOCALIZACAO", "");
                itemData.put("ATENDIDO", "S");
                
                Object vlrDesc = item.get("DESCONTO_NOT");
                if (vlrDesc instanceof BigDecimal) {
                    itemData.put("VLR_DESC", vlrDesc);
                } else if (vlrDesc != null) {
                    itemData.put("VLR_DESC", new BigDecimal(vlrDesc.toString()));
                } else {
                    itemData.put("VLR_DESC", BigDecimal.ZERO);
                }
                
                Object baseIcms = item.get("BASEICMS_NOT");
                BigDecimal valorIcms = BigDecimal.ZERO;
                if (item.get("VALORICMS_NOT") instanceof BigDecimal) {
                    valorIcms = (BigDecimal) item.get("VALORICMS_NOT");
                } else if (item.get("VALORICMS_NOT") != null) {
                    valorIcms = new BigDecimal(item.get("VALORICMS_NOT").toString());
                }
                itemData.put("VLR_ICMS", valorIcms);
                
                Object baseIcmsSt = item.get("BASEICMSST_NOT");
                BigDecimal valorIcmsSt = BigDecimal.ZERO;
                if (item.get("VALORICMSST_NOT") instanceof BigDecimal) {
                    valorIcmsSt = (BigDecimal) item.get("VALORICMSST_NOT");
                } else if (item.get("VALORICMSST_NOT") != null) {
                    valorIcmsSt = new BigDecimal(item.get("VALORICMSST_NOT").toString());
                }
                itemData.put("VLR_ICMS_ST", valorIcmsSt);
                
                Object vlrIpi = item.get("VALORIPI_NOT");
                if (vlrIpi instanceof BigDecimal) {
                    itemData.put("VLR_IPI", vlrIpi);
                } else if (vlrIpi != null) {
                    itemData.put("VLR_IPI", new BigDecimal(vlrIpi.toString()));
                } else {
                    itemData.put("VLR_IPI", BigDecimal.ZERO);
                }
                
                itemData.put("NCM_NOT", item.get("NCM_NOT") != null ? 
                    item.get("NCM_NOT").toString() : "");
                itemData.put("UNIDADE_NOT", item.get("UNIDADE_NOT") != null ? 
                    item.get("UNIDADE_NOT").toString() : "");
                
                dataList.add(itemData);
            }
            
            if (dataList.isEmpty()) {
                dataList.add(new HashMap<>(firstRow));
            }
            
            @SuppressWarnings("rawtypes")
            Collection dataCollection = dataList;
            JRMapCollectionDataSource dataSource = new JRMapCollectionDataSource(dataCollection);
            
            JasperPrint jasperPrint = JasperFillManager.fillReport(
                jasperReport, 
                parameters, 
                dataSource
            );
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JRPdfExporter exporter = new JRPdfExporter();
            exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
            exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
            exporter.exportReport();
            
            return outputStream.toByteArray();
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF da Nota Fiscal", e);
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }
    
    public byte[] gerarPdfSimples(String titulo, Map<String, Object> dados, List<Map<String, Object>> itens) {
        try {
            Map<String, Object> orcamento = new HashMap<>();
            orcamento.put("NUMERO_ORP", dados.get("numero") != null ? dados.get("numero") : 0);
            orcamento.put("FILIAL_ORP", 1);
            orcamento.put("DTEMI_ORP", LocalDate.now());
            orcamento.put("TIPO_ORP", "O");
            orcamento.put("CODCLI_ORP", "");
            orcamento.put("CGCCPF_CLI", "");
            orcamento.put("NOME_ORP", dados.get("cliente") != null ? dados.get("cliente") : "");
            orcamento.put("LOGRA_ORP", "");
            orcamento.put("BAIRRO_ORP", "");
            orcamento.put("CIDADE_ORP", "");
            orcamento.put("UF_ORP", "");
            orcamento.put("CEP_ORP", "");
            orcamento.put("FONE_ORP", "");
            orcamento.put("PREF_ORP", "");
            orcamento.put("CONTATO_ORP", "");
            orcamento.put("CONDPAG_DESCR", "");
            orcamento.put("VENDEDOR_ORP", 0);
            orcamento.put("NOME_VEN", "");
            orcamento.put("OBS_ORP", "");
            orcamento.put("TOTPEC_ORP", dados.get("total") != null ? dados.get("total") : 0);
            orcamento.put("TOTSER_ORP", 0);
            orcamento.put("VLR_ICMS_ST", 0);
            orcamento.put("VLR_FRETE_ORP", 0);
            orcamento.put("VLR_DIVERSOS_ORP", 0);
            orcamento.put("VLR_DESCPEC_ORP", 0);
            orcamento.put("VLR_TOTAL_ORP", dados.get("total") != null ? dados.get("total") : 0);
            
            return gerarPdfOrcamentoPedido(orcamento, itens);
            
        } catch (Exception e) {
            log.error("Erro ao gerar PDF simples", e);
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }
    }
}
