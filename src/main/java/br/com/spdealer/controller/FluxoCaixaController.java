package br.com.spdealer.controller;

import br.com.spdealer.dto.LancamentoRequest;
import br.com.spdealer.model.Caixa;
import br.com.spdealer.service.CaixaService;
import br.com.spdealer.service.DocumentoPagarService;
import br.com.spdealer.service.DocumentoReceberService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/fluxo-caixa")
@RequiredArgsConstructor
@Slf4j
public class FluxoCaixaController {

    private final CaixaService caixaService;
    private final DocumentoReceberService documentoReceberService;
    private final DocumentoPagarService documentoPagarService;

    @GetMapping("/today")
    public ResponseEntity<?> fluxoHoje(@RequestParam(required = false) String banco) {
        LocalDate hoje = LocalDate.now();
        try {
            Map<String, Object> resp = new HashMap<>();

            List<Caixa> todos = caixaService.listarLancamentos(org.springframework.data.domain.Pageable.unpaged()).getContent();

            List<Map<String, Object>> movimentos = todos.stream()
                    .filter(c -> c.getDtmoviCai().isEqual(hoje) && (banco == null || banco.isEmpty() || banco.equals(c.getBancoCai())))
                    .map(c -> {
                        Map<String, Object> m = new HashMap<String, Object>();
                        m.put("seq", c.getSeqCai());
                        m.put("data", c.getDtmoviCai());
                        m.put("tipo", c.getDcCai());
                        m.put("valor", c.getValorCai());
                        m.put("banco", c.getBancoCai());
                        m.put("historico", c.getHistoricoCai());
                        m.put("documentos", c.getDocumentosVinculados());
                        return m;
                    }).toList();

            // Calcular somas locais
            BigDecimal totalCred = movimentos.stream()
                    .filter(m -> "C".equals(m.get("tipo")))
                    .map(m -> (BigDecimal) m.get("valor"))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalDeb = movimentos.stream()
                    .filter(m -> "D".equals(m.get("tipo")))
                    .map(m -> (BigDecimal) m.get("valor"))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            resp.put("data", hoje);
            resp.put("total_credito", totalCred);
            resp.put("total_debito", totalDeb);
            resp.put("movimentos", movimentos);

            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Erro ao consultar fluxo hoje", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/lancamento")
    public ResponseEntity<?> criarLancamento(@RequestBody LancamentoRequest req) {
        try {
            // Validações básicas
            if (req.documentoIds == null || req.documentoIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "documentoIds é obrigatório"));
            }
            if (req.tipo == null || (!req.tipo.equalsIgnoreCase("RECEBER") && !req.tipo.equalsIgnoreCase("PAGAR"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "tipo inválido (RECEBER|PAGAR)"));
            }

            // Conferir soma dos documentos via CaixaService
            BigDecimal soma = caixaService.calcularSomaDocumentos(req.documentoIds, req.tipo.equalsIgnoreCase("RECEBER") ? "R" : "P");

            Caixa caixa = Caixa.builder()
                    .dtmoviCai(LocalDate.parse(req.data))
                    .dcCai(req.operacao != null && req.operacao == 600 ? "D" : "C")
                    .valorCai(soma)
                    .bancoCai(req.banco)
                    .clienteCai(req.cliente)
                    .operacaoCai(req.operacao != null ? String.valueOf(req.operacao) : null)
                    .historicoCai(req.historico != null ? req.historico : "Lancamento via Fluxo de Caixa")
                    .documentosVinculados(null)
                    .valorDocumentos(soma)
                    .build();

            if (!caixa.isValoresEmConferencia()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Valor do lancamento diferente da soma dos documentos"));
            }

            Caixa salvo = caixaService.criarLancamento(caixa);

            // vincular documentos
            if (req.tipo.equalsIgnoreCase("RECEBER")) {
                int updated = documentoReceberService.marcarComoPago(req.documentoIds, salvo.getSeqCai(), req.data, salvo.getClienteCai(),
                        salvo.getOperacaoCai() != null ? Integer.parseInt(salvo.getOperacaoCai()) : null,
                        salvo.getSeqCai() != null ? salvo.getSeqCai().intValue() : null,
                        req.filial);
                return ResponseEntity.ok(Map.of("caixa", salvo, "updated_documents", updated));
            } else {
                int updated = documentoPagarService.marcarComoPago(req.documentoIds, salvo.getSeqCai(), req.data, salvo.getClienteCai(),
                        salvo.getOperacaoCai() != null ? Integer.parseInt(salvo.getOperacaoCai()) : null,
                        salvo.getSeqCai() != null ? salvo.getSeqCai().intValue() : null,
                        req.filial);
                return ResponseEntity.ok(Map.of("caixa", salvo, "updated_documents", updated));
            }

        } catch (Exception e) {
            log.error("Erro ao criar lancamento via fluxo-caixa", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


}

