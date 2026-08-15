package br.com.sprsoftware.api.boleto.config;

import br.com.seprocom.api.boleto.ws.basa.BasaApiClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Component
public class BasaConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private BasaApiClient basaClient;
    private String agencia;
    private String conta;
    private String convenio;

    @PostConstruct
    public void init() {
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT apikey, ambiente, urlsandbox, urlprod, agenc_bco, conta_bco, nroconvenio_cbr " +
                    "FROM bancos WHERE codigo_bco = '006' OR nomefan_bco LIKE '%AMAZONIA%' ORDER BY FIELD(codigo_bco, '006') LIMIT 1");

            String apiKey = toString(row.get("apikey"));
            String ambiente = toString(row.get("ambiente"));
            String urlSandbox = toString(row.get("urlsandbox"));
            String urlProd = toString(row.get("urlprod"));

            this.agencia = toString(row.get("agenc_bco"));
            this.conta = toString(row.get("conta_bco"));
            this.convenio = toString(row.get("nroconvenio_cbr"));

            this.basaClient = new BasaApiClient(apiKey, ambiente, urlSandbox, urlProd);

            System.out.println("[BasaConfig] Proxy Banco da Amazonia carregado - ambiente: " + ambiente
                    + " mock: " + basaClient.isMockMode());
        } catch (Exception e) {
            System.err.println("[BasaConfig] Erro ao carregar configuracao Banco da Amazonia: " + e.getMessage());
            this.basaClient = new BasaApiClient(null, null, null, null);
        }
    }

    public BasaApiClient getBasaClient() {
        return basaClient;
    }

    public String getAgencia() {
        return agencia;
    }

    public String getConta() {
        return conta;
    }

    public String getConvenio() {
        return convenio;
    }

    private String toString(Object obj) {
        return obj != null ? obj.toString().trim() : null;
    }
}
