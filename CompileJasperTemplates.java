import net.sf.jasperreports.engine.JasperCompileManager;
import java.io.File;

public class CompileJasperTemplates {
    public static void main(String[] args) throws Exception {
        String[] templates = {
            "src/main/resources/reports/ContasReceberReport.jrxml",
            "src/main/resources/reports/ContasPagarReport.jrxml",
            "src/main/resources/reports/FluxoCaixaReport.jrxml"
        };
        
        for (String template : templates) {
            File file = new File(template);
            if (file.exists()) {
                String outputPath = template.replace(".jrxml", ".jasper");
                System.out.println("Compilando: " + template + " -> " + outputPath);
                JasperCompileManager.compileReportToFile(template, outputPath);
                System.out.println("✅ Compilado com sucesso: " + outputPath);
            } else {
                System.out.println("❌ Arquivo nao encontrado: " + template);
            }
        }
    }
}
