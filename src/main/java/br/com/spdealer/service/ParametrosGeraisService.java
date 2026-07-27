package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * ParametrosGeraisService
 * 
 * Service para gerenciar Parâmetros Gerais da Empresa (tabela MASGER)
 * Usa JdbcTemplate para suportar campos dinâmicos e não mapeados no modelo JPA
 */
@Service
public class ParametrosGeraisService {

    private static final Logger log = LoggerFactory.getLogger(ParametrosGeraisService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Busca os parâmetros gerais (primeira linha de MASGER)
     * Retorna um Map com todos os campos
     */
    public Map<String, Object> getParametrosGerais() {
        try {
            String sql = "SELECT * FROM masger LIMIT 1";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            
            if (result == null || result.isEmpty()) {
                log.warn("Nenhum registro de parâmetros gerais encontrado em MASGER");
                return new HashMap<>();
            }
            
            log.debug("Parâmetros gerais carregados com sucesso");
            return result.get(0);
        } catch (Exception e) {
            log.error("Erro ao buscar parâmetros gerais: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar parâmetros gerais", e);
        }
    }

    /**
     * Atualiza os parâmetros gerais
     * Aceita um Map com os campos a atualizar
     */
    public Map<String, Object> updateParametrosGerais(Map<String, Object> parametros) {
        try {
            if (parametros == null || parametros.isEmpty()) {
                throw new IllegalArgumentException("Parâmetros não podem ser nulos ou vazios");
            }

            // Construir a query UPDATE dinamicamente
            StringBuilder sql = new StringBuilder("UPDATE masger SET ");
            java.util.List<Object> valores = new java.util.ArrayList<>();
            
            int count = 0;
            for (Map.Entry<String, Object> entry : parametros.entrySet()) {
                if (count > 0) {
                    sql.append(", ");
                }
                sql.append(entry.getKey()).append(" = ?");
                valores.add(entry.getValue());
                count++;
            }
            
            // Sempre update a primeira linha (NUMEMPR_GER = 1 por padrão)
            sql.append(" WHERE NUMEMPR_GER = 1 LIMIT 1");
            
            int rowsAffected = jdbcTemplate.update(sql.toString(), valores.toArray());
            
            if (rowsAffected == 0) {
                log.warn("Nenhuma linha foi atualizada. Tentando inserir novo registro.");
                // Se não encontrou, insere um novo registro
                return insertParametrosGerais(parametros);
            }
            
            log.info("Parâmetros gerais atualizados com sucesso. Linhas afetadas: {}", rowsAffected);
            
            // Retorna os parâmetros atualizados
            return getParametrosGerais();
        } catch (Exception e) {
            log.error("Erro ao atualizar parâmetros gerais: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao atualizar parâmetros gerais", e);
        }
    }

    /**
     * Insere um novo registro de parâmetros (fallback se não existir)
     */
    private Map<String, Object> insertParametrosGerais(Map<String, Object> parametros) {
        try {
            parametros.putIfAbsent("NUMEMPR_GER", 1);
            
            StringBuilder sql = new StringBuilder("INSERT INTO masger (");
            StringBuilder values = new StringBuilder("VALUES (");
            java.util.List<Object> valores = new java.util.ArrayList<>();
            
            int count = 0;
            for (Map.Entry<String, Object> entry : parametros.entrySet()) {
                if (count > 0) {
                    sql.append(", ");
                    values.append(", ");
                }
                sql.append(entry.getKey());
                values.append("?");
                valores.add(entry.getValue());
                count++;
            }
            
            sql.append(") ").append(values.append(")"));
            
            int rowsAffected = jdbcTemplate.update(sql.toString(), valores.toArray());
            log.info("Novo registro de parâmetros inserido. Linhas afetadas: {}", rowsAffected);
            
            return getParametrosGerais();
        } catch (Exception e) {
            log.error("Erro ao inserir parâmetros gerais: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao inserir parâmetros gerais", e);
        }
    }

    /**
     * ✅ NOVO: Busca os parâmetros de tipos de fornecedores da tabela MASFOR (banco 192.168.10.100)
     * 
     * @return Map com todos os campos da primeira linha de MASFOR (192.168.10.100:erp)
     */
    public Map<String, Object> getParametrosMasfor() {
        try {
            // Query SELECT * FROM masfor - Busca primeira linha com todos os campos
            String sql = "SELECT * FROM masfor LIMIT 1";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            
            if (result == null || result.isEmpty()) {
                log.warn("Nenhum registro encontrado na tabela MASFOR");
                return new HashMap<>();
            }
            
            Map<String, Object> masforData = result.get(0);
            log.debug("Parâmetros de MASFOR carregados com sucesso. Total de campos: {}", masforData.size());
            
            return masforData;
        } catch (Exception e) {
            log.error("Erro ao buscar parâmetros de MASFOR: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar parâmetros de MASFOR", e);
        }
    }

    /**
     * Atualiza os parâmetros de tipos de fornecedores (MASFOR)
     * 
     * @param parametros Map com os campos a atualizar
     * @return Map com os parâmetros atualizados
     */
    public Map<String, Object> updateParametrosMasfor(Map<String, Object> parametros) {
        try {
            if (parametros == null || parametros.isEmpty()) {
                throw new IllegalArgumentException("Parâmetros não podem ser nulos ou vazios");
            }

            // Construir a query UPDATE dinamicamente
            StringBuilder sql = new StringBuilder("UPDATE masfor SET ");
            java.util.List<Object> valores = new java.util.ArrayList<>();
            
            int count = 0;
            for (Map.Entry<String, Object> entry : parametros.entrySet()) {
                if (count > 0) {
                    sql.append(", ");
                }
                sql.append(entry.getKey()).append(" = ?");
                valores.add(entry.getValue());
                count++;
            }
            
            // Sempre update a primeira linha
            sql.append(" LIMIT 1");
            
            int rowsAffected = jdbcTemplate.update(sql.toString(), valores.toArray());
            
            if (rowsAffected == 0) {
                log.warn("Nenhuma linha foi atualizada em MASFOR. Tentando inserir novo registro.");
                // Se não encontrou, insere um novo registro
                return insertParametrosMasfor(parametros);
            }
            
            log.info("Parâmetros de MASFOR atualizados com sucesso. Linhas afetadas: {}", rowsAffected);
            
            // Retorna os parâmetros atualizados
            return getParametrosMasfor();
        } catch (Exception e) {
            log.error("Erro ao atualizar parâmetros de MASFOR: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao atualizar parâmetros de MASFOR", e);
        }
    }

    /**
     * NOVO: Lista TODOS os tipos de fornecedores da tabela MASFOR
     * 
     * @return Lista de Maps com todos os tipos de fornecedores
     */
    public List<Map<String, Object>> listarTodosTiposFornecedores() {
        try {
            String sql = "SELECT tipo_for, descr_for FROM masfor ORDER BY tipo_for";
            List<Map<String, Object>> tipos = jdbcTemplate.queryForList(sql);
            log.info("Listados {} tipos de fornecedores da tabela MASFOR", tipos.size());
            return tipos;
        } catch (Exception e) {
            log.error("Erro ao listar tipos de fornecedores: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao listar tipos de fornecedores", e);
        }
    }

    /**
     * NOVO: Busca um tipo de fornecedor específico por ID
     * 
     * @param id O tipo_for (ID) do fornecedor
     * @return Map com os dados do tipo de fornecedor
     */
    public Map<String, Object> getTipoFornecedorPorId(Integer id) {
        try {
            String sql = "SELECT tipo_for, descr_for FROM masfor WHERE tipo_for = ?";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, id);
            
            if (result == null || result.isEmpty()) {
                log.warn("Tipo de fornecedor com ID {} não encontrado", id);
                return new HashMap<>();
            }
            
            log.debug("Tipo de fornecedor com ID {} carregado com sucesso", id);
            return result.get(0);
        } catch (Exception e) {
            log.error("Erro ao buscar tipo de fornecedor {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar tipo de fornecedor", e);
        }
    }

    /**
     * NOVO: Atualiza um tipo de fornecedor específico
     * 
     * @param id O tipo_for (ID) do fornecedor
     * @param parametros Map com os campos a atualizar (descr_for)
     * @return Map com os dados atualizados
     */
    public Map<String, Object> updateTipoFornecedor(Integer id, Map<String, Object> parametros) {
        try {
            if (parametros == null || parametros.isEmpty()) {
                throw new IllegalArgumentException("Parâmetros não podem ser nulos ou vazios");
            }

            // Construir a query UPDATE dinamicamente (apenas descr_for deve ser atualizado)
            String descricao = parametros.get("descr_for") != null ? 
                parametros.get("descr_for").toString() : null;
            
            if (descricao == null || descricao.trim().isEmpty()) {
                throw new IllegalArgumentException("descr_for não pode ser nulo ou vazio");
            }

            String sql = "UPDATE masfor SET descr_for = ? WHERE tipo_for = ?";
            int rowsAffected = jdbcTemplate.update(sql, descricao, id);
            
            if (rowsAffected == 0) {
                log.warn("Nenhuma linha foi atualizada para tipo_for = {}", id);
                return new HashMap<>();
            }
            
            log.info("Tipo de fornecedor {} atualizado com sucesso. Linhas afetadas: {}", id, rowsAffected);
            
            // Retorna o registro atualizado
            return getTipoFornecedorPorId(id);
        } catch (Exception e) {
            log.error("Erro ao atualizar tipo de fornecedor {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Erro ao atualizar tipo de fornecedor", e);
        }
    }

    /**
     * Insere um novo registro de tipos de fornecedores em MASFOR (fallback se não existir)
     */
    private Map<String, Object> insertParametrosMasfor(Map<String, Object> parametros) {
        try {
            StringBuilder sql = new StringBuilder("INSERT INTO masfor (");
            StringBuilder values = new StringBuilder("VALUES (");
            java.util.List<Object> valores = new java.util.ArrayList<>();
            
            int count = 0;
            for (Map.Entry<String, Object> entry : parametros.entrySet()) {
                if (count > 0) {
                    sql.append(", ");
                    values.append(", ");
                }
                sql.append(entry.getKey());
                values.append("?");
                valores.add(entry.getValue());
                count++;
            }
            
            sql.append(") ").append(values.append(")"));
            
            int rowsAffected = jdbcTemplate.update(sql.toString(), valores.toArray());
            log.info("Novo registro de MASFOR inserido. Linhas afetadas: {}", rowsAffected);
            
            return getParametrosMasfor();
        } catch (Exception e) {
            log.error("Erro ao inserir parâmetros de MASFOR: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao inserir parâmetros de MASFOR", e);
        }
    }

    // ============================================================================
    // DEPARTAMENTOS (MASDEP) - Banco 100.126.166.63
    // ============================================================================

    /**
     * Lista todos os departamentos da tabela MASDEP
     * Banco: 100.126.166.63:3306 (produção - dados)
     */
    public List<Map<String, Object>> listarTodosDepartamentos() {
        try {
            String sql = "SELECT * FROM masdep ORDER BY filial_dep, codigo_dep";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql);
            log.info("Listados {} departamentos de MASDEP", result.size());
            return result;
        } catch (Exception e) {
            log.error("Erro ao listar departamentos: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao listar departamentos", e);
        }
    }

    /**
     * Busca um departamento específico por filial e código
     * Banco: 100.126.166.63
     */
    public Map<String, Object> getDepartamentoPorChave(String filial, Integer codigo) {
        try {
            String sql = "SELECT * FROM masdep WHERE filial_dep = ? AND codigo_dep = ?";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, filial, codigo);
            
            if (result == null || result.isEmpty()) {
                log.warn("Departamento com filial {} e código {} não encontrado", filial, codigo);
                return new HashMap<>();
            }
            
            log.debug("Departamento {}/{} encontrado", filial, codigo);
            return result.get(0);
        } catch (Exception e) {
            log.error("Erro ao buscar departamento {}/{}: {}", filial, codigo, e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar departamento", e);
        }
    }

    /**
     * Atualiza um departamento específico
     * Banco: 100.126.166.63
     */
    public Map<String, Object> updateDepartamento(String filial, Integer codigo, Map<String, Object> parametros) {
        try {
            if (parametros == null || parametros.isEmpty()) {
                throw new IllegalArgumentException("Parâmetros não podem ser nulos ou vazios");
            }

            // Construir UPDATE dinamicamente
            StringBuilder sql = new StringBuilder("UPDATE masdep SET ");
            java.util.List<Object> valores = new java.util.ArrayList<>();
            int count = 0;
            
            for (Map.Entry<String, Object> entry : parametros.entrySet()) {
                String campo = entry.getKey();
                // Ignorar campos de chave primária
                if ("filial_dep".equals(campo) || "codigo_dep".equals(campo)) continue;
                
                if (count > 0) sql.append(", ");
                sql.append(campo).append(" = ?");
                valores.add(entry.getValue());
                count++;
            }
            
            if (count == 0) {
                log.warn("Nenhum campo para atualizar em masdep");
                return getDepartamentoPorChave(filial, codigo);
            }
            
            sql.append(" WHERE filial_dep = ? AND codigo_dep = ?");
            valores.add(filial);
            valores.add(codigo);
            
            int rowsAffected = jdbcTemplate.update(sql.toString(), valores.toArray());
            
            if (rowsAffected == 0) {
                log.warn("Departamento {}/{} não encontrado para atualização", filial, codigo);
                return new HashMap<>();
            }
            
            log.info("Departamento {}/{} atualizado com sucesso. Linhas afetadas: {}", filial, codigo, rowsAffected);
            return getDepartamentoPorChave(filial, codigo);
        } catch (Exception e) {
            log.error("Erro ao atualizar departamento {}/{}: {}", filial, codigo, e.getMessage(), e);
            throw new RuntimeException("Erro ao atualizar departamento", e);
        }
    }
}
