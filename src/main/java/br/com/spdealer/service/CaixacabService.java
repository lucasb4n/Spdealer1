package br.com.spdealer.service;

import br.com.spdealer.model.Caixa;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaixacabService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Resultado da propagação com estatísticas
     */
    public static class PropagacaoResult {
        private int linhasAfetadas;
        private int linhasProcessadas;
        private String mensagem;
        private boolean sucesso;
        private String operacao; // INICIO ou FIM

        public int getLinhasAfetadas() { return linhasAfetadas; }
        public void setLinhasAfetadas(int v) { this.linhasAfetadas = v; }
        public int getLinhasProcessadas() { return linhasProcessadas; }
        public void setLinhasProcessadas(int v) { this.linhasProcessadas = v; }
        public String getMensagem() { return mensagem; }
        public void setMensagem(String v) { this.mensagem = v; }
        public boolean isSucesso() { return sucesso; }
        public void setSucesso(boolean v) { this.sucesso = v; }
        public String getOperacao() { return operacao; }
        public void setOperacao(String v) { this.operacao = v; }
    }

    /**
     * Insere log de auditoria na tabela log (início ou fim de processo)
     */
    private void insertLogAuditoria(String filialLog, String usuarioLog, String tipoLog, String historicoLog) {
        try {
            // tipoLog: "04" = Inicio, "05" = Fim Sucesso, "06" = Fim Erro
            String sql = "INSERT INTO log (filial_log, chave_log, usuario_log, programa_log, oper_log, histor_log) VALUES (?, NOW(), ?, ?, ?, ?)";
            jdbcTemplate.update(sql, filialLog, usuarioLog, "CAI001", tipoLog, historicoLog);
            log.info("[CaixacabService] Log auditoria inserido: tipo={}, historico={}", tipoLog, historicoLog);
        } catch (Exception e) {
            log.error("[CaixacabService] Erro ao inserir log auditoria: {}", e.getMessage());
        }
    }

    /**
     * Propaga alteração de um movimento de caixa para o consolidado (caixacab).
     * Calcula delta entre 'novo' e 'antigo' e ajusta saldo_cai para todas as datas >= data afetada.
     * Retorna estatísticas do processamento.
     * Insere logs de auditoria no início e fim do processo.
     */
    @Transactional
    public PropagacaoResult propagarAlteracao(Caixa antigo, Caixa novo, String filialLog, String usuarioLog) {
        PropagacaoResult result = new PropagacaoResult();
        result.setSucesso(true);
        result.setLinhasProcessadas(0);
        result.setLinhasAfetadas(0);
        
        // Log de INÍCIO da atualização (oper_log = "04")
        String historicoInicio = String.format(
            "INICIO: Atualizacao de saldo caixacab - seq_cai=%d, banco=%s, dtmovi=%s->%s, valor=%s->%s, dc=%s->%s",
            antigo.getSeqCai(),
            antigo.getBancoCai(),
            antigo.getDtmoviCai(),
            novo.getDtmoviCai(),
            formatarMoedaBR(antigo.getValorCai()),
            formatarMoedaBR(novo.getValorCai()),
            antigo.getDcCai(),
            novo.getDcCai()
        );
        insertLogAuditoria(filialLog, usuarioLog, "04", historicoInicio);
        
        try {
            String filial = antigo.getFilialCai();
            String banco = antigo.getBancoCai();

            LocalDate dataAntiga = antigo.getDtmoviCai();
            LocalDate dataNova = novo.getDtmoviCai();

            BigDecimal oldSigned = antigo.getValorComSinal();
            BigDecimal newSigned = novo.getValorComSinal();
            BigDecimal deltaTotal = newSigned.subtract(oldSigned);

            // Se mesmo dia e mesma conta/banco: aplica delta a partir da data antiga
            if (dataAntiga.equals(dataNova) && filial.equals(novo.getFilialCai()) && banco.equals(novo.getBancoCai())) {
                int affected = applyDeltaFromDate(deltaTotal, filial, banco, dataAntiga);
                result.setLinhasAfetadas(affected);
                result.setLinhasProcessadas(1);
                // ajustar credito/debito do dia especifico
                BigDecimal creditoDelta = BigDecimal.ZERO;
                BigDecimal debitoDelta = BigDecimal.ZERO;
                if (antigo.isCredito()) creditoDelta = creditoDelta.subtract(antigo.getValorCai()); else debitoDelta = debitoDelta.subtract(antigo.getValorCai());
                if (novo.isCredito()) creditoDelta = creditoDelta.add(novo.getValorCai()); else debitoDelta = debitoDelta.add(novo.getValorCai());

                applyDayAdjust(dataAntiga, filial, banco, creditoDelta, debitoDelta);
                result.setMensagem("Saldo atualizado com sucesso. Registros afetados: " + affected);
                
                // Log de FIM da atualização (sucesso) (oper_log = "05")
                String historicoFim = String.format(
                    "FIM SUCESSO: Atualizacao de saldo caixacab concluida - seq_cai=%d, banco=%s, linhasAfetadas=%d",
                    antigo.getSeqCai(),
                    banco,
                    affected
                );
                insertLogAuditoria(filialLog, usuarioLog, "05", historicoFim);
                
                return result;
            }

            int totalAfetadas = 0;
            int totalProcessadas = 0;

            // Contar registros antes de atualizar
            int countAntiga = countRegistrosAfetados(filial, banco, dataAntiga);
            int countNova = countRegistrosAfetados(filial, banco, dataNova);
            
            // Se data mudou ou banco/filial mudou
            // 1) remover efeito do antigo a partir da data antiga (aplicar -oldSigned)
            int affected1 = applyDeltaFromDate(oldSigned.negate(), antigo.getFilialCai(), antigo.getBancoCai(), dataAntiga);
            totalAfetadas += affected1;
            totalProcessadas += countAntiga;

            // 2) aplicar efeito do novo a partir da data nova (aplicar +newSigned)
            int affected2 = applyDeltaFromDate(newSigned, novo.getFilialCai(), novo.getBancoCai(), dataNova);
            totalAfetadas += affected2;
            totalProcessadas += countNova;

            // Ajustes de credito/debito por dia: ajustar dia antiga (remover) e dia nova (adicionar)
            BigDecimal creditoAnt = antigo.isCredito() ? antigo.getValorCai().negate() : BigDecimal.ZERO;
            BigDecimal debitoAnt = antigo.isDebito() ? antigo.getValorCai().negate() : BigDecimal.ZERO;

            BigDecimal creditoNovo = novo.isCredito() ? novo.getValorCai() : BigDecimal.ZERO;
            BigDecimal debitoNovo = novo.isDebito() ? novo.getValorCai() : BigDecimal.ZERO;

            applyDayAdjust(dataAntiga, antigo.getFilialCai(), antigo.getBancoCai(), creditoAnt, debitoAnt);
            applyDayAdjust(dataNova, novo.getFilialCai(), novo.getBancoCai(), creditoNovo, debitoNovo);

            result.setLinhasAfetadas(totalAfetadas);
            result.setLinhasProcessadas(totalProcessadas + 2); // +2 pelos ajustes de dia
            result.setMensagem("Saldo atualizado com sucesso. Registros afetados: " + totalAfetadas);
            
            log.info("[propagarAlteracao] Resultado: linhasAfetadas={}, linhasProcessadas={}", 
                result.getLinhasAfetadas(), result.getLinhasProcessadas());
            
            // Log de FIM da atualização (sucesso) (oper_log = "05")
            String historicoFim = String.format(
                "FIM SUCESSO: Atualizacao de saldo caixacab concluida - seq_cai=%d, banco=%s, linhasAfetadas=%d",
                antigo.getSeqCai(),
                banco,
                totalAfetadas
            );
            insertLogAuditoria(filialLog, usuarioLog, "05", historicoFim);
            
            return result;

        } catch (Exception e) {
            log.error("Erro ao propagar alteracao em caixacab", e);
            result.setSucesso(false);
            result.setMensagem("Erro ao atualizar saldo: " + e.getMessage());
            
            // Log de FIM da atualização (erro) (oper_log = "06")
            String historicoErro = String.format(
                "FIM ERRO: Atualizacao de saldo caixacab falhou - seq_cai=%d, erro=%s",
                antigo != null ? antigo.getSeqCai() : 0,
                e.getMessage()
            );
            insertLogAuditoria(filialLog, usuarioLog, "06", historicoErro);
            
            return result;
        }
    }

    /**
     * Versão legacy sem retorno de estatísticas e sem logs (para compatibilidade)
     */
    @Transactional
    public void propagarAlteracaoLegacy(Caixa antigo, Caixa novo) {
        propagarAlteracao(antigo, novo, "001", "SYSTEM");
    }

    private int countRegistrosAfetados(String filial, String banco, LocalDate fromDate) {
        try {
            String sql = "SELECT COUNT(*) FROM caixacab WHERE filial_cai = ? AND codbanco_cai = ? AND dtmovi_cai >= ?";
            Number count = jdbcTemplate.queryForObject(sql, Number.class, filial, banco, fromDate);
            return count != null ? count.intValue() : 0;
        } catch (Exception e) {
            log.warn("Erro ao contar registros afetados: {}", e.getMessage());
            return 0;
        }
    }

    private int applyDeltaFromDate(BigDecimal delta, String filial, String banco, LocalDate fromDate) {
        String sql = "UPDATE caixacab SET saldo_cai = COALESCE(saldo_cai,0) + ? WHERE filial_cai = ? AND codbanco_cai = ? AND dtmovi_cai >= ?";
        int updated = jdbcTemplate.update(sql, delta, filial, banco, fromDate);
        log.info("applyDeltaFromDate updated {} rows (filial={}, banco={}, from={}) with delta={}", updated, filial, banco, fromDate, delta);
        return updated;
    }

    private void applyDayAdjust(LocalDate data, String filial, String banco, BigDecimal creditoDelta, BigDecimal debitoDelta) {
        // Apenas ajusta credito_cai e debito_cai do dia.
        // saldo_cai NÃO é alterado aqui — o applyDeltaFromDate (chamado antes)
        // já propaga o delta cumulativamente para todas as datas >= data.
        String updSql = "UPDATE caixacab SET credito_cai = COALESCE(credito_cai,0) + ?, debito_cai = COALESCE(debito_cai,0) + ? WHERE filial_cai = ? AND codbanco_cai = ? AND dtmovi_cai = ?";
        BigDecimal saldoDelta = creditoDelta.subtract(debitoDelta);
        int u = jdbcTemplate.update(updSql, creditoDelta, debitoDelta, filial, banco, data);
        if (u == 0) {
            // Insert fallback (raro): dia não existe em caixacab.
            // saldoAnt já vem ajustado pelo applyDeltaFromDate.
            BigDecimal saldoAnt = getLastSaldoBeforeDate(filial, banco, data);
            BigDecimal credito = creditoDelta.compareTo(BigDecimal.ZERO) > 0 ? creditoDelta : creditoDelta;
            BigDecimal debito = debitoDelta.compareTo(BigDecimal.ZERO) > 0 ? debitoDelta : debitoDelta;
            BigDecimal novoSaldo = saldoAnt.add(credito).subtract(debito);

            String ins = "INSERT INTO caixacab (filial_cai,codbanco_cai,tipocai_cai,dtmovi_cai,saldoant_cai,debito_cai,credito_cai,saldo_cai) VALUES (?,?,?,?,?,?,?,?)";
            jdbcTemplate.update(ins, filial, banco, "001", data, saldoAnt,
                debito.compareTo(BigDecimal.ZERO) < 0 ? debito.negate() : debito,
                credito.compareTo(BigDecimal.ZERO) < 0 ? credito.negate() : credito,
                novoSaldo);
            log.info("Inserted caixacab fallback for date {} filial {} banco {} with saldoAnt {} novoSaldo {}", data, filial, banco, saldoAnt, novoSaldo);
        } else {
            log.info("Updated caixacab day adjust for {} rows on date {}", u, data);
        }
    }

    private BigDecimal getLastSaldoBeforeDate(String filial, String banco, LocalDate date) {
        try {
            String sel = "SELECT saldo_cai FROM caixacab WHERE filial_cai = ? AND codbanco_cai = ? AND dtmovi_cai = (SELECT MAX(dtmovi_cai) FROM caixacab WHERE filial_cai = ? AND codbanco_cai = ? AND dtmovi_cai < ?)";
            Number n = jdbcTemplate.queryForObject(sel, new Object[]{filial, banco, filial, banco, date}, Number.class);
            if (n == null) return BigDecimal.ZERO;
            return new BigDecimal(n.toString());
        } catch (Exception e) {
            log.warn("Nenhum saldo anterior encontrado para {}/{} antes {}: assumindo 0", filial, banco, date);
            return BigDecimal.ZERO;
        }
    }

    /**
     * Formata valor em reais brasileiro
     */
    private String formatarMoedaBR(BigDecimal valor) {
        if (valor == null) return "0,00";
        return valor.setScale(2, java.math.RoundingMode.HALF_UP)
                    .toString().replace(".", ",");
    }

}
