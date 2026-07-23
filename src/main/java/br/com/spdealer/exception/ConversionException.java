package br.com.spdealer.exception;

/**
 * ConversionException - Exceção customizada para erros de conversão de tipos
 * 
 * Usada quando:
 * - String não pode ser convertida para Integer
 * - String não pode ser convertida para Decimal
 * - String não pode ser convertida para Date (formato inválido)
 * - String não pode ser convertida para Boolean
 */
public class ConversionException extends Exception {
    private final String fieldName;
    private final String targetType;
    private final String errorCode;
    
    /**
     * Constructor com campo, tipo alvo e código de erro
     */
    public ConversionException(String message, String fieldName, String targetType, String errorCode) {
        super(message);
        this.fieldName = fieldName;
        this.targetType = targetType;
        this.errorCode = errorCode;
    }
    
    /**
     * Constructor simples (compatibilidade)
     */
    public ConversionException(String message) {
        super(message);
        this.fieldName = null;
        this.targetType = null;
        this.errorCode = "CONVERSION_ERROR";
    }
    
    public String getFieldName() {
        return fieldName;
    }
    
    public String getTargetType() {
        return targetType;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
