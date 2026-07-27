package br.com.sprsoftware.api.boleto.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "boletos")
public class Autoriza extends Boleto {
}
