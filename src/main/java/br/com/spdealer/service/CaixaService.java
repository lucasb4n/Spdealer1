package br.com.spdealer.service;

import br.com.spdealer.model.Caixa;
import br.com.spdealer.repository.CaixaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaixaService {

    private final CaixaRepository caixaRepository;
    private final JdbcTemplate jdbcTemplate;
    private final CaixacabService caixacabService;

    // ========== CRUD ==========

    @Transactional(readOnly = true)
    public Page<Caixa> listarLancamentos(Pageable pageable) {
        log.info("[CaixaService] Listando lancamentos com paginacao");
        return caixaRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Optional<Caixa> obterPorId(Long id) {
        log.info("[CaixaService] Buscando lancamento por ID: {}", id);
        return caixaRepository.findById(id);
    }

    @Transactional
    public Caixa criarLancamento(Caixa caixa) {
        log.info("[CaixaService] Criando novo lancamento");
        validarLancamento(caixa);
        return caixaRepository.save(caixa);
    }

    @Transactional
    public Caixa atualizarLancamento(Long id, Caixa caixaAtualizado) {
        log.info("[CaixaService] Atualizando lancamento ID: {}", id);
        return caixaRepository.findById(id).map(caixa -> {
            validarLancamento(caixaAtualizado);
            // Propagar ajuste no consolidado antes de salvar a nova versão
            caixacabService.propagarAlteracaoLegacy(caixa, caixaAtualizado);

            caixa.setDtmoviCai(caixaAtualizado.getDtmoviCai());
            caixa.setDcCai(caixaAtualizado.getDcCai());
            caixa.setValorCai(caixaAtualizado.getValorCai());
            caixa.setBancoCai(caixaAtualizado.getBancoCai());
            caixa.setHistoricoCai(caixaAtualizado.getHistoricoCai());
            return caixaRepository.save(caixa);
        }).orElseThrow(() -> {
            log.error("[CaixaService] Lancamento nao encontrado: {}", id);
            return new RuntimeException("Lancamento nao encontrado");
        });
    }

    @Transactional
    public void deletarLancamento(Long id) {
        deletarLancamento(id, null);
    }

    @Transactional
    public void deletarLancamento(Long id, Map<String, Object> dadosExclusao) {
        log.info("[CaixaService] Deletando lancamento ID: {}", id);
        
        // Buscar registro ANTIGO para audit log e propagação
        Caixa caixaAntigo = caixaRepository.findById(id).orElse(null);
        if (caixaAntigo == null) {
            throw new IllegalArgumentException("Lançamento não encontrado: " + id);
        }
        
        String filialLog = dadosExclusao != null ? dadosExclusao.getOrDefault("filial_cai", "001").toString() : "001";
        String usuarioLog = dadosExclusao != null ? dadosExclusao.getOrDefault("usuario_log", "SYSTEM").toString() : "SYSTEM";
        
        // Criar "novo" caixa com valor 0 para reverter o efeito (delta = -valor original)
        Caixa caixaZero = Caixa.builder()
            .seqCai(caixaAntigo.getSeqCai())
            .filialCai(caixaAntigo.getFilialCai())
            .bancoCai(caixaAntigo.getBancoCai())
            .dtmoviCai(caixaAntigo.getDtmoviCai())
            .dcCai(caixaAntigo.getDcCai())
            .valorCai(BigDecimal.ZERO)
            .historicoCai(caixaAntigo.getHistoricoCai())
            .build();
        
        // Propagar a exclusão para caixacab (reverter o saldo)
        caixacabService.propagarAlteracao(caixaAntigo, caixaZero, filialLog, usuarioLog);
        
        // Registrar AUDIT LOG de exclusão (oper_log = "03")
        String historicoLog = String.format(
            "Exclusao do lancamento: seq_cai=%d, banco=%s, dtmovi=%s, dc=%s, valor=R$ %s, historico='%s'",
            id,
            caixaAntigo.getBancoCai(),
            caixaAntigo.getDtmoviCai(),
            caixaAntigo.getDcCai(),
            formatarMoedaBR(caixaAntigo.getValorCai()),
            caixaAntigo.getHistoricoCai() != null ? caixaAntigo.getHistoricoCai() : ""
        );
        insertCaixaAuditLog(filialLog, usuarioLog, "CAI001", "03", historicoLog, id);
        
        caixaRepository.deleteById(id);
    }

    // ========== VALIDACAO ==========

    private void validarLancamento(Caixa caixa) {
        if (caixa.getDtmoviCai() == null) {
            throw new IllegalArgumentException("Data e obrigatoria");
        }
        if (caixa.getDcCai() == null || !caixa.getDcCai().matches("[DC]")) {
            throw new IllegalArgumentException("Tipo deve ser D ou C");
        }
        if (caixa.getValorCai() == null || caixa.getValorCai().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor deve ser maior que zero");
        }
        if (caixa.getBancoCai() == null || caixa.getBancoCai().trim().isEmpty()) {
            throw new IllegalArgumentException("Banco e obrigatorio");
        }
        log.info("[CaixaService] Validacao OK: banco={}, valor={}", 
                 caixa.getBancoCai(), caixa.getValorCai());
    }

    // ========== DINAMICAS ==========

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarOperacoes() {
        log.info("[CaixaService] Buscando operacoes");
        try {
            String sql = "SELECT operacao_ocai as codigo, descr_ocai as descricao " +
                         "FROM mascai WHERE filial_ocai = '001' ORDER BY descr_ocai ASC";
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao buscar operacoes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarDepartamentos() {
        log.info("[CaixaService] Buscando departamentos");
        try {
            String sql = "SELECT codigo_scd as codigo, descr_scd as descricao " +
                         "FROM scodep WHERE empre_scd = 1 AND md_scd = 'D' " +
                         "ORDER BY descr_scd ASC";
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao buscar departamentos: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> buscarClientesFornecedores(String tipo, String filtro) {
        log.info("[CaixaService] Buscando {} com filtro: {}", tipo, filtro);
        try {
            String sql;
            if ("C".equalsIgnoreCase(tipo)) {
                sql = "SELECT codigo as id, nome_fantasia as nome FROM clientes " +
                      "WHERE nome_fantasia LIKE ? LIMIT 10";
                return jdbcTemplate.queryForList(sql, "%" + filtro + "%");
            } else if ("F".equalsIgnoreCase(tipo)) {
                sql = "SELECT codigo as id, nome_fantasia as nome FROM fornecedores " +
                      "WHERE nome_fantasia LIKE ? LIMIT 10";
                return jdbcTemplate.queryForList(sql, "%" + filtro + "%");
            }
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao buscar clientes/fornecedores: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // ========== SALDO ==========

    @Transactional(readOnly = true)
    public Map<String, Object> obterSaldoConsolidado(String banco, LocalDate data) {
        log.info("[CaixaService] Consultando saldo consolidado banco: {} data: {}", banco, data);
        try {
            // 🔧 CRÍTICO: Buscar ÚLTIMO registro de caixacab (saldo mais recente)
            // caixacab é atualizado a cada movimento, então MAX(dtmovi_cai) = saldo atual
            String sql = "SELECT codbanco_cai, saldo_cai as saldoAtual, dtmovi_cai " +
                         "FROM caixacab " +
                         "WHERE filial_cai = '001' AND codbanco_cai = ? " +
                         "ORDER BY dtmovi_cai DESC " +
                         "LIMIT 1";
            List<Map<String, Object>> result = jdbcTemplate.queryForList(sql, banco);
            
            if (result.isEmpty()) {
                log.warn("[CaixaService] Nenhum saldo encontrado para banco: {}", banco);
                return new HashMap<>();
            }
            
            Map<String, Object> saldo = result.get(0);
            log.info("[CaixaService] Saldo encontrado: {} - R$ {}", banco, saldo.get("saldoAtual"));
            return saldo;
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao obter saldo: {}", e.getMessage());
            e.printStackTrace();
            return new HashMap<>();
        }
    }

    // ========== TITULOS ==========

    @Transactional(readOnly = true)
    public List<Map<String, Object>> buscarTitulosAbertos(String tipo, String clienteFornecedorId) {
        log.info("[CaixaService] Buscando titulos abertos tipo: {} cliente: {}", tipo, clienteFornecedorId);
        try {
            String sql;
            if ("R".equalsIgnoreCase(tipo)) {
                sql = "SELECT id, numero, valor, vencimento FROM contas_receber " +
                      "WHERE cliente_id = ? AND pago = 0 ORDER BY vencimento ASC";
                return jdbcTemplate.queryForList(sql, clienteFornecedorId);
            } else if ("P".equalsIgnoreCase(tipo)) {
                sql = "SELECT id, numero, valor, vencimento FROM contas_pagar " +
                      "WHERE fornecedor_id = ? AND pago = 0 ORDER BY vencimento ASC";
                return jdbcTemplate.queryForList(sql, clienteFornecedorId);
            }
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao buscar titulos: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // ========== CONFERENCIA ==========

    @Transactional(readOnly = true)
    public Map<String, Object> validarConferencia(BigDecimal valorLancado, 
                                                   List<Long> documentoIds, 
                                                   String tipo) {
        log.info("[CaixaService] Validando conferencia valor: {} documentos: {}", 
                 valorLancado, documentoIds.size());
        
        BigDecimal somaDocumentos = calcularSomaDocumentos(documentoIds, tipo);
        
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("valor_lancado", valorLancado);
        resultado.put("soma_documentos", somaDocumentos);
        resultado.put("diferenca", valorLancado.subtract(somaDocumentos));
        resultado.put("conferencia_ok", valorLancado.compareTo(somaDocumentos) == 0);
        
        log.info("[CaixaService] Conferencia resultado: OK={}", resultado.get("conferencia_ok"));
        return resultado;
    }

    @Transactional(readOnly = true)
    public BigDecimal calcularSomaDocumentos(List<Long> documentoIds, String tipo) {
        log.info("[CaixaService] Calculando soma documentos tipo: {}", tipo);
        try {
            if (documentoIds == null || documentoIds.isEmpty()) {
                return BigDecimal.ZERO;
            }
            
            String placeholders = String.join(",", Collections.nCopies(documentoIds.size(), "?"));
            String sql;
            
            if ("R".equalsIgnoreCase(tipo)) {
                sql = "SELECT COALESCE(SUM(valor), 0) as total FROM contas_receber " +
                      "WHERE id IN (" + placeholders + ")";
            } else if ("P".equalsIgnoreCase(tipo)) {
                sql = "SELECT COALESCE(SUM(valor), 0) as total FROM contas_pagar " +
                      "WHERE id IN (" + placeholders + ")";
            } else {
                return BigDecimal.ZERO;
            }
            
            Number result = jdbcTemplate.queryForObject(sql, documentoIds.toArray(), Number.class);
            return new BigDecimal(result.toString());
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao calcular soma: {}", e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    // ========== COMPATIBILIDADE COM CAIXA CONTROLLER (API legada) ==========

    @Transactional(readOnly = true)
    public List<Map<String, Object>> buscarMovimentos(String dataInicial, String dataFinal,
                                                      String codbanco_cai, String tipocai_cai,
                                                      String empresaGer) {
        log.info("[CaixaService] buscarMovimentos - de {} até {}, banco={}, tipo={}",
                 dataInicial, dataFinal, codbanco_cai, tipocai_cai);
        try {
            StringBuilder sql = new StringBuilder();
            sql.append("SELECT dtmovi_cai as dtmovi_cai, ")
                .append("c.codbanco_cai as codbanco_cai, b.nomefan_bco as nomefan_bco, ")
                .append("dc_cai as dc_cai, valor_cai as valor_cai, seq_cai as seq_cai, histor_cai as histor_cai, ")
                .append("c.filial_cai as filial_cai, c.tipocai_cai as tipocai_cai, c.cliforn_cai as cliforn_cai, ")
                .append("c.clifor_cai as clifor_cai, c.operacao_cai as operacao_cai, c.dpto_cai as dpto_cai, ")
                .append("COALESCE(cli.nomfan_cli, cli.nome_cli, '') AS nome_cli ")
                .append("FROM caixa c LEFT JOIN bancos b ON c.codbanco_cai = b.codigo_bco AND b.empresa_ger = ? ")
                .append("LEFT JOIN clientes cli ON TRIM(c.clifor_cai) = TRIM(cli.codigo_cli) ")
                .append("WHERE dtmovi_cai BETWEEN ? AND ? ");

            List<Object> params = new ArrayList<>();
            // empresaGer (empresa_ger) é o primeiro parâmetro por conta do JOIN
            params.add(empresaGer);
            params.add(LocalDate.parse(dataInicial));
            params.add(LocalDate.parse(dataFinal));

            if (codbanco_cai != null && !codbanco_cai.trim().isEmpty()) {
                sql.append(" AND c.codbanco_cai = ?");
                params.add(codbanco_cai);
            }

            if (tipocai_cai != null && !tipocai_cai.trim().isEmpty()) {
                sql.append(" AND dc_cai = ?");
                params.add(tipocai_cai);
            }

            sql.append(" ORDER BY dtmovi_cai DESC, seq_cai DESC");

            return jdbcTemplate.queryForList(sql.toString(), params.toArray());
        } catch (Exception e) {
            log.error("[CaixaService] Erro buscarMovimentos: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    @Transactional
    public Map<String, Object> criarMovimento(Map<String, Object> dadosCaixa) {
        log.info("[CaixaService] criarMovimento payload: {}", dadosCaixa);
        try {
            Caixa caixa = mapToCaixa(dadosCaixa, null);
            Caixa criado = criarLancamento(caixa);
            
            // Registrar AUDIT LOG de criação (oper_log = "01")
            String filialLog = dadosCaixa.getOrDefault("filial_cai", "001").toString();
            String usuarioLog = dadosCaixa.getOrDefault("usuario_log", "SYSTEM").toString();
            String historicoLog = String.format(
                "Inclusao do lancamento: seq_cai=%d, banco=%s, dtmovi=%s, dc=%s, valor=R$ %s, historico='%s'",
                criado.getSeqCai(),
                criado.getBancoCai(),
                criado.getDtmoviCai(),
                criado.getDcCai(),
                formatarMoedaBR(criado.getValorCai()),
                criado.getHistoricoCai() != null ? criado.getHistoricoCai() : ""
            );
            insertCaixaAuditLog(filialLog, usuarioLog, "CAI001", "01", historicoLog, criado.getSeqCai());
            
            Map<String, Object> resp = new HashMap<>();
            resp.put("sucesso", true);
            resp.put("lancamentoCaixaId", criado.getSeqCai());
            resp.put("lancamento", criado);
            return resp;
        } catch (IllegalArgumentException e) {
            log.error("[CaixaService] Erro validação criarMovimento: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[CaixaService] Erro criarMovimento: {}", e.getMessage());
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    @Transactional
    public Map<String, Object> atualizarMovimento(Map<String, Object> dadosCaixa) {
        log.info("[CaixaService] atualizarMovimento payload: {}", dadosCaixa);
        try {
            // Aceitar tanto "id" quanto "seq_cai" como identificador
            Object idObj = dadosCaixa.get("id");
            if (idObj == null) {
                idObj = dadosCaixa.get("seq_cai");
            }
            if (idObj == null) {
                throw new IllegalArgumentException("ID ou seq_cai do movimento é obrigatório para atualizar");
            }
            Long id = Long.valueOf(idObj.toString());
            
            // Buscar os valores originais da chave composta no payload para localizar o registro exato
            Object origBancoObj = dadosCaixa.get("original_codbanco_cai");
            Object origDataObj = dadosCaixa.get("original_dtmovi_cai");
            Object origFilialObj = dadosCaixa.get("original_filial_cai");
            
            String origBanco = origBancoObj != null ? origBancoObj.toString() : 
                               (dadosCaixa.get("codbanco_cai") != null ? dadosCaixa.get("codbanco_cai").toString() : null);
            
            String origDataStr = origDataObj != null ? origDataObj.toString() : 
                                 (dadosCaixa.get("dtmovi_cai") != null ? dadosCaixa.get("dtmovi_cai").toString() : null);
            
            String origFilial = origFilialObj != null ? origFilialObj.toString() : 
                                 (dadosCaixa.get("filial_cai") != null ? dadosCaixa.get("filial_cai").toString() : "001");
            
            List<Map<String, Object>> rows = new ArrayList<>();
            if (origBanco != null && origDataStr != null) {
                String sqlFind = "SELECT filial_cai, tipocai_cai, cliforn_cai, codbanco_cai, dtmovi_cai, seq_cai, " +
                                 "dc_cai, valor_cai, dpto_cai, histor_cai, operacao_cai, histcont_cai, clifor_cai " +
                                 "FROM caixa " +
                                 "WHERE (seq_cai = ? OR CAST(seq_cai AS UNSIGNED) = ?) " +
                                 "  AND codbanco_cai = ? AND dtmovi_cai = ? AND filial_cai = ?";
                rows = jdbcTemplate.queryForList(sqlFind, 
                    String.format("%04d", id.intValue()), 
                    id,
                    origBanco, 
                    LocalDate.parse(origDataStr), 
                    origFilial
                );
            }
            
            // Fallback: se não encontrar com a chave cheia ou os originais não foram passados, buscar pelo seq_cai (pode trazer duplicados se houver sujeira)
            if (rows.isEmpty()) {
                log.warn("[CaixaService] Não foi possível localizar o movimento pela chave composta. Usando fallback por seq_cai: {}", id);
                String sqlFindFallback = "SELECT filial_cai, tipocai_cai, cliforn_cai, codbanco_cai, dtmovi_cai, seq_cai, " +
                                         "dc_cai, valor_cai, dpto_cai, histor_cai, operacao_cai, histcont_cai, clifor_cai " +
                                         "FROM caixa " +
                                         "WHERE seq_cai = ? OR CAST(seq_cai AS UNSIGNED) = ?";
                rows = jdbcTemplate.queryForList(sqlFindFallback, String.format("%04d", id.intValue()), id);
            }
            
            if (rows.isEmpty()) {
                throw new IllegalArgumentException("Movimento não encontrado: " + id);
            }
            
            // Pegar o primeiro registro retornado
            Map<String, Object> row = rows.get(0);
            
            // Construir o objeto CaixaAntigo manualmente a partir dos dados do banco para auditoria e propagação
            Caixa caixaAntigo = new Caixa();
            caixaAntigo.setSeqCai(id);
            caixaAntigo.setFilialCai(row.get("filial_cai") != null ? row.get("filial_cai").toString() : "001");
            caixaAntigo.setBancoCai(row.get("codbanco_cai") != null ? row.get("codbanco_cai").toString() : "");
            
            if (row.get("dtmovi_cai") != null) {
                caixaAntigo.setDtmoviCai(LocalDate.parse(row.get("dtmovi_cai").toString()));
            }
            caixaAntigo.setDcCai(row.get("dc_cai") != null ? row.get("dc_cai").toString() : "");
            caixaAntigo.setValorCai(row.get("valor_cai") != null ? new BigDecimal(row.get("valor_cai").toString()) : BigDecimal.ZERO);
            
            if (row.get("clifor_cai") != null) {
                caixaAntigo.setClienteCai(row.get("clifor_cai").toString());
            }
            if (row.get("dpto_cai") != null) {
                caixaAntigo.setDeptoCai(row.get("dpto_cai").toString());
            }
            if (row.get("histor_cai") != null) {
                caixaAntigo.setHistoricoCai(row.get("histor_cai").toString());
            }
            if (row.get("operacao_cai") != null) {
                caixaAntigo.setOperacaoCai(row.get("operacao_cai").toString());
            }
            if (row.get("histcont_cai") != null) {
                caixaAntigo.setHistoricoContabil(row.get("histcont_cai").toString());
            }
            
            // Construir histórico detalhado das alterações
            String historicoLog = construirHistoricoAlteracao(caixaAntigo, dadosCaixa);
            
            // Registrar AUDIT LOG na tabela log existente
            String filialLog = dadosCaixa.getOrDefault("filial_cai", "001").toString();
            String usuarioLog = dadosCaixa.getOrDefault("usuario_log", "SYSTEM").toString();
            insertCaixaAuditLog(filialLog, usuarioLog, "CAI001", "02", historicoLog, id);
            
            Caixa caixaAtualizado = mapToCaixa(dadosCaixa, id);
            
            // Propagar saldo ANTES de salvar (com estatísticas e logs de auditoria)
            CaixacabService.PropagacaoResult propagResult = caixacabService.propagarAlteracao(caixaAntigo, caixaAtualizado, filialLog, usuarioLog);
            
            // Salvar alterações do caixa via direct JDBC Update usando a chave primária composta completa
            String sqlUpdate = "UPDATE caixa SET " +
                               "  dtmovi_cai = ?, " +
                               "  dc_cai = ?, " +
                               "  valor_cai = ?, " +
                               "  codbanco_cai = ?, " +
                               "  histor_cai = ?, " +
                               "  oper_cai = ?, " +
                               "  operacao_cai = ?, " +
                               "  dpto_cai = ?, " +
                               "  clifor_cai = ?, " +
                               "  credcli_cai = ?, " +
                               "  histcont_cai = ? " +
                               "WHERE filial_cai = ? " +
                               "  AND tipocai_cai = ? " +
                               "  AND cliforn_cai = ? " +
                               "  AND (seq_cai = ? OR CAST(seq_cai AS UNSIGNED) = ?) " +
                               "  AND codbanco_cai = ? " +
                               "  AND dtmovi_cai = ?";
                 
            jdbcTemplate.update(sqlUpdate, 
                caixaAtualizado.getDtmoviCai(),
                caixaAtualizado.getDcCai(),
                caixaAtualizado.getValorCai(),
                caixaAtualizado.getBancoCai(),
                caixaAtualizado.getHistoricoCai(),
                buscarDescricaoOperacao(caixaAtualizado.getOperacaoCai()),
                caixaAtualizado.getOperacaoCai(),
                caixaAtualizado.getDeptoCai(),
                caixaAtualizado.getClienteCai(),
                caixaAtualizado.getCredcliCai(),
                caixaAtualizado.getHistoricoContabil(),
                
                row.get("filial_cai") != null ? row.get("filial_cai").toString() : "001",
                row.get("tipocai_cai") != null ? row.get("tipocai_cai").toString() : "001",
                row.get("cliforn_cai") != null ? row.get("cliforn_cai").toString() : "   ",
                String.format("%04d", id.intValue()), 
                id,
                row.get("codbanco_cai").toString(),
                LocalDate.parse(row.get("dtmovi_cai").toString())
            );
            
            // 3. Atualizar/vincular documentos selecionados (estornar antigos, vincular novos)
            try {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> documentosSelecionados = 
                    (List<Map<String, Object>>) dadosCaixa.get("documentos_selecionados");

                // 3.1 Estornar vínculos antigos (tanto em receber quanto pagar) para este lançamento
                int oldSeq = caixaAntigo.getSeqCai().intValue();
                int oldOper = 0;
                try {
                    if (caixaAntigo.getOperacaoCai() != null && !caixaAntigo.getOperacaoCai().trim().isEmpty()) {
                        oldOper = Integer.parseInt(caixaAntigo.getOperacaoCai().trim());
                    }
                } catch (Exception e) {
                    log.warn("[CaixaService] Nao foi possivel converter operacao antiga para inteiro: {}", caixaAntigo.getOperacaoCai());
                }

                int oldBancoInt = 0;
                try {
                    if (caixaAntigo.getBancoCai() != null) {
                        oldBancoInt = Integer.parseInt(caixaAntigo.getBancoCai().trim());
                    }
                } catch (Exception e) {
                    log.warn("[CaixaService] Nao foi possivel converter banco antigo para inteiro: {}", caixaAntigo.getBancoCai());
                }

                String oldData = caixaAntigo.getDtmoviCai() != null ? caixaAntigo.getDtmoviCai().toString() : null;

                if (oldData != null && oldBancoInt > 0) {
                    log.info("[CaixaService] Desvinculando documentos antigos do caixa: banco={}, operacao={}, sequencia={}, data={}", 
                        oldBancoInt, oldOper, oldSeq, oldData);
                    
                    // Estornar Contas a Receber
                    // NOTA: vlrsal_rec = vlrsal_rec + vlrpag_rec restaura o saldo somando o valor pago de volta ao saldo atual
                    String sqlEstornoRec = "UPDATE receber SET cxbco_rec = NULL, opercai_rec = NULL, seqcai_rec = NULL, " +
                                           "dtpagi_rec = NULL, dtpag_rec = NULL, vlrpag_rec = NULL, vlracre_rec = NULL, vlrdesc_rec = NULL, " +
                                           "vlrsal_rec = vlrsal_rec + vlrpag_rec " +
                                           "WHERE cxbco_rec = ? AND seqcai_rec = ? AND dtpagi_rec = ? AND filial_rec = '001'";
                    jdbcTemplate.update(sqlEstornoRec, oldBancoInt, oldSeq, oldData);

                    // Estornar Contas a Pagar
                    String sqlEstornoPag = "UPDATE pagar SET cxbco_pag = NULL, opercai_pag = NULL, seqcai_pag = NULL, " +
                                           "dtpagi_pag = NULL, dtpag_pag = NULL, vlrpag_pag = NULL, vlracre_pag = NULL, vlrdesc_pag = NULL, " +
                                           "vlrsal_pag = vlrsal_pag + vlrpag_pag " +
                                           "WHERE cxbco_pag = ? AND seqcai_pag = ? AND dtpagi_pag = ? AND filial_pag = '001'";
                    jdbcTemplate.update(sqlEstornoPag, oldBancoInt, oldSeq, oldData);
                }

                // 3.2 Vincular os novos documentos selecionados (se houver no payload)
                java.util.List<String> docIdsStr = new java.util.ArrayList<>();
                if (documentosSelecionados != null && !documentosSelecionados.isEmpty()) {
                    log.info("[CaixaService] Vinculando {} novos documentos ao caixa atualizado", documentosSelecionados.size());
                    
                    String newBanco = caixaAtualizado.getBancoCai(); // e.g. "00003"
                    int newBancoInt = Integer.parseInt(newBanco.trim());
                    int newSeq = caixaAtualizado.getSeqCai().intValue();
                    String newDateStr = caixaAtualizado.getDtmoviCai().toString(); // YYYY-MM-DD
                    
                    String[] partesData = newDateStr.split("-");
                    String newDateDDMMAAAA = partesData[2] + partesData[1] + partesData[0];
                    
                    String newOper = caixaAtualizado.getOperacaoCai(); // e.g. "001"
                    
                    for (Map<String, Object> doc : documentosSelecionados) {
                        Object docIdObj = doc.get("id");
                        if (docIdObj == null) continue;
                        
                        Long docId = Long.valueOf(docIdObj.toString());
                        
                        Object valSelObj = doc.get("valor_selecionado");
                        double valorSelecionado = valSelObj != null ? Double.parseDouble(valSelObj.toString()) : 0.0;
                        
                        Object acreObj = doc.get("acrescimo");
                        double acrescimo = acreObj != null ? Double.parseDouble(acreObj.toString()) : 0.0;

                        Object descObj = doc.get("desconto");
                        double desconto = descObj != null ? Double.parseDouble(descObj.toString()) : 0.0;

                        Object multaObj = doc.get("multa");
                        double multa = multaObj != null ? Double.parseDouble(multaObj.toString()) : 0.0;
                        
                        String docTipo = doc.getOrDefault("tipo", "R").toString(); // 'R' ou 'P'
                        
                        String tabela = docTipo.equals("R") ? "receber" : "pagar";
                        String campoId = docTipo.equals("R") ? "receber_id" : "pagar_id";
                        String suf = docTipo.equals("R") ? "rec" : "pag";
                        
                        log.info("[CaixaService] Atualizando vinculo do documento: tabela={}, id={}, valor_selecionado={}", 
                            tabela, docId, valorSelecionado);

                        // ⚠️ Multi-movement check: verificar se documento já está vinculado a OUTRO movimento
                        String sqlCheckVinculo = "SELECT cxbco_" + suf + ", seqcai_" + suf +
                                                 " FROM " + tabela + " WHERE " + campoId + " = ?";
                        Map<String, Object> rowVinculo = null;
                        try {
                            rowVinculo = jdbcTemplate.queryForMap(sqlCheckVinculo, docId);
                        } catch (Exception ignored) {}
                        if (rowVinculo != null) {
                            Object existingCxbco = rowVinculo.get("cxbco_" + suf);
                            Object existingSeqcai = rowVinculo.get("seqcai_" + suf);
                            if (existingCxbco != null && existingSeqcai != null) {
                                int existingCxbcoInt = Integer.parseInt(existingCxbco.toString().trim());
                                int existingSeqcaiInt = Integer.parseInt(existingSeqcai.toString().trim());
                                // Se é diferente do nosso caixa, significa que o estorno não limpou (outro movimento sobrescreveu)
                                if (existingCxbcoInt != newBancoInt || existingSeqcaiInt != newSeq) {
                                    throw new IllegalArgumentException(
                                        "Documento " + docId + " já está vinculado ao movimento " +
                                        "cxbco=" + existingCxbcoInt + ", seq=" + existingSeqcaiInt + ". " +
                                        "Estorne o movimento anterior antes de vincular a um novo caixa."
                                    );
                                }
                            }
                        }
                            
                        // Column name differs: receber uses 'vlrmulta', pagar uses 'vlrmult'
                        String colMulta = suf.equals("rec") ? "vlrmulta_" : "vlrmult_";

                        String sqlLink = "UPDATE " + tabela + " SET " +
                                         "  vlrpag_" + suf + " = COALESCE(vlrpag_" + suf + ", 0) + ?, " +
                                         "  vlrsal_" + suf + " = vlrsal_" + suf + " - ?, " +
                                         "  vlracre_" + suf + " = COALESCE(vlracre_" + suf + ", 0) + ?, " +
                                         "  " + colMulta + suf + " = COALESCE(" + colMulta + suf + ", 0) + ?, " +
                                         "  vlrdesc_" + suf + " = COALESCE(vlrdesc_" + suf + ", 0) + ?, " +
                                         "  dtpag_" + suf + " = ?, " +
                                         "  dtpagi_" + suf + " = ?, " +
                                         "  cxbco_" + suf + " = ?, " +
                                         "  opercai_" + suf + " = ?, " +
                                         "  seqcai_" + suf + " = ? " +
                                         "WHERE " + campoId + " = ? AND filial_" + suf + " = '001'";

                        jdbcTemplate.update(sqlLink,
                            valorSelecionado, // vlrpag
                            valorSelecionado, // vlrsal
                            acrescimo, // vlracre
                            multa, // multa
                            desconto, // vlrdesc
                            newDateDDMMAAAA, // dtpag (DDMMAAAA)
                            newDateStr, // dtpagi (YYYY-MM-DD)
                            newBancoInt, // cxbco
                            newOper, // opercai
                            newSeq, // seqcai
                            docId // WHERE
                        );
                        
                        docIdsStr.add(docTipo + ":" + docId);
                    }
                    
                    // Store doc IDs in histor_cai for future estorno
                    try {
                        String historicoAtual = caixaAtualizado.getHistoricoCai();
                        String docsSuffix = " [Docs: " + String.join(",", docIdsStr) + "]";
                        String novoHistorico = historicoAtual != null ? historicoAtual + docsSuffix : docsSuffix;
                        String sqlUpdateHist = "UPDATE caixa SET histor_cai = ? " +
                                               "WHERE seq_cai = ? AND codbanco_cai = ? AND dtmovi_cai = ? AND filial_cai = '001'";
                        jdbcTemplate.update(sqlUpdateHist, novoHistorico, (long) newSeq, newBancoInt, newDateStr);
                    } catch (Exception e) {
                        log.warn("[CaixaService] Nao foi possivel armazenar IDs dos docs no histor_cai: {}", e.getMessage());
                    }
                }
            } catch (Exception e) {
                log.error("[CaixaService] Erro ao atualizar vinculos de documentos no atualizarMovimento: {}", e.getMessage(), e);
            }
            
            Map<String, Object> resp = new HashMap<>();
            resp.put("sucesso", true);
            resp.put("lancamentoCaixaId", id);
            resp.put("seq_cai", id);
            resp.put("lancamento", caixaAtualizado);
            resp.put("propagacao", Map.of(
                "sucesso", propagResult.isSucesso(),
                "mensagem", propagResult.getMensagem(),
                "linhasAfetadas", propagResult.getLinhasAfetadas()
            ));
            return resp;
        } catch (IllegalArgumentException e) {
            log.error("[CaixaService] Erro validação atualizarMovimento: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("[CaixaService] Erro atualizarMovimento: {}", e.getMessage());
            throw new RuntimeException(e.getMessage(), e);
        }
    }
    
    /**
     * Constrói histórico detalhado das alterações em formato legível
     */
    private String construirHistoricoAlteracao(Caixa antigo, Map<String, Object> dados) {
        StringBuilder sb = new StringBuilder();
        boolean primeiro = true;
        
        // Alteração de valor
        String novoValorStr = dados.getOrDefault("valor_cai", antigo.getValorCai().toString()).toString();
        if (!antigo.getValorCai().toString().equals(novoValorStr)) {
            sb.append("Alteração no campo Valor de R$ ").append(formatarMoedaBR(antigo.getValorCai()))
              .append(" para R$ ").append(formatarMoedaBR(new java.math.BigDecimal(novoValorStr)));
            primeiro = false;
        }
        
        // Alteração de histórico
        String novoHistorico = dados.getOrDefault("historico_cai", antigo.getHistoricoCai() != null ? antigo.getHistoricoCai() : "").toString();
        String antigoHistorico = antigo.getHistoricoCai() != null ? antigo.getHistoricoCai() : "";
        if (!antigoHistorico.equals(novoHistorico)) {
            if (!primeiro) sb.append("; ");
            sb.append("Alteração no campo Historico de '").append(antigoHistorico).append("' para '").append(novoHistorico).append("'");
            primeiro = false;
        }
        
        // Alteração de departamento
        String novoDpto = dados.getOrDefault("dpto_cai", antigo.getDeptoCai() != null ? antigo.getDeptoCai() : "").toString();
        String antigoDpto = antigo.getDeptoCai() != null ? antigo.getDeptoCai() : "";
        if (!antigoDpto.equals(novoDpto)) {
            if (!primeiro) sb.append("; ");
            sb.append("Alteração no campo Departamento de '").append(antigoDpto).append("' para '").append(novoDpto).append("'");
            primeiro = false;
        }
        
        // Alteração de banco
        String novoBanco = dados.getOrDefault("codbanco_cai", antigo.getBancoCai()).toString();
        if (!antigo.getBancoCai().equals(novoBanco)) {
            if (!primeiro) sb.append("; ");
            sb.append("Alteração no campo Banco de '").append(antigo.getBancoCai()).append("' para '").append(novoBanco).append("'");
            primeiro = false;
        }
        
        // Se não houve alterações específicas, usar formato genérico
        if (primeiro) {
            sb.append("Alteração no lançamento seq_cai=").append(antigo.getSeqCai());
        }
        
        return sb.toString();
    }
    
    /**
     * Formata valor em reais brasileiro
     */
    private String formatarMoedaBR(java.math.BigDecimal valor) {
        if (valor == null) return "0,00";
        return valor.setScale(2, java.math.RoundingMode.HALF_UP)
                    .toString().replace(".", ",");
    }
    
    /**
     * Insere registro de audit log na tabela log existente
     * Campos: filial_log, chave_log, usuario_log, programa_log, oper_log, historico_log
     */
    private void insertCaixaAuditLog(String filialLog, String usuarioLog, String programaLog, String operLog, String historicoLog, Long seqCaiRef) {
        try {
            // chave_log = datetime atual
            String sql = "INSERT INTO log (filial_log, chave_log, usuario_log, programa_log, oper_log, histor_log) VALUES (?, NOW(), ?, ?, ?, ?)";
            jdbcTemplate.update(sql, filialLog, usuarioLog, programaLog, operLog, historicoLog);
            log.info("[CaixaService] Audit log inserido na tabela log: programa={}, oper={}, seq_cai={}", programaLog, operLog, seqCaiRef);
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao inserir audit log na tabela log: {}", e.getMessage());
            // Não throw para não impedir a operação principal
        }
    }
    
    /**
     * Insere registro de log quando uma baixa de documento é removida de um lançamento de caixa
     * @param dcCai D ou C (débito ou crédito) - determina se é baixa de fornecedor ou cliente
     * @param filialLog Filial do usuário
     * @param usuarioLog Usuário que está removendo
     * @param nomePessoa Nome do cliente/fornecedor
     * @param codigoDocumento Código do documento
     * @param parcela Parcela do documento
     * @param seqCaiRef Referência ao seq_cai do movimento de caixa
     */
    public void insertLogRemocaoBaixa(String dcCai, String filialLog, String usuarioLog, String nomePessoa, Long codigoDocumento, String parcela, Long seqCaiRef) {
        try {
            String tipoOperacao = "D".equals(dcCai) ? "fornecedor" : "cliente";
            String historicoLog = String.format(
                "Baixa do %s %s Documento %d Parcela %s removida",
                tipoOperacao,
                nomePessoa != null ? nomePessoa : "",
                codigoDocumento != null ? codigoDocumento : 0,
                parcela != null ? parcela : ""
            );
            insertCaixaAuditLog(filialLog, usuarioLog, "CAI001", "02", historicoLog, seqCaiRef);
            log.info("[CaixaService] Log de remoção de baixa inserido: {}", historicoLog);
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao inserir log de remoção de baixa: {}", e.getMessage());
        }
    }

    private String formatarBanco5Digitos(String banco) {
        if (banco == null) return null;
        String limpo = banco.trim();
        if (limpo.isEmpty()) return limpo;
        try {
            long val = Long.parseLong(limpo);
            return String.format("%05d", val);
        } catch (NumberFormatException e) {
            if (limpo.length() < 5) {
                return String.format("%5s", limpo).replace(' ', '0');
            }
            return limpo;
        }
    }

    private String formatarCliFor5Digitos(String code) {
        if (code == null) return null;
        String limpo = code.trim();
        if (limpo.isEmpty()) return limpo;
        try {
            long val = Long.parseLong(limpo);
            return String.format("%05d", val);
        } catch (NumberFormatException e) {
            if (limpo.length() < 5) {
                return String.format("%5s", limpo).replace(' ', '0');
            }
            return limpo;
        }
    }

    private String buscarDescricaoOperacao(String codigoOperacao) {
        if (codigoOperacao == null || codigoOperacao.trim().isEmpty()) {
            return "";
        }
        try {
            String sql = "SELECT descr_ocai FROM mascai WHERE operacao_ocai = ? LIMIT 1";
            return jdbcTemplate.queryForObject(sql, String.class, codigoOperacao.trim());
        } catch (Exception e) {
            try {
                String sql = "SELECT descr_ope FROM masope WHERE codigo_ope = ? LIMIT 1";
                return jdbcTemplate.queryForObject(sql, String.class, codigoOperacao.trim());
            } catch (Exception ex) {
                return codigoOperacao;
            }
        }
    }

    // Helper: mapear payload para entidade Caixa
    private Caixa mapToCaixa(Map<String, Object> dados, Long existingId) {
        Caixa c = new Caixa();
        if (existingId != null) c.setSeqCai(existingId);

        if (dados.get("dtmovi_cai") != null) {
            c.setDtmoviCai(LocalDate.parse(dados.get("dtmovi_cai").toString()));
        }
        if (dados.get("dc_cai") != null) c.setDcCai(dados.get("dc_cai").toString());
        if (dados.get("valor_cai") != null) c.setValorCai(new BigDecimal(dados.get("valor_cai").toString()));
        if (dados.get("banco_cai") != null) c.setBancoCai(formatarBanco5Digitos(dados.get("banco_cai").toString()));
        // Suportar codbanco_cai (enviado pelo frontend) como alias para banco_cai
        if (dados.get("codbanco_cai") != null) c.setBancoCai(formatarBanco5Digitos(dados.get("codbanco_cai").toString()));
        String formattedCliFor = null;
        if (dados.get("cliente_cai") != null) {
            formattedCliFor = formatarCliFor5Digitos(dados.get("cliente_cai").toString());
        } else if (dados.get("clifor_cai") != null) {
            formattedCliFor = formatarCliFor5Digitos(dados.get("clifor_cai").toString());
        }
        if (formattedCliFor != null) {
            c.setClienteCai(formattedCliFor);
            c.setCredcliCai(formattedCliFor);
        }
        
        if (dados.get("operacao_cai") != null) c.setOperacaoCai(dados.get("operacao_cai").toString());
        if (dados.get("oper_cai") != null) c.setOperacaoCai(dados.get("oper_cai").toString());
        
        if (dados.get("depto_cai") != null) c.setDeptoCai(dados.get("depto_cai").toString());
        if (dados.get("dpto_cai") != null) c.setDeptoCai(dados.get("dpto_cai").toString());
        
        if (dados.get("historico_cai") != null) c.setHistoricoCai(dados.get("historico_cai").toString());
        if (dados.get("histor_cai") != null) c.setHistoricoCai(dados.get("histor_cai").toString());
        
        if (dados.get("documentos_vinculados") != null) c.setDocumentosVinculados(dados.get("documentos_vinculados").toString());
        if (dados.get("valor_documentos") != null) c.setValorDocumentos(new BigDecimal(dados.get("valor_documentos").toString()));

        // Ensure filial default
        if (c.getFilialCai() == null) c.setFilialCai("001");
        return c;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> obterHistorico(Long lancamentoId) {
        log.info("[CaixaService] Buscando historico lancamento: {}", lancamentoId);
        try {
            String sql = "SELECT seq_cai as id, dtmovi_cai as data, dc_cai as tipo, " +
                         "valor_cai as valor, historico_cai as descricao FROM caixa " +
                         "WHERE seq_cai = ? ORDER BY dtmovi_cai DESC";
            return jdbcTemplate.queryForList(sql, lancamentoId);
        } catch (Exception e) {
            log.error("[CaixaService] Erro ao buscar historico: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    // =========================================================================
    // PROCESSAMENTO DE PAGAMENTOS AUTORIZADOS
    // =========================================================================
    
    /**
     * Processa pagamentos autorizados gerando lançamentos no caixa
     * 
     * FLUXO:
     * 1. Validar documentos autorizados (cobmag_pag = 'A')
     * 2. Obter DC da operação a partir do mascai.dc_ocai
     * 3. Gerar sequência no caixacab
     * 4. Inserir registro na tabela CAIXA
     * 5. Atualizar caixacab
     * 6. Atualizar campos de vínculo em PAGAR
     * 
     * @param request Mapa com pagar_ids, codbanco_cai, dtmovi_cai
     * @param empresaGer Código da empresa
     * @param filial Código da filial formatado
     * @return Resultado do processamento
     */
    @Transactional
    public Map<String, Object> processarPagamentos(Map<String, Object> request, String empresaGer, String filial) {
        log.info("[CaixaService] processarPagamentos - empresa: {}, filial: {}", empresaGer, filial);
        
        @SuppressWarnings("unchecked")
        List<Long> pagarIds = ((List<Number>) request.get("pagar_ids"))
            .stream()
            .map(Number::longValue)
            .toList();
        
        String codbanco = request.get("codbanco_cai").toString();
        LocalDate dtmovi = LocalDate.parse(request.get("dtmovi_cai").toString());
        String tipocai = "001";  // Tipo de caixa padrão
        
        // PASSO 1: Validar documentos autorizados
        String sqlValidar = """
            SELECT COUNT(*) FROM pagar 
            WHERE pagar_id IN (%s) 
            AND cobmag_pag = 'A' 
            AND status_pag IS NULL
            """.formatted(pagarIds.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(",")));
        
        Integer autorizados = jdbcTemplate.queryForObject(sqlValidar, Integer.class);
        if (autorizados == null || autorizados != pagarIds.size()) {
            throw new IllegalArgumentException(
                "Apenas " + autorizados + " de " + pagarIds.size() + " documentos estão autorizados para pagamento");
        }
        
        // PASSO 2: Buscar documentos para calcular totais
        String sqlDocs = """
            SELECT 
                pagar_id,
                vlrdup_pag,
                COALESCE(vlrmult_pag, 0) AS vlrmult,
                COALESCE(vlracre_pag, 0) AS vlracre,
                COALESCE(vlrdesc_pag, 0) AS vlrdesc,
                favorecido_pag,
                numdup_pag
            FROM pagar 
            WHERE pagar_id IN (%s)
            """.formatted(pagarIds.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(",")));
        
        List<Map<String, Object>> documentos = jdbcTemplate.queryForList(sqlDocs);
        
        // Calcular totais
        BigDecimal totalDup = BigDecimal.ZERO;
        BigDecimal totalMult = BigDecimal.ZERO;
        BigDecimal totalAcre = BigDecimal.ZERO;
        BigDecimal totalDesc = BigDecimal.ZERO;
        
        for (Map<String, Object> doc : documentos) {
            totalDup = totalDup.add((BigDecimal) doc.get("vlrdup"));
            totalMult = totalMult.add((BigDecimal) doc.get("vlrmult"));
            totalAcre = totalAcre.add((BigDecimal) doc.get("vlracre"));
            totalDesc = totalDesc.add((BigDecimal) doc.get("vlrdesc"));
        }
        
        BigDecimal totalBaixa = totalDup.add(totalMult).add(totalAcre).subtract(totalDesc);
        
        // PASSO 3: Obter DC da operacao (PAGAMENTO = 'D')
        String operacaoPagamento = "600";  // Operacao padrao para pagamento de fornecedores
        String sqlDc = "SELECT dc_ocai FROM mascai WHERE operacao_ocai = ?";
        String dcCai = jdbcTemplate.queryForObject(sqlDc, String.class, operacaoPagamento);
        if (dcCai == null) dcCai = "D";  // Default para pagamentos
        
        // PASSO 4: Gerar sequência no caixacab
        String sqlSeq = "SELECT COALESCE(ultseq_cai, '0000') FROM caixacab " +
                       "WHERE filial_cai = ? AND tipocai_cai = ? AND codbanco_cai = ? AND dtmovi_cai = ?";
        String seqAtual = jdbcTemplate.queryForObject(sqlSeq, String.class, filial, tipocai, codbanco, dtmovi);
        if (seqAtual == null) seqAtual = "0000";
        
        int seqNum = Integer.parseInt(seqAtual.substring(seqAtual.length() - 4)) + 1;
        String seqCai = String.format("%04d", seqNum);
        
        // PASSO 5: Inserir na tabela CAIXA
        StringBuilder historico = new StringBuilder();
        historico.append("Pagto.Fornec.");
        historico.append(" (").append(documentos.size()).append(" doc(s))");
        
        String sqlInsertCaixa = """
            INSERT INTO caixa (
                filial_cai, tipocai_cai, dtmovi_cai, seq_cai, cliforn_cai, codbanco_cai,
                dc_cai, valor_cai, debito_cai, credito_cai, operacao_cai, histor_cai,
                dtincl_cai, usuario_cai
            ) VALUES (?, ?, ?, ?, 'F', ?, ?, ?, ?, ?, ?, ?, NOW(), 'PROCESSAMENTO')
            """;
        
        jdbcTemplate.update(sqlInsertCaixa,
            filial, tipocai, dtmovi, seqCai, codbanco,
            dcCai, totalBaixa,
            "D".equals(dcCai) ? totalBaixa : BigDecimal.ZERO,
            "C".equals(dcCai) ? totalBaixa : BigDecimal.ZERO,
            operacaoPagamento,
            historico.toString()
        );
        
        // PASSO 6: Atualizar CAIXACAB
        String sqlUpsertCaixacab = """
            INSERT INTO caixacab (filial_cai, tipocai_cai, codbanco_cai, dtmovi_cai, debito_cai, credito_cai, ultseq_cai)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                debito_cai = debito_cai + VALUES(debito_cai),
                credito_cai = credito_cai + VALUES(credito_cai),
                ultseq_cai = VALUES(ultseq_cai)
            """;
        
        jdbcTemplate.update(sqlUpsertCaixacab,
            filial, tipocai, codbanco, dtmovi,
            "D".equals(dcCai) ? totalBaixa : BigDecimal.ZERO,
            "C".equals(dcCai) ? totalBaixa : BigDecimal.ZERO,
            seqCai
        );
        
        // Propagar saldo_cai para datas subsequentes
        BigDecimal valorComSinal = "D".equals(dcCai) ? totalBaixa.negate() : totalBaixa;
        String sqlPropagaSaldo = "UPDATE caixacab SET saldo_cai = COALESCE(saldo_cai,0) + ? WHERE dtmovi_cai >= ? AND codbanco_cai = ? AND filial_cai = ?";
        jdbcTemplate.update(sqlPropagaSaldo, valorComSinal, dtmovi, codbanco, filial);
        
        // PASSO 7: Atualizar PAGAR com vínculos
        String sqlUpdatePagar = """
            UPDATE pagar SET
                cobmag_pag = 'P',
                cxbco_pag = ?,
                dtpagi_pag = ?,
                opercai_pag = ?,
                seqcai_pag = ?,
                vlrmult_pag = COALESCE(vlrmult_pag, 0),
                vlracre_pag = COALESCE(vlracre_pag, 0),
                vlrdesc_pag = COALESCE(vlrdesc_pag, 0),
                vlrpag_pag = vlrdup_pag + COALESCE(vlrmult_pag, 0) + COALESCE(vlracre_pag, 0) - COALESCE(vlrdesc_pag, 0)
            WHERE pagar_id IN (%s)
            """.formatted(pagarIds.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(",")));
        
        jdbcTemplate.update(sqlUpdatePagar,
            codbanco, dtmovi, operacaoPagamento, seqCai
        );
        
        // Retornar resultado
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("sucesso", true);
        resultado.put("mensagem", documentos.size() + " pagamento(s) processado(s) com sucesso");
        resultado.put("seq_caixa", seqCai);
        resultado.put("cod_banco", codbanco);
        resultado.put("dt_movimento", dtmovi.toString());
        resultado.put("total_documentos", totalDup);
        resultado.put("total_multas", totalMult);
        resultado.put("total_acrescimos", totalAcre);
        resultado.put("total_descontos", totalDesc);
        resultado.put("total_pago", totalBaixa);
        resultado.put("dc_caixa", dcCai);
        
        log.info("[CaixaService] Pagamentos processados com sucesso - seq: {}, total: {}", seqCai, totalBaixa);
        return resultado;
    }
    
    /**
     * Estorna completamente um movimento de caixa.
     * 
     * 1. Desvincula todos os documentos (receber/pagar) vinculados a este caixa
     * 2. Marca o caixa como estornado (lote_cai = 'E')
     * 3. Zera os valores do caixa e propaga o delta inverso ao caixacab
     *
     * @param seqCai Sequência do caixa
     * @param banco Código do banco
     * @param dataMovimento Data do movimento (YYYY-MM-DD)
     * @param filial Código da filial
     * @param usuarioLog Usuário que está estornando
     * @return Mapa com resultado da operação
     */
    @Transactional
    public Map<String, Object> estornarMovimento(Long seqCai, String banco, String dataMovimento, String filial, String usuarioLog) {
        log.info("[CaixaService] Estornando movimento: seqCai={}, banco={}, data={}", seqCai, banco, dataMovimento);

        Map<String, Object> resultado = new HashMap<>();

        // 1. Buscar o caixa original
        String sqlCaixa = "SELECT * FROM caixa WHERE seq_cai = ? AND codbanco_cai = ? AND dtmovi_cai = ? AND filial_cai = ?";
        Map<String, Object> caixaOriginal;
        try {
            caixaOriginal = jdbcTemplate.queryForMap(sqlCaixa, seqCai, Integer.parseInt(banco.trim()), dataMovimento, filial);
        } catch (Exception e) {
            log.error("[CaixaService] Movimento nao encontrado: seqCai={}, banco={}, data={}", seqCai, banco, dataMovimento);
            throw new IllegalArgumentException("Movimento de caixa nao encontrado");
        }

        // 2. Verificar se ja foi estornado
        Object loteAtual = caixaOriginal.get("lote_cai");
        if (loteAtual != null && "E".equals(loteAtual.toString().trim())) {
            throw new IllegalArgumentException("Movimento ja foi estornado anteriormente");
        }

        Object dcCai = caixaOriginal.get("dc_cai");
        Object valorCai = caixaOriginal.get("valor_cai");

        // 3. Parse histor_cai para extrair IDs dos documentos vinculados
        Object historObj = caixaOriginal.get("histor_cai");
        java.util.List<Long> receberIds = new java.util.ArrayList<>();
        java.util.List<Long> pagarIds = new java.util.ArrayList<>();

        if (historObj != null) {
            String histor = historObj.toString();
            // Pattern: [Docs: R:123,P:456]
            int startIdx = histor.indexOf("[Docs: ");
            if (startIdx >= 0) {
                int endIdx = histor.indexOf("]", startIdx);
                if (endIdx > startIdx) {
                    String docsPart = histor.substring(startIdx + 7, endIdx);
                    for (String entry : docsPart.split(",")) {
                        entry = entry.trim();
                        if (entry.startsWith("R:")) {
                            receberIds.add(Long.parseLong(entry.substring(2)));
                        } else if (entry.startsWith("P:")) {
                            pagarIds.add(Long.parseLong(entry.substring(2)));
                        }
                    }
                }
            }
        }

        // 3b. Fallback: se nao encontrou IDs no historico, buscar por cxbco+seqcai
        if (receberIds.isEmpty() && pagarIds.isEmpty()) {
            String sqlBuscaRec = "SELECT receber_id FROM receber WHERE cxbco_rec = ? AND seqcai_rec = ? AND dtpagi_rec = ? AND filial_rec = ?";
            try {
                List<Map<String, Object>> recs = jdbcTemplate.queryForList(sqlBuscaRec, Integer.parseInt(banco.trim()), seqCai, dataMovimento, filial);
                for (Map<String, Object> r : recs) {
                    receberIds.add(((Number) r.get("receber_id")).longValue());
                }
            } catch (Exception e) {
                log.warn("[CaixaService] Nenhum receber encontrado por vinculo");
            }

            String sqlBuscaPag = "SELECT pagar_id FROM pagar WHERE cxbco_pag = ? AND seqcai_pag = ? AND dtpagi_pag = ? AND filial_pag = ?";
            try {
                List<Map<String, Object>> pags = jdbcTemplate.queryForList(sqlBuscaPag, Integer.parseInt(banco.trim()), seqCai, dataMovimento, filial);
                for (Map<String, Object> p : pags) {
                    pagarIds.add(((Number) p.get("pagar_id")).longValue());
                }
            } catch (Exception e) {
                log.warn("[CaixaService] Nenhum pagar encontrado por vinculo");
            }
        }

        int totalDesvinculados = 0;

        // 4. Desvincular receber
        for (Long recId : receberIds) {
            try {
                desvincularDocumentoIndividual(seqCai, "R", recId, banco, dataMovimento);
                totalDesvinculados++;
            } catch (Exception e) {
                log.warn("[CaixaService] Erro ao desvincular receber {}: {}", recId, e.getMessage());
            }
        }

        // 5. Desvincular pagar
        for (Long pagId : pagarIds) {
            try {
                desvincularDocumentoIndividual(seqCai, "P", pagId, banco, dataMovimento);
                totalDesvinculados++;
            } catch (Exception e) {
                log.warn("[CaixaService] Erro ao desvincular pagar {}: {}", pagId, e.getMessage());
            }
        }

        // 6. Marcar caixa como estornado: lote_cai = 'E', zerar valores
        String sqlEstornarCaixa = "UPDATE caixa SET " +
                                  "  lote_cai = 'E', " +
                                  "  valor_cai = 0, " +
                                  "  debito_cai = 0, " +
                                  "  credito_cai = 0, " +
                                  "  histor_cai = CONCAT(histor_cai, ' [ESTORNADO EM ', DATE_FORMAT(NOW(), '%d/%m/%Y %H:%i'), ']') " +
                                  "WHERE seq_cai = ? AND codbanco_cai = ? AND dtmovi_cai = ? AND filial_cai = ?";
        jdbcTemplate.update(sqlEstornarCaixa, seqCai, Integer.parseInt(banco.trim()), dataMovimento, filial);

        // 7. Propagar o delta inverso no caixacab
        try {
            Number valorOriginalNum = (Number) valorCai;
            BigDecimal valorOriginal = valorOriginalNum != null ? BigDecimal.valueOf(valorOriginalNum.doubleValue()) : BigDecimal.ZERO;
            BigDecimal delta = valorOriginal.negate();

            String dcStr = dcCai != null ? dcCai.toString() : "D";
            BigDecimal debito = "D".equals(dcStr) ? delta : BigDecimal.ZERO;
            BigDecimal credito = "C".equals(dcStr) ? delta : BigDecimal.ZERO;

            String sqlCaixacab = "INSERT INTO caixacab (filial_cai, tipocai_cai, codbanco_cai, dtmovi_cai, debito_cai, credito_cai, ultseq_cai) " +
                                 "VALUES (?, '001', ?, ?, ?, ?, ?) " +
                                 "ON DUPLICATE KEY UPDATE " +
                                 "  debito_cai = debito_cai + VALUES(debito_cai), " +
                                 "  credito_cai = credito_cai + VALUES(credito_cai)";
            jdbcTemplate.update(sqlCaixacab, filial, Integer.parseInt(banco.trim()), dataMovimento, debito, credito, "E" + String.format("%03d", seqCai));

            // Propagar delta para todas as datas subsequentes
            String sqlPropagaSaldo = "UPDATE caixacab SET saldo_cai = saldo_cai + ? WHERE dtmovi_cai > ? AND codbanco_cai = ? AND filial_cai = ?";
            int linhasSaldo = jdbcTemplate.update(sqlPropagaSaldo, delta, dataMovimento, Integer.parseInt(banco.trim()), filial);
            log.info("[CaixaService] Saldo propagado para {} registros apos a data {}", linhasSaldo, dataMovimento);
        } catch (Exception e) {
            log.warn("[CaixaService] Erro ao propagar saldo de estorno: {}", e.getMessage());
        }

        // 8. Log de auditoria
        try {
            insertCaixaAuditLog(filial, usuarioLog, "CAI001", "03",
                "ESTORNO movimento seq=" + seqCai + " banco=" + banco + " data=" + dataMovimento + " docs=" + totalDesvinculados,
                seqCai);
        } catch (Exception e) {
            log.warn("[CaixaService] Erro ao inserir log de auditoria: {}", e.getMessage());
        }

        resultado.put("sucesso", true);
        resultado.put("mensagem", "Movimento estornado com sucesso. " + totalDesvinculados + " documento(s) desvinculado(s).");
        resultado.put("seq_cai", seqCai);
        resultado.put("documentos_desvinculados", totalDesvinculados);
        resultado.put("lote_cai", "E");

        log.info("[CaixaService] Movimento estornado com sucesso: seqCai={}, totalDesvinculados={}", seqCai, totalDesvinculados);
        return resultado;
    }

    /**
     * Lista operações de caixa disponíveis (tabela mascai)
     * 
     * @param dc_ocai Filtro opcional por tipo (D=Débito, C=Crédito)
     * @return Lista de operações
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarOperacoesCaixa(String dc_ocai) {
        log.info("[CaixaService] listarOperacoesCaixa - dc_ocai: {}", dc_ocai);
        
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT ")
           .append("operacao_ocai AS operacao, ")
           .append("descr_ocai AS descricao, ")
           .append("dc_ocai, ")
           .append("ativa_ocai AS ativo ")
           .append("FROM mascai ")
           .append("WHERE ativa_ocai = 'S' ");
        
        if (dc_ocai != null && !dc_ocai.isBlank()) {
            sql.append("AND dc_ocai = ? ");
        }
        
        sql.append("ORDER BY operacao_ocai");
        
        if (dc_ocai != null && !dc_ocai.isBlank()) {
            return jdbcTemplate.queryForList(sql.toString(), dc_ocai);
        } else {
            return jdbcTemplate.queryForList(sql.toString());
        }
    }

    /**
     * Desvincula um documento individual do movimento de caixa.
     * Usado quando o usuário clica na lixeira em modo edição.
     * 
     * Restaura o saldo em aberto: vlrsal = vlrsal + vlrpag
     * Limpa todos os campos de vínculo.
     *
     * @param seqCai Sequência do caixa
     * @param tipo 'R' para receber, 'P' para pagar
     * @param documentoId ID do documento na tabela receber/pagar
     * @param banco Código do banco
     * @param dataMovimento Data do movimento (YYYY-MM-DD)
     * @throws IllegalArgumentException se parâmetros forem inválidos
     */
    @Transactional
    public void desvincularDocumentoIndividual(Long seqCai, String tipo, Long documentoId, String banco, String dataMovimento) {
        log.info("[CaixaService] Desvinculando documento individual: seqCai={}, tipo={}, documentoId={}, banco={}, data={}",
            seqCai, tipo, documentoId, banco, dataMovimento);

        if (seqCai == null || documentoId == null || banco == null || dataMovimento == null) {
            throw new IllegalArgumentException("Parâmetros obrigatórios ausentes para desvinculação");
        }

        int bancoInt;
        try {
            bancoInt = Integer.parseInt(banco.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Código do banco inválido: " + banco);
        }

        String suf = tipo.equals("R") ? "rec" : "pag";
        String tabela = tipo.equals("R") ? "receber" : "pagar";
        String campoId = tipo.equals("R") ? "receber_id" : "pagar_id";

        // SQL que restaura o saldo: vlrsal = vlrsal + vlrpag
        // MariaDB avalia SET left-to-right, então vlrsal deve vir ANTES de vlrpag = NULL
        String sql = "UPDATE " + tabela + " SET " +
                     "  vlrsal_" + suf + " = COALESCE(vlrsal_" + suf + ", 0) + COALESCE(vlrpag_" + suf + ", 0), " +
                     "  cobmag_" + suf + " = NULL, " +
                     "  cxbco_" + suf + " = NULL, " +
                     "  opercai_" + suf + " = NULL, " +
                     "  seqcai_" + suf + " = NULL, " +
                     "  dtpagi_" + suf + " = NULL, " +
                     "  dtpag_" + suf + " = NULL, " +
                     "  vlrpag_" + suf + " = NULL, " +
                      "  vlracre_" + suf + " = NULL, " +
                      "  vlrdesc_" + suf + " = NULL, " +
                      "  " + (suf.equals("rec") ? "vlrmulta_" : "vlrmult_") + suf + " = NULL " +
                     "WHERE " + campoId + " = ? " +
                     "  AND cxbco_" + suf + " = ? " +
                     "  AND seqcai_" + suf + " = ? " +
                     "  AND filial_" + suf + " = '001'";

        int linhas = jdbcTemplate.update(sql, documentoId, bancoInt, seqCai);

        if (linhas == 0) {
            log.warn("[CaixaService] Nenhum documento encontrado para desvincular: tabela={}, id={}, banco={}, seqCai={}",
                tabela, documentoId, bancoInt, seqCai);
            throw new IllegalArgumentException("Documento não encontrado ou não vinculado a este movimento");
        }

        log.info("[CaixaService] Documento desvinculado com sucesso: tabela={}, id={}, linhas afetadas={}",
            tabela, documentoId, linhas);
    }
}
