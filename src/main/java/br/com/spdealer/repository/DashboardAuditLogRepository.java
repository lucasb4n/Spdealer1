package br.com.spdealer.repository;

import br.com.spdealer.model.DashboardAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DashboardAuditLogRepository extends JpaRepository<DashboardAuditLog, Long> {
    
    /**
     * Buscar log de auditoria por dashboard
     */
    List<DashboardAuditLog> findByDashboardIdOrderByCreatedAtDesc(Long dashboardId);
    
    /**
     * Buscar log de auditoria por widget
     */
    List<DashboardAuditLog> findByWidgetIdOrderByCreatedAtDesc(Long widgetId);
    
    /**
     * Buscar log de auditoria por usuário
     */
    List<DashboardAuditLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    /**
     * Buscar log de auditoria por período
     */
    List<DashboardAuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Buscar log de auditoria por dashboard e período
     */
    List<DashboardAuditLog> findByDashboardIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long dashboardId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Buscar log de auditoria por ação
     */
    List<DashboardAuditLog> findByActionOrderByCreatedAtDesc(DashboardAuditLog.AuditAction action);
    
    /**
     * Buscar atividade recente de um dashboard (últimas 24h)
     */
    @Query("SELECT a FROM DashboardAuditLog a WHERE a.dashboardId = :dashboardId AND a.createdAt >= :since ORDER BY a.createdAt DESC")
    List<DashboardAuditLog> findRecentActivity(@Param("dashboardId") Long dashboardId, @Param("since") LocalDateTime since);
    
    /**
     * Contar alterações por dashboard
     */
    long countByDashboardId(Long dashboardId);
    
    /**
     * Contar alterações por usuário
     */
    long countByUserId(Long userId);
    
    /**
     * Buscar últimas alterações de um usuário em dashboards
     */
    @Query("SELECT a FROM DashboardAuditLog a WHERE a.userId = :userId ORDER BY a.createdAt DESC")
    List<DashboardAuditLog> findUserActivity(@Param("userId") Long userId);
}