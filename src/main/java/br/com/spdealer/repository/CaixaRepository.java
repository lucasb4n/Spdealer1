package br.com.spdealer.repository;

import br.com.spdealer.model.Caixa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * CaixaRepository
 * Repository para acessar Caixa (lançamentos de caixa e bancos) no banco de dados
 * 
 * Padrão: Spring Data JPA
 * Tabela: caixa
 * 
 * Estrutura:
 * - seq_cai: Chave primária (auto_increment)
 * - dtmovi_cai: Data do movimento (date)
 * - dc_cai: Tipo (D=débito, C=crédito)
 * - valor_cai: Valor (decimal)
 * - filial_cai: Filial (fixo: 001)
 * - banco_cai: Código do banco (FK para bancos.codigo_bco)
 * - cliente_cai: Código do cliente/origem
 * - historico_cai: Descrição do lançamento
 */
@Repository
public interface CaixaRepository extends JpaRepository<Caixa, Long> {

    /**
     * Buscar lançamentos por banco e data
     * 
     * @param banco Código do banco
     * @param data Data do movimento
     * @return List de lançamentos
     * 
     * Exemplo:
     * List<Caixa> lancamentos = caixaRepository.findByBancoCaiAndDtmoviCai("001", LocalDate.now());
     */
    List<Caixa> findByBancoCaiAndDtmoviCai(String banco, LocalDate data);

    /**
     * Buscar lançamentos por banco em um período
     * 
     * @param banco Código do banco
     * @param dtInicio Data inicial
     * @param dtFim Data final
     * @return List de lançamentos
     * 
     * Exemplo:
     * List<Caixa> lancamentos = caixaRepository.findByBancoCaiAndDtmoviCaiBetween("001", 
     *                                                                              LocalDate.of(2025, 1, 1), 
     *                                                                              LocalDate.of(2025, 1, 31));
     */
    List<Caixa> findByBancoCaiAndDtmoviCaiBetween(String banco, LocalDate dtInicio, LocalDate dtFim);

    /**
     * Buscar lançamentos por tipo (débito/crédito)
     * 
     * @param tipo Tipo (D ou C)
     * @return List de lançamentos
     * 
     * Exemplo:
     * List<Caixa> creditos = caixaRepository.findByDcCai('C');
     */
    List<Caixa> findByDcCai(String tipo);

    /**
     * Buscar lançamentos por tipo e data
     * 
     * @param tipo Tipo (D ou C)
     * @param data Data
     * @return List de lançamentos
     * 
     * Exemplo:
     * List<Caixa> creditosHoje = caixaRepository.findByDcCaiAndDtmoviCai('C', LocalDate.now());
     */
    List<Caixa> findByDcCaiAndDtmoviCai(String tipo, LocalDate data);

    /**
     * Buscar lançamento por banco, data, tipo e cliente (para evitar duplicatas)
     * 
     * @param banco Código do banco
     * @param data Data
     * @param tipo Tipo (D ou C)
     * @param cliente Código do cliente
     * @return Optional com lançamento, ou vazio
     * 
     * Exemplo:
     * Optional<Caixa> lancamento = caixaRepository.findByBancoCaiAndDtmoviCaiAndDcCaiAndClienteCai("001", 
     *                                                                                               LocalDate.now(), 
     *                                                                                               "C", 
     *                                                                                               "001");
     */
    Optional<Caixa> findByBancoCaiAndDtmoviCaiAndDcCaiAndClienteCai(String banco, LocalDate data, String tipo, String cliente);

    /**
     * Query customizada: Soma de débitos por banco e data
     * 
     * @param banco Código do banco
     * @param data Data
     * @return Total de débitos
     * 
     * Exemplo:
     * Double totalDebito = caixaRepository.somaDebitosPorBancoEData("001", LocalDate.now());
     */
    @Query("SELECT COALESCE(SUM(c.valorCai), 0) FROM Caixa c " +
           "WHERE c.bancoCai = :banco AND c.dtmoviCai = :data AND c.dcCai = 'D' AND c.filialCai = '001'")
    Double somaDebitosPorBancoEData(@Param("banco") String banco, @Param("data") LocalDate data);

    /**
     * Query customizada: Soma de créditos por banco e data
     * 
     * @param banco Código do banco
     * @param data Data
     * @return Total de créditos
     * 
     * Exemplo:
     * Double totalCredito = caixaRepository.somaCreditosPorBancoEData("001", LocalDate.now());
     */
    @Query("SELECT COALESCE(SUM(c.valorCai), 0) FROM Caixa c " +
           "WHERE c.bancoCai = :banco AND c.dtmoviCai = :data AND c.dcCai = 'C' AND c.filialCai = '001'")
    Double somaCreditosPorBancoEData(@Param("banco") String banco, @Param("data") LocalDate data);

    /**
     * Query customizada: Buscar lançamentos recentes (últimos 30 dias)
     * 
     * @return Page de lançamentos
     * 
     * Exemplo:
     * Page<Caixa> recentes = caixaRepository.findRecentes(PageRequest.of(0, 50));
     */
    @Query("SELECT c FROM Caixa c WHERE c.dtmoviCai >= CURRENT_DATE - 30 ORDER BY c.dtmoviCai DESC")
    Page<Caixa> findRecentes(Pageable pageable);

    /**
     * Query customizada: Contar lançamentos de um banco em um período
     * 
     * @param banco Código do banco
     * @param dtInicio Data inicial
     * @param dtFim Data final
     * @return Número de lançamentos
     * 
     * Exemplo:
     * long count = caixaRepository.countLancamentosEmPeriodo("001", 
     *                                                         LocalDate.of(2025, 1, 1), 
     *                                                         LocalDate.of(2025, 1, 31));
     */
    @Query("SELECT COUNT(c) FROM Caixa c " +
           "WHERE c.bancoCai = :banco AND c.dtmoviCai BETWEEN :dtInicio AND :dtFim")
    long countLancamentosEmPeriodo(@Param("banco") String banco, 
                                   @Param("dtInicio") LocalDate dtInicio, 
                                   @Param("dtFim") LocalDate dtFim);

    /**
     * Buscar lançamentos por filial (geralmente '001')
     * 
     * @param filial Código da filial
     * @return List de lançamentos
     * 
     * Exemplo:
     * List<Caixa> todosDaFilial = caixaRepository.findByFilialCai("001");
     */
    List<Caixa> findByFilialCai(String filial);

    /**
     * Buscar todas as datas com movimento de um banco
     * 
     * @param banco Código do banco
     * @return List de datas
     * 
     * Exemplo:
     * List<LocalDate> datasComMovimento = caixaRepository.findDatasPorBanco("001");
     */
    @Query("SELECT DISTINCT c.dtmoviCai FROM Caixa c WHERE c.bancoCai = :banco ORDER BY c.dtmoviCai DESC")
    List<LocalDate> findDatasPorBanco(@Param("banco") String banco);

    /**
     * Buscar lançamentos para relatório (sem paginação, com ordem)
     * 
     * @param dtInicio Data inicial
     * @param dtFim Data final
     * @return List de lançamentos ordenados por data e banco
     * 
     * Exemplo:
     * List<Caixa> relatorio = caixaRepository.findParaRelatorio(LocalDate.of(2025, 1, 1), 
     *                                                            LocalDate.of(2025, 1, 31));
     */
    @Query("SELECT c FROM Caixa c WHERE c.dtmoviCai BETWEEN :dtInicio AND :dtFim " +
           "ORDER BY c.dtmoviCai ASC, c.bancoCai ASC, c.dcCai DESC")
    List<Caixa> findParaRelatorio(@Param("dtInicio") LocalDate dtInicio, @Param("dtFim") LocalDate dtFim);
}
