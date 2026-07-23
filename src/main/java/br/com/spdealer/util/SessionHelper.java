package br.com.spdealer.util;

import jakarta.servlet.http.HttpSession;

/**
 * SessionHelper - Centraliza acesso a variáveis de sessão do SPDealer
 * 
 * CRÍTICO: Usar esta classe para recuperar filial e filtrar TODAS as queries
 * 
 * @author SPDealer Team
 * @version 1.0
 * @since 2025-11-06
 */
public class SessionHelper {

    /**
     * Recupera o ID da filial selecionada pelo usuário na sessão
     * 
     * OBRIGATÓRIO: Usar em TODA query SQL que filtre por filial
     * 
     * @param session HttpSession do usuário
     * @return Integer ID da filial selecionada
     * @throws IllegalStateException se filial não for encontrada na sessão
     * 
     * EXEMPLOS DE USO:
     * 
     * // No controller
     * Integer idFil = SessionHelper.getIdFilFromSession(session);
     * 
     * // No service
     * String sql = "SELECT * FROM receber WHERE filial_rec = ?";
     * List result = jdbcTemplate.query(sql, new Object[]{idFil}, mapper);
     */
    public static Integer getIdFilFromSession(HttpSession session) {
        if (session == null) {
            throw new IllegalStateException("[SessionHelper] HttpSession é null");
        }

        Object filialObj = session.getAttribute("id_fil");
        
        if (filialObj == null) {
            throw new IllegalStateException(
                "[SessionHelper] Filial não encontrada na sessão. " +
                "Usuário não completou o login corretamente ou sessão expirou."
            );
        }

        // Converter para Integer (aceita String, Long, Integer)
        if (filialObj instanceof Integer) {
            return (Integer) filialObj;
        } else if (filialObj instanceof Long) {
            return ((Long) filialObj).intValue();
        } else if (filialObj instanceof String) {
            try {
                return Integer.parseInt((String) filialObj);
            } catch (NumberFormatException e) {
                throw new IllegalStateException(
                    "[SessionHelper] Filial em sessão é String inválida: " + filialObj
                );
            }
        } else {
            throw new IllegalStateException(
                "[SessionHelper] Filial em sessão é tipo inesperado: " + 
                filialObj.getClass().getName()
            );
        }
    }

    /**
     * Recupera a filial com valor padrão caso não exista
     * 
     * ⚠️ CUIDADO: Usar apenas em operações não-críticas
     * Para queries financeiras/estoque: usar getIdFilFromSession() (sem default)
     * 
     * @param session HttpSession do usuário
     * @param defaultValue Valor padrão se filial não existir
     * @return Integer ID da filial ou valor padrão
     */
    public static Integer getIdFilFromSessionOrDefault(HttpSession session, Integer defaultValue) {
        try {
            return getIdFilFromSession(session);
        } catch (IllegalStateException e) {
            System.out.println("[SessionHelper] Usando valor padrão: " + defaultValue + " - Motivo: " + e.getMessage());
            return defaultValue;
        }
    }

    /**
     * Valida se filial está corretamente armazenada na sessão
     * 
     * USAR: No início de métodos críticos
     * 
     * @param session HttpSession do usuário
     * @return boolean true se filial existe e é válida
     */
    public static boolean hasValidFilialInSession(HttpSession session) {
        try {
            getIdFilFromSession(session);
            return true;
        } catch (IllegalStateException e) {
            System.out.println("[SessionHelper] Validação falhou: " + e.getMessage());
            return false;
        }
    }

    /**
     * Armazena filial na sessão
     * 
     * USAR: Após login bem-sucedido
     * 
     * @param session HttpSession do usuário
     * @param idFil ID da filial a armazenar
     */
    public static void setIdFilToSession(HttpSession session, Integer idFil) {
        if (session == null) {
            throw new IllegalStateException("[SessionHelper] HttpSession é null ao tentar armazenar filial");
        }
        if (idFil == null || idFil <= 0) {
            throw new IllegalArgumentException("[SessionHelper] ID de filial inválido: " + idFil);
        }
        
        session.setAttribute("id_fil", idFil);
        System.out.println("[SessionHelper] Filial " + idFil + " armazenada com sucesso na sessão");
    }

    /**
     * Remove filial da sessão (logout)
     * 
     * @param session HttpSession do usuário
     */
    public static void removeIdFilFromSession(HttpSession session) {
        if (session != null) {
            session.removeAttribute("id_fil");
            System.out.println("[SessionHelper] Filial removida da sessão (logout)");
        }
    }

    /**
     * DEBUG: Exibe todas as variáveis de sessão
     * 
     * ⚠️ USAR APENAS EM DESENVOLVIMENTO
     * 
     * @param session HttpSession do usuário
     */
    public static void debugSession(HttpSession session) {
        if (session == null) {
            System.out.println("[SessionHelper DEBUG] HttpSession é null");
            return;
        }
        
        System.out.println("\n========== SESSION DEBUG ==========");
        System.out.println("Session ID: " + session.getId());
        System.out.println("Creation Time: " + new java.util.Date(session.getCreationTime()));
        System.out.println("Last Accessed: " + new java.util.Date(session.getLastAccessedTime()));
        System.out.println("Max Inactive Interval: " + session.getMaxInactiveInterval() + " segundos");
        
        System.out.println("\nAtributos na Sessão:");
        java.util.Enumeration<String> attrs = session.getAttributeNames();
        if (!attrs.hasMoreElements()) {
            System.out.println("  (nenhum atributo)");
        } else {
            while (attrs.hasMoreElements()) {
                String attrName = attrs.nextElement();
                Object attrValue = session.getAttribute(attrName);
                System.out.println("  - " + attrName + ": " + 
                    (attrValue != null ? attrValue.toString() : "null") + 
                    " (" + (attrValue != null ? attrValue.getClass().getSimpleName() : "null") + ")");
            }
        }
        System.out.println("===================================\n");
    }

    /**
     * Recupera o ID do usuário da sessão.
     * Tenta obter o atributo "user_id" e, se não encontrar, tenta "userId".
     * 
     * @param session HttpSession do usuário
     * @return Long ID do usuário
     * @throws IllegalStateException se o ID do usuário não for encontrado na sessão
     */
    public static Long getUserIdFromSession(HttpSession session) {
        if (session == null) {
            throw new IllegalStateException("[SessionHelper] HttpSession é null ao tentar obter User ID");
        }

        Object userIdObj = session.getAttribute("user_id");
        if (userIdObj == null) {
            userIdObj = session.getAttribute("userId"); // Tenta obter como userId para compatibilidade
        }

        if (userIdObj == null) {
            // DIAGNÓSTICO: Listar todos os atributos presentes na sessão para descobrir se ela está vazia
            StringBuilder attrs = new StringBuilder();
            try {
                java.util.Enumeration<String> names = session.getAttributeNames();
                while (names.hasMoreElements()) {
                    String name = names.nextElement();
                    attrs.append(name).append("=").append(session.getAttribute(name)).append("; ");
                }
            } catch (Exception e) {
                attrs.append("erro: ").append(e.getMessage());
            }
            throw new IllegalStateException("[SessionHelper] User ID não encontrado na sessão. Atributos presentes: [" + attrs.toString() + "]. Sessão pode ter expirado ou o login foi incompleto.");
        }

        // Tenta converter o objeto para Long
        if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        } else if (userIdObj instanceof Integer) {
            // Se for Integer, converte para Long
            return ((Integer) userIdObj).longValue();
        } else if (userIdObj instanceof String) {
            // Se for String, tenta parsear
            try {
                return Long.parseLong((String) userIdObj);
            } catch (NumberFormatException e) {
                throw new IllegalStateException("[SessionHelper] User ID em sessão é String inválida: " + userIdObj);
            }
        } else {
            throw new IllegalStateException("[SessionHelper] User ID em sessão é de tipo inesperado: " + userIdObj.getClass().getName());
        }
    }

    // ===================== FILIAL (id_fil) =====================

    /**
     * Recupera o código da empresa (ex.: '001') da sessão.
     * O valor é tratado como String (geralmente char(3) nas tabelas).
     */
    public static String getEmpresaFromSession(HttpSession session) {
        if (session == null) {
            throw new IllegalStateException("[SessionHelper] HttpSession é null");
        }
        Object empresaObj = session.getAttribute("empresa_ger");
        if (empresaObj == null) {
            throw new IllegalStateException("[SessionHelper] Empresa não encontrada na sessão");
        }
        return String.valueOf(empresaObj);
    }

    /**
     * Define o código da empresa na sessão (esperado: '001', '002', ...).
     */
    public static void setEmpresaToSession(HttpSession session, String empresaCodigo) {
        if (session == null) {
            throw new IllegalStateException("[SessionHelper] HttpSession é null ao tentar armazenar empresa");
        }
        if (empresaCodigo == null || empresaCodigo.isBlank()) {
            throw new IllegalArgumentException("[SessionHelper] Código de empresa inválido");
        }
        session.setAttribute("empresa_ger", empresaCodigo);
        System.out.println("[SessionHelper] Empresa " + empresaCodigo + " armazenada com sucesso na sessão");
    }

    // ===================== DEPÓSITO (dep_xxx - char(6)) =====================

    /**
     * Recupera o depósito (char(6)) da sessão. Caso exista, garante padding à esquerda com zeros (6).
     */
    public static String getDeposito6FromSession(HttpSession session) {
        if (session == null) {
            throw new IllegalStateException("[SessionHelper] HttpSession é null");
        }
        Object depObj = session.getAttribute("dep_cod");
        if (depObj == null) {
            return null; // depósito é opcional; retornar null quando não definido
        }
        String raw = String.valueOf(depObj).trim();
        if (raw.isEmpty()) return null;
        return leftPad(raw, 6, '0');
    }

    /**
     * Define o depósito na sessão, garantindo padding (char(6)).
     */
    public static void setDepositoToSession(HttpSession session, String depositoCodigo) {
        if (session == null) {
            throw new IllegalStateException("[SessionHelper] HttpSession é null ao tentar armazenar depósito");
        }
        if (depositoCodigo == null || depositoCodigo.isBlank()) {
            session.removeAttribute("dep_cod");
            return;
        }
        String padded = leftPad(depositoCodigo.trim(), 6, '0');
        session.setAttribute("dep_cod", padded);
        System.out.println("[SessionHelper] Depósito armazenado (padded): " + padded);
    }

    private static String leftPad(String value, int size, char ch) {
        if (value == null) value = "";
        if (value.length() >= size) return value;
        StringBuilder sb = new StringBuilder(size);
        for (int i = value.length(); i < size; i++) sb.append(ch);
        sb.append(value);
        return sb.toString();
    }

    /**
     * Exemplo de uso em Service
     * 
     * PADRÃO RECOMENDADO:
     * 
     * @Service
     * public class RecebimentoService {
     *     @Autowired private JdbcTemplate jdbcTemplate;
     *     
     *     // Injetar HttpSession via RequestContextHolder ou via controller
     *     
     *     public List<Recebimento> buscarRecebimentos(LocalDate dtInicio, LocalDate dtFim, HttpSession session) {
     *         Integer idFil = SessionHelper.getIdFilFromSession(session);  // ← OBRIGATÓRIO
     *         
     *         String sql = "SELECT * FROM receber " +
     *                      "WHERE filial_rec = ? " +  // ← FILTRO DE FILIAL
     *                      "AND dtvenci_rec BETWEEN ? AND ? " +
     *                      "ORDER BY dtvenci_rec DESC";
     *         
     *         return jdbcTemplate.query(sql, 
     *             new Object[]{idFil, dtInicio, dtFim},
     *             (rs, rowNum) -> new Recebimento(
     *                 rs.getInt("codigo_rec"),
     *                 rs.getInt("filial_rec"),
     *                 rs.getString("cliente_rec"),
     *                 rs.getDouble("valor_rec"),
     *                 rs.getDate("dtvenci_rec").toLocalDate()
     *             )
     *         );
     *     }
     * }
     */
}
