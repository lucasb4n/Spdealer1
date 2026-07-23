# Script para compilar relatórios Jasper (.jrxml -> .jasper)
# Usa Java e Jasper Reports para compilação

$jasperDir = "src/main/resources/reports"
$targetDir = "target/classes/reports"

# Criar diretório de destino se não existir
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Copiar arquivo .jrxml antes de compilar (JasperCompiler precisa de ambos)
Write-Host "🔧 Compilando relatórios Jasper..." -ForegroundColor Cyan

# Usar Java para compilar
$javaCmd = @"
import net.sf.jasperreports.engine.JasperCompileManager;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;

public class JasperCompiler {
    public static void main(String[] args) throws Exception {
        String sourceDir = "$jasperDir";
        String targetDir = "$targetDir";
        
        File source = new File(sourceDir);
        File target = new File(targetDir);
        
        if (!source.exists()) {
            System.out.println("❌ Source directory not found: " + sourceDir);
            System.exit(1);
        }
        
        if (!target.exists()) {
            target.mkdirs();
        }
        
        compileRecursive(source, target);
    }
    
    static void compileRecursive(File sourceDir, File targetDir) throws Exception {
        File[] files = sourceDir.listFiles();
        
        if (files == null) return;
        
        for (File f : files) {
            if (f.isDirectory()) {
                File subTarget = new File(targetDir, f.getName());
                subTarget.mkdirs();
                compileRecursive(f, subTarget);
            } else if (f.getName().endsWith(".jrxml")) {
                String outputPath = new File(targetDir, f.getName().replace(".jrxml", ".jasper")).getAbsolutePath();
                try {
                    JasperCompileManager.compileReportToFile(f.getAbsolutePath(), outputPath);
                    System.out.println("✓ " + f.getName());
                } catch (Exception e) {
                    System.err.println("✗ " + f.getName() + ": " + e.getMessage());
                }
            }
        }
    }
}
"@

# Salvar classe temp
Set-Content -Path "JasperCompiler.java" -Value $javaCmd -Encoding UTF8

# Compilar classe
$javac = "C:\Program Files\Java\jdk-17\bin\javac.exe"
if (Test-Path $javac) {
    & $javac -cp "target/classes" JasperCompiler.java 2>&1 | Out-Null
    
    # Executar
    $java = "C:\Program Files\Java\jdk-17\bin\java.exe"
    & $java -cp ".:target/classes" JasperCompiler
    
    # Limpar
    Remove-Item JasperCompiler.java -Force 2>$null
    Remove-Item JasperCompiler.class -Force 2>$null
} else {
    Write-Host "❌ JDK não encontrado em $javac" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilação concluída!" -ForegroundColor Green
