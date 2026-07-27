package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.spdealer.entity.FluxoCaixaLinhas;
import br.com.spdealer.service.FluxoCaixaLinhasService;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/fluxo-caixa-linhas")
public class FluxoCaixaLinhasController {
    
    @Autowired
    private FluxoCaixaLinhasService service;
    
    @GetMapping
    public ResponseEntity<?> obterTodas() {
        try {
            List<FluxoCaixaLinhas> linhas = service.obterTodas();
            return ResponseEntity.ok(linhas);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao buscar linhas: " + e.getMessage()));
        }
    }
    
    @GetMapping("/query/{queryId}")
    public ResponseEntity<?> obterPorQueryId(@PathVariable Long queryId) {
        try {
            List<FluxoCaixaLinhas> linhas = service.obterPorQueryId(queryId);
            return ResponseEntity.ok(linhas);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao buscar linhas: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> obterPorId(@PathVariable Long id) {
        try {
            return service.obterPorId(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao buscar linha: " + e.getMessage()));
        }
    }
    
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody FluxoCaixaLinhas linha) {
        try {
            FluxoCaixaLinhas criada = service.criar(linha);
            return ResponseEntity.ok(criada);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao criar linha: " + e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody FluxoCaixaLinhas linha) {
        try {
            FluxoCaixaLinhas atualizada = service.atualizar(id, linha);
            return ResponseEntity.ok(atualizada);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao atualizar linha: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        try {
            service.deletar(id);
            return ResponseEntity.ok(Map.of("message", "Linha deletada com sucesso"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao deletar linha: " + e.getMessage()));
        }
    }
}
