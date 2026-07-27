
package br.com.spdealer.repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.spdealer.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    
    List<MenuItem> findByGroup_IdOrderByOrder(Long groupId);

    // Busca todos os itens ativos com o grupo já carregado (left join fetch para não excluir itens sem grupo)
    @Query("SELECT mi FROM MenuItem mi LEFT JOIN FETCH mi.group WHERE mi.active = :active ORDER BY mi.order")
    List<MenuItem> findByActiveWithGroupOrderByOrder(@Param("active") Boolean active);

    List<MenuItem> findByActiveOrderByOrder(Boolean active);

    List<MenuItem> findByGroup_IdAndActiveOrderByOrder(Long groupId, Boolean active);
}