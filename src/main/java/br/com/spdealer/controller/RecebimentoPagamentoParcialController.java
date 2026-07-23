package br.com.spdealer.controller;

import br.com.spdealer.service.RecebimentoPagamentoParcialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Endpoint para registrar recebimentos e pagamentos PARCIAIS
 * 
 * Fluxo:
 * POST /api/documentos-abertos/recebimento-parcial
 * POST /api/documentos-abertos/pagamento-parcial
 * 
 * Ambos devem:
 * 1. Inserir em recebidos/pagos (histórico)
 * 2. Manter documento ABERTO (dtpagi_rec/pag = NULL)
 * 3. Atualizar saldo pendente (vlrsal_rec/pag)
 */
@RestController
@RequestMapping("/api/documentos-abertos")
public class RecebimentoPagamentoParcialController {

    @Autowired
    private RecebimentoPagamentoParcialService servicoRecebimento;

    /**
     * Registra um RECEBIMENTO PARCIAL
     * 
     * Request body:
     * {
     *   "receber_id": 123,
     *   "codigo_cliente": 1001,
     *   "valor_recebido": 500.00,
     *   "desconto": 0,
     *   "acrescimo": 0,
     *   "data_recebimento": "2025-01-22",
     *   "cxbco_rec": "001",
     *   "operacao": "C03",
     *   "seq_caixa": 1,
     *   "observacao": "Recebimento parcial via caixa"
     * }
     */
    @PostMapping("/recebimento-parcial")
    public ResponseEntity<Map<String, Object>> registrarRecebimentoParcial(
            @RequestBody Map<String, Object> payload) {
        
        System.out.println("[RecebimentoParcialController] Recebendo requisição de recebimento parcial...");
        System.out.println("[RecebimentoParcialController] Payload: " + payload);

        try {
            // Extrair parâmetros do payload
            Integer receberID = ((Number) payload.get("receber_id")).intValue();
            Integer codigoCliente = ((Number) payload.get("codigo_cliente")).intValue();
            BigDecimal valorRecebido = new BigDecimal(payload.get("valor_recebido").toString());
            
            // Parâmetros opcionais
            BigDecimal desconto = payload.containsKey("desconto") && payload.get("desconto") != null 
                ? new BigDecimal(payload.get("desconto").toString()) 
                : BigDecimal.ZERO;
            
            BigDecimal acrescimo = payload.containsKey("acrescimo") && payload.get("acrescimo") != null 
                ? new BigDecimal(payload.get("acrescimo").toString()) 
                : BigDecimal.ZERO;
            
            LocalDate dataRecebimento = LocalDate.parse(payload.get("data_recebimento").toString());
            String cxbcoRec = payload.get("cxbco_rec").toString();
            String operacao = payload.get("operacao").toString();
            Integer seqCaixa = ((Number) payload.get("seq_caixa")).intValue();
            String observacao = payload.containsKey("observacao") ? payload.get("observacao").toString() : null;
            Integer usuarioId = payload.containsKey("usuario_id") ? ((Number) payload.get("usuario_id")).intValue() : null;
            
            // Chamar serviço
            Map<String, Object> resultado = servicoRecebimento.registrarRecebimentoParcial(
                receberID,
                codigoCliente,
                valorRecebido,
                desconto,
                acrescimo,
                dataRecebimento,
                cxbcoRec,
                operacao,
                seqCaixa,
                observacao,
                usuarioId
            );
            
            Boolean sucesso = (Boolean) resultado.get("sucesso");
            if (sucesso) {
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.status(400).body(resultado);
            }
            
        } catch (Exception e) {
            System.err.println("[RecebimentoParcialController] Erro: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> erro = new java.util.HashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Erro ao processar recebimento parcial: " + e.getMessage());
            
            return ResponseEntity.status(500).body(erro);
        }
    }

    /**
     * Registra um PAGAMENTO PARCIAL
     * 
     * Request body:
     * {
     *   "pagar_id": 456,
     *   "codigo_fornecedor": 2001,
     *   "valor_pago": 750.00,
     *   "desconto": 0,
     *   "acrescimo": 0,
     *   "data_pagamento": "2025-01-22",
     *   "cxbco_pag": "001",
     *   "operacao": "D03",
     *   "seq_caixa": 2,
     *   "observacao": "Pagamento parcial via caixa"
     * }
     */
    @PostMapping("/pagamento-parcial")
    public ResponseEntity<Map<String, Object>> registrarPagamentoParcial(
            @RequestBody Map<String, Object> payload) {
        
        System.out.println("[PagamentoParcialController] Recebendo requisição de pagamento parcial...");
        System.out.println("[PagamentoParcialController] Payload: " + payload);

        try {
            // Extrair parâmetros do payload
            Integer pagarID = ((Number) payload.get("pagar_id")).intValue();
            Integer codigoFornecedor = ((Number) payload.get("codigo_fornecedor")).intValue();
            BigDecimal valorPago = new BigDecimal(payload.get("valor_pago").toString());
            
            // Parâmetros opcionais
            BigDecimal desconto = payload.containsKey("desconto") && payload.get("desconto") != null 
                ? new BigDecimal(payload.get("desconto").toString()) 
                : BigDecimal.ZERO;
            
            BigDecimal acrescimo = payload.containsKey("acrescimo") && payload.get("acrescimo") != null 
                ? new BigDecimal(payload.get("acrescimo").toString()) 
                : BigDecimal.ZERO;
            
            LocalDate dataPagamento = LocalDate.parse(payload.get("data_pagamento").toString());
            String cxbcoPag = payload.get("cxbco_pag").toString();
            String operacao = payload.get("operacao").toString();
            Integer seqCaixa = ((Number) payload.get("seq_caixa")).intValue();
            String observacao = payload.containsKey("observacao") ? payload.get("observacao").toString() : null;
            Integer usuarioId = payload.containsKey("usuario_id") ? ((Number) payload.get("usuario_id")).intValue() : null;
            
            // Chamar serviço
            Map<String, Object> resultado = servicoRecebimento.registrarPagamentoParcial(
                pagarID,
                codigoFornecedor,
                valorPago,
                desconto,
                acrescimo,
                dataPagamento,
                cxbcoPag,
                operacao,
                seqCaixa,
                observacao,
                usuarioId
            );
            
            Boolean sucesso = (Boolean) resultado.get("sucesso");
            if (sucesso) {
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.status(400).body(resultado);
            }
            
        } catch (Exception e) {
            System.err.println("[PagamentoParcialController] Erro: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> erro = new java.util.HashMap<>();
            erro.put("sucesso", false);
            erro.put("mensagem", "Erro ao processar pagamento parcial: " + e.getMessage());
            
            return ResponseEntity.status(500).body(erro);
        }
    }

    /**
     * Consulta histórico de recebimentos de um documento
     * GET /api/documentos-abertos/historico-recebimentos/{receber_id}
     */
    @GetMapping("/historico-recebimentos/{receberID}")
    public ResponseEntity<?> consultarHistoricoRecebimentos(@PathVariable Integer receberID) {
        try {
            return ResponseEntity.ok(servicoRecebimento.consultarHistoricoRecebimentos(receberID));
        } catch (Exception e) {
            System.err.println("[RecebimentoParcialController] Erro ao consultar histórico: " + e.getMessage());
            return ResponseEntity.status(500).body("Erro ao consultar histórico de recebimentos");
        }
    }

    /**
     * Consulta histórico de pagamentos de um documento
     * GET /api/documentos-abertos/historico-pagamentos/{pagar_id}
     */
    @GetMapping("/historico-pagamentos/{pagarID}")
    public ResponseEntity<?> consultarHistoricoPagamentos(@PathVariable Integer pagarID) {
        try {
            return ResponseEntity.ok(servicoRecebimento.consultarHistoricoPagamentos(pagarID));
        } catch (Exception e) {
            System.err.println("[PagamentoParcialController] Erro ao consultar histórico: " + e.getMessage());
            return ResponseEntity.status(500).body("Erro ao consultar histórico de pagamentos");
        }
    }
}
