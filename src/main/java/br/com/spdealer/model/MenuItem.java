package br.com.spdealer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "menu_items")
public class MenuItem {
    // Facilita a filtragem por grupo sem depender de lazy loading do JPA
    public Long getGroupId() {
        return group != null ? group.getId() : null;
    }
    @Column(name = "codigo", length = 50)
    private String codigo;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nome", nullable = false, length = 100)
    private String name;
    
    @Column(name = "rota", length = 200)
    private String route;
    
    @Column(name = "icone", length = 50)
    private String icon;
    
    @Column(name = "ordem", nullable = false)
    @Builder.Default
    private Integer order = 0;
    
    @Column(name = "ativo", nullable = false)
    @Builder.Default
    private Boolean active = true;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // ========== NOVOS CAMPOS PARA INTEGRAÇÃO COM PROGRAMS ==========
    
    /**
     * Campo que referencia o código do programa em programs table
     * Exemplo: "FLUXO.CAIXA.LISTAR", "PARAM.DASHBOARD_BUILDER"
     * 
     * Relacionamento:
     * menu_items.permissao_codigo (FK) → programs.codigo
     */
    @Column(name = "permissao_codigo", length = 50)
    private String permissaoCodigo;
    
    /**
     * Requer permissão para acessar este menu item?
     * true = requer permissão (será validado em security)
     * false = livre (sem validação)
     */
    @Column(name = "requer_permissao", nullable = false)
    @Builder.Default
    private Boolean requerPermissao = true;
    
    /**
     * Relacionamento ManyToOne com Program
     * @ManyToOne: Vários MenuItem podem ter a mesma permissão
     * @JoinColumn: Usa a coluna permissao_codigo como FK
     * 
     * Fetch Strategy: EAGER para não ter problema de lazy loading
     * Cascade: NONE (não deletar program ao deletar MenuItem)
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "permissao_codigo", referencedColumnName = "codigo", 
                insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "FK_MENU_ITEMS_PROGRAMS"))
    private Program program;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_group_id", nullable = false)
    private MenuGroup group;

    @Column(name = "parent_id")
    private Long parentId;
    @Transient
    private java.util.List<MenuItem> children;

    public java.util.List<MenuItem> getChildren() {
        return children;
    }

    public void setChildren(java.util.List<MenuItem> children) {
        this.children = children;
    }

    // Getters e setters obrigatórios para uso nos controllers/services
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getParentId() {
        return parentId;
    }
    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }
    public String getCodigo() {
        return codigo;
    }
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getIcon() {
        return icon;
    }
    public void setIcon(String icon) {
        this.icon = icon;
    }
    public String getRoute() {
        return route;
    }
    public void setRoute(String route) {
        this.route = route;
    }
    public Integer getOrder() {
        return order;
    }
    public void setOrder(Integer order) {
        this.order = order;
    }
    public Boolean getActive() {
        return active;
    }
    public void setActive(Boolean active) {
        this.active = active;
    }
    public MenuGroup getGroup() {
        return group;
    }
    public void setGroup(MenuGroup group) {
        this.group = group;
    }
    
    // ========== NOVOS GETTERS E SETTERS PARA PROGRAMS ==========
    
    /**
     * Retorna o código da permissão
     * Exemplo: "FLUXO.CAIXA.LISTAR"
     */
    public String getPermissaoCodigo() {
        return permissaoCodigo;
    }
    
    /**
     * Define o código da permissão
     */
    public void setPermissaoCodigo(String permissaoCodigo) {
        this.permissaoCodigo = permissaoCodigo;
    }
    
    /**
     * Retorna se requer permissão para acessar
     */
    public Boolean getRequerPermissao() {
        return requerPermissao;
    }
    
    /**
     * Define se requer permissão para acessar
     */
    public void setRequerPermissao(Boolean requerPermissao) {
        this.requerPermissao = requerPermissao;
    }
    
    /**
     * Retorna o programa associado
     */
    public Program getProgram() {
        return program;
    }
    
    /**
     * Define o programa associado
     */
    public void setProgram(Program program) {
        this.program = program;
    }
}