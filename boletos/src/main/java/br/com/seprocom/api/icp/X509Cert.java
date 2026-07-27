package br.com.seprocom.api.icp;

import java.io.ByteArrayInputStream;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.PrivateKey;
import java.util.Base64;
import javax.net.ssl.SSLSocketFactory;

public class X509Cert {

    protected X509Certificate certificate;
    protected String subjectName;
    protected String issuerName;

    public X509Cert() {}

    public X509Cert(X509Certificate certificate) {
        this.certificate = certificate;
        loadCertificateInfos();
    }

    public X509Cert(byte[] certBytes) throws Exception {
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        this.certificate = (X509Certificate) cf.generateCertificate(new ByteArrayInputStream(certBytes));
        loadCertificateInfos();
    }

    protected void loadCertificateInfos() {
        if (certificate != null) {
            this.subjectName = certificate.getSubjectX500Principal().getName();
            this.issuerName = certificate.getIssuerX500Principal().getName();
        }
    }

    public String getSubject() {
        return subjectName;
    }

    public String getIssuer() {
        return issuerName;
    }

    public java.util.Date getNotBefore() {
        return certificate != null ? certificate.getNotBefore() : null;
    }

    public java.util.Date getNotAfter() {
        return certificate != null ? certificate.getNotAfter() : null;
    }

    public boolean isValid() {
        try {
            if (certificate == null) return false;
            certificate.checkValidity();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isValid(java.util.Date d) {
        try {
            if (certificate == null) return false;
            certificate.checkValidity(d);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public byte[] getEncoded() {
        try {
            return certificate != null ? certificate.getEncoded() : null;
        } catch (Exception e) {
            return null;
        }
    }

    public String getEncodedBase64() {
        byte[] encoded = getEncoded();
        return encoded != null ? Base64.getEncoder().encodeToString(encoded) : null;
    }

    public PrivateKey getPrivateKey() {
        return null;
    }

    public String getKeyString() {
        return null;
    }

    public SSLSocketFactory getSSLSocketFactory() {
        return null;
    }
}
