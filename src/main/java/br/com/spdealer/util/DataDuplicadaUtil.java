package br.com.spdealer.util;

import org.springframework.jdbc.core.JdbcTemplate;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

/**
 * Utilitário para manipulação automática de campos de data duplicados
 * 
 * Este utilitário automaticamente detecta e grava campos de data duplicados
 * seguindo o padrão arquitetural do SPDealer:
 * - campo_xxx (decimal): formato DDMMAAAA - apenas compatibilidade legado
 * - campo_xxxi (date): formato YYYY-MM-DD - campo principal SPDealer
 * 
 * Quando a migração do sistema legado for concluída, os campos sem "i" 
 * serão removidos das tabelas por não terem função no SPDealer.
 */
public class DataDuplicadaUtil {

    private static final DateTimeFormatter FORMATO_ENTRADA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FORMATO_LEGADO = DateTimeFormatter.ofPattern("ddMMyyyy");
    private static final DateTimeFormatter FORMATO_SQL = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Prepara automaticamente campos de data duplicados para uma tabela
     * 
     * @param tabela Nome da tabela
     * @param dados Map com os dados onde as chaves são nomes de campos
     * @param jdbcTemplate Template JDBC para consulta da estrutura
     * @return Map com campos de data duplicados preparados
     */
    public static Map<String, Object> prepararCamposDataDuplicados(
            String tabela, 
            Map<String, Object> dados, 
            JdbcTemplate jdbcTemplate) {
        
        Map<String, Object> dadosCompletos = new HashMap<>(dados);
        Map<String, String> camposComDupla = descobrirCamposDataDuplicados(tabela, jdbcTemplate);
        
        for (Map.Entry<String, String> entrada : camposComDupla.entrySet()) {
            String campoSemI = entrada.getKey();     // Ex: dtmov_rec
            String campoComI = entrada.getValue();   // Ex: dtmovi_rec
            
            // Verifica se existe algum valor de data nos dados de entrada
            Object valorData = dados.get(campoComI) != null ? dados.get(campoComI) : dados.get(campoSemI);
            
            if (valorData != null) {
                String dataString = valorData.toString();
                
                try {
                    // Converte para ambos os formatos
                    String dataLegado = converterParaFormatoLegado(dataString);
                    String dataSQL = converterParaFormatoSQL(dataString);
                    
                    // Adiciona ambos os campos
                    dadosCompletos.put(campoSemI, dataLegado);  // Compatibilidade
                    dadosCompletos.put(campoComI, dataSQL);     // Principal
                    
                } catch (Exception e) {
                    System.err.println("Erro ao converter data para campos " + campoSemI + "/" + campoComI + ": " + e.getMessage());
                }
            }
        }
        
        return dadosCompletos;
    }

    /**
     * Descobre automaticamente campos de data duplicados em uma tabela
     * 
     * @param tabela Nome da tabela
     * @param jdbcTemplate Template JDBC
     * @return Map onde chave=campo_sem_i, valor=campo_com_i
     */
    private static Map<String, String> descobrirCamposDataDuplicados(String tabela, JdbcTemplate jdbcTemplate) {
        Map<String, String> camposEncontrados = new HashMap<>();
        
        try {
            // Consulta estrutura da tabela
            String sql = "DESCRIBE " + tabela;
            List<Map<String, Object>> colunas = jdbcTemplate.queryForList(sql);
            
            for (Map<String, Object> coluna : colunas) {
                String nomeCampo = (String) coluna.get("Field");
                String tipoCampo = (String) coluna.get("Type");
                
                // Verifica se é um campo de data com "i" antes do sufixo _rec/_pag
                if (nomeCampo.matches(".*i_(rec|pag)$") && tipoCampo.equals("date")) {
                    String suffix = nomeCampo.substring(nomeCampo.length() - 4);
                    String base = nomeCampo.substring(0, nomeCampo.length() - 5);
                    String campoSemI = base + suffix;
                    
                    // Verifica se existe o campo correspondente sem "i" (decimal)
                    String finalCampoSemI = campoSemI;
                    boolean existeCampoSemI = colunas.stream()
                        .anyMatch(c -> finalCampoSemI.equals(c.get("Field")) && 
                                      ((String) c.get("Type")).startsWith("decimal"));
                    
                    if (existeCampoSemI) {
                        camposEncontrados.put(campoSemI, nomeCampo);
                    }
                }
            }
            
        } catch (Exception e) {
            System.err.println("Erro ao descobrir campos de data duplicados na tabela " + tabela + ": " + e.getMessage());
        }
        
        return camposEncontrados;
    }

    /**
     * Remove chaves que não correspondem a colunas reais da tabela,
     * evitando erros de SQL quando o frontend envia campos extras/alias.
     * 
     * @param tabela Nome da tabela
     * @param dados Dados a serem filtrados
     * @param jdbcTemplate Template JDBC
     * @return Map apenas com colunas existentes na tabela
     */
    private static Map<String, Object> filtrarColunasExistentes(
            String tabela,
            Map<String, Object> dados,
            JdbcTemplate jdbcTemplate) {
        
        if (dados == null || dados.isEmpty()) return dados;
        
        try {
            String sql = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?";
            List<String> colunas = jdbcTemplate.queryForList(sql, String.class, tabela);
            
            Map<String, Object> filtrado = new HashMap<>();
            for (Map.Entry<String, Object> entrada : dados.entrySet()) {
                if (entrada.getKey() != null && colunas.contains(entrada.getKey())) {
                    filtrado.put(entrada.getKey(), entrada.getValue());
                } else {
                    System.err.println("[DataDuplicadaUtil] Ignorando campo inexistente '" + entrada.getKey() + "' na tabela " + tabela);
                }
            }
            return filtrado;
        } catch (Exception e) {
            System.err.println("Erro ao filtrar colunas da tabela " + tabela + ": " + e.getMessage());
            return dados;
        }
    }

    /**
     * Converte data para formato legado DDMMAAAA
     */
    public static String converterParaFormatoLegado(String data) {
        if (data == null || data.trim().isEmpty()) return null;
        
        try {
            // Se já está no formato YYYY-MM-DD
            if (data.matches("\\d{4}-\\d{2}-\\d{2}")) {
                LocalDate localDate = LocalDate.parse(data, FORMATO_SQL);
                return localDate.format(FORMATO_LEGADO);
            }
            
            // Se está no formato DD/MM/YYYY
            if (data.matches("\\d{2}/\\d{2}/\\d{4}")) {
                LocalDate localDate = LocalDate.parse(data, FORMATO_ENTRADA);
                return localDate.format(FORMATO_LEGADO);
            }
            
            // Se já está no formato DDMMAAAA
            if (data.matches("\\d{8}")) {
                return data;
            }
            
        } catch (Exception e) {
            System.err.println("Erro ao converter data para formato legado: " + data + " - " + e.getMessage());
        }
        
        return data;
    }

    /**
     * Converte data para formato SQL YYYY-MM-DD
     */
    public static String converterParaFormatoSQL(String data) {
        if (data == null || data.trim().isEmpty()) return null;
        
        try {
            // Se já está no formato YYYY-MM-DD
            if (data.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return data;
            }
            
            // Se está no formato DD/MM/YYYY
            if (data.matches("\\d{2}/\\d{2}/\\d{4}")) {
                LocalDate localDate = LocalDate.parse(data, FORMATO_ENTRADA);
                return localDate.format(FORMATO_SQL);
            }
            
            // Se está no formato DDMMAAAA
            if (data.matches("\\d{8}")) {
                String dia = data.substring(0, 2);
                String mes = data.substring(2, 4);
                String ano = data.substring(4, 8);
                LocalDate localDate = LocalDate.of(Integer.parseInt(ano), Integer.parseInt(mes), Integer.parseInt(dia));
                return localDate.format(FORMATO_SQL);
            }
            
        } catch (Exception e) {
            System.err.println("Erro ao converter data para formato SQL: " + data + " - " + e.getMessage());
        }
        
        return data;
    }

    /**
     * Gera SQL de inserção automaticamente incluindo campos de data duplicados
     * 
     * @param tabela Nome da tabela
     * @param dados Dados a serem inseridos
     * @param jdbcTemplate Template JDBC
     * @return Array onde [0]=SQL, [1]=valores ordenados
     */
    public static Object[] gerarInsertComDatasDuplicadas(
            String tabela, 
            Map<String, Object> dados, 
            JdbcTemplate jdbcTemplate) {
        
        Map<String, Object> dadosCompletos = prepararCamposDataDuplicados(tabela, dados, jdbcTemplate);
        dadosCompletos = filtrarColunasExistentes(tabela, dadosCompletos, jdbcTemplate);
        
        StringBuilder sql = new StringBuilder("INSERT INTO ").append(tabela).append(" (");
        StringBuilder valores = new StringBuilder("VALUES (");
        Object[] parametros = new Object[dadosCompletos.size()];
        
        int index = 0;
        for (Map.Entry<String, Object> entrada : dadosCompletos.entrySet()) {
            if (index > 0) {
                sql.append(", ");
                valores.append(", ");
            }
            
            sql.append(entrada.getKey());
            valores.append("?");
            parametros[index] = entrada.getValue();
            index++;
        }
        
        sql.append(") ").append(valores).append(")");
        return new Object[]{sql.toString(), parametros};
    }

    /**
     * Gera SQL de update automaticamente incluindo campos de data duplicados
     * 
     * @param tabela Nome da tabela
     * @param dados Dados a serem atualizados
     * @param condicaoWhere Condição WHERE (ex: "id = ?")
     * @param jdbcTemplate Template JDBC
     * @return Array onde [0]=SQL, [1]=valores ordenados (sem os parâmetros do WHERE)
     */
    public static Object[] gerarUpdateComDatasDuplicadas(
            String tabela, 
            Map<String, Object> dados, 
            String condicaoWhere,
            JdbcTemplate jdbcTemplate) {
        
        Map<String, Object> dadosCompletos = prepararCamposDataDuplicados(tabela, dados, jdbcTemplate);
        dadosCompletos = filtrarColunasExistentes(tabela, dadosCompletos, jdbcTemplate);
        
        StringBuilder sql = new StringBuilder("UPDATE ").append(tabela).append(" SET ");
        Object[] parametros = new Object[dadosCompletos.size()];
        
        int index = 0;
        for (Map.Entry<String, Object> entrada : dadosCompletos.entrySet()) {
            if (index > 0) {
                sql.append(", ");
            }
            
            sql.append(entrada.getKey()).append(" = ?");
            parametros[index] = entrada.getValue();
            index++;
        }
        
        if (condicaoWhere != null && !condicaoWhere.trim().isEmpty()) {
            sql.append(" WHERE ").append(condicaoWhere);
        }
        
        return new Object[]{sql.toString(), parametros};
    }
}