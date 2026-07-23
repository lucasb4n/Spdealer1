package br.com.spdealer.service;

import br.com.spdealer.service.FormMetadataService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Service para Engenharia Reversa de Formulários Existentes
 * Extrai estrutura de formulários React e salva no FORMBUILD
 * 
 * @author FORMBUILD
 * @since 07/01/2026
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReverseEngineerService {

    private final FormMetadataService formMetadataService;
    private final ObjectMapper objectMapper;

    /**
     * Fazer engenharia reversa do formulário de Usuários
     * Baseado nas telas: Grid de listagem + Modal de edição
     */
    @Transactional
    public Map<String, Object> reverseEngineerUsuariosForm() {
        log.info("Iniciando engenharia reversa: Formulário de Usuários");

        String formId = "FORM_USUARIOS";
        
        // 1. Criar formulário principal
        Map<String, Object> metadata = createUsuariosMetadata();
        
        formMetadataService.createForm(
            formId,
            "Cadastro de Usuarios",
            "Formulario de gerenciamento de usuarios do sistema",
            objectToJson(createSettings()),
            objectToJson(metadata)
        );

        // 2. Criar definição com visual_config (Grid + Modal)
        Map<String, Object> visualConfig = createUsuariosVisualConfig();
        Map<String, Object> dataConfig = createUsuariosDataConfig();
        
        formMetadataService.saveFormDefinition(
            formId,
            "Cadastro de Usuarios",
            "Listagem em AG-Grid + Modal de edicao",
            1,
            objectToJson(visualConfig),
            objectToJson(dataConfig)
        );

        // 3. Criar campos do formulário (Modal de Edição)
        createUsuariosFields(formId);

        // 4. Criar componentes (Grid + Botões)
        createUsuariosComponents(formId);

        log.info("Engenharia reversa concluída: {}", formId);
        
        return formMetadataService.findCompleteForm(formId);
    }

    /**
     * Criar metadados do formulário de usuários
     */
    private Map<String, Object> createUsuariosMetadata() {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("table", "users");
        metadata.put("primary_key", "id");
        metadata.put("source_file", "Usuarios.tsx");
        metadata.put("route", "/usuarios");
        metadata.put("icon", "users");
        metadata.put("module", "Parametros");
        metadata.put("permissions", Arrays.asList("usuarios.view", "usuarios.create", "usuarios.edit", "usuarios.delete"));
        return metadata;
    }

    /**
     * Criar settings gerais
     */
    private Map<String, Object> createSettings() {
        Map<String, Object> settings = new HashMap<>();
        settings.put("enable_search", true);
        settings.put("enable_filters", true);
        settings.put("enable_export", true);
        settings.put("pagination", true);
        settings.put("page_size", 20);
        return settings;
    }

    /**
     * Criar visual_config (Grid + Modal)
     */
    private Map<String, Object> createUsuariosVisualConfig() {
        Map<String, Object> config = new HashMap<>();
        
        // Layout da página
        config.put("layout_type", "grid_with_modal");
        config.put("page_title", "Cadastro de Usuarios");
        config.put("page_icon", "users");
        
        // KPIs
        List<Map<String, Object>> kpis = new ArrayList<>();
        kpis.add(createKPI("Total de Usuarios", "count(*)", "primary"));
        kpis.add(createKPI("Usuarios Ativos", "count(*) where status = 'Ativo'", "success"));
        kpis.add(createKPI("Usuarios Inativos", "count(*) where status = 'Inativo'", "secondary"));
        config.put("kpis", kpis);
        
        // SearchBar
        Map<String, Object> searchBar = new HashMap<>();
        searchBar.put("enabled", true);
        searchBar.put("placeholder", "Buscar por nome, login ou email...");
        searchBar.put("fields", Arrays.asList("name", "login", "email"));
        config.put("search_bar", searchBar);
        
        // Botões de ação
        List<Map<String, Object>> actions = new ArrayList<>();
        actions.add(createAction("new", "Novo Usuario", "primary", "plus"));
        config.put("actions", actions);
        
        // Filtros
        List<Map<String, Object>> filters = new ArrayList<>();
        filters.add(createFilter("status", "Status", "select", Arrays.asList("Todos os Status", "Ativo", "Inativo")));
        config.put("filters", filters);
        
        // Grid (AG-Grid)
        config.put("grid", createUsuariosGrid());
        
        // Modal de edição
        config.put("modal", createUsuariosModal());
        
        return config;
    }

    /**
     * Criar configuração do AG-Grid (seguindo padrão PADRAO_ESQUELETO_FORMULARIO.md)
     */
    private Map<String, Object> createUsuariosGrid() {
        Map<String, Object> grid = new HashMap<>();
        grid.put("enable_sorting", true);
        grid.put("enable_filtering", true);
        grid.put("row_selection", "single");
        grid.put("pagination", true);
        grid.put("page_size", 20);
        
        // Colunas do grid
        List<Map<String, Object>> columns = new ArrayList<>();
        
        // COLUNAS 1-N: Dados dinâmicos
        columns.add(createColumn("id", "ID", "number", 80, true, false));
        columns.add(createColumn("login", "Login", "text", 150, true, true));
        columns.add(createColumn("name", "Nome", "text", 200, true, true));
        columns.add(createColumn("email", "E-mail", "text", 220, true, true));
        columns.add(createColumn("celular", "Celular", "text", 130, true, true));
        columns.add(createColumn("cargo", "Cargo", "text", 180, true, true));
        columns.add(createColumn("status", "Status", "badge", 100, true, true));
        
        // ÚLTIMAS 2 COLUNAS: ✏️ Editar + 🗑️ Excluir (FIXAS À DIREITA)
        Map<String, Object> editCol = new HashMap<>();
        editCol.put("field", "edit");
        editCol.put("headerName", "✏️");
        editCol.put("type", "action");
        editCol.put("width", 60);
        editCol.put("pinned", "right");
        editCol.put("sortable", false);
        editCol.put("filter", false);
        editCol.put("action", "edit");
        editCol.put("icon", "pencil");
        editCol.put("variant", "primary");
        columns.add(editCol);
        
        Map<String, Object> deleteCol = new HashMap<>();
        deleteCol.put("field", "delete");
        deleteCol.put("headerName", "🗑️");
        deleteCol.put("type", "action");
        deleteCol.put("width", 60);
        deleteCol.put("pinned", "right");
        deleteCol.put("sortable", false);
        deleteCol.put("filter", false);
        deleteCol.put("action", "delete");
        deleteCol.put("icon", "trash");
        deleteCol.put("variant", "danger");
        columns.add(deleteCol);
        
        grid.put("columns", columns);
        
        return grid;
    }

    /**
     * Criar configuração do Modal
     */
    private Map<String, Object> createUsuariosModal() {
        Map<String, Object> modal = new HashMap<>();
        modal.put("title", "Editar Usuario");
        modal.put("size", "lg");
        modal.put("draggable", true);
        modal.put("resizable", true);
        
        // Layout do modal (2 colunas)
        modal.put("layout", "two_columns");
        modal.put("gap", "1rem");
        
        return modal;
    }

    /**
     * Criar data_config (queries, endpoints)
     */
    private Map<String, Object> createUsuariosDataConfig() {
        Map<String, Object> config = new HashMap<>();
        
        // Endpoints
        Map<String, Object> endpoints = new HashMap<>();
        endpoints.put("list", "/api/usuarios");
        endpoints.put("get", "/api/usuarios/{id}");
        endpoints.put("create", "/api/usuarios");
        endpoints.put("update", "/api/usuarios/{id}");
        endpoints.put("delete", "/api/usuarios/{id}");
        config.put("endpoints", endpoints);
        
        // Query principal
        config.put("list_query", "SELECT id, login, name, email, celular, cargo, status FROM users ORDER BY name");
        
        return config;
    }

    /**
     * Criar campos do formulário (Modal de Edição)
     */
    private void createUsuariosFields(String formId) {
        log.info("Criando campos do formulário: {}", formId);
        
        int position = 0;
        
        // Nome *
        createField(formId, "name", "Nome", "text", position++, 
            createProps("col-md-6", "Digite o nome completo", true),
            createValidation(true, 3, 100, null));
        
        // Login *
        createField(formId, "login", "Login", "text", position++,
            createProps("col-md-6", "Digite o login", true),
            createValidation(true, 3, 50, null));
        
        // Email *
        createField(formId, "email", "Email", "email", position++,
            createProps("col-md-6", "Digite o email", true),
            createValidation(true, 5, 100, "email"));
        
        // Celular
        createField(formId, "celular", "Celular", "text", position++,
            createProps("col-md-6", "Somente numeros", false),
            createValidation(false, 0, 15, "phone"));
        
        // Nova Senha
        createField(formId, "password", "Nova Senha", "password", position++,
            createProps("col-md-6", "Deixe em branco para manter a atual", false),
            createValidation(false, 6, 50, null));
        
        // Confirmar Nova Senha
        createField(formId, "password_confirmation", "Confirmar Nova Senha", "password", position++,
            createProps("col-md-6", "Confirme a senha", false),
            createValidation(false, 6, 50, "match:password"));
        
        // Grupo *
        createField(formId, "group_id", "Grupo", "select", position++,
            createProps("col-md-6", "Selecione um grupo", true, "/api/grupos"),
            createValidation(true, 0, 0, null));
        
        // Status
        createField(formId, "status", "Status", "select", position++,
            createProps("col-md-6", null, false, null, Arrays.asList("Ativo", "Inativo")),
            createValidation(false, 0, 0, null));
        
        // Observações
        createField(formId, "observacoes", "Observacoes", "textarea", position++,
            createProps("col-md-12", "Observacoes sobre o usuario...", false),
            createValidation(false, 0, 500, null));
        
        log.info("Campos criados: {}", position);
    }

    /**
     * Criar componentes (Botões especiais, etc)
     */
    private void createUsuariosComponents(String formId) {
        log.info("Criando componentes do formulário: {}", formId);
        
        int order = 0;
        
        // Botão "Buscar rotina"
        createComponent(formId, "btn_buscar_rotina", "button", "Buscar rotina",
            createButtonProps("secondary", "search", "buscarRotina()"),
            null, null, order++);
        
        // Botão "Selecionar tudo"
        createComponent(formId, "btn_selecionar_tudo", "button", "Selecionar tudo",
            createButtonProps("outline-primary", "check-all", "selecionarTudo()"),
            null, null, order++);
        
        // Botão "Editar" (submit do modal)
        createComponent(formId, "btn_submit", "button", "Editar",
            createButtonProps("primary", "save", "handleSubmit()"),
            null, null, order++);
        
        log.info("Componentes criados: {}", order);
    }

    // ========== Métodos Auxiliares ==========

    private void createField(String formId, String name, String label, String type, int position,
                             String props, String validations) {
        String fieldId = formId + "_FIELD_" + name.toUpperCase();
        formMetadataService.createFormField(fieldId, formId, name, label, type, position, props, validations);
    }

    private void createComponent(String formId, String componentId, String type, String label,
                                  String properties, String position, String validation, int order) {
        String fullId = formId + "_COMP_" + componentId.toUpperCase();
        formMetadataService.createFormComponent(fullId, formId, type, label, properties, position, validation, order);
    }

    private Map<String, Object> createKPI(String label, String query, String variant) {
        Map<String, Object> kpi = new HashMap<>();
        kpi.put("label", label);
        kpi.put("query", query);
        kpi.put("variant", variant);
        return kpi;
    }

    private Map<String, Object> createAction(String id, String label, String variant, String icon) {
        Map<String, Object> action = new HashMap<>();
        action.put("id", id);
        action.put("label", label);
        action.put("variant", variant);
        action.put("icon", icon);
        return action;
    }

    private Map<String, Object> createFilter(String field, String label, String type, List<String> options) {
        Map<String, Object> filter = new HashMap<>();
        filter.put("field", field);
        filter.put("label", label);
        filter.put("type", type);
        filter.put("options", options);
        return filter;
    }

    private Map<String, Object> createColumn(String field, String headerName, String type, int width,
                                              boolean sortable, boolean filterable) {
        Map<String, Object> column = new HashMap<>();
        column.put("field", field);
        column.put("headerName", headerName);
        column.put("type", type);
        column.put("width", width);
        column.put("sortable", sortable);
        column.put("filter", filterable);
        return column;
    }

    private Map<String, Object> createRowAction(String id, String label, String icon, String variant) {
        Map<String, Object> action = new HashMap<>();
        action.put("id", id);
        action.put("label", label);
        action.put("icon", icon);
        action.put("variant", variant);
        return action;
    }

    private String createProps(String width, String placeholder, boolean required) {
        return createProps(width, placeholder, required, null, null);
    }

    private String createProps(String width, String placeholder, boolean required, String dataSource) {
        return createProps(width, placeholder, required, dataSource, null);
    }

    private String createProps(String width, String placeholder, boolean required, String dataSource, List<String> options) {
        Map<String, Object> props = new HashMap<>();
        props.put("width", width);
        if (placeholder != null) props.put("placeholder", placeholder);
        props.put("required", required);
        if (dataSource != null) props.put("dataSource", dataSource);
        if (options != null) props.put("options", options);
        return objectToJson(props);
    }

    private String createValidation(boolean required, int minLength, int maxLength, String pattern) {
        Map<String, Object> validation = new HashMap<>();
        validation.put("required", required);
        if (minLength > 0) validation.put("minLength", minLength);
        if (maxLength > 0) validation.put("maxLength", maxLength);
        if (pattern != null) validation.put("pattern", pattern);
        return objectToJson(validation);
    }

    private String createButtonProps(String variant, String icon, String onClick) {
        Map<String, Object> props = new HashMap<>();
        props.put("variant", variant);
        props.put("icon", icon);
        props.put("onClick", onClick);
        return objectToJson(props);
    }

    private String objectToJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Erro ao converter objeto para JSON", e);
            return "{}";
        }
    }
}
