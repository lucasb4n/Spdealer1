package br.com.spdealer.service;

import br.com.spdealer.dto.UserGroupRequest;
import br.com.spdealer.exception.ValidationException;
import br.com.spdealer.model.Program;
import br.com.spdealer.model.UserGroup;
import br.com.spdealer.model.UserGroupPermission;
import br.com.spdealer.repository.ProgramRepository;
import br.com.spdealer.repository.UserGroupPermissionRepository;
import br.com.spdealer.repository.UserGroupRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserGroupService {

    private final UserGroupRepository userGroupRepository;
    private final UserGroupPermissionRepository permissionRepository;
    private final ProgramRepository programRepository;
    private final ValidatorService validatorService;

    public List<UserGroup> listAll() {
        return userGroupRepository.findAll();
    }

    public UserGroup getById(Long id) {
        return userGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User group not found"));
    }

    public UserGroup create(UserGroupRequest request) throws ValidationException {
        validateRequest(request, null);
        UserGroup group = new UserGroup();
        copyRequest(group, request);
        group = userGroupRepository.save(group);
        syncPermissions(group, request.permissionProgramIds());
        return userGroupRepository.save(group);
    }

    public UserGroup update(Long id, UserGroupRequest request) throws ValidationException {
        UserGroup group = userGroupRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User group not found"));
        validateRequest(request, id);
        copyRequest(group, request);
        group = userGroupRepository.save(group);
        syncPermissions(group, request.permissionProgramIds());
        return userGroupRepository.save(group);
    }

    public void delete(Long id) {
        if (!userGroupRepository.existsById(id)) {
            throw new EntityNotFoundException("User group not found");
        }
        permissionRepository.deleteByGroupId(id);
        userGroupRepository.deleteById(id);
    }

    private void validateRequest(UserGroupRequest request, Long existingGroupId) throws ValidationException {
        validatorService.validateRequired(request.nome(), "nome");
        validatorService.validateLength(request.descricao(), 255, "descricao");
        if (StringUtils.hasText(request.status())) {
            validatorService.validateEnum(request.status(), List.of("ativo", "inativo"), "status");
        }
        String normalized = request.nome().trim();
        boolean exists = existingGroupId == null
                ? userGroupRepository.existsByNomeIgnoreCase(normalized)
                : userGroupRepository.existsByNomeIgnoreCaseAndIdNot(normalized, existingGroupId);
        if (exists) {
            throw new ValidationException("Já existe um grupo com esse nome", "nome", "DUPLICATE_GROUP");
        }
    }

    private void copyRequest(UserGroup group, UserGroupRequest request) {
        group.setNome(request.nome().trim());
        group.setDescricao(request.descricao());
        group.setStatus(StringUtils.hasText(request.status()) ? request.status() : "ativo");
        group.setObservacoes(request.observacoes());
    }

    private void syncPermissions(UserGroup group, List<Long> permissionProgramIds) throws ValidationException {
        permissionRepository.deleteByGroupId(group.getId());
        if (permissionProgramIds == null || permissionProgramIds.isEmpty()) {
            group.setPermissions(new ArrayList<>());
            return;
        }
        List<Program> programs = programRepository.findAllById(permissionProgramIds);
        Set<Long> foundProgramIds = programs.stream()
                .filter(Objects::nonNull)
                .map(Program::getId)
                .collect(Collectors.toSet());
        List<Long> missing = permissionProgramIds.stream()
                .filter(Objects::nonNull)
                .filter(id -> !foundProgramIds.contains(id))
                .distinct()
                .collect(Collectors.toList());
        if (!missing.isEmpty()) {
            throw new ValidationException("Programas informados não existem: " + missing,
                    "permissionProgramIds", "PROGRAM_NOT_FOUND");
        }
        Map<Long, Program> programById = programs.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Program::getId, program -> program));
        List<UserGroupPermission> permissions = permissionProgramIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .map(programById::get)
                .filter(Objects::nonNull)
                .map(program -> {
                    UserGroupPermission permission = new UserGroupPermission();
                    permission.setGroup(group);
                    permission.setProgram(program);
                    permission.setPermitido(true);
                    return permission;
                })
                .collect(Collectors.toList());
        group.setPermissions(permissions);
    }
}
