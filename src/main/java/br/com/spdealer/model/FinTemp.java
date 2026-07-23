package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "fin_temp")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinTemp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ps", nullable = false, length = 1)
    private String ps;

    @Column(name = "tip", nullable = false, length = 3)
    private String tip;

    @Column(name = "ep", nullable = false, length = 2)
    private String ep;

    @Column(name = "numero", precision = 7)
    private Integer numero;

    @Column(name = "parcela", length = 3)
    private String parcela;

    @Column(name = "dtvenc")
    private LocalDate dtvenc;

    @Column(name = "valor", precision = 14, scale = 2)
    private BigDecimal valor;

    @Column(name = "banco", length = 3)
    private String banco;

    @Column(name = "dbanco", length = 20)
    private String dbanco;

    @Column(name = "cobranca", length = 3)
    private String cobranca;

    @Column(name = "dcobranca", length = 20)
    private String dcobranca;

    @Column(name = "usuario")
    private Integer usuario;
}
