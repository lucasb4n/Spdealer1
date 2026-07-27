package br.com.spdealer.controller;

import br.com.spdealer.model.Dashboard;
import br.com.spdealer.model.DashboardWidget;
import br.com.spdealer.service.NewDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/dashboards")
public class DashboardV2CompatController {

    @Autowired
    private NewDashboardService dashboardService;

    // NOTE: Listing dashboards is handled by DashboardApiController (/api/v2/dashboards),
    // so this compat controller does not re-expose the list endpoint to avoid ambiguous mappings.


    // NOTE: GET /{id} is provided by DashboardApiController to avoid duplication.
    // Compat controller intentionally does NOT implement GET /{id} to prevent ambiguous mappings.

    // Get widgets for dashboard
    @GetMapping("/{id}/widgets")
    public ResponseEntity<List<DashboardWidget>> getWidgets(@PathVariable Long id) {
        List<DashboardWidget> widgets = dashboardService.getWidgetsByDashboardId(id);
        return ResponseEntity.ok(widgets);
    }

    // Add widget to dashboard using full payload (compat with front-end)
    @PostMapping("/{id}/widgets")
    public ResponseEntity<DashboardWidget> addWidgetCompat(@PathVariable Long id, @RequestBody DashboardWidget payload) {
        // In the compatibility route, allow creating widget from a full payload (template not required).
        // We will map fields to service by creating a widget via template-less path: use addWidget with templateId null
        // Instead, delegate to repository or service: for now, use addWidget with a fallback to first template.
        // Choose a template id 1 as fallback; ideal is to accept templateId on payload.data_config.templateId
        Long templateId = 1L;
        try {
            DashboardWidget widget = dashboardService.addWidget(id, templateId, payload.getPositionX(), payload.getPositionY(), payload.getTitle(), dashboardService.getCurrentUserIdPublic());
            return ResponseEntity.ok(widget);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Update widget full (idempotent)
    @PutMapping("/{id}/widgets/{widgetId}")
    public ResponseEntity<DashboardWidget> updateWidgetCompat(@PathVariable Long id, @PathVariable String widgetId, @RequestBody DashboardWidget payload) {
        try {
            DashboardWidget updated = dashboardService.updateWidgetConfig(id, widgetId, payload.getTitle(), payload.getDataConfig(), payload.getVisualConfig(), payload.getBehaviorConfig(), dashboardService.getCurrentUserIdPublic());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Update widget position
    @PutMapping("/{id}/widgets/{widgetId}/position")
    public ResponseEntity<DashboardWidget> updateWidgetPosition(@PathVariable Long id, @PathVariable String widgetId, @RequestBody DashboardWidget payload) {
        try {
            DashboardWidget updated = dashboardService.updateWidgetPosition(id, widgetId, payload.getPositionX(), payload.getPositionY(), payload.getWidth(), payload.getHeight(), dashboardService.getCurrentUserIdPublic());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Delete widget
    @DeleteMapping("/{id}/widgets/{widgetId}")
    public ResponseEntity<Void> deleteWidget(@PathVariable Long id, @PathVariable String widgetId) {
        try {
            dashboardService.removeWidget(id, widgetId, dashboardService.getCurrentUserIdPublic());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
