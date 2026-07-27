package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "notascab")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotaFiscal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "FILIAL_NOT", nullable = false)
    private Integer filialNot;

    @Column(name = "EMISSAOI_NOT")
    private LocalDate emissaoiNot;

    @Column(name = "SERIE_NOT", length = 3, nullable = false)
    private String serieNot;

    @Column(name = "NUMERO_NOT", nullable = false)
    private Integer numeroNot;

    @Column(name = "TIPO_NOT", length = 1, nullable = false)
    private String tipoNot;

    @Column(name = "CODCLI_NOT")
    private Integer codcliNot;

    @Column(name = "CGCCPF_NOT", precision = 14)
    private BigDecimal cgccpfNot;

    @Column(name = "NOME_NOT", length = 50)
    private String nomeNot;

    @Column(name = "LOGRA_NOT", length = 50)
    private String lograNot;

    @Column(name = "BAIRRO_NOT", length = 20)
    private String bairroNot;

    @Column(name = "CIDADE_NOT", length = 30)
    private String cidadeNot;

    @Column(name = "UF_NOT", length = 2)
    private String ufNot;

    @Column(name = "CEP_NOT", precision = 8)
    private BigDecimal cepNot;

    @Column(name = "FONE_NOT", precision = 9)
    private BigDecimal foneNot;

    @Column(name = "CONDPAG_NOT")
    private Integer condpagNot;

    @Column(name = "VENDEDOR_NOT", precision = 10)
    private BigDecimal vendedorNot;

    @Column(name = "BASEICMS_NOT", precision = 13)
    private BigDecimal baseicmsNot;

    @Column(name = "VALORICMS_NOT", precision = 13)
    private BigDecimal valoricmsNot;

    @Column(name = "BASEICMSST_NOT", precision = 13)
    private BigDecimal baseicmsstNot;

    @Column(name = "VALORICMSST_NOT", precision = 13)
    private BigDecimal valoricmsstNot;

    @Column(name = "VALORIPI_NOT", precision = 13)
    private BigDecimal valoripiNot;

    @Column(name = "VALORFRETE_NOT", precision = 13)
    private BigDecimal valorfreteNot;

    @Column(name = "VALOROUTROS_NOT", precision = 13)
    private BigDecimal valoroutrosNot;

    @Column(name = "VALORTOTAL_NOT", precision = 13)
    private BigDecimal valortotalNot;

    @Column(name = "NUMORCAMENTO_NOT")
    private Integer numorcimentoNot;

    @Column(name = "TIPOFRETE_NOT", length = 1)
    private String tipofreteNot;

    @Column(name = "PLACA_NOT", length = 10)
    private String placaNot;

    @Column(name = "PESOBRUTO_NOT", precision = 10)
    private BigDecimal pesobrutoNot;

    @Column(name = "PESOLIQUIDO_NOT", precision = 10)
    private BigDecimal pesoliquidoNot;

    @Column(name = "MARCA_NOT", length = 30)
    private String marcaNot;

    @Column(name = "QUANTIDADE_NOT", precision = 10)
    private BigDecimal quantidadeNot;

    @Column(name = "ESPECIE_NOT", length = 20)
    private String especieNot;

    @Column(name = "OBS_NOT", length = 343)
    private String obsNot;

    @Column(name = "CHAVEACESSO_NOT", length = 44)
    private String chaveacessoNot;

    @Column(name = "DATA_SAIDA_NOT")
    private LocalDate dataSaidaNot;

    @Column(name = "HORA_SAIDA_NOT", length = 8)
    private String horaSaidaNot;

    @Column(name = "CODIGO_COB_NOT")
    private Integer codigoCobNot;

    @Column(name = "NOMEB_NOT", length = 30)
    private String nomebNot;

    @Column(name = "TPCOB_NOT", length = 1)
    private String tpcobNot;

    @Column(name = "CODBCO_NOT")
    private Integer codbcoNot;

    @Column(name = "STATUS_NOT", length = 1)
    private String statusNot;

    @Column(name = "USUARIO_NOT", length = 20)
    private String usuarioNot;

    @Column(name = "DTINCLUSAO_NOT")
    private LocalDateTime dtinclusaoNot;
}
