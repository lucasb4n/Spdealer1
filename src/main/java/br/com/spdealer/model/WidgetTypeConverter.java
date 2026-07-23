package br.com.spdealer.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class WidgetTypeConverter implements AttributeConverter<DashboardWidget.WidgetType, String> {

    @Override
    public String convertToDatabaseColumn(DashboardWidget.WidgetType widgetType) {
        if (widgetType == null) {
            return null;
        }
        return widgetType.getValue();
    }

    @Override
    public DashboardWidget.WidgetType convertToEntityAttribute(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        
        try {
            return DashboardWidget.WidgetType.fromValue(value);
        } catch (IllegalArgumentException e) {
            // Loga e retorna null ao invés de explodir a requisição inteira
            System.err.println("Invalid widget type value: " + value + ", returning null");
            return null;
        }
    }
}