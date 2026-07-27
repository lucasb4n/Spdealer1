package br.com.sprsoftware.api.boleto.service;

import br.com.sprsoftware.api.boleto.model.Autoriza;
import br.com.sprsoftware.api.boleto.repository.AutorizaRepository;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.krysalis.barcode4j.impl.code128.Code128Bean;
import org.krysalis.barcode4j.output.bitmap.BitmapCanvasProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
public class BoletoPdfService {

    @Autowired
    private AutorizaRepository autorizaRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbc;

    private static final String SQL = ""
            + "SELECT "
            + "  c.devedor_001 AS PAGADOR_NOME, "
            + "  c.endereco_001 AS PAGADOR_LOGRADOURO, "
            + "  c.bairro_001 AS PAGADOR_BAIRRO, "
            + "  c.cidade_001 AS PAGADOR_MUNICIPIO, "
            + "  c.uf_001 AS PAGADOR_UF, "
            + "  LPAD(IFNULL(c.cep_001,0),8,'0') AS PAGADOR_CEP, "
            + "  c.cedente_001 AS CREDOR_NOME, "
            + "  CONCAT(SUBSTRING(IFNULL(c.cgccpfced_001,''),1,2),'.',SUBSTRING(IFNULL(c.cgccpfced_001,''),3,3),'.',SUBSTRING(IFNULL(c.cgccpfced_001,''),6,3),'/',SUBSTRING(IFNULL(c.cgccpfced_001,''),9,4),'-',SUBSTRING(IFNULL(c.cgccpfced_001,''),13,2)) AS CREDOR_DOCUMENTO, "
            + "  c.sacador_001 AS SACADOR_NOME, "
            + "  c.sacador_001 AS AVALISTA_NOME, "
            + "  CONCAT(SUBSTRING(IFNULL(c.cgccpfsac_001,''),1,2),'.',SUBSTRING(IFNULL(c.cgccpfsac_001,''),3,3),'.',SUBSTRING(IFNULL(c.cgccpfsac_001,''),6,3),'/',SUBSTRING(IFNULL(c.cgccpfsac_001,''),9,4),'-',SUBSTRING(IFNULL(c.cgccpfsac_001,''),13,2)) AS AVALISTA_DOCUMENTO, "
            + "  c.numtit_001 AS NUMERO_TITULO, "
            + "  c.nossonum_001 AS NOSSO_NUMERO_DEVEDOR, "
            + "  REPLACE(REPLACE(IFNULL(c.nossonrocart_001,''),'/',''),'-','') AS NOSSO_NUMERO_COMPLETO, "
            + "  c.especie_001 AS ESPECIE_BANCO, "
            + "  c.portador_001 AS PORTADOR_NOME, "
            + "  c.livroprot_001 AS LIVRO, "
            + "  c.folhaprot_001 AS FOLHA, "
            + "  c.vlrtit_001 AS VALOR_TITULO, "
            + "  c.vlrpro_001 AS EMOLUMENTOS, "
            + "  c.vlrint_001 AS VRC_INT, "
            + "  c.vlrpro_001 AS VRC_PRO, "
            + "  c.vlrdis_001 AS VRC_DIS, "
            + "  c.selodis_001 AS DISTRIBUIDOR, "
            + "  c.frj_001 AS FUNREJUS, "
            + "  c.isscus_001 AS ISSQN, "
            + "  c.vlrass_001 AS FUNDEP, "
            + "  c.vlrdigit_001 AS VALOR_DIGITALIZACAO, "
            + "  (c.vlrtit_001 + IFNULL(c.vlrpro_001,0) + IFNULL(c.vlrint_001,0) + IFNULL(c.vlrdis_001,0) + IFNULL(c.selodis_001,0) + IFNULL(c.vlrcor_001,0) + IFNULL(c.vlrass_001,0) + IFNULL(c.isscus_001,0) + IFNULL(c.frj_001,0) + IFNULL(c.vlrdilig_001,0) + IFNULL(c.vlrcond_001,0) + IFNULL(c.vlrdigit_001,0) + IFNULL(c.vlrselo_001,0) + IFNULL(c.vlrseloint_001,0) + IFNULL(c.vlrselotp3_001,0)) AS VALOR_BOLETO, "
            + "  NULLIF(c.dataapo_001,0) AS DATA_APONTAMENTO_DEC, "
            + "  NULLIF(c.dtdistrib_001,0) AS DATA_DISTRIBUICAO_DEC, "
            + "  NULLIF(c.dtemissao_001,0) AS DATA_EMISSAO_DEC, "
            + "  c.situacao_001 AS SITUACAO, "
            + "  c.codport_001 AS COD_PORTADOR, "
            + "  c.numdistribuid_001 AS NUM_DISTRIBUIDOR, "
            + "  CONCAT(SUBSTRING(c.numapo1_001,3,2),SUBSTRING(c.numapo1_001,5,2),SUBSTRING(c.numapo2_001,5,6)) AS DOCUMENTO_NUMERO, "
            + "  CONCAT(SUBSTRING(IFNULL(c.numer_001,''),1,2),'.',SUBSTRING(IFNULL(c.numer_001,''),3,3),'.',SUBSTRING(IFNULL(c.numer_001,''),6,3),'/',SUBSTRING(IFNULL(c.numer_001,''),9,4),'-',c.digito_001) AS PAGADOR_DOCUMENTO, "
            + "  c.linhadig_001 AS LINHA_DIGITAVEL_CTP, "
            + "  c.qrcode_001 AS QR_CODE_CTP, "
            + "  b.agenc_bco AS AGENCIA_NUMERO, "
            + "  b.agencdv_bco AS AGENCIA_DV, "
            + "  b.conta_bco AS CONTA_CORRENTE_NUMERO, "
            + "  b.conta_dv_bco AS CONTA_CORRENTE_DV, "
            + "  b.carteira AS CARTEIRA_FORMATADA, "
            + "  b.codigoBene AS BENEFICIARIO_COD_CLIENTE, "
            + "  b.convenio_numero AS NUMERO_CONVENIO, "
            + "  b.local_pagamento1 AS LOCAL_PAGAMENTO1, "
            + "  b.local_pagamento2 AS LOCAL_PAGAMENTO2, "
            + "  b.carteira AS CARTEIRA, "
            + "  b.codigo_bco AS BANCO_NUMERO, "
            + "  p.NOME_TABELIONATO_PAR AS OFICAL_NOME, "
            + "  p.NOME_TABELIONATO_PAR AS EMPRESA_NOME, "
            + "  p.TITULAR_PAR AS BENEFICIARIO_NOME, "
            + "  p.TABELIAO_PAR AS BENEFICIARIO_NOME2, "
            + "  p.CNPJ_PAR AS EMPRESA_CNPJ, "
            + "  p.CNPJ_PAR AS BENEFICIARIO_DOCUMENTO, "
            + "  p.FONE_PAR AS BENEFICIARIO_TELEFONE, "
            + "  p.FONE_PAR AS EMPRESA_FONE, "
            + "  p.EMAIL_PAR AS BENEFICIARIO_EMAIL, "
            + "  p.EMAIL_PAR AS EMPRESA_EMAIL, "
            + "  p.LOGRADOURO_PAR AS BENEFICIARIO_LOGRADOURO, "
            + "  p.BAIRRO_PAR AS BENEFICIARIO_BAIRRO, "
            + "  p.CEP_PAR AS BENEFICIARIO_CEP, "
            + "  p.UF_PAR AS BENEFICIARIO_UF, "
            + "  p.CODTABEL_PAR AS NUMERO_CONVENIO_PAR, "
            + "  p.VRC_PAR AS VRC_PARAM, "
            + "  p.EXPEDIENTE AS EXPEDIENTE_PAR, "
            + "  p.LOGRADOURO_COMPLETO AS EMPRESA_ENDERECO, "
            + "  m.cidade_mes AS CIDADE, "
            + "  m.uf_mes AS UF_MES, "
            + "  m.ender_mes AS ENDER_MES, "
            + "  CASE WHEN p.CODIGO_CID IN (4114906,4104907,4117701) THEN DATE_ADD(a.vencimento_aut, INTERVAL 1 DAY) ELSE a.vencimento_aut END AS DATA_VENCIMENTO "
            + "FROM ctp001 c "
            + "INNER JOIN bancos b ON b.codigo_bco = :banco "
            + "INNER JOIN parametros p ON p.CODIGO_PAR = 1 "
            + "LEFT JOIN mestre m ON m.num_empre = 1 "
            + "LEFT JOIN boletos a ON (c.numapo1_001 = a.numapo1_aut) AND (c.numapo2_001 = a.numapo2_aut) AND (c.controle_001 = a.controle_aut) AND (a.tipo_aut = 'I') AND (a.CANCELADO = '') "
            + "WHERE (c.numapo2_001 = :numapo2) AND (c.numapo1_001 = :numapo1) AND (c.controle_001 = :controle) "
            + "LIMIT 1";

    public byte[] gerarPdf(Long autorizaId) throws Exception {
        Autoriza autoriza = autorizaRepository.findById(autorizaId)
                .orElseThrow(() -> new RuntimeException("Registro nao encontrado: " + autorizaId));

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("banco", autoriza.getBancoAut());
        params.addValue("numapo1", autoriza.getNumapo1Aut());
        params.addValue("numapo2", autoriza.getNumapo2Aut());
        params.addValue("controle", autoriza.getControleAut());

        List<Map<String, Object>> rows = jdbc.queryForList(SQL, params);

        Map<String, Object> data = new LinkedHashMap<>();
        if (!rows.isEmpty()) {
            Map<String, Object> raw = rows.get(0);
            for (Map.Entry<String, Object> e : raw.entrySet()) {
                Object v = e.getValue();
                if (v instanceof Number && !(v instanceof Double)) {
                    v = ((Number) v).doubleValue();
                }
                data.put(e.getKey(), v);
            }
        }

        data.put("Field_1", "");
        data.put("WHATS", autoriza.getCelularAut());
        data.put("EMPRESA_CNPJ", data.get("EMPRESA_CNPJ"));
        data.put("CABECALHO", "");
        data.put("PROTOCOLO", autoriza.getCodbolAut());
        data.put("DADOS_DO_TITULO", "");
        data.put("SELO_FISCALIZACAO", "");
        data.put("TIPO_COBRANCA", "");
        data.put("MOTIVO", "");
        data.put("COD_MOTIVO", "");
        data.put("ANOTACAO", null);
        data.put("ACEITE", "N");
        data.put("DOCUMENTO_ACEITE", "NAO");
        data.put("DOCUMENTO_ESPECIE", "");
        data.put("DOCUMENTO_ESPECIE3", "");
        data.put("ESPECIE_ORIGINAL", "");
        data.put("MOEDA", "9");
        data.put("MOEDA_SIMBOLO", "R$");
        data.put("MOEDA_QUANTIDADE", "0");
        data.put("MOEDA_VALOR", 0.0);
        data.put("VALOR_DESCONTO", 0.0);
        data.put("VALOR_OUTROS_ABATIMENTOS", 0.0);
        data.put("VALOR_MULTA_JUROS", 0.0);
        data.put("VALOR_ACRESCIMO", 0.0);
        data.put("VALOR_TOTAL", data.get("VALOR_BOLETO"));
        data.put("VALOR_CONTADOR", 0.0);
        data.put("FUNARPEN", 0.0);
        data.put("REPASSE", 0.0);
        data.put("DATA_LIMITE", "");
        data.put("PRAÇA", "");
        data.put("INSTRUCOES_RECIBO", "");
        data.put("INSTRUCOES1", "");
        data.put("INSTRUCOES", "");
        data.put("ENDOSSO", "");
        data.put("INTIMACAO", null);
        data.put("REMESSA", null);
        data.put("CODIGO_OPERACAO", "");
        data.put("AGENCIA_CODIGO_CEDENTE_FORMATADO", "");
        data.put("BENEFICIARIO_CODIGO_FORNECIDO_AGENCIA", data.get("NUMERO_CONVENIO"));
        data.put("BENEFICIARIO_CODIGO_FORNECIDO_AGENCIA_DV", "");
        data.put("BENEFICIARIO_SITE", "");
        data.put("DISTRIBUIÇAO", "");
        data.put("EXPEDIENTE", data.get("EXPEDIENTE_PAR"));

        Date agora = new Date();
        data.put("DATA_PROCESSAMENTO", agora);
        data.put("DOCUMENTO_DATA", agora);

        if (data.get("DATA_VENCIMENTO") == null) {
            data.put("DATA_VENCIMENTO", Date.from(autoriza.getVencimentoAut().atStartOfDay(ZoneId.systemDefault()).toInstant()));
        }
        if (data.get("DATA_EMISSAO_DEC") != null) {
            data.put("DATA_EMISSAO", decToDate((Number) data.get("DATA_EMISSAO_DEC")));
        } else {
            data.put("DATA_EMISSAO", Date.from(LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()));
        }
        if (data.get("DATA_APONTAMENTO_DEC") != null) {
            data.put("DATA_APONTAMENTO", decToDate((Number) data.get("DATA_APONTAMENTO_DEC")));
        } else {
            data.put("DATA_APONTAMENTO", agora);
        }
        if (data.get("DATA_DISTRIBUICAO_DEC") != null) {
            data.put("DATA_DISTRIBUICAO", decToDate((Number) data.get("DATA_DISTRIBUICAO_DEC")));
        }
        data.put("DATA_VENCIMENTO_DEVEDOR", data.get("DATA_VENCIMENTO") != null ? data.get("DATA_VENCIMENTO").toString() : "");

        data.put("NOSSO_NUMERO_DV", "");
        data.put("CONTA_CORRENTE_NUMERO", data.get("CONTA_CORRENTE_NUMERO"));
        data.put("CONTA_CORRENTE_DV", data.get("CONTA_CORRENTE_DV"));

        data.put("LINHA_DIGITAVEL", autoriza.getLinhaDigitavel() != null ? autoriza.getLinhaDigitavel() : data.get("LINHA_DIGITAVEL_CTP"));
        data.put("CODIGO_BARRAS", autoriza.getCodigoBarras());
        data.put("QR_CODE", autoriza.getPixQrcode() != null ? autoriza.getPixQrcode() : data.get("QR_CODE_CTP"));
        data.put("QR_CODE2", data.get("QR_CODE"));

        data.put("CODIGO_BARRAS_IMAGEM", gerarBarcode(autoriza.getCodigoBarras()));
        data.put("BENEFICIARIO_LOGOMARCA", getLogoPath());
        data.put("BANCO_LOGOMARCA", null);
        data.put("WHATSAPP", null);

        JasperReport jasperReport = JasperCompileManager.compileReport(
                getClass().getResourceAsStream("/reports/Boleto_M8PB.jrxml"));

        Map<String, Object> jasperParams = new HashMap<>();
        jasperParams.put("QTD_BOLETOS", 1);
        jasperParams.put("l2sAVISO", "");
        jasperParams.put("l2sSISTEMA", "");

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(
                Collections.singletonList(data));

        JasperPrint print = JasperFillManager.fillReport(jasperReport, jasperParams, dataSource);
        byte[] pdfBytes = JasperExportManager.exportReportToPdf(print);

        String pdfDir = System.getProperty("java.io.tmpdir") + "/boletos_pdf/";
        new File(pdfDir).mkdirs();
        String pdfPath = pdfDir + "boleto_" + autorizaId + ".pdf";
        try (FileOutputStream fos = new FileOutputStream(pdfPath)) {
            fos.write(pdfBytes);
        }
        autoriza.setArquivoPdf(pdfPath);
        autorizaRepository.save(autoriza);

        return pdfBytes;
    }

    private String gerarBarcode(String codigoBarras) throws Exception {
        if (codigoBarras == null || codigoBarras.trim().isEmpty()) return null;
        Code128Bean bean = new Code128Bean();
        bean.setHeight(15f);
        bean.setModuleWidth(0.21);
        bean.setQuietZone(10);
        bean.doQuietZone(true);
        File tempFile = File.createTempFile("barcode_", ".png");
        try (FileOutputStream out = new FileOutputStream(tempFile)) {
            BitmapCanvasProvider canvas = new BitmapCanvasProvider(
                    out, "image/png", 200, BufferedImage.TYPE_BYTE_BINARY, false, 0);
            bean.generateBarcode(canvas, codigoBarras);
            canvas.finish();
        }
        return tempFile.getAbsolutePath();
    }

    private String getLogoPath() throws Exception {
        try (InputStream in = getClass().getResourceAsStream("/static/logo_cartorio.jpg")) {
            if (in == null) return null;
            File tempFile = File.createTempFile("logo_cartorio_", ".jpg");
            Files.copy(in, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            return tempFile.getAbsolutePath();
        }
    }

    private Date decToDate(Number dec) {
        if (dec == null) return null;
        int v = dec.intValue();
        if (v < 10000000) return null;
        int dia = v / 1000000;
        int mes = (v / 10000) % 100;
        int ano = v % 10000;
        if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.set(ano, mes - 1, dia, 0, 0, 0);
        cal.set(java.util.Calendar.MILLISECOND, 0);
        return cal.getTime();
    }
}
