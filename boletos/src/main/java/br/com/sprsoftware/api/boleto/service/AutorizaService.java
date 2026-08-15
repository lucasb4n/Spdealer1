package br.com.sprsoftware.api.boleto.service;

import br.com.sprsoftware.api.boleto.model.Boleto;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class AutorizaService extends BoletoService {

    public Page<Boleto> listarAutoriza(String banco, String sucesso, String numapo, LocalDate inicio, LocalDate fim, int page, int size) {
        return repository.buscarComFiltros(banco, sucesso, numapo, inicio, fim, org.springframework.data.domain.PageRequest.of(page, size));
    }

    public Optional<Boleto> buscarAutorizaPorId(Long id) {
        return repository.findById(id);
    }
}
