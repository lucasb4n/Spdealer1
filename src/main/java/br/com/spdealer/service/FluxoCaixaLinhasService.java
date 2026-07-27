package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import br.com.spdealer.entity.FluxoCaixaLinhas;
import br.com.spdealer.repository.FluxoCaixaLinhasRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FluxoCaixaLinhasService {
    
    @Autowired
    private FluxoCaixaLinhasRepository repository;
    
    public List<FluxoCaixaLinhas> obterTodas() {
        return repository.findAllByOrderByOrdem();
    }
    
    public List<FluxoCaixaLinhas> obterPorQueryId(Long queryId) {
        return repository.findByQueryIdOrderByOrdem(queryId);
    }
    
    public Optional<FluxoCaixaLinhas> obterPorId(Long id) {
        return repository.findById(id);
    }
    
    public Optional<FluxoCaixaLinhas> obterPorCodigo(String codigoLinha) {
        return repository.findByCodigoLinha(codigoLinha);
    }
    
    public List<FluxoCaixaLinhas> obterPorTipo(FluxoCaixaLinhas.TipoLinha tipoLinha) {
        return repository.findByTipoLinha(tipoLinha);
    }
    
    public FluxoCaixaLinhas criar(FluxoCaixaLinhas linha) {
        if (linha.getCriadoEm() == null) {
            linha.setCriadoEm(LocalDateTime.now());
        }
        if (linha.getAtualizadoEm() == null) {
            linha.setAtualizadoEm(LocalDateTime.now());
        }
        if (linha.getEhCalculada() == null) {
            linha.setEhCalculada(false);
        }
        if (linha.getEhTotalizadora() == null) {
            linha.setEhTotalizadora(false);
        }
        return repository.save(linha);
    }
    
    public FluxoCaixaLinhas atualizar(Long id, FluxoCaixaLinhas linha) throws Exception {
        Optional<FluxoCaixaLinhas> existente = repository.findById(id);
        if (!existente.isPresent()) {
            throw new Exception("Linha de Fluxo de Caixa não encontrada");
        }
        
        FluxoCaixaLinhas linhaExistente = existente.get();
        linhaExistente.setDescricao(linha.getDescricao());
        linhaExistente.setTipoLinha(linha.getTipoLinha());
        linhaExistente.setQueryId(linha.getQueryId());
        linhaExistente.setEhCalculada(linha.getEhCalculada());
        linhaExistente.setOrdem(linha.getOrdem());
        linhaExistente.setNivelHierarquia(linha.getNivelHierarquia());
        linhaExistente.setEhTotalizadora(linha.getEhTotalizadora());
        linhaExistente.setPaiId(linha.getPaiId());
        linhaExistente.setAtualizadoEm(LocalDateTime.now());
        
        return repository.save(linhaExistente);
    }
    
    public void deletar(Long id) throws Exception {
        if (!repository.existsById(id)) {
            throw new Exception("Linha de Fluxo de Caixa não encontrada");
        }
        repository.deleteById(id);
    }
}
