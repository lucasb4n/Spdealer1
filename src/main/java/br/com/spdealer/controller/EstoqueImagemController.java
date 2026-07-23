package br.com.spdealer.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/estoque/imagens")
public class EstoqueImagemController {

    private static final Logger log = LoggerFactory.getLogger(EstoqueImagemController.class);

    @Autowired
    private NamedParameterJdbcTemplate jdbc;

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam String fab_est,
            @RequestParam String codprod_est) {
        try {
            String sql = "SELECT id, fab_est, codprod_est, nome_arquivo, data_inclusao FROM est_imagem WHERE fab_est = :fab_est AND codprod_est = :codprod_est ORDER BY data_inclusao DESC";
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("fab_est", fab_est);
            params.addValue("codprod_est", codprod_est);
            List<Map<String, Object>> rows = jdbc.queryForList(sql, params);
            return ResponseEntity.ok(rows != null ? rows : List.of());
        } catch (Exception e) {
            log.error("Erro ao listar imagens: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam MultipartFile file,
            @RequestParam String fab_est,
            @RequestParam String codprod_est) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Arquivo vazio"));
            }
            String nomeArquivo = file.getOriginalFilename();
            if (nomeArquivo == null || nomeArquivo.isBlank()) {
                nomeArquivo = "imagem_" + System.currentTimeMillis();
            }
            byte[] imagemBytes = file.getBytes();

            String sql = "INSERT INTO est_imagem (fab_est, codprod_est, imagem, nome_arquivo) VALUES (:fab_est, :codprod_est, :imagem, :nome_arquivo)";
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("fab_est", fab_est);
            params.addValue("codprod_est", codprod_est);
            params.addValue("imagem", imagemBytes);
            params.addValue("nome_arquivo", nomeArquivo);
            jdbc.update(sql, params);

            String idSql = "SELECT LAST_INSERT_ID()";
            Integer id = jdbc.queryForObject(idSql, new MapSqlParameterSource(), Integer.class);

            Map<String, Object> result = new HashMap<>();
            result.put("id", id);
            result.put("fab_est", fab_est);
            result.put("codprod_est", codprod_est);
            result.put("nome_arquivo", nomeArquivo);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erro ao fazer upload: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable Integer id) {
        try {
            String sql = "SELECT imagem, nome_arquivo FROM est_imagem WHERE id = :id";
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("id", id);
            Map<String, Object> row = jdbc.queryForMap(sql, params);

            byte[] imagem = (byte[]) row.get("imagem");
            String nomeArquivo = (String) row.get("nome_arquivo");

            if (imagem == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Imagem não encontrada"));
            }

            MediaType mediaType = MediaType.IMAGE_JPEG;
            if (nomeArquivo != null) {
                String lower = nomeArquivo.toLowerCase();
                if (lower.endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
                else if (lower.endsWith(".gif")) mediaType = MediaType.IMAGE_GIF;
                else if (lower.endsWith(".webp")) mediaType = MediaType.valueOf("image/webp");
                else if (lower.endsWith(".bmp")) mediaType = MediaType.valueOf("image/bmp");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            headers.setContentLength(imagem.length);
            headers.setCacheControl("private, max-age=3600");

            return new ResponseEntity<>(imagem, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Erro ao baixar imagem: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/produto/{fab}/{codprod}")
    public ResponseEntity<?> downloadProdutoImagem(
            @PathVariable String fab,
            @PathVariable String codprod) {
        try {
            String sql = "SELECT id FROM est_imagem WHERE fab_est = :fab_est AND codprod_est = :codprod_est ORDER BY data_inclusao DESC LIMIT 1";
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("fab_est", fab.trim());
            params.addValue("codprod_est", codprod.trim());

            List<Integer> ids = jdbc.query(sql, params, (rs, rowNum) -> rs.getInt("id"));
            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Imagem nao encontrada"));
            }

            Integer imagemId = ids.get(0);
            String downloadSql = "SELECT imagem, nome_arquivo FROM est_imagem WHERE id = :id";
            MapSqlParameterSource downloadParams = new MapSqlParameterSource();
            downloadParams.addValue("id", imagemId);
            Map<String, Object> row = jdbc.queryForMap(downloadSql, downloadParams);

            byte[] imagem = (byte[]) row.get("imagem");
            String nomeArquivo = (String) row.get("nome_arquivo");

            if (imagem == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Imagem nao encontrada"));
            }

            MediaType mediaType = MediaType.IMAGE_JPEG;
            if (nomeArquivo != null) {
                String lower = nomeArquivo.toLowerCase();
                if (lower.endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
                else if (lower.endsWith(".gif")) mediaType = MediaType.IMAGE_GIF;
                else if (lower.endsWith(".webp")) mediaType = MediaType.valueOf("image/webp");
                else if (lower.endsWith(".bmp")) mediaType = MediaType.valueOf("image/bmp");
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            headers.setContentLength(imagem.length);
            headers.setCacheControl("private, max-age=3600");

            return new ResponseEntity<>(imagem, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Erro ao baixar imagem do produto: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Integer id) {
        try {
            String sql = "DELETE FROM est_imagem WHERE id = :id";
            MapSqlParameterSource params = new MapSqlParameterSource();
            params.addValue("id", id);
            int affected = jdbc.update(sql, params);
            if (affected > 0) {
                return ResponseEntity.ok(Map.of("success", true));
            }
            return ResponseEntity.status(404).body(Map.of("error", "Imagem não encontrada"));
        } catch (Exception e) {
            log.error("Erro ao excluir imagem: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
