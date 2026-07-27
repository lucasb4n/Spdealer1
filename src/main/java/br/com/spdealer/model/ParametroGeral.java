package br.com.spdealer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "parametros_gerais")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParametroGeral {

    @Id
    @Column(length = 50)
    private String chave;

    @Column(columnDefinition = "TEXT")
    private String valor;

    @Column(length = 200)
    private String descricao;

    @Column(length = 50)
    private String grupo; // ex: EMPRESA, SISTEMA, EMAIL

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
