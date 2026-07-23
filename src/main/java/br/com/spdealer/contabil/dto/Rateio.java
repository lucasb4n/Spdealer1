package br.com.spdealer.contabil.dto;

import java.math.BigDecimal;

public class Rateio {
    private String costCenter;
    private BigDecimal percent;
    private BigDecimal amount;

    public Rateio() {}

    public String getCostCenter() { return costCenter; }
    public void setCostCenter(String costCenter) { this.costCenter = costCenter; }
    public BigDecimal getPercent() { return percent; }
    public void setPercent(BigDecimal percent) { this.percent = percent; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
