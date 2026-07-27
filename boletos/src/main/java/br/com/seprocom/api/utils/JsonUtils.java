package br.com.seprocom.api.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

public class JsonUtils {

    private static final ObjectMapper mapper = new ObjectMapper()
            .configure(com.fasterxml.jackson.databind.SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

    public static String toJson(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new SprException("Erro ao serializar JSON", e);
        }
    }

    public static <T> T fromJson(String json, Class<T> type) {
        try {
            return mapper.readValue(json, type);
        } catch (JsonProcessingException e) {
            throw new SprException("Erro ao desserializar JSON", e);
        }
    }

    public static Map<String, Object> toMap(String json) {
        try {
            return mapper.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            throw new SprException("Erro ao converter JSON para Map", e);
        }
    }

    public static String serialize(java.util.TreeMap<String, Object> map) {
        try {
            return mapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            throw new SprException("Erro ao serializar TreeMap", e);
        }
    }

    public static String serialize(Map<String, Object> map) {
        try {
            return mapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            throw new SprException("Erro ao serializar Map", e);
        }
    }
}
