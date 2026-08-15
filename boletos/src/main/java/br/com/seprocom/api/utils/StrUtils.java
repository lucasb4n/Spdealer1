package br.com.seprocom.api.utils;

public class StrUtils {

    public static boolean isNullOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    public static String somenteNumeros(String s) {
        if (s == null) return null;
        String res = s.replaceAll("[^0-9]", "");
        if (res.length() == 13) {
            res = "0" + res;
        }
        return res;
    }

    public static String defaultIfEmpty(String s, String def) {
        if (s == null || s.trim().isEmpty()) return def;
        return s;
    }

    public static String trimToNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
