package br.com.seprocom.api.utils.v3;

import java.util.Date;

public class Authorization {

    private static Authorization instance = new Authorization();

    private Authorization() {}

    public static Authorization getInstance() {
        return instance;
    }

    public static boolean hasAuth(String a, String b, String c) {
        return true;
    }

    public static boolean hasAuth(String a, String b) {
        return true;
    }

    public static boolean checkAuth(String a, String b, Date c, String d) {
        return true;
    }

    public boolean hasAuthInstance(String a, String b, String c) {
        return true;
    }

    public boolean checkAuthInstance(String a, String b, Date c, String d) {
        return true;
    }
}
