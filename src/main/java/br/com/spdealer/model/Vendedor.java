package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "masven")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "LOJA_VEN")
    private Integer lojaVen;

    @Column(name = "COD_VEN", nullable = false)
    private Integer codVen;

    @Column(name = "NOME_VEN", length = 50)
    private String nomeVen;

    @Column(name = "APELIDO_VEN", length = 20)
    private String apelidoVen;

    @Column(name = "ENDERECO_VEN", length = 50)
    private String enderecoVen;

    @Column(name = "BAIRRO_VEN", length = 20)
    private String bairroVen;

    @Column(name = "CIDADE_VEN", length = 30)
    private String cidadeVen;

    @Column(name = "UF_VEN", length = 2)
    private String ufVen;

    @Column(name = "CEP_VEN", precision = 8)
    private BigDecimal cepVen;

    @Column(name = "PREF_VEN")
    private Integer prefVen;

    @Column(name = "FONE_VEN", precision = 9)
    private BigDecimal foneVen;

    @Column(name = "PREF1_VEN")
    private Integer pref1Ven;

    @Column(name = "FONE1_VEN", precision = 9)
    private BigDecimal fone1Ven;

    @Column(name = "CONTATO_VEN", length = 30)
    private String contatoVen;

    @Column(name = "COMIS_VEN", precision = 5)
    private BigDecimal comisVen;

    @Column(name = "OBS_VEN", length = 100)
    private String obsVen;

    @Column(name = "SITUAC_VEN", length = 1)
    private String situacVen;

    @Column(name = "DTADM_VEN")
    private Integer dtadmVen;

    @Column(name = "CODIGOGER_VEN")
    private Integer codigogerVen;
}
