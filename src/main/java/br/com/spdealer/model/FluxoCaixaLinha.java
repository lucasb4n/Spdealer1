package br.com.spdealer.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * FluxoCaixaLinha - Estrutura do Fluxo de Caixa
 * 
 * Tabela que armazena a estrutura das linhas do fluxo de caixa.
 * Cada linha corresponde a uma operação de caixa (Mascai) e 
 * uma conta do plano de contas (SCOPLA).
 * 
 * Dados são copiados de SCOPLA/MASCAI e armazenados aqui para:
 * - Rastreabilidade histórica
 * - Performance (não precisa fazer JOIN toda vez)
 * - Auditoria (saber qual era a descrição no momento do lançamento)
 * 
 * Exemplo:
 * - id=1: MATERIAL DE USO (operacao_ocai=001, contad_ocai=0004111080001)
 * - id=2: RECEBER CLIENTE (operacao_ocai=500, contad_ocai=0005111010001)
 * - id=3: PAGAR FORNECEDOR (operacao_ocai=700, contad_ocai=0007111020001)
 * 
 * Relacionamentos:
 * - N:1 com Mascai (via operacao_ocai)
 * - 1:N com FluxoCaixaDado (valores mensais)
 * 
 * @author Sistema SPDealer
 * @version 1.0
 */
@Entity
@Table(
    name = "fluxo_caixa_linhas",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = { "contad_ocai", "operacao_ocai" },
            name = "uk_fluxo_linha"
        )
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FluxoCaixaLinha {
    
    /**
     * Identificador único da linha.
     * Auto-incremento (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    /**
     * Código da conta do plano de contas (SCOPLA).
     * Exemplo: "0004111080001", "0005111010001"
     * 
     * Copiado de Mascai.contadOcai para rastreabilidade.
     * Não é atualizado após inserção (como referência histórica).
     */
    @Column(name = "contad_ocai", length = 20, nullable = false, updatable = false)
    private String contadOcai;
    
    /**
     * Código da operação de caixa (MASCAI).
     * Exemplo: "001", "500", "700"
     * 
     * Copiado de Mascai.operacaoOcai.
     * FK para Mascai (via @ManyToOne).
     */
    @Column(name = "operacao_ocai", length = 10, nullable = false, updatable = false)
    private String operacaoOcai;
    
    /**
     * Descrição da conta do plano de contas.
     * Copiado de SCOPLA.descri_scopla.
     * Exemplo: "MATERIAL DE USO E CONSUMO", "RECEBER CLIENTE"
     */
    @Column(name = "descri_scopla", length = 100)
    private String descriScopla;
    
    /**
     * Descrição da operação de caixa.
     * Copiado de Mascai.descricaoOcai.
     * Exemplo: "RECIBOS", "MATERIAL DE USO"
     */
    @Column(name = "descricao_ocai", length = 100)
    private String descricaoOcai;
    
    /**
     * Nível hierárquico no plano de contas.
     * Normalmente 4 para operações de caixa.
     */
    @Column(name = "nivel")
    private Integer nivel;
    
    /**
     * Ordem de exibição no fluxo de caixa.
     * Define a sequência em que as linhas aparecem nos relatórios.
     */
    @Column(name = "ordem")
    private Integer ordem;
    
    /**
     * Status da linha ('S' = Ativa, 'N' = Inativa).
     * Apenas linhas ativas são incluídas nos cálculos do fluxo.
     */
    @Column(name = "ativo", length = 1, nullable = false)
    private Character ativo;
    
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
     * Relacionamento N:1 com Mascai.
     * 
     * Uma linha do fluxo se relaciona com uma operação de caixa.
     * 
     * Estratégia:
     * - @JoinColumn: Usa operacao_ocai como FK
     * - insertable=false, updatable=false: Porque a coluna é preenchida manualmente
     * - FetchType.EAGER: Carrega Mascai junto ao buscar linha
     * 
     * Exemplo de uso:
     *   FluxoCaixaLinha linha = repository.findById(1L);
     *   String operacao = linha.getMascai().getDescricaoOcai(); // MATERIAL DE USO
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(
        name = "operacao_ocai",
        referencedColumnName = "operacao_ocai",
        insertable = false,
        updatable = false,
        nullable = false
    )
    private Mascai mascai;
    
    /**
     * Relacionamento 1:N com FluxoCaixaDado.
     * 
     * Uma linha do fluxo tem muitos dados (um por mês/ano).
     * 
     * Estratégia:
     * - mappedBy = "linha": FluxoCaixaDado.linha é o proprietário
     * - cascade = CascadeType.ALL: Deletar dados ao deletar linha
     * - fetch = FetchType.LAZY: Não carregar dados automaticamente
     * 
     * Exemplo de uso:
     *   FluxoCaixaLinha linha = repository.findById(1L);
     *   List<FluxoCaixaDado> dados = linha.getDados(); // Dados (lazy-loaded)
     */
    @OneToMany(
        mappedBy = "linha",
        cascade = CascadeType.ALL,
        fetch = FetchType.LAZY,
        orphanRemoval = true
    )
    private List<FluxoCaixaDado> dados;
    
    // ===== Lifecycle Callbacks =====
    
    /**
     * Preenchimento automático antes de inserir na base.
     * Método chamado automaticamente pelo JPA.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.ativo == null) {
            this.ativo = 'S';  // Padrão: ativo
        }
    }
    
    /**
     * Atualização automática antes de atualizar na base.
     * Método chamado automaticamente pelo JPA.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // ===== Métodos Utilitários =====
    
    /**
     * Verifica se a linha está ativa.
     * @return true se ativa, false caso contrário
     */
    public boolean isAtivo() {
        return 'S' == ativo;
    }
    
    /**
     * Ativa a linha (para incluir nos cálculos).
     */
    public void ativar() {
        this.ativo = 'S';
    }
    
    /**
     * Desativa a linha (para excluir dos cálculos).
     */
    public void desativar() {
        this.ativo = 'N';
    }
    
    /**
     * Retorna representação string da linha.
     * Útil para logs e debugging.
     * 
     * Formato: "FluxoLinha(OPERACAO - DESCRICAO)"
     * Exemplo: "FluxoLinha(001 - MATERIAL DE USO E CONSUMO)"
     */
    @Override
    public String toString() {
        return String.format(
            "FluxoLinha(%s - %s)",
            operacaoOcai,
            descriScopla != null ? descriScopla : descricaoOcai
        );
    }
}
