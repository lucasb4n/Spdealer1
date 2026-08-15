package br.com.spdealer.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller de Boletos totalmente integrado ao backend do SPDealer.
 */
@RestController
@RequestMapping("/api/boletos")
public class BoletoController {

    private static final Logger logger = LoggerFactory.getLogger(BoletoController.class);
    private static final String SERVLET_BASE_URL = "http://localhost:5070/boleto/api/boletos";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/emitir/{id}")
    public ResponseEntity<?> emitirBoleto(@PathVariable Long id) {
        return proxyPost("/emitir/", id);
    }

    @PostMapping("/enviar/{id}")
    public ResponseEntity<?> enviarBoletoBanco(@PathVariable Long id) {
        return proxyPost("/enviar/", id);
    }

    @PostMapping("/baixar/{id}")
    public ResponseEntity<?> baixarBoletoBanco(@PathVariable Long id) {
        return proxyPost("/baixar/", id);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> downloadPdf(@PathVariable Long id) {
        try {
            String url = SERVLET_BASE_URL + "/" + id + "/pdf";
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);
            return ResponseEntity.status(response.getStatusCode())
                    .headers(response.getHeaders())
                    .body(response.getBody());
        } catch (HttpStatusCodeException e) {
            return parseError(e);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"sucesso\":false,\"mensagem\":\"Erro ao gerar PDF: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/bancos")
    public ResponseEntity<?> bancosSuportados() {
        try {
            String url = SERVLET_BASE_URL + "/bancos";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return ResponseEntity.status(response.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "748", "Sicredi",
                "237", "Bradesco",
                "001", "Banco do Brasil",
                "756", "Sicoob",
                "461", "Asaas",
                "003", "Asaas"
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> buscarBoleto(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            String sqlBusca = "SELECT receber_id, codigo_bol, nossonumero_rec, banco_rec FROM receber WHERE receber_id = ?";
            List<Map<String, Object>> registros = jdbcTemplate.queryForList(sqlBusca, id);

            if (registros.isEmpty()) {
                response.put("sucesso", false);
                return ResponseEntity.notFound().build();
            }

            response.put("sucesso", true);
            response.put("dados", registros.get(0));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("sucesso", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    private ResponseEntity<?> proxyPost(String path, Long id) {
        try {
            String url = SERVLET_BASE_URL + path + id;
            logger.info("=== PROCESSANDO BOLETO INTEGRADO SPDEALER -> POST {} ===", url);
            ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);
            return ResponseEntity.status(response.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getBody());
        } catch (HttpStatusCodeException e) {
            logger.warn("Retorno HTTP {} ao processar boleto id {}: {}", e.getStatusCode(), id, e.getResponseBodyAsString());
            return parseError(e);
        } catch (Exception e) {
            logger.error("Erro interno ao comunicar com o modulo de boletos para id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"sucesso\":false,\"mensagem\":\"Erro interno de comunicação: " + e.getMessage() + "\"}");
        }
    }

    private ResponseEntity<?> parseError(HttpStatusCodeException e) {
        return ResponseEntity.status(e.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(e.getResponseBodyAsString());
    }
}
