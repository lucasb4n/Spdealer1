package br.com.spdealer.repository;

import br.com.spdealer.model.ParametroGeral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParametroGeralRepository extends JpaRepository<ParametroGeral, String> {
    List<ParametroGeral> findByGrupo(String grupo);
    Optional<ParametroGeral> findByChave(String chave);
}
