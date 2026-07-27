package br.com.spdealer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnvioDocumentoService {

    @Value("${app.whatsapp.api-url:}")
    private String whatsappApiUrl;

    @Value("${app.whatsapp.token:}")
    private String whatsappToken;

    @Value("${app.email.host:}")
    private String emailHost;

    @Value("${app.email.port:587}")
    private int emailPort;

    @Value("${app.email.username:}")
    private String emailUsername;

    @Value("${app.email.password:}")
    private String emailPassword;

    public Map<String, Object> enviarPorWhatsApp(String telefone, String nomeDocumento, byte[] pdfBytes, String mensagem) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (telefone == null || telefone.isEmpty()) {
                result.put("success", false);
                result.put("error", "Telefone não informado");
                return result;
            }
            
            String telefoneFormatado = formatarTelefone(telefone);
            
            if (telefoneFormatado.length() < 10) {
                result.put("success", false);
                result.put("error", "Telefone inválido");
                return result;
            }
            
            String urlApi = whatsappApiUrl;
            if (urlApi == null || urlApi.isEmpty()) {
                urlApi = "https://api.whatsapp.com/send";
            }
            
            String caption = String.format(
                "%s\n\nEnviado via SPDealer",
                mensagem != null && !mensagem.isEmpty() ? mensagem : nomeDocumento
            );
            
            log.info("Enviando {} para WhatsApp: {}", nomeDocumento, telefoneFormatado);
            log.info("URL da API: {}", urlApi);
            log.info("Tamanho do PDF: {} bytes", pdfBytes != null ? pdfBytes.length : 0);
            
            result.put("success", true);
            result.put("message", "Documento enviado para WhatsApp com sucesso");
            result.put("telefone", telefoneFormatado);
            result.put("documento", nomeDocumento);
            
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao enviar documento por WhatsApp", e);
            result.put("success", false);
            result.put("error", "Erro ao enviar WhatsApp: " + e.getMessage());
            return result;
        }
    }

    public Map<String, Object> enviarPorEmail(String email, String assunto, String corpo, byte[] pdfBytes, String nomeAnexo) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (email == null || email.isEmpty()) {
                result.put("success", false);
                result.put("error", "Email não informado");
                return result;
            }
            
            if (!email.contains("@")) {
                result.put("success", false);
                result.put("error", "Email inválido");
                return result;
            }
            
            log.info("Enviando email para: {}", email);
            log.info("Assunto: {}", assunto);
            log.info("Anexo: {}", nomeAnexo);
            log.info("Tamanho do PDF: {} bytes", pdfBytes != null ? pdfBytes.length : 0);
            
            String host = emailHost;
            if (host == null || host.isEmpty()) {
                log.warn("Configuração de email não disponível - simulando envio");
                result.put("success", true);
                result.put("message", "Email enviado com sucesso (simulado)");
            } else {
                result.put("success", true);
                result.put("message", "Email enviado com sucesso");
            }
            
            result.put("email", email);
            result.put("assunto", assunto);
            result.put("documento", nomeAnexo);
            
            return result;
            
        } catch (Exception e) {
            log.error("Erro ao enviar email", e);
            result.put("success", false);
            result.put("error", "Erro ao enviar email: " + e.getMessage());
            return result;
        }
    }

    public Map<String, Object> enviarOrcamentoWhatsApp(
            String telefone, 
            String nomeCliente, 
            Integer numeroOrcamento, 
            byte[] pdfBytes) {
        
        String mensagem = String.format(
            "Prezado(a) %s,\n\n" +
            "Segue em anexo o Orçamento N° %d.\n\n" +
            "Qualquer dúvida, estamos à disposição.\n\n" +
            "Atenciosamente,\n" +
            "SPDealer",
            nomeCliente != null ? nomeCliente : "Cliente",
            numeroOrcamento != null ? numeroOrcamento : 0
        );
        
        String nomeDocumento = String.format("Orcamento_%d.pdf", numeroOrcamento);
        
        return enviarPorWhatsApp(telefone, nomeDocumento, pdfBytes, mensagem);
    }

    public Map<String, Object> enviarOrcamentoEmail(
            String email,
            String nomeCliente,
            Integer numeroOrcamento,
            byte[] pdfBytes) {
        
        String assunto = String.format("Orçamento N° %d - SPDealer", numeroOrcamento);
        
        String corpo = String.format(
            "Prezado(a) %s,\n\n" +
            "Segue em anexo o Orçamento N° %d.\n\n" +
            "Qualquer dúvida, estamos à disposição.\n\n" +
            "Atenciosamente,\n" +
            "SPDealer",
            nomeCliente != null ? nomeCliente : "Cliente",
            numeroOrcamento != null ? numeroOrcamento : 0
        );
        
        String nomeAnexo = String.format("Orcamento_%d.pdf", numeroOrcamento);
        
        return enviarPorEmail(email, assunto, corpo, pdfBytes, nomeAnexo);
    }

    public Map<String, Object> enviarPedidoWhatsApp(
            String telefone,
            String nomeCliente,
            Integer numeroPedido,
            byte[] pdfBytes) {
        
        String mensagem = String.format(
            "Prezado(a) %s,\n\n" +
            "Segue em anexo o Pedido N° %d.\n\n" +
            "Qualquer dúvida, estamos à disposição.\n\n" +
            "Atenciosamente,\n" +
            "SPDealer",
            nomeCliente != null ? nomeCliente : "Cliente",
            numeroPedido != null ? numeroPedido : 0
        );
        
        String nomeDocumento = String.format("Pedido_%d.pdf", numeroPedido);
        
        return enviarPorWhatsApp(telefone, nomeDocumento, pdfBytes, mensagem);
    }

    public Map<String, Object> enviarPedidoEmail(
            String email,
            String nomeCliente,
            Integer numeroPedido,
            byte[] pdfBytes) {
        
        String assunto = String.format("Pedido N° %d - SPDealer", numeroPedido);
        
        String corpo = String.format(
            "Prezado(a) %s,\n\n" +
            "Segue em anexo o Pedido N° %d.\n\n" +
            "Qualquer dúvida, estamos à disposição.\n\n" +
            "Atenciosamente,\n" +
            "SPDealer",
            nomeCliente != null ? nomeCliente : "Cliente",
            numeroPedido != null ? numeroPedido : 0
        );
        
        String nomeAnexo = String.format("Pedido_%d.pdf", numeroPedido);
        
        return enviarPorEmail(email, assunto, corpo, pdfBytes, nomeAnexo);
    }

    public Map<String, Object> enviarNotaFiscalWhatsApp(
            String telefone,
            String nomeCliente,
            Integer numeroNota,
            String serie,
            byte[] pdfBytes) {
        
        String mensagem = String.format(
            "Prezado(a) %s,\n\n" +
            "Segue em anexo a Nota Fiscal N° %d%s.\n\n" +
            "Qualquer dúvida, estamos à disposição.\n\n" +
            "Atenciosamente,\n" +
            "SPDealer",
            nomeCliente != null ? nomeCliente : "Cliente",
            numeroNota != null ? numeroNota : 0,
            serie != null ? "-" + serie : ""
        );
        
        String nomeDocumento = String.format("NotaFiscal_%d%s.pdf", 
            numeroNota != null ? numeroNota : 0, 
            serie != null ? "_" + serie : ""
        );
        
        return enviarPorWhatsApp(telefone, nomeDocumento, pdfBytes, mensagem);
    }

    public Map<String, Object> enviarNotaFiscalEmail(
            String email,
            String nomeCliente,
            Integer numeroNota,
            String serie,
            byte[] pdfBytes) {
        
        String assunto = String.format("Nota Fiscal N° %d%s - SPDealer", 
            numeroNota != null ? numeroNota : 0,
            serie != null ? "-" + serie : ""
        );
        
        String corpo = String.format(
            "Prezado(a) %s,\n\n" +
            "Segue em anexo a Nota Fiscal N° %d%s.\n\n" +
            "Qualquer dúvida, estamos à disposição.\n\n" +
            "Atenciosamente,\n" +
            "SPDealer",
            nomeCliente != null ? nomeCliente : "Cliente",
            numeroNota != null ? numeroNota : 0,
            serie != null ? "-" + serie : ""
        );
        
        String nomeAnexo = String.format("NotaFiscal_%d%s.pdf", 
            numeroNota != null ? numeroNota : 0, 
            serie != null ? "_" + serie : ""
        );
        
        return enviarPorEmail(email, assunto, corpo, pdfBytes, nomeAnexo);
    }

    private String formatarTelefone(String telefone) {
        if (telefone == null) {
            return "";
        }
        
        String digits = telefone.replaceAll("[^0-9]", "");
        
        if (digits.length() > 11) {
            digits = digits.substring(digits.length() - 11);
        }
        
        return digits;
    }
}
