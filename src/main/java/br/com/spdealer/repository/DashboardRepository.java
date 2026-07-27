package br.com.spdealer.repository;

import br.com.spdealer.model.Dashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DashboardRepository extends JpaRepository<Dashboard, Long> {
    
    /**
     * Buscar todos os dashboards de um usuário
     */
    List<Dashboard> findByUserIdAndIsActiveTrue(Long userId);
    
    /**
     * Buscar dashboard padrão de um usuário
     */
    Optional<Dashboard> findByUserIdAndIsDefaultTrueAndIsActiveTrue(Long userId);
    
    /**
     * Buscar dashboard por ID e usuário (para segurança)
     */
    Optional<Dashboard> findByIdAndUserId(Long id, Long userId);
    
    /**
     * Verificar se existe dashboard padrão para o usuário
     */
    boolean existsByUserIdAndIsDefaultTrue(Long userId);
    
    /**
     * Buscar dashboard padrão de um usuário (para API REST)
     */
    Optional<Dashboard> findByUserIdAndIsDefaultTrue(Long userId);
    
    /**
     * Buscar dashboards do usuário ordenados por padrão primeiro
     */
    List<Dashboard> findByUserIdOrderByIsDefaultDesc(Long userId);
    
    /**
     * Buscar qualquer dashboard marcado como padrão global (sem filtrar por usuário)
     */
    Optional<Dashboard> findFirstByIsDefaultTrue();

    /**
     * Buscar dashboards por nome (like)
     */
    @Query("SELECT d FROM Dashboard d WHERE d.userId = :userId AND d.isActive = true AND LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Dashboard> findByUserIdAndNameContainingIgnoreCase(@Param("userId") Long userId, @Param("name") String name);
    
    /**
     * Contar dashboards ativos por usuário
     */
    long countByUserIdAndIsActiveTrue(Long userId);
    
    /**
     * Buscar dashboards recentes (últimos modificados)
     */
    @Query("SELECT d FROM Dashboard d WHERE d.userId = :userId AND d.isActive = true ORDER BY d.updatedAt DESC")
    List<Dashboard> findRecentByUserId(@Param("userId") Long userId);
    
    /**
     * Desativar dashboard padrão atual do usuário
     */
    @Query("UPDATE Dashboard d SET d.isDefault = false WHERE d.userId = :userId AND d.isDefault = true")
    void unsetDefaultDashboard(@Param("userId") Long userId);
}