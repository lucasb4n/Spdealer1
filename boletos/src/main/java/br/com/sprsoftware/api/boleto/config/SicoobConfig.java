package br.com.sprsoftware.api.boleto.config;

import br.com.seprocom.api.boleto.ws.sicoob.SicoobApiClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Component
public class SicoobConfig {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private SicoobApiClient sicoobClient;
    private String convenioNumero;
    private String modalidade;
    private String cooperativa;
    private String codigoBeneficiario;

    @PostConstruct
    public void init() {
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT client_id, client_secret, convenio_numero, " +
                    "carteira_modalidade, cooperativa, codigoBene, ambiente " +
                    "FROM bancos WHERE codigo_bco = '756' LIMIT 1");

            String clientId = toString(row.get("client_id"));
            String accessToken = toString(row.get("client_secret"));
            this.convenioNumero = toString(row.get("convenio_numero"));
            this.modalidade = toString(row.get("carteira_modalidade"));
            this.cooperativa = toString(row.get("cooperativa"));
            this.codigoBeneficiario = toString(row.get("codigoBene"));
            String ambiente = toString(row.get("ambiente"));

            if (this.modalidade == null) this.modalidade = "1";
            if (ambiente == null) ambiente = "S";

            this.sicoobClient = new SicoobApiClient(clientId, accessToken, ambiente);

            System.out.println("[SicoobConfig] Proxy carregado - ambiente: " + ambiente
                    + " mock: " + sicoobClient.isMockMode());
        } catch (Exception e) {
            System.err.println("[SicoobConfig] Erro ao carregar configuracao Sicoob: " + e.getMessage());
            this.sicoobClient = new SicoobApiClient(null, null, null);
        }
    }

    public SicoobApiClient getSicoobClient() {
        return sicoobClient;
    }

    public String getConvenioNumero() { return convenioNumero; }
    public String getModalidade() { return modalidade; }
    public String getCooperativa() { return cooperativa; }
    public String getCodigoBeneficiario() { return codigoBeneficiario; }

    private String toString(Object obj) {
        return obj != null ? obj.toString().trim() : null;
    }
}
