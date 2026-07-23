package br.com.spdealer.controller;

import br.com.spdealer.service.FluxoCaixaProjetadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * FluxoCaixaProjetadoController - REST API para Projeção de Fluxo de Caixa (90 dias)
 *
 * Endpoints:
 * GET /api/v1/fluxo-caixa-projetado/diario       → Fluxo diário (próximos 90 dias)
 * GET /api/v1/fluxo-caixa-projetado/mensal       → Resumo por mês
 * GET /api/v1/fluxo-caixa-projetado/melhores-dias → Top 5 dias para pagar
 * GET /api/v1/fluxo-caixa-projetado/dia/{data}  → Detalhes de um dia (drill-down)
 * GET /api/v1/fluxo-caixa-projetado/risco        → Análise de risco
 * GET /api/v1/fluxo-caixa-projetado/recomendacao → Recomendação de pagamento
 */
@RestController
@RequestMapping("/api/v1/fluxo-caixa-projetado")
public class FluxoCaixaProjetadoController {

    @Autowired
    private FluxoCaixaProjetadoService fluxoCaixaProjetadoService;

    /**
     * 1️⃣ GET /api/v1/fluxo-caixa-projetado/diario
     *
     * Retorna fluxo de caixa consolidado por dia para próximos 90 dias.
     * Cada dia mostra: total_receber, total_pagar, saldo_diario, saldo_acumulado, indicador
     *
     * @param session HttpSession (extrai id_fil)
     * @return Lista de dados diários
     */
    @GetMapping("/diario")
    public ResponseEntity<List<Map<String, Object>>> obterFluxoCaixaDiario(
            HttpSession session,
            @RequestParam(value = "filial", required = false) String filialParam) {
        String filial = filialParam != null ? filialParam : obterFilialDaSessao(session);
        List<Map<String, Object>> resultado = fluxoCaixaProjetadoService.obterFluxoCaixaDiario(filial);
        return ResponseEntity.ok(resultado);
    }

    /**
     * 2️⃣ GET /api/v1/fluxo-caixa-projetado/mensal
     *
     * Retorna resumo consolidado por mês.
     * Útil para visualização de tendências mensais.
     *
     * @param session HttpSession (extrai id_fil)
     * @return Lista de dados mensais
     */
    @GetMapping("/mensal")
    public ResponseEntity<List<Map<String, Object>>> obterResumoMensal(HttpSession session) {
        String filial = obterFilialDaSessao(session);
        List<Map<String, Object>> resultado = fluxoCaixaProjetadoService.obterResumoMensal(filial);
        return ResponseEntity.ok(resultado);
    }

    /**
     * 3️⃣ GET /api/v1/fluxo-caixa-projetado/melhores-dias
     *
     * Retorna top 5 melhores dias para realizar pagamentos.
     * Score baseado em: 40% saldo acumulado + 60% recebimentos do dia
     *
     * @param session HttpSession (extrai id_fil)
     * @return Lista dos 5 melhores dias
     */
    @GetMapping("/melhores-dias")
    public ResponseEntity<List<Map<String, Object>>> obterMelhorDiasPagar(HttpSession session) {
        String filial = obterFilialDaSessao(session);
        List<Map<String, Object>> resultado = fluxoCaixaProjetadoService.obterMelhorDiasPagar(filial);
        return ResponseEntity.ok(resultado);
    }

    /**
     * 4️⃣ GET /api/v1/fluxo-caixa-projetado/dia/{data}
     *
     * Retorna detalhes de TODOS os documentos (receber + pagar) para um dia específico.
     * Utilizado pelo modal "drill-down" quando usuário expande um dia no AG Grid.
     *
     * Parâmetro de data: formato YYYY-MM-DD (ex: 2025-12-15)
     *
     * Retorna campos:
     * - tipo_movimento: RECEBER ou PAGAR
     * - numero_documento: numdup_rec ou numdup_pag
     * - parcela: parcela_rec ou parcela_pag
     * - valor: vlrsal_rec ou vlrsal_pag
     * - cnpj_cpf: cgccpf_rec ou cgccpf_pag
     * - nome_pessoa: cli.nome_cli (de clientes, com cliforn_cli = 'C' para receber ou 'F' para pagar)
     * - tipo_pessoa: J (CNPJ) ou F (CPF)
     * - data_vencimento: dtvenci_rec ou dtvenci_pag
     * - data_emissao: dtemissi_rec ou dtemissi_pag
     * - status: status_rec ou status_pag
     *
     * @param session HttpSession (extrai id_fil)
     * @param data Data em formato YYYY-MM-DD
     * @return Lista de documentos do dia
     */
    @GetMapping("/dia/{data}")
    public ResponseEntity<List<Map<String, Object>>> obterDetalhesDocumentosPorDia(
            @PathVariable String data,
            HttpSession session) {
        try {
            String filial = obterFilialDaSessao(session);
            LocalDate dataLocal = LocalDate.parse(data);  // Converte YYYY-MM-DD → LocalDate
            List<Map<String, Object>> resultado = fluxoCaixaProjetadoService.obterDetalhesDocumentosPorDia(filial, dataLocal);
            return ResponseEntity.ok(resultado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 5️⃣ GET /api/v1/fluxo-caixa-projetado/risco
     *
     * Retorna análise completa de risco para os próximos 90 dias.
     * Inclui: saldo máx/mín, dias críticos, percentual em atenção, etc
     *
     * @param session HttpSession (extrai id_fil)
     * @return Map com indicadores de risco
     */
    @GetMapping("/risco")
    public ResponseEntity<Map<String, Object>> obterAnaliseRisco(HttpSession session) {
        String filial = obterFilialDaSessao(session);
        Map<String, Object> resultado = fluxoCaixaProjetadoService.calcularAnaliseRisco(filial);
        return ResponseEntity.ok(resultado);
    }

    /**
     * 6️⃣ GET /api/v1/fluxo-caixa-projetado/recomendacao
     *
     * Retorna recomendação de estratégia de pagamento em formato texto.
     * Inclui: análise de risco, melhores dias, ações recomendadas
     *
     * @param session HttpSession (extrai id_fil)
     * @return Map com string de recomendação
     */
    @GetMapping("/recomendacao")
    public ResponseEntity<Map<String, Object>> obterRecomendacao(HttpSession session) {
        String filial = obterFilialDaSessao(session);
        String recomendacao = fluxoCaixaProjetadoService.gerarRecomendacaoPagamento(filial);
        Map<String, Object> resultado = Map.of("recomendacao", recomendacao);
        return ResponseEntity.ok(resultado);
    }

    /**
     * Extrai código da filial da sessão
     * Padrão: session.getAttribute("id_fil") → "001"
     *
     * @param session HttpSession
     * @return String com código da filial (ex: "001")
     */
    private String obterFilialDaSessao(HttpSession session) {
        Object idFil = session.getAttribute("id_fil");
        return idFil != null ? idFil.toString() : "001";  // Padrão: "001"
    }
}
