package br.com.spdealer.nfe.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class SefazWebServiceTest {

    @Test
    public void testConsultarDistribuicao_Homologacao_Listagem() {
        SefazWebService service = new SefazWebService(null, null);
        
        // Simular requisição de listagem (sem tag <chNFe>)
        String soapRequest = "<nfeDistDFeInteresse><infDistDFe><tpAmb>2</tpAmb></infDistDFe></nfeDistDFeInteresse>";
        String response = service.consultarDistribuicao(soapRequest, "D");
        
        assertNotNull(response);
        assertTrue(response.contains("retDistDFeInt"));
        assertTrue(response.contains("35260712345678000199550010000000011001234567"));
        assertTrue(response.contains("35260712345678000199550010000000021001234568"));
        assertTrue(response.contains("35260712345678000199550010000000031001234569"));
    }

    @Test
    public void testConsultarDistribuicao_Homologacao_Download() {
        SefazWebService service = new SefazWebService(null, null);
        
        // Simular requisição de download (com tag <chNFe>)
        String chave = "35260712345678000199550010000000011001234567";
        String soapRequest = "<nfeDistDFeInteresse><infDistDFe><chNFe>" + chave + "</chNFe></infDistDFe></nfeDistDFeInteresse>";
        String response = service.consultarDistribuicao(soapRequest, "2"); // "2" deve ser mapeado para Homologação (D)
        
        assertNotNull(response);
        assertTrue(response.contains("retDistDFeInt"));
        assertTrue(response.contains("procNFe_v4.00.xsd"));
        
        // A resposta deve conter o XML da NFe escapado dentro da tag nfeProc
        assertTrue(response.contains("&lt;nfeProc versao=&quot;4.00&quot;"));
        assertTrue(response.contains("Id=&quot;NFe" + chave + "&quot;"));
        
        // Assertions for Tax Reform and Split Payment tags
        assertTrue(response.contains("&lt;vBCIBS&gt;380.00&lt;/vBCIBS&gt;"));
        assertTrue(response.contains("&lt;vIBS&gt;76.00&lt;/vIBS&gt;"));
        assertTrue(response.contains("&lt;vBCCBS&gt;380.00&lt;/vBCCBS&gt;"));
        assertTrue(response.contains("&lt;vCBS&gt;38.00&lt;/vCBS&gt;"));
        assertTrue(response.contains("&lt;indSplit&gt;1&lt;/indSplit&gt;"));
        assertTrue(response.contains("&lt;IBS&gt;"));
        assertTrue(response.contains("&lt;CBS&gt;"));
    }
}
