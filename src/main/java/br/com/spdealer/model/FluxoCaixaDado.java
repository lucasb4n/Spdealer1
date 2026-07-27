package br.com.spdealer.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * FluxoCaixaDado - Valores Mensais do Fluxo de Caixa
 * 
 * Tabela que armazena os valores mensais (esperado e real) para cada linha
 * do fluxo de caixa.
 * 
 * Uma linha do fluxo pode ter múltiplos dados (um por mês/ano).
 * 
 * Valores agregados:
 * - valor_esperado: Planejamento (preenchido manualmente)
 * - valor_real: Realizado (calculado de CAIXA/RECEBER/PAGAR)
 * - variacao: Diferença (real - esperado)
 * - percentual_variacao: % de desvio
 * 
 * Exemplo:
 * - linha_id=1 (MATERIAL), ano=2025, mes=11:
 *   - valor_esperado = 5.000,00
 *   - valor_real = 4.850,00
 *   - variacao = -150,00
 *   - percentual = -3,00%
 * 
 * Relacionamentos:
 * - N:1 com FluxoCaixaLinha (via linha_id)
 * 
 * @author Sistema SPDealer
 * @version 1.0
 */
@Entity
@Table(
    name = "fluxo_caixa_dados",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = { "linha_id", "ano", "mes" },
            name = "uk_fluxo_periodo"
        )
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FluxoCaixaDado {
    
    /**
     * Identificador único do dado.
     * Auto-incremento (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    /**
     * Referência para a linha do fluxo.
     * FK para FluxoCaixaLinha.id
     * 
     * Uma linha pode ter múltiplos dados (um por período).
     */
    @Column(name = "linha_id", nullable = false, updatable = false)
    private Long linhaId;
    
    /**
     * Ano do período.
     * Exemplo: 2025
     */
    @Column(name = "ano", nullable = false, updatable = false)
    private Integer ano;
    
    /**
     * Mês do período (1-12).
     * Exemplo: 11 (novembro)
     */
    @Column(name = "mes", nullable = false, updatable = false)
    private Integer mes;
    
    /**
     * Valor Esperado (Planejamento).
     * 
     * Preenchido manualmente pelo usuário através da API.
     * Exemplo: 5.000,00 (para planejamento do mês)
     * 
     * Pode ser NULL se ainda não foi informado.
     */
    @Column(name = "valor_esperado", precision = 15, scale = 2)
    private BigDecimal valorEsperado;
    
    /**
     * Valor Real (Realizado).
     * 
     * Calculado automaticamente a partir de:
     * - SUM(caixa.vlr_cai) para operacao_cai
     * - SUM(receber.vlr_rec) para opercai_rec
     * - SUM(pagar.vlr_pag) para opercai_pag
     * 
     * Preenchido por scheduler ou manualmente via API.
     * Exemplo: 4.850,00 (valores reais do mês)
     */
    @Column(name = "valor_real", precision = 15, scale = 2)
    private BigDecimal valorReal;
    
    /**
     * Variação (Diferença).
     * 
     * Cálculo: valor_real - valor_esperado
     * 
     * Exemplo: 4.850,00 - 5.000,00 = -150,00
     * 
     * Valores:
     * - Negativo: Real foi menor que esperado (desvio negativo)
     * - Positivo: Real foi maior que esperado (desvio positivo)
     */
    @Column(name = "variacao", precision = 15, scale = 2)
    private BigDecimal variacao;
    
    /**
     * Percentual de Variação.
     * 
     * Cálculo: (variacao / valor_esperado) * 100
     * 
     * Exemplo: (-150,00 / 5.000,00) * 100 = -3,00%
     * 
     * Útil para análise comparativa de desvios.
     */
    @Column(name = "percentual_variacao", precision = 5, scale = 2)
    private BigDecimal percentualVariacao;
    
    /**
     * Data de criação (preenchida automaticamente via @PrePersist).
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Data da última atualização (preenchida automaticamente via @PreUpdate).
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Relacionamento N:1 com FluxoCaixaLinha.
     * 
     * Muitos dados se relacionam com uma linha.
     * 
     * Estratégia:
     * - @JoinColumn: Usa linha_id como FK
     * - insertable=false, updatable=false: Porque a coluna é preenchida manualmente
     * - FetchType.EAGER: Carrega linha junto ao buscar dado
     * 
     * Exemplo de uso:
     *   FluxoCaixaDado dado = repository.findById(1L);
     *   String operacao = dado.getLinha().getOperacaoOcai(); // "001"
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
        name = "linha_id",
        referencedColumnName = "id",
        insertable = false,
        updatable = false,
        nullable = false
    )
    private FluxoCaixaLinha linha;
    
    // ===== Lifecycle Callbacks =====
    
    /**
     * Preenchimento automático antes de inserir na base.
     * Método chamado automaticamente pelo JPA.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        calcularVariacao();  // Calcula variação ao inserir
    }
    
    /**
     * Atualização automática antes de atualizar na base.
     * Método chamado automaticamente pelo JPA.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calcularVariacao();  // Recalcula variação ao atualizar
    }
    
    // ===== Métodos Utilitários =====
    
    /**
     * Calcula e atualiza campos derivados (variacao, percentualVariacao).
     * 
     * Chamado automaticamente em @PrePersist e @PreUpdate.
     * Pode também ser chamado manualmente após alterar valores.
     * 
     * Lógica:
     * - Se valorEsperado e valorReal não estão preenchidos: não calcula
     * - Calcula: variacao = valorReal - valorEsperado
     * - Calcula: percentualVariacao = (variacao / valorEsperado) * 100
     * - Proteção contra divisão por zero
     */
    public void calcularVariacao() {
        if (valorEsperado == null || valorReal == null) {
            this.variacao = null;
            this.percentualVariacao = null;
            return;
        }
        
        // Variação = Valor Real - Valor Esperado
        this.variacao = valorReal.subtract(valorEsperado);
        
        // Percentual = (Variação / Valor Esperado) * 100
        if (valorEsperado.compareTo(BigDecimal.ZERO) != 0) {
            this.percentualVariacao = variacao
                .divide(valorEsperado, 4, java.math.RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        } else {
            this.percentualVariacao = null;  // Evita divisão por zero
        }
    }
    
    /**
     * Verifica se há desvio (variação != 0).
     * @return true se há desvio, false caso contrário
     */
    public boolean temDesvio() {
        return variacao != null && variacao.compareTo(BigDecimal.ZERO) != 0;
    }
    
    /**
     * Verifica se o desvio é negativo (real < esperado).
     * @return true se negativo, false caso contrário
     */
    public boolean desvioNegativo() {
        return variacao != null && variacao.compareTo(BigDecimal.ZERO) < 0;
    }
    
    /**
     * Verifica se o desvio é positivo (real > esperado).
     * @return true se positivo, false caso contrário
     */
    public boolean desvioPositivo() {
        return variacao != null && variacao.compareTo(BigDecimal.ZERO) > 0;
    }
    
    /**
     * Retorna representação string do dado.
     * Útil para logs e debugging.
     * 
     * Formato: "FluxoDado(MES/ANO - ESPERADO: XXX, REAL: YYY, VARIACAO: ZZZ%)"
     * Exemplo: "FluxoDado(11/2025 - ESPERADO: 5000, REAL: 4850, VARIACAO: -3.0%)"
     */
    @Override
    public String toString() {
        return String.format(
            "FluxoDado(%02d/%d - ESPERADO: %s, REAL: %s, VAR: %s%%)",
            mes,
            ano,
            valorEsperado != null ? valorEsperado.toPlainString() : "N/A",
            valorReal != null ? valorReal.toPlainString() : "N/A",
            percentualVariacao != null ? percentualVariacao.toPlainString() : "N/A"
        );
    }
}
