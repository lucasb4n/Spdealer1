package br.com.spdealer.nfe.repository;

import br.com.spdealer.nfe.model.FilialNfe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository para dados da Filial/Empresa
 * Os dados são sincronizados da tabela masger para a tabela filial
 */
@Repository
public interface FilialNfeRepository extends JpaRepository<FilialNfe, Integer> {

    /**
     * Busca filial pelo código
     */
    @Query("SELECT f FROM FilialNfe f WHERE f.idFil = :codigo")
    Optional<FilialNfe> buscarPorCodigo(Integer codigo);

    /**
     * Busca filial pelo CNPJ
     */
    @Query("SELECT f FROM FilialNfe f WHERE f.cnpjFil = :cnpj")
    Optional<FilialNfe> findByCnpj(String cnpj);

    /**
     * Busca filial ativa pelo código
     */
    @Query("SELECT f FROM FilialNfe f WHERE f.idFil = :codigo")
    Optional<FilialNfe> buscarPorCodigoAtivo(Integer codigo);
}
