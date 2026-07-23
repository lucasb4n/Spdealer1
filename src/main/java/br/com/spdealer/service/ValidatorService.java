package br.com.spdealer.service;

import br.com.spdealer.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.*;

/**
 * ValidatorService - Validações de dados para operações CRUD
 * 
 * Responsável por:
 * - Validar campos obrigatórios
 * - Validar email, CPF, CNPJ
 * - Validar padrões regex customizados
 * - Validar intervalos de valores
 * - Validar comprimento de strings
 */
@Service
public class ValidatorService {
    private static final Logger logger = LoggerFactory.getLogger(ValidatorService.class);
    
    // Regex patterns
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern CPF_PATTERN = 
        Pattern.compile("^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$");
    private static final Pattern CNPJ_PATTERN = 
        Pattern.compile("^\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}$");
    private static final Pattern PHONE_PATTERN = 
        Pattern.compile("^\\(\\d{2}\\)\\s?\\d{4,5}-\\d{4}$");
    
    /**
     * Validar campo obrigatório
     * @param value Valor do campo
     * @param fieldName Nome do campo para mensagem de erro
     * @throws ValidationException Se valor está vazio/null
     */
    public void validateRequired(Object value, String fieldName) 
        throws ValidationException {
        if (value == null) {
            throw new ValidationException(
                "Field '" + fieldName + "' is required",
                fieldName,
                "REQUIRED"
            );
        }
        
        if (value instanceof String) {
            String strValue = ((String) value).trim();
            if (strValue.isEmpty()) {
                throw new ValidationException(
                    "Field '" + fieldName + "' is required",
                    fieldName,
                    "REQUIRED"
                );
            }
        }
    }
    
    /**
     * Validar email
     */
    public void validateEmail(String value, String fieldName) 
        throws ValidationException {
        if (value != null && !value.trim().isEmpty()) {
            if (!EMAIL_PATTERN.matcher(value).matches()) {
                throw new ValidationException(
                    "Field '" + fieldName + "' must be a valid email",
                    fieldName,
                    "INVALID_EMAIL"
                );
            }
        }
    }
    
    /**
     * Validar CPF com algoritmo de check digit
     * Formato esperado: XXX.XXX.XXX-XX
     */
    public void validateCPF(String value, String fieldName) 
        throws ValidationException {
        if (value != null && !value.trim().isEmpty()) {
            String clean = value.replaceAll("[^0-9]", "");
            
            if (clean.length() != 11) {
                throw new ValidationException(
                    "Field '" + fieldName + "' must have 11 digits",
                    fieldName,
                    "INVALID_CPF"
                );
            }
            
            // Verificar se todos os dígitos são iguais (CPF inválido)
            if (clean.matches("(\\d)\\1{10}")) {
                throw new ValidationException(
                    "Field '" + fieldName + "' is not a valid CPF",
                    fieldName,
                    "INVALID_CPF"
                );
            }
            
            // Validar primeiro check digit
            int sum = 0;
            for (int i = 0; i < 9; i++) {
                sum += Character.getNumericValue(clean.charAt(i)) * (10 - i);
            }
            int firstDigit = 11 - (sum % 11);
            firstDigit = firstDigit >= 10 ? 0 : firstDigit;
            
            if (Character.getNumericValue(clean.charAt(9)) != firstDigit) {
                throw new ValidationException(
                    "Field '" + fieldName + "' is not a valid CPF",
                    fieldName,
                    "INVALID_CPF"
                );
            }
            
            // Validar segundo check digit
            sum = 0;
            for (int i = 0; i < 10; i++) {
                sum += Character.getNumericValue(clean.charAt(i)) * (11 - i);
            }
            int secondDigit = 11 - (sum % 11);
            secondDigit = secondDigit >= 10 ? 0 : secondDigit;
            
            if (Character.getNumericValue(clean.charAt(10)) != secondDigit) {
                throw new ValidationException(
                    "Field '" + fieldName + "' is not a valid CPF",
                    fieldName,
                    "INVALID_CPF"
                );
            }
        }
    }
    
    /**
     * Validar CNPJ com algoritmo de check digit
     * Formato esperado: XX.XXX.XXX/XXXX-XX
     */
    public void validateCNPJ(String value, String fieldName) 
        throws ValidationException {
        if (value != null && !value.trim().isEmpty()) {
            String clean = value.replaceAll("[^0-9]", "");
            
            if (clean.length() != 14) {
                throw new ValidationException(
                    "Field '" + fieldName + "' must have 14 digits",
                    fieldName,
                    "INVALID_CNPJ"
                );
            }
            
            // Verificar se todos os dígitos são iguais (CNPJ inválido)
            if (clean.matches("(\\d)\\1{13}")) {
                throw new ValidationException(
                    "Field '" + fieldName + "' is not a valid CNPJ",
                    fieldName,
                    "INVALID_CNPJ"
                );
            }
            
            // Validar primeiro check digit
            int[] mult1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
            int sum = 0;
            for (int i = 0; i < 12; i++) {
                sum += Character.getNumericValue(clean.charAt(i)) * mult1[i];
            }
            int firstDigit = 11 - (sum % 11);
            firstDigit = firstDigit >= 10 ? 0 : firstDigit;
            
            if (Character.getNumericValue(clean.charAt(12)) != firstDigit) {
                throw new ValidationException(
                    "Field '" + fieldName + "' is not a valid CNPJ",
                    fieldName,
                    "INVALID_CNPJ"
                );
            }
            
            // Validar segundo check digit
            int[] mult2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
            sum = 0;
            for (int i = 0; i < 13; i++) {
                sum += Character.getNumericValue(clean.charAt(i)) * mult2[i];
            }
            int secondDigit = 11 - (sum % 11);
            secondDigit = secondDigit >= 10 ? 0 : secondDigit;
            
            if (Character.getNumericValue(clean.charAt(13)) != secondDigit) {
                throw new ValidationException(
                    "Field '" + fieldName + "' is not a valid CNPJ",
                    fieldName,
                    "INVALID_CNPJ"
                );
            }
        }
    }
    
    /**
     * Validar telefone brasileiro
     * Formatos aceitos: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
     */
    public void validatePhone(String value, String fieldName) 
        throws ValidationException {
        if (value != null && !value.trim().isEmpty()) {
            if (!PHONE_PATTERN.matcher(value).matches()) {
                throw new ValidationException(
                    "Field '" + fieldName + "' must be a valid phone number",
                    fieldName,
                    "INVALID_PHONE"
                );
            }
        }
    }
    
    /**
     * Validar contra padrão regex customizado
     */
    public void validatePattern(String value, String pattern, String fieldName) 
        throws ValidationException {
        if (value != null && !value.trim().isEmpty()) {
            try {
                Pattern p = Pattern.compile(pattern);
                if (!p.matcher(value).matches()) {
                    throw new ValidationException(
                        "Field '" + fieldName + "' does not match pattern",
                        fieldName,
                        "INVALID_PATTERN"
                    );
                }
            } catch (PatternSyntaxException e) {
                logger.error("Invalid regex pattern for field " + fieldName, e);
                throw new ValidationException(
                    "Invalid validation pattern configuration",
                    fieldName,
                    "INVALID_PATTERN_DEFINITION"
                );
            }
        }
    }
    
    /**
     * Validar intervalo de valores numéricos (min/max)
     */
    public void validateMinMax(Number value, Number min, Number max, String fieldName) 
        throws ValidationException {
        if (value != null) {
            double v = value.doubleValue();
            
            if (min != null && v < min.doubleValue()) {
                throw new ValidationException(
                    "Field '" + fieldName + "' must be >= " + min,
                    fieldName,
                    "VALUE_TOO_SMALL"
                );
            }
            
            if (max != null && v > max.doubleValue()) {
                throw new ValidationException(
                    "Field '" + fieldName + "' must be <= " + max,
                    fieldName,
                    "VALUE_TOO_LARGE"
                );
            }
        }
    }
    
    /**
     * Validar comprimento de string
     */
    public void validateLength(String value, Integer maxLength, String fieldName) 
        throws ValidationException {
        if (value != null && maxLength != null) {
            if (value.length() > maxLength) {
                throw new ValidationException(
                    "Field '" + fieldName + "' exceeds max length of " + maxLength,
                    fieldName,
                    "LENGTH_EXCEEDED"
                );
            }
        }
    }
    
    /**
     * Validar comprimento mínimo de string
     */
    public void validateMinLength(String value, Integer minLength, String fieldName) 
        throws ValidationException {
        if (value != null && minLength != null) {
            if (value.length() < minLength) {
                throw new ValidationException(
                    "Field '" + fieldName + "' must have at least " + minLength + " characters",
                    fieldName,
                    "LENGTH_TOO_SHORT"
                );
            }
        }
    }
    
    /**
     * Validar se value está em lista de valores permitidos
     */
    public void validateEnum(String value, List<String> allowedValues, String fieldName) 
        throws ValidationException {
        if (value != null && !value.trim().isEmpty()) {
            if (!allowedValues.contains(value)) {
                throw new ValidationException(
                    "Field '" + fieldName + "' must be one of: " + String.join(", ", allowedValues),
                    fieldName,
                    "INVALID_ENUM"
                );
            }
        }
    }
}
