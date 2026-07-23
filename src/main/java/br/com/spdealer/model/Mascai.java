package br.com.spdealer.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mascai - Catálogo de Operações de Caixa
 * 
 * Tabela que mapeia as operações que podem ser lançadas em caixa.
 * Cada operação se relaciona com uma conta do plano de contas (SCOPLA).
 * 
 * Exemplo:
 * - operacao_ocai = "001" → MATERIAL DE USO (contad_ocai = 0004111080001)
 * - operacao_ocai = "500" → RECEBER CLIENTE (contad_ocai = 0005111010001)
 * - operacao_ocai = "700" → PAGAR FORNECEDOR (contad_ocai = 0007111020001)
 * 
 * Relacionamentos:
 * - 1 Mascai → N FluxoCaixaLinhas
 * - 1 Mascai → N Caixa.operacao_cai
 * - 1 Mascai → N Receber.opercai_rec
 * - 1 Mascai → N Pagar.opercai_pag
 * 
 * @author Sistema SPDealer
 * @version 1.0
 */
@Entity
@Table(name = "mascai")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mascai {
    
    /**
     * Código da operação de caixa (PK).
     * Exemplo: "001", "500", "700"
     * Tamanho: VARCHAR(10)
     */
    @Id
    @Column(name = "operacao_ocai", length = 10)
    private String operacaoOcai;
    
    /**
     * Descrição da operação de caixa.
     * Exemplo: "MATERIAL DE USO E CONSUMO", "RECIBOS", "RECEBER CLIENTE"
     */
    @Column(name = "descricao_ocai", length = 100)
    private String descricaoOcai;
    
    /**
     * Código da conta do plano de contas (FK para SCOPLA).
     * Exemplo: "0004111080001", "0005111010001"
     * 
     * Esta coluna liga a operação de caixa a uma conta contábil específica
     * que será usada no fluxo de caixa para agregar valores.
     */
    @Column(name = "contad_ocai", length = 20)
    private String contadOcai;
    
    /**
     * Nível hierárquico no plano de contas.
     * Normalmente nível 4 para operações de caixa.
     */
    @Column(name = "nivel")
    private Integer nivel;
    
    /**
     * Status da operação ('S' = Ativa, 'N' = Inativa).
     * Apenas operações ativas devem ser usadas em novos lançamentos.
     */
    @Column(name = "ativo", length = 1)
    private Character ativo;
    
    /**
     * Empresa a que pertence (chave composta com operacao_ocai).
     * Normalmente "001" para empresa principal.
     */
    @Column(name = "empresa_ger", length = 3)
    private String empresaGer;
    
    /**
     * Data de criação (preenchida automaticamente).
     */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Data da última atualização.
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Relacionamento 1:N com FluxoCaixaLinhas.
     * Uma operação de caixa pode ter uma ou mais linhas no fluxo.
     * 
     * Lazy loading para evitar carregar todos os dados desnecessariamente.
     */
    @OneToMany(mappedBy = "mascai", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FluxoCaixaLinha> fluxoLinhas;
    
    // ===== Métodos Utilitários =====
    
    /**
     * Verifica se a operação está ativa.
     * @return true se ativa, false caso contrário
     */
    public boolean isAtivo() {
        return 'S' == ativo;
    }
    
    /**
     * Ativa a operação.
     */
    public void ativar() {
        this.ativo = 'S';
    }
    
    /**
     * Desativa a operação.
     */
    public void desativar() {
        this.ativo = 'N';
    }
    
    /**
     * Retorna representação string da operação.
     * Útil para logs e debugging.
     */
    @Override
    public String toString() {
        return String.format("Mascai(%s - %s)", operacaoOcai, descricaoOcai);
    }
}
