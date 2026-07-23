package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
public class ClienteLastMovementController {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final Logger logger = LoggerFactory.getLogger(ClienteLastMovementController.class);

    @GetMapping("/{id}/last-movement")
    public Map<String, Object> getLastMovement(@PathVariable("id") Long codigoCliente) {
        try {
            logger.debug("[LastMovement] called for codigoCliente={}", codigoCliente);
            String sql = "SELECT MAX(dtmovi_rec) AS lastMovement FROM receber WHERE codigo_rec = ? AND (status_rec IS NULL OR status_rec = '')";
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, codigoCliente);
            Object last = result.get("lastMovement");
            java.util.Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("lastMovement", last);
            logger.debug("[LastMovement] result for {}: {}", codigoCliente, resp);
            return resp;
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            return java.util.Map.of("lastMovement", null);
        } catch (Exception e) {
            logger.error("[LastMovement] Erro ao buscar ultima movimentacao: {}", e.getMessage(), e);
            return java.util.Map.of("lastMovement", null);
        }
    }
}
