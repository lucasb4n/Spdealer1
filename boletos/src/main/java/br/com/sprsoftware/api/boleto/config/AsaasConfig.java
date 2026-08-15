package br.com.sprsoftware.api.boleto.config;

import br.com.seprocom.api.boleto.ws.asaas.AsaasApiClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Component
public class AsaasConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private AsaasApiClient asaasClient;

    @PostConstruct
    public void init() {
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT apikey, ambiente " +
                    "FROM bancos WHERE codigo_bco IN ('461', '003') OR nomefan_bco LIKE '%ASAAS%' ORDER BY FIELD(codigo_bco, '461', '003') LIMIT 1");

            String apiKey = toString(row.get("apikey"));
            String ambiente = toString(row.get("ambiente"));

            this.asaasClient = new AsaasApiClient(apiKey, ambiente);

            System.out.println("[AsaasConfig] Proxy carregado - ambiente: " + ambiente
                    + " mock: " + asaasClient.isMockMode());
        } catch (Exception e) {
            System.err.println("[AsaasConfig] Erro ao carregar configuracao Asaas: " + e.getMessage());
            this.asaasClient = new AsaasApiClient(null, null);
        }
    }

    public AsaasApiClient getAsaasClient() {
        return asaasClient;
    }

    private String toString(Object obj) {
        return obj != null ? obj.toString().trim() : null;
    }
}
