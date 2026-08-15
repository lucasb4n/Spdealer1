package br.com.seprocom.api.icp;

import br.com.seprocom.api.utils.SprException;
import java.io.ByteArrayInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Base64;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManagerFactory;

public class X509CertA1 extends X509Cert {

    private PrivateKey privateKey;

    public X509CertA1(byte[] pfxBytes, String alias) {
        try {
            KeyStore ks = KeyStore.getInstance("PKCS12");
            ks.load(new ByteArrayInputStream(pfxBytes), null);
            java.util.Enumeration<String> aliases = ks.aliases();
            String usedAlias = alias;
            if (usedAlias == null && aliases.hasMoreElements()) {
                usedAlias = aliases.nextElement();
            }
            this.privateKey = (PrivateKey) ks.getKey(usedAlias, null);
            this.certificate = (X509Certificate) ks.getCertificate(usedAlias);
            loadCertificateInfos();
        } catch (Exception e) {
            throw new SprException("Erro ao carregar certificado A1 (PFX): " + e.getMessage(), e);
        }
    }

    public X509CertA1(String base64Pfx, String password) {
        try {
            byte[] pfxBytes = Base64.getDecoder().decode(base64Pfx);
            KeyStore ks = KeyStore.getInstance("PKCS12");
            ks.load(new ByteArrayInputStream(pfxBytes), password != null ? password.toCharArray() : null);
            java.util.Enumeration<String> aliases = ks.aliases();
            String usedAlias = aliases.hasMoreElements() ? aliases.nextElement() : null;
            this.privateKey = (PrivateKey) ks.getKey(usedAlias, password != null ? password.toCharArray() : null);
            this.certificate = (X509Certificate) ks.getCertificate(usedAlias);
            loadCertificateInfos();
        } catch (Exception e) {
            throw new SprException("Erro ao carregar certificado A1 (Base64): " + e.getMessage(), e);
        }
    }

    public X509CertA1(String pfxFilePath, String alias, String password) {
        try {
            java.io.File file = new java.io.File(pfxFilePath);
            java.io.FileInputStream fis = new java.io.FileInputStream(file);
            byte[] pfxBytes = new byte[(int) file.length()];
            fis.read(pfxBytes);
            fis.close();

            KeyStore ks = KeyStore.getInstance("PKCS12");
            ks.load(new ByteArrayInputStream(pfxBytes), password != null ? password.toCharArray() : null);
            java.util.Enumeration<String> aliases = ks.aliases();
            String usedAlias = alias;
            if (usedAlias == null && aliases.hasMoreElements()) {
                usedAlias = aliases.nextElement();
            }
            this.privateKey = (PrivateKey) ks.getKey(usedAlias, password != null ? password.toCharArray() : null);
            this.certificate = (X509Certificate) ks.getCertificate(usedAlias);
            loadCertificateInfos();
        } catch (Exception e) {
            throw new SprException("Erro ao carregar certificado A1 (arquivo): " + e.getMessage(), e);
        }
    }

    @Override
    public PrivateKey getPrivateKey() {
        return privateKey;
    }

    public X509Certificate getCertificate() {
        return certificate;
    }

    public byte[] getCertBytes() {
        try {
            return certificate != null ? certificate.getEncoded() : null;
        } catch (Exception e) {
            return null;
        }
    }

    public String getCertBytesBase64() {
        byte[] bytes = getCertBytes();
        return bytes != null ? Base64.getEncoder().encodeToString(bytes) : null;
    }

    @Override
    public SSLSocketFactory getSSLSocketFactory() {
        try {
            KeyStore ks = KeyStore.getInstance("PKCS12");
            ks.setKeyEntry("cert", privateKey, "".toCharArray(), new java.security.cert.Certificate[]{certificate});

            KeyManagerFactory kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
            kmf.init(ks, "".toCharArray());

            TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            tmf.init((KeyStore) null);

            SSLContext ctx = SSLContext.getInstance("TLS");
            ctx.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);
            return ctx.getSocketFactory();
        } catch (Exception e) {
            throw new SprException("Erro ao criar SSLSocketFactory: " + e.getMessage(), e);
        }
    }
}
