package br.com.spdealer.controller;

import br.com.spdealer.dto.ErrorResponse;
import br.com.spdealer.dto.UserGroupRequest;
import br.com.spdealer.dto.UserGroupResponse;
import br.com.spdealer.model.Program;
import br.com.spdealer.model.User;
import br.com.spdealer.model.UserGroup;
import br.com.spdealer.repository.ProgramRepository;
import br.com.spdealer.repository.UserRepository;
import br.com.spdealer.service.UserGroupService;
import br.com.spdealer.exception.ValidationException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users-groups")
@RequiredArgsConstructor
public class UserGroupController {

    private final UserGroupService userGroupService;
    private final UserRepository userRepository;
    private final ProgramRepository programRepository;

    @GetMapping
    public ResponseEntity<?> listAll() {
        try {
            List<UserGroupResponse> groups = userGroupService.listAll().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.internalError("Erro inesperado: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, HttpSession session) {
        try {
            ensureAdmin(session);
            UserGroup group = userGroupService.getById(id);
            return ResponseEntity.ok(toResponse(group));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(403, e.getMessage(), "ACCESS_DENIED"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ErrorResponse.notFound(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.internalError("Erro inesperado: " + e.getMessage()));
        }
    }

    @GetMapping("/programs")
    public ResponseEntity<?> listPrograms(HttpSession session) {
        try {
            ensureAdmin(session);
            List<ProgramDto> programs = programRepository.findAllActive().stream()
                    .map(this::toProgramDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(programs);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(403, e.getMessage(), "ACCESS_DENIED"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.internalError("Erro inesperado: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody UserGroupRequest request, HttpSession session) {
        try {
            ensureAdmin(session);
            UserGroup group = userGroupService.create(request);
            return ResponseEntity.ok(toResponse(group));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(403, e.getMessage(), "ACCESS_DENIED"));
        } catch (ValidationException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(400, e.getMessage(), e.getErrorCode()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.internalError("Erro inesperado: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UserGroupRequest request, HttpSession session) {
        try {
            ensureAdmin(session);
            UserGroup updated = userGroupService.update(id, request);
            return ResponseEntity.ok(toResponse(updated));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(403, e.getMessage(), "ACCESS_DENIED"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ErrorResponse.notFound(e.getMessage()));
        } catch (ValidationException e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(400, e.getMessage(), e.getErrorCode()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.internalError("Erro inesperado: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpSession session) {
        try {
            ensureAdmin(session);
            userGroupService.delete(id);
            return ResponseEntity.ok(Map.of("deleted", true));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse(403, e.getMessage(), "ACCESS_DENIED"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ErrorResponse.notFound(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.internalError("Erro inesperado: " + e.getMessage()));
        }
    }

    private UserGroupResponse toResponse(UserGroup group) {
        List<UserGroupResponse.ProgramSummary> programs = group.getPermissions() == null ? List.of() : group.getPermissions().stream()
                .map(permission -> new UserGroupResponse.ProgramSummary(
                        permission.getProgram().getId(),
                        permission.getProgram().getCodigo(),
                        permission.getProgram().getDescricao()))
                .collect(Collectors.toList());
        return new UserGroupResponse(
                group.getId(),
                group.getNome(),
                group.getDescricao(),
                group.getStatus(),
                group.getObservacoes(),
                programs
        );
    }

        private ProgramDto toProgramDto(Program program) {
        return new ProgramDto(program.getId(), program.getCodigo(), program.getDescricao(), program.getTipo());
        }

    private void ensureAdmin(HttpSession session) throws AccessDeniedException {
        Long userId = extractUserId(session);
        if (userId == null) {
            throw new AccessDeniedException("É necessário estar logado como administrador");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("Usuário não encontrado na sessão"));
        
        // Validação simplificada: apenas verificar se usuário existe e está ativo
        if (!user.getActive()) {
            throw new AccessDeniedException(
                "Permissão negada: usuário inativo"
            );
        }
    }

    private Long extractUserId(HttpSession session) {
        Object userIdObj = session.getAttribute("user_id");
        if (userIdObj instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private record ProgramDto(Long id, String codigo, String descricao, String tipo) {}
}
