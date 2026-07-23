package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Program Entity
 * 
 * Representa uma permissão/programa no sistema.
 * Cada programa tem um código único (ex: "FLUXO.CAIXA.LISTAR")
 * 
 * Relacionamento:
 * - @OneToMany com MenuItem (um programa pode ter vários menu items)
 * - @OneToMany com UsuarioPermissao (um programa pode ser atribuído a vários usuários)
 * 
 * Exemplo de Dados:
 * ID | Código                  | Descrição                              | Tipo | Rota
 * ──────────────────────────────────────────────────────────────────────
 * 50 | FLUXO.CAIXA.LISTAR      | Fluxo de Caixa - Listar e Visualizar   | M    | /admin/fluxo-caixa
 * 51 | FLUXO.CAIXA.ESTRUTURA   | Fluxo de Caixa - Manutenção Estrutura  | M    | /admin/fluxo-caixa/estrutura
 * 52 | FLUXO.CAIXA.VALORES     | Fluxo de Caixa - Editar Valores        | M    | /admin/fluxo-caixa/12meses
 * 53 | FLUXO.CAIXA.VARIACOES   | Fluxo de Caixa - Análise de Variações  | M    | /admin/fluxo-caixa/variacoes
 */
@Entity
@Table(name = "programs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Program {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Código único do programa (chave lógica)
     * Formato: MODULO.FUNCIONALIDADE.ACAO
     * Exemplo: "FLUXO.CAIXA.LISTAR", "PARAM.DASHBOARD_BUILDER"
     */
    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    private String codigo;
    
    /**
     * Descrição amigável do programa
     * Exemplo: "Fluxo de Caixa - Listar e Visualizar"
     */
    @Column(name = "descricao", nullable = false)
    private String descricao;
    
    /**
     * Tipo de programa
     * M = Menu, R = Report, O = Operation
     */
    @Column(name = "tipo", nullable = false)
    private String tipo;
    
    /**
     * Rota associada ao programa (para navegação)
     * Exemplo: "/admin/fluxo-caixa", "/admin/fluxo-caixa/estrutura"
     */
    @Column(name = "rota")
    private String rota;
    
    /**
     * Ícone para exibição na UI
     * Exemplo: "chart-line", "layers", "calendar", "chart-bar"
     */
    @Column(name = "icone")
    private String icone;
    
    /**
     * Ordem de exibição (para menu)
     */
    @Column(name = "ordem")
    private Integer ordem;
    
    /**
     * Flag de ativação
     * true = ativo, false = desativado
     */
    @Column(name = "ativo")
    private Boolean ativo;
    
    /**
     * Timestamp de criação
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Timestamp de última atualização
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Relacionamento: One Program → Many MenuItems
     * Um programa pode estar associado a vários menu items
     * 
     * Mapeamento: MenuItem.program (via @ManyToOne)
     * Foreign Key: menu_items.permissao_codigo → programs.codigo
     */
    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MenuItem> menuItems;
    
    // ========== LIFECYCLE CALLBACKS ==========
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (ativo == null) {
            ativo = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * Verifica se o programa está ativo
     */
    public boolean isActive() {
        return ativo != null && ativo;
    }
    
    /**
     * Desativa o programa
     */
    public void deactivate() {
        this.ativo = false;
    }
    
    /**
     * Ativa o programa
     */
    public void activate() {
        this.ativo = true;
    }
    
    @Override
    public String toString() {
        return "Program{" +
                "id=" + id +
                ", codigo='" + codigo + '\'' +
                ", descricao='" + descricao + '\'' +
                ", tipo='" + tipo + '\'' +
                ", rota='" + rota + '\'' +
                ", ativo=" + ativo +
                '}';
    }
}
