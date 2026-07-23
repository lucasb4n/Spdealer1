package br.com.spdealer.formbuilder.dto;

public class FilePayload {
    private String path;
    private String content;
    private String description;

    public FilePayload() {}

    public FilePayload(String path, String content, String description) {
        this.path = path;
        this.content = content;
        this.description = description;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
