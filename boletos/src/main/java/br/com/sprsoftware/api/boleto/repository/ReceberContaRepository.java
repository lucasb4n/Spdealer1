package br.com.sprsoftware.api.boleto.repository;

import br.com.sprsoftware.api.boleto.model.ContaReceberDado;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ReceberContaRepository {

    @Autowired
    private JdbcTemplate jdbc;

    private static final String SELECT_BASE = ""
            + "SELECT "
            + "  r.receber_id, r.filial_rec, r.codigo_rec, r.numdup_rec, r.parcela_rec, "
            + "  r.tipodoc_rec, r.tpcob_rec, r.cgccpf_rec, "
            + "  r.dtmovi_rec, r.dtemissi_rec, r.dtvenci_rec, r.dtpagi_rec, "
            + "  r.banco_rec, r.codigo_bol, r.nossonumero_rec, "
            + "  r.vlrdup_rec, r.vlrsal_rec, r.status_rec, "
            + "  c.nome_cli AS NOME_PAGADOR, "
            + "  CONCAT_WS(' ', "
            + "    NULLIF(TRIM(c.logra_cli), ''), "
            + "    NULLIF(TRIM(c.numero_cli), ''), "
            + "    NULLIF(TRIM(c.bairro_cli), ''), "
            + "    NULLIF(TRIM(c.cidade_cli), ''), "
            + "    NULLIF(TRIM(c.uf_cli), '')) AS ENDERECO_PAGADOR, "
            + "  c.bairro_cli AS BAIRRO_PAGADOR, "
            + "  c.cidade_cli AS CIDADE_PAGADOR, "
            + "  c.uf_cli AS UF_PAGADOR, "
            + "  c.cep_cli AS CEP_PAGADOR, "
            + "  c.fone1_cli AS TELEFONE_PAGADOR, "
            + "  c.celular_cli AS CELULAR_PAGADOR "
            + "FROM receber r "
            + "LEFT JOIN clientes c ON (c.codigo_cli = r.codigo_rec OR c.cgccpf_cli = r.cgccpf_rec) AND c.cliforn_cli = 'C' ";

    private static final RowMapper<ContaReceberDado> MAPPER = (ResultSet rs, int rowNum) ->
            new ContaReceberDado(
                    rs.getLong("receber_id"),
                    rs.getString("filial_rec"),
                    rs.getObject("codigo_rec") != null ? rs.getInt("codigo_rec") : null,
                    rs.getString("numdup_rec"),
                    rs.getString("parcela_rec"),
                    rs.getString("tipodoc_rec"),
                    rs.getString("tpcob_rec"),
                    rs.getObject("cgccpf_rec") != null ? rs.getString("cgccpf_rec") : null,
                    toLocalDate(rs, "dtmovi_rec"),
                    toLocalDate(rs, "dtemissi_rec"),
                    toLocalDate(rs, "dtvenci_rec"),
                    toLocalDate(rs, "dtpagi_rec"),
                    rs.getString("banco_rec"),
                    rs.getString("codigo_bol"),
                    rs.getString("nossonumero_rec"),
                    toBigDecimal(rs, "vlrdup_rec"),
                    toBigDecimal(rs, "vlrsal_rec"),
                    rs.getString("status_rec"),
                    rs.getString("NOME_PAGADOR"),
                    rs.getString("ENDERECO_PAGADOR"),
                    rs.getString("BAIRRO_PAGADOR"),
                    rs.getString("CIDADE_PAGADOR"),
                    rs.getString("UF_PAGADOR"),
                    rs.getString("CEP_PAGADOR"),
                    rs.getString("TELEFONE_PAGADOR"),
                    rs.getString("CELULAR_PAGADOR"));

    public Optional<ContaReceberDado> buscarPorId(Long receberId) {
        List<ContaReceberDado> rows = jdbc.query(SELECT_BASE + " WHERE r.receber_id = ?", MAPPER, receberId);
        return rows.stream().findFirst();
    }

    public List<ContaReceberDado> listar(String banco, LocalDate inicio, LocalDate fim, int page, int size) {
        StringBuilder sql = new StringBuilder(SELECT_BASE).append(" WHERE 1=1 ");
        List<Object> params = new ArrayList<>();
        if (banco != null && !banco.trim().isEmpty()) {
            sql.append(" AND r.banco_rec = ? ");
            params.add(banco.trim());
        }
        if (inicio != null) {
            sql.append(" AND r.dtvenci_rec >= ? ");
            params.add(inicio);
        }
        if (fim != null) {
            sql.append(" AND r.dtvenci_rec <= ? ");
            params.add(fim);
        }
        sql.append(" ORDER BY r.dtvenci_rec ASC, r.receber_id ASC ");
        if (size > 0) {
            sql.append(" LIMIT ? OFFSET ? ");
            params.add(size);
            params.add(page > 0 ? (long) page * size : 0L);
        }
        return jdbc.query(sql.toString(), MAPPER, params.toArray());
    }

    public long contar(String banco, LocalDate inicio, LocalDate fim) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM receber r WHERE 1=1 ");
        List<Object> params = new ArrayList<>();
        if (banco != null && !banco.trim().isEmpty()) {
            sql.append(" AND r.banco_rec = ? ");
            params.add(banco.trim());
        }
        if (inicio != null) {
            sql.append(" AND r.dtvenci_rec >= ? ");
            params.add(inicio);
        }
        if (fim != null) {
            sql.append(" AND r.dtvenci_rec <= ? ");
            params.add(fim);
        }
        Long count = jdbc.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    public long contarAbertas() {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM receber r WHERE COALESCE(r.vlrsal_rec, 0) > 0 "
                        + "AND (r.status_rec IS NULL OR TRIM(r.status_rec) = '' OR TRIM(r.status_rec) = 'A')",
                Long.class);
        return count != null ? count : 0L;
    }

    public long contarComBoleto() {
        Long count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM receber r WHERE r.codigo_bol IS NOT NULL AND TRIM(r.codigo_bol) <> ''",
                Long.class);
        return count != null ? count : 0L;
    }

    public BigDecimal somarSaldoAberto() {
        BigDecimal sum = jdbc.queryForObject(
                "SELECT COALESCE(SUM(r.vlrsal_rec), 0) FROM receber r WHERE COALESCE(r.vlrsal_rec, 0) > 0 "
                        + "AND (r.status_rec IS NULL OR TRIM(r.status_rec) = '' OR TRIM(r.status_rec) = 'A')",
                BigDecimal.class);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public int atualizarCodigoBol(Long receberId, Long boletoId) {
        return jdbc.update("UPDATE receber SET codigo_bol = ? WHERE receber_id = ?",
                String.valueOf(boletoId), receberId);
    }

    public int atualizarNossoNumero(Long receberId, String nossoNumero) {
        if (nossoNumero == null) {
            return 0;
        }
        return jdbc.update("UPDATE receber SET nossonumero_rec = ? WHERE receber_id = ?",
                nossoNumero, receberId);
    }

    private static LocalDate toLocalDate(ResultSet rs, String column) {
        try {
            Object value = rs.getObject(column);
            return toLocalDate(value);
        } catch (Exception e) {
            return null;
        }
    }

    private static LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate) {
            return (LocalDate) value;
        }
        if (value instanceof java.sql.Date) {
            return ((java.sql.Date) value).toLocalDate();
        }
        if (value instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) value).toLocalDateTime().toLocalDate();
        }
        if (value instanceof java.util.Date) {
            return ((java.util.Date) value).toInstant()
                    .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        }
        if (value instanceof Number) {
            int v = ((Number) value).intValue();
            if (v < 10000000) {
                return null;
            }
            int dia = v / 1000000;
            int mes = (v / 10000) % 100;
            int ano = v % 10000;
            if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
                return null;
            }
            return LocalDate.of(ano, mes, dia);
        }
        String s = String.valueOf(value).trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(s.substring(0, 10));
        } catch (Exception e) {
            try {
                return LocalDate.parse(s);
            } catch (Exception e2) {
                return null;
            }
        }
    }

    private static BigDecimal toBigDecimal(ResultSet rs, String column) {
        try {
            BigDecimal value = rs.getBigDecimal(column);
            return value != null ? value : BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
