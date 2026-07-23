package br.com.spdealer.config;

import com.fasterxml.jackson.databind.Module;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public Module hibernateModule() {
        Hibernate6Module module = new Hibernate6Module();
        // evita Serialização de proxies vazios lançando excepcao
        module.disable(Hibernate6Module.Feature.FORCE_LAZY_LOADING);
        // configurações adicionais se necessário
        return module;
    }
}
