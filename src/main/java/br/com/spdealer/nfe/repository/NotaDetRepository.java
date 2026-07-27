package br.com.spdealer.nfe.repository;

import br.com.spdealer.nfe.model.NotaDet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository para operações com itens de notas fiscais
 */
@Repository
public interface NotaDetRepository extends JpaRepository<NotaDet, Long> {

    /**
     * Busca itens de uma nota fiscal específica
     */
    @Query("SELECT d FROM NotaDet d WHERE d.filialNot = :filial AND d.emissaoiNot = :emissao AND " +
            "d.tipoNot = :tipo AND d.serieNot = :serie AND d.numeroNot = :numero")
    List<NotaDet> findByNotaFiscal(
            @Param("filial") Integer filialNot,
            @Param("emissao") Integer emissaoiNot,
            @Param("tipo") String tipoNot,
            @Param("serie") String serieNot,
            @Param("numero") Integer numeroNot);

    /**
     * Busca total de itens por nota fiscal
     */
    @Query("SELECT COUNT(d) FROM NotaDet d WHERE d.filialNot = :filial AND d.emissaoiNot = :emissao AND " +
            "d.tipoNot = :tipo AND d.serieNot = :serie AND d.numeroNot = :numero")
    Long countByNotaFiscal(
            @Param("filial") Integer filial,
            @Param("emissao") Integer emissao,
            @Param("tipo") String tipo,
            @Param("serie") String serie,
            @Param("numero") Integer numero);
}
