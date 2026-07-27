package br.com.sprsoftware.api.boleto.config;

import br.com.seprocom.api.boleto.ws.bradesco.commons.ApiProxy;
import br.com.seprocom.api.utils.SprException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class BradescoConfig {

    @Value("${bradesco.clientId:}")
    private String clientId;

    @Value("${bradesco.ambiente:sandbox}")
    private String ambiente;

    @Value("${bradesco.certificate.path:}")
    private String certPath;

    @Value("${bradesco.certificate.password:}")
    private String certPassword;

    @Value("${bradesco.certificate.keyPem:}")
    private String keyPem;

    @Value("${bradesco.certificate.certPem:}")
    private String certPem;

    @Bean(name = "bradescoProxy")
    public ApiProxy bradescoProxy() {
        if (clientId == null || clientId.trim().isEmpty()) {
            return null;
        }

        try {
            Map<String, Object> config = new LinkedHashMap<>();
            config.put("client_id", clientId);

            boolean producao = "producao".equalsIgnoreCase(ambiente)
                    || "production".equalsIgnoreCase(ambiente);
            config.put("producao", producao);

            if (keyPem != null && !keyPem.trim().isEmpty()
                    && certPem != null && !certPem.trim().isEmpty()) {
                config.put("KEY", keyPem);
                config.put("CER", certPem);
            } else if (certPath != null && !certPath.trim().isEmpty()) {
                config.put("PFX_ARQUIVO", certPath);
                config.put("PFX_SENHA", certPassword);
            }

            return ApiProxy.get(config);
        } catch (SprException e) {
            throw new RuntimeException("Erro ao configurar Bradesco ApiProxy: " + e.getMessage(), e);
        }
    }
}
