package br.com.spdealer.util;

public final class ReportUtils {

    private ReportUtils() {}

    public static String formatCgcCpf(Object raw) {
        if (raw == null) return "";
        try {
            String s = raw.toString().replaceAll("\\D", "");
            if (s.length() == 11) {
                return s.replaceFirst("(\\d{3})(\\d{3})(\\d{3})(\\d{2})", "$1.$2.$3-$4");
            } else if (s.length() == 14) {
                return s.replaceFirst("(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{2})", "$1.$2.$3/$4-$5");
            } else {
                return raw.toString();
            }
        } catch (Exception e) {
            return raw.toString();
        }
    }
}
