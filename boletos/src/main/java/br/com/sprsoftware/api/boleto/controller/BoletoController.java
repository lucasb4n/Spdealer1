package br.com.sprsoftware.api.boleto.controller;

import br.com.sprsoftware.api.boleto.model.DadosBoleto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/boletos")
public class BoletoController {

    private final Map<Long, DadosBoleto> boletos = new HashMap<>();
    private Long nextId = 1L;

    @GetMapping
    public ResponseEntity<List<DadosBoleto>> listarBoletos() {
        return ResponseEntity.ok(new ArrayList<>(boletos.values()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DadosBoleto> buscarBoleto(@PathVariable Long id) {
        DadosBoleto boleto = boletos.get(id);
        if (boleto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(boleto);
    }

    @PostMapping
    public ResponseEntity<DadosBoleto> criarBoleto(@RequestBody DadosBoleto boleto) {
        if (boleto.getValor() != null
                && boleto.getValor().compareTo(DadosBoleto.LIMITE_MAXIMO) > 0) {
            return ResponseEntity.badRequest().build();
        }
        boleto.setId(nextId++);
        boleto.setStatus("PENDENTE");
        boleto.setLinhaDigitavel(gerarLinhaDigitavel());
        boleto.setCodigoBarras(gerarCodigoBarras());
        boletos.put(boleto.getId(), boleto);
        return ResponseEntity.ok(boleto);
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<DadosBoleto> cancelarBoleto(@PathVariable Long id) {
        DadosBoleto boleto = boletos.get(id);
        if (boleto == null) return ResponseEntity.notFound().build();
        if (!"PENDENTE".equals(boleto.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        boleto.setStatus("CANCELADO");
        return ResponseEntity.ok(boleto);
    }

    @PostMapping("/validar-valor")
    public ResponseEntity<Map<String, Object>> validarValor(@RequestBody Map<String, BigDecimal> request) {
        BigDecimal valor = request.get("valor");
        Map<String, Object> result = new HashMap<>();

        if (valor == null) {
            result.put("valido", false);
            result.put("mensagem", "Valor e obrigatorio");
        } else if (valor.compareTo(BigDecimal.ZERO) <= 0) {
            result.put("valido", false);
            result.put("mensagem", "Valor deve ser maior que zero");
        } else if (valor.compareTo(DadosBoleto.LIMITE_MAXIMO) > 0) {
            result.put("valido", false);
            result.put("mensagem", "Valor excede o limite maximo de "
                    + DadosBoleto.LIMITE_MAXIMO.setScale(2).toString().replace(".", ","));
        } else {
            result.put("valido", true);
            result.put("mensagem", "Valor valido");
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/info-limite")
    public ResponseEntity<Map<String, Object>> getInfoLimite() {
        Map<String, Object> info = new HashMap<>();
        info.put("limiteMaximo", DadosBoleto.LIMITE_MAXIMO);
        info.put("limiteMaximoFormatado", "R$ "
                + DadosBoleto.LIMITE_MAXIMO.setScale(2).toString().replace(".", ","));
        return ResponseEntity.ok(info);
    }

    private String gerarLinhaDigitavel() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 48; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private String gerarCodigoBarras() {
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 44; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }
}
