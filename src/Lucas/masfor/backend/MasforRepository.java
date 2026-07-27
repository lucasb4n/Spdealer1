package br.com.spdealer.refatorado.repository;

import br.com.spdealer.refatorado.model.Masfor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * Repository para Tipo de Fornecedor (masfor)
 * Data: 17 de janeiro de 2026
 */
@Repository
public class MasforRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Mapeador de ResultSet para Masfor
     */
    private static class MasforRowMapper implements RowMapper<Masfor> {
        @Override
        public Masfor mapRow(ResultSet rs, int rowNum) throws SQLException {
            Masfor masfor = new Masfor();
            masfor.setTipo_for(rs.getString("tipo_for"));
            masfor.setDescr_for(rs.getString("descr_for"));
            return masfor;
        }
    }

    /**
     * Listar todos os tipos de fornecedor (filtrado por filial)
     */
    public List<Masfor> findByFilial(Integer idFil) {
        String sql = "SELECT tipo_for, descr_for FROM masfor WHERE id_fil = ? ORDER BY tipo_for";
        return jdbcTemplate.query(sql, new Object[]{idFil}, new MasforRowMapper());
    }

    /**
     * Buscar tipo de fornecedor específico por id e filial
     */
    public Masfor findByIdAndFilial(String tipoFor, Integer idFil) {
        String sql = "SELECT tipo_for, descr_for FROM masfor WHERE tipo_for = ? AND id_fil = ?";
        List<Masfor> result = jdbcTemplate.query(sql, new Object[]{tipoFor, idFil}, new MasforRowMapper());
        return result.isEmpty() ? null : result.get(0);
    }

    /**
     * Verificar se tipo_for já existe para a filial (validação de duplicidade)
     */
    public int countByTipoForAndFilial(String tipoFor, Integer idFil) {
        String sql = "SELECT COUNT(*) FROM masfor WHERE tipo_for = ? AND id_fil = ?";
        Integer count = jdbcTemplate.queryForObject(sql, new Object[]{tipoFor, idFil}, Integer.class);
        return count != null ? count : 0;
    }

    /**
     * Criar novo tipo de fornecedor
     */
    public void insert(String tipoFor, String descrFor, Integer idFil) {
        String sql = "INSERT INTO masfor (tipo_for, descr_for, id_fil) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, tipoFor, descrFor, idFil);
    }

    /**
     * Atualizar tipo de fornecedor
     */
    public void update(String tipoFor, String descrFor, Integer idFil) {
        String sql = "UPDATE masfor SET descr_for = ? WHERE tipo_for = ? AND id_fil = ?";
        jdbcTemplate.update(sql, descrFor, tipoFor, idFil);
    }

    /**
     * Deletar tipo de fornecedor
     */
    public void deleteByIdAndFilial(String tipoFor, Integer idFil) {
        String sql = "DELETE FROM masfor WHERE tipo_for = ? AND id_fil = ?";
        jdbcTemplate.update(sql, tipoFor, idFil);
    }
}
