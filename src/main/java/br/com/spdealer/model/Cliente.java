package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "clientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "CLIFORCL_CLI", length = 1)
    private String clifornCli;

    @Column(name = "CODIGO_CLI", nullable = false)
    private Integer codigoCli;

    @Column(name = "NOME_CLI", length = 50)
    private String nomeCli;

    @Column(name = "CGCCPF_CLI", precision = 14)
    private BigDecimal cgccpfCli;

    @Column(name = "INSCEST_CLI", length = 20)
    private String inscestCli;

    @Column(name = "LOGRA_CLI", length = 50)
    private String lograCli;

    @Column(name = "NUMERO_CLI", length = 10)
    private String numeroCli;

    @Column(name = "BAIRRO_CLI", length = 20)
    private String bairroCli;

    @Column(name = "CIDADE_CLI", length = 30)
    private String cidadeCli;

    @Column(name = "UF_CLI", length = 2)
    private String ufCli;

    @Column(name = "CEP_CLI", precision = 8)
    private BigDecimal cepCli;

    @Column(name = "PREF_CLI")
    private Integer prefCli;

    @Column(name = "FONE_CLI", precision = 9)
    private BigDecimal foneCli;

    @Column(name = "PREF1_CLI")
    private Integer pref1Cli;

    @Column(name = "FONE1_CLI", precision = 9)
    private BigDecimal fone1Cli;

    @Column(name = "CONTATO_CLI", length = 30)
    private String contatoCli;

    @Column(name = "EMAIL_CLI", length = 100)
    private String emailCli;

    @Column(name = "CONDPAG_CLI")
    private Integer condpagCli;

    @Column(name = "VENDEDOR_CLI", precision = 10)
    private BigDecimal vendedorCli;

    @Column(name = "NIVEL_CLI")
    private Integer nivelCli;

    @Column(name = "FATLIQ_CLI")
    private Integer fatliqCli;

    @Column(name = "NAOCONTR_CLI")
    private Integer naocontrCli;

    @Column(name = "REVENDA_CLI", length = 1)
    private String revendaCli;

    @Column(name = "TIPOCLI_CLI", length = 1)
    private String tipocliCli;
}
