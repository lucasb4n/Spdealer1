package br.com.spdealer.controller.refatorado;

import br.com.spdealer.controller.ClienteController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controlador refatorado para cadastros de Fornecedores.
 * Este controller atua como um adaptador leve que marca o payload
 * com `tipo_cadastro=fornecedor` e delega a lógica existente em
 * `ClienteController` para evitar mudanças arriscadas no código legado.
 *
 * Arquivo gerado para homologação: mover para pacote principal após validação.
 */
@RestController
@RequestMapping("/api/refatorado/fornecedores")
public class FornecedorController {

    private final ClienteController clienteController;

    @Autowired
    public FornecedorController(ClienteController clienteController) {
        this.clienteController = clienteController;
    }

    @PostMapping
    public ResponseEntity<?> criarFornecedor(@RequestBody Map<String, Object> payload) {
        if (payload != null) payload.put("tipo_cadastro", "fornecedor");
        return clienteController.criarCliente(payload);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarFornecedor(@PathVariable("id") Long id, @RequestBody Map<String, Object> payload) {
        if (payload != null) payload.put("tipo_cadastro", "fornecedor");
        return clienteController.atualizarClientePut(id, payload);
    }
}
