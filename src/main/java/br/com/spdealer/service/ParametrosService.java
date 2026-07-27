package br.com.spdealer.service;

import br.com.spdealer.model.ParametroGeral;
import br.com.spdealer.repository.ParametroGeralRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ParametrosService {

    @Autowired
    private ParametroGeralRepository repository;

    public List<ParametroGeral> listarTodos() {
        return repository.findAll();
    }

    public Map<String, String> getMapTotal() {
        return listarTodos().stream()
                .collect(Collectors.toMap(ParametroGeral::getChave, ParametroGeral::getValor));
    }

    public List<ParametroGeral> listarPorGrupo(String grupo) {
        return repository.findByGrupo(grupo);
    }

    @Transactional
    public void salvar(String chave, String valor, String descricao, String grupo) {
        ParametroGeral parametro = repository.findById(chave)
                .orElse(ParametroGeral.builder().chave(chave).build());
        
        parametro.setValor(valor);
        if (descricao != null) parametro.setDescricao(descricao);
        if (grupo != null) parametro.setGrupo(grupo);
        
        repository.save(parametro);
    }

    @Transactional
    public void salvarLote(List<ParametroGeral> parametros) {
        repository.saveAll(parametros);
    }
}
