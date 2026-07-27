package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import br.com.spdealer.util.DataDuplicadaUtil;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Exemplo de Controller usando DataDuplicadaUtil
 * Demonstra como utilizar a função genérica para datas duplicadas
 */
@RestController
@RequestMapping("/api/exemplo-datas")
public class ExemploDatasController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Exemplo: Inserir novo documento na tabela receber
     */
    @PostMapping("/receber")
    public ResponseEntity<Map<String, Object>> inserirReceber(@RequestBody Map<String, Object> dados) {
        try {
            // Dados básicos do documento
            Map<String, Object> dadosReceber = new HashMap<>();
            dadosReceber.put("filial_rec", "001");
            dadosReceber.put("codigo_rec", dados.get("codigo_cliente"));
            dadosReceber.put("numdup_rec", dados.get("numero_documento"));
            dadosReceber.put("parcela_rec", dados.get("parcela"));
            dadosReceber.put("vlrdup_rec", dados.get("valor_total"));
            dadosReceber.put("vlrsal_rec", dados.get("valor_total"));
            
            // Campos de data - a função genérica vai duplicar automaticamente
            dadosReceber.put("dtmovi_rec", dados.get("data_movimento"));     // Principal
            dadosReceber.put("dtemissi_rec", dados.get("data_emissao"));     // Principal  
            dadosReceber.put("dtvenci_rec", dados.get("data_vencimento"));   // Principal

            // Gerar e executar INSERT automaticamente com datas duplicadas
            Object[] sqlResult = DataDuplicadaUtil.gerarInsertComDatasDuplicadas("receber", dadosReceber, jdbcTemplate);
            jdbcTemplate.update((String) sqlResult[0], (Object[]) sqlResult[1]);

            Map<String, Object> response = new HashMap<>();
            response.put("sucesso", true);
            response.put("mensagem", "Documento inserido com datas duplicadas automaticamente");
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("erro", "Erro ao inserir documento: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Exemplo: Atualizar documento existente
     */
    @PutMapping("/receber/{id}")
    public ResponseEntity<Map<String, Object>> atualizarReceber(
            @PathVariable Integer id, 
            @RequestBody Map<String, Object> dados) {
        try {
            // Dados para atualização
            Map<String, Object> dadosUpdate = new HashMap<>();
            
            if (dados.containsKey("data_pagamento")) {
                dadosUpdate.put("dtpagi_rec", dados.get("data_pagamento")); // Principal - será duplicado
            }
            
            if (dados.containsKey("valor_pago")) {
                dadosUpdate.put("vlrpag_rec", dados.get("valor_pago"));
            }

            // Gerar e executar UPDATE automaticamente com datas duplicadas
            Object[] sqlResult = DataDuplicadaUtil.gerarUpdateComDatasDuplicadas(
                "receber", 
                dadosUpdate, 
                "receber_id = " + id,
                jdbcTemplate
            );
            
            int rowsAffected = jdbcTemplate.update((String) sqlResult[0], (Object[]) sqlResult[1]);

            Map<String, Object> response = new HashMap<>();
            response.put("sucesso", rowsAffected > 0);
            response.put("mensagem", "Documento atualizado com datas duplicadas automaticamente");
            response.put("registros_afetados", rowsAffected);
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("erro", "Erro ao atualizar documento: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Exemplo: Listar documentos sempre usando campos principais (com "i")
     */
    @GetMapping("/receber")
    public ResponseEntity<List<Map<String, Object>>> listarReceber() {
        try {
            // SEMPRE usar campos com "i" nas consultas
            String sql = """
                SELECT 
                    receber_id,
                    codigo_rec,
                    numdup_rec,
                    parcela_rec,
                    vlrdup_rec,
                    vlrsal_rec,
                    dtmovi_rec,     -- Campo principal
                    dtemissi_rec,   -- Campo principal
                    dtvenci_rec,    -- Campo principal
                    dtpagi_rec      -- Campo principal
                FROM receber 
                WHERE vlrsal_rec > 0
                ORDER BY dtvenci_rec
                """;

            List<Map<String, Object>> documentos = jdbcTemplate.queryForList(sql);
            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Exemplo: Demonstrar descoberta automática de campos duplicados
     */
    @GetMapping("/descobrir-campos/{tabela}")
    public ResponseEntity<Map<String, Object>> descobrirCamposDuplicados(@PathVariable String tabela) {
        try {
            Map<String, Object> exemplo = new HashMap<>();
            exemplo.put("dtmovi_rec", "2025-10-06"); // Simular uma data
            
            Map<String, Object> resultado = DataDuplicadaUtil.prepararCamposDataDuplicados(tabela, exemplo, jdbcTemplate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("tabela", tabela);
            response.put("dados_entrada", exemplo);
            response.put("dados_preparados", resultado);
            response.put("campos_detectados", resultado.size() - exemplo.size());
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("erro", "Erro ao descobrir campos: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
