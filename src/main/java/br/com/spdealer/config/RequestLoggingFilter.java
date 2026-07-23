package br.com.spdealer.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();
        String method = req.getMethod();
        String origin = req.getHeader("Origin");

        System.out.println("[TRAFFIC-LOG] " + method + " " + path + " | Origin: " + origin);

        chain.doFilter(request, response);
        
        System.out.println("[TRAFFIC-LOG] Response Status: " + res.getStatus() + " for " + path);
    }
}
