package br.com.spdealer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.stream.Collectors;

//@Configuration
public class WebCorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:}")
    private String allowedOriginsProp;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowed = new String[0];
        if (allowedOriginsProp != null && !allowedOriginsProp.isBlank()) {
            allowed = Arrays.stream(allowedOriginsProp.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList())
                    .toArray(new String[0]);
        }

        // If no allowed origins configured, allow common dev origins
        if (allowed.length == 0) {
            allowed = new String[]{
                "https://spdealer.seprocom.com.br",
                "http://localhost:3000",
                "http://localhost:8080",
                "http://100.126.166.63:3000",
                "http://100.126.166.63:8080",
                "http://192.168.10.100:3000",
                "http://192.168.10.100:8080",
                "http://192.168.10.70:3000",
                "http://192.168.10.70:8080",
                "https://192.168.10.100:3000",
                "https://192.168.10.70:8080"
            };
        }

        // Mapeamento 1: Para endpoints /api/** (principal)
        registry.addMapping("/api/**")
            .allowedOriginPatterns(allowed)
            .allowedMethods("GET","POST","PUT","DELETE","OPTIONS","PATCH")
            .allowCredentials(true)
            .allowedHeaders("*")
            .maxAge(3600);

        // Mapeamento 2: Para raiz / (inclusive /login se nao prefixado)
        registry.addMapping("/")
            .allowedOriginPatterns(allowed)
            .allowedMethods("GET","POST","PUT","DELETE","OPTIONS","PATCH")
            .allowCredentials(true)
            .allowedHeaders("*")
            .maxAge(3600);

        // Mapeamento 3: Global /** para qualquer outro endpoint
        registry.addMapping("/**")
            .allowedOriginPatterns(allowed)
            .allowedMethods("GET","POST","PUT","DELETE","OPTIONS","PATCH")
            .allowCredentials(true)
            .allowedHeaders("*")
            .maxAge(3600);
    }
}
