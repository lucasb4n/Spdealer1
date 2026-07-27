package br.com.spdealer.repository;

import br.com.spdealer.model.DashboardQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DashboardQueryRepository extends JpaRepository<DashboardQuery, Long> {
    
    /**
     * Buscar queries públicas
     */
    List<DashboardQuery> findByIsPublicTrueOrderByNameAsc();
    
    /**
     * Buscar queries criadas por um usuário
     */
    List<DashboardQuery> findByCreatedByOrderByNameAsc(Long userId);
    
    /**
     * Buscar queries disponíveis para um usuário (públicas + próprias)
     */
    @Query("SELECT q FROM DashboardQuery q WHERE q.isPublic = true OR q.createdBy = :userId ORDER BY q.isPublic DESC, q.name ASC")
    List<DashboardQuery> findAvailableForUser(@Param("userId") Long userId);
    
    /**
     * Buscar query por ID verificando permissão do usuário
     */
    @Query(value = "SELECT * FROM dashboard_queries q WHERE q.id = :queryId AND (q.is_public = true OR q.created_by = :userId OR JSON_CONTAINS(q.allowed_users, CAST(:userId AS JSON)))", nativeQuery = true)
    Optional<DashboardQuery> findByIdWithPermission(@Param("queryId") Long queryId, @Param("userId") Long userId);
    
    /**
     * Buscar queries por nome (like)
     */
    @Query("SELECT q FROM DashboardQuery q WHERE (q.isPublic = true OR q.createdBy = :userId) AND LOWER(q.name) LIKE LOWER(CONCAT('%', :name, '%')) ORDER BY q.isPublic DESC, q.name ASC")
    List<DashboardQuery> findByNameContainingAvailableForUser(@Param("name") String name, @Param("userId") Long userId);
    
    /**
     * Verificar se usuário tem permissão para usar uma query
     */
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM dashboard_queries q WHERE q.id = :queryId AND (q.is_public = true OR q.created_by = :userId OR JSON_CONTAINS(q.allowed_users, CAST(:userId AS JSON)))", nativeQuery = true)
    boolean hasPermission(@Param("queryId") Long queryId, @Param("userId") Long userId);
    
    /**
     * Contar queries por usuário
     */
    long countByCreatedBy(Long userId);
    
    /**
     * Contar queries públicas
     */
    long countByIsPublicTrue();
    
    /**
     * Buscar queries mais recentes (últimas modificadas)
     */
    @Query("SELECT q FROM DashboardQuery q WHERE q.isPublic = true OR q.createdBy = :userId ORDER BY q.updatedAt DESC")
    List<DashboardQuery> findRecentForUser(@Param("userId") Long userId);
}