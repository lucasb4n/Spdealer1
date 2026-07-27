package br.com.spdealer.controller;

import br.com.spdealer.service.RtcCalculadoraProxyService;
import br.com.spdealer.util.SessionHelper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rtc")
public class RtcController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RtcCalculadoraProxyService rtcCalculadoraProxyService;

    /**
     * Lookup NCM via mapeamento interno:
     * estoque.codfis_est == masnbm.codigo_nbm
     * masnbm.filial_nbm == SessionHelper.getIdFilFromSession(session)
     */
    @GetMapping("/ncm")
    public ResponseEntity<?> getNcmByCodfis(
            @RequestParam(name = "codfis", required = false) String codfis,
            HttpSession session
    ) {
        try {
            if (codfis == null || codfis.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Parametro codfis eh obrigatorio"));
            }

            Integer idFil = SessionHelper.getIdFilFromSession(session);

            String sql = "SELECT codigo_nbm AS codigo, descr_nbm AS descricao FROM masnbm WHERE filial_nbm = ? AND codigo_nbm = ? LIMIT 1";
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, idFil, codfis.trim());
            if (rows.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "error", "NCM nao encontrado",
                        "codfis", codfis.trim(),
                        "filial", idFil
                ));
            }

            return ResponseEntity.ok(rows.get(0));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao consultar NCM", "message", e.getMessage()));
        }
    }

    /**
     * Proxy para a Calculadora RTC: POST /api/calculadora/regime-geral
     * - Evita CORS
     * - Centraliza config (rtc.calculadora.base-url)
     */
    @PostMapping("/calculadora/regime-geral")
    public ResponseEntity<?> calcularRegimeGeral(@RequestBody JsonNode body) {
        try {
            JsonNode resp = rtcCalculadoraProxyService.calcularRegimeGeral(body);
            return ResponseEntity.ok(resp);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("error", "Falha ao chamar calculadora RTC", "message", e.getMessage()));
        }
    }
}
