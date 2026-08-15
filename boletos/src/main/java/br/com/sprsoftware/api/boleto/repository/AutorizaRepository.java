package br.com.sprsoftware.api.boleto.repository;

import br.com.sprsoftware.api.boleto.model.Boleto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AutorizaRepository extends JpaRepository<Boleto, Long> {
}
