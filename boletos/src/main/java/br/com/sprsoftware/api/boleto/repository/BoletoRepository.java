package br.com.sprsoftware.api.boleto.repository;

import br.com.sprsoftware.api.boleto.model.Boleto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BoletoRepository extends JpaRepository<Boleto, Long> {

    List<Boleto> findByBancoAut(String bancoAut);

    List<Boleto> findByNumapo1Aut(String numapo1Aut);

    @Query("SELECT b FROM Boleto b WHERE b.dataautAut BETWEEN :inicio AND :fim")
    List<Boleto> findByDataAutBetween(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT b FROM Boleto b WHERE " +
           "(:banco IS NULL OR b.bancoAut = :banco) AND " +
           "(:sucesso IS NULL OR b.situacaoDescricao = :sucesso) AND " +
           "(:numapo IS NULL OR b.numapo1Aut = :numapo) AND " +
           "(:inicio IS NULL OR b.dataautAut >= :inicio) AND " +
           "(:fim IS NULL OR b.dataautAut <= :fim) " +
           "ORDER BY b.id DESC")
    Page<Boleto> buscarComFiltros(
            @Param("banco") String banco,
            @Param("sucesso") String sucesso,
            @Param("numapo") String numapo,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim,
            Pageable pageable);
}
