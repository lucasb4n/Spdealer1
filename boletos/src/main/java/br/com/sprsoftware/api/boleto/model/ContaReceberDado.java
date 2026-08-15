package br.com.sprsoftware.api.boleto.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ContaReceberDado(
        Long receberId,
        String filial,
        Integer codigo,
        String numdup,
        String parcela,
        String tipodoc,
        String tpcob,
        String cgccpf,
        LocalDate dtMovi,
        LocalDate dtEmissao,
        LocalDate dtVencimento,
        LocalDate dtPagamento,
        String banco,
        String codigoBol,
        String nossoNumero,
        BigDecimal valorDuplicata,
        BigDecimal valorSaldo,
        String status,
        String nomePagador,
        String enderecoPagador,
        String bairroPagador,
        String cidadePagador,
        String ufPagador,
        String cepPagador,
        String telefonePagador,
        String celularPagador) {
}