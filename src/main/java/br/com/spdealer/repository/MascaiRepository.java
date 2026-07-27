package br.com.spdealer.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.spdealer.model.Mascai;

/**
 * MascaiRepository - Repository JPA para Mascai
 * 
 * Interface que define as operações de acesso a dados para a tabela MASCAI
 * (Catálogo de Operações de Caixa).
 * 
 * Spring Data JPA implementa automaticamente esses métodos.
 * 
 * @author Sistema SPDealer
 * @version 1.0
 */
@Repository
public interface MascaiRepository extends JpaRepository<Mascai, String> {
    
    /**
     * Busca uma operação de caixa por código.
     * 
     * @param operacaoOcai Código da operação (ex: "001", "500")
     * @return Optional com a operação ou vazio se não encontrar
     * 
     * Exemplo:
     *   Optional<Mascai> mascai = repository.findByOperacaoOcai("001");
     */
    Optional<Mascai> findByOperacaoOcai(String operacaoOcai);
    
    /**
     * Busca todas as operações ativas ordenadas por código.
     * 
     * @return Lista de operações ativas
     * 
     * Exemplo:
     *   List<Mascai> ativas = repository.findAllAtivas();
     */
    @Query("SELECT m FROM Mascai m WHERE m.ativo = 'S' ORDER BY m.operacaoOcai ASC")
    List<Mascai> findAllAtivas();
    
    /**
     * Busca operações por conta do plano de contas.
     * 
     * @param contadOcai Código da conta (ex: "0004111080001")
     * @return Lista de operações que usam essa conta
     * 
     * Exemplo:
     *   List<Mascai> ops = repository.findByContadOcai("0004111080001");
     */
    List<Mascai> findByContadOcai(String contadOcai);
    
    /**
     * Busca operações por nível hierárquico.
     * 
     * @param nivel Nível (ex: 4 para operações de caixa)
     * @return Lista de operações naquele nível
     * 
     * Exemplo:
     *   List<Mascai> nivel4 = repository.findByNivel(4);
     */
    @Query("SELECT m FROM Mascai m WHERE m.nivel = :nivel AND m.ativo = 'S' ORDER BY m.operacaoOcai ASC")
    List<Mascai> findByNivel(@Param("nivel") Integer nivel);
    
    /**
     * Busca operações por padrão de descrição.
     * 
     * @param descricao Padrão de descrição (com LIKE)
     * @return Lista de operações que contêm a descrição
     * 
     * Exemplo:
     *   List<Mascai> receber = repository.findByDescricao("%RECEBER%");
     */
    @Query("SELECT m FROM Mascai m WHERE m.descricaoOcai LIKE :descricao AND m.ativo = 'S' ORDER BY m.operacaoOcai ASC")
    List<Mascai> findByDescricao(@Param("descricao") String descricao);
    
    /**
     * Verifica se uma operação existe e está ativa.
     * 
     * @param operacaoOcai Código da operação
     * @return true se existe e está ativa, false caso contrário
     * 
     * Exemplo:
     *   boolean existe = repository.existeAtiva("001");
     */
    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM Mascai m WHERE m.operacaoOcai = :operacaoOcai AND m.ativo = 'S'")
    boolean existeAtiva(@Param("operacaoOcai") String operacaoOcai);
    
    /**
     * Conta o total de operações ativas.
     * 
     * @return Quantidade de operações ativas
     * 
     * Exemplo:
     *   long total = repository.countAtivas();
     */
    @Query("SELECT COUNT(m) FROM Mascai m WHERE m.ativo = 'S'")
    long countAtivas();
    
    /**
     * Busca operações com conta específica, ativas e ordenadas.
     * Usado para construir listas filtradas no frontend.
     * 
     * @param empresa Código da empresa (ex: "001")
     * @return Lista de operações da empresa
     * 
     * Exemplo:
     *   List<Mascai> empresa = repository.findByEmpresa("001");
     */
    @Query("SELECT m FROM Mascai m WHERE m.empresaGer = :empresa AND m.ativo = 'S' ORDER BY m.operacaoOcai ASC")
    List<Mascai> findByEmpresa(@Param("empresa") String empresa);
}
