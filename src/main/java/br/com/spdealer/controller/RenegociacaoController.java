package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import br.com.spdealer.util.DataDuplicadaUtil;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/renegociacao")
public class RenegociacaoController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private static final DateTimeFormatter DATA_SQL = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @PostMapping("/salvar")
    public ResponseEntity<Map<String, Object>> salvar(@RequestBody Map<String, Object> dados) {
        try {
            String tipo = (String) dados.get("tipo");
            if (tipo == null || (!"receber".equals(tipo) && !"pagar".equals(tipo))) {
                return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Tipo invalido: " + tipo));
            }

            Integer codigo = Integer.valueOf(dados.get("codigo").toString());
            String motivo = (String) dados.getOrDefault("motivo", "");
            if (motivo.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Motivo nao pode estar vazio"));
            }

            final boolean isPagar = "pagar".equals(tipo);
            final String suffix = isPagar ? "_pag" : "_rec";
            final String tabela = isPagar ? "pagar" : "receber";
            final String idField = isPagar ? "pagar_id" : "receber_id";
            final String codRenegociacao = isPagar ? "87" : "05";

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parcelasList = (List<Map<String, Object>>) dados.get("parcelas");
            if (parcelasList == null || parcelasList.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Nenhuma parcela informada"));
            }

            final String hoje = LocalDate.now().format(DATA_SQL);
            final Map<String, Object> dadosImutaveis = dados;

            Map<String, Object> transacaoResult = transactionTemplate.execute(status -> {
                String sqlBusca = "SELECT * FROM " + tabela + " WHERE " + idField + " = ?";
                List<Map<String, Object>> originalList = jdbcTemplate.queryForList(sqlBusca, codigo);
                if (originalList.isEmpty()) {
                    throw new RuntimeException("Documento nao encontrado");
                }
                Map<String, Object> original = originalList.get(0);

                double vlrsalAtual = original.get("vlrsal" + suffix) != null ? ((Number) original.get("vlrsal" + suffix)).doubleValue() : 0;
                double vlrpagAtual = original.get("vlrpag" + suffix) != null ? ((Number) original.get("vlrpag" + suffix)).doubleValue() : 0;

                double desconto = 0;
                Object descontoObj = dadosImutaveis.get("desconto");
                if (descontoObj instanceof Number) {
                    desconto = ((Number) descontoObj).doubleValue();
                } else if (descontoObj instanceof String) {
                    desconto = Double.parseDouble((String) descontoObj);
                }

                Map<String, Object> updateDados = new HashMap<>();
                updateDados.put("vlrpag" + suffix, vlrsalAtual + vlrpagAtual);
                if (desconto > 0) {
                    updateDados.put("vlrdesc" + suffix, desconto);
                }
                updateDados.put("vlrsal" + suffix, 0);
                updateDados.put("dtvenci" + suffix, hoje);
                updateDados.put("dtpagi" + suffix, hoje);
                updateDados.put("tipodoc" + suffix, codRenegociacao);
                updateDados.put("obs" + suffix, motivo);

                Object[] sqlUpdate = DataDuplicadaUtil.gerarUpdateComDatasDuplicadas(
                    tabela, updateDados, idField + " = " + codigo, jdbcTemplate);
                int rowsUpdated = jdbcTemplate.update((String) sqlUpdate[0], (Object[]) sqlUpdate[1]);
                if (rowsUpdated <= 0) {
                    throw new RuntimeException("Erro ao atualizar documento original");
                }

                String tipodocOriginal = String.valueOf(dadosImutaveis.getOrDefault("tipodocOriginal", ""));
                Object codigoClienteObj = dadosImutaveis.get("codigoCliente");
                Integer codigoCliente = codigoClienteObj != null
                    ? Integer.valueOf(codigoClienteObj.toString())
                    : ((Number) original.getOrDefault("codigo" + suffix, 0)).intValue();

                Long proximoNumdup;
                try {
                    String sqlMax = "SELECT COALESCE(MAX(CAST(numdup" + suffix + " AS DECIMAL(20,0))), 0) + 1 FROM "
                        + tabela + " WHERE codigo" + suffix + " = ?";
                    proximoNumdup = jdbcTemplate.queryForObject(sqlMax, Long.class, codigoCliente);
                } catch (Exception e) {
                    proximoNumdup = (long) (System.currentTimeMillis() % 100000);
                }

                int ordem = 1;
                for (Map<String, Object> parcela : parcelasList) {
                    Map<String, Object> novo = new HashMap<>();

                    Object valorObj = parcela.get("valor");
                    double valorParcela = 0;
                    if (valorObj instanceof Number) {
                        valorParcela = ((Number) valorObj).doubleValue();
                    } else if (valorObj instanceof String) {
                        valorParcela = Double.parseDouble((String) valorObj);
                    }

                    String dataParcelaStr = (String) parcela.get("data");
                    String dataSQL = dataParcelaStr;
                    if (dataParcelaStr != null && dataParcelaStr.matches("\\d{2}/\\d{2}/\\d{4}")) {
                        dataSQL = LocalDate.parse(dataParcelaStr, DATA_BR).format(DATA_SQL);
                    }

                    String parcelaStr = String.format("%03d", ordem);

                    novo.put("codigo" + suffix, codigoCliente);
                    novo.put("numdup" + suffix, proximoNumdup);
                    novo.put("parcela" + suffix, parcelaStr);
                    novo.put("tipodoc" + suffix, tipodocOriginal);
                    novo.put("tpcob" + suffix, dadosImutaveis.getOrDefault("tpcob", ""));
                    novo.put("vlrdup" + suffix, valorParcela);
                    novo.put("vlrsal" + suffix, valorParcela);
                    novo.put("vlrpag" + suffix, 0);
                    novo.put("dtvenci" + suffix, dataSQL);
                    novo.put("dtemissi" + suffix, hoje);
                    novo.put("dtmovi" + suffix, hoje);
                    novo.put("filial" + suffix, dadosImutaveis.getOrDefault("filial", "001"));
                    novo.put("status" + suffix, "A");

                    String[] copiarDoOriginal = {"cgccpf", "tipopessoa", "banco", "vend", "condic", "dpto"};
                    for (String campo : copiarDoOriginal) {
                        Object val = original.get(campo + suffix);
                        if (val != null) {
                            novo.put(campo + suffix, val);
                        }
                    }

                    Object[] sqlInsert = DataDuplicadaUtil.gerarInsertComDatasDuplicadas(tabela, novo, jdbcTemplate);
                    int rows = jdbcTemplate.update((String) sqlInsert[0], (Object[]) sqlInsert[1]);
                    if (rows <= 0) {
                        throw new RuntimeException("Erro ao criar parcela " + ordem);
                    }

                    ordem++;
                    proximoNumdup++;
                }

                Map<String, Object> res = new HashMap<>();
                res.put("sucesso", true);
                res.put("mensagem", "Renegociacao salva com sucesso. " + parcelasList.size() + " parcela(s) criada(s).");
                return res;
            });

            return ResponseEntity.ok(transacaoResult);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("sucesso", false, "mensagem", e.getMessage()));
        }
    }

    @GetMapping("/verificar-numdup")
    public ResponseEntity<Map<String, Object>> verificarNumdup(
            @RequestParam("codigoCliente") Integer codigoCliente,
            @RequestParam("numdup") String numdup,
            @RequestParam(value = "tipo", defaultValue = "receber") String tipo) {
        try {
            String suffix = "pagar".equals(tipo) ? "_pag" : "_rec";
            String tabela = "pagar".equals(tipo) ? "pagar" : "receber";
            String sql = "SELECT COUNT(*) FROM " + tabela + " WHERE codigo" + suffix + " = ? AND numdup" + suffix + " = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigoCliente, numdup);
            return ResponseEntity.ok(Map.of("existe", count > 0));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("existe", false, "erro", e.getMessage()));
        }
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/salvar-lote")
    public ResponseEntity<Map<String, Object>> salvarLote(@RequestBody Map<String, Object> dados) {
        try {
            String tipo = (String) dados.get("tipo");
            if (tipo == null || (!"receber".equals(tipo) && !"pagar".equals(tipo))) {
                return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Tipo invalido: " + tipo));
            }

            List<?> codigosRaw = (List<?>) dados.get("codigos");
            if (codigosRaw == null || codigosRaw.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Nenhum documento informado"));
            }
            List<Integer> codigos = new ArrayList<>();
            for (Object c : codigosRaw) {
                codigos.add(Integer.valueOf(c.toString()));
            }

            String motivo = (String) dados.getOrDefault("motivo", "");
            if (motivo.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Motivo nao pode estar vazio"));
            }

            List<Map<String, Object>> parcelasList = (List<Map<String, Object>>) dados.get("parcelas");
            if (parcelasList == null || parcelasList.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", "Nenhuma parcela informada"));
            }

            final boolean isPagar = "pagar".equals(tipo);
            final String suffix = isPagar ? "_pag" : "_rec";
            final String tabela = isPagar ? "pagar" : "receber";
            final String idField = isPagar ? "pagar_id" : "receber_id";
            final String codRenegociacao = isPagar ? "87" : "05";
            final String hoje = LocalDate.now().format(DATA_SQL);

            Object codigoClienteObj = dados.get("codigoCliente");
            Integer codigoCliente = codigoClienteObj != null ? Integer.valueOf(codigoClienteObj.toString()) : 0;

            Map<String, Object> transacaoResult = transactionTemplate.execute(status -> {
                // 1. Obter desconto total (se presente)
                double descontoTotal = 0;
                Object descontoObj = dados.get("desconto");
                if (descontoObj instanceof Number) {
                    descontoTotal = ((Number) descontoObj).doubleValue();
                } else if (descontoObj instanceof String) {
                    descontoTotal = Double.parseDouble((String) descontoObj);
                }

                // 1.5 Calcular proporção por documento para ratear o desconto
                // Primeira passada: carregar todos os originais e somar vlrsal
                List<Map<String, Object>> originais = new ArrayList<>();
                double totalVlrsalDocs = 0;
                for (Integer codigo : codigos) {
                    String sqlBusca = "SELECT * FROM " + tabela + " WHERE " + idField + " = ?";
                    List<Map<String, Object>> originalList = jdbcTemplate.queryForList(sqlBusca, codigo);
                    if (originalList.isEmpty()) {
                        throw new RuntimeException("Documento " + codigo + " nao encontrado");
                    }
                    Map<String, Object> original = originalList.get(0);
                    originais.add(original);

                    double vlrsal = original.get("vlrsal" + suffix) != null
                        ? ((Number) original.get("vlrsal" + suffix)).doubleValue() : 0;
                    totalVlrsalDocs += vlrsal;
                }

                // 1.6 Zerar todos os documentos originais (com desconto rateado)
                for (int i = 0; i < codigos.size(); i++) {
                    Integer codigo = codigos.get(i);
                    Map<String, Object> original = originais.get(i);

                    double vlrsalAtual = original.get("vlrsal" + suffix) != null
                        ? ((Number) original.get("vlrsal" + suffix)).doubleValue() : 0;
                    double vlrpagAtual = original.get("vlrpag" + suffix) != null
                        ? ((Number) original.get("vlrpag" + suffix)).doubleValue() : 0;

                    double descontoDoc = 0;
                    if (descontoTotal > 0 && totalVlrsalDocs > 0) {
                        descontoDoc = Math.round((vlrsalAtual / totalVlrsalDocs) * descontoTotal * 100.0) / 100.0;
                    }

                    Map<String, Object> updateDados = new HashMap<>();
                    updateDados.put("vlrpag" + suffix, vlrsalAtual + vlrpagAtual);
                    updateDados.put("vlrsal" + suffix, 0);
                    if (descontoDoc > 0) {
                        updateDados.put("vlrdesc" + suffix, descontoDoc);
                    }
                    updateDados.put("dtvenci" + suffix, hoje);
                    updateDados.put("dtpagi" + suffix, hoje);
                    updateDados.put("tipodoc" + suffix, codRenegociacao);
                    updateDados.put("obs" + suffix, motivo);

                    Object[] sqlUpdate = DataDuplicadaUtil.gerarUpdateComDatasDuplicadas(
                        tabela, updateDados, idField + " = " + codigo, jdbcTemplate);
                    int rowsUpdated = jdbcTemplate.update((String) sqlUpdate[0], (Object[]) sqlUpdate[1]);
                    if (rowsUpdated <= 0) {
                        throw new RuntimeException("Erro ao atualizar documento original " + codigo);
                    }
                }

                // 2. Definir numdup (custom ou auto)
                Object numdupObj = dados.get("numdup");
                Long proximoNumdup;
                if (numdupObj != null) {
                    String numdupStr = numdupObj.toString().trim();
                    if (!numdupStr.isEmpty()) {
                        Long customNumdup = Long.parseLong(numdupStr);
                        // Verificar se o numdup já existe (excluindo os docs que estão sendo zerados)
                        String sqlCheck = "SELECT COUNT(*) FROM " + tabela
                            + " WHERE codigo" + suffix + " = ? AND numdup" + suffix + " = ?"
                            + " AND " + idField + " NOT IN (" + String.join(",", codigos.stream().map(String::valueOf).toArray(String[]::new)) + ")";
                        Integer count = jdbcTemplate.queryForObject(sqlCheck, Integer.class, codigoCliente, numdupStr);
                        if (count > 0) {
                            throw new RuntimeException("Número " + numdupStr + " já existe para este cliente. Escolha outro número.");
                        }
                        proximoNumdup = customNumdup;
                    } else {
                        proximoNumdup = gerarProximoNumdup(tabela, suffix, codigoCliente);
                    }
                } else {
                    proximoNumdup = gerarProximoNumdup(tabela, suffix, codigoCliente);
                }

                // 3. Pegar dados do primeiro original para campos copiados
                String sqlBusca = "SELECT * FROM " + tabela + " WHERE " + idField + " = ?";
                Map<String, Object> original = jdbcTemplate.queryForList(sqlBusca, codigos.get(0)).get(0);
                String tipodocOriginal = String.valueOf(dados.getOrDefault("tipodocOriginal", ""));

                // 4. Criar as parcelas consolidadas
                int ordem = 1;
                for (Map<String, Object> parcela : parcelasList) {
                    Map<String, Object> novo = new HashMap<>();

                    Object valorObj = parcela.get("valor");
                    double valorParcela = 0;
                    if (valorObj instanceof Number) {
                        valorParcela = ((Number) valorObj).doubleValue();
                    } else if (valorObj instanceof String) {
                        valorParcela = Double.parseDouble((String) valorObj);
                    }

                    String dataParcelaStr = (String) parcela.get("data");
                    String dataSQL = dataParcelaStr;
                    if (dataParcelaStr != null && dataParcelaStr.matches("\\d{2}/\\d{2}/\\d{4}")) {
                        dataSQL = LocalDate.parse(dataParcelaStr, DATA_BR).format(DATA_SQL);
                    }

                    String parcelaStr = String.format("%03d", ordem);

                    novo.put("codigo" + suffix, codigoCliente);
                    novo.put("numdup" + suffix, proximoNumdup);
                    novo.put("parcela" + suffix, parcelaStr);
                    novo.put("tipodoc" + suffix, tipodocOriginal);
                    novo.put("tpcob" + suffix, dados.getOrDefault("tpcob", ""));
                    novo.put("vlrdup" + suffix, valorParcela);
                    novo.put("vlrsal" + suffix, valorParcela);
                    novo.put("vlrpag" + suffix, 0);
                    novo.put("dtvenci" + suffix, dataSQL);
                    novo.put("dtemissi" + suffix, hoje);
                    novo.put("dtmovi" + suffix, hoje);
                    novo.put("filial" + suffix, dados.getOrDefault("filial", "001"));
                    novo.put("status" + suffix, "A");

                    String[] copiarDoOriginal = {"cgccpf", "tipopessoa", "banco", "vend", "condic", "dpto"};
                    for (String campo : copiarDoOriginal) {
                        Object val = original.get(campo + suffix);
                        if (val != null) {
                            novo.put(campo + suffix, val);
                        }
                    }

                    Object[] sqlInsert = DataDuplicadaUtil.gerarInsertComDatasDuplicadas(tabela, novo, jdbcTemplate);
                    int rows = jdbcTemplate.update((String) sqlInsert[0], (Object[]) sqlInsert[1]);
                    if (rows <= 0) {
                        throw new RuntimeException("Erro ao criar parcela " + ordem);
                    }

                    ordem++;
                }

                Map<String, Object> res = new HashMap<>();
                res.put("sucesso", true);
                res.put("mensagem", "Renegociacao em lote salva com sucesso. "
                    + codigos.size() + " documento(s) consolidado(s) em " + parcelasList.size() + " parcela(s).");
                return res;
            });

            return ResponseEntity.ok(transacaoResult);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("sucesso", false, "mensagem", e.getMessage()));
        }
    }

    private Long gerarProximoNumdup(String tabela, String suffix, Integer codigoCliente) {
        try {
            String sqlMax = "SELECT COALESCE(MAX(CAST(numdup" + suffix + " AS DECIMAL(20,0))), 0) + 1 FROM "
                + tabela + " WHERE codigo" + suffix + " = ?";
            return jdbcTemplate.queryForObject(sqlMax, Long.class, codigoCliente);
        } catch (Exception e) {
            return (long) (System.currentTimeMillis() % 100000);
        }
    }
}
