package br.com.spdealer.service;

import br.com.spdealer.dto.MenuPermissionDTO;
import br.com.spdealer.dto.MenuGroupPermissionDTO;
import br.com.spdealer.dto.MenuItemPermissionDTO;
import br.com.spdealer.model.User;
import br.com.spdealer.model.UserMenuConfig;
import br.com.spdealer.repository.MenuGroupRepository;
import br.com.spdealer.repository.MenuItemRepository;
import br.com.spdealer.repository.UserMenuConfigRepository;
import br.com.spdealer.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuPermissionService {
    
    private final UserRepository userRepository;
    private final MenuGroupRepository menuGroupRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserMenuConfigRepository userMenuConfigRepository;

    public List<MenuPermissionDTO> getAllUserPermissions() {
        return userRepository.findAll().stream()
            .map(this::getUserPermissions)
            .toList();
    }

    public MenuPermissionDTO getUserPermissions(Long userId) {
        return userRepository.findById(userId)
            .map(this::getUserPermissions)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    @Transactional
    public void updateUserPermissions(Long userId, MenuPermissionDTO permissions) {
        // Validar usuário
        userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // Atualizar configurações
        userMenuConfigRepository.deleteByUserId(userId);
        
        // Salvar novas configurações
        permissions.getGroups().forEach(group -> {
            group.getItems().forEach(item -> {
                userMenuConfigRepository.save(UserMenuConfig.builder()
                    .userId(userId)
                    .menuItemId(item.getItemId())
                    .visible(item.isVisible())
                    .order(item.getOrder())
                    .build());
            });
        });
    }

    private MenuPermissionDTO getUserPermissions(User user) {
        MenuPermissionDTO dto = new MenuPermissionDTO();
        dto.setUserId(user.getId());
        dto.setUserName(user.getUsername());
        
        // Carregar grupos e seus itens com as permissões do usuário
        List<MenuGroupPermissionDTO> groups = menuGroupRepository.findAll().stream()
            .map(group -> {
                MenuGroupPermissionDTO groupDto = new MenuGroupPermissionDTO();
                groupDto.setGroupId(group.getId());
                groupDto.setGroupName(group.getName());
                groupDto.setGroupIcon(group.getIcon());
                
                // Carregar itens do grupo com as permissões
                List<MenuItemPermissionDTO> items = menuItemRepository
                    .findByGroup_IdOrderByOrder(group.getId()).stream()
                    .map(item -> {
                        MenuItemPermissionDTO itemDto = new MenuItemPermissionDTO();
                        itemDto.setItemId(item.getId());
                        itemDto.setItemName(item.getName());
                        itemDto.setItemIcon(item.getIcon());
                        
                        // Buscar configuração do usuário para este item
                        userMenuConfigRepository
                            .findByUserIdAndMenuItemId(user.getId(), item.getId())
                            .ifPresent(config -> {
                                itemDto.setVisible(config.getVisible());
                                itemDto.setOrder(config.getOrder());
                            });
                        
                        return itemDto;
                    })
                    .toList();
                
                groupDto.setItems(items);
                return groupDto;
            })
            .toList();
        
        dto.setGroups(groups);
        return dto;
    }
}