package br.com.spdealer.dto;

import lombok.Data;

@Data
public class MenuSubItemPermissionDTO {
    private Long subItemId;
    private String subItemName;
    private boolean visible;
    private int order;
}