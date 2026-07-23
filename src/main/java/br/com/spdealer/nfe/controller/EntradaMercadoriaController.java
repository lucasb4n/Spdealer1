package br.com.spdealer.nfe.controller;

import br.com.spdealer.nfe.model.XmlNotaDet;
import br.com.spdealer.nfe.service.EntradaMercadoriaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/entrada-mercadoria")
@RequiredArgsConstructor
@Slf4j
public class EntradaMercadoriaController {

    private final EntradaMercadoriaService entradaMercadoriaService;

    @PostMapping("/upload-xml")
    public ResponseEntity<?> uploadXml(@RequestParam("file") MultipartFile file) {
        try {
            String xmlConteudo = new String(file.getBytes(), StandardCharsets.UTF_8);
            Map<String, Object> resultado = entradaMercadoriaService.processarUploadXml(xmlConteudo);

            if (resultado.containsKey("error")) {
                return ResponseEntity.badRequest().body(resultado);
            }
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao fazer upload do XML", e);
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao processar arquivo: " + e.getMessage()));
        }
    }

    @GetMapping("/itens/{chaveNfe}")
    public ResponseEntity<?> listarItens(@PathVariable String chaveNfe) {
        try {
            List<XmlNotaDet> itens = entradaMercadoriaService.listarItens(chaveNfe);
            return ResponseEntity.ok(itens);
        } catch (Exception e) {
            log.error("Erro ao listar itens", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/de-para/{chaveNfe}/{nItem}")
    public ResponseEntity<?> atualizarDePara(
            @PathVariable String chaveNfe,
            @PathVariable Integer nItem,
            @RequestBody Map<String, Object> body) {
        try {
            String fabEst = (String) body.get("fabEst");
            String codprodEst = (String) body.get("codprodEst");
            BigDecimal fatorConversao = body.get("fatorConversao") != null
                    ? new BigDecimal(body.get("fatorConversao").toString())
                    : BigDecimal.ONE;

            entradaMercadoriaService.atualizarDePara(chaveNfe, nItem, fabEst, codprodEst, fatorConversao);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("Erro ao atualizar de-para", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/confirmar/{chaveNfe}")
    public ResponseEntity<?> confirmarEntrada(@PathVariable String chaveNfe) {
        try {
            Map<String, Object> resultado = entradaMercadoriaService.confirmarEntrada(chaveNfe);
            if (resultado.containsKey("error")) {
                return ResponseEntity.badRequest().body(resultado);
            }
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao confirmar entrada", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/disponiveis")
    public ResponseEntity<?> listarDisponiveis() {
        try {
            Map<String, Object> resultado = entradaMercadoriaService.listarDisponiveis();
            if (resultado.containsKey("error")) {
                return ResponseEntity.badRequest().body(resultado);
            }
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao listar NF-es disponíveis", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/baixar/{chaveNfe}")
    public ResponseEntity<?> baixarNfe(@PathVariable String chaveNfe) {
        try {
            Map<String, Object> resultado = entradaMercadoriaService.baixarEProcessar(chaveNfe);
            if (resultado.containsKey("error")) {
                return ResponseEntity.badRequest().body(resultado);
            }
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao baixar NF-e", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/desconhecer/{chaveNfe}")
    public ResponseEntity<?> desconhecerNfe(@PathVariable String chaveNfe) {
        try {
            Map<String, Object> resultado = entradaMercadoriaService.desconhecerNfe(chaveNfe);
            if (resultado.containsKey("error")) {
                return ResponseEntity.badRequest().body(resultado);
            }
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Erro ao desconhecer NF-e", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
