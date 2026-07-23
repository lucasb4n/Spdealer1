package br.com.spdealer.config;

import net.sf.jasperreports.engine.JasperCompileManager;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

@Slf4j
// @Component  // Desabilitado - usará compilação em tempo de execução do RelatorioFinanceiroService
public class JasperReportsBootInitializer implements CommandLineRunner {

    private final ResourceLoader resourceLoader;

    public JasperReportsBootInitializer(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("🔧 Inicializando compilação de relatórios Jasper...");
        
        try {
            compileReports("classpath:reports");
            log.info("✅ Relatórios compilados com sucesso!");
        } catch (IOException e) {
            log.warn("⚠️  Erro ao compilar relatórios: {}", e.getMessage());
        }
    }

    private void compileReports(String resourcePath) throws IOException {
        Resource resource = resourceLoader.getResource(resourcePath);
        
        if (resource.exists() && resource.getFile().isDirectory()) {
            File reportsDir = resource.getFile();
            
            String baseSourcePath = reportsDir.getAbsolutePath();
            File targetDir = new File("target/classes/reports");
            
            if (!targetDir.exists()) {
                targetDir.mkdirs();
            }
            
            compileDirectoryRecursive(reportsDir, baseSourcePath, targetDir);
        }
    }

    private void compileDirectoryRecursive(File directory, String baseSourcePath, File targetDir) {
        File[] files = directory.listFiles();
        
        if (files == null) return;
        
        for (File file : files) {
            if (file.isDirectory()) {
                File subTarget = new File(targetDir, file.getName());
                subTarget.mkdirs();
                compileDirectoryRecursive(file, baseSourcePath, subTarget);
            } else if (file.getName().endsWith(".jrxml")) {
                compileSingleReport(file, baseSourcePath, targetDir);
            }
        }
    }

    private void compileSingleReport(File jrxmlFile, String baseSourcePath, File targetDir) {
        try {
            String relativePath = jrxmlFile.getAbsolutePath().replace(baseSourcePath, "").replace("\\", "/");
            if (relativePath.startsWith("/")) {
                relativePath = relativePath.substring(1);
            }
            
            File outputFile = new File(targetDir, jrxmlFile.getName().replace(".jrxml", ".jasper"));
            
            if (outputFile.exists() && outputFile.lastModified() > jrxmlFile.lastModified()) {
                return;
            }
            
            JasperCompileManager.compileReportToFile(jrxmlFile.getAbsolutePath(), outputFile.getAbsolutePath());
            log.info("✓ Compilado: {}", relativePath);
        } catch (Exception e) {
            log.warn("⚠️  Falha ao compilar {}: {}", jrxmlFile.getName(), e.getMessage());
        }
    }
}
