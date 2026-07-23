package br.com.spdealer.nfe.repository;

import br.com.spdealer.nfe.model.XmlNotaDet;
import br.com.spdealer.nfe.model.XmlNotaDetId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface XmlNotaDetRepository extends JpaRepository<XmlNotaDet, XmlNotaDetId> {
    List<XmlNotaDet> findById(String id);
}
