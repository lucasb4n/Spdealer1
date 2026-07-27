package br.com.spdealer.nfe.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidade para armazenar itens das notas fiscais de ENTRADA (XML de fornecedores)
 * Tabela: xmlnotadet
 * 
 * Baseado na estrutura real do banco de dados SpDealer
 */
@Entity
@Table(name = "xmlnotadet")
@IdClass(XmlNotaDetId.class)
@Data
public class XmlNotaDet {

    @Id
    @Column(name = "Id", length = 50)
    private String id; // Chave da NF-e

    @Id
    @Column(name = "nItem")
    private Integer nItem; // Número do item

    @Column(name = "cProd", length = 50)
    private String cProd; // Código do produto

    @Column(name = "cEAN", length = 50)
    private String cEAN; // EAN do produto

    @Column(name = "xProd", length = 100)
    private String xProd; // Descrição do produto

    @Column(name = "sCat", length = 1)
    private String sCat; // Serviço categoria

    @Column(name = "sProd", length = 50)
    private String sProd; // Código EAN/GTIN do produto

    @Column(name = "NCM", length = 8)
    private String NCM; // NCM

    @Column(name = "EXTIPI", length = 2)
    private String EXTIPI;

    @Column(name = "CFOP", length = 4)
    private String CFOP;

    @Column(name = "uCom", length = 2)
    private String uCom; // Unidade comercial

    @Column(name = "qCom", precision = 8, scale = 4)
    private BigDecimal qCom; // Quantidade comercial

    @Column(name = "vUnCom", precision = 15, scale = 4)
    private BigDecimal vUnCom; // Valor unitário comercial

    @Column(name = "vProd", precision = 12, scale = 2)
    private BigDecimal vProd; // Valor do produto

    @Column(name = "uTrib", length = 2)
    private String uTrib; // Unidade tributária

    @Column(name = "cEANTrib", length = 2)
    private String cEANTrib;

    @Column(name = "qTrib")
    private Integer qTrib; // Quantidade tributária

    @Column(name = "vUnTrib", precision = 15, scale = 4)
    private BigDecimal vUnTrib; // Valor unitário tributável

    @Column(name = "indTot", length = 1)
    private String indTot; // Indicador de total

    @Column(name = "vTotTrib", precision = 12, scale = 2)
    private BigDecimal vTotTrib; // Valor total tributos

    // ICMS
    @Column(name = "orig", length = 1)
    private String orig; // Origem da mercadoria

    @Column(name = "CSTI", length = 2)
    private String CSTI; // CST do ICMS

    @Column(name = "modBC", length = 1)
    private String modBC; // Modalidade BC ICMS

    @Column(name = "vBCI", precision = 12, scale = 2)
    private BigDecimal vBCI; // BC do ICMS

    @Column(name = "pICMS", precision = 4, scale = 2)
    private BigDecimal pICMS; // Alíquota ICMS

    @Column(name = "vICMS", precision = 12, scale = 2)
    private BigDecimal vICMS; // Valor ICMS

    // IPI
    @Column(name = "CSTIPI", length = 2)
    private String CSTIPI; // CST do IPI

    @Column(name = "vBCIPI", precision = 12, scale = 2)
    private BigDecimal vBCIPI; // BC IPI

    @Column(name = "pIPI", precision = 4, scale = 2)
    private BigDecimal pIPI; // Alíquota IPI

    @Column(name = "vIPI", precision = 12, scale = 2)
    private BigDecimal vIPI; // Valor IPI

    // ICMS ST
    @Column(name = "modBCST", length = 1)
    private String modBCST; // Modalidade BC ICMS ST

    @Column(name = "pMVAST", precision = 7, scale = 4)
    private BigDecimal pMVAST; // MVA ST

    @Column(name = "vBCST", precision = 12, scale = 2)
    private BigDecimal vBCST; // BC ST

    @Column(name = "pICMSST", precision = 4, scale = 2)
    private BigDecimal pICMSST; // Alíquota ST

    @Column(name = "vICMSST", precision = 12, scale = 2)
    private BigDecimal vICMSST; // Valor ST

    @Column(name = "cEnq", length = 3)
    private String cEnq; // Código de enquadramento IPI

    // PIS
    @Column(name = "CSTP", length = 2)
    private String CSTP; // CST do PIS

    @Column(name = "vBCP", precision = 12, scale = 2)
    private BigDecimal vBCP; // BC PIS

    @Column(name = "pPIS", precision = 4, scale = 2)
    private BigDecimal pPIS; // Alíquota PIS

    @Column(name = "vPIS", precision = 12, scale = 2)
    private BigDecimal vPIS; // Valor PIS

    // COFINS
    @Column(name = "CSTC", length = 2)
    private String CSTC; // CST do COFINS

    @Column(name = "vBCC", precision = 12, scale = 2)
    private BigDecimal vBCC; // BC COFINS

    @Column(name = "pCOFINS", precision = 4, scale = 2)
    private BigDecimal pCOFINS; // Alíquota COFINS

    @Column(name = "vCOFINS", precision = 12, scale = 2)
    private BigDecimal vCOFINS; // Valor COFINS

    // Valores adicionais
    @Column(name = "vFRETEI", precision = 12, scale = 2)
    private BigDecimal vFRETEI; // Frete item

    @Column(name = "vDESCI", precision = 12, scale = 2)
    private BigDecimal vDESCI; // Desconto item

    @Column(name = "VOUTROSI", precision = 12, scale = 2)
    private BigDecimal vOUTROSI; // Outro valores item

    // Informações do pedido
    @Column(name = "xPed", length = 15)
    private String xPed; // Número do pedido

    @Column(name = "PedCat", length = 1)
    private String PedCat; // Categoria pedido

    @Column(name = "PedProd", length = 50)
    private String PedProd; // Código pedido

    @Column(name = "seqped")
    private Integer seqped; // Sequência pedido

    // De-Para com produto interno do estoque
    @Column(name = "fab_est", length = 20)
    private String fabEst; // Fabricante/categoria (FK estoque.fab_est)

    @Column(name = "codprod_est", length = 20)
    private String codprodEst; // Código produto interno (FK estoque.codprod_est)

    @Column(name = "fator_conversao", precision = 10, scale = 4)
    private BigDecimal fatorConversao; // Fator de conversão (ex: 1 CX = 12 UN)

    @Transient
    private String descricaoProduto;

    // NF-e de devolução
    @Column(name = "tiponfdev", length = 1)
    private String tiponfdev;

    @Column(name = "serienfdev", length = 3)
    private String serienfdev;

    @Column(name = "datanfdev")
    private LocalDate datanfdev;

    @Column(name = "notadev")
    private Integer notadev;

    // Detalhes do IBS (Imposto sobre Bens e Serviços) por Item
    @Column(name = "CSTIBS", length = 2)
    private String CSTIBS;

    @Column(name = "vBCIBS", precision = 12, scale = 2)
    private BigDecimal vBCIBS;

    @Column(name = "pIBS", precision = 5, scale = 2)
    private BigDecimal pIBS;

    @Column(name = "vIBS", precision = 12, scale = 2)
    private BigDecimal vIBS;

    // Detalhes da CBS (Contribuição sobre Bens e Serviços) por Item
    @Column(name = "CSTCBS", length = 2)
    private String CSTCBS;

    @Column(name = "vBCCBS", precision = 12, scale = 2)
    private BigDecimal vBCCBS;

    @Column(name = "pCBS", precision = 5, scale = 2)
    private BigDecimal pCBS;

    @Column(name = "vCBS", precision = 12, scale = 2)
    private BigDecimal vCBS;

    // Detalhes do IS (Imposto Seletivo) por Item
    @Column(name = "CSTIS", length = 2)
    private String CSTIS;

    @Column(name = "vBCIS", precision = 12, scale = 2)
    private BigDecimal vBCIS;

    @Column(name = "pIS", precision = 5, scale = 2)
    private BigDecimal pIS;

    @Column(name = "vIS", precision = 12, scale = 2)
    private BigDecimal vIS;
}
