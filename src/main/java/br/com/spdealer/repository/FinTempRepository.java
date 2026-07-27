package br.com.spdealer.repository;

import br.com.spdealer.model.FinTemp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinTempRepository extends JpaRepository<FinTemp, Integer> {
    List<FinTemp> findByNumeroOrderByParcela(Integer numero);
    void deleteByNumero(Integer numero);
}
