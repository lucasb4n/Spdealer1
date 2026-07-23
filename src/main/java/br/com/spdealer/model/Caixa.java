package br.com.spdealer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Caixa Entity
 * 
 * Representa lançamentos de caixa e bancos
 * Tabela: caixa
 * Chave Primária: seq_cai (auto_increment)
 * 
 * Estrutura de dados:
 * - seq_cai: Número sequencial do lançamento
 * - dtmovi_cai: Data do movimento (date)
 * - dc_cai: Tipo de movimento ('D' = débito, 'C' = crédito)
 * - valor_cai: Valor do lançamento (decimal 15,2)
 * - filial_cai: Filial (char 3, fixo '001')
 * - banco_cai: Código do banco (char 3, FK para bancos.codigo_bco)
 * - cliente_cai: Código da origem/cliente (char 5)
 * - historico_cai: Descrição/histórico do lançamento (text)
 * 
 * Relacionamentos:
 * - Nenhum (tabela de lançamentos simples)
 * 
 * Exemplo de dados:
 * seq_cai=1001, dtmovi_cai=2025-11-05, dc_cai='C', valor_cai=1500.50,
 * filial_cai='001', banco_cai='001', cliente_cai='00001', historico_cai='Depósito cliente XYZ'
 */
@Entity
@Table(name = "caixa")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Caixa {

    /**
     * Chave primária - Sequencial
     */
    @Id
    @Column(name = "seq_cai")
    private Long seqCai;

    /**
     * Data do movimento (YYYY-MM-DD)
     * Obrigatório - representa quando ocorreu o lançamento
     */
    @Column(name = "dtmovi_cai", nullable = false)
    private LocalDate dtmoviCai;

    /**
     * Tipo de movimento
     * 'D' = Débito (saída de recursos)
     * 'C' = Crédito (entrada de recursos)
     * Obrigatório
     */
    @Column(name = "dc_cai", nullable = false, length = 1)
    private String dcCai;

    /**
     * Valor do lançamento
     * Sempre positivo (tipo indicado em dc_cai)
     * Obrigatório - deve ser > 0
     */
    @Column(name = "valor_cai", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorCai;

    /**
     * Código da filial
     * Geralmente fixo em '001'
     * Padrão SPDealer
     */
    @Column(name = "filial_cai", nullable = false, length = 3)
    @Builder.Default
    private String filialCai = "001";

    /**
     * Código do banco/caixa
     * FK para bancos.codigo_bco
     * Exemplos: '001' (Caixa/Bancos), '002' (Viagem), '003' (Funcionários)
     * Obrigatório
     */
    @Column(name = "codbanco_cai", nullable = false, length = 5)
    private String bancoCai;

    /**
     * Código da origem/cliente
     * FK para bancos.codigo_bco ou clientes.codigo
     * Obrigatório
     */
    @Column(name = "clifor_cai", nullable = false, length = 6)
    private String clienteCai;

    @Column(name = "credcli_cai", length = 6)
    private String credcliCai;

    /**
     * Operação de Caixa
     * Categoria do lançamento (ex: depósito, saque, transferência)
     * Máximo 3 caracteres
     */
    @Column(name = "operacao_cai", length = 3)
    private String operacaoCai;

    /**
     * Portador (para cheques ou cartões)
     * Nome da pessoa/cartão que movimentou
     * Máximo 40 caracteres
     */
    @Column(name = "portador_cai", length = 40)
    private String portadorCai;

    /**
     * Departamento responsável
     * Classificação interna
     * Máximo 3 caracteres
     */
    @Column(name = "dpto_cai", length = 3)
    private String deptoCai;

    /**
     * Descrição/histórico do lançamento
     * Minino 5 caracteres
     * Exemplos: "Depósito cliente XYZ", "Pagamento fornecedor ABC"
     * Obrigatório
     */
    @Column(name = "histor_cai", nullable = false, length = 300)
    private String historicoCai;

    /**
     * Histórico Contábil
     * Registro adicional para fins de auditoria contábil
     * Texto livre
     */
    @Column(name = "histcont_cai", length = 100)
    private String historicoContabil;

    /**
     * Referência a documentos selecionados
     * Armazena IDs de receber/pagar que foram vinculados
     * Formato JSON: [{"tipo":"receber","id":123},{"tipo":"pagar","id":456}]
     */
    @Transient
    private String documentosVinculados;

    /**
     * Valor total dos documentos vinculados
     * Deve bater com valor_cai (validação crítica)
     */
    @Transient
    private BigDecimal valorDocumentos;

    /**
     * Timestamps de auditoria (para future use com audit table)
     */
    @Transient
    private LocalDateTime createdAt;

    @Transient
    private LocalDateTime updatedAt;

    /**
     * Lifecycle Callbacks
     */
    @PrePersist
    protected void onCreate() {
        if (filialCai == null) {
            filialCai = "001";
        }
    }

    /**
     * Helper: Verificar se é crédito
     */
    public boolean isCredito() {
        return "C".equals(dcCai);
    }

    /**
     * Helper: Verificar se é débito
     */
    public boolean isDebito() {
        return "D".equals(dcCai);
    }

    /**
     * Helper: Obter valor com sinal (para cálculos)
     * Retorna valor positivo para crédito, negativo para débito
     */
    public BigDecimal getValorComSinal() {
        return isDebito() ? valorCai.negate() : valorCai;
    }

    /**
     * VALIDAÇÃO CRÍTICA: Conferir se valor dos documentos bate com valor lançado
     * 
     * Regra: A soma dos valores dos documentos selecionados DEVE bater exatamente
     * com o valor_cai. Se não bater, a operação não pode ser gravada.
     * 
     * @return true se valores conferem, false caso contrário
     */
    public boolean isValoresEmConferencia() {
        // Se nenhum documento vinculado, assumir que tudo OK (pode ser crédito/débito direto)
        if (valorDocumentos == null) {
            return true;
        }
        // Comparar com precisão: 2 casas decimais (BD.compareTo)
        return valorCai.setScale(2, java.math.RoundingMode.HALF_UP)
                .equals(valorDocumentos.setScale(2, java.math.RoundingMode.HALF_UP));
    }

    /**
     * Obter diferença entre valor lançado e documentos vinculados
     * Útil para exibir erro de conferência ao usuário
     * 
     * @return diferença (0 = OK, negativo = falta, positivo = sobra)
     */
    public BigDecimal getDiferencaConferencia() {
        if (valorDocumentos == null) {
            return BigDecimal.ZERO;
        }
        return valorCai.subtract(valorDocumentos);
    }

    @Override
    public String toString() {
        return "Caixa{" +
                "seqCai=" + seqCai +
                ", dtmoviCai=" + dtmoviCai +
                ", dcCai='" + dcCai + '\'' +
                ", valorCai=" + valorCai +
                ", bancoCai='" + bancoCai + '\'' +
                ", historicoCai='" + historicoCai + '\'' +
                '}';
    }
}
