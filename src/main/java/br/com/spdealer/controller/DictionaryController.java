package br.com.spdealer.controller;

import br.com.spdealer.dto.DictionaryColumn;
import br.com.spdealer.dto.DictionaryTable;
import br.com.spdealer.service.DictionaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller REST para Dictionary System
 * 
 * Endpoints para acesso a metadados de tabelas e colunas
 * Usado pelo FormBuilder para Reverse Engineering e geração dinâmica
 */
@RestController
@RequestMapping("/api/dictionary")
public class DictionaryController {
    
    @Autowired
    private DictionaryService dictionaryService;
    
    // ========================================================================
    // DICTIONARY_TABLES - Endpoints
    // ========================================================================
    
    /**
     * GET /api/dictionary/tables
     * 
     * Lista todas as tabelas disponíveis no dictionary
     * Usado para popular dropdown de seleção no FormBuilder
     * 
     * @return Lista de tabelas com nome, display_name, description
     */
    @GetMapping("/tables")
    public ResponseEntity<List<DictionaryTable>> getTables() {
        try {
            System.out.println("DEBUG: DictionaryController.getTables() chamado");
            List<DictionaryTable> tables = dictionaryService.getAllTables();
            System.out.println("DEBUG: " + tables.size() + " tabelas retornadas");
            return ResponseEntity.ok(tables);
        } catch (Exception e) {
            System.err.println("ERRO em DictionaryController.getTables(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * GET /api/dictionary/tables/{tableName}
     * 
     * Busca informações de uma tabela específica
     * 
     * @param tableName Nome da tabela (ex: 'receber', 'clientes')
     * @return Dados da tabela ou 404 se não encontrada
     */
    @GetMapping("/tables/{tableName}")
    public ResponseEntity<DictionaryTable> getTable(@PathVariable String tableName) {
        DictionaryTable table = dictionaryService.getTableByName(tableName);
        
        if (table == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(table);
    }
    
    /**
     * GET /api/dictionary/tables/project-specific
     * 
     * Lista apenas tabelas específicas do projeto
     * Filtra tabelas customizadas vs tabelas de sistema
     * 
     * @return Lista de tabelas com is_project_specific = 1
     */
    @GetMapping("/tables/project-specific")
    public ResponseEntity<List<DictionaryTable>> getProjectTables() {
        List<DictionaryTable> tables = dictionaryService.getProjectSpecificTables();
        return ResponseEntity.ok(tables);
    }
    
    // ========================================================================
    // DICTIONARY_COLUMNS - Endpoints
    // ========================================================================
    
    /**
     * GET /api/dictionary/columns/{tableName}
     * 
     * Busca TODAS as colunas de uma tabela
     * Retorna metadados completos (tipo, largura, aba, validações, etc)
     * 
     * @param tableName Nome da tabela
     * @return Lista de colunas ordenadas por aba e tabulation
     */
    @GetMapping("/columns/{tableName}")
    public ResponseEntity<List<DictionaryColumn>> getColumns(@PathVariable String tableName) {
        List<DictionaryColumn> columns = dictionaryService.getColumnsByTable(tableName);
        return ResponseEntity.ok(columns);
    }
    
    /**
     * GET /api/dictionary/columns/{tableName}/context/{context}
     * 
     * Busca colunas filtradas por contexto de uso
     * 
     * @param tableName Nome da tabela
     * @param context Contexto: 'form' (form_visible=1), 'search' (search_visible=1), 'grid' (todos)
     * @return Lista de colunas filtradas
     * 
     * Exemplos:
     * - /api/dictionary/columns/receber/context/form → Apenas campos visíveis no formulário
     * - /api/dictionary/columns/receber/context/search → Apenas campos de busca/filtro
     * - /api/dictionary/columns/receber/context/grid → Todos os campos (para AG-Grid)
     */
    @GetMapping("/columns/{tableName}/context/{context}")
    public ResponseEntity<List<DictionaryColumn>> getColumnsByContext(
            @PathVariable String tableName,
            @PathVariable String context) {
        
        if (!context.matches("form|search|grid")) {
            return ResponseEntity.badRequest().build();
        }
        
        List<DictionaryColumn> columns = dictionaryService.getColumnsByContext(tableName, context);
        return ResponseEntity.ok(columns);
    }
    
    /**
     * GET /api/dictionary/columns/{tableName}/tab/{aba}
     * 
     * Busca colunas de uma aba/tab específica
     * 
     * @param tableName Nome da tabela
     * @param aba Nome da aba (ex: 'Dados Principais', 'Endereco')
     * @return Lista de colunas da aba ordenadas por tabulation
     */
    @GetMapping("/columns/{tableName}/tab/{aba}")
    public ResponseEntity<List<DictionaryColumn>> getColumnsByTab(
            @PathVariable String tableName,
            @PathVariable String aba) {
        
        List<DictionaryColumn> columns = dictionaryService.getColumnsByTab(tableName, aba);
        return ResponseEntity.ok(columns);
    }
    
    /**
     * GET /api/dictionary/columns/{tableName}/grouped
     * 
     * Retorna colunas agrupadas por aba
     * Útil para renderizar tabs no FormBuilder
     * 
     * @param tableName Nome da tabela
     * @return Map<String, List<DictionaryColumn>> - Key: nome da aba, Value: lista de colunas
     */
    @GetMapping("/columns/{tableName}/grouped")
    public ResponseEntity<Map<String, List<DictionaryColumn>>> getColumnsGroupedByTab(
            @PathVariable String tableName) {
        
        List<DictionaryColumn> allColumns = dictionaryService.getColumnsByTable(tableName);
        
        // Agrupar por aba
        Map<String, List<DictionaryColumn>> grouped = allColumns.stream()
                .filter(col -> col.getAba() != null && !col.getAba().isEmpty())
                .collect(Collectors.groupingBy(DictionaryColumn::getAba));
        
        return ResponseEntity.ok(grouped);
    }
    
    /**
     * GET /api/dictionary/columns/{tableName}/dynamic-lists
     * 
     * Busca colunas que são listas dinâmicas (dropdowns)
     * Filtra por is_lista = 1
     * 
     * @param tableName Nome da tabela
     * @return Lista de colunas que devem renderizar como select/dropdown
     */
    @GetMapping("/columns/{tableName}/dynamic-lists")
    public ResponseEntity<List<DictionaryColumn>> getDynamicListColumns(@PathVariable String tableName) {
        List<DictionaryColumn> columns = dictionaryService.getDynamicListColumns(tableName);
        return ResponseEntity.ok(columns);
    }
    
    /**
     * GET /api/dictionary/columns/{tableName}/foreign-keys
     * 
     * Busca colunas que são foreign keys
     * Filtra por is_foreign_key = 1
     * 
     * @param tableName Nome da tabela
     * @return Lista de colunas FK com tabelas de referência
     */
    @GetMapping("/columns/{tableName}/foreign-keys")
    public ResponseEntity<List<DictionaryColumn>> getForeignKeyColumns(@PathVariable String tableName) {
        List<DictionaryColumn> columns = dictionaryService.getForeignKeyColumns(tableName);
        return ResponseEntity.ok(columns);
    }
    
    /**
     * GET /api/dictionary/columns/{tableName}/{columnName}
     * 
     * Busca metadados de uma coluna específica
     * 
     * @param tableName Nome da tabela
     * @param columnName Nome da coluna
     * @return Metadados da coluna ou 404 se não encontrada
     */
    @GetMapping("/columns/{tableName}/{columnName}")
    public ResponseEntity<DictionaryColumn> getColumn(
            @PathVariable String tableName,
            @PathVariable String columnName) {
        
        DictionaryColumn column = dictionaryService.getColumn(tableName, columnName);
        
        if (column == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(column);
    }
    
    // ========================================================================
    // HEALTH CHECK
    // ========================================================================
    
    /**
     * GET /api/dictionary/health
     * 
     * Verifica se o dictionary está acessível
     * Útil para debug e testes
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "ok");
        status.put("service", "DictionaryController");
        status.put("timestamp", System.currentTimeMillis());
        
        try {
            int tableCount = dictionaryService.getAllTables().size();
            status.put("tables_count", tableCount);
            status.put("database", "connected");
        } catch (Exception e) {
            status.put("database", "error: " + e.getMessage());
        }
        
        return ResponseEntity.ok(status);
    }
}
