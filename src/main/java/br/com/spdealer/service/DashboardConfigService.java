package br.com.spdealer.service;

import br.com.spdealer.model.DashboardConfig;
import br.com.spdealer.repository.DashboardConfigRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DashboardConfigService {

    @Autowired
    private DashboardConfigRepository dashboardConfigRepository;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Busca a configuração completa do dashboard para um usuário
     */
    public Map<String, Object> getDashboardConfig(Long usuarioId) {
        try {
            // Buscar dashboard padrão do usuário na nova estrutura
            String dashboardQuery = "SELECT * FROM dashboards WHERE user_id = ? AND is_default = 1 AND is_active = 1 LIMIT 1";
            List<Map<String, Object>> dashboardResult = jdbcTemplate.queryForList(dashboardQuery, usuarioId);
            
            if (dashboardResult.isEmpty()) {
                System.out.println("[CONFIG] Nenhum dashboard padrão encontrado, criando configuração padrão");
                return createDefaultConfig();
            }
            
            Map<String, Object> dashboard = dashboardResult.get(0);
            Long dashboardId = ((Number) dashboard.get("id")).longValue();
            
            // Criar configuração base
            Map<String, Object> config = new HashMap<>();
            
            // Theme config da tabela dashboards
            String themeConfigJson = (String) dashboard.get("theme_config");
            if (themeConfigJson != null && !themeConfigJson.trim().isEmpty()) {
                Map<String, Object> themeConfig = objectMapper.readValue(themeConfigJson, Map.class);
                config.put("theme_config", themeConfig);
            }
            
            // Canvas config da tabela dashboards  
            String canvasConfigJson = (String) dashboard.get("canvas_config");
            if (canvasConfigJson != null && !canvasConfigJson.trim().isEmpty()) {
                Map<String, Object> canvasConfig = objectMapper.readValue(canvasConfigJson, Map.class);
                config.put("canvas_config", canvasConfig);
            }
            
            // Buscar widgets da tabela dashboard_widgets
            String widgetsQuery = "SELECT * FROM dashboard_widgets WHERE dashboard_id = ? AND is_visible = 1 ORDER BY z_index";
            List<Map<String, Object>> widgetsResult = jdbcTemplate.queryForList(widgetsQuery, dashboardId);
            
            List<Map<String, Object>> widgetsList = new ArrayList<>();
            
            for (Map<String, Object> widgetRow : widgetsResult) {
                Map<String, Object> widget = new HashMap<>();
                widget.put("id", widgetRow.get("widget_id"));
                widget.put("title", widgetRow.get("title"));
                widget.put("widget_type", ((String) widgetRow.get("widget_type")).toLowerCase());
                widget.put("position_x", widgetRow.get("position_x"));
                widget.put("position_y", widgetRow.get("position_y"));
                widget.put("width", widgetRow.get("width"));
                widget.put("height", widgetRow.get("height"));
                
                // Processar data_config se existir
                String dataConfigJson = (String) widgetRow.get("data_config");
                if (dataConfigJson != null && !dataConfigJson.trim().isEmpty()) {
                    try {
                        Map<String, Object> dataConfig = objectMapper.readValue(dataConfigJson, Map.class);
                        
                        // Executar SQL query se existir
                        if (dataConfig.containsKey("sqlQuery")) {
                            String sqlQuery = (String) dataConfig.get("sqlQuery");
                            try {
                                List<Map<String, Object>> queryResult = executeQuery(sqlQuery);
                                widget.put("data", queryResult);
                                System.out.println("[CONFIG] Query executada para widget " + widgetRow.get("widget_id") + ": " + queryResult.size() + " resultados");
                            } catch (Exception e) {
                                System.err.println("[CONFIG] Erro ao executar query para widget " + widgetRow.get("widget_id") + ": " + e.getMessage());
                                widget.put("data", Collections.emptyList());
                                widget.put("error", "Erro ao carregar dados: " + e.getMessage());
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("[CONFIG] Erro ao processar data_config: " + e.getMessage());
                    }
                }
                
                widgetsList.add(widget);
            }
            
            config.put("widgets", widgetsList);
            
            System.out.println("[CONFIG] Configuração carregada com " + widgetsList.size() + " widgets para usuário " + usuarioId);
            return config;
            
        } catch (Exception e) {
            System.err.println("[CONFIG] Erro ao buscar configuração: " + e.getMessage());
            e.printStackTrace();
            return createDefaultConfig();
        }
    }

    /**
     * Salva a configuração completa do dashboard para um usuário
     */
    public void saveDashboardConfig(Long usuarioId, Map<String, Object> config) {
        try {
            Optional<DashboardConfig> existingConfig = dashboardConfigRepository.findByUsuarioId(usuarioId);
            
            String configJson = objectMapper.writeValueAsString(config);
            
            if (existingConfig.isPresent()) {
                DashboardConfig dashboardConfig = existingConfig.get();
                dashboardConfig.setConfigJson(configJson);
                dashboardConfigRepository.save(dashboardConfig);
            } else {
                DashboardConfig newConfig = new DashboardConfig();
                newConfig.setUsuarioId(usuarioId);
                newConfig.setConfigJson(configJson);
                dashboardConfigRepository.save(newConfig);
            }
            
            System.out.println("Configuração salva para usuário: " + usuarioId);
            
        } catch (Exception e) {
            System.err.println("Erro ao salvar configuração: " + e.getMessage());
            throw new RuntimeException("Erro ao salvar configuração do dashboard", e);
        }
    }

    /**
     * Executa uma query SQL e retorna os resultados
     */
    private List<Map<String, Object>> executeQuery(String sqlQuery) {
        try {
            return jdbcTemplate.queryForList(sqlQuery);
        } catch (Exception e) {
            System.err.println("Erro ao executar query: " + sqlQuery);
            System.err.println("Erro: " + e.getMessage());
            throw e;
        }
    }

    public Map<String, Object> createDefaultConfig() {
        Map<String, Object> defaultConfig = new HashMap<>();
        
        // Tema padrão
        Map<String, Object> theme = new HashMap<>();
        theme.put("primaryColor", "#2563eb");
        theme.put("backgroundColor", "#fff");
        theme.put("cardRadius", "14px");
        theme.put("cardShadow", "0 2px 12px rgba(34,51,106,0.10)");
        defaultConfig.put("theme", theme);
        
        // Layout padrão
        Map<String, Object> layout = new HashMap<>();
        layout.put("rows", 12);
        layout.put("cols", 12);
        layout.put("rowHeight", 60);
        layout.put("margin", Arrays.asList(10, 10));
        layout.put("padding", Arrays.asList(10, 10));
        defaultConfig.put("layout", layout);
        
        // Widgets vazios inicialmente
        defaultConfig.put("widgets", new ArrayList<>());
        
        return defaultConfig;
    }
    
    /**
     * Valida se a configuração do dashboard está correta
     */
    public boolean isValidConfig(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            return false;
        }
        
        // Verificações básicas de estrutura
        return config.containsKey("theme") || config.containsKey("layout") || config.containsKey("widgets");
    }
}