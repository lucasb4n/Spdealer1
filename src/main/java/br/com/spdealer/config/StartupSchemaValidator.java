package br.com.spdealer.config;

import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class StartupSchemaValidator {

    private static final Logger logger = LoggerFactory.getLogger(StartupSchemaValidator.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void validateSchema() {
        logger.info("StartupSchemaValidator: iniciando verificação de colunas críticas no banco...");

        Map<String, String[]> required = new HashMap<>();
        // colunas críticas usadas por endpoints e queries dinâmicas
        required.put("receber", new String[]{"condic_rec", "vlrsal_rec", "codigo_rec", "filial_rec", "dtemiss_rec", "dtvenci_rec"});
        required.put("clientes", new String[]{"codigo_cli", "limcre_cli", "nomefan_cli"});
        required.put("masdoc", new String[]{"codigo_doc", "descr_doc"});

        List<String> missing = new ArrayList<>();

        String sql = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?";

        for (Map.Entry<String, String[]> entry : required.entrySet()) {
            String table = entry.getKey();
            for (String col : entry.getValue()) {
                try {
                    Integer count = jdbcTemplate.queryForObject(sql, Integer.class, table, col);
                    if (count == null || count == 0) {
                        missing.add(table + "." + col);
                    }
                } catch (Exception e) {
                    logger.warn("StartupSchemaValidator: erro verificando {}.{} -> {}", table, col, e.getMessage());
                    missing.add(table + "." + col + " (erro ao verificar)");
                }
            }
        }

        if (!missing.isEmpty()) {
            logger.error("StartupSchemaValidator: Colunas críticas ausentes ou inacessíveis: {}", missing);
            logger.error("Resultado: algumas features podem não funcionar corretamente. Verifique o schema do banco e as migrations.");
        } else {
            logger.info("StartupSchemaValidator: todas as colunas críticas foram encontradas com sucesso.");
        }
    }
}
