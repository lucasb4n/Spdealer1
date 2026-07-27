package br.com.spdealer.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.spdealer.model.FluxoCaixaLinha;

/**
 * FluxoCaixaLinhaRepository - Repository JPA para FluxoCaixaLinha
 * 
 * Interface que define as operações de acesso a dados para a tabela
 * FLUXO_CAIXA_LINHAS (Estrutura do Fluxo de Caixa).
 * 
 * Spring Data JPA implementa automaticamente esses métodos.
 * 
 * @author Sistema SPDealer
 * @version 1.0
 */
@Repository
public interface FluxoCaixaLinhaRepository extends JpaRepository<FluxoCaixaLinha, Long> {
    
    /**
     * Busca uma linha do fluxo por operação de caixa.
     * 
     * @param operacaoOcai Código da operação (ex: "001", "500")
     * @return Optional com a linha ou vazio se não encontrar
     * 
     * Exemplo:
     *   Optional<FluxoCaixaLinha> linha = repository.findByOperacaoOcai("001");
     */
    Optional<FluxoCaixaLinha> findByOperacaoOcai(String operacaoOcai);
    
    /**
     * Busca uma linha do fluxo por conta do plano de contas.
     * 
     * @param contadOcai Código da conta (ex: "0004111080001")
     * @return Optional com a linha ou vazio se não encontrar
     * 
     * Exemplo:
     *   Optional<FluxoCaixaLinha> linha = repository.findByContadOcai("0004111080001");
     */
    Optional<FluxoCaixaLinha> findByContadOcai(String contadOcai);
    
    /**
     * Busca todas as linhas ativas do fluxo.
     * 
     * @return Lista de linhas ativas ordenadas por ordem de exibição
     * 
     * Exemplo:
     *   List<FluxoCaixaLinha> linhas = repository.findAllAtivas();
     */
    @Query("SELECT l FROM FluxoCaixaLinha l WHERE l.ativo = 'S' ORDER BY l.ordem ASC, l.id ASC")
    List<FluxoCaixaLinha> findAllAtivas();
    
    /**
     * Busca linhas por nível hierárquico.
     * 
     * Normalmente nível 4 para operações de caixa.
     * 
     * @param nivel Nível (ex: 4)
     * @return Lista de linhas naquele nível
     * 
     * Exemplo:
     *   List<FluxoCaixaLinha> nivel4 = repository.findByNivel(4);
     */
    @Query("SELECT l FROM FluxoCaixaLinha l WHERE l.nivel = :nivel AND l.ativo = 'S' ORDER BY l.ordem ASC, l.id ASC")
    List<FluxoCaixaLinha> findByNivel(@Param("nivel") Integer nivel);
    
    /**
     * Busca linhas por padrão de descrição (SCOPLA ou MASCAI).
     * 
     * @param descricao Padrão de descrição (com LIKE)
     * @return Lista de linhas que contêm a descrição
     * 
     * Exemplo:
     *   List<FluxoCaixaLinha> receber = repository.findByDescricao("%RECEBER%");
     */
    @Query("SELECT l FROM FluxoCaixaLinha l WHERE " +
           "(l.descriScopla LIKE :descricao OR l.descricaoOcai LIKE :descricao) " +
           "AND l.ativo = 'S' ORDER BY l.ordem ASC")
    List<FluxoCaixaLinha> findByDescricao(@Param("descricao") String descricao);
    
    /**
     * Busca linhas por operação de caixa (pode retornar múltiplas se houver duplicação).
     * 
     * @param operacaoOcai Código da operação
     * @return Lista de linhas da operação
     * 
     * Exemplo:
     *   List<FluxoCaixaLinha> linhas = repository.findAllByOperacaoOcai("500");
     */
    List<FluxoCaixaLinha> findAllByOperacaoOcai(String operacaoOcai);
    
    /**
     * Busca linhas que pertençam a uma determinada conta.
     * 
     * @param contadOcai Código da conta
     * @return Lista de linhas da conta
     * 
     * Exemplo:
     *   List<FluxoCaixaLinha> linhas = repository.findAllByContadOcai("0005111010001");
     */
    List<FluxoCaixaLinha> findAllByContadOcai(String contadOcai);
    
    /**
     * Verifica se uma linha existe e está ativa.
     * 
     * @param operacaoOcai Código da operação
     * @return true se existe e está ativa, false caso contrário
     * 
     * Exemplo:
     *   boolean existe = repository.existeAtiva("001");
     */
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END FROM FluxoCaixaLinha l WHERE l.operacaoOcai = :operacaoOcai AND l.ativo = 'S'")
    boolean existeAtiva(@Param("operacaoOcai") String operacaoOcai);
    
    /**
     * Conta o total de linhas ativas.
     * 
     * @return Quantidade de linhas ativas
     * 
     * Exemplo:
     *   long total = repository.countAtivas();
     */
    @Query("SELECT COUNT(l) FROM FluxoCaixaLinha l WHERE l.ativo = 'S'")
    long countAtivas();
    
    /**
     * Busca a próxima ordem para criar uma nova linha.
     * 
     * Útil para determinar ordem padrão de novos registros.
     * 
     * @return Próxima ordem (max + 1) ou 1 se vazio
     * 
     * Exemplo:
     *   Integer proximaOrdem = repository.findProximaOrdem();
     */
    @Query("SELECT COALESCE(MAX(l.ordem), 0) + 1 FROM FluxoCaixaLinha l")
    Integer findProximaOrdem();
    
    /**
     * Busca linhas com mais dados incompletos.
     * 
     * Uma linha com dados incompletos pode precisar de atualização.
     * 
     * @return Lista de linhas que precisam de manutenção
     * 
     * Exemplo:
     *   List<FluxoCaixaLinha> incompletas = repository.findComDadosIncompletos();
     */
    @Query("SELECT DISTINCT l FROM FluxoCaixaLinha l " +
           "LEFT JOIN l.dados d " +
           "WHERE l.ativo = 'S' AND (d IS NULL OR d.valorReal IS NULL) " +
           "ORDER BY l.ordem ASC")
    List<FluxoCaixaLinha> findComDadosIncompletos();
}
