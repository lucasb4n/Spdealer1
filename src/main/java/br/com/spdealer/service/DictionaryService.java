package br.com.spdealer.service;

import br.com.spdealer.dto.DictionaryColumn;
import br.com.spdealer.dto.DictionaryTable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * Service para acesso ao Dictionary System
 * 
 * Fornece metadados de tabelas e colunas para o FormBuilder
 * Usado em Reverse Engineering e geração dinâmica de formulários
 */
@Service
public class DictionaryService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // ========================================================================
    // DICTIONARY_TABLES - Catálogo de Tabelas
    // ========================================================================
    
    /**
     * Lista todas as tabelas do dictionary
     * FILTRO: Apenas tabelas com description preenchido
     */
    public List<DictionaryTable> getAllTables() {
        try {
            System.out.println("DEBUG: DictionaryService.getAllTables() chamado");
            String sql = "SELECT * FROM dictionary_tables " +
                         "WHERE description IS NOT NULL AND description != '' " +
                         "ORDER BY display_name";
            System.out.println("DEBUG: SQL = " + sql);
            List<DictionaryTable> result = jdbcTemplate.query(sql, new DictionaryTableRowMapper());
            System.out.println("DEBUG: Query executada com sucesso. Resultados: " + result.size());
            return result;
        } catch (Exception e) {
            System.err.println("ERRO em DictionaryService.getAllTables(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Busca tabela por nome
     */
    public DictionaryTable getTableByName(String tableName) {
        String sql = "SELECT * FROM dictionary_tables WHERE table_name = ?";
        List<DictionaryTable> results = jdbcTemplate.query(sql, new DictionaryTableRowMapper(), tableName);
        return results.isEmpty() ? null : results.get(0);
    }
    
    /**
     * Busca tabelas específicas do projeto
     */
    public List<DictionaryTable> getProjectSpecificTables() {
        String sql = "SELECT * FROM dictionary_tables WHERE is_project_specific = 1 ORDER BY display_name";
        return jdbcTemplate.query(sql, new DictionaryTableRowMapper());
    }
    
    // ========================================================================
    // DICTIONARY_COLUMNS - Metadados de Colunas
    // ========================================================================
    
    /**
     * Busca todas as colunas de uma tabela
     */
    public List<DictionaryColumn> getColumnsByTable(String tableName) {
        // 🔴 DEBUG CRÍTICO: Verificar qual banco está conectado
        try {
            java.sql.Connection conn = jdbcTemplate.getDataSource().getConnection();
            System.out.println("🔴 JDBC URL REAL: " + conn.getMetaData().getURL());
            System.out.println("🔴 DATABASE REAL: " + conn.getCatalog());
            conn.close();
        } catch (Exception e) {
            System.err.println("❌ Erro ao verificar conexão: " + e.getMessage());
        }
        
        String sql = "SELECT * FROM dictionary_columns WHERE table_name = ? ORDER BY aba, tabulation";
        System.out.println("🔍 DEBUG SQL: " + sql + " | tableName=" + tableName);
        List<DictionaryColumn> results = jdbcTemplate.query(sql, new DictionaryColumnRowMapper(), tableName);
        System.out.println("📊 DEBUG: Retornou " + results.size() + " colunas");
        return results;
    }
    
    /**
     * Busca colunas por contexto (form, search, grid)
     * 
     * @param tableName Nome da tabela
     * @param context 'form' (form_visible=1), 'search' (search_visible=1), 'grid' (todos)
     */
    public List<DictionaryColumn> getColumnsByContext(String tableName, String context) {
        String sql = "SELECT * FROM dictionary_columns WHERE table_name = ?";
        
        if ("form".equalsIgnoreCase(context)) {
            sql += " AND form_visible = 1";
        } else if ("search".equalsIgnoreCase(context)) {
            sql += " AND search_visible = 1";
        }
        
        sql += " ORDER BY aba, tabulation";
        
        return jdbcTemplate.query(sql, new DictionaryColumnRowMapper(), tableName);
    }
    
    /**
     * Busca colunas por aba/tab específica
     */
    public List<DictionaryColumn> getColumnsByTab(String tableName, String aba) {
        String sql = "SELECT * FROM dictionary_columns WHERE table_name = ? AND aba = ? ORDER BY tabulation";
        return jdbcTemplate.query(sql, new DictionaryColumnRowMapper(), tableName, aba);
    }
    
    /**
     * Busca colunas que são listas dinâmicas
     */
    public List<DictionaryColumn> getDynamicListColumns(String tableName) {
        String sql = "SELECT * FROM dictionary_columns WHERE table_name = ? AND is_lista = 1 ORDER BY aba, tabulation";
        return jdbcTemplate.query(sql, new DictionaryColumnRowMapper(), tableName);
    }
    
    /**
     * Busca colunas que são foreign keys
     */
    public List<DictionaryColumn> getForeignKeyColumns(String tableName) {
        String sql = "SELECT * FROM dictionary_columns WHERE table_name = ? AND is_foreign_key = 1 ORDER BY aba, tabulation";
        return jdbcTemplate.query(sql, new DictionaryColumnRowMapper(), tableName);
    }
    
    /**
     * Busca coluna específica por nome
     */
    public DictionaryColumn getColumn(String tableName, String columnName) {
        String sql = "SELECT * FROM dictionary_columns WHERE table_name = ? AND column_name = ?";
        List<DictionaryColumn> results = jdbcTemplate.query(sql, new DictionaryColumnRowMapper(), tableName, columnName);
        return results.isEmpty() ? null : results.get(0);
    }
    
    // ========================================================================
    // ROW MAPPERS
    // ========================================================================
    
    private static class DictionaryTableRowMapper implements RowMapper<DictionaryTable> {
        @Override
        public DictionaryTable mapRow(ResultSet rs, int rowNum) throws SQLException {
            DictionaryTable table = new DictionaryTable();
            table.setId(rs.getInt("id"));
            table.setTableName(rs.getString("table_name"));
            table.setDisplayName(rs.getString("display_name"));
            table.setIsProjectSpecific(rs.getBoolean("is_project_specific"));
            table.setDescription(rs.getString("description"));
            table.setCreatedAt(rs.getTimestamp("created_at"));
            table.setUpdatedAt(rs.getTimestamp("updated_at"));
            return table;
        }
    }
    
    private static class DictionaryColumnRowMapper implements RowMapper<DictionaryColumn> {
        @Override
        public DictionaryColumn mapRow(ResultSet rs, int rowNum) throws SQLException {
            DictionaryColumn column = new DictionaryColumn();
            
            // Identificação
            column.setId(rs.getInt("id"));
            column.setTableName(rs.getString("table_name"));
            column.setColumnName(rs.getString("column_name"));
            
            // Tipo de Dados (✅ FIX: Campos INT podem retornar Short no MariaDB)
            column.setDataType(rs.getString("data_type"));
            column.setCharacterMaximumLength(rs.getObject("character_maximum_length") != null ? ((Number) rs.getObject("character_maximum_length")).intValue() : null);
            column.setNumericPrecision(rs.getObject("numeric_precision") != null ? ((Number) rs.getObject("numeric_precision")).intValue() : null);
            column.setNumericScale(rs.getObject("numeric_scale") != null ? ((Number) rs.getObject("numeric_scale")).intValue() : null);
            
            // Layout e UI (✅ FIX: Campos INT podem retornar Short no MariaDB)
            column.setAba(rs.getString("aba"));
            column.setTabulation(rs.getObject("tabulation") != null ? ((Number) rs.getObject("tabulation")).intValue() : null);
            column.setWidth(rs.getObject("width") != null ? ((Number) rs.getObject("width")).intValue() : null);
            column.setWidthAggrid(rs.getObject("width_aggrid") != null ? ((Number) rs.getObject("width_aggrid")).intValue() : null);
            
            // Metadata e Constraints (✅ FIX: TINYINT(1) com espaços em branco)
            column.setIsNullable(getShortSafe(rs, "is_nullable") == 1);
            column.setIsPrimaryKey(getShortSafe(rs, "is_primary_key") == 1);
            column.setIsForeignKey(getShortSafe(rs, "is_foreign_key") == 1);
            
            // FormBuilder Específico
            column.setIsCheckbox(getShortSafe(rs, "is_checkbox") == 1);
            
            // DEBUG: is_lista
            short isListaValue = getShortSafe(rs, "is_lista");
            boolean isListaBool = (isListaValue == 1);
            if (isListaValue != 0) {
                System.out.println("🔍 DEBUG is_lista: " + rs.getString("column_name") + " → value=" + isListaValue + ", boolean=" + isListaBool);
            }
            column.setIsLista(isListaBool);
            column.setTable(rs.getString("table"));
            
            // DEBUG: Verificar se form_visible existe no ResultSet
            try {
                java.sql.ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();
                System.out.println("🔍 DEBUG ResultSet: Total de colunas=" + columnCount);
                
                boolean hasFormVisible = false;
                for (int i = 1; i <= columnCount; i++) {
                    String colName = metaData.getColumnName(i);
                    if ("form_visible".equalsIgnoreCase(colName)) {
                        hasFormVisible = true;
                        System.out.println("✅ Coluna 'form_visible' ENCONTRADA na posição " + i);
                        break;
                    }
                }
                
                if (!hasFormVisible) {
                    System.out.println("❌ Coluna 'form_visible' NÃO ENCONTRADA no ResultSet!");
                    System.out.println("📋 Colunas disponíveis:");
                    for (int i = 1; i <= columnCount; i++) {
                        System.out.println("  - " + metaData.getColumnName(i));
                    }
                }
            } catch (Exception e) {
                System.out.println("❌ Erro ao verificar metadata: " + e.getMessage());
            }
            
            // ✅ FIX: TINYINT(1) retorna Short, não Integer
            short formVisibleShort = rs.getShort("form_visible");
            boolean formVisibleBool = (formVisibleShort == 1);
            System.out.println("DEBUG [" + rs.getString("column_name") + "]: form_visible_short=" + formVisibleShort + ", bool=" + formVisibleBool);
            column.setFormVisible(formVisibleBool);
            
            column.setSearchVisible(getShortSafe(rs, "search_visible") == 1);
            
            // Display
            column.setAlias(rs.getString("alias"));
            column.setDefaultValue(rs.getString("default_value"));
            column.setDescription(rs.getString("description"));
            
            // Timestamps
            column.setCreatedAt(rs.getTimestamp("created_at"));
            column.setUpdatedAt(rs.getTimestamp("updated_at"));
            
            return column;
        }
        
        /**
         * Helper method para obter Short com segurança
         * Trata valores NULL, espaços em branco e strings vazias
         */
        private short getShortSafe(ResultSet rs, String columnName) throws SQLException {
            Object value = rs.getObject(columnName);
            
            // DEBUG is_lista
            if ("is_lista".equals(columnName)) {
                String colNameDebug = rs.getString("column_name");
                System.out.println("🔍 getShortSafe(is_lista) para " + colNameDebug + ": value=" + value + ", type=" + (value != null ? value.getClass().getName() : "null"));
            }
            
            if (value == null) {
                return 0;
            }
            
            // ✅ FIX CRÍTICO: MariaDB TINYINT(1) pode retornar Boolean!
            if (value instanceof Boolean) {
                return (Boolean) value ? (short) 1 : (short) 0;
            }
            
            if (value instanceof String) {
                String strValue = ((String) value).trim();
                if (strValue.isEmpty()) {
                    return 0;
                }
                try {
                    return Short.parseShort(strValue);
                } catch (NumberFormatException e) {
                    System.err.println("⚠️ Valor inválido para Short em " + columnName + ": '" + value + "' - usando 0");
                    return 0;
                }
            }
            if (value instanceof Number) {
                return ((Number) value).shortValue();
            }
            return 0;
        }
    }
}
