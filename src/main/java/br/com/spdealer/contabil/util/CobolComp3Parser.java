package br.com.spdealer.contabil.util;

import java.math.BigDecimal;

public final class CobolComp3Parser {

    private CobolComp3Parser() {}

    /**
     * Converte um array de bytes (packed decimal / COMP-3) em BigDecimal com a escala informada.
     *
     * Algoritmo básico:
     * - Cada nibble (4 bits) representa um dígito decimal, o último nibble é o sinal (0xC,0xF = positivo; 0xD = negativo)
     * - Os dígitos são concatenados em uma string, interpretados como inteiro e ajustados pela escala
     *
     * Observação: suportamos sinais comuns (C, F = positivo; D, B = negativo). Validar com amostras do legado.
     */
    public static BigDecimal parsePackedDecimal(byte[] packed, int scale) {
        if (packed == null || packed.length == 0) {
            return BigDecimal.ZERO.setScale(scale);
        }

        StringBuilder digits = new StringBuilder();
        int last = packed.length - 1;
        int signNibble = 0xC; // default positive

        for (int i = 0; i < packed.length; i++) {
            int b = packed[i] & 0xFF;
            int hi = (b >> 4) & 0xF;
            int lo = b & 0xF;

            if (i < last) {
                digits.append(hi).append(lo);
            } else {
                // último byte: low nibble é sinal
                digits.append(hi);
                signNibble = lo;
            }
        }

        // Remover zeros à esquerda, manter pelo menos um dígito
        String ds = digits.toString().replaceFirst("^0+(?!$)", "");
        if (ds.isEmpty()) ds = "0";

        java.math.BigInteger bi = new java.math.BigInteger(ds);

        // sinais comuns: C/F = positivo, D/B = negativo
        boolean negative = (signNibble == 0xD || signNibble == 0xB);
        if (negative) bi = bi.negate();

        return new BigDecimal(bi, scale);
    }
}
