package br.com.spdealer.model;

import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "masniv")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NivelPreco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "NIVEL_NIV", nullable = false)
    private Integer nivelNiv;

    @Column(name = "DESCR_NIV", length = 40)
    private String descrNiv;

    @Column(name = "PERC_NIV", precision = 7)
    private BigDecimal percNiv;

    @Column(name = "BASE_NIV", precision = 7)
    private BigDecimal baseNiv;

    @Column(name = "OBS_NIV", length = 80)
    private String obsNiv;
}
