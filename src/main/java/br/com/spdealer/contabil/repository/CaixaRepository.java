package br.com.spdealer.contabil.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository("contabilCaixaRepository")
public class CaixaRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public CaixaRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> findMovementsByPeriodAndFilial(LocalDate from, LocalDate to, int filial) {
        String sql = "SELECT * FROM caixa WHERE filial_cai = :filial AND dtmovi_cai BETWEEN :from AND :to";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("filial", String.format("%03d", filial))
                .addValue("from", from)
                .addValue("to", to);
        return jdbc.queryForList(sql, params);
    }
}
