package br.com.spdealer.contabil.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class JournalEntry {
    private Long id;
    private LocalDate date;
    private String branchCode;
    private String sourceModule;
    private List<JournalLine> lines = new ArrayList<>();

    public JournalEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getBranchCode() { return branchCode; }
    public void setBranchCode(String branchCode) { this.branchCode = branchCode; }
    public String getSourceModule() { return sourceModule; }
    public void setSourceModule(String sourceModule) { this.sourceModule = sourceModule; }
    public List<JournalLine> getLines() { return lines; }
    public void setLines(List<JournalLine> lines) { this.lines = lines; }

    public void addLine(JournalLine line) { this.lines.add(line); }

    public BigDecimal totalDebit() {
        return lines.stream()
                .filter(l -> "D".equalsIgnoreCase(l.getDcFlag()))
                .map(JournalLine::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal totalCredit() {
        return lines.stream()
                .filter(l -> "C".equalsIgnoreCase(l.getDcFlag()))
                .map(JournalLine::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
