package br.com.spdealer.controller;

import br.com.spdealer.service.ProcessamentoNotaService;
import br.com.spdealer.service.ImpressaoService;
import br.com.spdealer.service.EnvioDocumentoService;
import br.com.spdealer.service.OrcamentoService;
import br.com.spdealer.service.VendaPerdidaService;
import br.com.spdealer.util.SessionHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.servlet.http.HttpSession;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.Base64;

@RestController
@RequestMapping("/api/v1/orcamentos")
public class OrcamentoController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ProcessamentoNotaService processamentoNotaService;

    @Autowired
    private ImpressaoService impressaoService;

    @Autowired
    private EnvioDocumentoService envioDocumentoService;

    @Autowired
    private VendaPerdidaService vendaPerdidaService;

    @Autowired
    private OrcamentoService orcamentoService;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String tipo) {
        
        try {
            StringBuilder whereClause = new StringBuilder();
            List<Object> params = new ArrayList<>();
            String prefix = " WHERE ";

            if (search != null && !search.isEmpty()) {
                whereClause.append(prefix).append("(CAST(o.numero_orp AS CHAR) LIKE ? OR o.nome_cli LIKE ? OR CAST(o.cgccpf_cli AS CHAR) LIKE ?)");
                params.add("%" + search + "%");
                params.add("%" + search + "%");
                params.add("%" + search + "%");
                prefix = " AND ";
            }

            if (startDate != null && !startDate.isEmpty()) {
                whereClause.append(prefix).append("o.dtemi_orp >= ?");
                params.add(startDate);
                prefix = " AND ";
            }

            if (endDate != null && !endDate.isEmpty()) {
                whereClause.append(prefix).append("o.dtemi_orp <= ?");
                params.add(endDate);
                prefix = " AND ";
            }

            if (tipo != null && !tipo.isEmpty()) {
                whereClause.append(prefix).append("o.tipo_orp = ?");
                params.add(tipo);
                prefix = " AND ";
            } else {
                whereClause.append(prefix).append("o.tipo_orp <> 'C'");
                prefix = " AND ";
            }

            whereClause.append(prefix).append("(o.fechado_orp IS NULL OR o.fechado_orp <> 2)");

            String countSql = "SELECT COUNT(*) FROM orcamp o" + whereClause;
            int total = jdbcTemplate.queryForObject(countSql, Integer.class, params.toArray());

            String sql = """
                SELECT o.numero_orp as NUMERO_ORP, o.dtemi_orp as DTEMI_ORP, o.nome_cli as NOME_ORP, 
                       o.cgccpf_cli as CGCCPF_CLI, o.tipo_orp as TIPO_ORP, o.vlr_total_orp as VLR_TOTAL_ORP,
                       (COALESCE(c.limcre_cli, 0) - COALESCE(fin.saldo_pendente, 0)) as DISPONIVEL
                FROM orcamp o
                LEFT JOIN clientes c ON CAST(c.cgccpf_cli AS UNSIGNED) = CAST(o.cgccpf_cli AS UNSIGNED) AND c.cliforn_cli = 'C'
                LEFT JOIN (
                    SELECT cgccpf_rec, SUM(vlrsal_rec) as saldo_pendente 
                    FROM receber 
                    WHERE vlrsal_rec > 0 AND (status_rec IS NULL OR status_rec = '') 
                    GROUP BY cgccpf_rec
                ) fin ON fin.cgccpf_rec = CAST(o.cgccpf_cli AS UNSIGNED)
                """ + whereClause + """
                ORDER BY o.numero_orp DESC
                LIMIT ? OFFSET ?
                """;

            List<Object> queryParams = new ArrayList<>(params);
            queryParams.add(size);
            queryParams.add(page * size);

            List<Map<String, Object>> registros = jdbcTemplate.queryForList(sql, queryParams.toArray());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", registros);
            response.put("pagination", Map.of(
                "total", total,
                "page", page,
                "size", size,
                "totalPages", (int) Math.ceil((double) total / size)
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erro ao listar orçamentos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao listar orçamentos: " + e.getMessage()
            ));
        }
    }

    /**
     * Endpoint para buscar o histórico de atendimentos de um cliente
     * @param cgccpf CPF ou CNPJ do cliente
     * @return Lista de atendimentos (N°, Tipo, Data, Vendedor, Valor)
     */
    @GetMapping("/historico")
    public ResponseEntity<Map<String, Object>> getHistorico(@RequestParam String cgccpf) {
        System.out.println("[DEBUG] Buscando histórico para CGCCPF_CLI: " + cgccpf);
        try {
            String sql = """
                SELECT 
                    o.NUMERO_ORP as numero, 
                    CASE 
                        WHEN o.TIPO_ORP = 'O' THEN 'Orçamento' 
                        WHEN o.TIPO_ORP = 'P' THEN 'Pedido' 
                        WHEN o.TIPO_ORP = 'C' THEN 'Confirmado' 
                        ELSE 'Outro' 
                    END as tipo, 
                    DATE_FORMAT(o.DTEMI_ORP, '%d/%m/%Y') as data, 
                    COALESCE(CONVERT(v.NOME_VEN USING utf8mb4), CAST(o.VENDEDOR_ORP AS CHAR)) as vendedor, 
                    COALESCE(o.VLR_TOTAL_ORP, 0) as valor,
                    o.CONDPAG_ORP as condpag
                FROM orcamp o
                LEFT JOIN masven v ON CAST(o.VENDEDOR_ORP AS CHAR) = CAST(v.COD_VEN AS CHAR)
                WHERE o.CGCCPF_CLI = ?
                ORDER BY o.DTEMI_ORP DESC
                LIMIT 100
                """;

            List<Map<String, Object>> historico = jdbcTemplate.queryForList(sql, cgccpf);
            System.out.println("[DEBUG] Histórico encontrado: " + historico.size() + " registros");

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", historico
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar histórico: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar histórico: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{numero}")
    public ResponseEntity<Map<String, Object>> buscarPorId(@PathVariable String numero) {
        try {
            // Garante que o número tenha 8 dígitos para bater com ambas as tabelas (char 8)
            String paddedNumero = numero;
            try {
                if (numero != null && numero.matches("\\d+")) {
                    paddedNumero = String.format("%08d", Integer.parseInt(numero));
                }
            } catch (Exception e) {
                // Se não for numérico, mantém o original
            }

            String sql = """
                SELECT o.*, c.codigo_cli as CODCLI_ORP 
                FROM orcamp o 
                LEFT JOIN clientes c ON CAST(c.cgccpf_cli AS UNSIGNED) = CAST(o.cgccpf_cli AS UNSIGNED) AND c.cliforn_cli = 'C' 
                WHERE o.NUMERO_ORP = ?
                """;
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, paddedNumero);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Orçamento não encontrado"
                ));
            }

            Map<String, Object> orcamento = new HashMap<>();
            resultados.get(0).forEach((k, v) -> orcamento.put(k.toUpperCase(), v));

            // ⭐ Formata Condição de Pagamento para 2 dígitos (ex: 1 -> "01")
            Object cond = orcamento.get("CONDPAG_ORP");
            if (cond != null) {
                try {
                    String formatted = String.format("%02d", Integer.parseInt(cond.toString()));
                    orcamento.put("CONDPAG_ORP", formatted);
                    orcamento.put("CODPAG_ORP", formatted); // Mantém compatibilidade com ambos os nomes
                } catch (Exception e) {
                    // Se não for numérico, mantém original
                }
            }

            String itensSql = """
                SELECT * FROM orcampp
                WHERE NUMERO_ORPP = ?
                ORDER BY REQUIS_ORPP, FAB_ORPP, CODIGO_ORPP
                """;
            List<Map<String, Object>> itensRaw = jdbcTemplate.queryForList(itensSql, paddedNumero);
            List<Map<String, Object>> itens = new ArrayList<>();
            for (Map<String, Object> it : itensRaw) {
                Map<String, Object> upperIt = new HashMap<>();
                it.forEach((k, v) -> upperIt.put(k.toUpperCase(), v));
                itens.add(upperIt);
            }

            orcamento.put("itens", itens);
            orcamento.put("ITENS", itens);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", orcamento
            ));

        } catch (Exception e) {
            System.err.println("Erro ao buscar orçamento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao buscar orçamento"
            ));
        }
    }

    @PostMapping
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Map<String, Object> data) {
        int maxRetries = 3;
        int attempt = 0;
        while (attempt < maxRetries) {
            attempt++;
            try {
                return criarInternal(data);
            } catch (DataIntegrityViolationException e) {
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                String msg = e.getMessage() != null ? e.getMessage() : "";
                if (msg.contains("Duplicate entry") && msg.contains("PRIMARY") && attempt < maxRetries) {
                    System.err.println("[" + attempt + "/" + maxRetries + "] Conflito de PK ao criar orçamento. Gerando novo número e tentando novamente...");
                    data.remove("NUMERO_ORP");
                    continue;
                }
                throw e;
            } catch (Exception e) {
                TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                System.err.println("Erro ao criar orçamento: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Erro ao criar orçamento: " + e.getMessage()
                ));
            }
        }
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "error", "Erro ao criar orçamento após " + maxRetries + " tentativas devido a conflito de chave duplicada."
        ));
    }

    private ResponseEntity<Map<String, Object>> criarInternal(Map<String, Object> data) {
            // Validate required fields
            String vendedorStr = getString(data, "VENDEDOR_ORP");
            if (vendedorStr == null) vendedorStr = getString(data, "CODVENDEDOR_ORP");
            String condPagStr = getString(data, "CONDPAG_ORP");
            if (condPagStr == null) condPagStr = getString(data, "CODPAG_ORP");

            boolean vendedorValido = vendedorStr != null && !vendedorStr.trim().isEmpty() && !vendedorStr.trim().equals("0");
            boolean condPagValido = condPagStr != null && !condPagStr.trim().isEmpty();

            if (!vendedorValido || !condPagValido) {
                StringBuilder msg = new StringBuilder("Preencha os campos obrigatórios:");
                if (!vendedorValido) msg.append(" Vendedor");
                if (!vendedorValido && !condPagValido) msg.append(",");
                if (!condPagValido) msg.append(" Condição de Pagamento");
                msg.append(" para finalizar o orçamento.");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false, "error", msg.toString()
                ));
            }

            Integer filial = data.get("FILIAL_ORP") != null ? 
                Integer.parseInt(data.get("FILIAL_ORP").toString()) : 1;

            Integer numeroInt = data.get("NUMERO_ORP") != null && !data.get("NUMERO_ORP").toString().isEmpty() ?
                Integer.parseInt(data.get("NUMERO_ORP").toString()) : getNextNumeroFromDb(filial);
            if (numeroInt != null && numeroInt <= 0) {
                numeroInt = getNextNumeroFromDb(filial);
            }
            String numero = padNumero(numeroInt);
            LocalDate dataOrc = LocalDate.now();
            if (data.get("DTEMI_ORP") != null) {
                dataOrc = LocalDate.parse(data.get("DTEMI_ORP").toString(), DATE_FORMAT);
            }

            // TIPOCLI_ORP = J (CNPJ) / F (CPF)
            String cgcCpf = getString(data, "CGCCPF_CLI");
            String tipocliOrp = "F";
            if (cgcCpf != null) {
                String digits = cgcCpf.replaceAll("\\D", "");
                if (digits.length() == 14) tipocliOrp = "J";
            }

            String tipoOrpInsert = data.get("TIPO_ORP") != null ? data.get("TIPO_ORP").toString() : "O";
            int fechadoOrpInsert = "C".equals(tipoOrpInsert) || "P".equals(tipoOrpInsert) ? 1 : 0;

            String sql = """
                INSERT INTO orcamp (
                    FILIAL_ORP, NUMERO_ORP, DTEMI_ORP, TIPO_ORP,
                    CGCCPF_CLI, NOME_CLI, LOGRA_ORP, BAIRRO_ORP, CIDADE_ORP, UF_ORP,
                    CEP_ORP, NIVEL_ORP,
                    CONDPAG_ORP, VENDEDOR_ORP, OBS_ORP, TIPOCLI_ORP,
                    VLR_PECAS_ORP, VLR_SERVICO_ORP, VLR_DESCPEC_ORP, VLR_TOTAL_ORP,
                    MODELO_ORP, FECHADO_ORP
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

            // Tratamento especial para CONDPAG_ORP / CODPAG_ORP (char 2)
            String condPag = getString(data, "CODPAG_ORP");
            if (condPag == null) condPag = getString(data, "CONDPAG_ORP");

            if (condPag != null && condPag.length() > 2) {
                condPag = condPag.substring(condPag.length() - 2);
            }

            jdbcTemplate.update(sql,
                padFilial(filial),
                numero,
                dataOrc,
                tipoOrpInsert,
                cgcCpf,
                data.get("NOME_CLI") != null ? data.get("NOME_CLI") : data.get("NOME_ORP"),
                data.get("LOGRA_ORP"),
                data.get("BAIRRO_ORP"),
                data.get("CIDADE_ORP"),
                data.get("UF_ORP"),
                data.get("CEP_ORP"),
                data.get("NIVEL_ORP"),
                condPag,
                data.get("VENDEDOR_ORP"),
                data.get("OBS_ORP"),
                tipocliOrp,
                getBigDecimal(data, "VLR_PECAS_ORP"),
                getBigDecimal(data, "VLR_SERVICO_ORP"),
                getBigDecimal(data, "VLR_DESCPEC_ORP"),
                getBigDecimal(data, "VLR_TOTAL_ORP"),
                getString(data, "MODELO_ORP"),
                fechadoOrpInsert
            );

            String vendedor = padVendedor(getString(data, "VENDEDOR_ORP"));
            if (vendedor == null) vendedor = padVendedor(getString(data, "CODVENDEDOR_ORP"));

            List<Map<String, Object>> itens = (List<Map<String, Object>>) data.get("itens");
            if (itens != null && !itens.isEmpty()) {
                int seq = 1;
                for (Map<String, Object> item : itens) {
                    inserirItem(numeroInt, filial, seq++, item, vendedor);
                }
            }

            return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", "Orçamento criado com sucesso",
                "numero", numeroInt
            ));
    }

    @PutMapping("/{numero}")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> atualizar(
            @PathVariable Integer numero,
            @RequestBody Map<String, Object> data) {
        try {
            // Validate required fields
            String vendedorStr = getString(data, "VENDEDOR_ORP");
            if (vendedorStr == null) vendedorStr = getString(data, "CODVENDEDOR_ORP");
            String condPagStr = getString(data, "CONDPAG_ORP");
            if (condPagStr == null) condPagStr = getString(data, "CODPAG_ORP");

            boolean vendedorValido = vendedorStr != null && !vendedorStr.trim().isEmpty() && !vendedorStr.trim().equals("0");
            boolean condPagValido = condPagStr != null && !condPagStr.trim().isEmpty();

            if (!vendedorValido || !condPagValido) {
                StringBuilder msg = new StringBuilder("Preencha os campos obrigatórios:");
                if (!vendedorValido) msg.append(" Vendedor");
                if (!vendedorValido && !condPagValido) msg.append(",");
                if (!condPagValido) msg.append(" Condição de Pagamento");
                msg.append(" para finalizar o orçamento.");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false, "error", msg.toString()
                ));
            }

            String numeroPadded = padNumero(numero);
            Integer filial = data.get("FILIAL_ORP") != null ? 
                Integer.parseInt(data.get("FILIAL_ORP").toString()) : 1;
            String filialPadded = padFilial(filial);

            String checkSql = "SELECT COUNT(*) FROM orcamp WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, numero, filialPadded);
            
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Orçamento não encontrado"
                ));
            }

            LocalDate dataOrc = LocalDate.now();
            if (data.get("DTEMI_ORP") != null) {
                dataOrc = LocalDate.parse(data.get("DTEMI_ORP").toString(), DATE_FORMAT);
            }

            // TIPOCLI_ORP = J (CNPJ) / F (CPF)
            String cgcCpf = getString(data, "CGCCPF_CLI");
            String tipocliOrp = "F";
            if (cgcCpf != null) {
                String digits = cgcCpf.replaceAll("\\D", "");
                if (digits.length() == 14) tipocliOrp = "J";
            }

            String tipoOrpUpdate = data.get("TIPO_ORP") != null ? data.get("TIPO_ORP").toString() : "O";
            int fechadoOrpUpdate = "C".equals(tipoOrpUpdate) || "P".equals(tipoOrpUpdate) ? 1 : 0;

            String sql = """
                UPDATE orcamp SET
                    DTEMI_ORP = ?,
                    CGCCPF_CLI = ?,
                    NOME_CLI = ?,
                    LOGRA_ORP = ?,
                    BAIRRO_ORP = ?,
                    CIDADE_ORP = ?,
                    UF_ORP = ?,
                    CEP_ORP = ?,
                    NIVEL_ORP = ?,
                    CONDPAG_ORP = ?,
                    VENDEDOR_ORP = ?,
                    OBS_ORP = ?,
                    TIPOCLI_ORP = ?,
                    VLR_PECAS_ORP = ?,
                    VLR_SERVICO_ORP = ?,
                    VLR_DESCPEC_ORP = ?,
                    VLR_TOTAL_ORP = ?,
                    MODELO_ORP = ?,
                    FECHADO_ORP = ?
                WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?
                """;

            // Tratamento especial para CONDPAG_ORP / CODPAG_ORP (char 2)
            String condPag = getString(data, "CODPAG_ORP");
            if (condPag == null) condPag = getString(data, "CONDPAG_ORP");

            if (condPag != null && condPag.length() > 2) {
                condPag = condPag.substring(condPag.length() - 2);
            }

            jdbcTemplate.update(sql,
                dataOrc,
                cgcCpf,
                data.get("NOME_CLI") != null ? data.get("NOME_CLI") : data.get("NOME_ORP"),
                data.get("LOGRA_ORP"),
                data.get("BAIRRO_ORP"),
                data.get("CIDADE_ORP"),
                data.get("UF_ORP"),
                data.get("CEP_ORP"),
                data.get("NIVEL_ORP"),
                condPag,
                data.get("VENDEDOR_ORP"),
                data.get("OBS_ORP"),
                tipocliOrp,
                getBigDecimal(data, "VLR_PECAS_ORP"),
                getBigDecimal(data, "VLR_SERVICO_ORP"),
                getBigDecimal(data, "VLR_DESCPEC_ORP"),
                getBigDecimal(data, "VLR_TOTAL_ORP"),
                getString(data, "MODELO_ORP"),
                fechadoOrpUpdate,
                numeroPadded,
                filialPadded
            );

            String vendedor = padVendedor(getString(data, "VENDEDOR_ORP"));
            if (vendedor == null) vendedor = padVendedor(getString(data, "CODVENDEDOR_ORP"));

            orcamentoService.reverterAlocacaoPorOrcamento(numeroPadded, "001");
            orcamentoService.removerPecfalPorOrcamento(numeroPadded);

            String deleteItensSql = "DELETE FROM orcampp WHERE NUMERO_ORPP = ?";
            jdbcTemplate.update(deleteItensSql, numeroPadded);

            List<Map<String, Object>> itens = (List<Map<String, Object>>) data.get("itens");
            if (itens != null && !itens.isEmpty()) {
                int seq = 1;
                for (Map<String, Object> item : itens) {
                    inserirItem(numero, filial, seq++, item, vendedor);
                }
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Orçamento atualizado com sucesso"
            ));

        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            System.err.println("Erro ao atualizar orçamento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao atualizar orçamento"
            ));
        }
    }

    @PostMapping("/{numero}/marcar-perda")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> marcarPerda(
            @PathVariable Integer numero,
            @RequestParam String motivo,
            @RequestParam(required = false) Integer filial) {
        try {
            String filialPadded = filial != null ? padFilial(filial) : "001";

            String checkSql = "SELECT COUNT(*) FROM orcamp WHERE NUMERO_ORP = ? AND FILIAL_ORP = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, padNumero(numero), filialPadded);
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Orçamento não encontrado"
                ));
            }

            int qtd = vendaPerdidaService.processarPerdaOrcamento(numero, filial, motivo);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Orçamento marcado como venda perdida",
                "itensProcessados", qtd
            ));

        } catch (Exception e) {
            System.err.println("Erro ao marcar perda: " + e.getMessage());
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao marcar perda: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{numero}/reverter-perda")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> reverterPerda(
            @PathVariable Integer numero,
            @RequestParam(required = false) Integer filial) {
        try {
            String filialPadded = filial != null ? padFilial(filial) : "001";

            String checkSql = "SELECT COUNT(*) FROM orcamp WHERE NUMERO_ORP = ? AND FILIAL_ORP = ? AND FECHADO_ORP = 2";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, padNumero(numero), filialPadded);
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Orçamento não está marcado como venda perdida"
                ));
            }

            int qtd = vendaPerdidaService.reverterPerdaOrcamento(numero, filial);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Perda revertida com sucesso",
                "itensRestaurados", qtd
            ));

        } catch (Exception e) {
            System.err.println("Erro ao reverter perda: " + e.getMessage());
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao reverter perda: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{numero}/itens/{seq}/marcar-perda")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> marcarPerdaItem(
            @PathVariable Integer numero,
            @PathVariable Integer seq,
            @RequestBody Map<String, Object> body) {
        try {
            String motivo = body.get("motivo") != null ? body.get("motivo").toString() : "";
            Integer filial = body.get("filial") != null
                ? Integer.parseInt(body.get("filial").toString()) : 1;

            if (motivo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Motivo da perda é obrigatório"
                ));
            }

            String numeroPadded = padNumero(numero);
            String checkSql = "SELECT COUNT(*) FROM orcampp WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ?";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, numeroPadded,
                String.format("%08d", seq));
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Item não encontrado"
                ));
            }

            vendaPerdidaService.processarPerdaItem(numeroPadded, seq, motivo, filial);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Item marcado como venda perdida"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao marcar perda do item: " + e.getMessage());
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao marcar perda do item: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{numero}/itens/{seq}/reverter-perda")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> reverterPerdaItem(
            @PathVariable Integer numero,
            @PathVariable Integer seq,
            @RequestParam(required = false) Integer filial) {
        try {
            String numeroPadded = padNumero(numero);
            String checkSql = "SELECT COUNT(*) FROM orcampp WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ? AND FECHADO_ORPP = 2";
            int exists = jdbcTemplate.queryForObject(checkSql, Integer.class, numeroPadded,
                String.format("%08d", seq));
            if (exists == 0) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Item não está marcado como perda"
                ));
            }

            vendaPerdidaService.reverterPerdaItem(numeroPadded, seq, filial);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Perda do item revertida"
            ));

        } catch (Exception e) {
            System.err.println("Erro ao reverter perda do item: " + e.getMessage());
            e.printStackTrace();
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao reverter perda do item: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/numero-next")
    public ResponseEntity<Map<String, Object>> getNextNumero(
            @RequestParam(required = false) Integer filial) {
        try {
            Integer next = getNextNumeroFromDb(filial != null ? filial : 1);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "numero", next
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao gerar número"
            ));
        }
    }

    @PostMapping("/{numero}/itens")
    public ResponseEntity<Map<String, Object>> adicionarItem(
            @PathVariable Integer numero,
            @RequestBody Map<String, Object> item) {
        try {
            String numeroPadded = padNumero(numero);
            String sql = "SELECT COUNT(*) FROM orcampp WHERE NUMERO_ORPP = ?";
            int count = jdbcTemplate.queryForObject(sql, Integer.class, numeroPadded);
            int seq = count + 1;

            String filialSql = "SELECT FILIAL_ORP, VENDEDOR_ORP FROM orcamp WHERE NUMERO_ORP = ?";
            Map<String, Object> orcData = jdbcTemplate.queryForMap(filialSql, numero);
            Integer filial = ((Number) orcData.get("FILIAL_ORP")).intValue();
            String vendedor = padVendedor(getString(orcData, "VENDEDOR_ORP"));

            inserirItem(numero, filial, seq, item, vendedor);

            return ResponseEntity.status(201).body(Map.of(
                "success", true,
                "message", "Item adicionado",
                "seq", seq
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao adicionar item"
            ));
        }
    }

    @DeleteMapping("/{numero}/itens/{seq}")
    public ResponseEntity<Map<String, Object>> removerItem(
            @PathVariable Integer numero,
            @PathVariable Integer seq) {
        try {
            String numeroPadded = padNumero(numero);
            orcamentoService.removerPecfalPorItem(numeroPadded, seq);
            String sql = "DELETE FROM orcampp WHERE NUMERO_ORPP = ? AND REQUIS_ORPP = ?";
            jdbcTemplate.update(sql, numeroPadded, seq);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Item removido"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao remover item"
            ));
        }
    }

    @GetMapping("/{numero}/calcular-totais")
    public ResponseEntity<Map<String, Object>> calcularTotais(@PathVariable Integer numero) {
        try {
            String numeroPadded = padNumero(numero);
            String sql = """
                UPDATE orcamp SET
                    VLR_PECAS_ORP = COALESCE((SELECT SUM(PRECOTOT_ORPP) FROM orcampp WHERE NUMERO_ORPP = ? AND FAB_ORPP != 'S'), 0),
                    VLR_SERVICO_ORP = COALESCE((SELECT SUM(PRECOTOT_ORPP) FROM orcampp WHERE NUMERO_ORPP = ? AND FAB_ORPP = 'S'), 0)
                WHERE NUMERO_ORP = ?
                """;
            jdbcTemplate.update(sql, numeroPadded, numeroPadded, numeroPadded);

            String selectSql = "SELECT VLR_PECAS_ORP, VLR_SERVICO_ORP, VLR_IPI_ORP, VLR_ICMSST_ORP, VLR_FRETE_ORP, VLR_DESCPEC_ORP, VLR_TOTAL_ORP FROM orcamp WHERE NUMERO_ORP = ?";
            Map<String, Object> orc = jdbcTemplate.queryForMap(selectSql, numeroPadded);

            BigDecimal totpec = orc.get("VLR_PECAS_ORP") != null ? new BigDecimal(orc.get("VLR_PECAS_ORP").toString()) : BigDecimal.ZERO;
            BigDecimal totser = orc.get("VLR_SERVICO_ORP") != null ? new BigDecimal(orc.get("VLR_SERVICO_ORP").toString()) : BigDecimal.ZERO;
            BigDecimal totipi = orc.get("VLR_IPI_ORP") != null ? new BigDecimal(orc.get("VLR_IPI_ORP").toString()) : BigDecimal.ZERO;
            BigDecimal totst = orc.get("VLR_ICMSST_ORP") != null ? new BigDecimal(orc.get("VLR_ICMSST_ORP").toString()) : BigDecimal.ZERO;
            BigDecimal frete = orc.get("VLR_FRETE_ORP") != null ? new BigDecimal(orc.get("VLR_FRETE_ORP").toString()) : BigDecimal.ZERO;
            BigDecimal desc = orc.get("VLR_DESCPEC_ORP") != null ? new BigDecimal(orc.get("VLR_DESCPEC_ORP").toString()) : BigDecimal.ZERO;

            BigDecimal subtotal = totpec.add(totser);
            BigDecimal totalGeral = subtotal.add(totipi).add(totst).add(frete).subtract(desc);

            String updateTotais = """
                UPDATE orcamp SET
                    VLR_TOTAL_ORP = ?
                WHERE NUMERO_ORP = ?
                """;
            jdbcTemplate.update(updateTotais, totalGeral, numeroPadded);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "VLR_PECAS_ORP", totpec,
                    "VLR_SERVICO_ORP", totser,
                    "SUBTOTAL", subtotal,
                    "VLR_IPI_ORP", totipi,
                    "VLR_ICMSST_ORP", totst,
                    "VLR_FRETE_ORP", frete,
                    "VLR_DESCPEC_ORP", desc,
                    "VLR_TOTAL_ORP", totalGeral
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao calcular totais"
            ));
        }
    }

    @PostMapping("/{numero}/transformar-pedido")
    public ResponseEntity<Map<String, Object>> transformarEmPedido(@PathVariable Integer numero) {
        try {
            Integer filial = 1;
            
            Map<String, Object> result = processamentoNotaService.transformarOrcamentoEmPedido(numero, filial);
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(400).body(result);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao transformar orçamento: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{numero}/confirmar")
    public ResponseEntity<?> confirmarPedido(
            @PathVariable Integer numero,
            @RequestBody(required = false) Map<String, Object> params) {
        try {
            Integer filial = 1;
            Integer codigoVendedor = 1;
            String serie = "001";
            Integer tipoNota = 1;
            
            if (params != null) {
                if (params.get("filial") != null) {
                    filial = Integer.parseInt(params.get("filial").toString());
                }
                if (params.get("codigoVendedor") != null) {
                    codigoVendedor = Integer.parseInt(params.get("codigoVendedor").toString());
                }
                if (params.get("serie") != null) {
                    serie = params.get("serie").toString();
                }
                if (params.get("tipoNota") != null) {
                    tipoNota = Integer.parseInt(params.get("tipoNota").toString());
                }
            }
            
            Map<String, Object> result = processamentoNotaService.confirmarPedidoGerarNotaFiscal(
                numero, filial, codigoVendedor, serie, tipoNota
            );
            
            if (!Boolean.TRUE.equals(result.get("success"))) {
                return ResponseEntity.status(400).body(result);
            }
            
            Integer numeroNota = (Integer) result.get("numeroNota");
            String serieNota = (String) result.get("serie");
            
            String notascabSql = "SELECT * FROM notascab WHERE NUMERO_NOT = ? AND SERIE_NOT = ?";
            List<Map<String, Object>> notascabResults = jdbcTemplate.queryForList(notascabSql, numeroNota, serieNota);
            
            if (!notascabResults.isEmpty()) {
                Map<String, Object> notascab = notascabResults.get(0);
                String itensSql = "SELECT * FROM notasdet WHERE NUMERO_NOT = ? AND SERIE_NOT = ? ORDER BY SEQUENCIA_NOT";
                List<Map<String, Object>> notasdet = jdbcTemplate.queryForList(itensSql, numeroNota, serieNota);
                
                byte[] pdfBytes = impressaoService.gerarPdfNotaFiscal(notascab, notasdet);
                
                result.put("pdfBase64", Base64.getEncoder().encodeToString(pdfBytes));
                result.put("pdfFileName", "NF_" + numeroNota + "_" + serieNota + ".pdf");
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.err.println("Erro ao confirmar pedido: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao confirmar pedido: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{numero}/cancelar-confirmacao")
    public ResponseEntity<Map<String, Object>> cancelarConfirmacao(@PathVariable Integer numero) {
        try {
            Integer filial = 1;
            
            Map<String, Object> result = processamentoNotaService.cancelarConfirmacao(numero, filial);
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(400).body(result);
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao cancelar confirmação: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{numero}/imprimir")
    public ResponseEntity<?> imprimir(@PathVariable Integer numero, HttpSession session) {
        try {
            String numeroPadded = padNumero(numero);
            String sql = """
                SELECT o.*, v.NOME_VEN as NOME_VEN, c.descr_paga as DESCR_PAG
                FROM orcamp o
                LEFT JOIN masven v ON CAST(o.VENDEDOR_ORP AS CHAR) = CAST(v.COD_VEN AS CHAR)
                LEFT JOIN maspag c ON c.codigo_paga = o.condpag_orp
                WHERE o.NUMERO_ORP = ?
                """;
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, numeroPadded);

            if (resultados.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> orcamento = resultados.get(0);

            String empresaCodigo = null;
            String usuarioNome = "SISTEMA";
            try {
                empresaCodigo = SessionHelper.getEmpresaFromSession(session);
                Object nome = session.getAttribute("nome_usu");
                if (nome == null) nome = session.getAttribute("name");
                if (nome == null) nome = session.getAttribute("username");
                if (nome != null) usuarioNome = nome.toString();
            } catch (Exception ignored) {}
            orcamento.put("_USUARIO", usuarioNome);

            List<Map<String, Object>> masgerList;
            if (empresaCodigo != null) {
                masgerList = jdbcTemplate.queryForList(
                    "SELECT * FROM masger WHERE NUMEMPR_GER = LPAD(?, 3, '0')", empresaCodigo);
            } else {
                masgerList = jdbcTemplate.queryForList("SELECT * FROM masger LIMIT 1");
            }
            if (!masgerList.isEmpty()) {
                Map<String, Object> masger = masgerList.get(0);
                orcamento.put("_EMPRESA_NOME", masger.get("NOME_GER") != null ? masger.get("NOME_GER").toString() : "SPDealer");
                orcamento.put("_EMPRESA_CNPJ", masger.get("CGC_GER") != null ? masger.get("CGC_GER").toString() : "");
            } else {
                orcamento.put("_EMPRESA_NOME", "SPDealer");
                orcamento.put("_EMPRESA_CNPJ", "");
            }

            String itensSql = "SELECT * FROM orcampp WHERE NUMERO_ORPP = ? ORDER BY REQUIS_ORPP";
            List<Map<String, Object>> itens = filtrarItensPerdidos(jdbcTemplate.queryForList(itensSql, numeroPadded));

            byte[] pdfBytes = impressaoService.gerarPdfOrcamentoPedido(orcamento, itens);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.builder("inline")
                .filename("Orcamento_" + numero + ".pdf")
                .build());

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            System.err.println("Erro ao gerar PDF: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao gerar PDF: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{numero}/enviar-whatsapp")
    public ResponseEntity<Map<String, Object>> enviarWhatsApp(
            @PathVariable Integer numero,
            @RequestBody Map<String, Object> data) {
        try {
            String numeroPadded = padNumero(numero);
            String telefone = data.get("telefone") != null ? data.get("telefone").toString() : "";
            String email = data.get("email") != null ? data.get("email").toString() : "";

            String sql = "SELECT * FROM orcamp WHERE NUMERO_ORP = ?";
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, numeroPadded);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Orçamento não encontrado"
                ));
            }

            Map<String, Object> orcamento = resultados.get(0);

            String itensSql = "SELECT * FROM orcampp WHERE NUMERO_ORPP = ?";
            List<Map<String, Object>> itensRaw = jdbcTemplate.queryForList(itensSql, numeroPadded);
            List<Map<String, Object>> itens = filtrarItensPerdidos(itensRaw);

            byte[] pdfBytes = impressaoService.gerarPdfOrcamentoPedido(orcamento, itens);

            Map<String, Object> result;
            String tipoOrp = orcamento.get("TIPO_ORP") != null ? orcamento.get("TIPO_ORP").toString() : "O";
            
            if ("O".equals(tipoOrp)) {
                result = envioDocumentoService.enviarOrcamentoWhatsApp(
                    telefone,
                    orcamento.get("NOME_ORP") != null ? orcamento.get("NOME_ORP").toString() : "",
                    numero,
                    pdfBytes
                );
            } else {
                result = envioDocumentoService.enviarPedidoWhatsApp(
                    telefone,
                    orcamento.get("NOME_ORP") != null ? orcamento.get("NOME_ORP").toString() : "",
                    numero,
                    pdfBytes
                );
            }

            if (Boolean.TRUE.equals(result.get("success")) && email != null && !email.isEmpty()) {
                if ("O".equals(tipoOrp)) {
                    envioDocumentoService.enviarOrcamentoEmail(
                        email,
                        orcamento.get("NOME_ORP") != null ? orcamento.get("NOME_ORP").toString() : "",
                        numero,
                        pdfBytes
                    );
                } else {
                    envioDocumentoService.enviarPedidoEmail(
                        email,
                        orcamento.get("NOME_ORP") != null ? orcamento.get("NOME_ORP").toString() : "",
                        numero,
                        pdfBytes
                    );
                }
                result.put("emailEnviado", true);
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao enviar documento: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{numero}/enviar-email")
    public ResponseEntity<Map<String, Object>> enviarEmail(
            @PathVariable Integer numero,
            @RequestBody Map<String, Object> data) {
        try {
            String numeroPadded = padNumero(numero);
            String email = data.get("email") != null ? data.get("email").toString() : "";

            String sql = "SELECT * FROM orcamp WHERE NUMERO_ORP = ?";
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sql, numeroPadded);

            if (resultados.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Orçamento não encontrado"
                ));
            }

            Map<String, Object> orcamento = resultados.get(0);

            String itensSql = "SELECT * FROM orcampp WHERE NUMERO_ORPP = ?";
            List<Map<String, Object>> itensRaw = jdbcTemplate.queryForList(itensSql, numeroPadded);
            List<Map<String, Object>> itens = filtrarItensPerdidos(itensRaw);

            byte[] pdfBytes = impressaoService.gerarPdfOrcamentoPedido(orcamento, itens);

            String tipoOrp = orcamento.get("TIPO_ORP") != null ? orcamento.get("TIPO_ORP").toString() : "";
            Map<String, Object> result;
            
            if ("O".equals(tipoOrp)) {
                result = envioDocumentoService.enviarOrcamentoEmail(
                    email,
                    orcamento.get("NOME_ORP") != null ? orcamento.get("NOME_ORP").toString() : "",
                    numero,
                    pdfBytes
                );
            } else {
                result = envioDocumentoService.enviarPedidoEmail(
                    email,
                    orcamento.get("NOME_ORP") != null ? orcamento.get("NOME_ORP").toString() : "",
                    numero,
                    pdfBytes
                );
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Erro ao enviar email: " + e.getMessage()
            ));
        }
    }

    private List<Map<String, Object>> filtrarItensPerdidos(List<Map<String, Object>> itens) {
        return itens.stream()
            .filter(item -> {
                Object qtperd = item.get("QTPERD_ORPP");
                return qtperd == null || new BigDecimal(qtperd.toString()).compareTo(BigDecimal.ZERO) == 0;
            })
            .toList();
    }

    private String padNumero(Integer numero) {
        if (numero == null) return null;
        return String.format("%08d", numero);
    }

    private String padFilial(Integer filial) {
        if (filial == null) return null;
        return String.format("%03d", filial);
    }

    private String padVendedor(String vendedor) {
        if (vendedor == null || vendedor.trim().isEmpty()) return null;
        try {
            int num = Integer.parseInt(vendedor.trim());
            return String.format("%010d", num);
        } catch (NumberFormatException e) {
            return vendedor.trim();
        }
    }

    private Integer getNextNumeroFromDb(Integer filial) {
        try {
            String sql = "SELECT COALESCE(MAX(CAST(NUMERO_ORP AS UNSIGNED)), 0) + 1 FROM orcamp WHERE FILIAL_ORP = ? FOR UPDATE";
            String filialPadded = padFilial(filial != null ? filial : 1);
            return jdbcTemplate.queryForObject(sql, Integer.class, filialPadded);
        } catch (Exception e) {
            return 1;
        }
    }

    private void inserirItem(Integer numeroInt, Integer filialInt, int seq, Map<String, Object> item) {
        inserirItem(numeroInt, filialInt, seq, item, null);
    }

    private void inserirItem(Integer numeroInt, Integer filialInt, int seq, Map<String, Object> item, String vendedor) {
        String numeroOrp = padNumero(numeroInt);
        String filial = padFilial(filialInt);

        // DTREQ_ORPP = current date in YYYYMMDD format
        LocalDate today = LocalDate.now();
        Integer dtreq = today.getYear() * 10000 + today.getMonthValue() * 100 + today.getDayOfMonth();

        // QTREC_ORPP = quantity from item (QTALOC_ORPP or QTREC_ORPP)
        BigDecimal qtrec = getBigDecimal(item, "QTREC_ORPP");
        if (qtrec == null) {
            qtrec = getBigDecimal(item, "QTALOC_ORPP");
        }
        if (qtrec == null) {
            qtrec = getBigDecimal(item, "DTREC_ORPP");
        }

        // QTDISP_ORPP = available stock from kardex (qtde_kar - qtaloc_kar)
        // PRECUSTO_ORPP = cost price from kardex (precusto_kar)
        BigDecimal qtdisp = null;
        BigDecimal precusto = null;
        String fab = getString(item, "FAB_ORPP");
        Object codigo = item.get("CODIGO_ORPP");
        if (codigo == null) codigo = item.get("CODIGO_ORP");
        if (fab != null && codigo != null) {
            try {
                String kardexSql = """
                    SELECT COALESCE(QTDE_KAR, 0) - COALESCE(QTALOC_KAR, 0) AS qtdisp,
                           COALESCE(PRECUSTO_KAR, 0) AS precusto
                    FROM kardex
                    WHERE FAB_KAR = ? AND CODPROD_KAR = ? AND DEP_KAR = 1
                    LIMIT 1
                    """;
                List<Map<String, Object>> kardexResult = jdbcTemplate.queryForList(kardexSql, fab, codigo.toString());
                if (!kardexResult.isEmpty()) {
                    Map<String, Object> row = kardexResult.get(0);
                    qtdisp = getBigDecimal(row, "qtdisp");
                    precusto = getBigDecimal(row, "precusto");
                }
            } catch (Exception e) {
                // kardex not found for this item
            }
        }

        String codigoMper = getString(item, "CODIGO_MPER");
        if (codigoMper != null && codigoMper.trim().isEmpty()) {
            codigoMper = null;
        }

            String sql = """
                INSERT INTO orcampp (
                    FILIAL_ORPP, NUMERO_ORPP, REQUIS_ORPP, FAB_ORPP, CODIGO_ORPP,
                    DESCR_ORPP, QTALOC_ORPP, QTREC_ORPP, QTSOL_ORPP, QTFALTA_ORPP,
                    PRECUSTO_ORPP, PRECOPUB_ORPP, PRECOTOT_ORPP,
                    VALORIPI_ORPP, VLRDESC_ORPP, ICMSST_ORPP, PRECOLIQ_ORPP,
                    ITEMCLI_ORPP, DTREQ_ORPP, QTDISP_ORPP, QTPERD_ORPP,
                    VALORAVI_ORPP, CODIGO_MPER, VENDEDOR_ORPP,
                    PERC_NIVEL_ORPP, VLR_NIVEL_ORPP
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        
        // Helper to get value from either _ORPP or _ORP suffix
        java.util.function.BiFunction<String, String, Object> getField = (key, fallback) -> 
            item.get(key) != null ? item.get(key) : item.get(fallback);

        jdbcTemplate.update(sql,
            filial,
            numeroOrp,
            String.format("%08d", seq),
            getString(item, "FAB_ORPP"),
            getField.apply("CODIGO_ORPP", "CODIGO_ORP"),
            getField.apply("DESCR_ORPP", "DESCR_ORP"),
            getField.apply("QTALOC_ORPP", "QTDE_ORP"),
            qtrec,
            getField.apply("QTSOL_ORPP", "QTSOL_ORP"),
            getField.apply("QTFALTA_ORPP", "QTFALTA_ORP"),
            precusto,
            getField.apply("PRECOPUB_ORPP", "PRECO_ORP"),
            getField.apply("PRECOTOT_ORPP", "VLRTOTAL_ORP"),
            getField.apply("VALORIPI_ORPP", "VLRIPI_ORP"),
            getField.apply("VLRDESC_ORPP", "VLRDESC_ORP"),
            getField.apply("ICMSST_ORPP", "VLRST_ORPP"),
            getField.apply("PRECOLIQ_ORPP", "PRECO_ORP"),
            getField.apply("ITEMCLI_ORPP", "ITEM_CLI_ORPP"),
            dtreq,
            qtdisp,
            getBigDecimal(item, "QTPERD_ORPP"),
            getField.apply("VALORAVI_ORPP", "VALORAVI_ORP"),
            codigoMper,
            vendedor,
            getBigDecimal(item, "PERC_NIVEL_ORPP"),
            getBigDecimal(item, "VLR_NIVEL_ORPP")
        );

        String tipoOrp = getString(item, "TIPO_ORP");
        if (tipoOrp == null) tipoOrp = "O";

        if (fab != null && codigo != null) {
            BigDecimal qtSol = getBigDecimal(item, "QTSOL_ORPP");
            if (qtSol == null) qtSol = getBigDecimal(item, "QTSOL_ORP");
            BigDecimal qtAloc = getBigDecimal(item, "QTALOC_ORPP");
            if (qtAloc == null) qtAloc = getBigDecimal(item, "QTALOC_ORP");
            BigDecimal qtFalta = getBigDecimal(item, "QTFALTA_ORPP");
            if (qtFalta == null) qtFalta = getBigDecimal(item, "QTFALTA_ORP");
            String motivo = getString(item, "MOTIVO_ORPP");
            String novoOrpp = getString(item, "NOVO_ORPP");
            Integer pedpen = getInt(item, "PEDPEN_ORP");

            orcamentoService.processarPecfal(
                numeroOrp, seq, fab, codigo.toString(), tipoOrp,
                qtSol, qtAloc, qtFalta, motivo, novoOrpp, pedpen
            );
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Integer getInt(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping("/{numero}/parcelas")
    public ResponseEntity<Map<String, Object>> calcularParcelas(
            @PathVariable Integer numero,
            HttpSession session) {
        try {
            String numeroPadded = padNumero(numero);

            String orcSql = "SELECT * FROM orcamp WHERE NUMERO_ORP = ?";
            List<Map<String, Object>> orcList = jdbcTemplate.queryForList(orcSql, numeroPadded);
            if (orcList.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("success", false, "error", "Orçamento não encontrado"));
            }
            Map<String, Object> orc = new HashMap<>();
            orcList.get(0).forEach((k, v) -> orc.put(k.toUpperCase(), v));

            String tipoOrp = getString(orc, "TIPO_ORP");
            if (tipoOrp == null) tipoOrp = "O";

            BigDecimal totger = getBigDecimal(orc, "VLR_TOTAL_ORP");
            if (totger == null) totger = BigDecimal.ZERO;

            String condpag = getString(orc, "CONDPAG_ORP");
            if (condpag != null && condpag.length() > 2) {
                condpag = condpag.substring(condpag.length() - 2);
            }

            String cgccpf = getString(orc, "CGCCPF_CLI");

            String dtemiStr = getString(orc, "DTEMI_ORP");
            LocalDate dtemi = LocalDate.now();
            if (dtemiStr != null) {
                try {
                    dtemi = LocalDate.parse(dtemiStr.length() > 10 ? dtemiStr.substring(0, 10) : dtemiStr);
                } catch (Exception ignored) {}
            }

            List<Map<String, Object>> parcelas = new ArrayList<>();

            if ("C".equals(tipoOrp)) {
                String receberSql = """
                    SELECT parcela_rec, dtvenci_rec, vlrdup_rec, numbco_rec, nomecob_rec
                    FROM receber
                    WHERE CAST(cgccpf_rec AS CHAR) = ? AND status_rec IS NULL
                    ORDER BY parcela_rec
                    """;
                List<Map<String, Object>> receberList = jdbcTemplate.queryForList(receberSql, cgccpf);
                for (Map<String, Object> row : receberList) {
                    Map<String, Object> p = new HashMap<>();
                    p.put("PARCELA", row.get("PARCELA_REC"));
                    p.put("DATA_VCTO", row.get("DTVENCI_REC") != null ? row.get("DTVENCI_REC").toString() : "");
                    p.put("VALOR", row.get("VLRDUP_REC"));
                    p.put("BANCO", row.get("NUMBCO_REC") != null ? row.get("NUMBCO_REC").toString() : "");
                    p.put("DBANCO", row.get("NUMBCO_REC") != null ? row.get("NUMBCO_REC").toString() : "");
                    p.put("COBRANCA", row.get("NOMECOB_REC") != null ? row.get("NOMECOB_REC").toString() : "");
                    p.put("DCOBRANCA", row.get("NOMECOB_REC") != null ? row.get("NOMECOB_REC").toString() : "");
                    parcelas.add(p);
                }
            }

            if (parcelas.isEmpty()) {
                String maspagSql = "SELECT * FROM maspag WHERE codigo_paga = ? AND filial_paga = '001'";
                List<Map<String, Object>> maspagList = jdbcTemplate.queryForList(maspagSql, condpag != null ? condpag : "01");

                if (maspagList.isEmpty()) {
                    Map<String, Object> p = new HashMap<>();
                    p.put("PARCELA", 1);
                    p.put("DATA_VCTO", dtemi.plusDays(30).toString());
                    p.put("VALOR", totger);
                    p.put("BANCO", "");
                    p.put("COBRANCA", "");
                    parcelas.add(p);
                } else {
                    Map<String, Object> maspag = maspagList.get(0);
                    String cobCod = getMaspagString(maspag, "CODIGO_COB_PAGA");
                    String cobDescr = getMaspagString(maspag, "TPCOB_PAGA");
                    String cobrancaPadrao = cobDescr != null ? cobDescr : (cobCod != null ? cobCod : "");
                    Integer numpar = getInt(maspag, "NUMPAR_PAGA");
                    if (numpar == null || numpar <= 0) numpar = 1;

                    BigDecimal remaining = totger;

                    for (int i = 1; i <= numpar; i++) {
                        Integer dia = getMaspagInt(maspag, "DIA" + i + "_PAGA");
                        if (dia == null) dia = 30;

                        BigDecimal perc = getMaspagBigDecimal(maspag, "PERC" + i + "_PAGA");

                        BigDecimal valor;
                        if (perc != null && perc.compareTo(BigDecimal.ZERO) > 0) {
                            valor = totger.multiply(perc).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                        } else {
                            int remainingParcels = numpar - i + 1;
                            valor = remaining.divide(new BigDecimal(remainingParcels), 2, RoundingMode.HALF_UP);
                        }

                        remaining = remaining.subtract(valor);
                        if (i == numpar && remaining.compareTo(BigDecimal.ZERO) != 0) {
                            valor = valor.add(remaining);
                            remaining = BigDecimal.ZERO;
                        }

                        LocalDate dtVcto = dtemi.plusDays(dia);

                        Map<String, Object> p = new HashMap<>();
                        p.put("PARCELA", i);
                        p.put("DATA_VCTO", dtVcto.toString());
                        p.put("VALOR", valor);
                        p.put("BANCO", "");
                        p.put("COBRANCA", cobrancaPadrao);
                        parcelas.add(p);
                    }
                }
            }

            persistirFinTemp(numero, parcelas, session);

            return ResponseEntity.ok(Map.of("success", true, "data", parcelas));

        } catch (Exception e) {
            System.err.println("Erro ao calcular parcelas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PutMapping("/{numero}/parcelas")
    @Transactional
    public ResponseEntity<Map<String, Object>> atualizarParcelas(
            @PathVariable Integer numero,
            @RequestBody List<Map<String, Object>> parcelas,
            HttpSession session) {
        try {
            Integer usuario = (Integer) session.getAttribute("user_id");
            if (usuario == null) usuario = 1;

            jdbcTemplate.update("DELETE FROM fin_temp WHERE numero = ?", numero);

            String insertSql = """
                INSERT INTO fin_temp (ps, tip, ep, numero, parcela, dtvenc, valor, banco, dbanco, cobranca, dcobranca, usuario)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

            for (Map<String, Object> p : parcelas) {
                String ep = "P";
                Object parcObj = p.get("PARCELA");
                String parcelaStr = String.format("%03d", Integer.parseInt(parcObj.toString()));

                BigDecimal valor = null;
                if (p.get("VALOR") != null) {
                    try { valor = new BigDecimal(p.get("VALOR").toString()); } catch (Exception ignored) {}
                }

                LocalDate dtvenc = null;
                if (p.get("DATA_VCTO") != null) {
                    try { dtvenc = LocalDate.parse(p.get("DATA_VCTO").toString().substring(0, 10)); } catch (Exception ignored) {}
                }

                String bancoCod = stripStr(objToStr(p, "BANCO"), 3);
                String bancoDescr = objToStr(p, "DBANCO");
                if (bancoDescr == null) bancoDescr = bancoCod;

                String cobCod = stripStr(objToStr(p, "COBRANCA"), 3);
                String cobDescr = objToStr(p, "DCOBRANCA");
                if (cobDescr == null) cobDescr = cobCod;

                jdbcTemplate.update(insertSql,
                    "P", "PE", ep, numero, parcelaStr, dtvenc, valor,
                    bancoCod, bancoDescr, cobCod, cobDescr, usuario);
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Parcelas atualizadas"));

        } catch (Exception e) {
            System.err.println("Erro ao atualizar parcelas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/{numero}/parcelas")
    public ResponseEntity<Map<String, Object>> limparParcelas(@PathVariable Integer numero) {
        try {
            jdbcTemplate.update("DELETE FROM fin_temp WHERE numero = ?", numero);
            return ResponseEntity.ok(Map.of("success", true, "message", "Parcelas removidas"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    private void persistirFinTemp(Integer numero, List<Map<String, Object>> parcelas, HttpSession session) {
        try {
            Object userObj = session.getAttribute("user_id");
            Integer usuario = userObj instanceof Integer ? (Integer) userObj : 1;

            String deleteSql = "DELETE FROM fin_temp WHERE numero = ?";
            jdbcTemplate.update(deleteSql, numero);

            String insertSql = """
                INSERT INTO fin_temp (ps, tip, ep, numero, parcela, dtvenc, valor, banco, dbanco, cobranca, dcobranca, usuario)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

            for (Map<String, Object> p : parcelas) {
                String ep = "P";
                Object parcObj = p.get("PARCELA");
                String parcelaStr = String.format("%03d", Integer.parseInt(parcObj.toString()));

                BigDecimal valor = null;
                if (p.get("VALOR") != null) {
                    try { valor = new BigDecimal(p.get("VALOR").toString()); } catch (Exception ignored) {}
                }

                LocalDate dtvenc = null;
                if (p.get("DATA_VCTO") != null) {
                    try { dtvenc = LocalDate.parse(p.get("DATA_VCTO").toString().substring(0, 10)); } catch (Exception ignored) {}
                }

                String bancoCod = stripStr(objToStr(p, "BANCO"), 3);
                String bancoDescr = objToStr(p, "DBANCO");
                if (bancoDescr == null) bancoDescr = bancoCod;

                String cobCod = stripStr(objToStr(p, "COBRANCA"), 3);
                String cobDescr = objToStr(p, "DCOBRANCA");
                if (cobDescr == null) cobDescr = cobCod;

                jdbcTemplate.update(insertSql,
                    "P", "PE", ep, numero, parcelaStr, dtvenc, valor,
                    bancoCod, bancoDescr, cobCod, cobDescr, usuario);
            }
        } catch (Exception e) {
            System.err.println("Erro ao persistir fin_temp: " + e.getMessage());
        }
    }

    private String stripStr(String s, int maxLen) {
        if (s == null) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }

    private String objToStr(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }

    private String getMaspagString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        return value.toString();
    }

    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        try {
            return new BigDecimal(value.toString().replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer getMaspagInt(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        try { return Integer.parseInt(value.toString()); } catch (Exception e) { return null; }
    }

    private BigDecimal getMaspagBigDecimal(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return null;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        try { return new BigDecimal(value.toString().replace(",", ".")); } catch (Exception e) { return null; }
    }
}
