package br.com.spdealer.controller;

import br.com.spdealer.service.ParametrosGeraisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;

/**
 * ParametrosGeraisController
 *
 * Endpoint para gerenciar Parâmetros Gerais da Empresa (tabela MASGER)
 */
@RestController
@RequestMapping("/api/parametros-gerais")
public class ParametrosGeraisController {

    private static final Logger logger = LoggerFactory.getLogger(ParametrosGeraisController.class);

    @Autowired
    private ParametrosGeraisService parametrosGeraisService;

    /**
     * GET /api/parametros-gerais
     * Retorna os parâmetros gerais da empresa (primeira linha)
     */
    @GetMapping
    public ResponseEntity<?> getParametrosGerais() {
        try {
            logger.info("GET /api/parametros-gerais - Buscando parâmetros gerais");
            Map<String, Object> parametros = parametrosGeraisService.getParametrosGerais();
            if (parametros == null || parametros.isEmpty()) {
                logger.warn("Parâmetros gerais não encontrados");
                return ResponseEntity.status(404).body(new ErrorResponse("Parâmetros gerais não encontrados"));
            }
            logger.debug("Parâmetros gerais retornados: {} campos", parametros.size());
            return ResponseEntity.ok(parametros);
        } catch (Exception e) {
            logger.error("Erro ao buscar parâmetros gerais: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao buscar parâmetros: " + e.getMessage()));
        }
    }

    /**
     * GET /api/parametros-gerais/masger
     * Alias para /api/parametros-gerais (compatibilidade com frontend)
     */
    @GetMapping("/masger")
    public ResponseEntity<?> getParametrosMasger() {
        logger.info("GET /api/parametros-gerais/masger - Redirecionando para getParametrosGerais()");
        return getParametrosGerais();
    }

    /**
     * GET /api/parametros-gerais/masfor
     * Retorna os tipos de fornecedores da tabela MASFOR (banco 192.168.10.100)
     */
    @GetMapping("/masfor")
    public ResponseEntity<?> getParametrosMasfor() {
        try {
            logger.info("GET /api/parametros-gerais/masfor - Buscando tipos de fornecedores");
            Map<String, Object> parametros = parametrosGeraisService.getParametrosMasfor();
            if (parametros == null || parametros.isEmpty()) {
                logger.warn("Parâmetros de MASFOR não encontrados");
                return ResponseEntity.status(404).body(new ErrorResponse("Tipos de fornecedores não encontrados"));
            }
            logger.debug("Parâmetros de MASFOR retornados: {} campos", parametros.size());
            return ResponseEntity.ok(parametros);
        } catch (Exception e) {
            logger.error("Erro ao buscar tipos de fornecedores: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao buscar tipos de fornecedores: " + e.getMessage()));
        }
    }

    /**
     * GET /api/parametros-gerais/masfor/list
     * Retorna TODOS os tipos de fornecedores da tabela MASFOR
     */
    @GetMapping("/masfor/list")
    public ResponseEntity<?> listarTodosTiposFornecedores() {
        try {
            logger.info("GET /api/parametros-gerais/masfor/list - Listando todos os tipos de fornecedores");
            java.util.List<Map<String, Object>> tipos = parametrosGeraisService.listarTodosTiposFornecedores();
            logger.debug("Retornados {} tipos de fornecedores", tipos.size());
            return ResponseEntity.ok(tipos);
        } catch (Exception e) {
            logger.error("Erro ao listar tipos de fornecedores: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao listar tipos de fornecedores: " + e.getMessage()));
        }
    }

    /**
     * GET /api/parametros-gerais/masfor/{id}
     * Busca um tipo de fornecedor específico por ID
     */
    @GetMapping("/masfor/{id}")
    public ResponseEntity<?> getTipoFornecedorPorId(@PathVariable Integer id) {
        try {
            logger.info("GET /api/parametros-gerais/masfor/{} - Buscando tipo de fornecedor", id);
            Map<String, Object> tipo = parametrosGeraisService.getTipoFornecedorPorId(id);
            if (tipo == null || tipo.isEmpty()) {
                logger.warn("Tipo de fornecedor com ID {} não encontrado", id);
                return ResponseEntity.status(404).body(new ErrorResponse("Tipo de fornecedor não encontrado"));
            }
            return ResponseEntity.ok(tipo);
        } catch (Exception e) {
            logger.error("Erro ao buscar tipo de fornecedor {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao buscar tipo de fornecedor: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/parametros-gerais/masfor/{id}
     * Atualiza um tipo de fornecedor específico
     */
    @PutMapping("/masfor/{id}")
    public ResponseEntity<?> updateTipoFornecedor(@PathVariable Integer id, @RequestBody Map<String, Object> parametros) {
        try {
            logger.info("PUT /api/parametros-gerais/masfor/{} - Atualizando tipo de fornecedor", id);
            Map<String, Object> updated = parametrosGeraisService.updateTipoFornecedor(id, parametros);
            if (updated == null || updated.isEmpty()) {
                logger.warn("Tipo de fornecedor com ID {} não encontrado para atualização", id);
                return ResponseEntity.status(404).body(new ErrorResponse("Tipo de fornecedor não encontrado"));
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Erro ao atualizar tipo de fornecedor {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao atualizar tipo de fornecedor: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/parametros-gerais/masfor
     * Atualiza os tipos de fornecedores (mantido para compatibilidade)
     * @deprecated Use PUT /api/parametros-gerais/masfor/{id} para atualizar um tipo específico
     */
    @PutMapping("/masfor")
    @Deprecated
    public ResponseEntity<?> updateParametrosMasfor(@RequestBody Map<String, Object> parametros) {
        try {
            logger.info("PUT /api/parametros-gerais/masfor - Atualizando {} campos (método deprecated)", parametros.size());
            Map<String, Object> updated = parametrosGeraisService.updateParametrosMasfor(parametros);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Erro ao atualizar tipos de fornecedores: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao atualizar tipos de fornecedores: " + e.getMessage()));
        }
    }

    /**
     * GET /api/parametros-gerais/masdep/list
     * Retorna TODOS os departamentos/centro de custos da tabela MASDEP
     * Banco: 100.126.166.63 (dados de produção)
     */
    @GetMapping("/masdep/list")
    public ResponseEntity<?> listarTodosDepartamentos() {
        try {
            logger.info("GET /api/parametros-gerais/masdep/list - Listando todos os departamentos");
            java.util.List<Map<String, Object>> departamentos = parametrosGeraisService.listarTodosDepartamentos();
            logger.debug("Retornados {} departamentos", departamentos.size());
            return ResponseEntity.ok(departamentos);
        } catch (Exception e) {
            logger.error("Erro ao listar departamentos: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao listar departamentos: " + e.getMessage()));
        }
    }

    /**
     * GET /api/parametros-gerais/masdep/{filial}/{codigo}
     * Busca um departamento específico por filial e código
     * Banco: 100.126.166.63
     */
    @GetMapping("/masdep/{filial}/{codigo}")
    public ResponseEntity<?> getDepartamentoPorChave(@PathVariable String filial, @PathVariable Integer codigo) {
        try {
            logger.info("GET /api/parametros-gerais/masdep/{}/{} - Buscando departamento", filial, codigo);
            Map<String, Object> dept = parametrosGeraisService.getDepartamentoPorChave(filial, codigo);
            if (dept == null || dept.isEmpty()) {
                logger.warn("Departamento com filial {} e código {} não encontrado", filial, codigo);
                return ResponseEntity.status(404).body(new ErrorResponse("Departamento não encontrado"));
            }
            return ResponseEntity.ok(dept);
        } catch (Exception e) {
            logger.error("Erro ao buscar departamento {}/{}: {}", filial, codigo, e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao buscar departamento: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/parametros-gerais/masdep/{filial}/{codigo}
     * Atualiza um departamento específico
     * Banco: 100.126.166.63
     */
    @PutMapping("/masdep/{filial}/{codigo}")
    public ResponseEntity<?> updateDepartamento(@PathVariable String filial, @PathVariable Integer codigo, @RequestBody Map<String, Object> parametros) {
        try {
            logger.info("PUT /api/parametros-gerais/masdep/{}/{} - Atualizando departamento", filial, codigo);
            Map<String, Object> updated = parametrosGeraisService.updateDepartamento(filial, codigo, parametros);
            if (updated == null || updated.isEmpty()) {
                logger.warn("Departamento com filial {} e código {} não encontrado para atualização", filial, codigo);
                return ResponseEntity.status(404).body(new ErrorResponse("Departamento não encontrado"));
            }
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("Erro ao atualizar departamento {}/{}: {}", filial, codigo, e.getMessage(), e);
            return ResponseEntity.status(500).body(new ErrorResponse("Erro ao atualizar departamento: " + e.getMessage()));
        }
    }

    // Classe interna para resposta de erro
    public static class ErrorResponse {
        public String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }
    }
}
