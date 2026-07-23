package br.com.spdealer.service;

import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.springframework.beans.factory.annotation.Autowired;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class HtmlPdfReportService {

    @Autowired
    private SpringTemplateEngine templateEngine;

    public byte[] generatePdfFromTemplate(String templatePath, Map<String, Object> model) throws Exception {
        Context ctx = new Context();
        if (model != null) ctx.setVariables(model);

        // Ensure content template name (strip extension if provided)
        String contentTemplate = templatePath == null ? "" : templatePath;
        if (contentTemplate.endsWith(".html")) {
            contentTemplate = contentTemplate.substring(0, contentTemplate.length() - 5);
        }
        if (contentTemplate.startsWith("/")) contentTemplate = contentTemplate.substring(1);
        if (contentTemplate.startsWith("reports/")) contentTemplate = contentTemplate.substring("reports/".length());

        // expose content template name to the layout
        ctx.setVariable("contentTemplate", contentTemplate);

        // Render HTML via Thymeleaf using the standard wrapper layout
        String html = templateEngine.process("reports/standard_layout", ctx);

        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        }
    }
}
