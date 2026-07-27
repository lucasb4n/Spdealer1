package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "notasdet")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaFiscalItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FILIAL_NOT", nullable = false)
    private Integer filialNot;

    @Column(name = "EMISSAOI_NOT")
    private Integer emissaoiNot;

    @Column(name = "SERIE_NOT", length = 3, nullable = false)
    private String serieNot;

    @Column(name = "NUMERO_NOT", nullable = false)
    private Integer numeroNot;

    @Column(name = "TIPO_NOT", length = 1, nullable = false)
    private String tipoNot;

    @Column(name = "SEQUENCIA_NOT", nullable = false)
    private Integer sequenciaNot;

    @Column(name = "FAB_NOT", length = 3)
    private String fabNot;

    @Column(name = "PRODUTO_NOT", length = 20, nullable = false)
    private String produtoNot;

    @Column(name = "DESCRICAO_NOT", length = 100)
    private String descricaoNot;

    @Column(name = "NCM_NOT", length = 10)
    private String ncmNot;

    @Column(name = "UNIDADE_NOT", length = 5)
    private String unidadeNot;

    @Column(name = "QTDE_NOT", precision = 10)
    private BigDecimal qtdeNot;

    @Column(name = "PRECOUNIT_NOT", precision = 13)
    private BigDecimal precounitNot;

    @Column(name = "VALORTOTAL_NOT", precision = 13)
    private BigDecimal valortotalNot;

    @Column(name = "BASEICMS_NOT", precision = 13)
    private BigDecimal baseicmsNot;

    @Column(name = "PERCICMS_NOT", precision = 5)
    private BigDecimal percicmsNot;

    @Column(name = "VALORICMS_NOT", precision = 13)
    private BigDecimal valoricmsNot;

    @Column(name = "BASEICMSST_NOT", precision = 13)
    private BigDecimal baseicmsstNot;

    @Column(name = "PERCICMSST_NOT", precision = 5)
    private BigDecimal percicmsstNot;

    @Column(name = "VALORICMSST_NOT", precision = 13)
    private BigDecimal valoricmsstNot;

    @Column(name = "PERCIPI_NOT", precision = 5)
    private BigDecimal percipiNot;

    @Column(name = "VALORIPI_NOT", precision = 13)
    private BigDecimal valoripiNot;

    @Column(name = "CODIGO_CFOP_NOT", length = 5)
    private String codigoCfopNot;

    @Column(name = "NUMEROORCAMENTO_NOT")
    private Integer numeroorcamentoNot;

    @Column(name = "NUMEROITEM_ORCAMENTO")
    private Integer numeroitemOrcamento;
}
