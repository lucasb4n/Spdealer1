package br.com.spdealer.repository;

import br.com.spdealer.model.DashboardWidget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DashboardWidgetRepository extends JpaRepository<DashboardWidget, Long> {
    
    /**
     * Buscar todos os widgets visíveis de um dashboard ordenados por Z-index
     */
    @Query("SELECT w FROM DashboardWidget w WHERE w.dashboardId = :dashboardId AND w.isVisible = true ORDER BY w.zIndex ASC")
    List<DashboardWidget> findByDashboardIdAndIsVisibleTrueOrderByZIndexAsc(@Param("dashboardId") Long dashboardId);
    
    /**
     * Buscar todos os widgets de um dashboard (incluindo invisíveis)
     */
    @Query("SELECT w FROM DashboardWidget w WHERE w.dashboardId = :dashboardId ORDER BY w.zIndex ASC")
    List<DashboardWidget> findByDashboardIdOrderByZIndexAsc(@Param("dashboardId") Long dashboardId);
    
    /**
     * Buscar widgets ordenados por posição Y (para layout de linhas)
     */
    List<DashboardWidget> findByDashboardIdOrderByPositionY(Long dashboardId);
    
    /**
     * Buscar widget por ID único dentro do dashboard
     */
    Optional<DashboardWidget> findByDashboardIdAndWidgetId(Long dashboardId, String widgetId);
    
    /**
     * Verificar se já existe widget com este ID no dashboard
     */
    boolean existsByDashboardIdAndWidgetId(Long dashboardId, String widgetId);
    
    /**
     * Buscar widgets por tipo
     */
    List<DashboardWidget> findByDashboardIdAndWidgetTypeAndIsVisibleTrue(Long dashboardId, DashboardWidget.WidgetType widgetType);
    
    /**
     * Buscar widgets em uma região específica (útil para detecção de colisão)
     */
    @Query("SELECT w FROM DashboardWidget w WHERE w.dashboardId = :dashboardId AND w.isVisible = true AND " +
           "w.positionX < :maxX AND (w.positionX + w.width) > :minX AND " +
           "w.positionY < :maxY AND (w.positionY + w.height) > :minY")
    List<DashboardWidget> findWidgetsInRegion(@Param("dashboardId") Long dashboardId,
                                             @Param("minX") Integer minX, @Param("maxX") Integer maxX,
                                             @Param("minY") Integer minY, @Param("maxY") Integer maxY);
    
    /**
     * Buscar próximo Z-index disponível
     */
    @Query("SELECT COALESCE(MAX(w.zIndex), 0) + 1 FROM DashboardWidget w WHERE w.dashboardId = :dashboardId")
    Integer getNextZIndex(@Param("dashboardId") Long dashboardId);
    
    /**
     * Contar widgets por tipo em um dashboard
     */
    long countByDashboardIdAndWidgetTypeAndIsVisibleTrue(Long dashboardId, DashboardWidget.WidgetType widgetType);
    
    /**
     * Buscar widgets não bloqueados (editáveis)
     */
    @Query("SELECT w FROM DashboardWidget w WHERE w.dashboardId = :dashboardId AND w.isLocked = false AND w.isVisible = true ORDER BY w.zIndex ASC")
    List<DashboardWidget> findByDashboardIdAndIsLockedFalseAndIsVisibleTrueOrderByZIndexAsc(@Param("dashboardId") Long dashboardId);
    
    /**
     * Deletar todos os widgets de um dashboard (cascade)
     */
    void deleteByDashboardId(Long dashboardId);
}