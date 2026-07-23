package br.com.spdealer.utils;

import net.sf.jasperreports.engine.JasperCompileManager;

public class JasperReportCompiler {
    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("Usage: java JasperReportCompiler <source.jrxml> <dest.jasper>");
            System.exit(1);
        }
        
        String sourceFile = args[0];
        String destFile = args[1];
        
        try {
            System.out.println("📋 Compilando: " + sourceFile);
            JasperCompileManager.compileReportToFile(sourceFile, destFile);
            System.out.println("✅ Sucesso: " + destFile);
        } catch (Exception e) {
            System.err.println("❌ Erro: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
