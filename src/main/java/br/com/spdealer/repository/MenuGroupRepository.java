package br.com.spdealer.repository;

import br.com.spdealer.model.MenuGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface MenuGroupRepository extends JpaRepository<MenuGroup, Long> {
    List<MenuGroup> findByActiveOrderByOrder(Boolean active);
    List<MenuGroup> findAllByOrderByOrder();
    @EntityGraph(attributePaths = "items")
    List<MenuGroup> findAllWithItemsByOrderByOrder();
}