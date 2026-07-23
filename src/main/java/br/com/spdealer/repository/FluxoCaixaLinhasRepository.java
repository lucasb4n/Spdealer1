package br.com.spdealer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import br.com.spdealer.entity.FluxoCaixaLinhas;
import java.util.List;
import java.util.Optional;

@Repository
public interface FluxoCaixaLinhasRepository extends JpaRepository<FluxoCaixaLinhas, Long> {
    List<FluxoCaixaLinhas> findAllByOrderByOrdem();
    Optional<FluxoCaixaLinhas> findByCodigoLinha(String codigoLinha);
    List<FluxoCaixaLinhas> findByQueryIdOrderByOrdem(Long queryId);
    List<FluxoCaixaLinhas> findByTipoLinha(FluxoCaixaLinhas.TipoLinha tipoLinha);
}
