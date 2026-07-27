package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FormComponentService - Gerenciamento de componentes, propriedades e eventos
 * 
 * Tabelas envolvidas:
 * - form_components (componentes do formulário)
 * - form_component_properties (propriedades editáveis)
 * - form_component_events (eventos do componente)
 * 
 * Criado: 10 JAN 2026
 */
@Service
public class FormComponentService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * Salvar ou atualizar propriedade de um componente
     * 
     * @param componentId ID do componente (ex: 'field_rec_001', 'EDTNAME')
     * @param propertyName Nome da propriedade (ex: 'Nome', 'Largura', 'PosX')
     * @param propertyValue Valor da propriedade (ex: 'EDTNAME', '300px', '10')
     * @return ID da propriedade inserida/atualizada
     */
    @Transactional
    public Long saveComponentProperty(String componentId, String propertyName, String propertyValue) {
        // Verificar se propriedade já existe
        String checkSql = "SELECT id FROM form_component_properties " +
                          "WHERE component_id = ? AND property_name = ?";
        
        List<Long> existing = jdbcTemplate.query(
            checkSql,
            (rs, rowNum) -> rs.getLong("id"),
            componentId,
            propertyName
        );
        
        LocalDateTime now = LocalDateTime.now();
        
        if (existing.isEmpty()) {
            // INSERT
            String insertSql = "INSERT INTO form_component_properties " +
                               "(component_id, property_name, property_value, created_at, updated_at) " +
                               "VALUES (?, ?, ?, ?, ?)";
            
            jdbcTemplate.update(insertSql, componentId, propertyName, propertyValue, now, now);
            
            // Buscar ID inserido
            Long id = jdbcTemplate.queryForObject(
                "SELECT LAST_INSERT_ID()",
                Long.class
            );
            
            return id;
        } else {
            // UPDATE
            Long id = existing.get(0);
            String updateSql = "UPDATE form_component_properties " +
                               "SET property_value = ?, updated_at = ? " +
                               "WHERE id = ?";
            
            jdbcTemplate.update(updateSql, propertyValue, now, id);
            return id;
        }
    }
    
    /**
     * Salvar ou atualizar evento de um componente
     * 
     * @param componentId ID do componente
     * @param eventType Tipo de evento (ex: 'Ao Clicar', 'Ao Entrar', 'Ao Modificar')
     * @param action Ação a executar (ex: 'validarCPF()', 'buscarCEP()')
     * @param description Descrição do evento (opcional)
     * @return ID do evento inserido/atualizado
     */
    @Transactional
    public Long saveComponentEvent(String componentId, String eventType, String action, String description) {
        // Verificar se evento já existe
        String checkSql = "SELECT id FROM form_component_events " +
                          "WHERE component_id = ? AND event_type = ?";
        
        List<Long> existing = jdbcTemplate.query(
            checkSql,
            (rs, rowNum) -> rs.getLong("id"),
            componentId,
            eventType
        );
        
        LocalDateTime now = LocalDateTime.now();
        
        if (existing.isEmpty()) {
            // INSERT
            String insertSql = "INSERT INTO form_component_events " +
                               "(component_id, event_type, action, description, created_at, updated_at) " +
                               "VALUES (?, ?, ?, ?, ?, ?)";
            
            jdbcTemplate.update(insertSql, componentId, eventType, action, description, now, now);
            
            Long id = jdbcTemplate.queryForObject(
                "SELECT LAST_INSERT_ID()",
                Long.class
            );
            
            return id;
        } else {
            // UPDATE
            Long id = existing.get(0);
            String updateSql = "UPDATE form_component_events " +
                               "SET action = ?, description = ?, updated_at = ? " +
                               "WHERE id = ?";
            
            jdbcTemplate.update(updateSql, action, description, now, id);
            return id;
        }
    }
    
    /**
     * Buscar todas as propriedades de um componente
     * 
     * @param componentId ID do componente
     * @return Map com propriedades (chave = property_name, valor = property_value)
     */
    public Map<String, String> getComponentProperties(String componentId) {
        String sql = "SELECT property_name, property_value " +
                     "FROM form_component_properties " +
                     "WHERE component_id = ? " +
                     "ORDER BY property_name";
        
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, componentId);
        
        Map<String, String> properties = new HashMap<>();
        for (Map<String, Object> row : rows) {
            String name = (String) row.get("property_name");
            String value = (String) row.get("property_value");
            properties.put(name, value);
        }
        
        return properties;
    }
    
    /**
     * Buscar todos os eventos de um componente
     * 
     * @param componentId ID do componente
     * @return Map com eventos (chave = event_type, valor = action)
     */
    public Map<String, String> getComponentEvents(String componentId) {
        String sql = "SELECT event_type, action " +
                     "FROM form_component_events " +
                     "WHERE component_id = ? " +
                     "ORDER BY event_type";
        
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, componentId);
        
        Map<String, String> events = new HashMap<>();
        for (Map<String, Object> row : rows) {
            String type = (String) row.get("event_type");
            String action = (String) row.get("action");
            events.put(type, action != null ? action : "(Vazio)");
        }
        
        return events;
    }
    
    /**
     * Salvar múltiplas propriedades em lote (para melhor performance)
     * 
     * @param componentId ID do componente
     * @param properties Map com propriedades (chave = nome, valor = valor)
     * @return Número de propriedades salvas
     */
    @Transactional
    public int saveComponentPropertiesBatch(String componentId, Map<String, String> properties) {
        int count = 0;
        for (Map.Entry<String, String> entry : properties.entrySet()) {
            saveComponentProperty(componentId, entry.getKey(), entry.getValue());
            count++;
        }
        return count;
    }
    
    /**
     * Salvar múltiplos eventos em lote
     * 
     * @param componentId ID do componente
     * @param events Map com eventos (chave = tipo, valor = ação)
     * @return Número de eventos salvos
     */
    @Transactional
    public int saveComponentEventsBatch(String componentId, Map<String, String> events) {
        int count = 0;
        for (Map.Entry<String, String> entry : events.entrySet()) {
            // Não salvar se ação for "(Vazio)" ou null
            if (entry.getValue() != null && 
                !entry.getValue().trim().isEmpty() && 
                !"(Vazio)".equals(entry.getValue())) {
                saveComponentEvent(componentId, entry.getKey(), entry.getValue(), null);
                count++;
            }
        }
        return count;
    }
}
