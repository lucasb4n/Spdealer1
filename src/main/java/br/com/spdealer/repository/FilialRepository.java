package br.com.spdealer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import br.com.spdealer.model.Filial;
import java.util.List;

@Repository
public interface FilialRepository extends JpaRepository<Filial, String> {
    
    // Buscar todas as filiais ordenadas por código
    List<Filial> findAllByOrderByCodigoFilAsc();

    // Buscar filiais pela empresa (filtrar por empresa_ger) e ordenar por nome_fil
    @Query(value = "SELECT * FROM masfil WHERE empresa_ger = :empresa ORDER BY nome_fil", nativeQuery = true)
    List<Filial> findAllByEmpresaGerOrderByNomeFil(@Param("empresa") String empresa);
}
