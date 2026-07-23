package br.com.spdealer.service;

import br.com.spdealer.model.Program;
import br.com.spdealer.model.User;
import br.com.spdealer.model.UserGroup;
import br.com.spdealer.model.UserGroupPermission;
import br.com.spdealer.repository.ProgramRepository;
import br.com.spdealer.repository.UserGroupPermissionRepository;
import br.com.spdealer.repository.UserGroupRepository;
import br.com.spdealer.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RotinaPermissaoService {

    private final UserRepository userRepository;
    private final UserGroupRepository userGroupRepository;
    private final UserGroupPermissionRepository permissionRepository;
    private final ProgramRepository programRepository;

    public static final Long GRUPO_ADMIN = 1L;
    public static final Long GRUPO_DIRETORIA = 2L;
    public static final Long GRUPO_FINANCEIRO = 3L;
    public static final Long GRUPO_VENDAS = 4L;
    public static final Long GRUPO_COMPRAS = 5L;
    public static final Long GRUPO_ESTOQUE = 6L;

    public static final String PROGRAM_FINANCEIRO_PAGAMENTO_VISUALIZAR = "FINANCEIRO.PAGAMENTO.VISUALIZAR";
    public static final String PROGRAM_FINANCEIRO_PAGAMENTO_INSERIR = "FINANCEIRO.PAGAMENTO.INSERIR";
    public static final String PROGRAM_FINANCEIRO_PAGAMENTO_AUTORIZAR = "FINANCEIRO.PAGAMENTO.AUTORIZAR";
    public static final String PROGRAM_FINANCEIRO_PAGAMENTO_EFETIVAR = "FINANCEIRO.PAGAMENTO.EFETIVAR";
    public static final String PROGRAM_FINANCEIRO_PAGAMENTO_CANCELAR = "FINANCEIRO.PAGAMENTO.CANCELAR";
    public static final String PROGRAM_FINANCEIRO_PAGAMENTO_PARCIAL = "FINANCEIRO.PAGAMENTO.PARCIAL";
    public static final String PROGRAM_FINANCEIRO_PAGAMENTO_BANCO = "FINANCEIRO.PAGAMENTO.BANCO";
    public static final String PROGRAM_FINANCEIRO_PAGAMENTO_ALTERAR = "FINANCEIRO.PAGAMENTO.ALTERAR";
    public static final String PROGRAM_FINANCEIRO_CAIXA_VISUALIZAR = "FINANCEIRO.CAIXA.VISUALIZAR";
    public static final String PROGRAM_FINANCEIRO_CAIXA_INSERIR = "FINANCEIRO.CAIXA.INSERIR";
    public static final String PROGRAM_PRODUTO_PRECO_CUSTO = "PRODUTO.PRECO_CUSTO";

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    public boolean temPermissao(Long usuarioId, String codigoRotina) {
        return temPermissao(usuarioId, codigoRotina, "visualizar");
    }

    public boolean temPermissao(Long usuarioId, String codigoRotina, String acao) {
        Optional<Program> programOpt = programRepository.findByCodigo(codigoRotina);
        if (programOpt.isEmpty()) return false;
        return temPermissao(usuarioId, programOpt.get().getId(), acao);
    }

    public boolean temPermissao(Long usuarioId, Long routineId, String acao) {
        if (usuarioId == null || routineId == null) {
            return false;
        }

        Optional<User> usuarioOpt = userRepository.findById(usuarioId);
        if (usuarioOpt.isEmpty()) {
            return false;
        }

        User usuario = usuarioOpt.get();
        if (!usuario.getActive()) {
            return false;
        }

        // 1. ADMIN - Acesso total
        if (GRUPO_ADMIN.equals(usuario.getGroupId())) {
            return true;
        }

        // 2. VERIFICAR SOBREPOSIÇÃO INDIVIDUAL (PERMISSION JSON)
        String permissionsJson = usuario.getPermissions();
        if (permissionsJson != null && !permissionsJson.isEmpty()) {
            try {
                com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(permissionsJson);
                if (root.isArray()) {
                    for (com.fasterxml.jackson.databind.JsonNode node : root) {
                        // Formato Novo: [{"programId": 413, "visualizar": true, "editar": true, ...}]
                        if (node.has("programId") && node.get("programId").asLong() == routineId) {
                            return isAcaoPermitida(node, acao);
                        }
                        // Formato Antigo (Fallback): [1, 2, 413]
                        if (node.isNumber() && node.asLong() == routineId) {
                            return true;
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Erro ao processar permissões JSON (ID: "+usuarioId+"): " + e.getMessage());
            }
        }

        // 3. FALLBACK PARA O GRUPO
        Long grupoId = usuario.getGroupId();
        if (grupoId == null) {
            return false;
        }

        return permissionRepository.existsByGroupIdAndProgramId(grupoId, routineId);
    }

    private boolean isAcaoPermitida(com.fasterxml.jackson.databind.JsonNode node, String acao) {
        if (acao == null) return true;
        return switch (acao.toLowerCase()) {
            case "visivel" -> node.path("visivel").asBoolean(false);
            case "editar", "incluir_editar" -> node.path("editar").asBoolean(false);
            case "excluir" -> node.path("excluir").asBoolean(false);
            case "visualizar" -> node.path("visualizar").asBoolean(false);
            default -> node.path("visualizar").asBoolean(false);
        };
    }

    public boolean podeEditar(Long usuarioId, String codigoRotina) {
        return temPermissao(usuarioId, codigoRotina, "editar");
    }

    public boolean podeExcluir(Long usuarioId, String codigoRotina) {
        return temPermissao(usuarioId, codigoRotina, "excluir");
    }

    public boolean isVisivel(Long usuarioId, String codigoRotina) {
        return temPermissao(usuarioId, codigoRotina, "visivel");
    }

    // Mantendo métodos legados e adaptando
    public boolean isAdmin(Long usuarioId) {
        return isGrupo(usuarioId, GRUPO_ADMIN);
    }

    public boolean isDiretoria(Long usuarioId) {
        return isGrupo(usuarioId, GRUPO_DIRETORIA);
    }

    public boolean isFinanceiro(Long usuarioId) {
        return isGrupo(usuarioId, GRUPO_FINANCEIRO);
    }

    public boolean isVendas(Long usuarioId) {
        return isGrupo(usuarioId, GRUPO_VENDAS);
    }

    public boolean isCompras(Long usuarioId) {
        return isGrupo(usuarioId, GRUPO_COMPRAS);
    }

    public boolean isEstoque(Long usuarioId) {
        return isGrupo(usuarioId, GRUPO_ESTOQUE);
    }

    private boolean isGrupo(Long usuarioId, Long grupoId) {
        if (usuarioId == null) {
            return false;
        }
        return userRepository.findById(usuarioId)
                .map(user -> grupoId.equals(user.getGroupId()))
                .orElse(false);
    }

    public boolean podeVisualizarPagamento(Long usuarioId) {
        return temPermissao(usuarioId, 413L, "visualizar");
    }

    public boolean podeInserirPagamento(Long usuarioId) {
        return temPermissao(usuarioId, 413L, "editar");
    }

    public boolean podeAutorizarPagamento(Long usuarioId) {
        return temPermissao(usuarioId, 413L, "editar");
    }

    public boolean podeEfetivarPagamento(Long usuarioId) {
        return temPermissao(usuarioId, 413L, "editar");
    }

    public boolean podeCancelarPagamento(Long usuarioId) {
        return temPermissao(usuarioId, 413L, "excluir");
    }

    public boolean podeRealizarPagamentoParcial(Long usuarioId) {
        return temPermissao(usuarioId, 413L, "editar");
    }

    public boolean podeDefinirBanco(Long usuarioId) {
        return temPermissao(usuarioId, 413L, "editar");
    }

    public boolean podeAlterarAjustes(Long usuarioId) {
        return temPermissao(usuarioId, 413L, "editar");
    }

    public boolean podeVisualizarReceber(Long usuarioId) {
        return temPermissao(usuarioId, 412L, "visualizar");
    }

    public boolean podeLiquidarReceber(Long usuarioId) {
        return temPermissao(usuarioId, 412L, "editar");
    }

    public boolean podeVisualizarCaixa(Long usuarioId) {
        return temPermissao(usuarioId, 414L, "visualizar");
    }

    public boolean podeInserirCaixa(Long usuarioId) {
        return temPermissao(usuarioId, 414L, "editar");
    }

    public boolean podeVisualizarPrecoCusto(Long usuarioId) {
        return temPermissao(usuarioId, PROGRAM_PRODUTO_PRECO_CUSTO);
    }
}
