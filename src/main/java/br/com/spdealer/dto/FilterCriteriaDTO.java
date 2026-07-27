package br.com.spdealer.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.io.Serializable;

/**
 * DTO para representar um critério de filtro
 * 
 * Enviado pelo frontend como:
 * {
 *   "field": "nome_cli",
 *   "operator": "contains",
 *   "value": "ABC",
 *   "valueFrom": null,
 *   "valueTo": null
 * }
 */
public class FilterCriteriaDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;

    @JsonProperty("field")
    private String field;

    @JsonProperty("operator")
    private String operator; // contains, equals, >, <, >=, <=, between, in

    @JsonProperty("value")
    private Object value; // String, Number, ou Array

    @JsonProperty("valueFrom")
    private Object valueFrom; // Para operador 'between'

    @JsonProperty("valueTo")
    private Object valueTo; // Para operador 'between'

    // Construtores
    public FilterCriteriaDTO() {
    }

    public FilterCriteriaDTO(String field, String operator, Object value) {
        this.field = field;
        this.operator = operator;
        this.value = value;
    }

    // Getters e Setters
    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public Object getValueFrom() {
        return valueFrom;
    }

    public void setValueFrom(Object valueFrom) {
        this.valueFrom = valueFrom;
    }

    public Object getValueTo() {
        return valueTo;
    }

    public void setValueTo(Object valueTo) {
        this.valueTo = valueTo;
    }

    // ToString para debug
    @Override
    public String toString() {
        return "FilterCriteriaDTO{" +
                "field='" + field + '\'' +
                ", operator='" + operator + '\'' +
                ", value=" + value +
                ", valueFrom=" + valueFrom +
                ", valueTo=" + valueTo +
                '}';
    }
}
