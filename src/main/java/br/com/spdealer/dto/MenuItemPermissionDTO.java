package br.com.spdealer.dto;

import lombok.Data;
import java.util.List;

@Data
public class MenuItemPermissionDTO {
    private Long itemId;
    private String itemName;
    private String itemIcon;
    private boolean visible;
    private int order;
    private List<MenuSubItemPermissionDTO> subItems;
}