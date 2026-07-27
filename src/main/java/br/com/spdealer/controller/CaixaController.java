package br.com.spdealer.controller;

import br.com.spdealer.model.Caixa;
import br.com.spdealer.service.CaixaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import jakarta.servlet.http.HttpSession;
import br.com.spdealer.util.SessionHelper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * CaixaController
 * REST API para CRUD Lançamento Caixa e Bancos
 * 
 * Base URL: /api/v1/caixa
 * 
 * Endpoints:
 * 1. GET  /lancamentos?page=0&size=50        → Listar lançamentos com paginação
 * 2. GET  /lancamentos/{id}                  → Detalhe de um lançamento
 * 3. POST /lancamentos                       → Criar novo lançamento
 * 4. PUT  /lancamentos/{id}                  → Editar lançamento
 * 5. DELETE /lancamentos/{id}                → Deletar lançamento
 * 6. GET  /saldo/{banco}/{data}              → Saldo consolidado por banco e data
 * 7. GET  /historico/{id}                    → Histórico de auditoria do lançamento
 */
@RestController
@RequestMapping("/api/v1/caixa")
@RequiredArgsConstructor
@Slf4j
public class CaixaController {

    private final CaixaService caixaService;

    /**
     * Endpoint 1: GET /api/v1/caixa/lancamentos?page=0&size=50
     * 
     * Listar lançamentos de caixa com paginação e filtros opcionais
     * 
     * @param page Número da página (default: 0)
     * @param size Tamanho da página (default: 50)
     * @param banco Filtro por código de banco (opcional)
     * @param dtInicio Data inicial (YYYY-MM-DD) (opcional)
     * @param dtFim Data final (YYYY-MM-DD) (opcional)
     * @return Page<Caixa> com lançamentos paginados
     * 
     * Exemplo:
     * GET /api/v1/caixa/lancamentos?page=0&size=50&banco=001&dtInicio=2025-01-01&dtFim=2025-01-31
     */
    @GetMapping("/lancamentos")
    public ResponseEntity<Page<Caixa>> listarLancamentos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String banco,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dtFim) {
        
        log.info("[CaixaController] Listando lançamentos - page={}, size={}, banco={}, dtInicio={}, dtFim={}", 
                 page, size, banco, dtInicio, dtFim);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Caixa> result = caixaService.listarLancamentos(pageable);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Endpoint 2: GET /api/v1/caixa/lancamentos/{id}
     * 
     * Buscar lançamento por ID com todos os detalhes
     * 
     * @param id ID do lançamento
     * @return Caixa com todos os dados
     * 
     * Exemplo:
     * GET /api/v1/caixa/lancamentos/123
     */
    @GetMapping("/lancamentos/{id}")
    public ResponseEntity<Caixa> obterLancamento(@PathVariable Long id) {
        log.info("[CaixaController] Obtendo lançamento ID={}", id);
        
        return caixaService.obterPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint 3: POST /api/v1/caixa/lancamentos
     * 
     * Criar novo lançamento de caixa
     * 
     * @param caixa Dados do lançamento (JSON)
     * @return Caixa criado com ID gerado
     * 
     * Validações:
     * - dtmovi_cai (date): Obrigatório
     * - dc_cai (D/C): Obrigatório - apenas 'D' ou 'C'
     * - valor_cai (decimal): Obrigatório - > 0
     * - banco_cai (char(3)): Obrigatório - FK para bancos table
     * - historico_cai (text): Obrigatório - mínimo 5 caracteres
     * 
     * Exemplo:
     * POST /api/v1/caixa/lancamentos
     * {
     *   "dtmovi_cai": "2025-11-05",
     *   "dc_cai": "C",
     *   "valor_cai": 1500.50,
     *   "banco_cai": "001",
     *   "filial_cai": "001",
     *   "cliente_cai": "001",
     *   "historico_cai": "Depósito cliente XYZ"
     * }
     */
    @PostMapping("/lancamentos")
    public ResponseEntity<?> criarLancamento(@RequestBody Caixa caixa) {
        log.info("[CaixaController] Criando novo lançamento: {}", caixa);
        
        try {
            Caixa criado = caixaService.criarLancamento(caixa);
            return ResponseEntity.status(HttpStatus.CREATED).body(criado);
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro validação: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint 4: PUT /api/v1/caixa/lancamentos/{id}
     * 
     * Editar lançamento existente
     * 
     * @param id ID do lançamento
     * @param caixaAtualizado Dados atualizados (JSON)
     * @return Caixa atualizado
     * 
     * Regras:
     * - Não pode editar campos de auditoria (created_at)
     * - Não pode editar lançamentos de dias anteriores (apenas hoje e futuro)
     * - Recalcula saldo consolidado em caixacab
     * 
     * Exemplo:
     * PUT /api/v1/caixa/lancamentos/123
     * {
     *   "valor_cai": 2000.00,
     *   "historico_cai": "Depósito corrigido"
     * }
     */
    @PutMapping("/lancamentos/{id}")
    public ResponseEntity<?> editarLancamento(
            @PathVariable Long id,
            @RequestBody Caixa caixaAtualizado) {
        
        log.info("[CaixaController] Editando lançamento ID={}", id);
        
        try {
            Caixa atualizado = caixaService.atualizarLancamento(id, caixaAtualizado);
            return ResponseEntity.ok(atualizado);
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro ao editar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint 5: DELETE /api/v1/caixa/lancamentos/{id}
     * 
     * Deletar lançamento
     * 
     * @param id ID do lançamento
     * @return Map com status da deleção
     * 
     * Regras:
     * - Apenas admin pode deletar
     * - Registra deleção em audit trail
     * - Recalcula saldo consolidado em caixacab
     * 
     * Exemplo:
     * DELETE /api/v1/caixa/lancamentos/123
     */
    @DeleteMapping("/lancamentos/{id}")
    public ResponseEntity<?> deletarLancamento(@PathVariable Long id) {
        log.info("[CaixaController] Deletando lançamento ID={}", id);
        
        try {
            caixaService.deletarLancamento(id);
            return ResponseEntity.ok(Map.of(
                    "mensagem", "Lançamento deletado com sucesso",
                    "id", id
            ));
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro ao deletar: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint 6: GET /api/v1/caixa/saldo/{banco}/{data}
     * 
     * Obter saldo consolidado de um banco em uma data específica
     * 
     * @param banco Código do banco (ex: 001)
     * @param data Data (YYYY-MM-DD)
     * @return Map com saldo consolidado (saldoAnterior, debitos, creditos, saldoAtual)
     * 
     * Exemplo:
     * GET /api/v1/caixa/saldo/001/2025-11-05
     * 
     * Response:
     * {
     *   "banco": "001",
     *   "data": "2025-11-05",
     *   "saldoAnterior": 50000.00,
     *   "debitos": 5000.00,
     *   "creditos": 10000.00,
     *   "saldoAtual": 55000.00,
     *   "nomeBanco": "Banco do Brasil"
     * }
     */
    @GetMapping("/saldo/{banco}/{data}")
    public ResponseEntity<?> obterSaldoConsolidado(
            @PathVariable String banco,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        
        log.info("[CaixaController] Consultando saldo - banco={}, data={}", banco, data);
        
        try {
            Map<String, Object> saldo = caixaService.obterSaldoConsolidado(banco, data);
            return ResponseEntity.ok(saldo);
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro ao consultar saldo: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * Endpoint 7: GET /api/v1/caixa/titulos-abertos
     * 
     * Buscar títulos abertos de um cliente/fornecedor para conferência de valores
     * CRITICAL: Retorna títulos que podem ser selecionados para conferência no lançamento
     * 
     * @param tipo "receber" (contas a receber) ou "pagar" (contas a pagar)
     * @param clienteFornecedorId ID do cliente/fornecedor (ex: 00001)
     * @return List<Map> com títulos abertos: id, numero, parcela, vencimento, saldo
     * 
     * Exemplo:
     * GET /api/v1/caixa/titulos-abertos?tipo=receber&clienteFornecedorId=00001
     * 
     * Response:
     * [
     *   {
     *     "id": 123,
     *     "numero_titulo": "NFE-001",
     *     "parcela": 1,
     *     "data_vencimento": "2025-11-10",
     *     "valor_titulo": 1500.00,
     *     "valor_pago": 0.00,
     *     "saldo": 1500.00,
     *     "status": "ABERTO",
     *     "dias_atraso": 0
     *   }
     * ]
     */
    @GetMapping("/titulos-abertos")
    public ResponseEntity<?> buscarTitulosAbertos(
            @RequestParam String tipo,
            @RequestParam String clienteFornecedorId) {
        
        log.info("[CaixaController] Buscando títulos abertos - tipo={}, clienteFornecedorId={}", 
                 tipo, clienteFornecedorId);
        
        try {
            if (!tipo.equalsIgnoreCase("receber") && !tipo.equalsIgnoreCase("pagar")) {
                Map<String, Object> erro = new HashMap<>();
                erro.put("erro", true);
                erro.put("mensagem", "Tipo deve ser 'receber' ou 'pagar'");
                return ResponseEntity.badRequest().body(erro);
            }
            
            List<Map<String, Object>> titulos = caixaService.buscarTitulosAbertos(tipo, clienteFornecedorId);
            log.info("[CaixaController] Encontrados {} títulos abertos", titulos.size());
            return ResponseEntity.ok(titulos);
            
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao buscar títulos abertos: {}", e.getMessage());
            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", "Erro ao buscar títulos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
        }
    }

    /**
     * Endpoint 8: POST /api/v1/caixa/validar-conferencia
     * 
     * Validar se a soma dos títulos selecionados confere com o valor lançado
     * CRITICAL: OBRIGATÓRIA antes de gravar qualquer lançamento
     * 
     * Se valores NÃO conferem → Retorna 409 (Conflict)
     * Se valores CONFEREM → Retorna 200 OK para prosseguir
     * 
     * Request Body:
     * {
     *   "valorLancamento": 2000.00,
     *   "titulosSelecionados": [123, 124],
     *   "tipo": "receber"
     * }
     * 
     * Response Success (200 OK):
     * {
     *   "valido": true,
     *   "mensagem": "Conferência OK",
     *   "valorLancamento": 2000.00,
     *   "somaDocumentos": 2000.00,
     *   "diferenca": 0.00
     * }
     * 
     * Response Error (409 Conflict):
     * {
     *   "valido": false,
     *   "mensagem": "Conferência FALHOU - Diferença encontrada",
     *   "valorLancamento": 2500.00,
     *   "somaDocumentos": 2000.00,
     *   "diferenca": 500.00,
     *   "erro": "Soma dos títulos (R$ 2.000,00) não confere com valor lançado (R$ 2.500,00)"
     * }
     */
    @PostMapping("/validar-conferencia")
    public ResponseEntity<?> validarConferencia(@RequestBody Map<String, Object> payload) {
        
        log.info("[CaixaController] Validando conferência: {}", payload);
        
        try {
            Object valorObj = payload.get("valorLancamento");
            Object titulosObj = payload.get("titulosSelecionados");
            String tipo = (String) payload.get("tipo");
            
            if (valorObj == null || titulosObj == null || tipo == null) {
                Map<String, Object> erro = new HashMap<>();
                erro.put("valido", false);
                erro.put("mensagem", "Payload incompleto");
                return ResponseEntity.badRequest().body(erro);
            }
            
            java.math.BigDecimal valorLancamento = new java.math.BigDecimal(valorObj.toString());
            @SuppressWarnings("unchecked")
            List<Long> titulosSelecionados = (List<Long>) titulosObj;
            
            Map<String, Object> validacao = caixaService.validarConferencia(valorLancamento, titulosSelecionados, tipo);
            java.math.BigDecimal somaDocumentos = caixaService.calcularSomaDocumentos(titulosSelecionados, tipo);
            java.math.BigDecimal diferenca = valorLancamento.subtract(somaDocumentos)
                    .setScale(2, java.math.RoundingMode.HALF_UP);
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.putAll(validacao);
            resultado.put("valorLancamento", valorLancamento);
            resultado.put("somaDocumentos", somaDocumentos);
            resultado.put("diferenca", diferenca);
            
            Boolean conferencia_ok = (Boolean) validacao.get("conferencia_ok");
            if (conferencia_ok != null && conferencia_ok) {
                resultado.put("mensagem", "Conferencia OK");
                log.info("[CaixaController] OK: {} = {}", valorLancamento, somaDocumentos);
                return ResponseEntity.ok(resultado);
            } else {
                resultado.put("mensagem", "Conferencia FALHOU");
                log.warn("[CaixaController] FALHOU: {} != {}", valorLancamento, somaDocumentos);
                return ResponseEntity.status(HttpStatus.CONFLICT).body(resultado);
            }
            
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao validar conferência: {}", e.getMessage());
            Map<String, Object> erro = new HashMap<>();
            erro.put("valido", false);
            erro.put("mensagem", "Erro interno: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
        }
    }

    /**
     * Endpoint 9: GET /api/v1/caixa/historico/{id}
     * 
     * Obter histórico de auditoria de um lançamento
     * 
     * @param id ID do lançamento
     * @return List<Map> com histórico de alterações (created_at, updated_at, updated_by, campo alterado, valor_antes, valor_depois)
     * 
     * Exemplo:
     * GET /api/v1/caixa/historico/123
     * 
     * Response:
     * [
     *   {
     *     "timestamp": "2025-11-05T14:30:00",
     *     "operacao": "CREATE",
     *     "usuarioId": 1,
     *     "usuarios": "Admin",
     *     "novoValor": {...dados do lançamento...}
     *   },
     *   {
     *     "timestamp": "2025-11-05T15:45:00",
     *     "operacao": "UPDATE",
     *     "usuarioId": 1,
     *     "usuarios": "Admin",
     *     "campoAlterado": "valor_cai",
     *     "valorAnterior": "1500.50",
     *     "novoValor": "2000.00"
     *   }
     * ]
     */
    @GetMapping("/historico/{id}")
    public ResponseEntity<?> obterHistorico(@PathVariable Long id) {
        log.info("[CaixaController] Obtendo histórico do lançamento ID={}", id);
        
        try {
            List<Map<String, Object>> historico = caixaService.obterHistorico(id);
            return ResponseEntity.ok(historico);
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro ao obter histórico: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    /**
     * NOVO Endpoint: GET /api/v1/caixa/titulos-abertos?tipo=C&clienteFornecedorId=CLT001
     * 
     * Busca títulos em aberto para um cliente/fornecedor
     * Usado no modal AG-Grid para seleção de títulos antes de lançar no caixa
     * 
     * Fluxo de Caixa e Bancos:
     * 1. Usuário seleciona [C]liente ou [F]ornecedor
     * 2. GET /api/v1/caixa/titulos-abertos?tipo=C&id=cliente123
     * 3. Modal AG-Grid exibe títulos em aberto com checkbox
     * 4. Usuário seleciona títulos e VALIDA: SUM(títulos) == valor_cai (CRÍTICO!)
     * 5. POST /api/v1/caixa/lancamentos/com-recebimento
     * 6. Backend valida conferência e grava tudo
     * 
     * @param tipo 'C' (Cliente - busca em Receber) ou 'F' (Fornecedor - busca em Pagar)
     * @param clienteFornecedorId ID do cliente ou fornecedor
     * @return Array de títulos em aberto com valores
     */
    // Metodo buscarTitulosAbertos removido - usar versao anterior (linha 273)

    /**
     * NOVO Endpoint: POST /api/v1/caixa/lancamentos/com-recebimento
     * 
     * Criar lançamento NO CAIXA com seleção de títulos (Receber/Pagar)
     * 
     * VALIDAÇÃO CRÍTICA:
     * - Soma dos títulos selecionados DEVE ser EXATAMENTE igual ao valor_cai
     * - Se não bater: retorna erro 400 com mensagem de conferência
     * - Se OK: grava lançamento caixa + marca títulos como pagos/recebidos
     * 
     * Payload esperado:
     * {
     *   "dtmovi": "2025-11-05",
     *   "dcCaixa": "C",                    // 'C' = Crédito (entrada), 'D' = Débito (saída)
     *   "valorCaixa": 5000.00,             // CRÍTICO: deve ser = SUM(títulos)
     *   "bancoCaixa": "001",
     *   "historicoCaixa": "Recebimento de títulos",
     *   "tipoEntidade": "C",               // 'C' = Cliente, 'F' = Fornecedor
     *   "clienteFornecedorId": "CLT001",
     *   "clienteFornecedorNome": "Cliente ABC",
     *   "titulosSelecionados": [
     *     {"documentoId": 1, "numeroTitulo": "001", "valorTitulo": 3000.00, "tipoTitulo": "R"},
     *     {"documentoId": 2, "numeroTitulo": "002", "valorTitulo": 2000.00, "tipoTitulo": "R"}
     *   ],
     *   "totalTitulosSelecionados": 5000.00  // Deve ser = valorCaixa
     * }
     * 
     * Resposta se OK (201):
     * {
     *   "sucesso": true,
     *   "lancamentoCaixaId": 123,
     *   "titulosBaixados": 2,
     *   "valorBaixado": 5000.00,
     *   "mensagem": "Lançamento e títulos gravados com sucesso"
     * }
     * 
     * Resposta se ERRO (400):
     * {
     *   "erro": true,
     *   "mensagem": "Erro de conferência: soma dos títulos (4500.00) não confere com valor lançado (5000.00)",
     *   "totalTitulosSelecionados": 4500.00,
     *   "valorCaixa": 5000.00
     * }
     */
    // TODO: Implementar no CaixaService
    /*
    @PostMapping("/lancamentos/com-recebimento")
    public ResponseEntity<?> criarLancamentoComRecebimento(
            @RequestBody Map<String, Object> payload) {
        log.info("[CaixaController] Criando lancamento com recebimento: {}", payload);
        
        try {
            Map<String, Object> resultado = caixaService.criarLancamentoComRecebimento(payload);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Validacao falhou: {}", e.getMessage());
            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            return ResponseEntity.badRequest().body(erro);
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao criar lancamento com recebimento: {}", e.getMessage());
            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", "Erro interno: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
        }
    }
    */

    /**
     * Endpoint 10: GET /api/v1/caixa/operacoes
     * 
     * Buscar lista dinâmica de operações (mascai)
     * Retorna operações cadastradas para filial 001
     * 
     * @return List<Map> com código e descrição das operações
     * 
     * Exemplo:
     * GET /api/v1/caixa/operacoes
     * 
     * Response:
     * [
     *   { "codigo": "001", "descricao": "Depósito Bancário", "ativo": true },
     *   { "codigo": "002", "descricao": "Saque Caixa", "ativo": true },
     *   { "codigo": "003", "descricao": "Transferência", "ativo": true }
     * ]
     */
    @GetMapping("/operacoes")
    public ResponseEntity<?> listarOperacoes() {
        log.info("[CaixaController] Listando operações para formulário");
        
        try {
            List<Map<String, Object>> operacoes = caixaService.listarOperacoes();
            return ResponseEntity.ok(operacoes);
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao listar operações: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", true, "mensagem", e.getMessage()));
        }
    }

    /**
     * Endpoint 11: GET /api/v1/caixa/departamentos
     * 
     * Buscar lista dinâmica de departamentos (scodep)
     * Retorna departamentos cadastrados para empresa 001 e mestre 'D'
     * 
     * @return List<Map> com código e descrição dos departamentos
     * 
     * Exemplo:
     * GET /api/v1/caixa/departamentos
     * 
     * Response:
     * [
     *   { "codigo": "001", "descricao": "Financeiro", "ativo": true },
     *   { "codigo": "002", "descricao": "Administrativo", "ativo": true },
     *   { "codigo": "003", "descricao": "RH", "ativo": true }
     * ]
     */
    @GetMapping("/departamentos")
    public ResponseEntity<?> listarDepartamentos() {
        log.info("[CaixaController] Listando departamentos para formulário");
        
        try {
            List<Map<String, Object>> departamentos = caixaService.listarDepartamentos();
            return ResponseEntity.ok(departamentos);
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao listar departamentos: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", true, "mensagem", e.getMessage()));
        }
    }

    /**
     * Endpoint 12: GET /api/v1/caixa/clientes-fornecedores
     * 
     * Buscar clientes ou fornecedores (busca dinâmica)
     * Retorna lista para seleção na seção "Grupo Baixa"
     * 
     * @param tipo "C" (clientes) ou "F" (fornecedores)
     * @param filtro Filtro opcional por nome/código
     * @return List<Map> com código, nome, tipo
     * 
     * Exemplo:
     * GET /api/v1/caixa/clientes-fornecedores?tipo=C&filtro=ABC
     * 
     * Response:
     * [
     *   { "codigo": "00001", "nome": "ABCDEF LTDA", "tipo": "C", "limiteCredito": 50000.00 },
     *   { "codigo": "00002", "nome": "ABC DISTRIBUIDOR", "tipo": "C", "limiteCredito": 100000.00 }
     * ]
     */
    @GetMapping("/clientes-fornecedores")
    public ResponseEntity<?> buscarClientesFornecedores(
            @RequestParam String tipo,
            @RequestParam(required = false) String filtro) {
        
        log.info("[CaixaController] Buscando {}: {}", tipo.equals("C") ? "clientes" : "fornecedores", filtro);
        
        try {
            if (!tipo.equals("C") && !tipo.equals("F")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("erro", true, "mensagem", "Tipo deve ser 'C' (Cliente) ou 'F' (Fornecedor)"));
            }
            
            List<Map<String, Object>> lista = caixaService.buscarClientesFornecedores(tipo, filtro);
            return ResponseEntity.ok(lista);
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao buscar clientes/fornecedores: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erro", true, "mensagem", e.getMessage()));
        }
    }

    /**
     * Endpoint 13: GET /api/v1/caixa/buscar-movimentos
     * 
     * NOVO ENDPOINT PARA BUSCA DE MOVIMENTOS COM FILTROS
     * Busca movimentos de caixa com filtros de data, banco e tipo
     * 
     * Parametros Query:
     * @param dataInicial Data inicial (YYYY-MM-DD) - obrigatório
     * @param dataFinal Data final (YYYY-MM-DD) - obrigatório
     * @param codbanco_cai Código do banco (opcional) - se vazio, traz todos
     * @param tipocai_cai Tipo C/D (opcional) - se vazio, traz ambos
     * 
     * @return List<Map> com movimentos: dtmovi_cai, banco_cai, dc_cai, valor_cai, seq_cai
     * 
     * Exemplo:
     * GET /api/v1/caixa/buscar-movimentos?dataInicial=2025-12-01&dataFinal=2025-12-22&codbanco_cai=001
     * 
     * Response:
     * [
     *   {
     *     "dtmovi_cai": "2025-12-01",
     *     "banco_cai": "001",
     *     "nomefan_bco": "CAIXA GERAL",
     *     "dc_cai": "C",
     *     "valor_cai": 1500.50,
     *     "seq_cai": 1,
     *     "historico_cai": "Depósito cliente ABC"
     *   },
     *   {
     *     "dtmovi_cai": "2025-12-02",
     *     "banco_cai": "001",
     *     "nomefan_bco": "CAIXA GERAL",
     *     "dc_cai": "D",
     *     "valor_cai": 500.00,
     *     "seq_cai": 2,
     *     "historico_cai": "Saque operacional"
     *   }
     * ]
     */
    @GetMapping("/buscar-movimentos")
        public ResponseEntity<?> buscarMovimentos(
            @RequestParam String dataInicial,
            @RequestParam String dataFinal,
            @RequestParam(required = false) String codbanco_cai,
            @RequestParam(required = false) String tipocai_cai,
            HttpSession session) {
        
        log.info("[CaixaController] Buscando movimentos - dataInicial={}, dataFinal={}, banco={}, tipo={}", 
                 dataInicial, dataFinal, codbanco_cai, tipocai_cai);
        
        try {
                // Recuperar código da empresa da sessão e repassar ao service
                String empresaGer = SessionHelper.getEmpresaFromSession(session);

                List<Map<String, Object>> movimentos = caixaService.buscarMovimentos(
                    dataInicial, dataFinal, codbanco_cai, tipocai_cai, empresaGer);
            
            log.info("[CaixaController] Encontrados {} movimentos", movimentos.size());
            return ResponseEntity.ok(movimentos);
            
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro validação: {}", e.getMessage());
            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", e.getMessage());
            return ResponseEntity.badRequest().body(erro);
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao buscar movimentos: {}", e.getMessage());
            Map<String, Object> erro = new HashMap<>();
            erro.put("erro", true);
            erro.put("mensagem", "Erro ao buscar movimentos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(erro);
        }
    }

    /**
     * POST /api/v1/caixa/criar-movimento
     * 
     * Criar novo movimento de caixa
     * 
     * @param dadosCaixa Dados do movimento (dtmovi_cai, codbanco_cai, dc_cai, valor_cai)
     * @return Caixa criado com ID gerado
     */
    @PostMapping("/criar-movimento")
    public ResponseEntity<Object> criarMovimento(@RequestBody Map<String, Object> dadosCaixa) {
        try {
            log.info("[CaixaController] Criando novo movimento: {}", dadosCaixa);
            
            // Validar campos obrigatórios
            if (!dadosCaixa.containsKey("dtmovi_cai") || dadosCaixa.get("dtmovi_cai") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "Data do movimento é obrigatória"
                ));
            }
            if (!dadosCaixa.containsKey("codbanco_cai") || dadosCaixa.get("codbanco_cai") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "Banco é obrigatório"
                ));
            }
            if (!dadosCaixa.containsKey("valor_cai") || dadosCaixa.get("valor_cai") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "Valor é obrigatório"
                ));
            }
            
            // Criar movimento via service
            Map<String, Object> resultado = caixaService.criarMovimento(dadosCaixa);
            
            log.info("[CaixaController] Movimento criado com sucesso: {}", resultado);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
            
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro validação ao criar movimento: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "erro", true,
                "mensagem", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao criar movimento: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "erro", true,
                "mensagem", "Erro ao criar movimento: " + e.getMessage()
            ));
        }
    }

    /**
     * PUT /api/v1/caixa/atualizar-movimento
     * 
     * Atualizar movimento de caixa existente
     * 
     * @param dadosCaixa Dados do movimento com ID (id, dtmovi_cai, codbanco_cai, dc_cai, valor_cai)
     * @return Caixa atualizado
     */
    @PutMapping("/atualizar-movimento")
    public ResponseEntity<Object> atualizarMovimento(@RequestBody Map<String, Object> dadosCaixa) {
        try {
            log.info("[CaixaController] Atualizando movimento: {}", dadosCaixa);
            
            boolean hasId = dadosCaixa.containsKey("id") && dadosCaixa.get("id") != null;
            boolean hasSeqCai = dadosCaixa.containsKey("seq_cai") && dadosCaixa.get("seq_cai") != null;
            
            if (!hasId && !hasSeqCai) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "ID ou seq_cai do movimento é obrigatório para atualizar"
                ));
            }
            
            // Atualizar movimento via service
            Map<String, Object> resultado = caixaService.atualizarMovimento(dadosCaixa);
            
            log.info("[CaixaController] Movimento atualizado com sucesso: {}", resultado);
            return ResponseEntity.ok(resultado);
            
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro validação ao atualizar movimento: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "erro", true,
                "mensagem", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao atualizar movimento: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "erro", true,
                "mensagem", "Erro ao atualizar movimento: " + e.getMessage()
            ));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "servico", "CaixaController",
                "versao", "1.0.0"
        ));
    }
    
    // =========================================================================
    // ENDPOINT: Processar Pagamentos Autorizados
    // =========================================================================
    
    /**
     * POST /api/v1/caixa/processar-pagamentos
     * 
     * Processa pagamentos autorizados (cobmag_pag = 'A'), gerando lançamentos
     * no caixa e atualizando os vínculos na tabela PAGAR.
     * 
     * FLUXO:
     * 1. Validar documentos autorizados
     * 2. Validar/trazer ajustes existentes (vlrmult_pag, vlracre_pag, vlrdesc_pag)
     * 3. Obter DC da operação a partir do mascai.dc_ocai
     * 4. Gerar sequência no caixacab
     * 5. Inserir registro na tabela CAIXA
     * 6. Atualizar caixacab com novos débitos/créditos
     * 7. Atualizar campos de vínculo em PAGAR (cobmag_pag='P', seqcai_pag, dtpagi_pag, vlrpag_pag)
     * 
     * @param request Mapa com:
     *   - "pagar_ids" (List<Long>): IDs dos documentos a processar
     *   - "codbanco_cai" (String): Código do banco para lançamento
     *   - "dtmovi_cai" (String): Data do movimento (YYYY-MM-DD)
     * @param session Sessão HTTP com empresa e filial
     * @return Resultado do processamento
     */
    @PostMapping("/processar-pagamentos")
    public ResponseEntity<Object> processarPagamentos(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        log.info("[CaixaController] Processando pagamentos - request: {}", request);
        
        try {
            // Validar campos obrigatórios
            if (!request.containsKey("pagar_ids") || request.get("pagar_ids") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "Lista de IDs de pagamentos é obrigatória"
                ));
            }
            
            if (!request.containsKey("codbanco_cai") || request.get("codbanco_cai") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "Código do banco é obrigatório"
                ));
            }
            
            if (!request.containsKey("dtmovi_cai") || request.get("dtmovi_cai") == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "Data do movimento é obrigatória"
                ));
            }
            
            // Recuperar empresa da sessão
            String empresaGer = SessionHelper.getEmpresaFromSession(session);
            Integer idFil = SessionHelper.getIdFilFromSession(session);
            String filial = String.format("%03d", idFil);
            
            // Delegar ao service
            Map<String, Object> resultado = caixaService.processarPagamentos(
                request,
                empresaGer,
                filial
            );
            
            log.info("[CaixaController] Pagamentos processados com sucesso: {}", resultado);
            return ResponseEntity.ok(resultado);
            
        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro validação ao processar pagamentos: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "erro", true,
                "mensagem", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao processar pagamentos: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "erro", true,
                "mensagem", "Erro ao processar pagamentos: " + e.getMessage()
            ));
        }
    }
    
    /**
     * GET /api/v1/caixa/operacoes-caixa
     * 
     * Lista operações de caixa disponíveis (tabela mascai)
     * 
     * @param dc_ocai Filtro opcional por tipo (D=Crédito, D=Débito)
     * @return Lista de operações
     */
    @GetMapping("/operacoes-caixa")
    public ResponseEntity<Object> listarOperacoesCaixa(
            @RequestParam(required = false) String dc_ocai) {
        
        log.info("[CaixaController] Listando operações de caixa - dc_ocai: {}", dc_ocai);
        
        try {
            List<Map<String, Object>> operacoes = caixaService.listarOperacoesCaixa(dc_ocai);
            return ResponseEntity.ok(operacoes);
        } catch (Exception e) {
            log.error("[CaixaController] Erro ao listar operações: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "erro", true,
                "mensagem", "Erro ao listar operações: " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/v1/caixa/{seqCai}/estornar
     * 
     * Estorna completamente um movimento de caixa:
     * 1. Desvincula todos os documentos (receber/pagar)
     * 2. Marca lote_cai = 'E' no caixa
     * 3. Zera valores e propaga delta inverso ao caixacab
     * 
     * @param seqCai Sequência do caixa
     * @param request Body: { "banco": "00001", "dataMovimento": "2025-06-01", "filial": "001" }
     * @return Resultado do estorno
     */
    @PostMapping("/{seqCai}/estornar")
    public ResponseEntity<Object> estornarMovimento(
            @PathVariable Long seqCai,
            @RequestBody Map<String, Object> request) {

        log.info("[CaixaController] Estornando movimento: seqCai={}, request={}", seqCai, request);

        try {
            String banco = (String) request.get("banco");
            String dataMovimento = (String) request.get("dataMovimento");
            String filial = (String) request.getOrDefault("filial", "001");
            String usuarioLog = (String) request.getOrDefault("usuarioLog", "SYSTEM");

            if (banco == null || dataMovimento == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "Campos obrigatorios: banco, dataMovimento"
                ));
            }

            Map<String, Object> resultado = caixaService.estornarMovimento(seqCai, banco, dataMovimento, filial, usuarioLog);

            return ResponseEntity.ok(resultado);

        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro ao estornar movimento: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "erro", true,
                "mensagem", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("[CaixaController] Erro interno ao estornar movimento: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "erro", true,
                "mensagem", "Erro interno: " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/v1/caixa/{seqCai}/desvincular-documento
     * 
     * Desvincula um documento individual do movimento de caixa.
     * Restaura o saldo em aberto: vlrsal = vlrsal + vlrpag
     * 
     * Chamado quando o usuário clica na lixeira na tabela "Documentos Selecionados"
     * durante a edição de um Movimento de Caixa.
     * 
     * @param seqCai Sequência do caixa (path variable)
     * @param request Body: { "tipo": "R" | "P", "documentoId": 123, "banco": "00001", "dataMovimento": "2025-06-01" }
     * @return Status da desvinculação
     */
    @PostMapping("/{seqCai}/desvincular-documento")
    public ResponseEntity<Object> desvincularDocumento(
            @PathVariable Long seqCai,
            @RequestBody Map<String, Object> request) {

        log.info("[CaixaController] Desvinculando documento do caixa: seqCai={}, request={}", seqCai, request);

        try {
            String tipo = (String) request.get("tipo");
            Object docIdObj = request.get("documentoId");
            String banco = (String) request.get("banco");
            String dataMovimento = (String) request.get("dataMovimento");

            if (tipo == null || docIdObj == null || banco == null || dataMovimento == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "Campos obrigatórios: tipo, documentoId, banco, dataMovimento"
                ));
            }

            if (!tipo.equals("R") && !tipo.equals("P")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "erro", true,
                    "mensagem", "tipo deve ser 'R' (Receber) ou 'P' (Pagar)"
                ));
            }

            Long documentoId = Long.valueOf(docIdObj.toString());

            caixaService.desvincularDocumentoIndividual(seqCai, tipo, documentoId, banco, dataMovimento);

            return ResponseEntity.ok(Map.of(
                "sucesso", true,
                "mensagem", "Documento desvinculado com sucesso",
                "seqCai", seqCai,
                "documentoId", documentoId,
                "tipo", tipo
            ));

        } catch (IllegalArgumentException e) {
            log.error("[CaixaController] Erro ao desvincular documento: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "erro", true,
                "mensagem", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("[CaixaController] Erro interno ao desvincular documento: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "erro", true,
                "mensagem", "Erro interno: " + e.getMessage()
            ));
        }
    }
}
