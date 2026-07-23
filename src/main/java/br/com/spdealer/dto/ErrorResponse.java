package br.com.spdealer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * ErrorResponse DTO - Resposta padronizada para erros
 * 
 * Usado em:
 * - 400 Bad Request (validação)
 * - 404 Not Found
 * - 409 Conflict (duplicata)
 * - 500 Internal Server Error
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private int status;
    private String message;
    private String errorCode;
    private String timestamp;
    private String path;
    
    // Para erros de validação específicos de campo
    private Map<String, String> fieldErrors;
    
    // Stack trace (apenas em development)
    private String details;
    
    /**
     * Constructor simples
     */
    public ErrorResponse() {
        this.timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
    
    /**
     * Constructor com status e mensagem
     */
    public ErrorResponse(int status, String message) {
        this();
        this.status = status;
        this.message = message;
    }
    
    /**
     * Constructor com status, mensagem e código de erro
     */
    public ErrorResponse(int status, String message, String errorCode) {
        this(status, message);
        this.errorCode = errorCode;
    }
    
    /**
     * Constructor com status, mensagem, código e path
     */
    public ErrorResponse(int status, String message, String errorCode, String path) {
        this(status, message, errorCode);
        this.path = path;
    }
    
    // Getters e Setters
    public int getStatus() {
        return status;
    }
    
    public void setStatus(int status) {
        this.status = status;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
    
    public String getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getPath() {
        return path;
    }
    
    public void setPath(String path) {
        this.path = path;
    }
    
    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
    
    public void setFieldErrors(Map<String, String> fieldErrors) {
        this.fieldErrors = fieldErrors;
    }
    
    public void addFieldError(String field, String error) {
        if (this.fieldErrors == null) {
            this.fieldErrors = new HashMap<>();
        }
        this.fieldErrors.put(field, error);
    }
    
    public String getDetails() {
        return details;
    }
    
    public void setDetails(String details) {
        this.details = details;
    }
    
    /**
     * Factory: Erro de validação com múltiplos campos
     */
    public static ErrorResponse validationError(String message, Map<String, String> fieldErrors) {
        ErrorResponse response = new ErrorResponse(400, message, "VALIDATION_ERROR");
        response.setFieldErrors(fieldErrors);
        return response;
    }
    
    /**
     * Factory: Recurso não encontrado (404)
     */
    public static ErrorResponse notFound(String message) {
        return new ErrorResponse(404, message, "NOT_FOUND");
    }
    
    /**
     * Factory: Conflito/duplicata (409)
     */
    public static ErrorResponse conflict(String message) {
        return new ErrorResponse(409, message, "CONFLICT");
    }
    
    /**
     * Factory: Erro interno do servidor (500)
     */
    public static ErrorResponse internalError(String message) {
        return new ErrorResponse(500, message, "INTERNAL_SERVER_ERROR");
    }
}
