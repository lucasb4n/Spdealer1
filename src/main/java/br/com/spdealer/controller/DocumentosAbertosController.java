package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/documentos-abertos")
public class DocumentosAbertosController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Lista documentos em aberto para receber
     * 
     * Filtro por status_rec:
     * - 'E' (Excluído): NUNCA listar - documento foi removido do sistema
     * - 'C' (Cancelado): Listar mas com valores zerados - documento não totaliza e não soma valores
     * - NULL ou vazio ('') (Válido): Listar - documento está ativo e pode ser processado
     * 
     * Documentos "abertos" são aqueles que:
     * 1. vlrsal_rec > 0 (ainda há saldo a receber)
     * 2. status_rec IS NULL OR '' (não está excluído/cancelado)
     * 3. dtpagi_rec IS NULL (ainda não foi pago)
     * 
     * @param codigoCliente Código do cliente (opcional)
     * @return Lista de documentos em aberto
     */
        @GetMapping("/receber")
        public ResponseEntity<?> listarDocumentosReceber(
            @RequestParam(required = false) Integer codigoCliente) {
        
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT r.receber_id, r.codigo_rec, c.nome_cli, ");
            // Use the actual DB column 'parcela_rec' but alias to 'parc_rec' to keep frontend keys
            sql.append("r.numdup_rec, r.parcela_rec AS parc_rec, r.vlrdup_rec, r.vlrmulta_rec, (COALESCE(r.vlrnota_rec, (COALESCE(r.vlrdup_rec,0) + COALESCE(r.vlrmulta_rec,0) + COALESCE(r.vlracre_rec,0) - COALESCE(r.vlrdesc_rec,0)))) AS vlrtot_rec, r.vlrsal_rec, ");
            sql.append("r.vlrpag_rec, r.vlracre_rec, r.vlrdesc_rec, r.dtvenci_rec, ");
            sql.append("r.status_rec, r.dtpagi_rec ");
            sql.append("FROM receber r ");
            sql.append("LEFT JOIN clientes c ON r.codigo_rec = c.codigo_cli AND c.cliforn_cli = 'C' ");
            sql.append("WHERE r.vlrsal_rec > 0 ");
            sql.append("AND (r.status_rec IS NULL OR r.status_rec = '') "); // Só não-excluídos/não-cancelados
            sql.append("AND (r.dtpagi_rec IS NULL OR r.dtpagi_rec = '0000-00-00') "); // Ainda não foi pago

            List<Object> params = new ArrayList<>();

            if (codigoCliente != null) {
                sql.append("AND r.codigo_rec = ? ");
                params.add(codigoCliente);
            }

            sql.append("ORDER BY r.dtvenci_rec ASC, r.numdup_rec ASC");

            // Log SQL for debugging
            System.out.println("[DocumentosAbertosController] SQL receber: " + sql.toString());

            Object[] args = params.toArray(new Object[0]);
            List<Map<String, Object>> documentos = new ArrayList<>();
            javax.sql.DataSource ds = jdbcTemplate.getDataSource();
            try (java.sql.Connection conn = ds.getConnection();
                 java.sql.PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                for (int i = 0; i < args.length; i++) {
                    ps.setObject(i + 1, args[i]);
                }
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    java.sql.ResultSetMetaData meta = rs.getMetaData();
                    while (rs.next()) {
                        Map<String, Object> row = new HashMap<>();
                        int cols = meta.getColumnCount();
                        for (int i = 1; i <= cols; i++) {
                            String colName = meta.getColumnLabel(i);
                            row.put(colName, rs.getObject(i));
                        }
                        documentos.add(row);
                    }
                }
            }

            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            System.err.println("Erro ao listar documentos a receber: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            erro.put("sql", "ver logs no servidor");
            return ResponseEntity.status(500).body(erro);
        }
    }

    /**
     * Lista documentos em aberto para pagar
     * 
     * Filtro por status_pag:
     * - 'E' (Excluído): NUNCA listar - documento foi removido do sistema
     * - 'C' (Cancelado): Listar mas com valores zerados - documento não totaliza e não soma valores
     * - NULL ou vazio ('') (Válido): Listar - documento está ativo e pode ser processado
     * 
     * Documentos "abertos" são aqueles que:
     * 1. vlrsal_pag > 0 (ainda há saldo a pagar)
     * 2. status_pag IS NULL OR '' (não está excluído/cancelado)
     * 3. dtpagi_pag IS NULL (ainda não foi pago)
     * 
     * @param codigoFornecedor Código do fornecedor (opcional)
     * @return Lista de documentos em aberto
     */
        @GetMapping("/pagar")
        public ResponseEntity<?> listarDocumentosPagar(
            @RequestParam(required = false) Integer codigoFornecedor) {
        
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT p.pagar_id, p.codigo_pag, c.nome_cli, ");
            // Use the actual DB column 'parcela_pag' but alias to 'parc_pag' to keep frontend keys
            // Prefer 'vlrnota_pag' (valor da NFe) when present; otherwise fallback to legacy calculation
            sql.append("p.numdup_pag, p.parcela_pag AS parc_pag, p.vlrdup_pag, p.vlrmult_pag, (COALESCE(p.vlrnota_pag, (COALESCE(p.vlrdup_pag,0) + COALESCE(p.vlrmult_pag,0) + COALESCE(p.vlracre_pag,0) - COALESCE(p.vlrdesc_pag,0)))) AS vlrtot_pag, p.vlrsal_pag, ");
            sql.append("p.vlrpag_pag, p.vlracre_pag, p.vlrdesc_pag, p.dtvenci_pag, ");
            sql.append("p.status_pag, p.dtpagi_pag ");
            sql.append("FROM pagar p ");
            sql.append("LEFT JOIN clientes c ON p.codigo_pag = c.codigo_cli AND c.cliforn_cli = 'F' ");
            sql.append("WHERE p.vlrsal_pag > 0 ");
            sql.append("AND (p.status_pag IS NULL OR p.status_pag = '') "); // Só não-excluídos/não-cancelados
            sql.append("AND (p.dtpagi_pag IS NULL OR p.dtpagi_pag = '0000-00-00') "); // Ainda não foi pago

            List<Object> params = new ArrayList<>();

            if (codigoFornecedor != null) {
                sql.append("AND p.codigo_pag = ? ");
                params.add(codigoFornecedor);
            }

            sql.append("ORDER BY p.dtvenci_pag ASC, p.numdup_pag ASC");

            // Log SQL for debugging
            System.out.println("[DocumentosAbertosController] SQL pagar: " + sql.toString());

            Object[] args = params.toArray(new Object[0]);
            List<Map<String, Object>> documentos = new ArrayList<>();
            javax.sql.DataSource ds = jdbcTemplate.getDataSource();
            try (java.sql.Connection conn = ds.getConnection();
                 java.sql.PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                for (int i = 0; i < args.length; i++) {
                    ps.setObject(i + 1, args[i]);
                }
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    java.sql.ResultSetMetaData meta = rs.getMetaData();
                    while (rs.next()) {
                        Map<String, Object> row = new HashMap<>();
                        int cols = meta.getColumnCount();
                        for (int i = 1; i <= cols; i++) {
                            String colName = meta.getColumnLabel(i);
                            row.put(colName, rs.getObject(i));
                        }
                        documentos.add(row);
                    }
                }
            }

            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            System.err.println("Erro ao listar documentos a pagar: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            erro.put("sql", "ver logs no servidor");
            return ResponseEntity.status(500).body(erro);
        }
    }

    /**
     * Busca próxima sequência do dia para o caixa
     * @param datMovimento Data do movimento em formato DDMMAAAA
     * @return Próxima sequência
     */
    @GetMapping("/proxima-sequencia")
        public ResponseEntity<Map<String, Object>> buscarProximaSequencia(
            @RequestParam String datMovimento,
            @RequestParam(required = false) String banco,
            @RequestParam(required = false) String clienteCai,
            jakarta.servlet.http.HttpSession session) {
        
        try {
                // Tentar recuperar filial da sessão (padrão '001' se não presente)
                String filial = "001";
                Object filAttr = session.getAttribute("id_fil");
                if (filAttr != null) filial = filAttr.toString();

                // Parâmetros opcionais: banco e clienteCai (query params). Se não informados, usar padrões.
                String bancoFinal = banco != null ? banco : "001";
                String clienteFinal = clienteCai != null ? clienteCai : "001";

                // Build SQL com filtro por filial, banco, dtmovi_cai e cliente_cai
                String sql = "SELECT COALESCE(MAX(seq_cai), 0) + 1 as proxima_sequencia FROM caixa WHERE filial_cai = ? AND codbanco_cai = ? AND dtmovi_cai = ? AND tipocai_cai = ?";

                Integer proximaSequencia = jdbcTemplate.queryForObject(sql, Integer.class, filial, bancoFinal, datMovimento, clienteFinal);

            Map<String, Object> response = new HashMap<>();
            response.put("proxima_sequencia", proximaSequencia);
            response.put("data_movimento", datMovimento);
            response.put("filial", filial);
            response.put("banco", bancoFinal);
            response.put("cliente_cai", clienteFinal);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erro ao buscar próxima sequência: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> response = new HashMap<>();
            response.put("proxima_sequencia", 1);
            response.put("data_movimento", datMovimento);

            return ResponseEntity.ok(response);
        }
    }

    /**
     * Lista documentos vinculados a um movimento de caixa (RECEBER)
     * 
     * Usa composite key: cxbco_rec, opercai_rec, seqcai_rec
     * Maps para campos de caixa: cliente_cai, opercai_cai, seq_cai
     * 
     * @param cxbco Código do banco (cliente_cai na tabela caixa)
     * @param opercai Operação de caixa (opercai_cai)
     * @param seqcai Sequência do movimento (seq_cai)
     * @param dtpagi Data do movimento em formato DDMMAAAA (dtpagi_rec)
     * @return Lista de documentos receber vinculados
     */
    @GetMapping("/receber/vinculados")
    public ResponseEntity<?> listarDocumentosReceberVinculados(
        @RequestParam(required = true) String cxbco,
        @RequestParam(required = true) String seqcai,
        @RequestParam(required = true) String dtpagi) {
        
        try {
            // ✅ CORREÇÃO: dtpagi vem em formato AAAAMMDD (20251201)
            // Converter AAAAMMDD para YYYY-MM-DD
            String dataPagamento = dtpagi;
            if (dtpagi.length() == 8 && dtpagi.matches("\\d{8}")) {
                // AAAAMMDD -> YYYY-MM-DD
                // Exemplo: 20251201 -> 2025-12-01
                String ano = dtpagi.substring(0, 4);    // 2025
                String mes = dtpagi.substring(4, 6);    // 12
                String dia = dtpagi.substring(6, 8);    // 01
                dataPagamento = ano + "-" + mes + "-" + dia;  // 2025-12-01
                System.out.println("[DocumentosAbertosController.listarDocumentosReceberVinculados] ✅ Convertido AAAAMMDD → YYYY-MM-DD: " + dtpagi + " → " + dataPagamento);
            } else {
                System.out.println("[DocumentosAbertosController.listarDocumentosReceberVinculados] ⚠️ dtpagi em formato desconhecido: " + dtpagi);
            }

            // ✅ NOVO: Converter cxbco de STRING para INT (remove leading zeros)
            int cxbcoInt = Integer.parseInt(cxbco.trim());
            int seqcaiInt = Integer.parseInt(seqcai.trim());
            
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT ");
            sql.append("  r.receber_id, r.codigo_rec, c.nome_cli, r.numdup_rec, r.parcela_rec, ");
            sql.append("  r.vlrdup_rec, r.vlrsal_rec, r.vlrpag_rec, r.vlracre_rec, r.vlrmulta_rec, r.vlrdesc_rec, ");
            sql.append("  r.dtvenci_rec, r.status_rec, r.dtpagi_rec, ");
            sql.append("  r.cxbco_rec, r.seqcai_rec, r.filial_rec ");
            sql.append("FROM receber r ");
            sql.append("LEFT JOIN clientes c ON r.codigo_rec = c.codigo_cli AND c.cliforn_cli = 'C' ");
            sql.append("WHERE r.cxbco_rec = ? ");
            sql.append("  AND r.seqcai_rec = ? ");
            sql.append("  AND r.dtpagi_rec = ? ");
            sql.append("  AND r.filial_rec = '001' ");
            // Nota: vlrsal_rec pode ser NULL (quitado) ou > 0 (aberto) - retornar ambos
            sql.append("ORDER BY r.parcela_rec ASC");

            System.out.println("[DocumentosAbertosController.listarDocumentosReceberVinculados] Vinculados receber - cxbco=" + cxbcoInt + 
                             " seqcai=" + seqcaiInt + " dtpagi=" + dataPagamento);

            Object[] args = {cxbcoInt, seqcaiInt, dataPagamento};
            List<Map<String, Object>> documentos = new ArrayList<>();
            javax.sql.DataSource ds = jdbcTemplate.getDataSource();
            try (java.sql.Connection conn = ds.getConnection();
                 java.sql.PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                for (int i = 0; i < args.length; i++) {
                    ps.setObject(i + 1, args[i]);
                }
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    java.sql.ResultSetMetaData meta = rs.getMetaData();
                    while (rs.next()) {
                        Map<String, Object> row = new HashMap<>();
                        int cols = meta.getColumnCount();
                        for (int i = 1; i <= cols; i++) {
                            String colName = meta.getColumnLabel(i);
                            // ✅ Converter colName para minúsculas para compatibilidade com React
                            String colNameLowerCase = colName.toLowerCase();
                            row.put(colNameLowerCase, rs.getObject(i));
                        }
                        documentos.add(row);
                    }
                }
            }

            System.out.println("[DocumentosAbertosController] Encontrados " + documentos.size() + " documentos vinculados");
            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            System.err.println("Erro ao listar documentos vinculados receber: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            return ResponseEntity.status(500).body(erro);
        }
    }

    /**
     * Lista documentos vinculados a um movimento de caixa (PAGAR)
     * 
     * Usa composite key: cxbco_pag, opercai_pag, seqcai_pag
     * Maps para campos de caixa: cliente_cai, opercai_cai, seq_cai
     * 
     * @param cxbco Código do banco (cliente_cai na tabela caixa)
     * @param opercai Operação de caixa (opercai_cai)
     * @param seqcai Sequência do movimento (seq_cai)
     * @param dtpagi Data do movimento em formato DDMMAAAA (dtpagi_pag)
     * @return Lista de documentos pagar vinculados
     */
    @GetMapping("/pagar/vinculados")
    public ResponseEntity<?> listarDocumentosPagarVinculados(
        @RequestParam(required = true) String cxbco,
        @RequestParam(required = true) String seqcai,
        @RequestParam(required = true) String dtpagi) {
        
        try {
            // ✅ CORREÇÃO: dtpagi vem em formato AAAAMMDD (20251201)
            // Converter AAAAMMDD para YYYY-MM-DD
            String dataPagamento = dtpagi;
            if (dtpagi.length() == 8 && dtpagi.matches("\\d{8}")) {
                // AAAAMMDD -> YYYY-MM-DD
                // Exemplo: 20251201 -> 2025-12-01
                String ano = dtpagi.substring(0, 4);    // 2025
                String mes = dtpagi.substring(4, 6);    // 12
                String dia = dtpagi.substring(6, 8);    // 01
                dataPagamento = ano + "-" + mes + "-" + dia;  // 2025-12-01
                System.out.println("[DocumentosAbertosController.listarDocumentosPagarVinculados] ✅ Convertido AAAAMMDD → YYYY-MM-DD: " + dtpagi + " → " + dataPagamento);
            } else {
                System.out.println("[DocumentosAbertosController.listarDocumentosPagarVinculados] ⚠️ dtpagi em formato desconhecido: " + dtpagi);
            }

            // ✅ NOVO: Converter cxbco de STRING para INT (remove leading zeros)
            int cxbcoInt = Integer.parseInt(cxbco.trim());
            int seqcaiInt = Integer.parseInt(seqcai.trim());
            
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT ");
            sql.append("  p.pagar_id, p.codigo_pag, c.nome_cli, p.numdup_pag, p.parcela_pag, ");
            sql.append("  p.vlrdup_pag, p.vlrsal_pag, p.vlrpag_pag, p.vlracre_pag, p.vlrmult_pag, p.vlrdesc_pag, ");
            sql.append("  p.dtvenci_pag, p.status_pag, p.dtpagi_pag, ");
            sql.append("  p.cxbco_pag, p.seqcai_pag, p.filial_pag ");
            sql.append("FROM pagar p ");
            sql.append("LEFT JOIN clientes c ON p.codigo_pag = c.codigo_cli AND c.cliforn_cli = 'F' ");
            sql.append("WHERE p.cxbco_pag = ? ");
            sql.append("  AND p.seqcai_pag = ? ");
            sql.append("  AND p.dtpagi_pag = ? ");
            sql.append("  AND p.filial_pag = '001' ");
            // Nota: vlrsal_pag pode ser NULL (quitado) ou > 0 (aberto) - retornar ambos
            sql.append("ORDER BY p.parcela_pag ASC");

            System.out.println("[DocumentosAbertosController.listarDocumentosPagarVinculados] Vinculados pagar - cxbco=" + cxbcoInt + 
                             " seqcai=" + seqcaiInt + " dtpagi=" + dataPagamento);

            Object[] args = {cxbcoInt, seqcaiInt, dataPagamento};
            List<Map<String, Object>> documentos = new ArrayList<>();
            javax.sql.DataSource ds = jdbcTemplate.getDataSource();
            try (java.sql.Connection conn = ds.getConnection();
                 java.sql.PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                for (int i = 0; i < args.length; i++) {
                    ps.setObject(i + 1, args[i]);
                }
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    java.sql.ResultSetMetaData meta = rs.getMetaData();
                    while (rs.next()) {
                        Map<String, Object> row = new HashMap<>();
                        int cols = meta.getColumnCount();
                        for (int i = 1; i <= cols; i++) {
                            String colName = meta.getColumnLabel(i);
                            // ✅ Converter colName para minúsculas para compatibilidade com React
                            String colNameLowerCase = colName.toLowerCase();
                            row.put(colNameLowerCase, rs.getObject(i));
                        }
                        documentos.add(row);
                    }
                }
            }

            System.out.println("[DocumentosAbertosController] Encontrados " + documentos.size() + " documentos vinculados");
            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            System.err.println("Erro ao listar documentos vinculados pagar: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            return ResponseEntity.status(500).body(erro);
        }
    }

    /**
     * ✅ NOVO: Endpoint completo para edição de movimento de caixa
     * Retorna: documentos vinculados + documentos disponíveis + tipo de documento (R/P)
     * 
     * Busca usando composite key:
     * - cxbco_rec = codbanco_cai
     * - dtpagi_rec = dtmovi_cai
     * - seqcai_rec = seq_cai
     * 
     * Determina tipo (RECEBER vs PAGAR) via mascai.tipo_ocai:
     * - tipo_ocai = 'C' → RECEBER
     * - tipo_ocai != 'C' → PAGAR
     * 
     * @param codbanco Código do banco (cxbco_rec, cliente_cai)
     * @param dtmovi Data do movimento (YYYY-MM-DD ou DDMMAAAA)
     * @param seqcai Sequência do movimento
     * @param operacao Operação de caixa (para determinar tipo via mascai)
     * @return {
     *   tipo_documento: 'R' | 'P',
     *   documentos_vinculados: [...],
     *   documentos_disponiveis: [...]
     * }
     */
    @GetMapping("/movimento-caixa/detalhes")
    public ResponseEntity<?> buscarDetalhesMovimentoCaixa(
        @RequestParam(required = true) String codbanco,
        @RequestParam(required = true) String dtmovi,
        @RequestParam(required = true) String seqcai,
        @RequestParam(required = true) String operacao) {
        
        try {
            // ✅ CONVERSÃO DE TIPOS E NORMALIZAÇÃO DE DATA (evita incompatibilidade com decimal e SQL Date)
            int cxbcoInt = Integer.parseInt(codbanco.trim());
            int seqcaiInt = Integer.parseInt(seqcai.trim());
            
            String dataPagamento = dtmovi.trim();
            if (dataPagamento.contains("T")) {
                dataPagamento = dataPagamento.split("T")[0].trim();
            }
            if (dataPagamento.length() == 8 && dataPagamento.matches("\\d{8}")) {
                // AAAAMMDD -> YYYY-MM-DD
                String ano = dataPagamento.substring(0, 4);
                String mes = dataPagamento.substring(4, 6);
                String dia = dataPagamento.substring(6, 8);
                dataPagamento = ano + "-" + mes + "-" + dia;
            }
            
            // 1️⃣ Determinar TIPO de documento (R ou P) baseado na operacao_cai
            // Join com mascai usando: mascai.filial_ocai = '001' (session) e mascai.operacao_ocai = operacao_cai
            String sqlTipo = "SELECT mascai.tipo_ocai FROM mascai " +
                           "WHERE mascai.filial_ocai = '001' " +
                           "AND mascai.operacao_ocai = ? " +
                           "LIMIT 1";
            
            String tipoOperacao = "C"; // padrão: RECEBER
            try {
                Object result = jdbcTemplate.queryForObject(sqlTipo, String.class, operacao);
                if (result != null) {
                    tipoOperacao = result.toString();
                }
            } catch (Exception e) {
                System.err.println("[buscarDetalhesMovimentoCaixa] Aviso: não encontrou tipo_ocai para operacao=" + operacao);
            }
            
            String tipoDocumento = "C".equals(tipoOperacao) ? "R" : "P"; // 'C'=RECEBER, else=PAGAR
            
            System.out.println("[buscarDetalhesMovimentoCaixa] Tipo de documento determinado: " + tipoDocumento + 
                             " (operacao=" + operacao + ", tipo_ocai=" + tipoOperacao + ")");
            
            // 2️⃣ Buscar documentos VINCULADOS usando composite key
            List<Map<String, Object>> docsVinculados = new ArrayList<>();
            String sqlVinculados;
            if ("R".equals(tipoDocumento)) {
                // RECEBER: buscar documentos em receber vinculados
                sqlVinculados = "SELECT r.receber_id, r.codigo_rec, c.nome_cli, " +
                              "r.numdup_rec, r.parcela_rec AS parc_rec, r.vlrdup_rec, r.vlrmulta_rec, " +
                              "COALESCE(r.vlrnota_rec,0), (COALESCE(r.vlrdup_rec,0) + COALESCE(r.vlrmulta_rec,0) + COALESCE(r.vlracre_rec,0) - COALESCE(r.vlrdesc_rec,0)) AS vlrtot_rec, " +
                              "r.vlrsal_rec, r.vlrpag_rec, r.vlracre_rec, r.vlrdesc_rec, r.dtvenci_rec, r.status_rec " +
                              "FROM receber r " +
                              "LEFT JOIN clientes c ON r.codigo_rec = c.codigo_cli AND c.cliforn_cli = 'C' " +
                              "WHERE r.cxbco_rec = ? AND r.seqcai_rec = ? AND r.dtpagi_rec = ? " +
                              "ORDER BY c.nome_cli, r.numdup_rec";
            } else {
                // PAGAR: buscar documentos em pagar vinculados
                // ✅ CORREÇÃO: Usar p.parcela_pag AS parc_pag pois p.parc_pag não existe na BD
                sqlVinculados = "SELECT p.pagar_id, p.codigo_pag, f.nome_cli AS nome_cli, f.nome_cli AS fornecedor_nome, " +
                              "p.numdup_pag, p.parcela_pag AS parc_pag, p.vlrdup_pag, p.vlrmult_pag, " +
                              "COALESCE(p.vlrnota_pag,0), (COALESCE(p.vlrdup_pag,0) + COALESCE(p.vlrmult_pag,0) + COALESCE(p.vlracre_pag,0) - COALESCE(p.vlrdesc_pag,0)) AS vlrtot_pag, " +
                              "p.vlrsal_pag, p.vlrpag_pag, p.vlracre_pag, p.vlrdesc_pag, p.dtvenci_pag, p.status_pag " +
                              "FROM pagar p " +
                              "LEFT JOIN clientes f ON f.cliforn_cli = 'F' AND f.codigo_cli = p.codigo_pag " +
                              "WHERE p.cxbco_pag = ? AND p.seqcai_pag = ? AND p.dtpagi_pag = ? " +
                              "ORDER BY f.nome_cli, p.numdup_pag";
            }
            
            javax.sql.DataSource ds = jdbcTemplate.getDataSource();
            try (java.sql.Connection conn = ds.getConnection();
                 java.sql.PreparedStatement ps = conn.prepareStatement(sqlVinculados)) {
                 ps.setObject(1, cxbcoInt);
                 ps.setObject(2, seqcaiInt);
                 ps.setObject(3, dataPagamento);
                 try (java.sql.ResultSet rs = ps.executeQuery()) {
                     java.sql.ResultSetMetaData meta = rs.getMetaData();
                     while (rs.next()) {
                         Map<String, Object> row = new HashMap<>();
                         int cols = meta.getColumnCount();
                         for (int i = 1; i <= cols; i++) {
                             String colName = meta.getColumnLabel(i);
                             row.put(colName, rs.getObject(i));
                         }
                         docsVinculados.add(row);
                     }
                 }
             }
             
             System.out.println("[buscarDetalhesMovimentoCaixa] Encontrados " + docsVinculados.size() + " documentos vinculados");
             
             // 3️⃣ Buscar documentos DISPONÍVEIS (não vinculados, vlrsal > 0, status != 'E')
             List<Map<String, Object>> docsDisponiveis = new ArrayList<>();
             String sqlDisponiveis;
             if ("R".equals(tipoDocumento)) {
                 // RECEBER: documentos em aberto não vinculados a nenhum caixa
                 sqlDisponiveis = "SELECT r.receber_id, r.codigo_rec, c.nome_cli, " +
                                "r.numdup_rec, r.parcela_rec AS parc_rec, " +
                                "r.vlrdup_rec, r.vlrmulta_rec, r.vlracre_rec, r.vlrdesc_rec, r.vlrpag_rec, " +
                                "COALESCE(r.vlrnota_rec, COALESCE(r.vlrdup_rec,0) + COALESCE(r.vlrmulta_rec,0) + COALESCE(r.vlracre_rec,0) - COALESCE(r.vlrdesc_rec,0)) AS vlrtot_rec, " +
                                "r.vlrsal_rec, r.dtvenci_rec, r.status_rec " +
                                "FROM receber r " +
                                "LEFT JOIN clientes c ON r.codigo_rec = c.codigo_cli AND c.cliforn_cli = 'C' " +
                                "WHERE r.vlrsal_rec > 0 " +
                                "AND (r.status_rec IS NULL OR r.status_rec = '') " +
                                "AND (r.dtpagi_rec IS NULL OR r.dtpagi_rec = '0000-00-00') " +
                                "AND (r.cxbco_rec IS NULL OR r.cxbco_rec = '') " +
                                "ORDER BY c.nome_cli, r.numdup_rec LIMIT 100";
             } else {
                 // PAGAR: documentos em aberto não vinculados a nenhum caixa
                 // ✅ CORREÇÃO: Usar p.parcela_pag AS parc_pag pois p.parc_pag não existe na BD
                 sqlDisponiveis = "SELECT p.pagar_id, p.codigo_pag, f.nome_cli AS nome_cli, f.nome_cli AS fornecedor_nome, " +
                                "p.numdup_pag, p.parcela_pag AS parc_pag, " +
                                "p.vlrdup_pag, p.vlrmult_pag, p.vlracre_pag, p.vlrdesc_pag, p.vlrpag_pag, " +
                                "COALESCE(p.vlrnota_pag, COALESCE(p.vlrdup_pag,0) + COALESCE(p.vlrmult_pag,0) + COALESCE(p.vlracre_pag,0) - COALESCE(p.vlrdesc_pag,0)) AS vlrtot_pag, " +
                                "p.vlrsal_pag, p.dtvenci_pag, p.status_pag " +
                                "FROM pagar p " +
                                "LEFT JOIN clientes f ON f.cliforn_cli = 'F' AND f.codigo_cli = p.codigo_pag " +
                                "WHERE p.vlrsal_pag > 0 " +
                                "AND (p.status_pag IS NULL OR p.status_pag = '') " +
                                "AND (p.dtpagi_pag IS NULL OR p.dtpagi_pag = '0000-00-00') " +
                                "AND (p.cxbco_pag IS NULL OR p.cxbco_pag = '') " +
                                "ORDER BY f.nome_cli, p.numdup_pag LIMIT 100";
             }
            
            try (java.sql.Connection conn = ds.getConnection();
                 java.sql.PreparedStatement ps = conn.prepareStatement(sqlDisponiveis)) {
                try (java.sql.ResultSet rs = ps.executeQuery()) {
                    java.sql.ResultSetMetaData meta = rs.getMetaData();
                    while (rs.next()) {
                        Map<String, Object> row = new HashMap<>();
                        int cols = meta.getColumnCount();
                        for (int i = 1; i <= cols; i++) {
                            String colName = meta.getColumnLabel(i);
                            row.put(colName, rs.getObject(i));
                        }
                        docsDisponiveis.add(row);
                    }
                }
            }
            
            System.out.println("[buscarDetalhesMovimentoCaixa] Encontrados " + docsDisponiveis.size() + " documentos disponíveis");
            
            // 4️⃣ Retornar resposta consolidada
            Map<String, Object> response = new HashMap<>();
            response.put("tipo_documento", tipoDocumento);
            response.put("documentos_vinculados", docsVinculados);
            response.put("documentos_disponiveis", docsDisponiveis);
            response.put("info", new HashMap<String, Object>() {{
                put("codbanco", codbanco);
                put("dtmovi", dtmovi);
                put("seqcai", seqcai);
                put("operacao", operacao);
            }});
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erro ao buscar detalhes do movimento de caixa: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            return ResponseEntity.status(500).body(erro);
        }
    }
}
