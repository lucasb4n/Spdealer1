package br.com.spdealer.refatorado.service;

import br.com.spdealer.refatorado.dto.MasforCreateDTO;
import br.com.spdealer.refatorado.dto.MasforUpdateDTO;
import br.com.spdealer.refatorado.model.Masfor;
import br.com.spdealer.refatorado.repository.MasforRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service para Tipo de Fornecedor (masfor)
 * Lógica de negócio: CRUD com validações
 * Data: 17 de janeiro de 2026
 */
@Service
@Transactional
public class MasforService {

    @Autowired
    private MasforRepository repository;

    /**
     * Listar todos os tipos de fornecedor por filial
     */
    public List<Masfor> findByFilial(Integer idFil) {
        if (idFil == null) {
            throw new IllegalArgumentException("ID da filial é obrigatório");
        }
        return repository.findByFilial(idFil);
    }

    /**
     * Buscar tipo de fornecedor específico
     */
    public Masfor findByIdAndFilial(String tipoFor, Integer idFil) {
        if (tipoFor == null || tipoFor.isEmpty()) {
            throw new IllegalArgumentException("Código é obrigatório");
        }
        if (idFil == null) {
            throw new IllegalArgumentException("ID da filial é obrigatório");
        }
        return repository.findByIdAndFilial(tipoFor, idFil);
    }

    /**
     * Criar novo tipo de fornecedor
     * Validações:
     * - Código e descrição obrigatórios
     * - Código não pode ser duplicado na mesma filial
     */
    public Masfor create(MasforCreateDTO dto, Integer idFil) {
        // Validações
        if (dto.getTipo_for() == null || dto.getTipo_for().isEmpty()) {
            throw new IllegalArgumentException("Código é obrigatório");
        }
        if (dto.getDescr_for() == null || dto.getDescr_for().isEmpty()) {
            throw new IllegalArgumentException("Descrição é obrigatória");
        }
        if (idFil == null) {
            throw new IllegalArgumentException("ID da filial é obrigatório");
        }

        // Validar unicidade por filial
        if (repository.countByTipoForAndFilial(dto.getTipo_for(), idFil) > 0) {
            throw new IllegalArgumentException("Código \"" + dto.getTipo_for() + "\" já existe para esta filial");
        }

        // Inserir
        repository.insert(dto.getTipo_for(), dto.getDescr_for(), idFil);

        // Retornar objeto criado
        return new Masfor(dto.getTipo_for(), dto.getDescr_for());
    }

    /**
     * Atualizar tipo de fornecedor
     * Validações:
     * - Código deve existir
     * - Descrição obrigatória
     */
    public Masfor update(String tipoFor, MasforUpdateDTO dto, Integer idFil) {
        // Validações
        if (tipoFor == null || tipoFor.isEmpty()) {
            throw new IllegalArgumentException("Código é obrigatório");
        }
        if (dto.getDescr_for() == null || dto.getDescr_for().isEmpty()) {
            throw new IllegalArgumentException("Descrição é obrigatória");
        }
        if (idFil == null) {
            throw new IllegalArgumentException("ID da filial é obrigatório");
        }

        // Verificar se existe
        Masfor existing = repository.findByIdAndFilial(tipoFor, idFil);
        if (existing == null) {
            throw new IllegalArgumentException("Tipo de fornecedor não encontrado");
        }

        // Atualizar
        repository.update(tipoFor, dto.getDescr_for(), idFil);

        // Retornar objeto atualizado
        return new Masfor(tipoFor, dto.getDescr_for());
    }

    /**
     * Deletar tipo de fornecedor
     */
    public void deleteByIdAndFilial(String tipoFor, Integer idFil) {
        // Validações
        if (tipoFor == null || tipoFor.isEmpty()) {
            throw new IllegalArgumentException("Código é obrigatório");
        }
        if (idFil == null) {
            throw new IllegalArgumentException("ID da filial é obrigatório");
        }

        // Verificar se existe
        Masfor existing = repository.findByIdAndFilial(tipoFor, idFil);
        if (existing == null) {
            throw new IllegalArgumentException("Tipo de fornecedor não encontrado");
        }

        // Deletar
        repository.deleteByIdAndFilial(tipoFor, idFil);
    }
}
