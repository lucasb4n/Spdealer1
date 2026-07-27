package br.com.spdealer.controller;

import br.com.spdealer.model.MenuGroup;
import br.com.spdealer.model.MenuItem;
import br.com.spdealer.repository.MenuGroupRepository;
import br.com.spdealer.repository.MenuItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MenuAdminController.class)
public class MenuAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MenuGroupRepository menuGroupRepository;

    @MockBean
    private MenuItemRepository menuItemRepository;

    @Test
    public void listFullMenu_returns200() throws Exception {
        when(menuGroupRepository.findAllWithItemsByOrderByOrder()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/admin/menu")).andExpect(status().isOk());
    }
}
