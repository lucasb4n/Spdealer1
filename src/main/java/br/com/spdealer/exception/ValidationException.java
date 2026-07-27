package br.com.spdealer.exception;

/**
 * ValidationException - Exceção customizada para erros de validação
 * 
 * Usada quando:
 * - Campo obrigatório vazio
 * - Email inválido
 * - CPF/CNPJ inválido
 * - Padrão regex não matches
 * - Valor fora do intervalo permitido
 * - Comprimento excedido
 */
public class ValidationException extends Exception {
    private final String fieldName;
    private final String errorCode;
    
    /**
     * Constructor com campo e código de erro
     */
    public ValidationException(String message, String fieldName, String errorCode) {
        super(message);
        this.fieldName = fieldName;
        this.errorCode = errorCode;
    }
    
    /**
     * Constructor simples (compatibilidade)
     */
    public ValidationException(String message) {
        super(message);
        this.fieldName = null;
        this.errorCode = "VALIDATION_ERROR";
    }
    
    public String getFieldName() {
        return fieldName;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
