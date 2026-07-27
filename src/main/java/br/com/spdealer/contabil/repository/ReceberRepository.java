package br.com.spdealer.contabil.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public class ReceberRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public ReceberRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Busca registros na tabela `receber` filtrando por filial e periodo.
     * Retorna uma lista de maps (schema-agnóstico) para permitir adaptação rápida.
     */
    public List<Map<String, Object>> findByPeriodAndFilial(LocalDate from, LocalDate to, int filial) {
        String sql = "SELECT * FROM receber WHERE filial_rec = :filial AND dtvenci_rec BETWEEN :from AND :to AND (status_rec IS NULL OR status_rec = '')";
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("filial", String.format("%03d", filial))
                .addValue("from", from)
                .addValue("to", to);
        return jdbc.queryForList(sql, params);
    }
}
