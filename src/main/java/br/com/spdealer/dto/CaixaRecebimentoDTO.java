package br.com.spdealer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO: CaixaRecebimentoDTO
 * Representa um lançamento no caixa com os títulos selecionados para baixa
 * 
 * Fluxo:
 * 1. Usuário seleciona [C]liente ou [F]ornecedor
 * 2. Sistema busca títulos em aberto via GET /api/v1/caixa/titulos-abertos
 * 3. Modal AG-Grid exibe títulos com checkbox
 * 4. Usuário seleciona títulos e valida valores
 * 5. POST /api/v1/caixa/lancamentos/com-recebimento com este DTO
 * 6. Backend valida se soma dos títulos = valor_cai (CRÍTICO!)
 * 7. Se OK: grava lançamento caixa + marca títulos como pagos
 * 8. Se ERRO: retorna mensagem de validação
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CaixaRecebimentoDTO {
    
    // ========== DADOS DO LANÇAMENTO CAIXA ==========
    
    /**
     * Data do movimento (YYYY-MM-DD)
     */
    private LocalDate dtmovi;
    
    /**
     * Tipo: 'C' (Crédito/Entrada), 'D' (Débito/Saída)
     */
    private String dcCaixa;
    
    /**
     * Valor do movimento (ex: 1500.00)
     * CRÍTICO: Deve ser igual à soma dos títulos selecionados!
     */
    private BigDecimal valorCaixa;
    
    /**
     * Código do banco/caixa (ex: '001')
     */
    private String bancoCaixa;
    
    /**
     * Histórico/descrição do movimento (ex: "Recebimento de títulos")
     */
    private String historicoCaixa;
    
    // ========== DADOS DO CLIENTE/FORNECEDOR ==========
    
    /**
     * Tipo de entidade: 'C' (Cliente), 'F' (Fornecedor)
     */
    private String tipoEntidade;
    
    /**
     * ID do cliente ou fornecedor
     */
    private String clienteFornecedorId;
    
    /**
     * Nome do cliente/fornecedor (para exibição)
     */
    private String clienteFornecedorNome;
    
    // ========== TÍTULOS SELECIONADOS PARA BAIXA ==========
    
    /**
     * Lista de títulos selecionados para serem baixados
     * Validação: SUM(valor_titulo) DEVE ser = valorCaixa
     */
    private List<TituloSelecaoDTO> titulosSelecionados;
    
    /**
     * Total dos títulos selecionados (calculado no frontend)
     * Backend valida: totalTitulosSelecionados == valorCaixa
     */
    private BigDecimal totalTitulosSelecionados;
    
    // ========== VALIDAÇÃO ==========
    
    /**
     * Flag de validação: true se valores batem
     * Backend retorna erro se false
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean valoresConferem;
    
    /**
     * Mensagem de erro de validação (se houver)
     */
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private String mensagemErro;
    
    // ========== INNER CLASS: TITULO SELECIONADO ==========
    
    /**
     * Representa um título selecionado para baixa
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TituloSelecaoDTO {
        
        /**
         * ID do documento (receber ou pagar)
         */
        private Long documentoId;
        
        /**
         * Número do título (ex: "001234")
         */
        private String numeroTitulo;
        
        /**
         * Data de vencimento do título
         */
        private LocalDate dataVencimento;
        
        /**
         * Valor do título
         */
        private BigDecimal valorTitulo;
        
        /**
         * Saldo pendente
         */
        private BigDecimal saldoPendente;
        
        /**
         * Descrição/histórico do título
         */
        private String descricao;
        
        /**
         * Tipo: 'R' (Receber), 'P' (Pagar)
         */
        private String tipoTitulo;
    }
}
