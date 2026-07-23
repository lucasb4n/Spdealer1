package br.com.spdealer.formbuilder.dto;

import java.util.List;

public class SaveFilesResponse {
    private boolean success;
    private List<String> paths;
    private String error;

    public SaveFilesResponse() {}

    public SaveFilesResponse(boolean success, List<String> paths, String error) {
        this.success = success;
        this.paths = paths;
        this.error = error;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public List<String> getPaths() {
        return paths;
    }

    public void setPaths(List<String> paths) {
        this.paths = paths;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
