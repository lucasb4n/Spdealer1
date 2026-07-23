package br.com.spdealer.service;

import br.com.spdealer.exception.ConversionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * DataTypeConverterService - Conversão de tipos de dados
 * 
 * Responsável por converter strings de entrada para tipos corretos:
 * - String → Integer
 * - String → BigDecimal (valores monetários)
 * - String → LocalDate (datas)
 * - String → Boolean
 */
@Service
public class DataTypeConverterService {
    private static final Logger logger = LoggerFactory.getLogger(DataTypeConverterService.class);
    
    private static final DateTimeFormatter[] DATE_FORMATTERS = {
        DateTimeFormatter.ISO_LOCAL_DATE,           // yyyy-MM-dd
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),  // dd/MM/yyyy
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),  // dd-MM-yyyy
    };
    
    /**
     * Converter String para Integer
     * @param value String value (ex: "123")
     * @param fieldName Nome do campo para erro
     * @return Integer value
     * @throws ConversionException Se não conseguir converter
     */
    public Integer toInteger(String value, String fieldName) 
        throws ConversionException {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Remover espaços
            value = value.trim();
            
            // Remover pontuação numérica (ex: "1.000" → "1000")
            if (value.contains(".") && !value.contains(",")) {
                // Decimal point (EUA) - manter para validação
                return Integer.parseInt(value.replace(".", ""));
            }
            
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            logger.warn("Cannot convert '{}' to Integer for field '{}'", value, fieldName, e);
            throw new ConversionException(
                "Field '" + fieldName + "' must be a valid integer (value: " + value + ")",
                fieldName,
                "Integer",
                "INVALID_INTEGER"
            );
        }
    }
    
    /**
     * Converter String para Long
     */
    public Long toLong(String value, String fieldName) 
        throws ConversionException {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        try {
            value = value.trim();
            if (value.contains(".") && !value.contains(",")) {
                return Long.parseLong(value.replace(".", ""));
            }
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            logger.warn("Cannot convert '{}' to Long for field '{}'", value, fieldName, e);
            throw new ConversionException(
                "Field '" + fieldName + "' must be a valid long integer (value: " + value + ")",
                fieldName,
                "Long",
                "INVALID_LONG"
            );
        }
    }
    
    /**
     * Converter String para BigDecimal (valores monetários)
     * Formatos aceitos:
     * - "1234.56" (decimal point)
     * - "1234,56" (decimal comma - Brasil)
     * - "1.234,56" (thousands separator + comma)
     */
    public BigDecimal toDecimal(String value, String fieldName) 
        throws ConversionException {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        try {
            value = value.trim();
            
            // Normalizar formato brasileiro (1.234,56 → 1234.56)
            if (value.contains(",")) {
                // Remove thousands separator (ponto antes da última posição)
                value = value.replace(".", "");
                // Trocar vírgula por ponto para Java parsing
                value = value.replace(",", ".");
            }
            
            // Remover espaços
            value = value.replaceAll("\\s", "");
            
            // Validação básica
            if (!value.matches("^-?\\d+(\\.\\d{1,2})?$")) {
                throw new NumberFormatException("Invalid format");
            }
            
            BigDecimal result = new BigDecimal(value);
            
            // Arredondar para 2 casas decimais (padrão monetário)
            return result.setScale(2, java.math.RoundingMode.HALF_UP);
            
        } catch (NumberFormatException e) {
            logger.warn("Cannot convert '{}' to BigDecimal for field '{}'", value, fieldName, e);
            throw new ConversionException(
                "Field '" + fieldName + "' must be a valid decimal number (value: " + value + ")",
                fieldName,
                "BigDecimal",
                "INVALID_DECIMAL"
            );
        }
    }
    
    /**
     * Converter String para LocalDate
     * Tenta múltiplos formatos:
     * - YYYY-MM-DD (ISO - padrão)
     * - DD/MM/YYYY (Brasil)
     * - DD-MM-YYYY (alternativo)
     */
    public LocalDate toDate(String value, String fieldName) 
        throws ConversionException {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        value = value.trim();
        
        // Tentar cada formato
        for (DateTimeFormatter formatter : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(value, formatter);
            } catch (DateTimeParseException e) {
                // Continuar para próximo formato
            }
        }
        
        logger.warn("Cannot convert '{}' to LocalDate for field '{}'. Tried formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY", 
            value, fieldName);
        throw new ConversionException(
            "Field '" + fieldName + "' must be a valid date (YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY). Got: " + value,
            fieldName,
            "LocalDate",
            "INVALID_DATE"
        );
    }
    
    /**
     * Converter String para Boolean
     * Aceita:
     * - "true", "yes", "1", "sim", "s" → true
     * - "false", "no", "0", "nao", "n" → false
     */
    public Boolean toBoolean(String value, String fieldName) 
        throws ConversionException {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        value = value.trim().toLowerCase();
        
        if ("true".equals(value) || "yes".equals(value) || "1".equals(value) || 
            "sim".equals(value) || "s".equals(value)) {
            return true;
        }
        
        if ("false".equals(value) || "no".equals(value) || "0".equals(value) || 
            "nao".equals(value) || "não".equals(value) || "n".equals(value)) {
            return false;
        }
        
        logger.warn("Cannot convert '{}' to Boolean for field '{}'", value, fieldName);
        throw new ConversionException(
            "Field '" + fieldName + "' must be a valid boolean (true/false, yes/no, sim/nao, 1/0). Got: " + value,
            fieldName,
            "Boolean",
            "INVALID_BOOLEAN"
        );
    }
    
    /**
     * Converter valor genérico para tipo alvo
     * Usado quando o tipo é dinâmico (vem do dicionário)
     */
    public Object convertToType(String value, String targetType, String fieldName) 
        throws ConversionException {
        if (value == null) {
            return null;
        }
        
        switch (targetType.toLowerCase()) {
            case "integer":
            case "int":
                return toInteger(value, fieldName);
            case "long":
                return toLong(value, fieldName);
            case "decimal":
            case "double":
            case "bigdecimal":
                return toDecimal(value, fieldName);
            case "date":
            case "localdate":
                return toDate(value, fieldName);
            case "boolean":
            case "bool":
                return toBoolean(value, fieldName);
            case "string":
            case "text":
            case "char":
                return value;
            default:
                logger.warn("Unknown target type '{}' for field '{}'", targetType, fieldName);
                return value; // Default: return as string
        }
    }
}
