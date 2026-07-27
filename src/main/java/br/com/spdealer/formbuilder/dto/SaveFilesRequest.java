package br.com.spdealer.formbuilder.dto;

import java.util.List;

public class SaveFilesRequest {
    private List<FilePayload> files;

    public SaveFilesRequest() {}

    public SaveFilesRequest(List<FilePayload> files) {
        this.files = files;
    }

    public List<FilePayload> getFiles() {
        return files;
    }

    public void setFiles(List<FilePayload> files) {
        this.files = files;
    }
}
