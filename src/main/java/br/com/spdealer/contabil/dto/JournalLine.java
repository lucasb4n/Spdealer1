package br.com.spdealer.contabil.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class JournalLine {
    private Long id;
    private String accountCode;
    private BigDecimal amount;
    private String dcFlag; // 'D' or 'C'
    private String documentRef;
    private List<Rateio> rateios = new ArrayList<>();

    public JournalLine() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAccountCode() { return accountCode; }
    public void setAccountCode(String accountCode) { this.accountCode = accountCode; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDcFlag() { return dcFlag; }
    public void setDcFlag(String dcFlag) { this.dcFlag = dcFlag; }
    public String getDocumentRef() { return documentRef; }
    public void setDocumentRef(String documentRef) { this.documentRef = documentRef; }
    public List<Rateio> getRateios() { return rateios; }
    public void setRateios(List<Rateio> rateios) { this.rateios = rateios; }

    public void addRateio(Rateio r) { this.rateios.add(r); }
}
