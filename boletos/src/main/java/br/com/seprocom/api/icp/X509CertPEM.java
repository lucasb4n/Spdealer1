package br.com.seprocom.api.icp;

import br.com.seprocom.api.utils.SprException;
import java.io.ByteArrayInputStream;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class X509CertPEM extends X509Cert {

    private String privateKey;

    public X509CertPEM(String pemCertificate) {
        try {
            this.certificate = loadCertificateFromPem(pemCertificate);
            loadCertificateInfos();
        } catch (Exception e) {
            throw new SprException("Erro ao carregar certificado PEM: " + e.getMessage(), e);
        }
    }

    public X509CertPEM(String pemCertificate, String privateKey, String password) {
        try {
            this.certificate = loadCertificateFromPem(pemCertificate);
            this.privateKey = privateKey;
            loadCertificateInfos();
        } catch (Exception e) {
            throw new SprException("Erro ao carregar certificado PEM com chave: " + e.getMessage(), e);
        }
    }

    private static X509Certificate loadCertificateFromPem(String pem) {
        try {
            String certBody = extractCertBody(pem);
            byte[] certBytes = Base64.getDecoder().decode(certBody);
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            return (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(certBytes));
        } catch (Exception e) {
            throw new SprException("Erro ao parsear PEM: " + e.getMessage(), e);
        }
    }

    private static String extractCertBody(String pem) {
        Pattern pattern = Pattern.compile("-----BEGIN CERTIFICATE-----\\s*(.*?)\\s*-----END CERTIFICATE-----", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(pem);
        if (matcher.find()) {
            return matcher.group(1).replaceAll("\\s", "");
        }
        throw new SprException("Certificado PEM invalido: marcadores BEGIN/END nao encontrados");
    }

    @Override
    public String getKeyString() {
        return privateKey;
    }

    public byte[] getKeyBytes() {
        if (privateKey == null) return null;
        try {
            Pattern pattern = Pattern.compile("-----BEGIN PRIVATE KEY-----\\s*(.*?)\\s*-----END PRIVATE KEY-----", Pattern.DOTALL);
            Matcher matcher = pattern.matcher(privateKey);
            if (matcher.find()) {
                return Base64.getDecoder().decode(matcher.group(1).replaceAll("\\s", ""));
            }
            return Base64.getDecoder().decode(privateKey.replaceAll("\\s", ""));
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public PrivateKey getPrivateKey() {
        try {
            byte[] keyBytes = getKeyBytes();
            if (keyBytes == null) return null;
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return kf.generatePrivate(spec);
        } catch (Exception e) {
            return null;
        }
    }
}
