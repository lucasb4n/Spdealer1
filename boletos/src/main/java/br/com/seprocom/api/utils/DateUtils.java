package br.com.seprocom.api.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

public class DateUtils {

    public static final String DEFAULT_DATE_FORMAT = "dd/MM/yyyy";
    public static final String DEFAULT_DATETIME_FORMAT = "dd/MM/yyyy HH:mm:ss";

    public static String formatDate(Date date) {
        if (date == null) return null;
        return new SimpleDateFormat(DEFAULT_DATE_FORMAT).format(date);
    }

    public static String formatDate(Date date, String format) {
        if (date == null) return null;
        return new SimpleDateFormat(format).format(date);
    }

    public static String formatDateTime(Date date) {
        if (date == null) return null;
        return new SimpleDateFormat(DEFAULT_DATETIME_FORMAT).format(date);
    }

    public static Date parseDate(String str) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            return new SimpleDateFormat(DEFAULT_DATE_FORMAT).parse(str.trim());
        } catch (ParseException e) {
            throw new SprException("Erro ao parsear data: " + str, e);
        }
    }

    public static Date parseDate(String str, String format) {
        if (str == null || str.trim().isEmpty()) return null;
        try {
            return new SimpleDateFormat(format).parse(str.trim());
        } catch (ParseException e) {
            throw new SprException("Erro ao parsear data: " + str + " com formato: " + format, e);
        }
    }

    public static Date addSecond(Date date, int seconds) {
        if (date == null) return null;
        Calendar cal = Calendar.getInstance();
        cal.setTime(date);
        cal.add(Calendar.SECOND, seconds);
        return cal.getTime();
    }
}
