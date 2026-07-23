package br.com.spdealer.repository;

import br.com.spdealer.model.DashboardConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DashboardConfigRepository extends JpaRepository<DashboardConfig, Long> {
    
    /**
     * Busca a configuração de dashboard para um usuário específico
     */
    Optional<DashboardConfig> findByUsuarioId(Long usuarioId);
    
    /**
     * Verifica se existe configuração para um usuário
     */
    boolean existsByUsuarioId(Long usuarioId);
}