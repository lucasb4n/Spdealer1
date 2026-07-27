package br.com.spdealer.contabil.repository;

import br.com.spdealer.contabil.dto.JournalEntry;
import br.com.spdealer.contabil.dto.JournalLine;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Repository
public class JournalRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public JournalRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Persiste um JournalEntry e suas JournalLines.
     * Observação: assume existência de tabelas `journal_entry` e `journal_line`.
     */
    @Transactional
    public void saveJournalEntry(JournalEntry entry) {
        String insertEntry = "INSERT INTO journal_entry (date, branch_code, source_module, created_at) VALUES (:date, :branch, :source, :created)";
        MapSqlParameterSource p = new MapSqlParameterSource()
                .addValue("date", entry.getDate())
                .addValue("branch", entry.getBranchCode())
                .addValue("source", entry.getSourceModule())
                .addValue("created", Timestamp.valueOf(LocalDateTime.now()));
        jdbc.update(insertEntry, p);

        // Nota: para POC não recuperamos o ID do insert; em implementação real usar KeyHolder / SimpleJdbcInsert
        for (JournalLine l : entry.getLines()) {
            String insertLine = "INSERT INTO journal_line (entry_id, account_code, dc_flag, amount, document_ref) VALUES (LAST_INSERT_ID(), :acct, :dc, :amt, :doc)";
            MapSqlParameterSource pl = new MapSqlParameterSource()
                    .addValue("acct", l.getAccountCode())
                    .addValue("dc", l.getDcFlag())
                    .addValue("amt", l.getAmount())
                    .addValue("doc", l.getDocumentRef());
            jdbc.update(insertLine, pl);
        }
    }
}
