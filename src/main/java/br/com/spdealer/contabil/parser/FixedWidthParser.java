package br.com.spdealer.contabil.parser;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Parser simples para arquivos de layout fixo (fixed-width).
 * Layout: mapa de campo -> int[]{start, length} (0-based index start)
 */
public final class FixedWidthParser {
    private FixedWidthParser() {}

    public static Map<String, String> parseLine(String line, Map<String, int[]> layout) {
        Map<String, String> result = new LinkedHashMap<>();
        if (line == null) return result;
        for (Map.Entry<String, int[]> e : layout.entrySet()) {
            int[] pos = e.getValue();
            int start = pos[0];
            int len = pos[1];
            if (start >= line.length()) {
                result.put(e.getKey(), "");
                continue;
            }
            int end = Math.min(line.length(), start + len);
            result.put(e.getKey(), line.substring(start, end).trim());
        }
        return result;
    }
}
