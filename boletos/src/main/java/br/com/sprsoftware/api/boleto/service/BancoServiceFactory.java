package br.com.sprsoftware.api.boleto.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class BancoServiceFactory {

    private static final Map<String, String> BANCOS = new LinkedHashMap<>();

    static {
        BANCOS.put("748", "sicrediIntegration");
        BANCOS.put("237", "bradescoIntegration");
        BANCOS.put("001", "bbIntegration");
        BANCOS.put("461", "asaasIntegration");
        BANCOS.put("003", "asaasIntegration");
        BANCOS.put("006", "basaIntegration");
        BANCOS.put("756", "sicoobIntegration");
    }

    @Autowired
    @Qualifier("sicrediIntegration")
    private BancoIntegrationService sicrediService;

    @Autowired(required = false)
    @Qualifier("bradescoIntegration")
    private BancoIntegrationService bradescoService;

    @Autowired(required = false)
    @Qualifier("bbIntegration")
    private BancoIntegrationService bbService;

    @Autowired(required = false)
    @Qualifier("asaasIntegration")
    private BancoIntegrationService asaasService;

    @Autowired(required = false)
    @Qualifier("sicoobIntegration")
    private BancoIntegrationService sicoobService;

    @Autowired(required = false)
    @Qualifier("basaIntegration")
    private BancoIntegrationService basaService;

    public BancoIntegrationService get(String bancoAut) {
        if (bancoAut == null || bancoAut.trim().isEmpty()) {
            throw new IllegalArgumentException("Codigo do banco nao informado no registro");
        }

        String beanName = BANCOS.get(bancoAut.trim());
        if (beanName == null) {
            throw new IllegalArgumentException("Banco nao suportado: " + bancoAut
                    + " (bancos suportados: " + BANCOS.keySet() + ")");
        }

        if ("sicrediIntegration".equals(beanName)) {
            return sicrediService;
        } else if ("bradescoIntegration".equals(beanName)) {
            if (bradescoService == null) {
                throw new IllegalArgumentException("Bradesco nao configurado - verifique certificado");
            }
            return bradescoService;
        } else if ("bbIntegration".equals(beanName)) {
            if (bbService == null) {
                throw new IllegalArgumentException("BB nao configurado - verifique tabela bancos (codigo_bco='001')");
            }
            return bbService;
        } else if ("asaasIntegration".equals(beanName)) {
            if (asaasService == null) {
                throw new IllegalArgumentException("Asaas nao configurado - verifique tabela bancos (codigo_bco='461')");
            }
            return asaasService;
        } else if ("basaIntegration".equals(beanName)) {
            if (basaService == null) {
                throw new IllegalArgumentException("Banco da Amazonia nao configurado - verifique tabela bancos (codigo_bco='006')");
            }
            return basaService;
        } else if ("sicoobIntegration".equals(beanName)) {
            if (sicoobService == null) {
                throw new IllegalArgumentException("Sicoob nao configurado - verifique tabela bancos (codigo_bco='756')");
            }
            return sicoobService;
        }

        throw new IllegalArgumentException("Implementacao nao encontrada para banco: " + bancoAut);
    }

    public static boolean isBancoSuportado(String bancoAut) {
        return bancoAut != null && BANCOS.containsKey(bancoAut.trim());
    }

    public static Map<String, String> getBancosSuportados() {
        return new LinkedHashMap<>(BANCOS);
    }
}
