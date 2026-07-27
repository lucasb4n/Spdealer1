package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * DictionaryConfigService
 * 
 * Serviço para carregar configurações dinâmicas de tabelas a partir de
 * dictionary_tables e dictionary_columns.
 * 
 * Este serviço substitui a configuração hardcoded anterior, permitindo que
 * o FormBuilder seja 100% dictionary-driven.
 */
@Service
public class DictionaryConfigService {
    
    private static final Logger logger = LoggerFactory.getLogger(DictionaryConfigService.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * Classe interna para representar configuração de coluna
     */
    public static class ColumnConfig {
        public String columnName;
        public String dataType;
        public boolean isPrimaryKey;
        public boolean formVisible;
        public boolean searchVisible;
        public String alias;
        public Integer maxLength;
        public Integer numericPrecision;
        public Integer numericScale;
        
        public ColumnConfig(String columnName, String dataType, boolean isPrimaryKey,
                           boolean formVisible, boolean searchVisible, String alias,
                           Integer maxLength, Integer numericPrecision, Integer numericScale) {
            this.columnName = columnName;
            this.dataType = dataType;
            this.isPrimaryKey = isPrimaryKey;
            this.formVisible = formVisible;
            this.searchVisible = searchVisible;
            this.alias = alias != null ? alias : columnName;
            this.maxLength = maxLength;
            this.numericPrecision = numericPrecision;
            this.numericScale = numericScale;
        }
    }
    
    /**
     * Classe interna para representar configuração de tabela
     */
    public static class TableConfig {
        public String tableName;
        public String displayName;
        public List<ColumnConfig> columns;
        public List<String> allowedFields;
        public List<String> searchFields;
        public String primaryKeyColumn;
        public List<String> primaryKeyColumns;
        
        public TableConfig(String tableName, String displayName) {
            this.tableName = tableName;
            this.displayName = displayName;
            this.columns = new ArrayList<>();
            this.allowedFields = new ArrayList<>();
            this.searchFields = new ArrayList<>();
            this.primaryKeyColumn = "id";
            this.primaryKeyColumns = new ArrayList<>();
        }
    }
    
    /**
     * Carregar configuração completa de uma tabela a partir do dictionary
     * 
     * @param tableName Nome da tabela (ex: masfab, clientes)
     * @return TableConfig com todas as colunas e configurações
     */
    public TableConfig getTableConfig(String tableName) {
        try {
            logger.info("🔍 [DictionaryConfigService.getTableConfig] INICIANDO - tabela: {}", tableName);
            
            if (tableName == null || tableName.trim().isEmpty()) {
                logger.error("❌ tableName é nulo ou vazio!");
                return null;
            }
            
            // 1. Buscar tabela em dictionary_tables
            String tableQuery = "SELECT id, table_name, display_name FROM dictionary_tables WHERE table_name = ?";
            logger.info("📝 Query de tabela: {} | Parâmetro: '{}'", tableQuery, tableName);
            
            List<Map<String, Object>> tableResult = jdbcTemplate.queryForList(tableQuery, tableName);
            logger.info("✅ Query executada. Resultado: {} registros", tableResult.size());
            
            if (tableResult.isEmpty()) {
                logger.warn("❌ [ERRO CRÍTICO] Tabela '{}' NÃO encontrada em dictionary_tables", tableName);
                logger.warn("📊 Dica: Verificar se tabela existe com: SELECT * FROM dictionary_tables WHERE table_name = '{}'", tableName);
                return null;
            }
            
            Map<String, Object> tableRow = tableResult.get(0);
            TableConfig config = new TableConfig(
                (String) tableRow.get("table_name"),
                (String) tableRow.get("display_name")
            );
            logger.info("✅ Tabela carregada: {} (display_name: {})", config.tableName, config.displayName);
            
            // 2. Buscar colunas em dictionary_columns
            String columnsQuery = 
                "SELECT " +
                "  column_name, data_type, is_primary_key, form_visible, search_visible, " +
                "  alias, character_maximum_length, numeric_precision, numeric_scale " +
                "FROM dictionary_columns " +
                "WHERE table_name = ? " +
                "ORDER BY column_name";
            
            logger.info("📝 Query de colunas: {} | Parâmetro: '{}'", columnsQuery, tableName);
            List<Map<String, Object>> columnsResult = jdbcTemplate.queryForList(columnsQuery, tableName);
            logger.info("✅ Query executada. {} colunas encontradas para tabela '{}'", columnsResult.size(), tableName);
            
            if (columnsResult.isEmpty()) {
                logger.warn("⚠️  [AVISO] Nenhuma coluna encontrada para tabela '{}' em dictionary_columns", tableName);
            }
            
            for (Map<String, Object> row : columnsResult) {
                String columnName = (String) row.get("column_name");
                String dataType = (String) row.get("data_type");
                
                // Converter is_primary_key (pode ser Boolean ou Number)
                Object pkValue = row.get("is_primary_key");
                boolean isPrimaryKey = false;
                if (pkValue instanceof Boolean) {
                    isPrimaryKey = (Boolean) pkValue;
                } else if (pkValue instanceof Number) {
                    isPrimaryKey = ((Number) pkValue).intValue() == 1;
                }
                
                // Converter form_visible (pode ser Boolean ou Number)
                Object formVisValue = row.get("form_visible");
                boolean formVisible = false;
                if (formVisValue instanceof Boolean) {
                    formVisible = (Boolean) formVisValue;
                } else if (formVisValue instanceof Number) {
                    formVisible = ((Number) formVisValue).intValue() == 1;
                }
                
                // Converter search_visible (pode ser Boolean ou Number)
                Object searchVisValue = row.get("search_visible");
                boolean searchVisible = false;
                if (searchVisValue instanceof Boolean) {
                    searchVisible = (Boolean) searchVisValue;
                } else if (searchVisValue instanceof Number) {
                    searchVisible = ((Number) searchVisValue).intValue() == 1;
                }
                
                String alias = (String) row.get("alias");
                Integer maxLength = row.get("character_maximum_length") != null ? 
                    ((Number) row.get("character_maximum_length")).intValue() : null;
                Integer numPrecision = row.get("numeric_precision") != null ? 
                    ((Number) row.get("numeric_precision")).intValue() : null;
                Integer numScale = row.get("numeric_scale") != null ? 
                    ((Number) row.get("numeric_scale")).intValue() : null;
                
                ColumnConfig colConfig = new ColumnConfig(
                    columnName, dataType, isPrimaryKey, formVisible, searchVisible,
                    alias, maxLength, numPrecision, numScale
                );
                
                config.columns.add(colConfig);
                logger.debug("  ➕ Coluna: {} (PK:{}, FormVis:{}, SearchVis:{})", 
                    columnName, isPrimaryKey, formVisible, searchVisible);
                
                // Adicionar a allowedFields (todos os campos)
                config.allowedFields.add(columnName);
                
                // Adicionar a searchFields (apenas os visíveis em busca e não filler)
                if (searchVisible && !columnName.equals("filler")) {
                    config.searchFields.add(columnName);
                }
                
                // Capturar PK (suporta chaves compostas)
                if (isPrimaryKey) {
                    config.primaryKeyColumns.add(columnName);
                    // definir primaryKeyColumn (compatibilidade) como a primeira PK encontrada
                    if (config.primaryKeyColumns.size() == 1) {
                        config.primaryKeyColumn = columnName;
                    }
                    logger.info("🔑 Primary Key encontrada: {} (todas: {})", columnName, config.primaryKeyColumns);
                }
            }
            
            logger.info("✅ Configuração completa: {} colunas, {} para busca, PK(s): {}",
                config.columns.size(), config.searchFields.size(), config.primaryKeyColumns);
            
            return config;
            
        } catch (Exception e) {
            logger.error("🔴 [EXCEPTION] Erro crítico ao carregar config da tabela '{}':", tableName);
            logger.error("   Mensagem: {}", e.getMessage());
            logger.error("   Classe da exceção: {}", e.getClass().getName());
            logger.error("   Stack trace completo:", e);
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Verificar se uma tabela é permitida (existe em dictionary_tables)
     * 
     * @param tableName Nome da tabela
     * @return true se tabela existe, false caso contrário
     */
    public boolean isTableAllowed(String tableName) {
        try {
            String query = "SELECT COUNT(*) FROM dictionary_tables WHERE table_name = ?";
            Integer count = jdbcTemplate.queryForObject(query, Integer.class, tableName);
            return count != null && count > 0;
        } catch (Exception e) {
            logger.warn("Erro ao verificar se tabela é permitida: {}", tableName, e);
            return false;
        }
    }
    
    /**
     * Verificar se um campo é permitido em uma tabela
     * 
     * @param tableName Nome da tabela
     * @param fieldName Nome do campo
     * @return true se campo existe em dictionary_columns, false caso contrário
     */
    public boolean isFieldAllowed(String tableName, String fieldName) {
        try {
            String query = "SELECT COUNT(*) FROM dictionary_columns WHERE table_name = ? AND column_name = ?";
            Integer count = jdbcTemplate.queryForObject(query, Integer.class, tableName, fieldName);
            return count != null && count > 0;
        } catch (Exception e) {
            logger.warn("Erro ao verificar se campo é permitido: {}.{}", tableName, fieldName, e);
            return false;
        }
    }
    
    /**
     * Obter tipo de dados de um campo
     * 
     * @param tableName Nome da tabela
     * @param fieldName Nome do campo
     * @return Tipo de dados (ex: char, decimal, date, etc)
     */
    public String getFieldDataType(String tableName, String fieldName) {
        try {
            String query = "SELECT data_type FROM dictionary_columns WHERE table_name = ? AND column_name = ?";
            String dataType = jdbcTemplate.queryForObject(query, String.class, tableName, fieldName);
            return dataType != null ? dataType.toLowerCase() : "string";
        } catch (Exception e) {
            logger.warn("Erro ao obter tipo de dados: {}.{}", tableName, fieldName, e);
            return "string";
        }
    }
}
