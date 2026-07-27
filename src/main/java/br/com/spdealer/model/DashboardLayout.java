package br.com.spdealer.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "dashboard_layout")
@Data
public class DashboardLayout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long usuarioId;

    private String nome;

    @Column(columnDefinition = "TEXT")
    private String layoutJson;

    private Boolean ativo;
}
