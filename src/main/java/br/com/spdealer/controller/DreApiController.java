package br.com.spdealer.controller;

import br.com.spdealer.service.DreService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v2/dre")
@RequiredArgsConstructor
public class DreApiController {

    private static final Logger logger = LoggerFactory.getLogger(DreApiController.class);

    private final DreService dreService;

    private final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @GetMapping("/data")
    public ResponseEntity<?> getData(
            @RequestParam(name = "start", required = false) String startStr,
            @RequestParam(name = "end", required = false) String endStr,
            @RequestParam(name = "pivot", required = false, defaultValue = "false") boolean pivot
    ) {
        // Default: last 12 months
        LocalDate now = LocalDate.now();
        LocalDate end = now.withDayOfMonth(1);
        LocalDate start = end.minusMonths(11);

        try {
            if (startStr != null && !startStr.isBlank()) {
                start = parseToFirstOfMonth(startStr);
            }
            if (endStr != null && !endStr.isBlank()) {
                end = parseToFirstOfMonth(endStr);
            }
        } catch (Exception ex) {
            logger.warn("[DreApiController] invalid date param", ex);
            Map<String,Object> err = new HashMap<>();
            err.put("error","Invalid start or end date. Use yyyy-MM or yyyy-MM-dd");
            return ResponseEntity.badRequest().body(err);
        }

        if (pivot) {
            Map<String,Object> payload = dreService.getPivot(start, end);
            return ResponseEntity.ok(payload);
        } else {
            return ResponseEntity.ok(dreService.getRows(start, end));
        }
    }

    private LocalDate parseToFirstOfMonth(String s) {
        // Accept yyyy-MM or yyyy-MM-dd
        if (s.length() == 7) { // yyyy-MM
            return LocalDate.parse(s + "-01", DF);
        }
        return LocalDate.parse(s, DF).withDayOfMonth(1);
    }
}
