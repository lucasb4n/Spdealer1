package br.com.sprsoftware.api.boleto.service;

import br.com.sprsoftware.api.boleto.model.Autoriza;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class AutorizaService extends BoletoService {

    public Page<Autoriza> listarAutoriza(String banco, String sucesso, String numapo, LocalDate inicio, LocalDate fim, int page, int size) {
        return repository.buscarComFiltros(banco, sucesso, numapo, inicio, fim, org.springframework.data.domain.PageRequest.of(page, size))
                .map(b -> (Autoriza) b);
    }

    public Optional<Autoriza> buscarAutorizaPorId(Long id) {
        return repository.findById(id).map(b -> (Autoriza) b);
    }
}
