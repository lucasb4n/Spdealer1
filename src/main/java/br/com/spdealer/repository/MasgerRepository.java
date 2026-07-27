package br.com.spdealer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import br.com.spdealer.model.Masger;

@Repository
public interface MasgerRepository extends JpaRepository<Masger, Long> {
    Masger findByNumEmprGer(Long numEmprGer);
}
