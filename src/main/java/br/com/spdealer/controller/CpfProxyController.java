package br.com.spdealer.controller;

import br.com.spdealer.service.CpfProxyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/internal")
public class CpfProxyController {

    @Autowired
    private CpfProxyService cpfProxyService;

    @PostMapping("/consulta-cpf")
    public ResponseEntity<?> consultaCpf(@RequestBody Map<String, String> payload) {
        try {
            String cpf = payload.get("cpf");
            if (cpf == null || cpf.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "CPF é obrigatório"));
            }

            Map<String, Object> result = cpfProxyService.consultarCpf(cpf);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
