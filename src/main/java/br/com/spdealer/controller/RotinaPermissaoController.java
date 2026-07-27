package br.com.spdealer.controller;

import br.com.spdealer.dto.RotinaPermissaoResponse;
import br.com.spdealer.model.Program;
import br.com.spdealer.model.User;
import br.com.spdealer.model.UserGroup;
import br.com.spdealer.model.UserGroupPermission;
import br.com.spdealer.repository.ProgramRepository;
import br.com.spdealer.repository.UserGroupRepository;
import br.com.spdealer.repository.UserGroupPermissionRepository;
import br.com.spdealer.repository.UserRepository;
import br.com.spdealer.service.RotinaPermissaoService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rotinas/permissao")
@RequiredArgsConstructor
public class RotinaPermissaoController {

    private final RotinaPermissaoService rotinaPermissaoService;
    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;
    private final ProgramRepository programRepository;
    private final UserGroupPermissionRepository permissionRepository;

    @GetMapping("/{usuarioId}")
    public ResponseEntity<?> getPermissoes(@PathVariable Long usuarioId) {
        User usuario = userRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Long grupoId = usuario.getGroupId();
        UserGroup grupo = grupoId != null ? userGroupRepository.findById(grupoId).orElse(null) : null;

        List<Program> allPrograms = programRepository.findAllActive();

        List<RotinaPermissaoResponse.RotinaItem> rotinas = allPrograms.stream()
                .map(program -> {
                    boolean permitida = rotinaPermissaoService.temPermissao(usuarioId, program.getCodigo());
                    return RotinaPermissaoResponse.RotinaItem.builder()
                            .id(program.getId())
                            .codigo(program.getCodigo())
                            .descricao(program.getDescricao())
                            .tipo(program.getTipo())
                            .permitida(permitida)
                            .build();
                })
                .collect(Collectors.toList());

        RotinaPermissaoResponse response = RotinaPermissaoResponse.builder()
                .usuarioId(usuarioId)
                .nomeUsuario(usuario.getName())
                .grupoId(grupoId)
                .nomeGrupo(grupo != null ? grupo.getNome() : null)
                .admin(rotinaPermissaoService.isAdmin(usuarioId))
                .diretoria(rotinaPermissaoService.isDiretoria(usuarioId))
                .financeiro(rotinaPermissaoService.isFinanceiro(usuarioId))
                .vendas(rotinaPermissaoService.isVendas(usuarioId))
                .compras(rotinaPermissaoService.isCompras(usuarioId))
                .estoque(rotinaPermissaoService.isEstoque(usuarioId))
                .rotinas(rotinas)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{usuarioId}/check/{codigoRotina}")
    public ResponseEntity<?> checkPermissao(@PathVariable Long usuarioId, @PathVariable String codigoRotina) {
        boolean permitido = rotinaPermissaoService.temPermissao(usuarioId, codigoRotina);
        return ResponseEntity.ok(java.util.Map.of(
                "usuarioId", usuarioId,
                "codigoRotina", codigoRotina,
                "permitido", permitido
        ));
    }

    @GetMapping("/{usuarioId}/financeiro")
    public ResponseEntity<?> getPermissoesFinanceiro(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(java.util.Map.ofEntries(
                java.util.Map.entry("usuarioId", usuarioId),
                java.util.Map.entry("podeVisualizar", rotinaPermissaoService.podeVisualizarPagamento(usuarioId)),
                java.util.Map.entry("podeInserir", rotinaPermissaoService.podeInserirPagamento(usuarioId)),
                java.util.Map.entry("podeAutorizar", rotinaPermissaoService.podeAutorizarPagamento(usuarioId)),
                java.util.Map.entry("podeEfetivar", rotinaPermissaoService.podeEfetivarPagamento(usuarioId)),
                java.util.Map.entry("podeCancelar", rotinaPermissaoService.podeCancelarPagamento(usuarioId)),
                java.util.Map.entry("podeParcial", rotinaPermissaoService.podeRealizarPagamentoParcial(usuarioId)),
                java.util.Map.entry("podeBanco", rotinaPermissaoService.podeDefinirBanco(usuarioId)),
                java.util.Map.entry("podeAlterar", rotinaPermissaoService.podeAlterarAjustes(usuarioId)),
                java.util.Map.entry("podeVisualizarCaixa", rotinaPermissaoService.podeVisualizarCaixa(usuarioId)),
                java.util.Map.entry("podeInserirCaixa", rotinaPermissaoService.podeInserirCaixa(usuarioId)),
                java.util.Map.entry("isFinanceiro", rotinaPermissaoService.isFinanceiro(usuarioId)),
                java.util.Map.entry("isDiretoria", rotinaPermissaoService.isDiretoria(usuarioId))
        ));
    }
}
