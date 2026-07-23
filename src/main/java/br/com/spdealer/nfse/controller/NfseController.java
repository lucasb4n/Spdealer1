package br.com.spdealer.nfse.controller;

import br.com.spdealer.nfse.service.NfseWebService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/nfse")
@RequiredArgsConstructor
@Slf4j
public class NfseController {

    private final NfseWebService nfseWebService;

    @PostMapping("/gerar")
    public ResponseEntity<Map<String, Object>> gerarNfse(
            @RequestParam Integer filial,
            @RequestParam Integer emissao,
            @RequestParam String tipo,
            @RequestParam String serie,
            @RequestParam Integer numero) {

        log.info("POST /api/nfse/gerar - filial={}, emissao={}, tipo={}, serie={}, numero={}",
                filial, emissao, tipo, serie, numero);

        Map<String, Object> result = nfseWebService.gerarNfse(filial, emissao, tipo, serie, numero);
        boolean sucesso = Boolean.TRUE.equals(result.get("sucesso"));
        return sucesso ? ResponseEntity.ok(result) : ResponseEntity.internalServerError().body(result);
    }
}
