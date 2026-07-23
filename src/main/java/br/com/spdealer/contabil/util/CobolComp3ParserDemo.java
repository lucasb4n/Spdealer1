package br.com.spdealer.contabil.util;

import java.math.BigDecimal;

public class CobolComp3ParserDemo {
    public static void main(String[] args) {
        // Exemplo 1: 12345 com escala 2 -> 123.45
        byte[] packed1 = new byte[] { (byte)0x12, (byte)0x34, (byte)0x5C };
        BigDecimal v1 = CobolComp3Parser.parsePackedDecimal(packed1, 2);
        System.out.println("Packed [0x12 0x34 0x5C] -> " + v1 + " (esperado 123.45)");

        // Exemplo 2: 00123 com escala 2 -> 1.23 (leading zeros)
        byte[] packed2 = new byte[] { (byte)0x00, (byte)0x12, (byte)0x3C };
        BigDecimal v2 = CobolComp3Parser.parsePackedDecimal(packed2, 2);
        System.out.println("Packed [0x00 0x12 0x3C] -> " + v2 + " (esperado 1.23)");

        // Exemplo 3: negativo -45.67 -> digits 4567 sign D with scale 2: bytes 0x45 0x67 0xD? (packed as 0x45,0x67,0xD)
        byte[] packed3 = new byte[] { (byte)0x45, (byte)0x67, (byte)0xD };
        BigDecimal v3 = CobolComp3Parser.parsePackedDecimal(packed3, 2);
        System.out.println("Packed [0x45 0x67 0x0D] -> " + v3 + " (esperado -45.67)");
    }
}
