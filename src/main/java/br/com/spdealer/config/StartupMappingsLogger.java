package br.com.spdealer.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.Map;

@Component
public class StartupMappingsLogger {

    private static final Logger logger = LoggerFactory.getLogger(StartupMappingsLogger.class);

    @Autowired
    private RequestMappingHandlerMapping requestMappingHandlerMapping;

    @PostConstruct
    public void logAllMappings() {
        try {
            Map<RequestMappingInfo, HandlerMethod> map = requestMappingHandlerMapping.getHandlerMethods();
            logger.info("Total HTTP mappings: {}", map.size());
            map.forEach((info, handler) -> {
                try {
                    logger.info("Mapped {} -> {}", info.getPatternsCondition(), handler.getMethod().toGenericString());
                } catch (Exception e) {
                    // safe guard
                }
            });
        } catch (Exception e) {
            logger.warn("Could not enumerate mappings: {}", e.getMessage());
        }
    }
}
