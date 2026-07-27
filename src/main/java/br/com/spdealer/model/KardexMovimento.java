package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "kardexm")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KardexMovimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FILIAL_KARM")
    private Integer filialKarm;

    @Column(name = "DATA_KARM")
    private LocalDate dataKarm;

    @Column(name = "HORA_KARM", length = 8)
    private String horaKarm;

    @Column(name = "TIPOMOV_KARM", length = 1)
    private String tipomovKarm;

    @Column(name = "CODOPER_KARM", precision = 10)
    private BigDecimal codoperKarm;

    @Column(name = "NUMDOC_KARM")
    private Integer numdocKarm;

    @Column(name = "SERIE_KARM", length = 3)
    private String serieKarm;

    @Column(name = "TIPODOC_KARM", length = 2)
    private String tipodocKarm;

    @Column(name = "CODCLIFOR_KARM")
    private Integer codcliforKarm;

    @Column(name = "NOMECLIFOR_KARM", length = 50)
    private String nomecliforKarm;

    @Column(name = "DEP_KARM")
    private Integer depKarm;

    @Column(name = "REGISTRO_KARM")
    private Integer registroKarm;

    @Column(name = "FAB_KARM", length = 3)
    private String fabKarm;

    @Column(name = "CODPROD_KARM", length = 20)
    private String codprodKarm;

    @Column(name = "DESCRPROD_KARM", length = 100)
    private String descrprodKarm;

    @Column(name = "QTDEENT_KARM", precision = 12)
    private BigDecimal qtdeentKarm;

    @Column(name = "QTDE sai_KARM", precision = 12)
    private BigDecimal qtdesaiKarm;

    @Column(name = "QTDEANT_KARM", precision = 12)
    private BigDecimal qtdeantKarm;

    @Column(name = "QTDEATU_KARM", precision = 12)
    private BigDecimal qtdeatuKarm;

    @Column(name = "PRECO_KARM", precision = 13)
    private BigDecimal precoKarm;

    @Column(name = "VALOR_KARM", precision = 13)
    private BigDecimal valorKarm;

    @Column(name = "NUMREQ_KARM")
    private Integer numreqKarm;

    @Column(name = "NUMLOTE_KARM", length = 15)
    private String numloteKarm;

    @Column(name = "NUMORCAMENTO_KARM")
    private Integer numorcimentoKarm;

    @Column(name = "NUMITEMORCAMENTO_KARM")
    private Integer numitemorcimentoKarm;

    @Column(name = "USUARIO_KARM", length = 20)
    private String usuarioKarm;

    @Column(name = "OBS_KARM", length = 100)
    private String obsKarm;

    @Column(name = "CODALMOX_KARM")
    private Integer codalmoxKarm;

    @Column(name = "TIPONOTA_KARM", length = 1)
    private String tiponotaKarm;
}
