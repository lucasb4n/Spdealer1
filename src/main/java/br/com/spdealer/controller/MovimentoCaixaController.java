package br.com.spdealer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import br.com.spdealer.util.DataDuplicadaUtil;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/movimento-caixa")
public class MovimentoCaixaController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Processa movimento de caixa completo (transacional)
     */
    @PostMapping("/processar")
    @Transactional
    public ResponseEntity<Map<String, Object>> processarMovimento(@RequestBody Map<String, Object> dados) {
        try {
            // Dados principais do movimento
            String bancoSelecionado = (String) dados.get("banco_codigo");
            String nomeBanco = (String) dados.get("banco_nome");
            String dataMovimento = (String) dados.get("data_movimento"); // DD/MM/AAAA
            String operacaoCodigo = (String) dados.get("operacao_codigo");
            String debitoCredito = (String) dados.get("debito_credito");
            String departamentoCodigo = (String) dados.get("departamento_codigo");
            String historico = (String) dados.get("historico");
            Double valorTotal = ((Number) dados.get("valor_total")).doubleValue();
            String tipoDocumento = (String) dados.get("tipo_documento"); // 'R' ou 'P'
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> documentosSelecionados = 
                (List<Map<String, Object>>) dados.get("documentos_selecionados");

            // Validação: soma dos documentos deve bater com valor informado
            double somaDocumentos = documentosSelecionados.stream()
                .mapToDouble(doc -> ((Number) doc.get("valor_selecionado")).doubleValue())
                .sum();

            if (Math.abs(somaDocumentos - valorTotal) > 0.01) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("erro", "Soma dos documentos não confere com valor informado");
                errorResponse.put("valor_informado", valorTotal);
                errorResponse.put("soma_documentos", somaDocumentos);
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Buscar próxima sequência usando o utilitário
            String dataSQL = DataDuplicadaUtil.converterParaFormatoSQL(dataMovimento);
            Integer proximaSequencia = buscarProximaSequencia(dataSQL);

            // 1. Inserir movimento na tabela caixa usando função genérica
            Map<String, Object> dadosCaixa = new HashMap<>();
            dadosCaixa.put("filial_cai", "001");
            dadosCaixa.put("banco_cai", "001");
            dadosCaixa.put("dtmovi_cai", dataMovimento); // Função genérica vai duplicar automaticamente
            dadosCaixa.put("seq_cai", proximaSequencia);
            dadosCaixa.put("cliente_cai", bancoSelecionado);
            dadosCaixa.put("nome_cai", nomeBanco);
            dadosCaixa.put("dpto_cai", departamentoCodigo);
            dadosCaixa.put("oper_cai", operacaoCodigo);
            dadosCaixa.put("histor_cai", historico);
            dadosCaixa.put("dc_cai", debitoCredito);
            dadosCaixa.put("valor_cai", valorTotal);
            dadosCaixa.put("usuario_cai", "ADMIN");

            // Gera e executa INSERT automaticamente
            Object[] sqlCaixa = DataDuplicadaUtil.gerarInsertComDatasDuplicadas("caixa", dadosCaixa, jdbcTemplate);
            jdbcTemplate.update((String) sqlCaixa[0], (Object[]) sqlCaixa[1]);

            // 2. Atualizar documentos selecionados usando função genérica
            for (Map<String, Object> doc : documentosSelecionados) {
                Integer documentoId = ((Number) doc.get("id")).intValue();
                Double valorSelecionado = ((Number) doc.get("valor_selecionado")).doubleValue();
                Double acrescimo = ((Number) doc.get("acrescimo")).doubleValue();
                Double desconto = ((Number) doc.get("desconto")).doubleValue();

                // Dados para atualização
                Map<String, Object> dadosUpdate = new HashMap<>();
                dadosUpdate.put("vlrpag_" + (tipoDocumento.equals("R") ? "rec" : "pag"), 
                    "vlrpag_" + (tipoDocumento.equals("R") ? "rec" : "pag") + " + " + valorSelecionado);
                dadosUpdate.put("vlrsal_" + (tipoDocumento.equals("R") ? "rec" : "pag"), 
                    "vlrsal_" + (tipoDocumento.equals("R") ? "rec" : "pag") + " - " + valorSelecionado);
                dadosUpdate.put("vlracre_" + (tipoDocumento.equals("R") ? "rec" : "pag"), 
                    "vlracre_" + (tipoDocumento.equals("R") ? "rec" : "pag") + " + " + acrescimo);
                dadosUpdate.put("vlrdesc_" + (tipoDocumento.equals("R") ? "rec" : "pag"), 
                    "vlrdesc_" + (tipoDocumento.equals("R") ? "rec" : "pag") + " + " + desconto);
                dadosUpdate.put("dtpagi_" + (tipoDocumento.equals("R") ? "rec" : "pag"), dataMovimento);
                dadosUpdate.put("cxbco_" + (tipoDocumento.equals("R") ? "rec" : "pag"), bancoSelecionado);
                dadosUpdate.put("opercai_" + (tipoDocumento.equals("R") ? "rec" : "pag"), operacaoCodigo);
                dadosUpdate.put("seqcai_" + (tipoDocumento.equals("R") ? "rec" : "pag"), proximaSequencia);

                String tabela = tipoDocumento.equals("R") ? "receber" : "pagar";
                String campoId = tipoDocumento.equals("R") ? "receber_id" : "pagar_id";
                String suf = tipoDocumento.equals("R") ? "rec" : "pag";
                
                // Usar função genérica para gerar o UPDATE com datas duplicadas
                // Nota: Para campos calculados (soma/subtração), fazemos manualmente
                String sql = """
                    UPDATE %s SET 
                        vlrpag_%s = vlrpag_%s + ?,
                        vlrsal_%s = vlrsal_%s - ?,
                        vlracre_%s = vlracre_%s + ?,
                        vlrdesc_%s = vlrdesc_%s + ?,
                        dtpag_%s = ?,
                        dtpagi_%s = ?,
                        cxbco_%s = ?,
                        opercai_%s = ?,
                        seqcai_%s = ?
                    WHERE %s = ?
                    """.formatted(
                        tabela,
                        suf, suf,
                        suf, suf,
                        suf, suf,
                        suf, suf,
                        suf,
                        suf,
                        suf,
                        suf,
                        suf,
                        campoId
                    );
                
                    jdbcTemplate.update(sql,
                    valorSelecionado, // vlrpag
                    valorSelecionado, // vlrsal
                    acrescimo, // vlracre
                    desconto, // vlrdesc
                    DataDuplicadaUtil.converterParaFormatoLegado(dataMovimento), // dtpag (DDMMAAAA)
                    DataDuplicadaUtil.converterParaFormatoSQL(dataMovimento), // dtpagi (YYYY-MM-DD)
                    bancoSelecionado, // cxbco
                    operacaoCodigo, // opercai
                    proximaSequencia, // seqcai
                    documentoId // WHERE
                );
            }

            // 3. Atualizar CAIXACAB (saldo consolidado)
            double debito = "D".equals(debitoCredito) ? valorTotal : 0.0;
            double credito = "C".equals(debitoCredito) ? valorTotal : 0.0;
            String tipocai = "001";
            
            // 3a. Inserir/atualizar o dia corrente
            String sqlCaixacab = """
                INSERT INTO caixacab (filial_cai, tipocai_cai, codbanco_cai, dtmovi_cai, debito_cai, credito_cai, ultseq_cai)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    debito_cai = debito_cai + VALUES(debito_cai),
                    credito_cai = credito_cai + VALUES(credito_cai),
                    ultseq_cai = VALUES(ultseq_cai)
                """;
            
            jdbcTemplate.update(sqlCaixacab,
                "001",           // filial_cai
                tipocai,         // tipocai_cai
                bancoSelecionado, // codbanco_cai
                dataSQL,         // dtmovi_cai
                debito,          // debito_cai
                credito,         // credito_cai
                String.format("%04d", proximaSequencia) // ultseq_cai
            );
            
            // 3b. Propagar saldo para todas as datas >= data do movimento
            double valorComSinal = "D".equals(debitoCredito) ? -valorTotal : valorTotal;
            String sqlPropagaSaldo = "UPDATE caixacab SET saldo_cai = COALESCE(saldo_cai,0) + ? WHERE dtmovi_cai >= ? AND codbanco_cai = ? AND filial_cai = ?";
            jdbcTemplate.update(sqlPropagaSaldo, valorComSinal, dataSQL, bancoSelecionado, "001");

            Map<String, Object> response = new HashMap<>();
            response.put("sucesso", true);
            response.put("mensagem", "Movimento processado com sucesso");
            response.put("sequencia", proximaSequencia);
            response.put("documentos_atualizados", documentosSelecionados.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Erro ao processar movimento: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("erro", "Erro interno ao processar movimento");
            errorResponse.put("mensagem", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    private Integer buscarProximaSequencia(String dataMovimentoSQL) {
        try {
            String sql = """
                SELECT COALESCE(MAX(seq_cai), 0) + 1 
                FROM caixa 
                WHERE filial_cai = '001' AND tipocai_cai = '001' AND dtmovi_cai = ?
                """;
            return jdbcTemplate.queryForObject(sql, Integer.class, dataMovimentoSQL);
        } catch (Exception e) {
            return 1; // Primeira sequência do dia
        }
    }
}
