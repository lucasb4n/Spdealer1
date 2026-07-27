package br.com.spdealer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// ⚠️ DESABILITADO - Usar WebCorsConfig.java em vez disso
// Multiplas configuracoes CORS em conflito - WebCorsConfig eh mais completo
// @Configuration
// public class CorsConfig implements WebMvcConfigurer {
/*
    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:8080,http://100.126.166.63:3000,http://100.126.166.63:8080}")
    private String allowedOrigins;

    @Value("${app.cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS,PATCH}")
    private String allowedMethods;

    @Value("${app.cors.allowed-headers:*}")
    private String allowedHeaders;

    @Value("${app.cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${app.cors.max-age:3600}")
    private long maxAge;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        String[] methods = allowedMethods.split(",");
        
        registry.addMapping("/**")
            .allowedOriginPatterns(origins)
            .allowedMethods(methods)
            .allowedHeaders(allowedHeaders)
            .allowCredentials(allowCredentials)
            .maxAge(maxAge);
    }
*/
