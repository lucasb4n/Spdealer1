package br.com.spdealer.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service para gerenciar metadados de formulários (FORMBUILD)
 * Integra com tabelas: forms, form_definitions, form_fields, form_components
 * 
 * @author FORMBUILD
 * @since 07/01/2026
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FormMetadataService {

    private final JdbcTemplate jdbcTemplate;

    // ========== FORMS (Tabela Principal) ==========

    /**
     * Buscar todos os formulários
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findAllForms() {
        log.info("Buscando todos os formulários");
        String sql = "SELECT id, name, description, settings, form_metadata, created_at, updated_at FROM forms ORDER BY name";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Buscar formulário por ID
     */
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findFormById(String formId) {
        log.info("Buscando formulário por ID: {}", formId);
        String sql = "SELECT id, name, description, settings, form_metadata, created_at, updated_at FROM forms WHERE id = ?";
        
        try {
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, formId);
            return Optional.of(result);
        } catch (Exception e) {
            log.warn("Formulário não encontrado: {}", formId);
            return Optional.empty();
        }
    }

    /**
     * Criar novo formulário
     */
    @Transactional
    public Map<String, Object> createForm(String formId, String name, String description, String settings, String metadata) {
        log.info("Criando novo formulário: {} - {}", formId, name);
        
        String sql = "INSERT INTO forms (id, name, description, settings, form_metadata, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, NOW(), NOW())";
        
        jdbcTemplate.update(sql, formId, name, description, settings, metadata);
        
        log.info("Formulário criado com sucesso: {}", formId);
        return findFormById(formId).orElseThrow();
    }

    /**
     * Cria um registro em `programs`, um `menu_items` vinculado e a entrada em `user_menu_config`
     * para o usuário admin (id = 1) quando um novo formulário/rotina é criado.
     *
     * Regras:
     * - program.codigo = FORM.{FORMID_UPPER}
     * - programa é criado apenas se não existir
     * - menu é criado no grupo padrão (menu_group_id = 12)
     * - user_menu_config é inserido para usuario_id = 1 com visivel = true
     */
    private void createProgramAndMenuForForm(String formId, String name) {
        // Configurações fixas (conforme solicitado)
        final long MENU_GROUP_ID = 12L;
        final long ADMIN_USER_ID = 1L;

        // Gerar código do programa
        String code = ("FORM." + formId).toUpperCase().replaceAll("[^A-Z0-9_.]", "_");

        // Verifica se o programa já existe
        Integer exists = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM programs WHERE codigo = ?", Integer.class, code);
        if (exists != null && exists > 0) {
            log.info("Program {} já existe — pulando criação automática", code);
        } else {
            String insertProgram = "INSERT INTO programs (codigo, descricao, tipo, rota, icone, ordem, ativo, created_at, updated_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
            // tipo 'P' por padrão para rotinas geradas por FormBuilder
            jdbcTemplate.update(insertProgram, code, name, "P", "/formbuild/forms/" + formId, "fa-file-alt", 99, 1);
            log.info("Program criado automaticamente: {}", code);
        }

        // Criar menu_item vinculado ao program se não existir (procura por permissao_codigo)
        Integer countMenu = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM menu_items WHERE permissao_codigo = ?", Integer.class, code);
        if (countMenu != null && countMenu > 0) {
            log.info("Menu item já existe para program {}", code);
            return;
        }

        // Determinar próxima ordem dentro do grupo
        Integer maxOrder = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(ordem),0) FROM menu_items WHERE menu_group_id = ?", Integer.class, MENU_GROUP_ID);
        int nextOrder = (maxOrder != null ? maxOrder : 0) + 1;

        String insertMenu = "INSERT INTO menu_items (nome, rota, icone, ordem, ativo, permissao_codigo, menu_group_id, parent_id, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())";
        jdbcTemplate.update(insertMenu, name, "/formbuild/forms/" + formId, "fa-file-alt", nextOrder, 1, code, MENU_GROUP_ID);

        // Recuperar id do menu_item recém-criado
        Long menuItemId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        if (menuItemId == null) {
            log.warn("Não foi possível recuperar LAST_INSERT_ID() após inserir menu_item para {}", code);
            return;
        }

        // Inserir user_menu_config para admin (se ainda não existir)
        Integer existsCfg = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user_menu_config WHERE usuario_id = ? AND menu_item_id = ?", Integer.class, ADMIN_USER_ID, menuItemId);
        if (existsCfg != null && existsCfg > 0) {
            log.info("user_menu_config já existe para admin e menu_item {}", menuItemId);
        } else {
            String insertCfg = "INSERT INTO user_menu_config (usuario_id, menu_item_id, visivel, ordem, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
            jdbcTemplate.update(insertCfg, ADMIN_USER_ID, menuItemId, true, nextOrder);
            log.info("user_menu_config criado para admin (usuario_id={}) -> menu_item_id={}", ADMIN_USER_ID, menuItemId);
        }
    }
    /**
     * Atualizar formulário existente
     */
    @Transactional
    public Map<String, Object> updateForm(String formId, String name, String description, String settings, String metadata) {
        log.info("Atualizando formulário: {}", formId);
        
        String sql = "UPDATE forms SET name = ?, description = ?, settings = ?, form_metadata = ?, updated_at = NOW() WHERE id = ?";
        
        int updated = jdbcTemplate.update(sql, name, description, settings, metadata, formId);
        
        if (updated == 0) {
            throw new RuntimeException("Formulário não encontrado: " + formId);
        }
        
        log.info("Formulário atualizado: {}", formId);
        return findFormById(formId).orElseThrow();
    }

    /**
     * Deletar formulário
     */
    @Transactional
    public void deleteForm(String formId) {
        log.info("Deletando formulário: {}", formId);
        
        // Deletar em cascata: components, fields, definitions
        deleteFormComponents(formId);
        deleteFormFields(formId);
        deleteFormDefinitions(formId);
        
        String sql = "DELETE FROM forms WHERE id = ?";
        jdbcTemplate.update(sql, formId);
        
        log.info("Formulário deletado: {}", formId);
    }

    // ========== FORM_DEFINITIONS ==========

    /**
     * Buscar definições de um formulário
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findFormDefinitions(String formId) {
        log.info("Buscando definições do formulário: {}", formId);
        
        String sql = "SELECT id, name, description, version, visual_config, data_config, created_at, updated_at " +
                     "FROM form_definitions WHERE id = ?";
        
        return jdbcTemplate.queryForList(sql, formId);
    }

    /**
     * Criar/Atualizar definição de formulário
     */
    @Transactional
    public void saveFormDefinition(String formId, String name, String description, int version, 
                                    String visualConfig, String dataConfig) {
        log.info("Salvando definição do formulário: {}", formId);
        
        String checkSql = "SELECT COUNT(*) FROM form_definitions WHERE id = ?";
        int count = jdbcTemplate.queryForObject(checkSql, Integer.class, formId);
        
        if (count > 0) {
            // Update
            String sql = "UPDATE form_definitions SET name = ?, description = ?, version = ?, " +
                         "visual_config = ?, data_config = ?, updated_at = NOW() WHERE id = ?";
            jdbcTemplate.update(sql, name, description, version, visualConfig, dataConfig, formId);
        } else {
            // Insert
            String sql = "INSERT INTO form_definitions (id, name, description, version, visual_config, data_config, created_at, updated_at) " +
                         "VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
            jdbcTemplate.update(sql, formId, name, description, version, visualConfig, dataConfig);
        }
        
        log.info("Definição salva: {}", formId);
    }

    /**
     * Deletar definições de um formulário
     */
    @Transactional
    public void deleteFormDefinitions(String formId) {
        log.info("Deletando definições do formulário: {}", formId);
        String sql = "DELETE FROM form_definitions WHERE id = ?";
        jdbcTemplate.update(sql, formId);
    }

    // ========== FORM_FIELDS ==========

    /**
     * Buscar campos de um formulário
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findFormFields(String formId) {
        log.info("Buscando campos do formulário: {}", formId);
        
        String sql = "SELECT id, form_id, name, label, type, position, props, validations, created_at, updated_at " +
                     "FROM form_fields WHERE form_id = ? ORDER BY position";
        
        return jdbcTemplate.queryForList(sql, formId);
    }

    /**
     * Criar novo campo
     */
    @Transactional
    public void createFormField(String fieldId, String formId, String name, String label, String type, 
                                 Integer position, String props, String validations) {
        log.info("Criando campo: {} para formulário: {}", name, formId);
        
        String sql = "INSERT INTO form_fields (id, form_id, name, label, type, position, props, validations, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        jdbcTemplate.update(sql, fieldId, formId, name, label, type, position, props, validations);
        
        log.info("Campo criado: {}", fieldId);
    }

    /**
     * Atualizar campo existente
     */
    @Transactional
    public void updateFormField(String fieldId, String name, String label, String type, 
                                 Integer position, String props, String validations) {
        log.info("Atualizando campo: {}", fieldId);
        
        String sql = "UPDATE form_fields SET name = ?, label = ?, type = ?, position = ?, " +
                     "props = ?, validations = ?, updated_at = NOW() WHERE id = ?";
        
        jdbcTemplate.update(sql, name, label, type, position, props, validations, fieldId);
        
        log.info("Campo atualizado: {}", fieldId);
    }

    /**
     * Deletar campo
     */
    @Transactional
    public void deleteFormField(String fieldId) {
        log.info("Deletando campo: {}", fieldId);
        String sql = "DELETE FROM form_fields WHERE id = ?";
        jdbcTemplate.update(sql, fieldId);
    }

    /**
     * Deletar todos os campos de um formulário
     */
    @Transactional
    public void deleteFormFields(String formId) {
        log.info("Deletando todos os campos do formulário: {}", formId);
        String sql = "DELETE FROM form_fields WHERE form_id = ?";
        jdbcTemplate.update(sql, formId);
    }

    // ========== FORM_COMPONENTS ==========

    /**
     * Buscar componentes de um formulário
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findFormComponents(String formId) {
        log.info("Buscando componentes do formulário: {}", formId);
        
        String sql = "SELECT id, form_id, type, label, properties, position, validation, `order`, created_at, updated_at " +
                     "FROM form_components WHERE form_id = ? ORDER BY `order`";
        
        return jdbcTemplate.queryForList(sql, formId);
    }

    /**
     * Criar novo componente
     */
    @Transactional
    public void createFormComponent(String componentId, String formId, String type, String label, 
                                     String properties, String position, String validation, Integer order) {
        log.info("Criando componente: {} para formulário: {}", type, formId);
        
        String sql = "INSERT INTO form_components (id, form_id, type, label, properties, position, validation, `order`, created_at, updated_at) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
        
        jdbcTemplate.update(sql, componentId, formId, type, label, properties, position, validation, order);
        
        log.info("Componente criado: {}", componentId);
    }

    /**
     * Deletar componente
     */
    @Transactional
    public void deleteFormComponent(String componentId) {
        log.info("Deletando componente: {}", componentId);
        String sql = "DELETE FROM form_components WHERE id = ?";
        jdbcTemplate.update(sql, componentId);
    }

    /**
     * Deletar todos os componentes de um formulário
     */
    @Transactional
    public void deleteFormComponents(String formId) {
        log.info("Deletando todos os componentes do formulário: {}", formId);
        String sql = "DELETE FROM form_components WHERE form_id = ?";
        jdbcTemplate.update(sql, formId);
    }

    // ========== FORM_RULES ==========

    /**
     * Buscar regras de validação de um formulário
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findFormRules(String formId) {
        log.info("Buscando regras do formulário: {}", formId);
        
        String sql = "SELECT id, form_id, target_field_id, rule_type, expression, params, created_at, updated_at " +
                     "FROM form_rules WHERE form_id = ?";
        
        return jdbcTemplate.queryForList(sql, formId);
    }

    // ========== FORM_TEMPLATES ==========

    /**
     * Buscar template por tipo
     */
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> findTemplateByType(String templateType) {
        log.info("Buscando template: {}", templateType);
        
        String sql = "SELECT id, name, description, template_type, language, template_code, engine, version " +
                     "FROM form_templates WHERE template_type = ? AND is_active = 1";
        
        try {
            Map<String, Object> result = jdbcTemplate.queryForMap(sql, templateType);
            return Optional.of(result);
        } catch (Exception e) {
            log.warn("Template não encontrado: {}", templateType);
            return Optional.empty();
        }
    }

    /**
     * Buscar todos os templates ativos
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findAllTemplates() {
        log.info("Buscando todos os templates ativos");
        
        String sql = "SELECT id, name, description, template_type, language, engine, version " +
                     "FROM form_templates WHERE is_active = 1 ORDER BY template_type";
        
        return jdbcTemplate.queryForList(sql);
    }

    // ========== MÉTODOS AUXILIARES ==========

    /**
     * Buscar formulário completo (com fields, components, rules)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> findCompleteForm(String formId) {
        log.info("Buscando formulário completo: {}", formId);
        
        Map<String, Object> form = findFormById(formId).orElseThrow(() -> 
            new RuntimeException("Formulário não encontrado: " + formId)
        );
        
        Map<String, Object> result = new HashMap<>(form);
        result.put("definitions", findFormDefinitions(formId));
        result.put("fields", findFormFields(formId));
        result.put("components", findFormComponents(formId));
        result.put("rules", findFormRules(formId));
        
        log.info("Formulário completo carregado: {} com {} campos", formId, 
                 ((List<?>) result.get("fields")).size());
        
        return result;
    }

    /**
     * Contar formulários existentes
     */
    @Transactional(readOnly = true)
    public int countForms() {
        String sql = "SELECT COUNT(*) FROM forms";
        return jdbcTemplate.queryForObject(sql, Integer.class);
    }

    /**
     * Verificar se formulário existe
     */
    @Transactional(readOnly = true)
    public boolean formExists(String formId) {
        String sql = "SELECT COUNT(*) FROM forms WHERE id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, formId);
        return count != null && count > 0;
    }

    /**
     * Buscar formulários disponíveis no menu
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> findAvailableFormsFromMenu() {
        log.info("Buscando formulários disponíveis do menu");
        
        String sql = "SELECT id, name, route, icon, group_id " +
                     "FROM menu_items " +
                     "WHERE route IS NOT NULL AND route != '' " +
                     "ORDER BY name";
        
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Duplicar formulário
     */
    @Transactional
    public Map<String, Object> duplicateForm(String sourceFormId, String newFormId, String newName) {
        log.info("Duplicando formulário {} para {}", sourceFormId, newFormId);
        
        // Buscar formulário original
        Map<String, Object> source = findCompleteForm(sourceFormId);
        
        // Criar novo formulário
        createForm(
            newFormId,
            newName,
            (String) source.get("description"),
            (String) source.get("settings"),
            (String) source.get("form_metadata")
        );
        
        // Copiar fields
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> fields = (List<Map<String, Object>>) source.get("fields");
        for (Map<String, Object> field : fields) {
            createFormField(
                newFormId + "_" + field.get("name"),
                newFormId,
                (String) field.get("name"),
                (String) field.get("label"),
                (String) field.get("type"),
                (Integer) field.get("position"),
                (String) field.get("props"),
                (String) field.get("validations")
            );
        }
        
        log.info("Formulário duplicado com sucesso: {}", newFormId);
        return findCompleteForm(newFormId);
    }
}
