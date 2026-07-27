package br.com.spdealer.service;

import br.com.spdealer.model.MenuGroup;
import br.com.spdealer.model.MenuItem;
import br.com.spdealer.model.User;
import br.com.spdealer.repository.MenuGroupRepository;
import br.com.spdealer.repository.MenuItemRepository;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MenuService {

    private static final Logger log = LoggerFactory.getLogger(MenuService.class);

    private final MenuGroupRepository menuGroupRepository;
    private final MenuItemRepository menuItemRepository;

    public MenuService(MenuGroupRepository menuGroupRepository, MenuItemRepository menuItemRepository) {
        this.menuGroupRepository = menuGroupRepository;
        this.menuItemRepository = menuItemRepository;
    }

    /**
     * Carrega os grupos de menu ativos ordenados
     */
    public List<MenuGroup> getActiveMenuGroups() {
        try {
            return menuGroupRepository.findByActiveOrderByOrder(true);
        } catch (Exception e) {
            log.error("Erro ao buscar grupos de menu ativos: {}", e.getMessage());
            return List.of(); // Retorna lista vazia em caso de erro
        }
    }

    /**
     * Carrega os grupos de menu com seus itens para um usuário específico
     * Posteriormente será filtrado por permissões do usuário
     */
    public List<MenuGroup> getMenuForUser(User user) {
        try {
            List<MenuGroup> groups = getActiveMenuGroups();
            return groups.stream()
                .map(group -> {
                    try {
                        // Buscar apenas itens de primeiro nível (parentId == null)
                        List<MenuItem> topLevelItems = menuItemRepository.findByGroup_IdAndActiveOrderByOrder(group.getId(), true)
                            .stream()
                            .filter(item -> item.getParentId() == null)
                            .collect(Collectors.toList());
                        // Para cada item de primeiro nível, buscar e setar os filhos
                        for (MenuItem item : topLevelItems) {
                            List<MenuItem> children = menuItemRepository.findByGroup_IdAndActiveOrderByOrder(group.getId(), true)
                                .stream()
                                .filter(child -> item.getId().equals(child.getParentId()))
                                .collect(Collectors.toList());
                            item.setChildren(children);
                        }
                        group.setItems(topLevelItems);
                        return group;
                    } catch (Exception e) {
                        log.warn("Erro ao processar itens do menu para grupo {}: {}", group.getName(), e.getMessage());
                        group.setItems(List.of());
                        return group;
                    }
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao carregar menu para usuário {}: {}", user != null ? user.getUsername() : "null", e.getMessage());
            return getSimpleMenuStructure();
        }
    }

    /**
     * Carrega dados básicos do menu para exibir no template
     * Retorna estrutura simples para o Thymeleaf
     */
    public List<MenuGroup> getSimpleMenuStructure() {
        try {
            log.info("Usando estrutura de menu simplificada (fallback)");
            // Por enquanto, retorna uma estrutura mock básica
            // TODO: Conectar com banco real ou criar menu padrão
            return List.of();
        } catch (Exception e) {
            log.error("Erro crítico no fallback de menu: {}", e.getMessage());
            return List.of(); // Sempre retorna lista vazia como último recurso
        }
    }
}