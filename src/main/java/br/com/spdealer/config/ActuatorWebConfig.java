package br.com.spdealer.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ActuatorWebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Garante que /actuator/* não seja roteado para o React/static
        registry.addResourceHandler("/actuator/**")
                .addResourceLocations("classpath:/META-INF/resources/");
    }
}
