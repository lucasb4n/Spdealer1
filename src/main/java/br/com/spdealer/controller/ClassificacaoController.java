package br.com.spdealer.controller;

import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.spdealer.util.SessionHelper;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cadastro-estoque/classificacao")
public class ClassificacaoController {

    private static final Logger log = LoggerFactory.getLogger(ClassificacaoController.class);

    @Autowired
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @GetMapping("/ncm")
    public ResponseEntity<?> buscarNbm(@RequestParam(required = false) String search, HttpSession session) {
        try {
            Integer idFil = SessionHelper.getIdFilFromSession(session);

            StringBuilder sql = new StringBuilder();
            sql.append("SELECT TRIM(codigo_nbm) AS codigo_nbm, CONCAT(TRIM(codigo_nbm), ' - ', COALESCE(descr_nbm, '')) AS descr_nbm FROM masnbm WHERE filial_nbm = :filial\n");
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("filial", idFil);

            if (search != null && !search.isBlank()) {
                sql.append(" AND (LOWER(descr_nbm) LIKE :q OR codigo_nbm LIKE :q)\n");
                params.addValue("q", "%" + search.trim().toLowerCase() + "%");
            }

            sql.append("ORDER BY codigo_nbm ASC LIMIT 50");

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);
            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao buscar NBM: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tributacao")
    public ResponseEntity<?> buscarTributacao(@RequestParam(required = false) String search, HttpSession session) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT DISTINCT TRIM(codigo_trib) AS codigo_trib, descr_trib FROM mastrib WHERE 1=1\n");
            MapSqlParameterSource params = new MapSqlParameterSource();

            if (search != null && !search.isBlank()) {
                sql.append(" AND (LOWER(descr_trib) LIKE :q OR codigo_trib LIKE :q)\n");
                params.addValue("q", "%" + search.trim().toLowerCase() + "%");
            }

            sql.append("ORDER BY codigo_trib ASC LIMIT 50");

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);
            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao buscar tributacao: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/grupo")
    public ResponseEntity<?> buscarGrupo(@RequestParam(required = false) String search) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT codigo_gru, descr_gru FROM masgru WHERE 1=1\n");
            MapSqlParameterSource params = new MapSqlParameterSource();

            if (search != null && !search.isBlank()) {
                sql.append(" AND (LOWER(descr_gru) LIKE :q OR codigo_gru LIKE :q)\n");
                params.addValue("q", "%" + search.trim().toLowerCase() + "%");
            }

            sql.append("ORDER BY descr_gru ASC LIMIT 50");

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);
            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao buscar Grupo: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/modelos")
    public ResponseEntity<?> buscarModelos(@RequestParam(required = false) String search) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT codigo_mod, modelo_mod FROM modelos WHERE 1=1\n");
            MapSqlParameterSource params = new MapSqlParameterSource();

            if (search != null && !search.isBlank()) {
                sql.append(" AND (LOWER(modelo_mod) LIKE :q OR codigo_mod LIKE :q)\n");
                params.addValue("q", "%" + search.trim().toLowerCase() + "%");
            }

            sql.append("ORDER BY modelo_mod ASC LIMIT 50");

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);
            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao buscar Modelos: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/natureza")
    public ResponseEntity<?> buscarNatureza(@RequestParam(required = false) String search) {
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT codigo_nat, descricao_nat FROM masnat WHERE 1=1\n");
            MapSqlParameterSource params = new MapSqlParameterSource();

            if (search != null && !search.isBlank()) {
                sql.append(" AND (LOWER(descricao_nat) LIKE :q OR codigo_nat LIKE :q)\n");
                params.addValue("q", "%" + search.trim().toLowerCase() + "%");
            }

            sql.append("ORDER BY descricao_nat ASC LIMIT 50");

            List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(sql.toString(), params);
            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao buscar Natureza: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
