package br.com.spdealer.controller;

import br.com.spdealer.service.FormComponentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FormComponentController - API REST para gerenciar componentes, propriedades e eventos
 * 
 * Endpoints:
 * - POST /api/form-components/{componentId}/properties - Salvar propriedade
 * - POST /api/form-components/{componentId}/properties/batch - Salvar múltiplas propriedades
 * - POST /api/form-components/{componentId}/events - Salvar evento
 * - POST /api/form-components/{componentId}/events/batch - Salvar múltiplos eventos
 * - GET /api/form-components/{componentId}/properties - Buscar propriedades
 * - GET /api/form-components/{componentId}/events - Buscar eventos
 * - GET /api/formbuilder/components - Buscar todos componentes disponíveis (NOVO 11 JAN 2026)
 * - GET /api/formbuilder/components/{type}/properties - Buscar propriedades por tipo (NOVO 11 JAN 2026)
 * - GET /api/formbuilder/components/{type}/events - Buscar eventos por tipo (NOVO 11 JAN 2026)
 * 
 * Criado: 10 JAN 2026
 * Atualizado: 11 JAN 2026 - Endpoints de metadados
 */
@RestController
@RequestMapping("/api/form-components")
public class FormComponentController {
    
    @Autowired
    private FormComponentService service;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * Salvar ou atualizar uma propriedade de componente
     * 
     * POST /api/form-components/{componentId}/properties
     * Body: {
     *   "propertyName": "Largura",
     *   "propertyValue": "300px"
     * }
     */
    @PostMapping("/{componentId}/properties")
    public ResponseEntity<Map<String, Object>> saveProperty(
            @PathVariable String componentId,
            @RequestBody Map<String, String> request) {
        
        String propertyName = request.get("propertyName");
        String propertyValue = request.get("propertyValue");
        
        if (propertyName == null || propertyValue == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "propertyName e propertyValue são obrigatórios");
            return ResponseEntity.badRequest().body(error);
        }
        
        Long id = service.saveComponentProperty(componentId, propertyName, propertyValue);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("id", id);
        response.put("componentId", componentId);
        response.put("propertyName", propertyName);
        response.put("propertyValue", propertyValue);
        response.put("message", "Propriedade salva com sucesso");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Salvar múltiplas propriedades em lote
     * 
     * POST /api/form-components/{componentId}/properties/batch
     * Body: {
     *   "Nome": "EDTNAME",
     *   "Largura": "300px",
     *   "Altura": "35",
     *   "PosX": "10",
     *   "PosY": "82"
     * }
     */
    @PostMapping("/{componentId}/properties/batch")
    public ResponseEntity<Map<String, Object>> savePropertiesBatch(
            @PathVariable String componentId,
            @RequestBody Map<String, String> properties) {
        
        int count = service.saveComponentPropertiesBatch(componentId, properties);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("componentId", componentId);
        response.put("count", count);
        response.put("message", count + " propriedade(s) salva(s) com sucesso");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Salvar ou atualizar um evento de componente
     * 
     * POST /api/form-components/{componentId}/events
     * Body: {
     *   "eventType": "Ao Clicar",
     *   "action": "validarCPF()",
     *   "description": "Validação de CPF" (opcional)
     * }
     */
    @PostMapping("/{componentId}/events")
    public ResponseEntity<Map<String, Object>> saveEvent(
            @PathVariable String componentId,
            @RequestBody Map<String, String> request) {
        
        String eventType = request.get("eventType");
        String action = request.get("action");
        String description = request.get("description");
        
        if (eventType == null || action == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "eventType e action são obrigatórios");
            return ResponseEntity.badRequest().body(error);
        }
        
        // Não salvar se action for "(Vazio)"
        if ("(Vazio)".equals(action.trim())) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Evento vazio não foi salvo");
            return ResponseEntity.ok(response);
        }
        
        Long id = service.saveComponentEvent(componentId, eventType, action, description);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("id", id);
        response.put("componentId", componentId);
        response.put("eventType", eventType);
        response.put("action", action);
        response.put("message", "Evento salvo com sucesso");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Salvar múltiplos eventos em lote
     * 
     * POST /api/form-components/{componentId}/events/batch
     * Body: {
     *   "Ao Clicar": "validarCPF()",
     *   "Ao Modificar": "formatarCampo()",
     *   "Ao Sair": "(Vazio)"
     * }
     */
    @PostMapping("/{componentId}/events/batch")
    public ResponseEntity<Map<String, Object>> saveEventsBatch(
            @PathVariable String componentId,
            @RequestBody Map<String, String> events) {
        
        int count = service.saveComponentEventsBatch(componentId, events);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("componentId", componentId);
        response.put("count", count);
        response.put("message", count + " evento(s) salvo(s) com sucesso");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Buscar todas as propriedades de um componente
     * 
     * GET /api/form-components/{componentId}/properties
     */
    @GetMapping("/{componentId}/properties")
    public ResponseEntity<Map<String, Object>> getProperties(@PathVariable String componentId) {
        Map<String, String> properties = service.getComponentProperties(componentId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("componentId", componentId);
        response.put("properties", properties);
        response.put("count", properties.size());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Buscar todos os eventos de um componente
     * 
     * GET /api/form-components/{componentId}/events
     */
    @GetMapping("/{componentId}/events")
    public ResponseEntity<Map<String, Object>> getEvents(@PathVariable String componentId) {
        Map<String, String> events = service.getComponentEvents(componentId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("componentId", componentId);
        response.put("events", events);
        response.put("count", events.size());
        
        return ResponseEntity.ok(response);
    }
    
    // ============================================================================
    // NOVOS ENDPOINTS - Metadados de Componentes (11 JAN 2026)
    // ============================================================================
    
    /**
     * GET /api/formbuilder/components
     * 
     * Retorna todos os componentes disponíveis ordenados por display_order
     * Usado pelo sidebar do FormBuilder para renderizar componentes dinamicamente
     * 
     * @return List de componentes com component_type, component_name, component_icon, category
     */
    @GetMapping("/formbuilder/components")
    public ResponseEntity<List<Map<String, Object>>> getAllComponents() {
        String sql = "SELECT component_type, component_name, component_icon, category, display_order " +
                    "FROM form_components " +
                    "ORDER BY display_order ASC";
        
        List<Map<String, Object>> components = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(components);
    }

    /**
     * GET /api/formbuilder/components/{componentType}/properties
     * 
     * Retorna todas as propriedades de um tipo de componente específico
     * Ordenado por property_group e display_order
     * Usado pelo modal de propriedades dinâmico
     * 
     * @param componentType Tipo do componente (ex: text, calendar, grid)
     * @return List de propriedades
     */
    @GetMapping("/formbuilder/components/{componentType}/properties")
    public ResponseEntity<List<Map<String, Object>>> getComponentPropertiesByType(@PathVariable String componentType) {
        String sql = "SELECT " +
                    "  property_key, " +
                    "  property_name, " +
                    "  property_type, " +
                    "  property_group, " +
                    "  display_order, " +
                    "  default_value, " +
                    "  options_enum, " +
                    "  validation_pattern, " +
                    "  is_required, " +
                    "  description " +
                    "FROM form_component_properties " +
                    "WHERE component_type = ? " +
                    "ORDER BY property_group ASC, display_order ASC";
        
        List<Map<String, Object>> properties = jdbcTemplate.queryForList(sql, componentType);
        return ResponseEntity.ok(properties);
    }

    /**
     * GET /api/formbuilder/components/{componentType}/events
     * 
     * Retorna todos os eventos de um tipo de componente específico
     * Ordenado por event_group e display_order
     * Usado pelo modal de propriedades dinâmico (aba Eventos)
     * 
     * @param componentType Tipo do componente (ex: text, calendar, grid)
     * @return List de eventos
     */
    @GetMapping("/formbuilder/components/{componentType}/events")
    public ResponseEntity<List<Map<String, Object>>> getComponentEventsByType(@PathVariable String componentType) {
        String sql = "SELECT " +
                    "  event_key, " +
                    "  event_name, " +
                    "  event_group, " +
                    "  display_order, " +
                    "  parameters, " +
                    "  description, " +
                    "  example_code " +
                    "FROM form_component_events " +
                    "WHERE component_type = ? " +
                    "ORDER BY event_group ASC, display_order ASC";
        
        List<Map<String, Object>> events = jdbcTemplate.queryForList(sql, componentType);
        return ResponseEntity.ok(events);
    }
}
