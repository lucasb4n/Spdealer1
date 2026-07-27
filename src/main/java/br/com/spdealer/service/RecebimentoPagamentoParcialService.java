package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Serviço para registrar recebimentos e pagamentos PARCIAIS
 * 
 * Fluxo:
 * 1. Inserir movimento em recebidos/pagos (histórico)
 * 2. NÃO marcar como pago (dtpagi_rec/dtpagi_pag permanece NULL)
 * 3. Atualizar saldo pendente (vlrsal_rec/vlrsal_pag)
 * 
 * Tabelas envolvidas:
 * - recebidos: histórico de recebimentos parciais
 * - pagos: histórico de pagamentos parciais
 * - receber: documento original (permanece aberto)
 * - pagar: documento original (permanece aberto)
 */
@Service
public class RecebimentoPagamentoParcialService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Registra um RECEBIMENTO PARCIAL de um documento
     * 
     * @param receberID ID do documento original
     * @param codigoCliente Código do cliente
     * @param valorRecebido Valor recebido NESTA PARCELA
     * @param desconto Desconto aplicado
     * @param acrescimo Acréscimo (juros, multa, etc.)
     * @param dataRecebimento Data do recebimento
     * @param cxbcoRec Código do banco/caixa
     * @param operacao Operação de caixa
     * @param seqCaixa Sequência do caixa
     * @param observacao Observação/histórico
     * @param usuarioId Usuário que registrou
     * @return Map com resultado (sucesso, mensagem, vlrSaldoRestante)
     */
    @Transactional
    public Map<String, Object> registrarRecebimentoParcial(
            Integer receberID,
            Integer codigoCliente,
            BigDecimal valorRecebido,
            BigDecimal desconto,
            BigDecimal acrescimo,
            LocalDate dataRecebimento,
            String cxbcoRec,
            String operacao,
            Integer seqCaixa,
            String observacao,
            Integer usuarioId) {
        
        Map<String, Object> resultado = new HashMap<>();
        
        try {
            System.out.println("[RecebimentoParcialService] Iniciando registro de recebimento parcial...");
            System.out.println("  receberID=" + receberID + ", valor=" + valorRecebido + ", desconto=" + desconto);
            
            // 1️⃣ Buscar saldo atual do documento
            String sqlSaldo = "SELECT vlrsal_rec, vlrdup_rec, dtvenci_rec, numdup_rec, parcela_rec AS parc_rec, dtmovi_rec " +
                            "FROM receber WHERE receber_id = ?";
            Map<String, Object> docAtual = jdbcTemplate.queryForMap(sqlSaldo, receberID);
            
            BigDecimal vlrSaldoAtual = (BigDecimal) docAtual.get("vlrsal_rec");
            String numdup = (String) docAtual.getOrDefault("numdup_rec", "");
            String parc = (String) docAtual.getOrDefault("parc_rec", "");
            
            System.out.println("[RecebimentoParcialService] Saldo atual: " + vlrSaldoAtual + ", Valor recebido: " + valorRecebido);
            
            // 2️⃣ Calcular novo saldo
            BigDecimal valorDesconto = desconto != null ? desconto : BigDecimal.ZERO;
            BigDecimal valorAcrescimo = acrescimo != null ? acrescimo : BigDecimal.ZERO;
            BigDecimal valorTotal = valorRecebido.add(valorAcrescimo).subtract(valorDesconto);
            
            BigDecimal novoSaldo = vlrSaldoAtual.subtract(valorTotal);
            if (novoSaldo.compareTo(BigDecimal.ZERO) < 0) {
                novoSaldo = BigDecimal.ZERO;
            }
            
            System.out.println("[RecebimentoParcialService] Novo saldo após recebimento: " + novoSaldo);
            
            // 3️⃣ Inserir em RECEBIDOS (histórico do recebimento)
            String sqlInsertRecebidos = 
                "INSERT INTO recebidos (" +
                "  receber_id, codigo_rec, condic_rec, vlrdup_rec, vlracre_rec, " +
                "  vlrmulta_rec, dtpagi_rec, dtatual_rec, vlrpag_rec, observabai_rec, " +
                "  cxbco_rec, opercai_rec, seqcai_rec, usuario_rec" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            Object[] paramsInsert = {
                receberID,                          // receber_id
                codigoCliente,                      // codigo_rec
                "001",                              // condic_rec (padrão)
                valorRecebido,                      // vlrdup_rec (valor recebido)
                valorAcrescimo,                     // vlracre_rec (acréscimo)
                BigDecimal.ZERO,                    // vlrmulta_rec
                dataRecebimento,                    // dtpagi_rec (data do recebimento)
                LocalDate.now(),                    // dtatual_rec (data atualização)
                valorRecebido,                      // vlrpag_rec (valor pago)
                observacao != null ? observacao : "Recebimento parcial registrado via Caixa",  // observabai_rec
                cxbcoRec,                           // cxbco_rec
                operacao,                           // opercai_rec
                seqCaixa,                           // seqcai_rec
                usuarioId != null ? String.valueOf(usuarioId) : "SISTEMA"  // usuario_rec
            };
            
            int rowsInserted = jdbcTemplate.update(sqlInsertRecebidos, paramsInsert);
            System.out.println("[RecebimentoParcialService] Inserido em recebidos: " + rowsInserted + " linhas");
            
            if (rowsInserted <= 0) {
                resultado.put("sucesso", false);
                resultado.put("mensagem", "Erro ao inserir em recebidos");
                return resultado;
            }
            
            // 4️⃣ Atualizar SALDO do documento original (MAS NÃO marcar como pago)
            String sqlUpdateSaldo = 
                "UPDATE receber SET vlrsal_rec = ? WHERE receber_id = ?";
            
            int rowsUpdated = jdbcTemplate.update(sqlUpdateSaldo, novoSaldo, receberID);
            System.out.println("[RecebimentoParcialService] Atualizado receber: " + rowsUpdated + " linhas, novo saldo=" + novoSaldo);
            
            // 5️⃣ Retornar sucesso
            resultado.put("sucesso", true);
            resultado.put("mensagem", "Recebimento parcial registrado com sucesso");
            resultado.put("vlrRecebido", valorRecebido);
            resultado.put("vlrSaldoRestante", novoSaldo);
            resultado.put("documento", numdup + " parcela " + parc);
            resultado.put("recebidosID", rowsInserted > 0 ? "inserido" : "erro");
            
            return resultado;
            
        } catch (Exception e) {
            System.err.println("[RecebimentoParcialService] Erro ao registrar recebimento parcial: " + e.getMessage());
            e.printStackTrace();
            
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Erro: " + e.getMessage());
            return resultado;
        }
    }

    /**
     * Registra um PAGAMENTO PARCIAL de um documento
     * 
     * Mesmo padrão que recebimento, mas para tabela PAGOS
     */
    @Transactional
    public Map<String, Object> registrarPagamentoParcial(
            Integer pagarID,
            Integer codigoFornecedor,
            BigDecimal valorPago,
            BigDecimal desconto,
            BigDecimal acrescimo,
            LocalDate dataPagamento,
            String cxbcoPag,
            String operacao,
            Integer seqCaixa,
            String observacao,
            Integer usuarioId) {
        
        Map<String, Object> resultado = new HashMap<>();
        
        try {
            System.out.println("[PagamentoParcialService] Iniciando registro de pagamento parcial...");
            System.out.println("  pagarID=" + pagarID + ", valor=" + valorPago + ", desconto=" + desconto);
            
            // 1️⃣ Buscar saldo atual do documento
            String sqlSaldo = "SELECT vlrsal_pag, vlrdup_pag, dtvenci_pag, numdup_pag, parcela_pag, dtmovi_pag " +
                            "FROM pagar WHERE pagar_id = ?";
            Map<String, Object> docAtual = jdbcTemplate.queryForMap(sqlSaldo, pagarID);
            
            BigDecimal vlrSaldoAtual = (BigDecimal) docAtual.get("vlrsal_pag");
            String numdup = (String) docAtual.getOrDefault("numdup_pag", "");
            String parc = (String) docAtual.getOrDefault("parcela_pag", "");
            
            System.out.println("[PagamentoParcialService] Saldo atual: " + vlrSaldoAtual + ", Valor pago: " + valorPago);
            
            // 2️⃣ Calcular novo saldo
            BigDecimal valorDesconto = desconto != null ? desconto : BigDecimal.ZERO;
            BigDecimal valorAcrescimo = acrescimo != null ? acrescimo : BigDecimal.ZERO;
            BigDecimal valorTotal = valorPago.add(valorAcrescimo).subtract(valorDesconto);
            
            BigDecimal novoSaldo = vlrSaldoAtual.subtract(valorTotal);
            if (novoSaldo.compareTo(BigDecimal.ZERO) < 0) {
                novoSaldo = BigDecimal.ZERO;
            }
            
            System.out.println("[PagamentoParcialService] Novo saldo após pagamento: " + novoSaldo);
            
            // 3️⃣ Inserir em PAGOS (histórico do pagamento)
            String sqlInsertPagos = 
                "INSERT INTO pagos (" +
                "  pagar_id, codigo_paga, vlrdup_pag, vlracre_pag, " +
                "  vlrmult_pag, dtpagi_pag, dtatual_pag, vlrpag_pag, observabai_pag, " +
                "  opercai_pag, cxbco_pag, seqcai_pag, status_pag, usuario_pag" +
                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            Object[] paramsInsert = {
                pagarID,                            // pagar_id
                String.valueOf(codigoFornecedor),   // codigo_paga
                valorPago,                          // vlrdup_pag (valor pago)
                valorAcrescimo,                     // vlracre_pag (acréscimo)
                BigDecimal.ZERO,                    // vlrmult_pag
                dataPagamento,                      // dtpagi_pag (data do pagamento)
                LocalDate.now(),                    // dtatual_pag (data atualização)
                valorPago,                          // vlrpag_pag (valor pago)
                observacao != null ? observacao : "Pagamento parcial registrado via Caixa",  // observabai_pag
                operacao,                           // opercai_pag
                cxbcoPag,                           // cxbco_pag
                seqCaixa,                           // seqcai_pag
                "P",                                // status_pag (Parcial)
                usuarioId != null ? String.valueOf(usuarioId) : "SISTEMA"  // usuario_pag
            };
            
            int rowsInserted = jdbcTemplate.update(sqlInsertPagos, paramsInsert);
            System.out.println("[PagamentoParcialService] Inserido em pagos: " + rowsInserted + " linhas");
            
            if (rowsInserted <= 0) {
                resultado.put("sucesso", false);
                resultado.put("mensagem", "Erro ao inserir em pagos");
                return resultado;
            }
            
            // 4️⃣ Atualizar SALDO do documento original (MAS NÃO marcar como pago)
            String sqlUpdateSaldo = 
                "UPDATE pagar SET vlrsal_pag = ? WHERE pagar_id = ?";
            
            int rowsUpdated = jdbcTemplate.update(sqlUpdateSaldo, novoSaldo, pagarID);
            System.out.println("[PagamentoParcialService] Atualizado pagar: " + rowsUpdated + " linhas, novo saldo=" + novoSaldo);
            
            // 5️⃣ Retornar sucesso
            resultado.put("sucesso", true);
            resultado.put("mensagem", "Pagamento parcial registrado com sucesso");
            resultado.put("vlrPago", valorPago);
            resultado.put("vlrSaldoRestante", novoSaldo);
            resultado.put("documento", numdup + " parcela " + parc);
            resultado.put("pagosID", rowsInserted > 0 ? "inserido" : "erro");
            
            return resultado;
            
        } catch (Exception e) {
            System.err.println("[PagamentoParcialService] Erro ao registrar pagamento parcial: " + e.getMessage());
            e.printStackTrace();
            
            resultado.put("sucesso", false);
            resultado.put("mensagem", "Erro: " + e.getMessage());
            return resultado;
        }
    }

    /**
     * Consulta HISTÓRICO de recebimentos de um documento
     */
    public java.util.List<Map<String, Object>> consultarHistoricoRecebimentos(Integer receberID) {
        String sql = "SELECT * FROM recebidos WHERE receber_id = ? ORDER BY dtpagi_rec DESC";
        return jdbcTemplate.queryForList(sql, receberID);
    }

    /**
     * Consulta HISTÓRICO de pagamentos de um documento
     */
    public java.util.List<Map<String, Object>> consultarHistoricoPagamentos(Integer pagarID) {
        String sql = "SELECT * FROM pagos WHERE pagar_id = ? ORDER BY dtpagi_pag DESC";
        return jdbcTemplate.queryForList(sql, pagarID);
    }
}
