package br.com.spdealer.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DreService {

    private static final Logger logger = LoggerFactory.getLogger(DreService.class);

    private final JdbcTemplate jdbcTemplate;

    private final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Retorna dados da view `vw_dre_rows` no modo tabular (linha x mês)
     */
    public List<Map<String, Object>> getRows(LocalDate start, LocalDate end) {
        logger.info("[DreService] getRows start={} end={}", start, end);

        String sql = "SELECT fluxo_caixa_linha_id, codigo_linha, descricao, tipo_linha, ordem, ano_mes, valor_esperado, valor_real, registros " +
                "FROM vw_dre_rows WHERE ano_mes BETWEEN ? AND ? ORDER BY ordem, ano_mes";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, start, end);
        logger.info("[DreService] rows returned: {}", rows.size());
        return rows;
    }

    /**
     * Retorna dados pivotados por mês (colunas dinamicas) agregando soma de valor_real/valor_esperado
     * Retorna um Map com keys: columns (List of column meta) e rows (List of row maps)
     */
    public Map<String, Object> getPivot(LocalDate start, LocalDate end) {
        logger.info("[DreService] getPivot start={} end={}", start, end);

        // Generate list of first-of-month dates between start and end
        List<LocalDate> months = new ArrayList<>();
        LocalDate cursor = LocalDate.of(start.getYear(), start.getMonth(), 1);
        LocalDate last = LocalDate.of(end.getYear(), end.getMonth(), 1);
        while (!cursor.isAfter(last)) {
            months.add(cursor);
            cursor = cursor.plusMonths(1);
        }

        // Build select expressions
        StringBuilder sb = new StringBuilder();
        sb.append("SELECT l.codigo_linha, l.descricao");
        for (LocalDate m : months) {
            String col = m.format(DF).substring(0,7); // YYYY-MM
            sb.append(", SUM(CASE WHEN d.ano_mes = '" ).append(m.format(DF)).append("' THEN COALESCE(d.valor_real,0) ELSE 0 END) AS `")
              .append(col).append("_real`");
            sb.append(", SUM(CASE WHEN d.ano_mes = '" ).append(m.format(DF)).append("' THEN COALESCE(d.valor_esperado,0) ELSE 0 END) AS `")
              .append(col).append("_esperado`");
        }
        sb.append(", SUM(COALESCE(d.valor_real,0)) AS total_real, SUM(COALESCE(d.valor_esperado,0)) AS total_esperado");
        sb.append(" FROM fluxo_caixa_linhas l LEFT JOIN fluxo_caixa_dados d ON d.fluxo_caixa_linha_id = l.id ");
        sb.append(" WHERE (d.ano_mes BETWEEN '" ).append(start.format(DF)).append("' AND '")
          .append(end.format(DF)).append("') OR d.ano_mes IS NULL");
        sb.append(" GROUP BY l.codigo_linha, l.descricao ORDER BY l.ordem");

        String sql = sb.toString();
        logger.debug("[DreService] pivot SQL: {}", sql);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        // Build columns metadata
        List<Map<String,String>> columns = new ArrayList<>();
        columns.add(Map.of("field","codigo_linha","label","Código"));
        columns.add(Map.of("field","descricao","label","Descrição"));
        for (LocalDate m : months) {
            String col = m.format(DF).substring(0,7);
            columns.add(Map.of("field", col + "_real", "label", col + " Real"));
            columns.add(Map.of("field", col + "_esperado", "label", col + " Esperado"));
        }
        columns.add(Map.of("field","total_real","label","Total Real"));
        columns.add(Map.of("field","total_esperado","label","Total Esperado"));

        Map<String, Object> result = new HashMap<>();
        result.put("columns", columns);
        result.put("rows", rows);
        result.put("start", start.format(DF));
        result.put("end", end.format(DF));

        return result;
    }
}
