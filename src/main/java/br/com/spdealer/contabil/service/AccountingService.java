package br.com.spdealer.contabil.service;

import br.com.spdealer.contabil.dto.JournalEntry;
import br.com.spdealer.contabil.dto.JournalLine;
import br.com.spdealer.contabil.repository.CaixaJdbcRepository;
import br.com.spdealer.contabil.repository.JournalRepository;
import br.com.spdealer.contabil.repository.PagarRepository;
import br.com.spdealer.contabil.repository.ReceberRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AccountingService {

    private final ReceberRepository receberRepo;
    private final PagarRepository pagarRepo;
    private final CaixaJdbcRepository caixaRepo;
    private final JournalRepository journalRepo;

    public AccountingService(ReceberRepository receberRepo,
                             PagarRepository pagarRepo,
                             CaixaJdbcRepository caixaRepo,
                             JournalRepository journalRepo) {
        this.receberRepo = receberRepo;
        this.pagarRepo = pagarRepo;
        this.caixaRepo = caixaRepo;
        this.journalRepo = journalRepo;
    }

    /**
     * Processa lançamentos para um período e filial, gerando e persistindo JournalEntry.
     * Implementação POC: cria um JournalEntry por fonte com linhas simples.
     */
    public List<JournalEntry> processPeriod(int filial, LocalDate from, LocalDate to) {
        List<JournalEntry> result = new ArrayList<>();

        List<Map<String, Object>> recs = receberRepo.findByPeriodAndFilial(from, to, filial);
        JournalEntry recEntry = buildFromSource("receber", recs, String.format("%03d", filial));
        if (!recEntry.getLines().isEmpty()) {
            journalRepo.saveJournalEntry(recEntry);
            result.add(recEntry);
        }

        List<Map<String, Object>> pags = pagarRepo.findByPeriodAndFilial(from, to, filial);
        JournalEntry pagEntry = buildFromSource("pagar", pags, String.format("%03d", filial));
        if (!pagEntry.getLines().isEmpty()) {
            journalRepo.saveJournalEntry(pagEntry);
            result.add(pagEntry);
        }

        List<Map<String, Object>> cais = caixaRepo.findMovementsByPeriodAndFilial(from, to, filial);
        JournalEntry caiEntry = buildFromSource("caixa", cais, String.format("%03d", filial));
        if (!caiEntry.getLines().isEmpty()) {
            journalRepo.saveJournalEntry(caiEntry);
            result.add(caiEntry);
        }

        return result;
    }

    private JournalEntry buildFromSource(String source, List<Map<String, Object>> rows, String branch) {
        JournalEntry entry = new JournalEntry();
        entry.setSourceModule(source);
        entry.setBranchCode(branch);
        for (Map<String, Object> r : rows) {
            JournalLine line = new JournalLine();
            // POC: tenta mapear colunas comuns; ajustes necessários com schema real
            if (r.containsKey("cliente_rec")) line.setDocumentRef(String.valueOf(r.get("cliente_rec")));
            if (r.containsKey("valor_rec")) {
                try { line.setAmount(new java.math.BigDecimal(String.valueOf(r.get("valor_rec")))); } catch (Exception e) {}
            }
            // determinar dcFlag a partir de colunas conhecidas (POC: default 'D')
            line.setDcFlag("D");
            entry.addLine(line);
        }
        return entry;
    }
}
