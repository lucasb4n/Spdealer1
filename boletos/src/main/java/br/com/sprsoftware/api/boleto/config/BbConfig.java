package br.com.sprsoftware.api.boleto.config;

import br.com.seprocom.api.boleto.ws.bb.BbApiProxy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Component
public class BbConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private BbApiProxy bbProxy;
    private String convenio;
    private String carteira;
    private String variacaoCarteira;
    private String modalidade;

    @PostConstruct
    public void init() {
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT client_id, client_secret, apikey, convenio_numero, " +
                    "carteira, carteira_tipo, carteira_modalidade, ambiente " +
                    "FROM bancos WHERE codigo_bco = '001' LIMIT 1");

            String clientId = toString(row.get("client_id"));
            String clientSecret = toString(row.get("client_secret"));
            String appKey = toString(row.get("apikey"));
            this.convenio = toString(row.get("convenio_numero"));
            this.carteira = toString(row.get("carteira"));
            this.variacaoCarteira = toString(row.get("carteira_tipo"));
            this.modalidade = toString(row.get("carteira_modalidade"));
            String ambiente = toString(row.get("ambiente"));

            if (ambiente == null) ambiente = "S";

            this.bbProxy = new BbApiProxy(clientId, clientSecret, appKey, ambiente);

            System.out.println("[BbConfig] Proxy BB carregado - ambiente: " + ambiente
                    + " mock: " + bbProxy.isMockMode());
        } catch (Exception e) {
            System.err.println("[BbConfig] Erro ao carregar configuracao BB: " + e.getMessage());
            this.bbProxy = new BbApiProxy(null, null, null, null);
        }
    }

    public BbApiProxy getBbProxy() {
        return bbProxy;
    }

    public String getConvenio() { return convenio; }
    public String getCarteira() { return carteira; }
    public String getVariacaoCarteira() { return variacaoCarteira; }
    public String getModalidade() { return modalidade; }

    private String toString(Object obj) {
        return obj != null ? obj.toString().trim() : null;
    }
}
