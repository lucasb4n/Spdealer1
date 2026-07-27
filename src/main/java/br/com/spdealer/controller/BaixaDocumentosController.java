package br.com.spdealer.controller;

import br.com.spdealer.service.DocumentoReceberService;
import br.com.spdealer.service.DocumentoPagarService;
import br.com.spdealer.dto.BaixaDocumentosRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para gerenciar baixa de documentos (Receber/Pagar) via Movimento de Caixa
 * 
 * ENDPOINTS:
 * - GET  /api/v1/receber/cliente/{clienteId}
 * - GET  /api/v1/pagar/fornecedor/{fornecedorId}
 * - POST /api/v1/caixa/movimento/{id}/baixar-documentos
 * 
 * FLUXO:
 * 1. Usuário cria Movimento de Caixa (Crédito ou Débito)
 * 2. Clica "Baixar Documentos"
 * 3. Modal busca documentos via GET /api/v1/receber/cliente/{id}
 * 4. Usuário seleciona documentos
 * 5. Modal valida totais
 * 6. POST /api/v1/caixa/movimento/{id}/baixar-documentos grava baixa
 */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BaixaDocumentosController {

    private final DocumentoReceberService documentoReceberService;
    private final DocumentoPagarService documentoPagarService;
    private final br.com.spdealer.service.CaixaService caixaService;
    private final JdbcTemplate jdbcTemplate;

    // ========================================================================
    // ENDPOINT 1: GET Documentos a RECEBER
    // ========================================================================

    /**
     * Busca documentos a RECEBER de um cliente específico
     * 
     * Usado para: Modal de seleção quando movimento é CRÉDITO
     * 
     * Query:
     * SELECT * FROM receber
     * WHERE cliente_rec = {clienteId}
     *   AND filial_rec = {filial_usuario}
     *   AND status_rec IN ('P', 'A')
     *   AND dtvenci_rec <= TODAY() + 999 dias
     * ORDER BY dtvenci_rec ASC
     * 
     * @param clienteId Código do cliente (ex: 'XXXX')
     * @param status    Filtro de status (ex: 'P,A' = Pendente, Aberto) - opcional
     * @param session   HttpSession para obter filial do usuário
     * @return Lista de DocumentoReceber
     */
    @GetMapping("/receber/cliente/{clienteId}")
    public ResponseEntity<?> getDocumentosReceber(
            @PathVariable String clienteId,
            @RequestParam(required = false, defaultValue = "P,A") String status,
            HttpSession session
    ) {
        try {
            // 1. Obter filial do usuário da sessão
            Integer idFil = (Integer) session.getAttribute("id_fil");
            if (idFil == null) {
                log.warn("Sessão sem filial definida");
                return ResponseEntity.badRequest()
                    .body(new HashMap<String, String>() {{
                        put("error", "Filial não identificada na sessão");
                    }});
            }

            // 2. Validar cliente
            if (clienteId == null || clienteId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new HashMap<String, String>() {{
                        put("error", "Cliente ID não informado");
                    }});
            }

            log.info("Buscando documentos a receber: cliente={}, filial={}, status={}",
                clienteId, idFil, status);

            // 3. Buscar documentos
            List<?> documentos = documentoReceberService.buscarDocumentosPorCliente(
                clienteId,
                idFil,
                status.split(",")
            );

            log.info("Encontrados {} documentos a receber", documentos.size());

            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            log.error("Erro ao buscar documentos a receber", e);
            return ResponseEntity.status(500)
                .body(new HashMap<String, String>() {{
                    put("error", "Erro ao buscar documentos: " + e.getMessage());
                }});
        }
    }

    // ========================================================================
    // ENDPOINT 2: GET Documentos a PAGAR
    // ========================================================================

    /**
     * Busca documentos a PAGAR de um fornecedor específico
     * 
     * Usado para: Modal de seleção quando movimento é DÉBITO
     * 
     * Query:
     * SELECT * FROM pagar
     * WHERE fornecedor_pag = {fornecedorId}
     *   AND filial_pag = {filial_usuario}
     *   AND status_pag IN ('P', 'A')
     * ORDER BY dtvenci_pag ASC
     * 
     * @param fornecedorId Código do fornecedor (ex: 'YYYY')
     * @param status       Filtro de status (ex: 'P,A') - opcional
     * @param session      HttpSession para obter filial
     * @return Lista de DocumentoPagar
     */
    @GetMapping("/pagar/fornecedor/{fornecedorId}")
    public ResponseEntity<?> getDocumentosPagar(
            @PathVariable String fornecedorId,
            @RequestParam(required = false, defaultValue = "P,A") String status,
            HttpSession session
    ) {
        try {
            // 1. Obter filial
            Integer idFil = (Integer) session.getAttribute("id_fil");
            if (idFil == null) {
                log.warn("Sessão sem filial definida");
                return ResponseEntity.badRequest()
                    .body(new HashMap<String, String>() {{
                        put("error", "Filial não identificada na sessão");
                    }});
            }

            // 2. Validar fornecedor
            if (fornecedorId == null || fornecedorId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new HashMap<String, String>() {{
                        put("error", "Fornecedor ID não informado");
                    }});
            }

            log.info("Buscando documentos a pagar: fornecedor={}, filial={}, status={}",
                fornecedorId, idFil, status);

            // 3. Buscar documentos
            List<?> documentos = documentoPagarService.buscarDocumentosPorFornecedor(
                fornecedorId,
                idFil,
                status.split(",")
            );

            log.info("Encontrados {} documentos a pagar", documentos.size());

            return ResponseEntity.ok(documentos);

        } catch (Exception e) {
            log.error("Erro ao buscar documentos a pagar", e);
            return ResponseEntity.status(500)
                .body(new HashMap<String, String>() {{
                    put("error", "Erro ao buscar documentos: " + e.getMessage());
                }});
        }
    }

    // ========================================================================
    // ENDPOINT 3: POST Gravar Baixa de Documentos
    // ========================================================================

    /**
     * Grava a baixa de documentos associada a um movimento de caixa
     * 
     * FLUXO:
     * 1. Valida se totais conferem
     * 2. Se RECEBER: Atualiza tabela receber com dtpagi_rec, dtpag_rec, etc
     * 3. Se PAGAR: Atualiza tabela pagar com dtpagi_pag, dtpag_pag, etc
     * 4. Grava LOG de auditoria
     * 5. Executa em TRANSAÇÃO (tudo ou nada)
     * 
     * UPDATE receber SET
     *   dtpagi_rec = data_movimento (AAAA/MM/DD),
     *   dtpag_rec = data_movimento (DD/MM/AAAA - legado),
     *   cxbco_rec = cliente_cai,
     *   opercai_rec = oper_cai,
     *   seqcai_rec = seq_movimento,
     *   vlrsal_rec = 0,
     *   status_rec = 'P'
     * WHERE codigo_rec IN (...)
     * 
     * @param movimentoId ID do movimento de caixa
     * @param request     BaixaDocumentosRequest com tipo, documentoIds, etc
     * @param session     HttpSession
     * @return ResponseEntity com status
     */
    @PostMapping("/caixa/movimento/{movimentoId}/baixar-documentos")
    @Transactional
    public ResponseEntity<?> baixarDocumentos(
            @PathVariable Long movimentoId,
            @RequestBody BaixaDocumentosRequest request,
            HttpSession session
    ) {
        try {
            // 1. Obter filial
            Integer idFil = (Integer) session.getAttribute("id_fil");
            if (idFil == null) {
                return ResponseEntity.badRequest()
                    .body(new HashMap<String, String>() {{
                        put("error", "Filial não identificada");
                    }});
            }

            log.info("Iniciando baixa de documentos: movimento={}, tipo={}, documentos={}",
                movimentoId, request.getTipo(), request.getDocumentoIds().size());

            // 2. Validar request
            if (request.getDocumentoIds() == null || request.getDocumentoIds().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new HashMap<String, String>() {{
                        put("error", "Nenhum documento selecionado");
                    }});
            }

            if (request.getTotalBaixa() <= 0) {
                return ResponseEntity.badRequest()
                    .body(new HashMap<String, String>() {{
                        put("error", "Total de baixa deve ser maior que 0");
                    }});
            }

            // 3. Validar tipo
            if (!request.getTipo().equals("RECEBER") && !request.getTipo().equals("PAGAR")) {
                return ResponseEntity.badRequest()
                    .body(new HashMap<String, String>() {{
                        put("error", "Tipo deve ser RECEBER ou PAGAR");
                    }});
            }

            // 4. Buscar movimento e validar totais
            var movimentoOpt = caixaService.obterPorId(movimentoId);
            if (movimentoOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new HashMap<String, String>() {{ put("error", "Movimento nao encontrado"); }});
            }

            var movimento = movimentoOpt.get();
            // Extrair campos do movimento
            String dataMovimento = movimento.getDtmoviCai() != null ? movimento.getDtmoviCai().toString() : request.getDataMovimento();
            String cxbco = movimento.getClienteCai();
            Integer opercai = null;
            try {
                opercai = Integer.parseInt(movimento.getOperacaoCai() != null ? movimento.getOperacaoCai() : "100");
            } catch (Exception ex) {
                opercai = 100;
            }
            Integer seqcai = movimento.getSeqCai() != null ? movimento.getSeqCai().intValue() : 1;

            int registrosAtualizados = 0;

            if (request.getTipo().equals("RECEBER")) {
                // Buscar documentos do cliente e filtrar pelos IDs selecionados
                List<?> docs = documentoReceberService.buscarDocumentosPorCliente(cxbco, idFil, new String[]{"P","A"});
                double somaSelecionada = 0.0;
                for (Object o : docs) {
                    Map<String, Object> row = (Map<String, Object>) o;
                    Number codigo = (Number) row.get("codigo_rec");
                    if (codigo != null && request.getDocumentoIds().contains(codigo.longValue())) {
                        Number n = (Number) row.get("vlrtot_rec");
                        somaSelecionada += n != null ? n.doubleValue() : 0.0;
                    }
                }

                if (Math.abs(somaSelecionada - request.getTotalBaixa()) > 0.01) {
                    Map<String, String> err = new HashMap<>();
                    err.put("error", "Totais nao conferem: Selecionado=" + somaSelecionada + " / Movimento=" + request.getTotalBaixa());
                    return ResponseEntity.badRequest().body(err);
                }

                registrosAtualizados = documentoReceberService.marcarComoPago(
                    request.getDocumentoIds(),
                    movimentoId,
                    dataMovimento,
                    cxbco,
                    opercai,
                    seqcai,
                    idFil
                );

            } else {
                // PAGAR
                List<?> docs = documentoPagarService.buscarDocumentosPorFornecedor(cxbco, idFil, new String[]{"P","A"});

                double somaSelecionada = 0.0;
                for (Object o : docs) {
                    Map<String, Object> row = (Map<String, Object>) o;
                    Number codigo = (Number) row.get("codigo_pag");
                    if (codigo != null && request.getDocumentoIds().contains(codigo.longValue())) {
                        Number n = (Number) row.get("vlrtot_pag");
                        somaSelecionada += n != null ? n.doubleValue() : 0.0;
                    }
                }

                if (Math.abs(somaSelecionada - request.getTotalBaixa()) > 0.01) {
                    Map<String, String> err = new HashMap<>();
                    err.put("error", "Totais nao conferem: Selecionado=" + somaSelecionada + " / Movimento=" + request.getTotalBaixa());
                    return ResponseEntity.badRequest().body(err);
                }

                registrosAtualizados = documentoPagarService.marcarComoPago(
                    request.getDocumentoIds(),
                    movimentoId,
                    dataMovimento,
                    cxbco,
                    opercai,
                    seqcai,
                    idFil
                );
            }

            // 5. Validar se todos foram atualizados
            if (registrosAtualizados != request.getDocumentoIds().size()) {
                log.warn("Nem todos os documentos foram atualizados: esperado={}, atualizado={}",
                    request.getDocumentoIds().size(), registrosAtualizados);
            }

            log.info("Baixa concluída com sucesso: {} documentos atualizados", registrosAtualizados);

            // 6. Gravar LOG de auditoria (uma linha por documento) - dentro da mesma transacao
            try {
                if (registrosAtualizados > 0) {
                    if (request.getTipo().equals("RECEBER")) {
                        List<?> docs = documentoReceberService.buscarDocumentosPorCliente(cxbco, idFil, new String[]{"P","A"});
                        Map<Long, Double> valores = new HashMap<>();
                        for (Object o : docs) {
                            Map<String, Object> row = (Map<String, Object>) o;
                            Number codigo = (Number) row.get("codigo_rec");
                            Number n = (Number) row.get("vlrtot_rec");
                            if (codigo != null) {
                                valores.put(codigo.longValue(), n != null ? n.doubleValue() : 0.0);
                            }
                        }

                        String sql = "INSERT INTO movimento_baixa_log (movimento_id, documento_tipo, documento_id, valor_documento, data_baixa, cxbco, opercai, seqcai, filial, created_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())";
                        for (Long docId : request.getDocumentoIds()) {
                            Double val = valores.getOrDefault(docId, 0.0);
                            jdbcTemplate.update(sql, movimentoId, "RECEBER", docId, val, dataMovimento, cxbco, opercai, seqcai, idFil);
                        }
                    } else {
                        List<?> docs = documentoPagarService.buscarDocumentosPorFornecedor(cxbco, idFil, new String[]{"P","A"});
                        Map<Long, Double> valores = new HashMap<>();
                        for (Object o : docs) {
                            Map<String, Object> row = (Map<String, Object>) o;
                            Number codigo = (Number) row.get("codigo_pag");
                            Number n = (Number) row.get("vlrtot_pag");
                            if (codigo != null) {
                                valores.put(codigo.longValue(), n != null ? n.doubleValue() : 0.0);
                            }
                        }

                        String sql = "INSERT INTO movimento_baixa_log (movimento_id, documento_tipo, documento_id, valor_documento, data_baixa, cxbco, opercai, seqcai, filial, created_at) VALUES (?,?,?,?,?,?,?,?,?,NOW())";
                        for (Long docId : request.getDocumentoIds()) {
                            Double val = valores.getOrDefault(docId, 0.0);
                            jdbcTemplate.update(sql, movimentoId, "PAGAR", docId, val, dataMovimento, cxbco, opercai, seqcai, idFil);
                        }
                    }
                }
            } catch (Exception ex) {
                log.error("Falha ao gravar log de auditoria da baixa", ex);
                throw ex; // forcar rollback se o log falhar
            }

            // 7. Retornar sucesso
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Documentos baixados com sucesso");
            response.put("registrosAtualizados", registrosAtualizados);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erro ao baixar documentos", e);
            return ResponseEntity.status(500)
                .body(new HashMap<String, String>() {{
                    put("error", "Erro ao processar baixa: " + e.getMessage());
                }});
        }
    }
}
