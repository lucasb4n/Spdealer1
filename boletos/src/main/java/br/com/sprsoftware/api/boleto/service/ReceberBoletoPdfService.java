package br.com.sprsoftware.api.boleto.service;

import br.com.sprsoftware.api.boleto.model.Boleto;
import br.com.sprsoftware.api.boleto.model.ContaReceberDado;
import br.com.sprsoftware.api.boleto.repository.BoletoRepository;
import br.com.sprsoftware.api.boleto.repository.ReceberContaRepository;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.krysalis.barcode4j.impl.code128.Code128Bean;
import org.krysalis.barcode4j.output.bitmap.BitmapCanvasProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
public class ReceberBoletoPdfService {

    @Autowired
    private ReceberContaRepository contaRepository;

    @Autowired
    private BoletoRepository boletoRepository;

    @Autowired
    private JdbcTemplate jdbc;

    public byte[] gerarPdf(Long receberId) throws Exception {
        ContaReceberDado conta = contaRepository.buscarPorId(receberId)
                .orElseThrow(() -> new RuntimeException("Conta a receber nao encontrada: " + receberId));

        Boleto boleto = buscarBoletoVinculado(conta)
                .orElseThrow(() -> new RuntimeException("Boleto nao emitido para a conta a receber " + receberId));

        Map<String, Object> data = new LinkedHashMap<>();
        montarDadosCedente(data);
        montarDadosBanco(data, conta.banco() != null ? conta.banco().trim() : null);
        montarDadosTitulo(data, conta, boleto);

        String codigoBarras = boleto.getCodigoBarras();
        data.put("CODIGO_BARRAS_IMAGEM", gerarBarcode(codigoBarras));
        data.put("PIX_QRCODE", boleto.getPixQrcode());
        data.put("LINHA_DIGITAVEL", boleto.getLinhaDigitavel());

        JasperReport jasperReport = JasperCompileManager.compileReport(
                getClass().getResourceAsStream("/reports/Boleto_Banco.jrxml"));

        JasperPrint print = JasperFillManager.fillReport(jasperReport, new HashMap<>(),
                new JRBeanCollectionDataSource(Collections.singletonList(data)));
        byte[] pdfBytes = JasperExportManager.exportReportToPdf(print);

        String pdfDir = System.getProperty("java.io.tmpdir") + "/boletos_pdf/";
        new File(pdfDir).mkdirs();
        String pdfPath = pdfDir + "boleto_" + receberId + ".pdf";
        try (FileOutputStream fos = new FileOutputStream(pdfPath)) {
            fos.write(pdfBytes);
        }
        boleto.setArquivoPdf(pdfPath);
        boletoRepository.save(boleto);

        return pdfBytes;
    }

    private void montarDadosCedente(Map<String, Object> data) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT NOME_GER, COALESCE(CGCCPF_GER, CGC_GER) AS CGCCPF_GER, "
                        + "ENDGERAL_GER, CIDADE_GER, UF_GER, CEP_GER "
                        + "FROM masger LIMIT 1");
        String nome = "EMPRESA";
        String documento = null;
        String endereco = "";
        if (!rows.isEmpty()) {
            Map<String, Object> m = rows.get(0);
            nome = asString(m.get("NOME_GER"));
            documento = asString(m.get("CGCCPF_GER"));
            endereco = asString(m.get("ENDGERAL_GER"))
                    + " - " + asString(m.get("CIDADE_GER"))
                    + "/" + asString(m.get("UF_GER"))
                    + (m.get("CEP_GER") != null ? " - CEP " + asString(m.get("CEP_GER")) : "");
        }
        data.put("CEDENTE_NOME", nome);
        data.put("CEDENTE_DOCUMENTO", formatarDocumento(documento));
        data.put("CEDENTE_ENDERECO", endereco);
    }

    private void montarDadosBanco(Map<String, Object> data, String codigoBco) {
        String agencia = "";
        String agenciaDv = "";
        String conta = "";
        String contaDv = "";
        String carteira = "";
        String convenio = "";
        String localPagamento = "";
        String nomeBanco = "";
        if (codigoBco != null && !codigoBco.isEmpty()) {
            List<Map<String, Object>> rows = jdbc.queryForList(
                    "SELECT codigo_bco, COALESCE(nomefan_bco, nome_bco) AS nome_bco, "
                            + "agenc_bco, agencdv_bco, conta_bco, conta_dv_bco, "
                            + "carteira, convenio_numero, local_pagamento1, local_pagamento2 "
                            + "FROM bancos WHERE codigo_bco = ? LIMIT 1", codigoBco);
            if (!rows.isEmpty()) {
                Map<String, Object> m = rows.get(0);
                nomeBanco = asString(m.get("nome_bco"));
                agencia = asString(m.get("agenc_bco"));
                agenciaDv = asString(m.get("agencdv_bco"));
                conta = asString(m.get("conta_bco"));
                contaDv = asString(m.get("conta_dv_bco"));
                carteira = asString(m.get("carteira"));
                convenio = asString(m.get("convenio_numero"));
                localPagamento = asString(m.get("local_pagamento1"));
                if (localPagamento == null || localPagamento.isEmpty()) {
                    localPagamento = asString(m.get("local_pagamento2"));
                }
            }
        }
        String agenciaFormatada = agencia;
        if (agenciaDv != null && !agenciaDv.isEmpty()) {
            agenciaFormatada = agencia + "-" + agenciaDv;
        }
        String contaFormatada = conta;
        if (contaDv != null && !contaDv.isEmpty()) {
            contaFormatada = conta + "-" + contaDv;
        }
        String agenciaCodigo = agenciaFormatada;
        if (!contaFormatada.isEmpty()) {
            agenciaCodigo = (agenciaCodigo.isEmpty() ? "" : agenciaCodigo + " / ") + contaFormatada;
        }
        if (convenio != null && !convenio.isEmpty()) {
            agenciaCodigo = agenciaCodigo + " / Conv: " + convenio;
        }

        String bancoNumero = codigoBco != null ? codigoBco : "";
        if (nomeBanco != null && !nomeBanco.isEmpty()) {
            bancoNumero = bancoNumero + " - " + nomeBanco;
        }

        data.put("BANCO_NUMERO", bancoNumero);
        data.put("AGENCIA_CODIGO_CEDENTE", agenciaCodigo);
        data.put("CARTEIRA", carteira);
        data.put("LOCAL_PAGAMENTO", localPagamento != null && !localPagamento.isEmpty()
                ? localPagamento : "PAGÁVEL EM QUALQUER BANCO");
    }

    private void montarDadosTitulo(Map<String, Object> data, ContaReceberDado conta, Boleto boleto) {
        Date agora = new Date();
        data.put("DATA_DOCUMENTO", toDate(conta.dtEmissao() != null ? conta.dtEmissao() : LocalDate.now()));
        data.put("DATA_VENCIMENTO", toDate(conta.dtVencimento() != null ? conta.dtVencimento() : LocalDate.now()));
        data.put("DATA_PROCESSAMENTO", agora);
        data.put("NUMERO_DOCUMENTO", String.valueOf(conta.receberId()));
        data.put("ESPECIE_DOC", conta.tipodoc() != null && !conta.tipodoc().trim().isEmpty()
                ? conta.tipodoc().trim() : "DM");
        data.put("ACEITE", "N");
        data.put("MOEDA", "R$");
        data.put("QUANTIDADE", "");
        data.put("VALOR_DOCUMENTO", conta.valorSaldo() != null
                ? conta.valorSaldo().doubleValue() : 0.0);

        String nossoNumero = boleto.getNossonumero() != null ? boleto.getNossonumero() : boleto.getNossoNumero();
        data.put("NOSSO_NUMERO", nossoNumero != null ? nossoNumero : "");
        data.put("INSTRUCOES", montarInstrucoes(conta, boleto));

        String pagadorNome = conta.nomePagador() != null ? conta.nomePagador() : "";
        data.put("PAGADOR_NOME", pagadorNome);
        data.put("PAGADOR_DOCUMENTO", formatarDocumento(conta.cgccpf()));
        StringBuilder endPagador = new StringBuilder(conta.enderecoPagador() != null ? conta.enderecoPagador() : "");
        if (conta.cepPagador() != null && !conta.cepPagador().trim().isEmpty()) {
            if (endPagador.length() > 0) {
                endPagador.append(" - ");
            }
            endPagador.append("CEP ").append(conta.cepPagador().trim());
        }
        data.put("PAGADOR_ENDERECO", endPagador.toString());
    }

    private String montarInstrucoes(ContaReceberDado conta, Boleto boleto) {
        StringBuilder sb = new StringBuilder();
        sb.append("Não receber após o vencimento. Multa de 2% após o vencimento. "
                + "Juros de mora de 1% ao mês. Pagável em qualquer banco.");
        if (boleto.getBancoAut() != null) {
            sb.append(" Banco: ").append(boleto.getBancoAut().trim()).append(".");
        }
        if (boleto.getMsgAut() != null && !boleto.getMsgAut().trim().isEmpty()
                && !"OK".equals(boleto.getSucesso())) {
            sb.append(" Observação: ").append(boleto.getMsgAut().trim());
        }
        return sb.toString();
    }

    private Optional<Boleto> buscarBoletoVinculado(ContaReceberDado conta) {
        if (conta.codigoBol() == null || conta.codigoBol().trim().isEmpty()) {
            return Optional.empty();
        }
        try {
            return boletoRepository.findById(Long.valueOf(conta.codigoBol().trim()));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private String gerarBarcode(String codigoBarras) throws Exception {
        if (codigoBarras == null || codigoBarras.trim().isEmpty()) {
            return null;
        }
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

    private String formatarDocumento(String doc) {
        if (doc == null) {
            return null;
        }
        String numeros = doc.replaceAll("[^0-9]", "");
        if (numeros.length() == 11) {
            return numeros.replaceFirst("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
        }
        if (numeros.length() == 14) {
            return numeros.replaceFirst("(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{2})", "$1.$2.$3/$4-$5");
        }
        return doc;
    }

    private Date toDate(LocalDate date) {
        if (date == null) {
            return null;
        }
        return Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    private String asString(Object value) {
        return value != null ? String.valueOf(value).trim() : "";
    }
}
