package br.com.spdealer.refatorado.controller;

import br.com.spdealer.refatorado.dto.MasforCreateDTO;
import br.com.spdealer.refatorado.dto.MasforUpdateDTO;
import br.com.spdealer.refatorado.model.Masfor;
import br.com.spdealer.refatorado.service.MasforService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller REST para Tipo de Fornecedor (masfor)
 * Endpoints: GET, POST, PUT, DELETE
 * Filtro obrigatório por filial (session)
 * Data: 17 de janeiro de 2026
 */
@RestController
@RequestMapping("/api/refatorado/masfor")
@CrossOrigin(origins = {"http://localhost:3000", "http://192.168.10.70:8080"})
public class MasforController {

    @Autowired
    private MasforService service;

    /**
     * GET /api/refatorado/masfor
     * Listar todos os tipos de fornecedor da filial do usuário
     */
    @GetMapping
    public ResponseEntity<?> listar(HttpSession session) {
        try {
            Integer idFil = (Integer) session.getAttribute("id_fil");
            if (idFil == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Filial não definida na sessão"));
            }

            List<Masfor> masforList = service.findByFilial(idFil);
            return ResponseEntity.ok(masforList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/refatorado/masfor/{tipoFor}
     * Buscar tipo de fornecedor específico
     */
    @GetMapping("/{tipoFor}")
    public ResponseEntity<?> buscar(@PathVariable String tipoFor, HttpSession session) {
        try {
            Integer idFil = (Integer) session.getAttribute("id_fil");
            if (idFil == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Filial não definida na sessão"));
            }

            Masfor masfor = service.findByIdAndFilial(tipoFor, idFil);
            if (masfor == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(masfor);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * POST /api/refatorado/masfor
     * Criar novo tipo de fornecedor
     */
    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody MasforCreateDTO dto, HttpSession session) {
        try {
            Integer idFil = (Integer) session.getAttribute("id_fil");
            if (idFil == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Filial não definida na sessão"));
            }

            Masfor masfor = service.create(dto, idFil);
            return ResponseEntity.status(HttpStatus.CREATED).body(masfor);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * PUT /api/refatorado/masfor/{tipoFor}
     * Atualizar tipo de fornecedor
     */
    @PutMapping("/{tipoFor}")
    public ResponseEntity<?> atualizar(@PathVariable String tipoFor,
                                       @Valid @RequestBody MasforUpdateDTO dto,
                                       HttpSession session) {
        try {
            Integer idFil = (Integer) session.getAttribute("id_fil");
            if (idFil == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Filial não definida na sessão"));
            }

            Masfor masfor = service.update(tipoFor, dto, idFil);
            return ResponseEntity.ok(masfor);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * DELETE /api/refatorado/masfor/{tipoFor}
     * Deletar tipo de fornecedor
     */
    @DeleteMapping("/{tipoFor}")
    public ResponseEntity<?> deletar(@PathVariable String tipoFor, HttpSession session) {
        try {
            Integer idFil = (Integer) session.getAttribute("id_fil");
            if (idFil == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Filial não definida na sessão"));
            }

            service.deleteByIdAndFilial(tipoFor, idFil);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(e.getMessage()));
        }
    }

    /**
     * Método auxiliar para criar resposta de erro
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", message);
        return response;
    }
}
