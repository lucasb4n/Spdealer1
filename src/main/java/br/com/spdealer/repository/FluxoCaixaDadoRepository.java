package br.com.spdealer.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.spdealer.model.FluxoCaixaDado;

/**
 * FluxoCaixaDadoRepository - Repository JPA para FluxoCaixaDado
 * 
 * Interface que define as operações de acesso a dados para a tabela
 * FLUXO_CAIXA_DADOS (Valores Mensais do Fluxo de Caixa).
 * 
 * Spring Data JPA implementa automaticamente esses métodos.
 * 
 * @author Sistema SPDealer
 * @version 1.0
 */
@Repository
public interface FluxoCaixaDadoRepository extends JpaRepository<FluxoCaixaDado, Long> {
    
    /**
     * Busca um dado por linha, ano e mês.
     * 
     * Esse é o filtro principal para agregações mensais.
     * 
     * @param linhaId ID da linha do fluxo
     * @param ano Ano (ex: 2025)
     * @param mes Mês (1-12)
     * @return Optional com o dado ou vazio se não encontrar
     * 
     * Exemplo:
     *   Optional<FluxoCaixaDado> dado = repository.findByLinhaIdAndAnoAndMes(1L, 2025, 11);
     */
    Optional<FluxoCaixaDado> findByLinhaIdAndAnoAndMes(
        @Param("linhaId") Long linhaId,
        @Param("ano") Integer ano,
        @Param("mes") Integer mes
    );
    
    /**
     * Busca todos os dados de uma linha (todos os meses/anos).
     * 
     * @param linhaId ID da linha do fluxo
     * @return Lista de dados ordenada por ano e mês
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> dados = repository.findByLinhaId(1L);
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.linhaId = :linhaId ORDER BY d.ano DESC, d.mes DESC")
    List<FluxoCaixaDado> findByLinhaId(@Param("linhaId") Long linhaId);
    
    /**
     * Busca todos os dados de um período (ano/mês) em todas as linhas.
     * 
     * Útil para relatórios consolidados de um mês.
     * 
     * @param ano Ano (ex: 2025)
     * @param mes Mês (1-12)
     * @return Lista de dados do período ordenada por linha
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> dados = repository.findByAnoAndMes(2025, 11);
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.ano = :ano AND d.mes = :mes ORDER BY d.linhaId ASC")
    List<FluxoCaixaDado> findByAnoAndMes(
        @Param("ano") Integer ano,
        @Param("mes") Integer mes
    );
    
    /**
     * Busca todos os dados de um ano em todas as linhas.
     * 
     * Útil para relatórios anuais.
     * 
     * @param ano Ano (ex: 2025)
     * @return Lista de dados do ano ordenada por linha e mês
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> dados = repository.findByAno(2025);
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.ano = :ano ORDER BY d.linhaId ASC, d.mes ASC")
    List<FluxoCaixaDado> findByAno(@Param("ano") Integer ano);
    
    /**
     * Busca dados com desvio (variação != 0).
     * 
     * Útil para análise de exceções/anomalias.
     * 
     * @param ano Ano (ex: 2025)
     * @param mes Mês (1-12)
     * @return Lista de dados com desvio
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> desvios = repository.findWithVariacao(2025, 11);
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.ano = :ano AND d.mes = :mes AND d.variacao IS NOT NULL AND d.variacao != 0 ORDER BY ABS(d.percentualVariacao) DESC")
    List<FluxoCaixaDado> findWithVariacao(
        @Param("ano") Integer ano,
        @Param("mes") Integer mes
    );
    
    /**
     * Busca dados com desvio maior que um percentual.
     * 
     * Útil para análise de desvios significativos.
     * 
     * @param ano Ano
     * @param mes Mês
     * @param percentual Percentual mínimo (ex: 5.0 para 5%)
     * @return Lista de dados com desvio acima do limiar
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> maiores = repository.findWithVariacaoMaiorQue(2025, 11, 5.0);
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.ano = :ano AND d.mes = :mes " +
           "AND ABS(CAST(d.percentualVariacao AS FLOAT)) > :percentual " +
           "ORDER BY ABS(d.percentualVariacao) DESC")
    List<FluxoCaixaDado> findWithVariacaoMaiorQue(
        @Param("ano") Integer ano,
        @Param("mes") Integer mes,
        @Param("percentual") Double percentual
    );
    
    /**
     * Busca dados que precisam de cálculo (valor_real não preenchido).
     * 
     * Útil para identificar registros que precisam ser calculados.
     * 
     * @return Lista de TODOS os dados sem valor_real calculado
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> incompletos = repository.findWithoutValorReal();
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.valorReal IS NULL ORDER BY d.ano DESC, d.mes DESC")
    List<FluxoCaixaDado> findWithoutValorReal();
    
    /**
     * Busca dados que precisam de cálculo (valor_real não preenchido).
     * Versão com filtro por ano/mês.
     * 
     * @param ano Ano
     * @param mes Mês
     * @return Lista de dados sem valor_real
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> incompletos = repository.findWithoutValorRealByAnoMes(2025, 11);
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.ano = :ano AND d.mes = :mes AND d.valorReal IS NULL")
    List<FluxoCaixaDado> findWithoutValorRealByAnoMes(
        @Param("ano") Integer ano,
        @Param("mes") Integer mes
    );
    
    /**
     * Busca o período (ano/mês) mais recente com dados.
     * 
     * Útil para determinar quando foi o último cálculo.
     * 
     * @return Optional com o período mais recente
     * 
     * Exemplo:
     *   Optional<FluxoCaixaDado> ultimo = repository.findMostRecent();
     */
    @Query("SELECT d FROM FluxoCaixaDado d ORDER BY d.ano DESC, d.mes DESC LIMIT 1")
    Optional<FluxoCaixaDado> findMostRecent();
    
    /**
     * Conta quantos registros têm valor_real preenchido.
     * 
     * @param ano Ano
     * @param mes Mês
     * @return Quantidade de registros com valor_real
     * 
     * Exemplo:
     *   long preenchidos = repository.countWithValorReal(2025, 11);
     */
    @Query("SELECT COUNT(d) FROM FluxoCaixaDado d WHERE d.ano = :ano AND d.mes = :mes AND d.valorReal IS NOT NULL")
    long countWithValorReal(
        @Param("ano") Integer ano,
        @Param("mes") Integer mes
    );
    
    /**
     * Lista os últimos 12 meses de dados para uma linha.
     * 
     * Útil para gráficos de tendência.
     * 
     * @param linhaId ID da linha do fluxo
     * @return Lista dos últimos 12 registros
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> ultimos12 = repository.findLast12Months(1L);
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.linhaId = :linhaId " +
           "ORDER BY d.ano DESC, d.mes DESC LIMIT 12")
    List<FluxoCaixaDado> findLast12Months(@Param("linhaId") Long linhaId);
    
    /**
     * Busca dados com valor_esperado preenchido (planejamento).
     * 
     * @param ano Ano
     * @param mes Mês
     * @return Lista de dados com planejamento
     * 
     * Exemplo:
     *   List<FluxoCaixaDado> comPlano = repository.findWithPlanejamento(2025, 11);
     */
    @Query("SELECT d FROM FluxoCaixaDado d WHERE d.ano = :ano AND d.mes = :mes AND d.valorEsperado IS NOT NULL")
    List<FluxoCaixaDado> findWithPlanejamento(
        @Param("ano") Integer ano,
        @Param("mes") Integer mes
    );
}
