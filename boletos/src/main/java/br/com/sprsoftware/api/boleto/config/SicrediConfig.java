package br.com.sprsoftware.api.boleto.config;

import br.com.seprocom.api.boleto.ws.sicredi.ApiProxy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Component
public class SicrediConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private ApiProxy sicrediProxy;

    @PostConstruct
    public void init() {
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT apikey, password, cooperativa, posto, codigoBene, ambiente " +
                    "FROM bancos WHERE codigo_bco = '748' LIMIT 1");

            String apiKey = toString(row.get("apikey"));
            String password = toString(row.get("password"));
            String cooperativa = toString(row.get("cooperativa"));
            String posto = toString(row.get("posto"));
            String codigoBene = toString(row.get("codigoBene"));
            String ambiente = toString(row.get("ambiente"));

            boolean producao = "P".equalsIgnoreCase(ambiente);

            String username = (codigoBene != null && cooperativa != null)
                    ? codigoBene + cooperativa : null;
            this.sicrediProxy = new ApiProxy(
                    apiKey, username, password,
                    cooperativa, posto, codigoBene, producao);

            System.out.println("[SicrediConfig] Proxy carregado - ambiente: " + ambiente
                    + " coop: " + cooperativa + " mock: " + sicrediProxy.isMockMode());
        } catch (Exception e) {
            System.err.println("[SicrediConfig] Erro ao carregar configuracao Sicredi: " + e.getMessage());
            this.sicrediProxy = new ApiProxy(null, null, null, null, null, null, false);
        }
    }

    public ApiProxy getSicrediProxy() {
        return sicrediProxy;
    }

    private String toString(Object obj) {
        return obj != null ? obj.toString().trim() : null;
    }
}
