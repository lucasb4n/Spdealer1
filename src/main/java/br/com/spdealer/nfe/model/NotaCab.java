package br.com.spdealer.nfe.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entidade correspondente à FD NOTASCAB do COBOL
 * Tabela: notascab
 * 
 * Mapeamento dos campos COBOL:
 * - FILIAL-NOT        PIC 9(003)    -> filial_not
 * - EMISSAOI-NOT      PIC 9(008)    -> emissaoi_not (data formato DDMMAAAA)
 * - REGISTRO-NOT      PIC 99        -> registro_not
 * - TIPO-NOT          PIC XX        -> tipo_not (E=Entrada, S=Saida)
 * - SERIE-NOT         PIC X(003)    -> serie_not
 * - NUMERO-NOT        PIC 9(006)    -> numero_not
 * - DEPTO-NOT         PIC 9(003)    -> dpto_not
 * - VENDEDOR-NOT      PIC 9(010)    -> vendedor_not
 * - DTMOV-NOT         PIC 9(008)    -> drmov_not (data de movimento)
 * - DTMOVI-NOT        PIC 9(008)    -> dtmovi_not (data de movimentação)
 */
@Entity
@Table(name = "notascab")
@Data
public class NotaCab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "filial_not", length = 3, nullable = false)
    private Integer filialNot;

    @Column(name = "emissaoi_not", length = 8, nullable = false)
    private Integer emissaoiNot; // Data no formato DDMMAAAA (sistema legado)

    @Column(name = "registro_not", length = 2)
    private Integer registroNot;

    @Column(name = "tipo_not", length = 2, nullable = false)
    private String tipoNot; // E = Entrada, S = Saída

    @Column(name = "serie_not", length = 3, nullable = false)
    private String serieNot;

    @Column(name = "numero_not", length = 6, nullable = false)
    private Integer numeroNot;

    @Column(name = "dpto_not", length = 3)
    private Integer dptoNot;

    @Column(name = "vendedor_not", length = 10)
    private Long vendedorNot;

    @Column(name = "drmov_not", length = 8)
    private Integer drmovNot; // Data de movimento no formato DDMMAAAA

    @Column(name = "dtmovi_not", length = 8)
    private Integer dtmoviNot; // Data de movimentação no formato DDMMAAAA

    // Campos adicionais identificados no SELECT do COBOL
    @Column(name = "cgccpf_not", length = 14)
    private String cgccpfNot; // CNPJ ou CPF do cliente

    @Column(name = "nome_not", length = 60)
    private String nomeNot; // Nome do cliente

    @Column(name = "endereco_not", length = 60)
    private String enderecoNot;

    @Column(name = "bairro_not", length = 30)
    private String bairroNot;

    @Column(name = "cidade_not", length = 30)
    private String cidadeNot;

    @Column(name = "estado_not", length = 2)
    private String estadoNot;

    @Column(name = "cep_not", length = 8)
    private String cepNot;

    @Column(name = "inscrest_not", length = 15)
    private String inscrestNot; // Inscrição Estadual

    @Column(name = "condpag_not", length = 3)
    private String condpagNot; // Código da condição de pagamento

    @Column(name = "vlrmerc_not", precision = 15, scale = 2)
    private BigDecimal vlrmercNot; // Valor da mercadoria

    @Column(name = "vlrdesc_not", precision = 15, scale = 2)
    private BigDecimal vlrdescNot; // Valor do desconto

    @Column(name = "vlrnot_not", precision = 15, scale = 2)
    private BigDecimal vlrnotNot; // Valor da nota

    @Column(name = "vlricms_not", precision = 15, scale = 2)
    private BigDecimal vlricmsNot; // Valor do ICMS

    @Column(name = "vlrist_not", precision = 15, scale = 2)
    private BigDecimal vlristNot; // Valor do ISS

    @Column(name = "vlrfret_not", precision = 15, scale = 2)
    private BigDecimal vlrfretNot; // Valor do freight

    @Column(name = "vlrseg_not", precision = 15, scale = 2)
    private BigDecimal vlrsegNot; // Valor do seguro

    @Column(name = "vlroutros_not", precision = 15, scale = 2)
    private BigDecimal vlroutrosNot; // Outros valores

    @Column(name = "baseicms_not", precision = 15, scale = 2)
    private BigDecimal baseicmsNot; // Base de cálculo do ICMS

    @Column(name = "aliquota_not", precision = 5, scale = 2)
    private BigDecimal aliquotaNot; // Alíquota do imposto

    // Campos para NF-e
    @Column(name = "chavenfe_not", length = 44)
    private String chavenfeNot; // Chave da NF-e (44 dígitos)

    @Column(name = "protocolo_not", length = 15)
    private String protocoloNot; // Protocolo de autorização

    @Column(name = "statusnfe_not", length = 1)
    private String statusnfeNot; // Status da NF-e (0=Pendente, 1=Autorizada, 2=Cancelada, 3=Denegada)

    @Column(name = "datas canc_not", length = 8)
    private Integer datascancNot; // Data de cancelamento

    @Column(name = "motivo_not", length = 200)
    private String motivoNot; // Motivo da situação

    @Column(name = "xmlnot_not", columnDefinition = "TEXT")
    private String xmlnotNot; // XML da NF-e

    /**
     * Converte a data em formato DDMMAAAA (legado) para LocalDate
     */
    public LocalDate getEmissaoAsLocalDate() {
        if (emissaoiNot == null) return null;
        String dataStr = String.valueOf(emissaoiNot);
        while (dataStr.length() < 8) {
            dataStr = "0" + dataStr;
        }
        int dia = Integer.parseInt(dataStr.substring(0, 2));
        int mes = Integer.parseInt(dataStr.substring(2, 4));
        int ano = Integer.parseInt(dataStr.substring(4, 8));
        return LocalDate.of(ano, mes, dia);
    }

    /**
     * Converte LocalDate para formato DDMMAAAA (legado)
     */
    public static Integer localDateToLegacyDate(LocalDate date) {
        if (date == null) return null;
        String dia = String.format("%02d", date.getDayOfMonth());
        String mes = String.format("%02d", date.getMonthValue());
        String ano = String.format("%04d", date.getYear());
        return Integer.parseInt(dia + mes + ano);
    }
}
