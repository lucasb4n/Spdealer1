package br.com.sprsoftware.api.boleto.controller;

import br.com.sprsoftware.api.boleto.service.BancoServiceFactory;
import br.com.sprsoftware.api.boleto.service.ReceberBoletoPdfService;
import br.com.sprsoftware.api.boleto.service.ReceberBoletoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/boletos")
public class BoletoApiController {

    @Autowired
    private ReceberBoletoService service;

    @Autowired
    private BancoServiceFactory bancoFactory;

    @Autowired
    private ReceberBoletoPdfService boletoPdfService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(required = false) String banco,
            @RequestParam(required = false) String sucesso,
            @RequestParam(required = false) String numapo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(service.listar(banco, inicio, fim, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        Map<String, Object> resultado = service.buscar(id);
        if (!Boolean.TRUE.equals(resultado.get("sucesso"))) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/emitir/{id}")
    public ResponseEntity<Map<String, Object>> emitir(@PathVariable Long id) {
        Map<String, Object> resultado = service.emitirBanco(id);
        if (Boolean.TRUE.equals(resultado.getOrDefault("sucesso", false))) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

    @PostMapping("/enviar/{id}")
    public ResponseEntity<Map<String, Object>> enviarParaBanco(@PathVariable Long id) {
        Map<String, Object> resultado = service.enviarParaBanco(id);
        if (Boolean.TRUE.equals(resultado.getOrDefault("sucesso", false))) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

    @PostMapping("/baixar/{id}")
    public ResponseEntity<Map<String, Object>> baixar(@PathVariable Long id) {
        Map<String, Object> resultado = service.baixarBanco(id);
        if (Boolean.TRUE.equals(resultado.getOrDefault("sucesso", false))) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> downloadPdf(@PathVariable Long id) {
        try {
            byte[] pdfBytes = boletoPdfService.gerarPdf(id);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.inline().filename("boleto_" + id + ".pdf").build());
            return ResponseEntity.ok().headers(headers).body(pdfBytes);
        } catch (Exception e) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", e.getMessage());
            return ResponseEntity.internalServerError().body(erro);
        }
    }

    @GetMapping("/bancos")
    public ResponseEntity<Map<String, String>> bancosSuportados() {
        return ResponseEntity.ok(BancoServiceFactory.getBancosSuportados());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(service.obterStats());
    }
}
