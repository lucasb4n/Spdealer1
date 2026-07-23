package br.com.spdealer.nfe.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidade para armazenar notas fiscais de ENTRADA (XML de fornecedores)
 * Tabela: xmlnotacab
 * 
 * Baseado na estrutura real do banco de dados SpDealer
 */
@Entity
@Table(name = "xmlnotacab")
@Data
public class XmlNotaCab {

    @Id
    @Column(name = "Id", length = 50)
    private String id; // Chave da NF-e (44 dígitos)

    @Column(name = "versao", length = 4)
    private String versao;

    @Column(name = "cUF", length = 2)
    private String cUF; // Código da UF

    @Column(name = "cNF", length = 10)
    private String cNF; // Código numérico

    @Column(name = "natOp", length = 100)
    private String natOp; // Natureza da operação

    @Column(name = "indPag", length = 1)
    private String indPag; // Indicador da forma de pagamento

    @Column(name = "mod", length = 2)
    private String mod; // Modelo

    @Column(name = "serie", length = 3)
    private String serie;

    @Column(name = "nNF", length = 10)
    private Integer nNF; // Número da NF

    @Column(name = "dhEmi", length = 26)
    private String dhEmi; // Data/hora emissão

    @Column(name = "dhSaiEnt", length = 25)
    private String dhSaiEnt; // Data/hora saída/entrada

    @Column(name = "dtmovi")
    private LocalDate dtmovi; // Data de movimento

    @Column(name = "tpNF", length = 1)
    private String tpNF; // Tipo de NF (0=Entrada, 1=Saída)

    @Column(name = "idDest", length = 1)
    private String idDest; // Identificador de destino

    @Column(name = "cMunFG", length = 8)
    private String cMunFG; // Código município

    @Column(name = "tpImp", length = 1)
    private String tpImp; // Tipo de impressão

    @Column(name = "tpEmis", length = 1)
    private String tpEmis; // Tipo de emissão

    @Column(name = "cDV", length = 1)
    private String cDV; // Dígito verificador

    @Column(name = "tpAmb", length = 1)
    private String tpAmb; // Tipo ambiente

    @Column(name = "finNFe", length = 1)
    private String finNFe; // Finalidade NF-e

    @Column(name = "indFinal", length = 1)
    private String indFinal; // Indicador de operação com consumidor final

    @Column(name = "indPres", length = 1)
    private String indPres; // Indicador de presença

    @Column(name = "procEmi", length = 1)
    private String procEmi; // Processo de emissão

    @Column(name = "verProc", length = 4)
    private String verProc; // Versão do processo

    // Emitente (fornecedor)
    @Column(name = "CNPJe", length = 14)
    private String CNPJe;

    @Column(name = "xNomee", length = 100)
    private String xNomee;

    @Column(name = "xLgre", length = 100)
    private String xLgre;

    @Column(name = "nroe", length = 20)
    private String nroe;

    @Column(name = "xBairroe", length = 50)
    private String xBairroe;

    @Column(name = "cMune", length = 8)
    private String cMune;

    @Column(name = "xMune", length = 50)
    private String xMune;

    @Column(name = "UFe", length = 2)
    private String UFe;

    @Column(name = "CEPe", length = 8)
    private String CEPe;

    @Column(name = "cPaise", length = 10)
    private String cPaise;

    @Column(name = "xPaise", length = 20)
    private String xPaise;

    @Column(name = "fonee", length = 9)
    private String fonee;

    @Column(name = "IEe", length = 30)
    private String IEe; // Inscrição Estadual

    @Column(name = "IMe", length = 30)
    private String IMe; // Inscrição Municipal

    @Column(name = "CNAE", length = 30)
    private String CNAE;

    @Column(name = "CRT", length = 1)
    private String CRT; // Código Regime Tributário

    // Destinatário (nossa empresa)
    @Column(name = "CNPJd", length = 14)
    private String CNPJd;

    @Column(name = "xNomed", length = 100)
    private String xNomed;

    @Column(name = "xLgrd", length = 100)
    private String xLgrd;

    @Column(name = "nrod", length = 20)
    private String nrod;

    @Column(name = "xBairrod", length = 50)
    private String xBairrod;

    @Column(name = "cMund", length = 10)
    private String cMund;

    @Column(name = "xMund", length = 20)
    private String xMund;

    @Column(name = "UFd", length = 2)
    private String UFd;

    @Column(name = "CEPd", length = 15)
    private String CEPd;

    @Column(name = "cPaisd", length = 15)
    private String cPaisd;

    @Column(name = "xPaisd", length = 50)
    private String xPaisd;

    @Column(name = "foned", length = 30)
    private String foned;

    @Column(name = "indIEDest", length = 1)
    private String indIEDest;

    @Column(name = "IEd", length = 30)
    private String IEd;

    @Column(name = "ISUF", length = 30)
    private String ISUF;

    @Column(name = "email", length = 200)
    private String email;

    // Totais
    @Column(name = "vBC", precision = 12, scale = 2)
    private BigDecimal vBC; // Base de cálculo ICMS

    @Column(name = "vICMS", precision = 12, scale = 2)
    private BigDecimal vICMS;

    @Column(name = "vICMSDeson", precision = 12, scale = 2)
    private BigDecimal vICMSDeson;

    @Column(name = "vBCST", precision = 12, scale = 2)
    private BigDecimal vBCST;

    @Column(name = "vST", precision = 12, scale = 2)
    private BigDecimal vST;

    @Column(name = "vProd", precision = 12, scale = 2)
    private BigDecimal vProd;

    @Column(name = "vFrete", precision = 12, scale = 2)
    private BigDecimal vFrete;

    @Column(name = "vSeg", precision = 12, scale = 2)
    private BigDecimal vSeg;

    @Column(name = "vDesc", precision = 12, scale = 2)
    private BigDecimal vDesc;

    @Column(name = "vII", precision = 12, scale = 2)
    private BigDecimal vII;

    @Column(name = "vIPI", precision = 12, scale = 2)
    private BigDecimal vIPI;

    @Column(name = "vPIS", precision = 12, scale = 2)
    private BigDecimal vPIS;

    @Column(name = "vCOFINS", precision = 12, scale = 2)
    private BigDecimal vCOFINS;

    @Column(name = "vOutro", precision = 12, scale = 2)
    private BigDecimal vOutro;

    @Column(name = "vNF", precision = 12, scale = 2)
    private BigDecimal vNF;

    @Column(name = "vTotTrib", precision = 12, scale = 2)
    private BigDecimal vTotTrib;

    // Frete
    @Column(name = "modFrete", length = 1)
    private String modFrete;

    // Transportadora
    @Column(name = "CNPJt", length = 14)
    private String CNPJt;

    @Column(name = "xNomet", length = 100)
    private String xNomet;

    @Column(name = "IEt", length = 30)
    private String IEt;

    @Column(name = "xEnder", length = 100)
    private String xEnder;

    @Column(name = "xMun", length = 30)
    private String xMun;

    @Column(name = "UF", length = 2)
    private String UF;

    // Volumes
    @Column(name = "CNPJr", length = 14)
    private String CNPJr;

    @Column(name = "xLgrr", length = 100)
    private String xLgrr;

    @Column(name = "nror", length = 20)
    private String nror;

    @Column(name = "xBairror", length = 50)
    private String xBairror;

    @Column(name = "cMunr", length = 10)
    private String cMunr;

    @Column(name = "xMunr", length = 20)
    private String xMunr;

    @Column(name = "UFr", length = 2)
    private String UFr;

    @Column(name = "qVol", length = 5)
    private String qVol;

    @Column(name = "esp", length = 10)
    private String esp;

    @Column(name = "marca", length = 20)
    private String marca;

    @Column(name = "pesoL", precision = 10, scale = 3)
    private BigDecimal pesoL;

    @Column(name = "pesoB", precision = 10, scale = 3)
    private BigDecimal pesoB;

    // Informações complementares
    @Column(name = "infCpl", length = 500)
    private String infCpl;

    @Column(name = "vVendOrdem", length = 100)
    private String vVendOrdem;

    // Status de processamento
    @Column(name = "status", length = 1)
    private String status;

    // Totais Consolidados da Nota Fiscal (Reforma Tributária)
    @Column(name = "vBCIBS", precision = 12, scale = 2)
    private BigDecimal vBCIBS;

    @Column(name = "vIBS", precision = 12, scale = 2)
    private BigDecimal vIBS;

    @Column(name = "vBCCBS", precision = 12, scale = 2)
    private BigDecimal vBCCBS;

    @Column(name = "vCBS", precision = 12, scale = 2)
    private BigDecimal vCBS;

    @Column(name = "vIS", precision = 12, scale = 2)
    private BigDecimal vIS;

    // Mecanismo de Split Payment (Retenções Nacionais)
    @Column(name = "vSplitIBS", precision = 12, scale = 2)
    private BigDecimal vSplitIBS;

    @Column(name = "vSplitCBS", precision = 12, scale = 2)
    private BigDecimal vSplitCBS;

    @Column(name = "indSplit", length = 1)
    private String indSplit;
}
