package br.com.spdealer.nfe.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Entidade correspondente aos itens da nota fiscal
 * Tabela: notasdet
 * 
 * Mapeamento dos campos COBOL:
 * - FILIAL-NOT        PIC 9(003)    -> filial_not
 * - EMISSAOI-NOT      PIC 9(008)    -> emissaoi_not (data formato DDMMAAAA)
 * - TIPO-NOT          PIC XX        -> tipo_not
 * - SERIE-NOT         PIC X(003)    -> serie_not
 * - NUMERO-NOT        PIC 9(006)    -> numero_not
 * - PRODUTO-NOT       PIC X(020)    -> produto_not
 * - DESCPROD-NOT      PIC X(100)    -> descprod_not
 * - QUANT-NOT         PIC 9(009)V99 -> quant_not
 * - VALORUNI-NOT      PIC 9(009)V99 -> valoruni_not
 * - DESCONTO-NOT      PIC 9(009)V99 -> desconto_not
 * - VLRFRET-NOT       PIC 9(009)V99 -> vlrfret_not
 * - VALORTOT-NOT      PIC 9(011)V99 -> valortot_not
 * - DEVOL-NOT         PIC 9(003)    -> devol_not
 * - FAB-NOT           PIC X(003)    -> fab_not (categoria/fabricante)
 */
@Entity
@Table(name = "notasdet")
@Data
public class NotaDet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "filial_not", length = 3, nullable = false)
    private Integer filialNot;

    @Column(name = "emissaoi_not", length = 8, nullable = false)
    private Integer emissaoiNot;

    @Column(name = "tipo_not", length = 2, nullable = false)
    private String tipoNot;

    @Column(name = "serie_not", length = 3, nullable = false)
    private String serieNot;

    @Column(name = "numero_not", length = 6, nullable = false)
    private Integer numeroNot;

    @Column(name = "produto_not", length = 20)
    private String produtoNot; // Código do produto

    @Column(name = "descprod_not", length = 100)
    private String descprodNot; // Descrição do produto

    @Column(name = "quant_not", precision = 12, scale = 2)
    private BigDecimal quantNot; // Quantidade

    @Column(name = "valoruni_not", precision = 15, scale = 4)
    private BigDecimal valoruniNot; // Valor unitário

    @Column(name = "desconto_not", precision = 15, scale = 2)
    private BigDecimal descontoNot; // Desconto

    @Column(name = "vlrfret_not", precision = 15, scale = 2)
    private BigDecimal vlrfretNot; // Valor do frete

    @Column(name = "valortot_not", precision = 15, scale = 2)
    private BigDecimal valortotNot; // Valor total do item

    @Column(name = "devol_not", length = 3)
    private Integer devolNot; // Quantidade devolvida

    @Column(name = "fab_not", length = 3)
    private String fabNot; // Código da categoria/fabricante

    // Campos adicionais para NF-e
    @Column(name = "codbarras_not", length = 14)
    private String codbarrasNot; // Código de barras

    @Column(name = "unidade_not", length = 2)
    private String unidadeNot; // Unidade de medida (UN, KG, LT, etc)

    @Column(name = "codclassfiscal_not", length = 10)
    private String codclassfiscalNot; // Código da classificação fiscal (NCM)

    @Column(name = "codcfop_not", length = 4)
    private String codcfopNot; // Código CFOP

    @Column(name = "baseicms_not", precision = 15, scale = 2)
    private BigDecimal baseicmsNot; // Base de cálculo do ICMS

    @Column(name = "vlricms_not", precision = 15, scale = 2)
    private BigDecimal vlricmsNot; // Valor do ICMS

    @Column(name = "aliquotaicms_not", precision = 5, scale = 2)
    private BigDecimal aliquotaicmsNot; // Alíquota do ICMS

    @Column(name = "vlrist_not", precision = 15, scale = 2)
    private BigDecimal vlristNot; // Valor do ISS

    @Column(name = "baseiss_not", precision = 15, scale = 2)
    private BigDecimal baseissNot; // Base de cálculo do ISS

    @Column(name = "aliquotaiss_not", precision = 5, scale = 2)
    private BigDecimal aliquotaissNot; // Alíquota do ISS

    @Column(name = "vlripi_not", precision = 15, scale = 2)
    private BigDecimal vlripiNot; // Valor do IPI

    @Column(name = "baseipi_not", precision = 15, scale = 2)
    private BigDecimal baseipiNot; // Base de cálculo do IPI

    @Column(name = "aliquotaipi_not", precision = 5, scale = 2)
    private BigDecimal aliquotaipiNot; // Alíquota do IPI

    @Column(name = "vlrpis_not", precision = 15, scale = 2)
    private BigDecimal vlrpisNot; // Valor do PIS

    @Column(name = "vlrcofins_not", precision = 15, scale = 2)
    private BigDecimal vlrcofinsNot; // Valor do COFINS

    @Column(name = "csticms_not", length = 3)
    private String csticmsNot; // Código de Situação Tributária do ICMS

    @Column(name = "cstipi_not", length = 2)
    private String cstipiNot; // Código de Situação Tributária do IPI

    @Column(name = "cstpis_not", length = 2)
    private String cstpisNot; // Código de Situação Tributária do PIS

    @Column(name = "cstcofins_not", length = 2)
    private String cstcofinsNot; // Código de Situação Tributária do COFINS

    @Column(name = "codanp_not", length = 5)
    private String codanpNot; // Código ANP (para combustíveis)

    @Column(name = "qtdvol_not", precision = 12, scale = 4)
    private BigDecimal qtdvolNot; // Quantidade de volumes

    @Column(name = "peso_not", precision = 12, scale = 3)
    private BigDecimal pesoNot; // Peso líquido

    @Column(name = "pesobrut_not", precision = 12, scale = 3)
    private BigDecimal pesobrutNot; // Peso bruto

    @Column(name = "numerolote_not", length = 20)
    private String numeroloteNot; // Número do lote

    @Column(name = "datalote_not", length = 8)
    private Integer dataloteNot; // Data de fabricação/lote

    @Column(name = "obsitem_not", length = 500)
    private String obsitemNot; // Observações do item
}
