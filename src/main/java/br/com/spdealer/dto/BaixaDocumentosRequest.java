package br.com.spdealer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO para requisição de baixa de documentos via movimento de caixa
 * 
 * DADOS ENVIADOS PELO FRONTEND:
 * {
 *   "tipo": "RECEBER",
 *   "documentoIds": [1, 2, 3, 4],
 *   "totalBaixa": 1000.00,
 *   "dataMovimento": "2025-11-08"
 * }
 * 
 * UTILIZADOS NO BACKEND PARA:
 * 1. Validar se totais conferem
 * 2. Atualizar campos na tabela receber/pagar
 * 3. Gravar LOG de auditoria
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaixaDocumentosRequest {

    /**
     * Tipo de documento: "RECEBER" ou "PAGAR"
     * - RECEBER: Atualiza tabela receber (crédito de caixa)
     * - PAGAR: Atualiza tabela pagar (débito de caixa)
     */
    private String tipo;

    /**
     * Lista de IDs dos documentos selecionados para baixa
     * Exemplo: [1, 2, 3, 4] = códigos_rec ou códigos_pag
     */
    private List<Long> documentoIds;

    /**
     * Total dos documentos selecionados
     * Deve ser IGUAL ao valor do movimento de caixa
     * Exemplo: 1000.00
     */
    private Double totalBaixa;

    /**
     * Data do lançamento do movimento de caixa
     * Formato: YYYY-MM-DD
     * Usada para popular dtpagi_rec/dtpag_rec, dtpag_rec/dtpag_pag
     */
    private String dataMovimento;

    /**
     * ID do movimento de caixa
     * Usado para rastrear qual movimento fez a baixa
     * Gravado em LOG de auditoria
     */
    private Long movimentoId;

    /**
     * Código da operação (oper_cai)
     * 100 = Manual, 200 = Sistema, etc
     */
    private Integer operacao;

    /**
     * Sequência do movimento no dia
     * Gravada em seqcai_rec / seqcai_pag
     */
    private Integer sequencia;

    /**
     * Código do cliente/fornecedor
     * Usado para validação cruzada
     */
    private String clienteFornecedor;

}
