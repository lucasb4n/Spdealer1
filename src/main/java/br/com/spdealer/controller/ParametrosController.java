package br.com.spdealer.controller;

import br.com.spdealer.model.ParametroGeral;
import br.com.spdealer.service.ParametrosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parametros")
public class ParametrosController {

    @Autowired
    private ParametrosService service;

    @GetMapping
    public ResponseEntity<List<ParametroGeral>> listar(@RequestParam(required = false) String grupo) {
        if (grupo != null) {
            return ResponseEntity.ok(service.listarPorGrupo(grupo));
        }
        return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/map")
    public ResponseEntity<Map<String, String>> getMap() {
        return ResponseEntity.ok(service.getMapTotal());
    }

    @PostMapping
    public ResponseEntity<?> salvar(@RequestBody List<ParametroGeral> parametros) {
        try {
            service.salvarLote(parametros);
            return ResponseEntity.ok(Map.of("message", "Parâmetros atualizados com sucesso"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao salvar parâmetros: " + e.getMessage()));
        }
    }

    @PutMapping("/{chave}")
    public ResponseEntity<?> atualizar(
            @PathVariable String chave,
            @RequestBody Map<String, String> body) {
        try {
            String valor = body.get("valor");
            service.salvar(chave, valor, null, null);
            return ResponseEntity.ok(Map.of("message", "Parâmetro atualizado"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
