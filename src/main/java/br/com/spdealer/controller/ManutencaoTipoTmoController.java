package br.com.spdealer.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/servico/manutencao/tipo-tmo")
public class ManutencaoTipoTmoController {

    @Autowired
    private JdbcTemplate jdbc;

    private static final Logger logger = LoggerFactory.getLogger(ManutencaoTipoTmoController.class);

    @GetMapping("/lookup")
    public ResponseEntity<Map<String, Object>> lookup(
            @RequestParam(required = false) String term,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            StringBuilder whereClause = new StringBuilder("WHERE 1=1");
            List<Object> params = new ArrayList<>();

            if (term != null && !term.isEmpty()) {
                whereClause.append(" AND (LOWER(codmo_tmo) LIKE ? OR LOWER(descr_tmo) LIKE ?)");
                String pattern = "%" + term.toLowerCase() + "%";
                params.add(pattern);
                params.add(pattern);
            }

            String countSql = "SELECT COUNT(*) FROM tmo " + whereClause;
            int total = jdbc.queryForObject(countSql, Integer.class, params.toArray());

            String sql = "SELECT * FROM tmo " + whereClause + " ORDER BY descr_tmo LIMIT ? OFFSET ?";
            params.add(size);
            params.add(page * size);

            List<Map<String, Object>> data = jdbc.queryForList(sql, params.toArray());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", data,
                "pagination", Map.of(
                    "total", total,
                    "page", page,
                    "size", size,
                    "totalPages", (int) Math.ceil((double) total / size)
                )
            ));
        } catch (Exception e) {
            logger.error("Erro no lookup de TMO", e);
            return ResponseEntity.status(500).body(Map.of("success", false, "error", "Erro ao buscar TMO"));
        }
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        String sql = "SELECT * FROM tmo";
        try {
            return jdbc.queryForList(sql);
        } catch (Exception ex) {
            logger.error("[ManutencaoTipoTmoController] Erro ao executar query list. SQL: {}", sql, ex);
            throw ex;
        }
    }

    @GetMapping("/{codmo}")
    public Map<String, Object> getById(@PathVariable String codmo, HttpSession session) {
        String sql = "SELECT * FROM tmo WHERE codmo_tmo = ?";
        List<Map<String, Object>> rows = jdbc.queryForList(sql, new Object[] { codmo });
        return rows.isEmpty() ? null : rows.get(0);
    }

    @DeleteMapping("/{codmo}")
    public ResponseEntity<?> delete(@PathVariable String codmo) {
        int updated = jdbc.update("DELETE FROM tmo WHERE codmo_tmo = ?", codmo);
        if (updated > 0) return ResponseEntity.noContent().build();
        return ResponseEntity.notFound().build();
    }

    // Endpoints de create/update mínimo (opcional)
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, HttpSession session) {
        // Insere os campos principais e os adicionais usados pelo frontend
        String sql = "INSERT INTO tmo (modelo_tmo, codmo_tmo, descr_tmo, tempo_tmo, prcpub_tmo, prcgar_tmo, codcat_tmo, codtrib_trib, tipo_tmo, acredesc_tmo, ativo_tmo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        Object modelo = body.getOrDefault("modelo_tmo", null);
        Object codmo = body.getOrDefault("codmo_tmo", null);
        Object descr = body.getOrDefault("descr_tmo", null);
        BigDecimal tempo = toBigDecimal(body.getOrDefault("tempo_tmo", body.getOrDefault("unidadeTempo", null)));
        // campo de preço público
        BigDecimal preco = toBigDecimal(body.getOrDefault("prcpub_tmo", body.getOrDefault("precoPublico", null)));
        BigDecimal prcgar = toBigDecimal(body.getOrDefault("prcgar_tmo", body.getOrDefault("preco_garantido", body.getOrDefault("precoGarantado", null))));
        Object codcat = body.getOrDefault("codcat_tmo", body.getOrDefault("codigo_categoria", body.getOrDefault("codigoCategoria", null)));
        Object codtrib = body.getOrDefault("codtrib_trib", body.getOrDefault("codigo_tributacao", body.getOrDefault("codigoTributacao", null)));
        Object tipo = body.getOrDefault("tipo_tmo", body.getOrDefault("tipoTmo", body.getOrDefault("tipo", null)));
        Object acresc = body.getOrDefault("acredesc_tmo", body.getOrDefault("acrescimo_desconto", body.getOrDefault("acrecimoDesconto", null)));
        Object activo = body.getOrDefault("ativo_tmo", body.getOrDefault("ativo", null));

        
        // Validação de duplicata: considerar duplicata somente quando TODOS os campos relevantes coincidirem
        try {
            int exists = countIdentical(modelo, codmo, descr, tempo, preco, prcgar, codcat, codtrib, tipo, acresc, activo, null, null);
            if (exists > 0) {
                Map<String, Object> match = findIdenticalRecord(modelo, codmo, descr, tempo, preco, prcgar, codcat, codtrib, tipo, acresc, activo, null, null);
                return ResponseEntity.status(409).body(Map.of("error", "Registro duplicado: já existe um registro com os mesmos campos", "match", match));
            }
        } catch (Exception e) {
            logger.warn("Falha ao checar duplicata composta, prosseguindo insert: {}", e.getMessage());
        }

        jdbc.update(sql, modelo, codmo, descr, tempo, preco, prcgar, codcat, codtrib, tipo, acresc, activo);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{codmo}")
    public ResponseEntity<?> update(@PathVariable String codmo, @RequestBody Map<String, Object> body) {
        logger.debug("[ManutencaoTipoTmoController] update called for codmo={} payload={}", codmo, body);
        // O frontend DEVE enviar o par original da PK para evitar ambiguidade: originalModelo (modelo_tmo atual)
        Object originalModeloObj = body.getOrDefault("originalModelo", body.getOrDefault("original_modelo_tmo", null));
        String originalModelo = originalModeloObj == null ? null : String.valueOf(originalModeloObj);
        if (originalModelo == null || originalModelo.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "originalModelo (modelo_tmo atual) é obrigatório no body para update da chave composta"));
        }

        String sql = "UPDATE tmo SET modelo_tmo = ?, codmo_tmo = ?, descr_tmo = ?, tempo_tmo = ?, prcpub_tmo = ?, prcgar_tmo = ?, codcat_tmo = ?, codtrib_trib = ?, tipo_tmo = ?, acredesc_tmo = ?, ativo_tmo = ? WHERE modelo_tmo = ? AND codmo_tmo = ?";
        Object modelo = body.getOrDefault("modelo_tmo", null);
        Object novoCodmo = body.getOrDefault("codmo_tmo", null);
        Object descr = body.getOrDefault("descr_tmo", null);
        BigDecimal tempo = toBigDecimal(body.getOrDefault("tempo_tmo", body.getOrDefault("unidadeTempo", null)));
        // campo de preço público
        BigDecimal preco = toBigDecimal(body.getOrDefault("prcpub_tmo", body.getOrDefault("precoPublico", null)));
        BigDecimal prcgar = toBigDecimal(body.getOrDefault("prcgar_tmo", body.getOrDefault("preco_garantido", body.getOrDefault("precoGarantado", null))));
        Object codcat = body.getOrDefault("codcat_tmo", body.getOrDefault("codigo_categoria", body.getOrDefault("codigoCategoria", null)));
        Object codtrib = body.getOrDefault("codtrib_trib", body.getOrDefault("codigo_tributacao", body.getOrDefault("codigoTributacao", null)));
        Object tipo = body.getOrDefault("tipo_tmo", body.getOrDefault("tipoTmo", body.getOrDefault("tipo", null)));
        Object acresc = body.getOrDefault("acredesc_tmo", body.getOrDefault("acrescimo_desconto", body.getOrDefault("acrecimoDesconto", null)));
        Object activo = body.getOrDefault("ativo_tmo", body.getOrDefault("ativo", null));

        // Validação composta: recusar update se EXISTIR OUTRO registro com TODOS os mesmos campos
        try {
            int exists = countIdentical(modelo, novoCodmo, descr, tempo, preco, prcgar, codcat, codtrib, tipo, acresc, activo, codmo, originalModelo);
            if (exists > 0) {
                Map<String, Object> match = findIdenticalRecord(modelo, novoCodmo, descr, tempo, preco, prcgar, codcat, codtrib, tipo, acresc, activo, codmo, originalModelo);
                return ResponseEntity.status(409).body(Map.of("error", "Registro duplicado: já existe outro registro com os mesmos campos", "match", match));
            }
        } catch (Exception e) {
            logger.warn("Falha ao checar duplicata composta antes do update, prosseguindo: {}", e.getMessage());
        }

        // Validação de comprimento para codcat_tmo (coluna atual VARCHAR(2))
        try {
            if (codcat != null) {
                String codcatStr = String.valueOf(codcat).trim();
                if (!codcatStr.isEmpty() && codcatStr.length() > 2) {
                    logger.warn("Valor de codcat_tmo excede tamanho permitido: {} (len={})", codcatStr, codcatStr.length());
                    return ResponseEntity.badRequest().body(Map.of("error", "codcat_tmo excede comprimento permitido", "field", "codcat_tmo", "maxLength", 2));
                }
            }
        } catch (Exception e) {
            // não bloquear update por falha menor na validação de logging
        }

        try {
            int updated = jdbc.update(sql, modelo, novoCodmo, descr, tempo, preco, prcgar, codcat, codtrib, tipo, acresc, activo, originalModelo, codmo);
            logger.info("[ManutencaoTipoTmoController] update executed codmo={} updatedRows={}", codmo, updated);
            if (updated > 0) return ResponseEntity.ok().build();
            return ResponseEntity.notFound().build();
        } catch (DuplicateKeyException dke) {
            logger.warn("DuplicateKeyException em update tmo: {}", dke.getMessage());
            // tentar recuperar o registro conflitante para dar diagnóstico mais claro ao frontend
            try {
                List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM tmo WHERE modelo_tmo = ? AND codmo_tmo = ?", new Object[] { modelo, novoCodmo });
                Map<String, Object> conflict = rows.isEmpty() ? Map.of() : rows.get(0);
                return ResponseEntity.status(409).body(Map.of("error", "Código já existe", "details", dke.getMessage(), "conflict", conflict));
            } catch (Exception ex) {
                logger.warn("Falha ao recuperar registro conflitante: {}", ex.getMessage());
                return ResponseEntity.status(409).body(Map.of("error", "Código já existe", "details", dke.getMessage()));
            }
        }
    }

    private int countIdentical(Object modelo, Object codmo, Object descr, BigDecimal tempo, BigDecimal preco, BigDecimal prcgar,
                               Object codcat, Object codtrib, Object tipo, Object acresc, Object activo, String excludeCodmo, String excludeModelo) {
        StringBuilder sb = new StringBuilder();
        sb.append("SELECT COUNT(1) FROM tmo WHERE 1=1");
        List<Object> params = new ArrayList<>();

        // helper to add condition for a column: ((? IS NULL AND col IS NULL) OR (col = ?))
        java.util.function.BiConsumer<String, Object> addCond = (col, val) -> {
            sb.append(" AND ((? IS NULL AND ").append(col).append(" IS NULL) OR (").append(col).append(" = ?))");
            params.add(val);
            params.add(val);
        };

        addCond.accept("modelo_tmo", modelo);
        addCond.accept("codmo_tmo", codmo);
        addCond.accept("descr_tmo", descr);
        addCond.accept("tempo_tmo", tempo);
        addCond.accept("prcpub_tmo", preco);
        addCond.accept("prcgar_tmo", prcgar);
        addCond.accept("codcat_tmo", codcat);
        addCond.accept("codtrib_trib", codtrib);
        addCond.accept("tipo_tmo", tipo);
        addCond.accept("acredesc_tmo", acresc);
        addCond.accept("ativo_tmo", activo);

        if (excludeCodmo != null && excludeModelo != null) {
            sb.append(" AND NOT (codmo_tmo = ? AND modelo_tmo = ?)");
            params.add(excludeCodmo);
            params.add(excludeModelo);
        } else if (excludeCodmo != null) {
            sb.append(" AND NOT (codmo_tmo = ?)");
            params.add(excludeCodmo);
        }

        return jdbc.queryForObject(sb.toString(), Integer.class, params.toArray());
    }

    private Map<String, Object> findIdenticalRecord(Object modelo, Object codmo, Object descr, BigDecimal tempo, BigDecimal preco, BigDecimal prcgar,
                                                    Object codcat, Object codtrib, Object tipo, Object acresc, Object activo, String excludeCodmo, String excludeModelo) {
        StringBuilder sb = new StringBuilder();
        sb.append("SELECT * FROM tmo WHERE 1=1");
        List<Object> params = new ArrayList<>();

        java.util.function.BiConsumer<String, Object> addCond = (col, val) -> {
            sb.append(" AND ((? IS NULL AND ").append(col).append(" IS NULL) OR (").append(col).append(" = ?))");
            params.add(val);
            params.add(val);
        };

        addCond.accept("modelo_tmo", modelo);
        addCond.accept("codmo_tmo", codmo);
        addCond.accept("descr_tmo", descr);
        addCond.accept("tempo_tmo", tempo);
        addCond.accept("prcpub_tmo", preco);
        addCond.accept("prcgar_tmo", prcgar);
        addCond.accept("codcat_tmo", codcat);
        addCond.accept("codtrib_trib", codtrib);
        addCond.accept("tipo_tmo", tipo);
        addCond.accept("acredesc_tmo", acresc);
        addCond.accept("ativo_tmo", activo);

        if (excludeCodmo != null && excludeModelo != null) {
            sb.append(" AND NOT (codmo_tmo = ? AND modelo_tmo = ?)");
            params.add(excludeCodmo);
            params.add(excludeModelo);
        } else if (excludeCodmo != null) {
            sb.append(" AND NOT (codmo_tmo = ?)");
            params.add(excludeCodmo);
        }

        List<Map<String, Object>> rows = jdbc.queryForList(sb.toString(), params.toArray());
        return rows.isEmpty() ? Map.of() : rows.get(0);
    }

    private BigDecimal toBigDecimal(Object o) {
        if (o == null) return null;
        if (o instanceof BigDecimal) return (BigDecimal) o;
        try {
            String s = String.valueOf(o).trim();
            if (s.isEmpty()) return null;
            s = s.replace(',', '.');
            return new BigDecimal(s);
        } catch (Exception e) {
            return null;
        }
    }
}
