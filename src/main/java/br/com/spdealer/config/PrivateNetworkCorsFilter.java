package br.com.spdealer.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// @Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PrivateNetworkCorsFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        // Keep header interference minimal: do not overwrite CORS headers already managed by Spring
        // Preserve Vary for origin and only handle the newer Private Network preflight header when present.
        if (origin != null) {
            if (!response.containsHeader("Vary")) {
                response.setHeader("Vary", "Origin");
            }
        }

        // If browser requests private network access (preflight from secure context), explicitly allow it
        // Do NOT short-circuit the filter chain on OPTIONS: let Spring's CORS handling add standard headers.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            String acrpn = request.getHeader("Access-Control-Request-Private-Network");
            if (acrpn != null && "true".equalsIgnoreCase(acrpn)) {
                // only add this specific header; avoid setting other CORS headers here to prevent duplicates
                response.setHeader("Access-Control-Allow-Private-Network", "true");
            }
            // do not set status or return; allow the chain to continue so Spring's CorsFilter can respond to preflight
        }

        filterChain.doFilter(request, response);
    }
}
