package br.com.spdealer.dto;

import java.util.List;

public class MenuPermissionDTO {
    private Long userId;
    private String userName;
    private List<MenuGroupPermissionDTO> groups;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public List<MenuGroupPermissionDTO> getGroups() {
        return groups;
    }

    public void setGroups(List<MenuGroupPermissionDTO> groups) {
        this.groups = groups;
    }
}