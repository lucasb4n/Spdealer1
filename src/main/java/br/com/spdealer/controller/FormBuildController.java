package br.com.spdealer.controller;

import br.com.spdealer.service.ReverseEngineerService;
import br.com.spdealer.service.FormMetadataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

/**
 * Controller para FORMBUILD - Engenharia Reversa
 * 
 * @author FORMBUILD
 * @since 07/01/2026
 */
@RestController
@RequestMapping("/api/formbuild")
@RequiredArgsConstructor
@Slf4j
public class FormBuildController {

    private final ReverseEngineerService reverseEngineerService;
    private final FormMetadataService formMetadataService;

    /**
     * GET /api/formbuild/available-forms
     * Listar formulários disponíveis (de menu_items)
     */
    @GetMapping("/available-forms")
    public ResponseEntity<?> getAvailableForms() {
        log.info("GET /api/formbuild/available-forms - Listar formulários disponíveis");
        
        List<Map<String, Object>> forms = formMetadataService.findAvailableFormsFromMenu();
        
        return ResponseEntity.ok(forms);
    }
    
    /**
     * POST /api/formbuild/reverse-engineer/usuarios
     * Fazer engenharia reversa do formulário de usuários
     */
    @PostMapping("/reverse-engineer/usuarios")
    public ResponseEntity<Map<String, Object>> reverseEngineerUsuarios() {
        log.info("POST /api/formbuild/reverse-engineer/usuarios - Engenharia reversa");
        
        Map<String, Object> result = reverseEngineerService.reverseEngineerUsuariosForm();
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * POST /api/formbuild/reverse-engineer
     * Fazer engenharia reversa de qualquer formulário
     */
    @PostMapping("/reverse-engineer")
    public ResponseEntity<?> reverseEngineerGeneric(@RequestBody Map<String, String> request) {
        String route = request.get("route");
        String formName = request.get("name");
        
        log.info("POST /api/formbuild/reverse-engineer - Route: {}, Name: {}", route, formName);
        
        // Por enquanto, apenas Usuarios está implementado
        if ("/usuarios".equals(route)) {
            Map<String, Object> result = reverseEngineerService.reverseEngineerUsuariosForm();
            return ResponseEntity.ok(result);
        }
        
        return ResponseEntity.badRequest().body(Map.of(
            "error", "Formulário ainda não suportado para engenharia reversa",
            "route", route,
            "supported", List.of("/usuarios")
        ));
    }

    /**
     * GET /api/formbuild/forms/{formId}
     * Buscar formulário completo por ID
     */
    @GetMapping("/forms/{formId}")
    public ResponseEntity<Map<String, Object>> getForm(@PathVariable String formId) {
        log.info("GET /api/formbuild/forms/{} - Buscar formulário", formId);
        try {
            Map<String, Object> form = formMetadataService.findCompleteForm(formId);
            return ResponseEntity.ok(form);
        } catch (RuntimeException re) {
            // Tratamento de caso de formulário não encontrado ou erro de negócio
            log.warn("Formulário não encontrado ou inválido: {} - {}", formId, re.getMessage());
            return ResponseEntity.status(404).body(Map.of(
                    "error", "Formulário não encontrado",
                    "detail", re.getMessage()
            ));
        } catch (Exception e) {
            // Erro genérico do servidor
            log.error("Erro ao carregar formulário {}: {}", formId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Erro interno ao carregar formulário",
                    "detail", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/formbuild/forms
     * Listar todos os formulários
     */
    @GetMapping("/forms")
    public ResponseEntity<?> listForms() {
        log.info("GET /api/formbuild/forms - Listar formulários");
        
        return ResponseEntity.ok(formMetadataService.findAllForms());
    }

    /**
     * POST /api/formbuild/forms
     * Criar novo formulário
     */
    @PostMapping("/forms")
    public ResponseEntity<Map<String, Object>> createForm(@RequestBody Map<String, Object> request) {
        log.info("POST /api/formbuild/forms - Criar formulário: {}", request.get("name"));
        // Validação básica do payload para evitar erros 500 por causa de nulls
        Object idObj = request.get("id");
        String formId = idObj != null ? String.valueOf(idObj) : null;
        Object nameObj = request.get("name");
        String name = nameObj != null ? String.valueOf(nameObj) : null;
        String description = request.get("description") != null ? String.valueOf(request.get("description")) : null;
        String settings = request.getOrDefault("settings", "{}") != null ? String.valueOf(request.getOrDefault("settings", "{}")) : "{}";
        String formMetadata = request.getOrDefault("form_metadata", "{}") != null ? String.valueOf(request.getOrDefault("form_metadata", "{}")) : "{}";

        if (name == null || name.isBlank()) {
            log.warn("POST /api/formbuild/forms - payload inválido: name ausente");
            return ResponseEntity.badRequest().body(Map.of("error", "Campo 'name' é obrigatório"));
        }

        // Gerar ID se não foi fornecido
        if (formId == null || formId.isBlank()) {
            formId = java.util.UUID.randomUUID().toString();
            log.info("POST /api/formbuild/forms - gerando id automático: {}", formId);
        }

        try {
            formMetadataService.createForm(formId, name, description, settings, formMetadata);
        } catch (Exception e) {
            log.error("Erro ao criar formulário {}: {}", formId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao salvar formulário: " + e.getMessage()
            ));
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "formId", formId,
            "message", "Formulário criado com sucesso"
        ));
    }

    /**
     * PUT /api/formbuild/forms/{formId}
     * Atualizar formulário existente
     */
    @PutMapping("/forms/{formId}")
    public ResponseEntity<Map<String, Object>> updateForm(
            @PathVariable String formId,
            @RequestBody Map<String, Object> request) {
        
        log.info("PUT /api/formbuild/forms/{} - Atualizar formulário", formId);
        
        String name = (String) request.get("name");
        String description = (String) request.get("description");
        String settings = (String) request.getOrDefault("settings", "{}");
        String formMetadata = (String) request.getOrDefault("form_metadata", "{}");
        
        formMetadataService.updateForm(formId, name, description, settings, formMetadata);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "formId", formId,
            "message", "Formulário atualizado com sucesso"
        ));
    }

    /**
     * POST /api/formbuild/forms/{formId}/fields
     * Adicionar campo ao formulário
     */
    @PostMapping("/forms/{formId}/fields")
    public ResponseEntity<Map<String, Object>> addField(
            @PathVariable String formId,
            @RequestBody Map<String, Object> request) {
        
        log.info("POST /api/formbuild/forms/{}/fields - Adicionar campo: {}", 
                formId, request.get("name"));
        
        String fieldId = (String) request.get("id");
        String name = (String) request.get("name");  // ← CRÍTICO: nome técnico do campo
        String label = (String) request.get("label");
        String type = (String) request.get("type");
        Integer position = (Integer) request.getOrDefault("position", 0);
        String props = (String) request.getOrDefault("props", "{}");
        String validations = (String) request.getOrDefault("validations", "{}");
        
        formMetadataService.createFormField(fieldId, formId, name, label, type, position, props, validations);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "fieldId", fieldId,
            "name", name,
            "message", "Campo adicionado com sucesso"
        ));
    }

    /**
     * PUT /api/formbuild/forms/{formId}/fields/{fieldId}
     * Atualizar campo do formulário
     */
    @PutMapping("/forms/{formId}/fields/{fieldId}")
    public ResponseEntity<Map<String, Object>> updateField(
            @PathVariable String formId,
            @PathVariable String fieldId,
            @RequestBody Map<String, Object> request) {
        
        log.info("PUT /api/formbuild/forms/{}/fields/{} - Atualizar campo: {}", 
                formId, fieldId, request.get("name"));
        
        String name = (String) request.get("name");  // ← CRÍTICO: nome técnico do campo
        String label = (String) request.get("label");
        String type = (String) request.get("type");
        Integer position = (Integer) request.getOrDefault("position", 0);
        String props = (String) request.getOrDefault("props", "{}");
        String validations = (String) request.getOrDefault("validations", "{}");
        
        formMetadataService.updateFormField(fieldId, name, label, type, position, props, validations);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "fieldId", fieldId,
            "name", name,
            "message", "Campo atualizado com sucesso"
        ));
    }

    /**
     * DELETE /api/formbuild/forms/{formId}/fields/{fieldId}
     * Remover campo do formulário
     */
    @DeleteMapping("/forms/{formId}/fields/{fieldId}")
    public ResponseEntity<Map<String, Object>> deleteField(
            @PathVariable String formId,
            @PathVariable String fieldId) {
        
        log.info("DELETE /api/formbuild/forms/{}/fields/{} - Remover campo", formId, fieldId);
        
        formMetadataService.deleteFormField(fieldId);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "fieldId", fieldId,
            "message", "Campo removido com sucesso"
        ));
    }
}
