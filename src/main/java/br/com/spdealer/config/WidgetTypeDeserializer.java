package br.com.spdealer.config;

import br.com.spdealer.model.DashboardWidget;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;

public class WidgetTypeDeserializer extends JsonDeserializer<DashboardWidget.WidgetType> {

    @Override
    public DashboardWidget.WidgetType deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();
        
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        try {
            return DashboardWidget.WidgetType.fromValue(value);
        } catch (IllegalArgumentException e) {
            throw new IOException("Invalid widget type: " + value + ". Valid values are: KPI, CHART, LIST, AGGRID, CHAT, TEXT, IMAGE, CONTAINER", e);
        }
    }
}
