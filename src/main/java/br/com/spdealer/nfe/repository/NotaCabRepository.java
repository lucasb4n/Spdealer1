package br.com.spdealer.nfe.repository;

import br.com.spdealer.nfe.model.NotaCab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para operações com notas fiscais cabeçalho
 */
@Repository
public interface NotaCabRepository extends JpaRepository<NotaCab, Long> {

    /**
     * Busca notas fiscais por filial e intervalo de datas de emissão
     */
    @Query("SELECT n FROM NotaCab n WHERE n.filialNot = :filial AND n.emissaoiNot BETWEEN :dataIni AND :dataFim ORDER BY n.emissaoiNot, n.serieNot, n.numeroNot")
    List<NotaCab> findByFilialAndDataEmissaoBetween(
            @Param("filial") Integer filial,
            @Param("dataIni") Integer dataIni,
            @Param("dataFim") Integer dataFim);

    /**
     * Busca nota fiscal específica
     */
    @Query("SELECT n FROM NotaCab n WHERE n.filialNot = :filial AND n.emissaoiNot = :emissao AND " +
            "n.tipoNot = :tipo AND n.serieNot = :serie AND n.numeroNot = :numero")
    Optional<NotaCab> findByNotaFiscal(
            @Param("filial") Integer filialNot,
            @Param("emissao") Integer emissaoiNot,
            @Param("tipo") String tipoNot,
            @Param("serie") String serieNot,
            @Param("numero") Integer numeroNot);

    /**
     * Busca notas por chave NF-e
     */
    @Query("SELECT n FROM NotaCab n WHERE n.chavenfeNot = :chave")
    Optional<NotaCab> findByChaveNfe(@Param("chave") String chavenfeNot);

    /**
     * Lista notas por status NF-e
     */
    @Query("SELECT n FROM NotaCab n WHERE n.filialNot = :filial AND n.statusnfeNot <> :status")
    List<NotaCab> findByFilialNotAndStatusnfeNot(
            @Param("filial") Integer filialNot, 
            @Param("status") String statusnfeNot);

    /**
     * Busca última nota pela série
     */
    @Query("SELECT MAX(n.numeroNot) FROM NotaCab n WHERE n.filialNot = :filial AND n.serieNot = :serie")
    Integer findMaxNumeroByFilialAndSerie(@Param("filial") Integer filial, @Param("serie") String serie);
}
