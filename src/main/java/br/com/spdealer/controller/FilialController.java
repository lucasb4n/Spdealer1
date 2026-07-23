package br.com.spdealer.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import br.com.spdealer.model.Filial;
import br.com.spdealer.repository.FilialRepository;
import jakarta.servlet.http.HttpSession;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FilialController {

    @Autowired
    private FilialRepository filialRepository;

    @GetMapping({"/filiais", "/v1/filiais"})
    public ResponseEntity<?> listarFiliais() {
        try {
            // Garantir que retornamos filiais da empresa mestre '001' e ordenadas por nome
            List<Filial> filiais = filialRepository.findAllByEmpresaGerOrderByNomeFil("001");
            if (filiais == null || filiais.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            System.out.println("[FilialController] Filiais carregadas: " + filiais.size());
            return ResponseEntity.ok(filiais);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("[FilialController] Erro ao buscar filiais: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao buscar filiais: " + e.getMessage()));
        }
    }

    @PostMapping("/filiais/selecionar")
    public ResponseEntity<?> selecionarFilial(@RequestBody Map<String, String> request, HttpSession session) {
        try {
            String codigoFil = request.get("codigo_fil");
            
            if (codigoFil == null || codigoFil.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "codigo_fil não fornecido"));
            }
            
            Filial filial = filialRepository.findById(codigoFil).orElse(null);
            if (filial == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Filial não encontrada"));
            }
            
            // Armazenar na sessão
            session.setAttribute("id_fil", codigoFil);
            session.setAttribute("filial_nome", filial.getNomeFil());
            session.setAttribute("filial_codigo", filial.getCodigoFil());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Filial selecionada: " + filial.getNomeFil(),
                "codigo_fil", codigoFil,
                "filial_nome", filial.getNomeFil()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao selecionar filial: " + e.getMessage()));
        }
    }

    @GetMapping("/filials/current")
    public ResponseEntity<?> obterFilialAtual(HttpSession session) {
        try {
            String codigoFil = (String) session.getAttribute("id_fil");
            String nomeFil = (String) session.getAttribute("filial_nome");
            
            if (codigoFil == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Nenhuma filial selecionada na sessão"));
            }
            
            return ResponseEntity.ok(Map.of(
                "codigo_fil", codigoFil,
                "filial_nome", nomeFil
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Erro ao obter filial atual: " + e.getMessage()));
        }
    }
}
