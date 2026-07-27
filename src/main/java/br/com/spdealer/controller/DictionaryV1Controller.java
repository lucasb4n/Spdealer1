package br.com.spdealer.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/dictionary")
public class DictionaryV1Controller {

    private static final Logger logger = LoggerFactory.getLogger(DictionaryV1Controller.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * GET /api/dictionary/tables
     * Lista todas as tabelas disponíveis no dictionary_tables
     * Usado pelo FormBuilder para popular dropdown de seleção de tabela
     */
    @GetMapping("/tables")
    public List<Map<String, Object>> getAllTables() {
        logger.info("GET /api/dictionary/tables - Listando todas as tabelas do dictionary");

        try {
            String sql = """
                SELECT 
                  id,
                  table_name,
                  display_name as table_label,
                  description
                FROM dictionary_tables
                ORDER BY table_name ASC
                """;

            List<Map<String, Object>> tables = jdbcTemplate.queryForList(sql);
            
            logger.info("✅ Retornando {} tabelas do dictionary", tables.size());
            return tables;

        } catch (Exception e) {
            logger.error("❌ Erro ao buscar tabelas do dictionary: {}", e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    /**
     * GET /api/v1/dictionary/tables/{tableName}/columns
     * Busca colunas direto do banco de dados (dictionary_columns)
     * Retorna um array de colunas no formato esperado pelo frontend (dictionary-driven).
     */
    @GetMapping("/tables/{tableName}/columns")
    public List<Map<String, Object>> getTableColumns(
            @PathVariable String tableName,
            @RequestParam(name = "visibility_field", required = false) String visibilityField,
            @RequestParam(name = "order_field", required = false) String orderField
    ) {
        logger.info("GET /api/v1/dictionary/tables/{}/columns - visibility_field: {}, order_field: {}", 
                   tableName, visibilityField, orderField);

        try {
            // Validação de orderField para evitar SQL injection via nome de coluna
            Set<String> allowedOrderFields = new HashSet<>(Arrays.asList(
                "form_order_new", "form_order_edit", "search_order", "tabulation", "column_name"
            ));

            String orderFieldValidated = (orderField != null && allowedOrderFields.contains(orderField))
                ? orderField
                : "tabulation";

            // Seleciona todas as colunas do dictionary para que o frontend possa filtrar
            // conforme os campos que existem (form_visible_edit, form_visible_new, etc.).
            String sql = String.format(
                "SELECT * FROM dictionary_columns WHERE table_name = ? ORDER BY COALESCE(%s, 999), column_name",
                orderFieldValidated
            );

            List<Map<String, Object>> columns = jdbcTemplate.queryForList(sql, tableName);

            logger.info("Retornando {} colunas para tabela {} (orderField={})", columns.size(), tableName, orderFieldValidated);
            return columns;

        } catch (Exception e) {
            logger.error("Erro ao buscar colunas do dictionary para tabela {}: {}", tableName, e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }
}
