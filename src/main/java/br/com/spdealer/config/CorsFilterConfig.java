package br.com.spdealer.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

// @Configuration
public class CorsFilterConfig {

    @Value("${app.cors.allowed-origins:}")
    private String allowedOriginsProp;

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter() {
        List<String> allowed = Collections.emptyList();
        if (allowedOriginsProp != null && !allowedOriginsProp.isBlank()) {
            allowed = Arrays.stream(allowedOriginsProp.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        // fallback defaults (dev-friendly)
        if (allowed.isEmpty()) {
            allowed = Arrays.asList(
                    "https://spdealer.seprocom.com.br",
                    "http://spdealer.seprocom.com.br",
                    "http://localhost:3000",
                    "http://localhost:8080",
                    "http://100.126.166.63:3000",
                    "http://100.126.166.63:8080",
                    "http://192.168.10.70:8080",
                    "http://192.168.10.70:5070"
            );
        }

        CorsConfiguration config = new CorsConfiguration();

        // If a wildcard origin was supplied as a literal "*", use origin patterns instead
        boolean hasWildcard = allowed.stream().anyMatch(s -> "*".equals(s));
        if (hasWildcard) {
            config.setAllowedOriginPatterns(Collections.singletonList("*"));
        } else {
            // use allowed origin patterns to be compatible with credentialed requests
            config.setAllowedOriginPatterns(allowed);
        }

        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(Collections.singletonList("*"));
        // keep credentials allowed (cookies + auth) — allowedOriginPatterns avoids IllegalArgumentException
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Register for all paths
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
