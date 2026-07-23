import net.sf.jasperreports.engine.JasperCompileManager;
import java.io.File;

public class CompileJasperReports {
    public static void main(String[] args) throws Exception {
        String sourcePath = "src/main/resources/reports";
        String targetPath = "src/main/resources/reports";
        
        File sourceDir = new File(sourcePath);
        if (!sourceDir.exists()) {
            System.err.println("Source directory not found: " + sourcePath);
            System.exit(1);
        }
        
        // Compilar todos os arquivos .jrxml
        File[] jrxmlFiles = sourceDir.listFiles((dir, name) -> name.endsWith(".jrxml"));
        
        if (jrxmlFiles == null || jrxmlFiles.length == 0) {
            System.out.println("No JRXML files found in " + sourcePath);
            System.exit(0);
        }
        
        int count = 0;
        for (File jrxmlFile : jrxmlFiles) {
            String inputPath = jrxmlFile.getAbsolutePath();
            String outputPath = inputPath.replace(".jrxml", ".jasper");
            
            try {
                JasperCompileManager.compileReportToFile(inputPath, outputPath);
                System.out.println("✓ Compiled: " + jrxmlFile.getName() + " -> " + new File(outputPath).getName());
                count++;
            } catch (Exception e) {
                System.err.println("✗ Failed to compile " + jrxmlFile.getName() + ": " + e.getMessage());
            }
        }
        
        // Compilar arquivos em subdiretorios
        compileDirRecursive(sourceDir, targetPath);
        
        System.out.println("\nTotal compiled: " + count);
    }
    
    static void compileDirRecursive(File dir, String targetPath) throws Exception {
        File[] subdirs = dir.listFiles(File::isDirectory);
        if (subdirs != null) {
            for (File subdir : subdirs) {
                File[] jrxmlFiles = subdir.listFiles((d, name) -> name.endsWith(".jrxml"));
                if (jrxmlFiles != null) {
                    for (File jrxmlFile : jrxmlFiles) {
                        String inputPath = jrxmlFile.getAbsolutePath();
                        String outputPath = inputPath.replace(".jrxml", ".jasper");
                        
                        try {
                            JasperCompileManager.compileReportToFile(inputPath, outputPath);
                            System.out.println("✓ Compiled: " + subdir.getName() + "/" + jrxmlFile.getName());
                        } catch (Exception e) {
                            System.err.println("✗ Failed to compile " + jrxmlFile.getName() + ": " + e.getMessage());
                        }
                    }
                }
                compileDirRecursive(subdir, targetPath);
            }
        }
    }
}
