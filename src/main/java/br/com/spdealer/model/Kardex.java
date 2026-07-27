package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "kardex")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Kardex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "DEP_KAR", nullable = false)
    private Integer depKar;

    @Column(name = "REGISTRO_KAR", nullable = false)
    private Integer registroKar;

    @Column(name = "FAB_KAR", length = 3, nullable = false)
    private String fabKar;

    @Column(name = "CODPROD_KAR", length = 20, nullable = false)
    private String codprodKar;

    @Column(name = "QTDE_KAR", precision = 12)
    private BigDecimal qtdeKar;

    @Column(name = "QTALOC_KAR", precision = 12)
    private BigDecimal qtalocKar;

    @Column(name = "QTEMP_KAR", precision = 12)
    private BigDecimal qtempKar;

    @Column(name = "LOCACKAR_KAR", length = 15)
    private String locackarKar;

    @Column(name = "PRCOMED_KAR", precision = 13)
    private BigDecimal prcomedKar;

    @Column(name = "PRECO_KAR", precision = 13)
    private BigDecimal precoKar;

    @Column(name = "DTULTCOMPRA_KAR")
    private Integer dultcompraKar;

    @Column(name = "NUMNOTA_KAR")
    private Integer numnotaKar;

    @Column(name = "SERIE_KAR", length = 3)
    private String serieKar;

    @Column(name = "NUMREQ_KAR")
    private Integer numreqKar;

    @Column(name = "DTVALIDADE_KAR")
    private Integer dtvalidadeKar;

    @Column(name = "LOTEFAB_KAR", length = 15)
    private String lotefabKar;

    @Column(name = "CODFOR_KAR")
    private Integer codforKar;

    @Column(name = "RESTO_KAR", length = 25)
    private String restoKar;
}
