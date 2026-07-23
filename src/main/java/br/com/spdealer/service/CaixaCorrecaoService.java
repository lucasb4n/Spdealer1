package br.com.spdealer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDate;
import java.util.*;

/**
 * CaixaCorrecaoService
 * 
 * Service para corrigir datas de lançamentos CAIXA que foram registrados com data incorreta.
 * 
 * ESTRUTURA DA CHAVE:
 * - Chave Primária de CAIXA: (filial_cai, tipocai_cai, cliforn_cai, codbanco_cai, dtmovi_cai, seq_cai)
 *   NOTA: cliforn_cai é sempre vazio na prática
 * 
 * LÓGICA DE VINCULAÇÃO (usando operacao_cai):
 *   1. Tenta buscar em RECEBER com operacao_cai
 *   2. Se não encontrar, tenta buscar em PAGAR com operacao_cai
 *   3. Se não encontrar em nenhum → SEM VINCULAÇÃO (ignorar PASSO F)
 * 
 * PASSOS DE CORREÇÃO:
 * A) Guardar chaves de vinculação (receber/pagar) baseado em operacao_cai
 * B) Deletar lançamento antigo (caixa)
 * C) Estornar saldo antigo (caixacab: data antiga + datas futuras)
 * D) Inserir novo lançamento (caixa com nova data e seq_cai)
 * E) Reconstruir saldo novo (caixacab: data nova + datas futuras)
 * F) Atualizar vinculação (receber/pagar com nova seq_cai e data)
 */
@Service
@Transactional
public class CaixaCorrecaoService {
    
    private static final Logger logger = LoggerFactory.getLogger(CaixaCorrecaoService.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * PASSO A: Guardar chaves de vinculação usando mascai JOIN
     * 
     * LÓGICA CORRETA:
     * 1) Join caixa.operacao_cai com mascai.operacao_ocai (para filial_ocai = session)
     * 2) Verificar mascai.tipo_ocai:
     *    - Se 'C' → Buscar em RECEBER
     *    - Se != 'C' → Buscar em PAGAR
     * 3) Se nenhum mascai encontrado → SEM VINCULAÇÃO
     */
    private Map<String, Object> guardarChavesVinculacao(
            String filialCai, String operacaoCai, String filialSessao) {
        
        Map<String, Object> chaves = new HashMap<>();
        
        logger.info("  🔍 PASSO A: Buscando mascai (filial_ocai={}, operacao_ocai={})", filialSessao, operacaoCai);
        
        // Step 1: Find mascai record
        String sqlMascai = "SELECT tipo_ocai FROM mascai " +
                "WHERE filial_ocai = ? AND operacao_ocai = ? LIMIT 1";
        
        List<Map<String, Object>> mascaiResult = jdbcTemplate.queryForList(sqlMascai, filialSessao, operacaoCai);
        
        if (mascaiResult.isEmpty()) {
            logger.warn("  ⚠️  Nenhum mascai encontrado → SEM VINCULAÇÃO");
            chaves.put("temVinculacao", false);
            return chaves;
        }
        
        String tipoOcai = (String) mascaiResult.get(0).get("tipo_ocai");
        logger.info("  ✓ Mascai encontrado: tipo_ocai={}", tipoOcai);
        
        // Step 2: Check tipo_ocai and search in RECEBER or PAGAR
        if ("C".equals(tipoOcai)) {
            // RECEBER
            logger.info("  🔍 tipo_ocai='C' → Buscando em RECEBER com operacao_rec={}...", operacaoCai);
            
            String sqlReceber = "SELECT codigo_rec, operacao_rec, descri_rec, seq_rec " +
                    "FROM receber " +
                    "WHERE filial_rec = ? AND operacao_rec = ? LIMIT 1";
            
            List<Map<String, Object>> recResult = jdbcTemplate.queryForList(sqlReceber, filialCai, operacaoCai);
            
            if (!recResult.isEmpty()) {
                Map<String, Object> rec = recResult.get(0);
                chaves.put("temVinculacao", true);
                chaves.put("tipo", "RECEBER");
                chaves.put("codigo_rec", rec.get("codigo_rec"));
                chaves.put("operacao_rec", rec.get("operacao_rec"));
                chaves.put("seq_rec", rec.get("seq_rec"));
                chaves.put("descri_rec", rec.getOrDefault("descri_rec", ""));
                logger.info("  ✓ RECEBER encontrado: codigo={}, seq={}", rec.get("codigo_rec"), rec.get("seq_rec"));
            } else {
                logger.warn("  ⚠️  Nenhum RECEBER encontrado com operacao={}", operacaoCai);
                chaves.put("temVinculacao", false);
            }
            
        } else {
            // PAGAR
            logger.info("  🔍 tipo_ocai!='C' → Buscando em PAGAR com operacao_pag={}...", operacaoCai);
            
            String sqlPagar = "SELECT codigo_pag, operacao_pag, descri_pag, seq_pag " +
                    "FROM pagar " +
                    "WHERE filial_pag = ? AND operacao_pag = ? LIMIT 1";
            
            List<Map<String, Object>> pagResult = jdbcTemplate.queryForList(sqlPagar, filialCai, operacaoCai);
            
            if (!pagResult.isEmpty()) {
                Map<String, Object> pag = pagResult.get(0);
                chaves.put("temVinculacao", true);
                chaves.put("tipo", "PAGAR");
                chaves.put("codigo_pag", pag.get("codigo_pag"));
                chaves.put("operacao_pag", pag.get("operacao_pag"));
                chaves.put("seq_pag", pag.get("seq_pag"));
                chaves.put("descri_pag", pag.getOrDefault("descri_pag", ""));
                logger.info("  ✓ PAGAR encontrado: codigo={}, seq={}", pag.get("codigo_pag"), pag.get("seq_pag"));
            } else {
                logger.warn("  ⚠️  Nenhum PAGAR encontrado com operacao={}", operacaoCai);
                chaves.put("temVinculacao", false);
            }
        }
        
        return chaves;
    }
    
    /**
     * PASSO B: Deletar lançamento antigo
     */
    private void deletarLancamentoAntigo(
            String filialCai, String tipocaiCai, String clifornCai, 
            String codbancoCai, Integer dtmoviAntigo, Integer seqCaiAntigo) {
        
        logger.info("  🗑️  PASSO B: Deletando lançamento...");
        
        String sql = "DELETE FROM caixa " +
                    "WHERE filial_cai = ? AND tipocai_cai = ? AND cliforn_cai = ? " +
                    "  AND codbanco_cai = ? AND dtmovi_cai = ? AND seq_cai = ?";
        
        int deletedRows = jdbcTemplate.update(sql, 
            filialCai, tipocaiCai, clifornCai, codbancoCai, dtmoviAntigo, seqCaiAntigo);
        
        if (deletedRows > 0) {
            logger.info("  ✓ Lançamento deletado");
        } else {
            throw new RuntimeException("Lançamento não encontrado");
        }
    }
    
    /**
     * PASSO C: Estornar saldo antigo
     */
    private void estornarSaldoAntigo(
            String filialCai, String codbancoCai, String tipocaiCai,
            Integer dtmoviAntigo, String dcCai, Double valorCai) {
        
        logger.info("  💰 PASSO C: Estornando saldo...");
        
        String sqlEstorno;
        if ("C".equals(dcCai)) {
            sqlEstorno = "UPDATE caixacab SET credito_cai = credito_cai - ? " +
                        "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai = ?";
        } else {
            sqlEstorno = "UPDATE caixacab SET debito_cai = debito_cai - ? " +
                        "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai = ?";
        }
        
        jdbcTemplate.update(sqlEstorno, valorCai, filialCai, codbancoCai, tipocaiCai, dtmoviAntigo);
        
        String sqlRecalc = "UPDATE caixacab SET saldo_cai = (saldoant_cai + credito_cai - debito_cai) " +
                          "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai = ?";
        jdbcTemplate.update(sqlRecalc, filialCai, codbancoCai, tipocaiCai, dtmoviAntigo);
        
        String sqlFuturo = "UPDATE caixacab SET saldo_cai = saldo_cai - ? " +
                          "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai > ?";
        jdbcTemplate.update(sqlFuturo, valorCai, filialCai, codbancoCai, tipocaiCai, dtmoviAntigo);
        
        logger.info("  ✓ Saldo estornado");
    }
    
    /**
     * PASSO D: Inserir novo lançamento
     */
    private Integer inserirNovoLancamento(
            String filialCai, String tipocaiCai, String clifornCai,
            String codbancoCai, Integer novaDataNumero, String dcCai, Double valorCai,
            String histor_cai, String oper_cai, String operacao_cai) {
        
        logger.info("  📝 PASSO D: Inserindo novo lançamento...");
        
        String sqlSeq = "SELECT COALESCE(MAX(seq_cai), 0) + 1 FROM caixa " +
                       "WHERE filial_cai = ? AND tipocai_cai = ? AND cliforn_cai = ? " +
                       "  AND codbanco_cai = ? AND dtmovi_cai = ?";
        
        Integer novoSeq = jdbcTemplate.queryForObject(sqlSeq, 
            new Object[]{filialCai, tipocaiCai, clifornCai, codbancoCai, novaDataNumero}, 
            Integer.class);
        
        String sqlInsert = "INSERT INTO caixa " +
                          "(filial_cai, tipocai_cai, cliforn_cai, codbanco_cai, dtmovi_cai, seq_cai, " +
                          "dc_cai, valor_cai, histor_cai, oper_cai, operacao_cai, data_incl_cai) " +
                          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        jdbcTemplate.update(sqlInsert, 
            filialCai, tipocaiCai, clifornCai, codbancoCai, novaDataNumero, novoSeq,
            dcCai, valorCai, histor_cai, oper_cai, operacao_cai);
        
        logger.info("  ✓ Novo lançamento inserido (seq={})", novoSeq);
        
        return novoSeq;
    }
    
    /**
     * PASSO E: Reconstruir saldo novo
     */
    private void reconstruirSaldoNovo(
            String filialCai, String codbancoCai, String tipocaiCai,
            Integer novaDataNumero, String dcCai, Double valorCai) {
        
        logger.info("  💰 PASSO E: Reconstruindo saldo...");
        
        String sqlCount = "SELECT COUNT(*) FROM caixacab " +
                         "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai = ?";
        Integer count = jdbcTemplate.queryForObject(sqlCount, 
            new Object[]{filialCai, codbancoCai, tipocaiCai, novaDataNumero}, Integer.class);
        
        if (count == 0) {
            String sqlInsertCaixacab = "INSERT INTO caixacab " +
                "(filial_cai, codbanco_cai, tipocai_cai, dtmovi_cai, saldoant_cai, credito_cai, debito_cai, saldo_cai) " +
                "SELECT ?, ?, ?, ?, " +
                "COALESCE((SELECT saldo_cai FROM caixacab WHERE filial_cai = ? AND codbanco_cai = ? " +
                "  AND tipocai_cai = ? AND dtmovi_cai < ? ORDER BY dtmovi_cai DESC LIMIT 1), 0), " +
                "?, ?, " +
                "COALESCE((SELECT saldo_cai FROM caixacab WHERE filial_cai = ? AND codbanco_cai = ? " +
                "  AND tipocai_cai = ? AND dtmovi_cai < ? ORDER BY dtmovi_cai DESC LIMIT 1), 0) + ?";
            
            Double credito = "C".equals(dcCai) ? valorCai : 0.0;
            Double debito = "D".equals(dcCai) ? valorCai : 0.0;
            
            jdbcTemplate.update(sqlInsertCaixacab, filialCai, codbancoCai, tipocaiCai, novaDataNumero,
                filialCai, codbancoCai, tipocaiCai, novaDataNumero, credito, debito,
                filialCai, codbancoCai, tipocaiCai, novaDataNumero, valorCai);
        } else {
            String sqlUpdateCaixacab = "C".equals(dcCai) ?
                "UPDATE caixacab SET credito_cai = credito_cai + ? " +
                "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai = ?" :
                "UPDATE caixacab SET debito_cai = debito_cai + ? " +
                "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai = ?";
            
            jdbcTemplate.update(sqlUpdateCaixacab, valorCai, filialCai, codbancoCai, tipocaiCai, novaDataNumero);
        }
        
        String sqlRecalc = "UPDATE caixacab SET saldo_cai = (saldoant_cai + credito_cai - debito_cai) " +
                          "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai = ?";
        jdbcTemplate.update(sqlRecalc, filialCai, codbancoCai, tipocaiCai, novaDataNumero);
        
        String sqlFuturo = "UPDATE caixacab SET saldo_cai = saldo_cai + ? " +
                          "WHERE filial_cai = ? AND codbanco_cai = ? AND tipocai_cai = ? AND dtmovi_cai > ?";
        jdbcTemplate.update(sqlFuturo, valorCai, filialCai, codbancoCai, tipocaiCai, novaDataNumero);
        
        logger.info("  ✓ Saldo reconstruído");
    }
    
    /**
     * PASSO F: Atualizar vinculação em RECEBER
     */
    private void atualizarVinculacaoReceber(
            String filialCai, String codbancoCai, String operacaoCai,
            Integer novoSeq, LocalDate novaData) {
        
        logger.info("  🔗 PASSO F: Atualizando RECEBER...");
        
        String sql = "UPDATE receber SET cxbco_rec = ?, dtpagi_rec = ?, seqcai_rec = ? " +
                    "WHERE filial_rec = ? AND operacao_rec = ? AND seqcai_rec IS NOT NULL LIMIT 1";
        
        jdbcTemplate.update(sql, codbancoCai, novaData, novoSeq, filialCai, operacaoCai);
        
        logger.info("  ✓ RECEBER atualizado");
    }
    
    /**
     * PASSO F: Atualizar vinculação em PAGAR
     */
    private void atualizarVinculacaoPagar(
            String filialCai, String codbancoCai, String operacaoCai,
            Integer novoSeq, LocalDate novaData) {
        
        logger.info("  🔗 PASSO F: Atualizando PAGAR...");
        
        String sql = "UPDATE pagar SET cxbco_pag = ?, dtpagi_pag = ?, seqcai_pag = ? " +
                    "WHERE filial_pag = ? AND operacao_pag = ? AND seqcai_pag IS NOT NULL LIMIT 1";
        
        jdbcTemplate.update(sql, codbancoCai, novaData, novoSeq, filialCai, operacaoCai);
        
        logger.info("  ✓ PAGAR atualizado");
    }
    
    /**
     * ORQUESTRADOR: Executa todos os PASSOS A-F com @Transactional
     */
    public Map<String, Object> corrigirDataLancamentoCaixa(
            String filialCai, String tipocaiCai, String clifornCai, String codbancoCai,
            Integer dtmoviAntigo, Integer seqCaiAntigo, String operacaoCai, LocalDate novaDataLocal) {
        
        List<String> mensagens = new ArrayList<>();
        Map<String, Object> resposta = new HashMap<>();
        
        try {
            logger.info("═══════════════════════════════════════════════════════════");
            logger.info("🔧 INICIANDO CORREÇÃO DE DATA - CAIXA");
            logger.info("   Data Antiga: {}, Seq: {}, Nova Data: {}", dtmoviAntigo, seqCaiAntigo, novaDataLocal);
            logger.info("   Operacao: {}", operacaoCai);
            logger.info("═══════════════════════════════════════════════════════════");
            
            String sqlBuscaAntigo = "SELECT dc_cai, valor_cai, histor_cai, oper_cai, operacao_cai " +
                                   "FROM caixa WHERE filial_cai = ? AND tipocai_cai = ? AND cliforn_cai = ? " +
                                   "  AND codbanco_cai = ? AND dtmovi_cai = ? AND seq_cai = ?";
            
            List<Map<String, Object>> resultados = jdbcTemplate.queryForList(sqlBuscaAntigo,
                filialCai, tipocaiCai, clifornCai, codbancoCai, dtmoviAntigo, seqCaiAntigo);
            
            if (resultados.isEmpty()) {
                throw new RuntimeException("Lançamento não encontrado");
            }
            
            Map<String, Object> caixa = resultados.get(0);
            String dcCai = (String) caixa.get("dc_cai");
            Double valorCai = ((Number) caixa.get("valor_cai")).doubleValue();
            String historCai = (String) caixa.getOrDefault("histor_cai", "");
            String operCai = (String) caixa.getOrDefault("oper_cai", "");
            String operacaoCaiFromDb = (String) caixa.get("operacao_cai");
            
            // Use operacaoCai from parameter if provided, else from database
            if (operacaoCai == null || operacaoCai.isEmpty()) {
                operacaoCai = operacaoCaiFromDb;
            }
            
            String filialSessao = filialCai; // In production: session.getAttribute("id_fil")
            
            logger.info("\n✓ PASSO A...");
            Map<String, Object> chavesVinculo = guardarChavesVinculacao(filialCai, operacaoCai, filialSessao);
            boolean temVinculacao = (boolean) chavesVinculo.getOrDefault("temVinculacao", false);
            String tipoVinculo = (String) chavesVinculo.getOrDefault("tipo", "NENHUM");
            
            mensagens.add(temVinculacao ? "✓ A: Chaves guardadas (" + tipoVinculo + ")" : 
                         "⚠️  A: Sem vinculação");
            
            logger.info("\n✓ PASSO B...");
            deletarLancamentoAntigo(filialCai, tipocaiCai, clifornCai, codbancoCai, dtmoviAntigo, seqCaiAntigo);
            mensagens.add("✓ B: Lançamento deletado");
            
            logger.info("\n✓ PASSO C...");
            estornarSaldoAntigo(filialCai, codbancoCai, tipocaiCai, dtmoviAntigo, dcCai, valorCai);
            mensagens.add("✓ C: Saldo estornado");
            
            logger.info("\n✓ PASSO D...");
            Integer novaDataNumero = Integer.parseInt(novaDataLocal.toString().replace("-", ""));
            Integer novoSeq = inserirNovoLancamento(filialCai, tipocaiCai, clifornCai, codbancoCai,
                novaDataNumero, dcCai, valorCai, historCai, operCai, operacaoCai);
            mensagens.add("✓ D: Novo lançamento (seq=" + novoSeq + ")");
            
            logger.info("\n✓ PASSO E...");
            reconstruirSaldoNovo(filialCai, codbancoCai, tipocaiCai, novaDataNumero, dcCai, valorCai);
            mensagens.add("✓ E: Saldo reconstruído");
            
            if (temVinculacao) {
                logger.info("\n✓ PASSO F...");
                if ("RECEBER".equals(tipoVinculo)) {
                    atualizarVinculacaoReceber(filialCai, codbancoCai, operacaoCai, novoSeq, novaDataLocal);
                    mensagens.add("✓ F: RECEBER atualizado");
                } else if ("PAGAR".equals(tipoVinculo)) {
                    atualizarVinculacaoPagar(filialCai, codbancoCai, operacaoCai, novoSeq, novaDataLocal);
                    mensagens.add("✓ F: PAGAR atualizado");
                }
            } else {
                mensagens.add("✓ F: (ignorado - sem vinculação)");
            }
            
            logger.info("\n✅ SUCESSO!\n");
            
            resposta.put("sucesso", true);
            resposta.put("mensagens", mensagens);
            resposta.put("chavesOriginais", chavesVinculo);
            resposta.put("tipoVinculo", tipoVinculo);
            resposta.put("novoSeq", novoSeq);
            
            return resposta;
            
        } catch (Exception e) {
            logger.error("❌ ERRO: {}", e.getMessage(), e);
            mensagens.add("❌ " + e.getMessage());
            resposta.put("sucesso", false);
            resposta.put("erro", e.getMessage());
            resposta.put("mensagens", mensagens);
            throw new RuntimeException(e.getMessage(), e);
        }
    }
    
    /**
     * NOVO: Valida consistência do valor_cai com documentos vinculados
     * 
     * Quando caixa.valor_cai é alterado, precisa validar se a soma dos
     * documentos vinculados (receber/pagar) corresponde ao novo valor.
     * 
     * RETORNA:
     * {
     *   "consistente": true/false,
     *   "valorCaixa": 1500.50,
     *   "somaDocumentos": 1500.50,
     *   "diferenca": 0.00,
     *   "documentosVinculados": [
     *     {
     *       "tipo": "RECEBER",
     *       "seq": 1,
     *       "vlrsal": 1500.50,
     *       "descricao": "Cliente X"
     *     }
     *   ]
     * }
     */
    @Transactional(readOnly = true)
    public Map<String, Object> validarConsistenciaValorCaixa(
            String filialCai, String tipocaiCai, String clifornCai, String codbancoCai,
            Integer dtmoviCai, Integer seqCai) {
        
        Map<String, Object> resultado = new HashMap<>();
        List<Map<String, Object>> documentosVinculados = new ArrayList<>();
        
        logger.info("🔍 VALIDANDO CONSISTÊNCIA: valor_caixa vs documentos vinculados");
        
        // Buscar valor_cai
        String sqlBuscaCaixa = "SELECT valor_cai FROM caixa " +
                "WHERE filial_cai = ? AND tipocai_cai = ? AND cliforn_cai = ? " +
                "  AND codbanco_cai = ? AND dtmovi_cai = ? AND seq_cai = ?";
        
        List<Map<String, Object>> caixaResult = jdbcTemplate.queryForList(sqlBuscaCaixa,
            filialCai, tipocaiCai, clifornCai, codbancoCai, dtmoviCai, seqCai);
        
        if (caixaResult.isEmpty()) {
            resultado.put("consistente", false);
            resultado.put("erro", "Lançamento caixa não encontrado");
            return resultado;
        }
        
        Double valorCaixa = ((Number) caixaResult.get(0).get("valor_cai")).doubleValue();
        resultado.put("valorCaixa", valorCaixa);
        
        // Buscar documentos RECEBER vinculados
        String sqlReceber = "SELECT seq_rec, vlrsal_rec, descri_rec, dtpagi_rec " +
                "FROM receber " +
                "WHERE filial_rec = ? AND dtpagi_rec IS NOT NULL AND seqcai_rec IS NOT NULL " +
                "ORDER BY seq_rec";
        
        List<Map<String, Object>> receberList = jdbcTemplate.queryForList(sqlReceber, filialCai);
        
        for (Map<String, Object> rec : receberList) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("tipo", "RECEBER");
            doc.put("seq", rec.get("seq_rec"));
            doc.put("vlrsal", rec.get("vlrsal_rec"));
            doc.put("descricao", rec.getOrDefault("descri_rec", ""));
            doc.put("data_pagamento", rec.get("dtpagi_rec"));
            documentosVinculados.add(doc);
        }
        
        // Buscar documentos PAGAR vinculados
        String sqlPagar = "SELECT seq_pag, vlrsal_pag, descri_pag, dtpagi_pag " +
                "FROM pagar " +
                "WHERE filial_pag = ? AND dtpagi_pag IS NOT NULL AND seqcai_pag IS NOT NULL " +
                "ORDER BY seq_pag";
        
        List<Map<String, Object>> pagarList = jdbcTemplate.queryForList(sqlPagar, filialCai);
        
        for (Map<String, Object> pag : pagarList) {
            Map<String, Object> doc = new HashMap<>();
            doc.put("tipo", "PAGAR");
            doc.put("seq", pag.get("seq_pag"));
            doc.put("vlrsal", pag.get("vlrsal_pag"));
            doc.put("descricao", pag.getOrDefault("descri_pag", ""));
            doc.put("data_pagamento", pag.get("dtpagi_pag"));
            documentosVinculados.add(doc);
        }
        
        // Calcular soma
        Double somaDocumentos = documentosVinculados.stream()
            .mapToDouble(d -> ((Number) d.get("vlrsal")).doubleValue())
            .sum();
        
        double diferenca = Math.abs(valorCaixa - somaDocumentos);
        boolean consistente = diferenca < 0.01; // Tolerância de arredondamento
        
        resultado.put("somaDocumentos", somaDocumentos);
        resultado.put("diferenca", diferenca);
        resultado.put("consistente", consistente);
        resultado.put("documentosVinculados", documentosVinculados);
        resultado.put("quantidadeDocumentos", documentosVinculados.size());
        
        logger.info("  Valor Caixa: {}, Soma Docs: {}, Diferença: {}, Consistente: {}",
            valorCaixa, somaDocumentos, diferenca, consistente);
        
        return resultado;
    }
    
    /**
     * NOVO: Desvincula um documento (RECEBER ou PAGAR) do lançamento caixa
     * 
     * Quando desvinculando:
     * - Move vlrsal_rec/vlrsal_pag de volta para vlrdup_rec/vlrdup_pag
     * - Seta dtpagi_rec/dtpagi_pag para NULL (reabre documento)
     * - Seta dtpag_rec/dtpag_pag para NULL (campo DDMMAAAA legado)
     * - NÃO deleta o documento, apenas reabre
     * - O documento volta para status "aberto" em receber/pagar
     * 
     * Request:
     * {
     *   "tipoDocumento": "RECEBER" ou "PAGAR",
     *   "seqDocumento": 1,
     *   "filialDocumento": "001"
     * }
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> desvinculaDocumento(
            String tipoDocumento, Integer seqDocumento, String filialDocumento) {
        
        Map<String, Object> resposta = new HashMap<>();
        List<String> mensagens = new ArrayList<>();
        
        try {
            logger.info("═══════════════════════════════════════════════════════════");
            logger.info("🔗 DESVINCULANDO DOCUMENTO: tipo={}, seq={}, filial={}",
                tipoDocumento, seqDocumento, filialDocumento);
            logger.info("═══════════════════════════════════════════════════════════");
            
            if ("RECEBER".equals(tipoDocumento)) {
                desvinculaReceber(filialDocumento, seqDocumento, mensagens);
                resposta.put("tipo", "RECEBER");
            } else if ("PAGAR".equals(tipoDocumento)) {
                desvinculaPagar(filialDocumento, seqDocumento, mensagens);
                resposta.put("tipo", "PAGAR");
            } else {
                throw new IllegalArgumentException("tipoDocumento deve ser RECEBER ou PAGAR");
            }
            
            logger.info("\n✅ SUCESSO!\n");
            
            resposta.put("sucesso", true);
            resposta.put("mensagens", mensagens);
            resposta.put("seqDocumento", seqDocumento);
            
            return resposta;
            
        } catch (Exception e) {
            logger.error("❌ ERRO: {}", e.getMessage(), e);
            mensagens.add("❌ " + e.getMessage());
            resposta.put("sucesso", false);
            resposta.put("erro", e.getMessage());
            resposta.put("mensagens", mensagens);
            throw new RuntimeException(e.getMessage(), e);
        }
    }
    
    /**
     * Desvincula um documento RECEBER
     */
    private void desvinculaReceber(String filialRec, Integer seqRec, List<String> mensagens) {
        
        logger.info("  📋 RECEBER: Buscando documento...");
        
        String sqlBusca = "SELECT vlrdup_rec, vlrsal_rec FROM receber " +
                "WHERE filial_rec = ? AND seq_rec = ? AND dtpagi_rec IS NOT NULL";
        
        List<Map<String, Object>> result = jdbcTemplate.queryForList(sqlBusca, filialRec, seqRec);
        
        if (result.isEmpty()) {
            throw new RuntimeException("RECEBER não encontrado ou não está vinculado");
        }
        
        Map<String, Object> rec = result.get(0);
        Double vlrdup = ((Number) rec.get("vlrdup_rec")).doubleValue();
        Double vlrsal = ((Number) rec.get("vlrsal_rec")).doubleValue();
        
        logger.info("  ✓ Documento encontrado: vlrdup={}, vlrsal={}", vlrdup, vlrsal);
        
        // PASSO 1: Mover vlrsal de volta para vlrdup
        Double novoVlrdup = vlrdup + vlrsal;
        
        logger.info("  💰 PASSO 1: Movendo vlrsal para vlrdup (novo vlrdup={})", novoVlrdup);
        
        String sqlUpdate1 = "UPDATE receber SET vlrdup_rec = ?, vlrsal_rec = 0 " +
                "WHERE filial_rec = ? AND seq_rec = ?";
        
        jdbcTemplate.update(sqlUpdate1, novoVlrdup, filialRec, seqRec);
        mensagens.add("✓ PASSO 1: vlrdup atualizado (" + novoVlrdup + "), vlrsal zerado");
        
        // PASSO 2: Setar dtpagi_rec para NULL
        logger.info("  📅 PASSO 2: Setando dtpagi_rec para NULL");
        
        String sqlUpdate2 = "UPDATE receber SET dtpagi_rec = NULL " +
                "WHERE filial_rec = ? AND seq_rec = ?";
        
        jdbcTemplate.update(sqlUpdate2, filialRec, seqRec);
        mensagens.add("✓ PASSO 2: dtpagi_rec (data pagamento) setada para NULL");
        
        // PASSO 3: Setar dtpag_rec para NULL (campo DDMMAAAA legado)
        logger.info("  📅 PASSO 3: Setando dtpag_rec (DDMMAAAA) para NULL");
        
        String sqlUpdate3 = "UPDATE receber SET dtpag_rec = NULL " +
                "WHERE filial_rec = ? AND seq_rec = ?";
        
        jdbcTemplate.update(sqlUpdate3, filialRec, seqRec);
        mensagens.add("✓ PASSO 3: dtpag_rec (legado DDMMAAAA) setada para NULL");
        
        // PASSO 4: Setar seqcai_rec para NULL (remove vinculação com caixa)
        logger.info("  🔗 PASSO 4: Removendo vinculação com caixa (seqcai_rec=NULL)");
        
        String sqlUpdate4 = "UPDATE receber SET seqcai_rec = NULL " +
                "WHERE filial_rec = ? AND seq_rec = ?";
        
        jdbcTemplate.update(sqlUpdate4, filialRec, seqRec);
        mensagens.add("✓ PASSO 4: Vinculação com caixa removida");
        
        logger.info("  ✅ RECEBER desvinculado com sucesso!");
    }
    
    /**
     * Desvincula um documento PAGAR
     */
    private void desvinculaPagar(String filialPag, Integer seqPag, List<String> mensagens) {
        
        logger.info("  📋 PAGAR: Buscando documento...");
        
        String sqlBusca = "SELECT vlrdup_pag, vlrsal_pag FROM pagar " +
                "WHERE filial_pag = ? AND seq_pag = ? AND dtpagi_pag IS NOT NULL";
        
        List<Map<String, Object>> result = jdbcTemplate.queryForList(sqlBusca, filialPag, seqPag);
        
        if (result.isEmpty()) {
            throw new RuntimeException("PAGAR não encontrado ou não está vinculado");
        }
        
        Map<String, Object> pag = result.get(0);
        Double vlrdup = ((Number) pag.get("vlrdup_pag")).doubleValue();
        Double vlrsal = ((Number) pag.get("vlrsal_pag")).doubleValue();
        
        logger.info("  ✓ Documento encontrado: vlrdup={}, vlrsal={}", vlrdup, vlrsal);
        
        // PASSO 1: Mover vlrsal de volta para vlrdup
        Double novoVlrdup = vlrdup + vlrsal;
        
        logger.info("  💰 PASSO 1: Movendo vlrsal para vlrdup (novo vlrdup={})", novoVlrdup);
        
        String sqlUpdate1 = "UPDATE pagar SET vlrdup_pag = ?, vlrsal_pag = 0 " +
                "WHERE filial_pag = ? AND seq_pag = ?";
        
        jdbcTemplate.update(sqlUpdate1, novoVlrdup, filialPag, seqPag);
        mensagens.add("✓ PASSO 1: vlrdup atualizado (" + novoVlrdup + "), vlrsal zerado");
        
        // PASSO 2: Setar dtpagi_pag para NULL
        logger.info("  📅 PASSO 2: Setando dtpagi_pag para NULL");
        
        String sqlUpdate2 = "UPDATE pagar SET dtpagi_pag = NULL " +
                "WHERE filial_pag = ? AND seq_pag = ?";
        
        jdbcTemplate.update(sqlUpdate2, filialPag, seqPag);
        mensagens.add("✓ PASSO 2: dtpagi_pag (data pagamento) setada para NULL");
        
        // PASSO 3: Setar dtpag_pag para NULL (campo DDMMAAAA legado)
        logger.info("  📅 PASSO 3: Setando dtpag_pag (DDMMAAAA) para NULL");
        
        String sqlUpdate3 = "UPDATE pagar SET dtpag_pag = NULL " +
                "WHERE filial_pag = ? AND seq_pag = ?";
        
        jdbcTemplate.update(sqlUpdate3, filialPag, seqPag);
        mensagens.add("✓ PASSO 3: dtpag_pag (legado DDMMAAAA) setada para NULL");
        
        // PASSO 4: Setar seqcai_pag para NULL (remove vinculação com caixa)
        logger.info("  🔗 PASSO 4: Removendo vinculação com caixa (seqcai_pag=NULL)");
        
        String sqlUpdate4 = "UPDATE pagar SET seqcai_pag = NULL " +
                "WHERE filial_pag = ? AND seq_pag = ?";
        
        jdbcTemplate.update(sqlUpdate4, filialPag, seqPag);
        mensagens.add("✓ PASSO 4: Vinculação com caixa removida");
        
        logger.info("  ✅ PAGAR desvinculado com sucesso!");
    }
    
    /**
     * NOVO: Altera apenas o tipo de operação (dc_cai: C ↔ D)
     * 
     * NÃO deleta/reinser o lançamento, apenas UPDATE de dc_cai
     * NÃO afeta vinculação (receber/pagar)
     * DEVE recalcular caixacab da data alterada até o final
     * 
     * IMPORTANTE:
     * - dc_cai não faz parte da chave primária
     * - O impacto é APENAS nos saldos (caixacab)
     * - 'C' = Crédito (entrada), 'D' = Débito (saída)
     * 
     * Processo:
     * A) Buscar dc_cai atual e valor_cai
     * B) Calcular reversão do sinal antigo:
     *    - Se era 'C': remover do saldo (saldo -= valor)
     *    - Se era 'D': adicionar ao saldo (saldo += valor)
     * C) UPDATE caixa.dc_cai = novo_tipo
     * D) Reconstruir saldo com novo sinal:
     *    - Se novo 'C': adicionar (saldo += valor)
     *    - Se novo 'D': remover (saldo -= valor)
     * E) Propagar impacto para datas futuras
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> alterarTipoDcCaixa(
            String filialCai, String tipocaiCai, String clifornCai, String codbancoCai,
            Integer dtmoviCai, Integer seqCai, String novoTipoDc) {
        
        Map<String, Object> resposta = new HashMap<>();
        List<String> mensagens = new ArrayList<>();
        
        try {
            logger.info("═══════════════════════════════════════════════════════════");
            logger.info("🔄 INICIANDO ALTERAÇÃO DE TIPO (dc_cai: C ↔ D)");
            logger.info("   Chave: filial={}, tipocai={}, codbanco={}, dtmovi={}, seq={}",
                filialCai, tipocaiCai, codbancoCai, dtmoviCai, seqCai);
            logger.info("   Novo Tipo: {}", novoTipoDc);
            logger.info("═══════════════════════════════════════════════════════════");
            
            // PASSO A: Buscar dc_cai atual e valor_cai
            logger.info("\n✓ PASSO A: Buscando lançamento atual...");
            
            String sqlBusca = "SELECT dc_cai, valor_cai FROM caixa " +
                    "WHERE filial_cai = ? AND tipocai_cai = ? AND cliforn_cai = ? " +
                    "  AND codbanco_cai = ? AND dtmovi_cai = ? AND seq_cai = ?";
            
            List<Map<String, Object>> resultado = jdbcTemplate.queryForList(sqlBusca,
                filialCai, tipocaiCai, clifornCai, codbancoCai, dtmoviCai, seqCai);
            
            if (resultado.isEmpty()) {
                throw new RuntimeException("Lançamento não encontrado");
            }
            
            Map<String, Object> caixa = resultado.get(0);
            String dcCaiAtual = (String) caixa.get("dc_cai");
            Double valorCai = ((Number) caixa.get("valor_cai")).doubleValue();
            
            logger.info("  ✓ Lançamento encontrado: dc_cai={}, valor={}", dcCaiAtual, valorCai);
            
            if (dcCaiAtual.equals(novoTipoDc)) {
                throw new RuntimeException("Novo tipo é igual ao atual (" + dcCaiAtual + ")");
            }
            
            mensagens.add("✓ A: Lançamento encontrado (dc_cai=" + dcCaiAtual + " → " + novoTipoDc + ")");
            
            // PASSO B: Reverter saldo com sinal antigo
            logger.info("\n✓ PASSO B: Revertendo saldo com sinal antigo...");
            
            Double impactoReversao = "C".equals(dcCaiAtual) ? -valorCai : valorCai;
            
            String sqlReversao = "UPDATE caixacab SET saldo_cai = saldo_cai + ? " +
                    "WHERE filial_cai = ? AND tipocai_cai = ? AND codbanco_cai = ? AND dtmovi_cai >= ?";
            
            int linhasRevertidas = jdbcTemplate.update(sqlReversao,
                impactoReversao, filialCai, tipocaiCai, codbancoCai, dtmoviCai);
            
            logger.info("  ✓ Saldo revertido em {} linhas (impacto: {})", linhasRevertidas, impactoReversao);
            mensagens.add("✓ B: Saldo revertido (" + linhasRevertidas + " registros)");
            
            // PASSO C: UPDATE caixa.dc_cai
            logger.info("\n✓ PASSO C: Atualizando dc_cai...");
            
            String sqlUpdate = "UPDATE caixa SET dc_cai = ? " +
                    "WHERE filial_cai = ? AND tipocai_cai = ? AND cliforn_cai = ? " +
                    "  AND codbanco_cai = ? AND dtmovi_cai = ? AND seq_cai = ?";
            
            int linhasAtualizadas = jdbcTemplate.update(sqlUpdate,
                novoTipoDc, filialCai, tipocaiCai, clifornCai, codbancoCai, dtmoviCai, seqCai);
            
            logger.info("  ✓ dc_cai atualizado em {} linhas", linhasAtualizadas);
            mensagens.add("✓ C: dc_cai atualizado");
            
            // PASSO D: Reconstruir saldo com novo sinal
            logger.info("\n✓ PASSO D: Reconstruindo saldo com novo sinal...");
            
            Double impactoNovo = "C".equals(novoTipoDc) ? valorCai : -valorCai;
            
            String sqlReconstruir = "UPDATE caixacab SET saldo_cai = saldo_cai + ? " +
                    "WHERE filial_cai = ? AND tipocai_cai = ? AND codbanco_cai = ? AND dtmovi_cai >= ?";
            
            int linhasReconstruidas = jdbcTemplate.update(sqlReconstruir,
                impactoNovo, filialCai, tipocaiCai, codbancoCai, dtmoviCai);
            
            logger.info("  ✓ Saldo reconstruído em {} linhas (impacto: {})", linhasReconstruidas, impactoNovo);
            mensagens.add("✓ D: Saldo reconstruído (" + linhasReconstruidas + " registros)");
            
            // PASSO E: Verificar se precisa atualizar caixacab da mesma data
            logger.info("\n✓ PASSO E: Verificando caixacab da mesma data...");
            
            String sqlVerificaCaixacab = "SELECT COUNT(*) FROM caixacab " +
                    "WHERE filial_cai = ? AND tipocai_cai = ? AND codbanco_cai = ? AND dtmovi_cai = ?";
            
            Integer countCaixacab = jdbcTemplate.queryForObject(sqlVerificaCaixacab, Integer.class,
                filialCai, tipocaiCai, codbancoCai, dtmoviCai);
            
            if (countCaixacab > 0) {
                logger.info("  ✓ Registro caixacab da mesma data encontrado");
                mensagens.add("✓ E: caixacab da mesma data atualizado");
            } else {
                logger.info("  ⚠️  Nenhum caixacab da mesma data (será criado no próximo consolidação)");
                mensagens.add("⚠️  E: caixacab não existia (criará na próxima consolidação)");
            }
            
            logger.info("\n✅ SUCESSO!\n");
            
            resposta.put("sucesso", true);
            resposta.put("mensagens", mensagens);
            resposta.put("dcCaiAtual", dcCaiAtual);
            resposta.put("novoTipoDc", novoTipoDc);
            resposta.put("valorCai", valorCai);
            resposta.put("linhasAtualizadas", linhasAtualizadas);
            resposta.put("linhasImpactadas", linhasRevertidas + linhasReconstruidas);
            
            return resposta;
            
        } catch (Exception e) {
            logger.error("❌ ERRO: {}", e.getMessage(), e);
            mensagens.add("❌ " + e.getMessage());
            resposta.put("sucesso", false);
            resposta.put("erro", e.getMessage());
            resposta.put("mensagens", mensagens);
            throw new RuntimeException(e.getMessage(), e);
        }
    }
}
