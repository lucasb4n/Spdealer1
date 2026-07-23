package br.com.spdealer.nfe.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidade para armazenar informações de pagamento das notas fiscais de ENTRADA
 * Tabela: xmlpagar
 * 
 * Baseado na estrutura real do banco de dados SpDealer
 */
@Entity
@Table(name = "xmlpagar")
@IdClass(XmlPagarId.class)
@Data
public class XmlPagar {

    @Id
    @Column(name = "Id", length = 50)
    private String id; // Chave da NF-e

    @Id
    @Column(name = "parc")
    private Integer parc; // Número da parcela

    @Column(name = "nFat", length = 15)
    private String nFat; // Número da fatura

    @Column(name = "vOrig", precision = 12, scale = 2)
    private BigDecimal vOrig; // Valor original

    @Column(name = "vLiq", precision = 12, scale = 2)
    private BigDecimal vLiq; // Valor líquido

    @Id
    @Column(name = "nDup", length = 15)
    private String nDup; // Número do documento

    @Column(name = "dVenc")
    private LocalDate dVenc; // Data de vencimento

    @Column(name = "vDup", precision = 12, scale = 2)
    private BigDecimal vDup; // Valor do documento
}
