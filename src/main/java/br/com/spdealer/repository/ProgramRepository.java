package br.com.spdealer.repository;

import br.com.spdealer.model.Program;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ProgramRepository
 * 
 * Repository para acessar Programs (permissões) no banco de dados.
 * 
 * Padrão: Spring Data JPA
 * Tabela: programs
 * 
 * Exemplo de Programs:
 * - FLUXO.CAIXA.LISTAR (ID: 50)
 * - FLUXO.CAIXA.ESTRUTURA (ID: 51)
 * - PARAM.DASHBOARD_BUILDER (ID: 47)
 * 
 * Uso Típico:
 * 1. Buscar programa por código: programRepository.findByCodigo("FLUXO.CAIXA.LISTAR")
 * 2. Listar programas ativos: programRepository.findAllActive()
 * 3. Buscar por tipo: programRepository.findByTipo("M") // Menu programs
 */
@Repository
public interface ProgramRepository extends JpaRepository<Program, Long> {
    
    /**
     * Busca um programa pelo código único
     * 
     * @param codigo Código do programa (ex: "FLUXO.CAIXA.LISTAR")
     * @return Optional contendo o programa, ou vazio se não existir
     * 
     * Exemplo:
     * Optional<Program> program = programRepository.findByCodigo("FLUXO.CAIXA.LISTAR");
     */
    Optional<Program> findByCodigo(String codigo);
    
    /**
     * Busca todos os programas ativos
     * 
     * @return Lista de programas com ativo = true
     * 
     * Exemplo:
     * List<Program> ativos = programRepository.findAllActive();
     */
    @Query("SELECT p FROM Program p WHERE p.ativo = true ORDER BY p.ordem ASC")
    List<Program> findAllActive();
    
    /**
     * Busca programas por tipo (Menu, Report, Operation)
     * 
     * @param tipo Tipo do programa (M, R, O)
     * @return Lista de programas do tipo especificado
     * 
     * Exemplo:
     * List<Program> menus = programRepository.findByTipo("M");
     */
    @Query("SELECT p FROM Program p WHERE p.tipo = :tipo AND p.ativo = true ORDER BY p.ordem ASC")
    List<Program> findByTipo(@Param("tipo") String tipo);
    
    /**
     * Busca programas por padrão no código
     * Útil para buscar grupos de programas
     * 
     * @param codigoPattern Padrão de busca (ex: "FLUXO%" busca FLUXO.CAIXA.*, FLUXO.*)
     * @return Lista de programas que combinem com o padrão
     * 
     * Exemplo:
     * List<Program> fluxoPrograms = programRepository.findByCodigoPattern("FLUXO%");
     */
    @Query("SELECT p FROM Program p WHERE p.codigo LIKE :codigoPattern AND p.ativo = true ORDER BY p.codigo ASC")
    List<Program> findByCodigoPattern(@Param("codigoPattern") String codigoPattern);
    
    /**
     * Verifica se um programa com o código existe e está ativo
     * 
     * @param codigo Código do programa
     * @return true se existe e está ativo, false caso contrário
     * 
     * Exemplo:
     * boolean exists = programRepository.existsByCodigoAndAtivo("FLUXO.CAIXA.LISTAR", true);
     */
    boolean existsByCodigoAndAtivo(String codigo, Boolean ativo);
    
    /**
     * Busca todos os programas relacionados a um módulo
     * 
     * @param modulo Nome do módulo (primeira parte do código)
     *               Ex: "FLUXO" para buscar "FLUXO.CAIXA.LISTAR", "FLUXO.CAIXA.ESTRUTURA"
     * @return Lista de programas do módulo
     * 
     * Exemplo:
     * List<Program> fluxoModulos = programRepository.findByModulo("FLUXO%");
     */
    @Query("SELECT p FROM Program p WHERE p.codigo LIKE CONCAT(:modulo, '.%') AND p.ativo = true ORDER BY p.codigo ASC")
    List<Program> findByModulo(@Param("modulo") String modulo);
    
    /**
     * Conta quantos programas estão ativos
     * 
     * @return Número de programas ativos
     * 
     * Exemplo:
     * long count = programRepository.countActive();
     */
    @Query("SELECT COUNT(p) FROM Program p WHERE p.ativo = true")
    long countActive();
    
    /**
     * Busca programas com rota definida (aqueles que têm navegação)
     * 
     * @return Lista de programas com rota não nula
     * 
     * Exemplo:
     * List<Program> withRoute = programRepository.findWithRoute();
     */
    @Query("SELECT p FROM Program p WHERE p.rota IS NOT NULL AND p.ativo = true ORDER BY p.ordem ASC")
    List<Program> findWithRoute();
}
