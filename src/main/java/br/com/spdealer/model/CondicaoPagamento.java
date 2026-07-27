package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "maspag")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CondicaoPagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FILIAL_PAGA")
    private Integer filialPaga;

    @Column(name = "CODIGO_PAGA", nullable = false)
    private Integer codigoPaga;

    @Column(name = "DESCRPAGA", length = 40)
    private String descrpaga;

    @Column(name = "TIPO_PAGA", length = 1)
    private String tipoPaga;

    @Column(name = "NUMPAR_PAGA")
    private Integer numparPaga;

    @Column(name = "DIA1_PAGA")
    private Integer dia1Paga;

    @Column(name = "DIA2_PAGA")
    private Integer dia2Paga;

    @Column(name = "DIA3_PAGA")
    private Integer dia3Paga;

    @Column(name = "DIA4_PAGA")
    private Integer dia4Paga;

    @Column(name = "DIA5_PAGA")
    private Integer dia5Paga;

    @Column(name = "DIA6_PAGA")
    private Integer dia6Paga;

    @Column(name = "DIA7_PAGA")
    private Integer dia7Paga;

    @Column(name = "DIA8_PAGA")
    private Integer dia8Paga;

    @Column(name = "DIA9_PAGA")
    private Integer dia9Paga;

    @Column(name = "DIA10_PAGA")
    private Integer dia10Paga;

    @Column(name = "DIA11_PAGA")
    private Integer dia11Paga;

    @Column(name = "DIA12_PAGA")
    private Integer dia12Paga;

    @Column(name = "PERC1_PAGA", precision = 5)
    private BigDecimal perc1Paga;

    @Column(name = "PERC2_PAGA", precision = 5)
    private BigDecimal perc2Paga;

    @Column(name = "PERC3_PAGA", precision = 5)
    private BigDecimal perc3Paga;

    @Column(name = "PERC4_PAGA", precision = 5)
    private BigDecimal perc4Paga;

    @Column(name = "PERC5_PAGA", precision = 5)
    private BigDecimal perc5Paga;

    @Column(name = "PERC6_PAGA", precision = 5)
    private BigDecimal perc6Paga;

    @Column(name = "PERC7_PAGA", precision = 5)
    private BigDecimal perc7Paga;

    @Column(name = "PERC8_PAGA", precision = 5)
    private BigDecimal perc8Paga;

    @Column(name = "PERC9_PAGA", precision = 5)
    private BigDecimal perc9Paga;

    @Column(name = "PERC10_PAGA", precision = 5)
    private BigDecimal perc10Paga;

    @Column(name = "PERC11_PAGA", precision = 5)
    private BigDecimal perc11Paga;

    @Column(name = "PERC12_PAGA", precision = 5)
    private BigDecimal perc12Paga;

    @Column(name = "CODBCO_PAGA")
    private Integer codbcoPaga;

    @Column(name = "NOMEB_PAGA", length = 30)
    private String nomebPaga;

    @Column(name = "TPCOB_PAGA", length = 1)
    private String tpcobPaga;

    @Column(name = "CODIGO_COB_PAGA")
    private Integer codigoCobPaga;

    @Column(name = "PRAZO_PAGA")
    private Integer prazoPaga;
}
