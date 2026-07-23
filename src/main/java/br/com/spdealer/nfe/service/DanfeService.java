package br.com.spdealer.nfe.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Serviço para geração do DANFE (Documento Auxiliar da Nota Fiscal Eletrônica)
 * 
 * Este é um stub - a implementação completa será feita posteriormente
 * requer configuração adicional do PDFBox 3.x para manipulação de fontes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DanfeService {

    private final NfeXmlService nfeXmlService;

    /**
     * Gera o DANFE em PDF
     * 
     * @param filial  Código da filial
     * @param emissao Data de emissão no formato DDMMAAAA
     * @param tipo    Tipo da nota (E=Entrada, S=Saída)
     * @param serie   Série da nota
     * @param numero  Número da nota
     * @return PDF do DANFE
     */
    public byte[] gerarDanfePdf(Integer filial, Integer emissao, String tipo, String serie, Integer numero) {
        log.info("Gerando DANFE PDF: filial={}, emissao={}, tipo={}, serie={}, numero={}",
                filial, emissao, tipo, serie, numero);
        
        try {
            // Gera o XML da NF-e primeiro
            String xml = nfeXmlService.gerarXmlNfe(filial, emissao, tipo, serie, numero);
            
            // Stub: retorna uma mensagem em bytes indicando que o DANFE está em desenvolvimento
            String mensagem = "DANFE em desenvolvimento.\n\n" +
                "Nota: " + numero + "\n" +
                "Serie: " + serie + "\n" +
                "Emissao: " + emissao + "\n" +
                "Tipo: " + tipo + "\n\n" +
                "XML gerado com sucesso. Tamanho: " + xml.length() + " bytes\n" +
                "A implementacao completa do PDF sera disponibilizada em breve.";
            
            return mensagem.getBytes("UTF-8");
            
        } catch (Exception e) {
            log.error("Erro ao gerar DANFE", e);
            throw new RuntimeException("Erro ao gerar DANFE: " + e.getMessage(), e);
        }
    }
}
