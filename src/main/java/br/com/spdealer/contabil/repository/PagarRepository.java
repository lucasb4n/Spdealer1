package br.com.spdealer.contabil.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public class PagarRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public PagarRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> findByPeriodAndFilial(LocalDate from, LocalDate to, int filial) {
        String sql = "SELECT * FROM pagar WHERE filial_pag = :filial AND dtvenc_pag BETWEEN :from AND :to AND (status_pag IS NULL OR status_pag = '')";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("filial", String.format("%03d", filial))
                .addValue("from", from)
                .addValue("to", to);
        return jdbc.queryForList(sql, params);
    }
}
