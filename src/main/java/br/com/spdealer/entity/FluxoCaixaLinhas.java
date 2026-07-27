package br.com.spdealer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fluxo_caixa_linhas")
public class FluxoCaixaLinhas {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "codigo_linha", nullable = false, unique = true)
    private String codigoLinha;
    
    @Column(name = "descricao", nullable = false, length = 100)
    private String descricao;
    
    @Column(name = "tipo_linha")
    @Enumerated(EnumType.STRING)
    private TipoLinha tipoLinha;
    
    @Column(name = "query_id")
    private Long queryId;
    
    @Column(name = "eh_calculada")
    private Boolean ehCalculada;
    
    @Column(name = "ordem", nullable = false)
    private Integer ordem;
    
    @Column(name = "nivel_hierarquia")
    private Integer nivelHierarquia;
    
    @Column(name = "eh_totalizadora")
    private Boolean ehTotalizadora;
    
    @Column(name = "pai_id")
    private Long paiId;
    
    @Column(name = "criado_em")
    private LocalDateTime criadoEm;
    
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;
    
    public enum TipoLinha {
        TITULO, RECEITA, DESPESA, TOTAL, RESULTADO
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigoLinha() {
        return codigoLinha;
    }

    public void setCodigoLinha(String codigoLinha) {
        this.codigoLinha = codigoLinha;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public TipoLinha getTipoLinha() {
        return tipoLinha;
    }

    public void setTipoLinha(TipoLinha tipoLinha) {
        this.tipoLinha = tipoLinha;
    }

    public Long getQueryId() {
        return queryId;
    }

    public void setQueryId(Long queryId) {
        this.queryId = queryId;
    }

    public Boolean getEhCalculada() {
        return ehCalculada;
    }

    public void setEhCalculada(Boolean ehCalculada) {
        this.ehCalculada = ehCalculada;
    }

    public Integer getOrdem() {
        return ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem;
    }

    public Integer getNivelHierarquia() {
        return nivelHierarquia;
    }

    public void setNivelHierarquia(Integer nivelHierarquia) {
        this.nivelHierarquia = nivelHierarquia;
    }

    public Boolean getEhTotalizadora() {
        return ehTotalizadora;
    }

    public void setEhTotalizadora(Boolean ehTotalizadora) {
        this.ehTotalizadora = ehTotalizadora;
    }

    public Long getPaiId() {
        return paiId;
    }

    public void setPaiId(Long paiId) {
        this.paiId = paiId;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }

    @Override
    public String toString() {
        return "FluxoCaixaLinhas{" +
                "id=" + id +
                ", codigoLinha='" + codigoLinha + '\'' +
                ", descricao='" + descricao + '\'' +
                ", tipoLinha=" + tipoLinha +
                ", queryId=" + queryId +
                ", ordem=" + ordem +
                '}';
    }
}
