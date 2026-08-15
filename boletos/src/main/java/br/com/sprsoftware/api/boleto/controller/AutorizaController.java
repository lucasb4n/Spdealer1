package br.com.sprsoftware.api.boleto.controller;

import br.com.sprsoftware.api.boleto.model.Boleto;
import br.com.sprsoftware.api.boleto.service.AutorizaService;
import br.com.sprsoftware.api.boleto.service.BancoServiceFactory;
import br.com.sprsoftware.api.boleto.service.BoletoPdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping({"/api/autoriza", "/api/boletos-legacy"})
public class AutorizaController {

    @Autowired
    private AutorizaService service;

    @Autowired
    private BancoServiceFactory bancoFactory;

    @Autowired
    private BoletoPdfService boletoPdfService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(required = false) String banco,
            @RequestParam(required = false) String sucesso,
            @RequestParam(required = false) String numapo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<Boleto> result = service.listar(banco, sucesso, numapo, inicio, fim, page, size);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", result.getContent());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("currentPage", result.getNumber());
        response.put("pageSize", result.getSize());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        Optional<Boleto> opt = service.buscarPorId(id);
        if (!opt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(opt.get());
    }

    @PostMapping("/emitir/{id}")
    public ResponseEntity<Map<String, Object>> emitir(@PathVariable Long id) {
        Map<String, Object> resultado = service.emitirBanco(id);
        if ((Boolean) resultado.getOrDefault("sucesso", false)) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

    @PostMapping("/enviar/{id}")
    public ResponseEntity<Map<String, Object>> enviarParaBanco(@PathVariable Long id) {
        Map<String, Object> resultado = service.enviarParaBanco(id);
        if ((Boolean) resultado.getOrDefault("sucesso", false)) {
            return ResponseEntity.ok(resultado);
        } else {
            return ResponseEntity.badRequest().body(resultado);
        }
    }

    @PostMapping("/baixar/{id}")
    public ResponseEntity<Map<String, Object>> baixar(@PathVariable Long id) {
        Map<String, Object> resultado = service.baixarBanco(id);
        if ((Boolean) resultado.getOrDefault("sucesso", false)) {
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
