package br.com.spdealer.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.HashMap;
import java.util.Map;

/**
 * ParametrosGeraisDTO
 * 
 * DTO dinâmico para mapear todos os campos da tabela MASGER
 * Permite adicionar/remover campos sem alterar o código
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ParametrosGeraisDTO {

    private Map<String, Object> dados = new HashMap<>();

    /**
     * Adiciona qualquer campo dinamicamente
     */
    @JsonAnySetter
    public void setDado(String key, Object value) {
        this.dados.put(key, value);
    }

    /**
     * Retorna o mapa com todos os dados
     */
    public Map<String, Object> getDados() {
        return dados;
    }

    /**
     * Obtém um valor específico
     */
    public Object get(String key) {
        return dados.get(key);
    }

    /**
     * Define um valor específico
     */
    public void set(String key, Object value) {
        dados.put(key, value);
    }

    /**
     * Sobrescreve todo o mapa
     */
    public void setDados(Map<String, Object> dados) {
        this.dados = dados;
    }

    @Override
    public String toString() {
        return "ParametrosGeraisDTO{" +
                "dados=" + dados +
                '}';
    }
}
