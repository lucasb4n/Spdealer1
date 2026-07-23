package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "receber")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContaReceber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "RECEBER_ID", nullable = false)
    private Integer receberId;

    @Column(name = "FILIAL_REC")
    private Integer filialRec;

    @Column(name = "NUMERO_REC")
    private Integer numeroRec;

    @Column(name = "PARCELA_REC", length = 3)
    private String parcelaRec;

    @Column(name = "TIPODOC_REC", length = 2)
    private String tipodocRec;

    @Column(name = "CODIGO_REC")
    private Integer codigoRec;

    @Column(name = "CGCCPF_REC", precision = 14)
    private BigDecimal cgccpfRec;

    @Column(name = "NOME_REC", length = 50)
    private String nomeRec;

    @Column(name = "DTVENCI_REC")
    private LocalDate dtvenciRec;

    @Column(name = "DTPAGTO_REC")
    private LocalDate dtpagtoRec;

    @Column(name = "VLRDUPLICATA_REC", precision = 13)
    private BigDecimal vlreduplicataRec;

    @Column(name = "VLRPAGO_REC", precision = 13)
    private BigDecimal vlrpagoRec;

    @Column(name = "VLRDESC_REC", precision = 13)
    private BigDecimal vrldescRec;

    @Column(name = "VLRJuros_REC", precision = 13)
    private BigDecimal vlrjurosRec;

    @Column(name = "VLRMULTA_REC", precision = 13)
    private BigDecimal vlrmultaRec;

    @Column(name = "VLRBComission_REC", precision = 13)
    private BigDecimal vlrcomissaoRec;

    @Column(name = "JUROSPAGREC_REC", precision = 5)
    private BigDecimal jurospagrecRec;

    @Column(name = "VENDCOMI_REC", precision = 10)
    private BigDecimal vendcomiRec;

    @Column(name = "NUMBCO_REC", length = 3)
    private String numbcoRec;

    @Column(name = "NUMAGENC_REC", length = 5)
    private String numagencRec;

    @Column(name = "NUMCONTA_REC", length = 10)
    private String numcontaRec;

    @Column(name = "CHEQUE_REC", length = 15)
    private String chequeRec;

    @Column(name = "TIPOBCO_REC", length = 1)
    private String tipobcoRec;

    @Column(name = "DATABAIXA_REC")
    private LocalDate databaixaRec;

    @Column(name = "HISTORICO_REC", length = 100)
    private String historicoRec;

    @Column(name = "STATUS_REC", length = 1)
    private String statusRec;

    @Column(name = "ORIGEM_REC", length = 1)
    private String origemRec;

    @Column(name = "NOTAFISCAL_REC")
    private Integer notafiscalRec;

    @Column(name = "SERIE_REC", length = 3)
    private String serieRec;

    @Column(name = "TIPOCLI_REC", length = 1)
    private String tipocliRec;

    @Column(name = "CONDPAG_REC")
    private Integer condpagRec;

    @Column(name = "CODVENDEDOR_REC", precision = 10)
    private BigDecimal codvendedorRec;

    @Column(name = "DTEMISSAO_REC")
    private LocalDate dtemissaoRec;

    @Column(name = "CODIGOCOB_REC")
    private Integer codigocobRec;

    @Column(name = "NOMECOB_REC", length = 30)
    private String nomecobRec;

    @Column(name = "TPCOBREC_REC", length = 1)
    private String tpcobrecRec;

    @Column(name = "NUMCARTAO_REC", length = 20)
    private String numcartaoRec;

    @Column(name = "NUMAUTORIZ_REC", length = 10)
    private String numautorizRec;

    @Column(name = "CODIGOCCUSTO_REC")
    private Integer codigoccustoRec;
}
