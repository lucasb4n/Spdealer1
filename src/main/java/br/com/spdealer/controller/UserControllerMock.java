package br.com.spdealer.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserControllerMock {
    @GetMapping("/{id}/dashboard-config")
    public Map<String, Object> getDashboardConfig(@PathVariable Long id) {
        Map<String, Object> layout = new HashMap<>();
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        List<Map<String, Object>> columns = new ArrayList<>();
        Map<String, Object> col1 = new HashMap<>();
        col1.put("widgetId", "kpi1");
        col1.put("width", 6);
        Map<String, Object> col2 = new HashMap<>();
        col2.put("widgetId", "chart1");
        col2.put("width", 6);
        columns.add(col1);
        columns.add(col2);
        row.put("columns", columns);
        rows.add(row);
        layout.put("rows", rows);

        Map<String, Object> widgets = new HashMap<>();
        Map<String, Object> kpi1 = new HashMap<>();
        kpi1.put("type", "kpi");
        kpi1.put("title", "Total Clientes");
        kpi1.put("value", 123);
        widgets.put("kpi1", kpi1);
        Map<String, Object> chart1 = new HashMap<>();
        chart1.put("type", "chart");
        chart1.put("title", "Vendas Mensais");
        chart1.put("chartType", "bar");
        chart1.put("sqlQuery", "SELECT mes, valor FROM vendas_mensais");
        widgets.put("chart1", chart1);

        Map<String, Object> result = new HashMap<>();
        result.put("layout", layout);
        result.put("widgets", widgets);
        return result;
    }
}
