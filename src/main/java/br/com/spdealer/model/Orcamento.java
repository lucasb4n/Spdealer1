package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orcamp")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FILIAL_ORP", nullable = false)
    private Integer filialOrp;

    @Column(name = "NUMERO_ORP", nullable = false)
    private Integer numeroOrp;

    @Column(name = "DTEMI_ORP")
    private LocalDate dtemiOrp;

    @Column(name = "FECHADO_ORP")
    private Integer fechadoOrp;

    @Column(name = "FABRICA_ORP")
    private Integer fabricaOrp;

    @Column(name = "TIPO_ORP", length = 1)
    private String tipoOrp;

    @Column(name = "NOTA_ORP")
    private Integer notaOrp;

    @Column(name = "DTNOTA_ORP")
    private LocalDate dtnotaOrp;

    @Column(name = "OBSER_ORP", length = 50)
    private String oberOrp;

    @Column(name = "TIPOCLI_ORP", length = 1)
    private String tipocliOrp;

    @Column(name = "CGCCPF_CLI", precision = 14)
    private BigDecimal cgccpfOrp;

    @Column(name = "INSCEST_ORP", length = 20)
    private String inscestOrp;

    @Column(name = "IDENT_ORP", length = 20)
    private String identOrp;

    @Column(name = "NOME_ORP", length = 50)
    private String nomeOrp;

    @Column(name = "LOGRA_ORP", length = 50)
    private String lograOrp;

    @Column(name = "BAIRRO_ORP", length = 20)
    private String bairroOrp;

    @Column(name = "CIDADE_ORP", length = 30)
    private String cidadeOrp;

    @Column(name = "UF_ORP", length = 2)
    private String ufOrp;

    @Column(name = "PREF_ORP")
    private Integer prefOrp;

    @Column(name = "FONE_ORP", precision = 9)
    private BigDecimal foneOrp;

    @Column(name = "PREF1_ORP")
    private Integer pref1Orp;

    @Column(name = "FONE1_ORP", precision = 9)
    private BigDecimal fone1Orp;

    @Column(name = "CONTATO_ORP", length = 30)
    private String contatoOrp;

    @Column(name = "CEP_ORP", precision = 8)
    private BigDecimal cepOrp;

    @Column(name = "NIVEL_ORP")
    private Integer nivelOrp;

    @Column(name = "CONDPAG_ORP")
    private Integer condpagOrp;

    @Column(name = "CCUSTO_ORP")
    private Integer ccustoOrp;

    @Column(name = "VENDEDOR_ORP", precision = 10)
    private BigDecimal vendedorOrp;

    @Column(name = "OBS_ORP", length = 343)
    private String obsOrp;

    @Column(name = "PEDPEN_ORP")
    private Integer pedpenOrp;

    @Column(name = "REGIAO_ORP", length = 15)
    private String regiaoOrp;

    @Column(name = "TIPOCONTATO_ORP", length = 10)
    private String tipocontatoOrp;

    @Column(name = "NUMERO_ORIG_ORP")
    private Integer numeroOrigOrp;

    @Column(name = "MODELO_ORP", length = 15)
    private String modeloOrp;

    @Column(name = "QTNOTA_ORP")
    private Integer qtnotaOrp;

    @Column(name = "USO_ORP", length = 40)
    private String usoOrp;

    @Column(name = "AUTORIZADO_ORP", length = 50)
    private String autorizadoOrp;

    @Column(name = "MOEDA_ORP")
    private Integer moedaOrp;

    @Column(name = "SERIE_ORP", length = 20)
    private String serieOrp;

    @Column(name = "COEFI_ORP", precision = 5)
    private BigDecimal coefiOrp;

    @Column(name = "PERCDES_ORP", precision = 9)
    private BigDecimal percdesOrp;

    @Column(name = "PERCPECA_ORP", precision = 9)
    private BigDecimal percpecaOrp;

    @Column(name = "TOTORP_ORP", precision = 12)
    private BigDecimal totorpOrp;

    @Column(name = "PERCSER_ORP", precision = 9)
    private BigDecimal percserOrp;

    @Column(name = "DESCSER_ORP", precision = 12)
    private BigDecimal descserOrp;

    @Column(name = "DESCPEC_ORP", precision = 12)
    private BigDecimal descpecOrp;

    @Column(name = "PERC_NIVELPRECO_ORP", precision = 4)
    private BigDecimal percNivelprecoOrp;

    @Column(name = "VLR_ESTOQUE_ORP", precision = 13)
    private BigDecimal vlrEstoqueOrp;

    @Column(name = "VLR_FALTANTE_ORP", precision = 13)
    private BigDecimal vlrFaltanteOrp;

    @Column(name = "VLR_PECAS_ORP", precision = 13)
    private BigDecimal vlrPecasOrp;

    @Column(name = "VLR_SERVICO_ORP", precision = 13)
    private BigDecimal vlrServicoOrp;

    @Column(name = "VLR_IPI_ORP", precision = 13)
    private BigDecimal vlrIpiOrp;

    @Column(name = "VLR_ISENTO_ORP", precision = 13)
    private BigDecimal vlrIsentoOrp;

    @Column(name = "VLR_NIVELPRECO_ORP", precision = 13)
    private BigDecimal vlrNivelprecoOrp;

    @Column(name = "VLR_DESCPEC_ITEM_ORP", precision = 13)
    private BigDecimal vlrDescpecItemOrp;

    @Column(name = "PERC_DESCPEC_ITEM_ORP", precision = 9)
    private BigDecimal percDescpecItemOrp;

    @Column(name = "PERC_DESCSER_ITEM_ORP", precision = 9)
    private BigDecimal percDescserItemOrp;

    @Column(name = "VLR_DESCSER_ITEM_ORP", precision = 13)
    private BigDecimal vlrDescserItemOrp;

    @Column(name = "PERC_DESCPEC_ORP", precision = 9)
    private BigDecimal percDescpecOrp;

    @Column(name = "VLR_DESCSER_ORP", precision = 13)
    private BigDecimal vlrDescserOrp;

    @Column(name = "VLR_TOTAL_ORP", precision = 13)
    private BigDecimal vlrTotalOrp;

    @Column(name = "PERC_DESCSER_ORP", precision = 9)
    private BigDecimal percDescserOrp;

    @Column(name = "VLR_DESCPEC_ORP", precision = 13)
    private BigDecimal vlrDescpecOrp;

    @Column(name = "VLR_AVISTA_ORP", precision = 13)
    private BigDecimal vlrAvistaOrp;

    @Column(name = "FORMA_ORP")
    private Integer formaOrp;

    @Column(name = "NIVEL_SERV_ORP", length = 1)
    private String nivelServOrp;

    @Column(name = "VLR_ICMSST_ORP", precision = 13)
    private BigDecimal vlrIcmsstOrp;

    @Column(name = "VLR_FRETE_ORP", precision = 10)
    private BigDecimal vlrFreteOrp;

    @Column(name = "TIPO_FRETE_ORP", length = 1)
    private String tipoFreteOrp;

    @Column(name = "VLR_DIVERSOS_ORP", precision = 10)
    private BigDecimal vlrDiversosOrp;

    @Column(name = "VLRAUTORIZ_ORP", precision = 10)
    private BigDecimal vlrAutorizOrp;

    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ItemOrcamento> itens = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dtemiOrp == null) {
            dtemiOrp = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}