package br.com.spdealer.repository;

import br.com.spdealer.model.DashboardLayout;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DashboardLayoutRepository extends JpaRepository<DashboardLayout, Long> {
    DashboardLayout findFirstByUsuarioIdAndAtivoTrue(Long usuarioId);
}
