package br.com.spdealer.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

public class DashboardConfigValidator {
    public static boolean isValidDashboardConfig(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(json);
            // Verifica se tem os campos principais
            if (!node.has("theme") || !node.has("layout") || !node.has("widgets")) {
                return false;
            }
            // Verifica se widgets é um objeto não vazio
            JsonNode widgets = node.get("widgets");
            return widgets != null && widgets.size() > 0;
        } catch (Exception e) {
            return false;
        }
    }
}
