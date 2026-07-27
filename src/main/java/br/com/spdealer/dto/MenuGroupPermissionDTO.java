package br.com.spdealer.dto;

import java.util.List;

public class MenuGroupPermissionDTO {
    private Long groupId;
    private String groupName;
    private String groupIcon;
    private boolean visible;
    private int order;
    private List<MenuItemPermissionDTO> items;

    public Long getGroupId() {
        return groupId;
    }

    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public String getGroupName() {
        return groupName;
    }

    public void setGroupName(String groupName) {
        this.groupName = groupName;
    }

    public String getGroupIcon() {
        return groupIcon;
    }

    public void setGroupIcon(String groupIcon) {
        this.groupIcon = groupIcon;
    }

    public boolean isVisible() {
        return visible;
    }

    public void setVisible(boolean visible) {
        this.visible = visible;
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public List<MenuItemPermissionDTO> getItems() {
        return items;
    }

    public void setItems(List<MenuItemPermissionDTO> items) {
        this.items = items;
    }
}