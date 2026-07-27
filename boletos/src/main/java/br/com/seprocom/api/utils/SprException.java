package br.com.seprocom.api.utils;

public class SprException extends RuntimeException {

    public SprException(String message) {
        super(message);
    }

    public SprException(String message, Throwable cause) {
        super(message, cause);
    }

    public SprException(Throwable cause) {
        super(cause);
    }
}
