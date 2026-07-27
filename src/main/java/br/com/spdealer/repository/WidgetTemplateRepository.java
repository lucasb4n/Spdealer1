package br.com.spdealer.repository;

import br.com.spdealer.model.WidgetTemplate;
import br.com.spdealer.model.DashboardWidget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WidgetTemplateRepository extends JpaRepository<WidgetTemplate, Long> {
    
    /**
     * Buscar templates públicos
     */
    List<WidgetTemplate> findByIsPublicTrueOrderByNameAsc();
    
    /**
     * Buscar templates por tipo
     */
    List<WidgetTemplate> findByWidgetTypeAndIsPublicTrueOrderByNameAsc(DashboardWidget.WidgetType widgetType);
    
    /**
     * Buscar templates criados por um usuário
     */
    List<WidgetTemplate> findByCreatedByOrderByNameAsc(Long userId);
    
    /**
     * Buscar templates disponíveis para um usuário (públicos + próprios)
     */
    @Query("SELECT t FROM WidgetTemplate t WHERE t.isPublic = true OR t.createdBy = :userId ORDER BY t.isPublic DESC, t.name ASC")
    List<WidgetTemplate> findAvailableForUser(@Param("userId") Long userId);
    
    /**
     * Buscar templates por tipo disponíveis para um usuário
     */
    @Query("SELECT t FROM WidgetTemplate t WHERE t.widgetType = :widgetType AND (t.isPublic = true OR t.createdBy = :userId) ORDER BY t.isPublic DESC, t.name ASC")
    List<WidgetTemplate> findByWidgetTypeAvailableForUser(@Param("widgetType") DashboardWidget.WidgetType widgetType, 
                                                         @Param("userId") Long userId);
    
    /**
     * Buscar templates por nome (like)
     */
    @Query("SELECT t FROM WidgetTemplate t WHERE (t.isPublic = true OR t.createdBy = :userId) AND LOWER(t.name) LIKE LOWER(CONCAT('%', :name, '%')) ORDER BY t.isPublic DESC, t.name ASC")
    List<WidgetTemplate> findByNameContainingAvailableForUser(@Param("name") String name, @Param("userId") Long userId);
    
    /**
     * Contar templates por usuário
     */
    long countByCreatedBy(Long userId);
    
    /**
     * Contar templates públicos por tipo
     */
    long countByWidgetTypeAndIsPublicTrue(DashboardWidget.WidgetType widgetType);
}