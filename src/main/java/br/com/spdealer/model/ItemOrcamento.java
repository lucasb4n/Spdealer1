package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orcampp")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemOrcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FILIAL_ORPP", nullable = false)
    private Integer filialOrpp;

    @Column(name = "NUMERO_ORPP", nullable = false)
    private Integer numeroOrpp;

    @Column(name = "REQUIS_ORPP")
    private Integer requisOrpp;

    @Column(name = "FAB_ORPP", length = 1)
    private String fabOrpp;

    @Column(name = "CODIGO_ORPP", length = 30)
    private String codigoOrpp;

    @Column(name = "FECHADO_ORPP")
    private Integer fechadoOrpp;

    @Column(name = "CODIGO_MPER", length = 10)
    private String codigoMper;

    @Column(name = "QTPERD_ORPP", precision = 7)
    private BigDecimal qtperdOrpp;

    @Column(name = "DESCR_ORPP", length = 50)
    private String descrOrpp;

    @Column(name = "DTREQ_ORPP")
    private Integer dtreqOrpp;

    @Column(name = "DTREC_ORPP", precision = 7)
    private BigDecimal dtrecOrpp;

    @Column(name = "QTREC_ORPP", precision = 7)
    private BigDecimal qtrecOrpp;

    @Column(name = "QTDEV_ORPP", precision = 7)
    private BigDecimal qtdevOrpp;

    @Column(name = "QTALOC_ORPP", precision = 7)
    private BigDecimal qtalocOrpp;

    @Column(name = "QTSOL_ORPP", precision = 7)
    private BigDecimal qtsolOrpp;

    @Column(name = "QTDISP_ORPP", precision = 7)
    private BigDecimal qtdispOrpp;

    @Column(name = "QTFALTA_ORPP", precision = 7)
    private BigDecimal qtfaltaOrpp;

    @Column(name = "VALORAVI_ORPP", precision = 11)
    private BigDecimal valoraviOrpp;

    @Column(name = "PRECOPUB_ORPP", precision = 11)
    private BigDecimal precopubOrpp;

    @Column(name = "PERC_IPI_ORPP", precision = 5)
    private BigDecimal percIpiOrpp;

    @Column(name = "VALORIPI_ORPP", precision = 11)
    private BigDecimal valoripiOrpp;

    @Column(name = "PRECOTOT_ORPP", precision = 11)
    private BigDecimal precototOrpp;

    @Column(name = "VLREMPENHO_ORPP", precision = 11)
    private BigDecimal vlrempenhoOrpp;

    @Column(name = "PRECUSTO_ORPP", precision = 11)
    private BigDecimal precustoOrpp;

    @Column(name = "PERMITE_DESC_ORPP", length = 1)
    private String permiteDescOrpp;

    @Column(name = "PERC_DESCONTO_ORPP", precision = 9)
    private BigDecimal percDescontoOrpp;

    @Column(name = "DESCONTO_ORPP", precision = 9)
    private BigDecimal descontoOrpp;

    @Column(name = "VLRDESC_ORPP", precision = 11)
    private BigDecimal vrldescOrpp;

    @Column(name = "PERC_NIVEL_ORPP", precision = 4)
    private BigDecimal percNivelOrpp;

    @Column(name = "VLR_NIVEL_ORPP", precision = 12)
    private BigDecimal vlrNivelOrpp;

    @Column(name = "DISPONIVEL_ORPP", length = 1)
    private String disponivelOrpp;

    @Column(name = "ALOCADO_ORPP", length = 1)
    private String alocadoOrpp;

    @Column(name = "PRAZOENTR_ORPP")
    private Integer prazoentrOrpp;

    @Column(name = "CONFIRMADO_ORPP", length = 1)
    private String confirmadoOrpp;

    @Column(name = "PEDIDO_ORPP")
    private Integer pedidoOrpp;

    @Column(name = "MOTIVO_ORPP")
    private Integer motivoOrpp;

    @Column(name = "NOVO_ORPP")
    private Integer novoOrpp;

    @Column(name = "VENDEDOR_ORPP", precision = 10)
    private BigDecimal vendedorOrpp;

    @Column(name = "CHASSI_ORPP", length = 20)
    private String chassiOrpp;

    @Column(name = "CONTRATO_ORPP", length = 15)
    private String contratoOrpp;

    @Column(name = "LOCAL_CTRP_ORPP")
    private Integer localCtrpOrpp;

    @Column(name = "NUMERO_CTRP_ORPP")
    private Integer numeroCtrpOrpp;

    @Column(name = "SEQUENCIA_CTRP_ORPP")
    private Integer sequenciaCtrpOrpp;

    @Column(name = "MODELO_ORPP", length = 15)
    private String modeloOrpp;

    @Column(name = "SEQNOT_ORPP")
    private Integer seqnotOrpp;

    @Column(name = "DATA_ORPP")
    private Integer dataOrpp;

    @Column(name = "HORA_ORPP")
    private Integer horaOrpp;

    @Column(name = "BASEST_ORPP", precision = 11)
    private BigDecimal basestOrpp;

    @Column(name = "ICMSST_ORPP", precision = 11)
    private BigDecimal icmsstOrpp;

    @Column(name = "PERCSUB_ORPP", precision = 9)
    private BigDecimal percsubOrpp;

    @Column(name = "PERCBSUB_ORPP", precision = 9)
    private BigDecimal percbsubOrpp;

    @Column(name = "PRECOLIQ_ORPP", precision = 11)
    private BigDecimal precoliqOrpp;

    @Column(name = "PEDIDOCLI_ORPP", length = 15)
    private String pedidocliOrpp;

    @Column(name = "SEQPEDCLI_ORPP", length = 5)
    private String seqpedcliOrpp;

    @Column(name = "AUTORIZADO_ORPP", length = 50)
    private String autorizadoOrpp;

    @Column(name = "PERCBSUB_AVISTA_ORPP", precision = 9)
    private BigDecimal percbsubAvistaOrpp;

    @Column(name = "VLR_FRETE_ORPP", precision = 8)
    private BigDecimal vlrFreteOrpp;

    @Column(name = "VLR_DIVERSOS_ORPP", precision = 8)
    private BigDecimal vlrDiversosOrpp;

    @Column(name = "ITEMCLI_ORPP", length = 20)
    private String itemcliOrpp;

    @Column(name = "BASEICM_ORPP", precision = 12)
    private BigDecimal baseicmOrpp;

    @Column(name = "ALIQICM_ORPP", precision = 5)
    private BigDecimal aliqicmOrpp;

    @Column(name = "VLRICMS_ORPP", precision = 12)
    private BigDecimal vlricmsOrpp;

    @Column(name = "PI_ORPP", length = 2)
    private String piOrpp;

    @Column(name = "QTMMI_ORPP", precision = 7)
    private BigDecimal qtmmiOrpp;

    @Column(name = "SEQ_ORPP")
    private Integer seqOrpp;

    @Column(name = "FAL_ORIGEM_ORPP", length = 1)
    private String falOrigemOrpp;

    @Column(name = "FAL_SEQUENCIA_ORPP")
    private Integer falSequenciaOrpp;

    @Column(name = "DATAPRO_ORPP")
    private Integer dataproOrpp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
        @JoinColumn(name = "FILIAL_ORP", referencedColumnName = "FILIAL_ORP"),
        @JoinColumn(name = "NUMERO_ORP", referencedColumnName = "NUMERO_ORP")
    })
    private Orcamento orcamento;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Transient
    public BigDecimal getValorTotalCalculado() {
        if (qtalocOrpp != null && precototOrpp != null) {
            return qtalocOrpp.multiply(precototOrpp);
        }
        return BigDecimal.ZERO;
    }
}